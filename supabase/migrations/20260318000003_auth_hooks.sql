-- ═══════════════════════════════════════════════════════════════════════════════
-- 發財B平台 - Auth Hooks (Supabase Auth 事件處理)
-- 檔案: supabase/migrations/20260318000003_auth_hooks.sql
-- 版本: 1.1.0
-- 建立日期: 2026-03-18
-- 最後修訂: 2026-03-19
-- 
-- 功能說明:
--   1. 新用戶註冊時自動設定預設角色 (user = 一般車行會員)
--   2. 同步建立 public.users 記錄
--   3. 提供 Admin 修改用戶角色的函數
--   4. Custom Access Token Hook 將 role 注入 JWT
--
-- 相依性:
--   - 必須先執行 20260318000001_init_schema.sql (建立 public.users 表)
--   - 必須先執行 20260318000002_enable_rls.sql (RLS 政策)
--
-- 設定步驟:
--   1. 執行此 Migration
--   2. 在 Supabase Dashboard > Authentication > Hooks 中設定：
--      - Hook Type: Custom Access Token
--      - Schema: public
--      - Function: custom_access_token_hook
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: 輔助函數 - 取得用戶角色
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: get_user_role
-- 說明: 從 auth.users 的 raw_app_meta_data 取得指定用戶的角色
-- 用途: 統一角色取得邏輯，供其他函數使用
-- 回傳: 'user' | 'admin'，預設為 'user'
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- 參數驗證
  IF target_user_id IS NULL THEN
    RETURN 'user';
  END IF;

  -- 從 auth.users 取得角色
  SELECT COALESCE(raw_app_meta_data->>'role', 'user')
  INTO user_role
  FROM auth.users
  WHERE id = target_user_id;
  
  -- 若找不到用戶，回傳預設角色
  IF user_role IS NULL THEN
    RETURN 'user';
  END IF;
  
  RETURN user_role;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 發生錯誤時回傳預設角色，不阻斷流程
    RAISE WARNING '[get_user_role] Error getting role for user %: %', target_user_id, SQLERRM;
    RETURN 'user';
END;
$$;

-- 授權認證用戶可執行
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_role(UUID) IS 
  '取得指定用戶的角色。預設角色為 user (一般車行會員)。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: 輔助函數 - 取得當前用戶角色
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: get_current_user_role
-- 說明: 取得當前登入用戶的角色
-- 用途: 前端呼叫確認自身角色、RLS 政策使用
-- 回傳: 'user' | 'admin' | NULL (未登入)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 未登入時回傳 NULL
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 優先從 JWT 取得（效能較佳）
  -- 若 JWT 無 role claim，則從資料庫取得
  RETURN COALESCE(
    auth.jwt()->>'role',
    public.get_user_role(auth.uid())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

COMMENT ON FUNCTION public.get_current_user_role() IS 
  '取得當前登入用戶的角色。未登入時回傳 NULL。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: 輔助函數 - Admin 權限檢查
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: is_admin
-- 說明: 檢查當前用戶是否為 Admin
-- 用途: RLS 政策與權限檢查
-- 回傳: BOOLEAN
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(public.get_current_user_role() = 'admin', FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS 
  '檢查當前用戶是否為 Admin。未登入或非 Admin 回傳 FALSE。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: 核心函數 - 新用戶註冊處理
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: handle_new_user
-- 說明: 當新用戶透過 Supabase Auth 註冊時：
--       1. 設定 raw_app_meta_data.role = 'user' (預設角色為一般車行會員)
--       2. 在 public.users 表建立對應記錄
--
-- 觸發時機: auth.users AFTER INSERT
-- 安全性: SECURITY DEFINER 以系統權限執行
--
-- 錯誤處理策略:
--   - 用戶已存在: 記錄警告但不中斷
--   - 其他錯誤: 記錄警告但不中斷，確保 Auth 註冊流程不受影響
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role CONSTANT TEXT := 'user';  -- 預設角色：一般車行會員
  user_name TEXT;
  user_phone TEXT;
  user_company TEXT;
  existing_role TEXT;
BEGIN
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 1: 設定預設角色到 raw_app_meta_data
  -- ═══════════════════════════════════════════════════════════════════════════
  
  -- 檢查是否已有角色設定（例如 Admin 建立用戶時可能已預設）
  existing_role := NEW.raw_app_meta_data->>'role';
  
  IF existing_role IS NULL OR existing_role = '' THEN
    -- 更新 auth.users 設定預設角色
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', default_role)
    WHERE id = NEW.id;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 2: 解析用戶註冊資訊
  -- ═══════════════════════════════════════════════════════════════════════════
  
  -- 從 raw_user_meta_data 取得註冊時傳入的 metadata
  -- 支援多種欄位名稱以提高相容性
  user_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    '未設定姓名'
  );
  
  user_phone := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone_number'), ''),
    ''
  );
  
  user_company := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company'), ''),
    '未設定車行名稱'
  );
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 3: 在 public.users 建立對應記錄
  -- ═══════════════════════════════════════════════════════════════════════════
  
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      phone,
      company_name,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      user_name,
      user_phone,
      user_company,
      'active',  -- 新用戶預設為 active 狀態
      NOW(),
      NOW()
    );
    
    -- 成功插入，記錄日誌
    RAISE NOTICE '[handle_new_user] Successfully created public.users record for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- 用戶已存在於 public.users（可能是重複觸發或手動建立）
      RAISE WARNING '[handle_new_user] User % already exists in public.users. Skipping insert.', NEW.id;
      
    WHEN not_null_violation THEN
      -- 必填欄位缺失
      RAISE WARNING '[handle_new_user] NOT NULL violation for user %. email=%, name=%, company=%', 
        NEW.id, NEW.email, user_name, user_company;
      -- 嘗試以最小資料再次插入
      BEGIN
        INSERT INTO public.users (id, email, name, phone, company_name, status)
        VALUES (NEW.id, COALESCE(NEW.email, 'unknown@email.com'), '未設定', '', '未設定', 'active');
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[handle_new_user] Fallback insert also failed: %', SQLERRM;
      END;
      
    WHEN OTHERS THEN
      -- 其他錯誤：記錄但不中斷 Auth 流程
      RAISE WARNING '[handle_new_user] Unexpected error for user %: SQLSTATE=% MESSAGE=%', 
        NEW.id, SQLSTATE, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
  '處理新用戶註冊：設定預設角色為 user (一般車行會員)，並同步建立 public.users 記錄。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: 建立觸發器綁定
-- ═══════════════════════════════════════════════════════════════════════════════

-- 先移除既有觸發器（若存在）以避免重複
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 建立觸發器：在 auth.users INSERT 後執行
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();



-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: Admin 角色管理函數
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: set_user_role
-- 說明: 允許 Admin 修改用戶角色
--
-- 參數:
--   - target_user_id: 目標用戶 ID (UUID)
--   - new_role: 新角色 ('user' | 'admin')
--
-- 回傳: BOOLEAN (是否成功)
--
-- 限制:
--   - 僅 Admin 可執行
--   - Admin 無法將自己降級為 user
--   - 角色值必須為 'user' 或 'admin'
--
-- 副作用:
--   - 自動記錄稽核日誌
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
  current_target_role TEXT;
  valid_roles CONSTANT TEXT[] := ARRAY['user', 'admin'];
BEGIN
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 1: 取得呼叫者資訊
  -- ═══════════════════════════════════════════════════════════════════════════
  
  caller_id := auth.uid();
  
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: You must be logged in to perform this action.';
  END IF;
  
  caller_role := public.get_user_role(caller_id);
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 2: 驗證權限 - 僅 Admin 可執行
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only admin can modify user roles. Your role: %', caller_role;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 3: 驗證參數
  -- ═══════════════════════════════════════════════════════════════════════════
  
  -- 驗證目標用戶 ID
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_PARAMETER: target_user_id cannot be null.';
  END IF;
  
  -- 驗證目標用戶存在
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'USER_NOT_FOUND: Target user % does not exist.', target_user_id;
  END IF;
  
  -- 驗證角色值
  IF new_role IS NULL OR TRIM(new_role) = '' THEN
    RAISE EXCEPTION 'INVALID_ROLE: Role cannot be null or empty.';
  END IF;
  
  new_role := LOWER(TRIM(new_role));
  
  IF NOT (new_role = ANY(valid_roles)) THEN
    RAISE EXCEPTION 'INVALID_ROLE: Role must be one of %. Got: %', valid_roles, new_role;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 4: 防止 Admin 自我降級
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF target_user_id = caller_id AND new_role = 'user' THEN
    RAISE EXCEPTION 'SELF_DEMOTION_PROHIBITED: Admin cannot demote themselves to user.';
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 5: 取得目標用戶當前角色（供稽核用）
  -- ═══════════════════════════════════════════════════════════════════════════
  
  current_target_role := public.get_user_role(target_user_id);
  
  -- 若角色相同則無需更新
  IF current_target_role = new_role THEN
    RAISE NOTICE '[set_user_role] User % already has role %. No change needed.', target_user_id, new_role;
    RETURN TRUE;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 6: 更新角色
  -- ═══════════════════════════════════════════════════════════════════════════
  
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE id = target_user_id;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Step 7: 記錄稽核日誌
  -- ═══════════════════════════════════════════════════════════════════════════
  
  INSERT INTO public.audit_logs (
    user_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    caller_id,
    CASE 
      WHEN new_role = 'admin' THEN 'USER_PROMOTED_TO_ADMIN'
      ELSE 'USER_DEMOTED_TO_USER'
    END,
    'user',
    target_user_id,
    jsonb_build_object(
      'previous_role', current_target_role,
      'new_role', new_role,
      'changed_by', caller_id,
      'changed_at', NOW()
    )
  );
  
  RAISE NOTICE '[set_user_role] Successfully changed user % role from % to %.', 
    target_user_id, current_target_role, new_role;
  
  RETURN TRUE;
  
EXCEPTION
  -- 重新拋出已知的業務邏輯異常
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'AUTH_REQUIRED:%' 
       OR SQLERRM LIKE 'PERMISSION_DENIED:%'
       OR SQLERRM LIKE 'INVALID_PARAMETER:%'
       OR SQLERRM LIKE 'USER_NOT_FOUND:%'
       OR SQLERRM LIKE 'INVALID_ROLE:%'
       OR SQLERRM LIKE 'SELF_DEMOTION_PROHIBITED:%' THEN
      RAISE;
    END IF;
    
    -- 其他未預期的錯誤
    RAISE EXCEPTION 'INTERNAL_ERROR: Failed to set user role. SQLSTATE=% MESSAGE=%', SQLSTATE, SQLERRM;
END;
$$;

-- 授權認證用戶可執行（函數內部會驗證 Admin 權限）
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.set_user_role(UUID, TEXT) IS 
  '允許 Admin 修改用戶角色。支援角色: user (一般車行會員), admin (管理員)。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: Custom Access Token Hook
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: custom_access_token_hook
-- 說明: Supabase Auth 在產生 JWT 時呼叫此函數，將 role 注入 JWT claims
--
-- 用途: 
--   - 讓前端可從 JWT 取得用戶角色
--   - 讓 RLS 政策可透過 auth.jwt()->>'role' 判斷權限
--
-- 設定步驟:
--   1. 前往 Supabase Dashboard
--   2. Authentication > Hooks
--   3. 新增 Hook:
--      - Hook Type: Custom Access Token
--      - Schema: public
--      - Function: custom_access_token_hook
--   4. 儲存並啟用
--
-- 輸入: event JSONB (包含 user_id 等資訊)
-- 輸出: 修改後的 event JSONB (包含注入的 claims)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  user_role TEXT;
  claims JSONB;
BEGIN
  -- 從 event 取得 user_id
  user_id := (event->>'user_id')::UUID;
  
  -- 若無法取得 user_id，回傳原始 event
  IF user_id IS NULL THEN
    RAISE WARNING '[custom_access_token_hook] No user_id in event, returning original event.';
    RETURN event;
  END IF;
  
  -- 取得用戶角色
  user_role := public.get_user_role(user_id);
  
  -- 建立自訂 claims
  claims := jsonb_build_object(
    'role', user_role,
    'https://facai-b.com/role', user_role  -- 加上命名空間版本以符合 JWT 最佳實踐
  );
  
  -- 將 claims 注入 event
  -- Supabase Auth 會將 claims 物件合併到 JWT payload
  event := jsonb_set(
    event, 
    '{claims}', 
    COALESCE(event->'claims', '{}'::jsonb) || claims
  );
  
  RETURN event;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Hook 失敗不應阻止 Auth 流程
    RAISE WARNING '[custom_access_token_hook] Error for user %: SQLSTATE=% MESSAGE=%', 
      user_id, SQLSTATE, SQLERRM;
    RETURN event;
END;
$$;

-- 授權 Supabase Auth 服務可執行此函數
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;

-- 同時授權 service_role 以便測試
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO service_role;

COMMENT ON FUNCTION public.custom_access_token_hook(JSONB) IS 
  'Supabase Auth JWT Hook：將用戶角色注入 JWT claims。需在 Dashboard > Authentication > Hooks 中設定啟用。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: 授權設定
-- ═══════════════════════════════════════════════════════════════════════════════

-- 確保所有必要的角色都有執行權限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 9: 測試 SQL（驗證用，部署後可手動執行）
-- ═══════════════════════════════════════════════════════════════════════════════

/*
═══════════════════════════════════════════════════════════════════════════════
🧪 測試案例 - 部署後請手動執行以驗證功能
═══════════════════════════════════════════════════════════════════════════════

--------------------------------------------------------------------------------
測試 1: 驗證觸發器存在
--------------------------------------------------------------------------------
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- 預期結果: 
-- trigger_name          | event_manipulation | action_timing | action_statement
-- on_auth_user_created  | INSERT             | AFTER         | EXECUTE FUNCTION ...

--------------------------------------------------------------------------------
測試 2: 驗證 get_user_role 函數
--------------------------------------------------------------------------------
-- 測試不存在的用戶（應回傳 'user'）
SELECT public.get_user_role('00000000-0000-0000-0000-000000000000');
-- 預期: 'user'

-- 測試 NULL 參數（應回傳 'user'）
SELECT public.get_user_role(NULL);
-- 預期: 'user'

--------------------------------------------------------------------------------
測試 3: 驗證 custom_access_token_hook 函數
--------------------------------------------------------------------------------
SELECT public.custom_access_token_hook(
  '{"user_id": "00000000-0000-0000-0000-000000000000"}'::jsonb
);
-- 預期: 回傳 JSONB，包含 claims.role = 'user'

--------------------------------------------------------------------------------
測試 4: 驗證 set_user_role 權限限制（以一般用戶身份）
--------------------------------------------------------------------------------
-- 注意: 此測試需要以一般用戶身份登入後執行
-- SELECT public.set_user_role('some-uuid', 'admin');
-- 預期: ERROR: PERMISSION_DENIED: Only admin can modify user roles.

--------------------------------------------------------------------------------
測試 5: 驗證 set_user_role 自我降級限制（以 Admin 身份）
--------------------------------------------------------------------------------
-- 注意: 此測試需要以 Admin 身份登入後執行
-- SELECT public.set_user_role(auth.uid(), 'user');
-- 預期: ERROR: SELF_DEMOTION_PROHIBITED: Admin cannot demote themselves to user.

--------------------------------------------------------------------------------
測試 6: 驗證新用戶註冊流程（整合測試）
--------------------------------------------------------------------------------
-- 步驟:
-- 1. 使用 Supabase Auth API 註冊新用戶，metadata 包含:
--    {
--      "name": "測試用戶",
--      "phone": "0912345678",
--      "company_name": "測試車行"
--    }
-- 2. 檢查 public.users 是否有對應記錄:
--    SELECT * FROM public.users WHERE email = '新用戶email';
-- 3. 檢查 auth.users 的 raw_app_meta_data 是否包含 role:
--    SELECT raw_app_meta_data FROM auth.users WHERE email = '新用戶email';
-- 4. 使用 jwt.io 解碼 access_token，確認 payload 包含 "role": "user"

═══════════════════════════════════════════════════════════════════════════════
📋 部署檢查清單
═══════════════════════════════════════════════════════════════════════════════

□ 1. 確認 Migration 執行成功，無錯誤訊息
□ 2. 在 Supabase Dashboard > Authentication > Hooks 中設定 Custom Access Token Hook:
     - Schema: public
     - Function: custom_access_token_hook
□ 3. 執行上述測試案例 1-6，確認全部通過
□ 4. 註冊一個測試用戶，驗證:
     - public.users 有對應記錄
     - JWT 包含 role claim
□ 5. 以 Admin 身份測試 set_user_role 函數

═══════════════════════════════════════════════════════════════════════════════
*/
