-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔒 Migration: 20260319000003_suspended_account_blocking.sql
-- 📌 發財B平台 - 停權帳號阻擋機制 (ANALYZE-01 安全性修補)
-- 📅 建立日期: 2026-03-19
-- 📝 說明: 建立停權帳號驗證函數，並更新相關 RLS 政策以阻擋停權帳號的寫入操作
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. 建立停權帳號驗證函數
-- ═══════════════════════════════════════════════════════════════════════════

/**
 * is_user_active()
 * 
 * 功能：檢查當前用戶是否為活躍狀態（status = 'active'）
 * 用途：在 RLS 政策中阻擋停權帳號的寫入操作
 * 
 * @returns BOOLEAN - true 表示用戶為活躍狀態，可執行寫入操作
 */
CREATE OR REPLACE FUNCTION is_user_active()
RETURNS BOOLEAN AS $$
DECLARE
  user_status VARCHAR(20);
BEGIN
  -- 取得當前用戶狀態
  SELECT status INTO user_status
  FROM users
  WHERE id = auth.uid();
  
  -- 若找不到用戶記錄，視為非活躍
  IF user_status IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN user_status = 'active';
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   STABLE
   SET search_path = public;

COMMENT ON FUNCTION is_user_active() IS 
  '🔒 [ANALYZE-01] 檢查當前用戶是否為活躍狀態（status = active），用於 RLS 政策阻擋停權帳號';


/**
 * is_user_suspended()
 * 
 * 功能：檢查當前用戶是否被停權（status = 'suspended'）
 * 用途：供後端中間件或其他驗證邏輯使用
 * 
 * @returns BOOLEAN - true 表示用戶已被停權
 */
CREATE OR REPLACE FUNCTION is_user_suspended()
RETURNS BOOLEAN AS $$
DECLARE
  user_status VARCHAR(20);
BEGIN
  -- 取得當前用戶狀態
  SELECT status INTO user_status
  FROM users
  WHERE id = auth.uid();
  
  -- 若找不到用戶記錄，視為非停權（無法判斷）
  IF user_status IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN user_status = 'suspended';
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   STABLE
   SET search_path = public;

COMMENT ON FUNCTION is_user_suspended() IS 
  '🔒 [ANALYZE-01] 檢查當前用戶是否被停權（status = suspended）';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 更新 vehicles 表 RLS 政策：阻擋停權帳號
-- ═══════════════════════════════════════════════════════════════════════════

-- 刪除舊有的 INSERT 政策
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;

-- 建立新的 INSERT 政策：需要用戶為活躍狀態
-- 🔒 停權帳號無法新增車輛
CREATE POLICY "Users can insert own vehicles"
ON vehicles FOR INSERT
WITH CHECK (
  auth.uid() = owner_dealer_id
  AND is_user_active()  -- 🔒 阻擋停權帳號
);

COMMENT ON POLICY "Users can insert own vehicles" ON vehicles IS 
  '🔒 [ANALYZE-01] 用戶可新增自己的車輛（停權帳號被阻擋）';


-- 刪除舊有的 UPDATE 政策
DROP POLICY IF EXISTS "Owners can update own vehicles" ON vehicles;

-- 建立新的 UPDATE 政策：需要用戶為活躍狀態
-- 🔒 停權帳號無法更新車輛
CREATE POLICY "Owners can update own vehicles"
ON vehicles FOR UPDATE
USING (auth.uid() = owner_dealer_id)
WITH CHECK (
  auth.uid() = owner_dealer_id
  AND is_user_active()  -- 🔒 阻擋停權帳號
);

COMMENT ON POLICY "Owners can update own vehicles" ON vehicles IS 
  '🔒 [ANALYZE-01] 擁有者可更新自己的車輛（停權帳號被阻擋）';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 更新 trade_requests 表 RLS 政策：阻擋停權帳號
-- ═══════════════════════════════════════════════════════════════════════════

-- 刪除舊有的 INSERT 政策
DROP POLICY IF EXISTS "Users can insert own trades" ON trade_requests;

-- 建立新的 INSERT 政策：需要用戶為活躍狀態
-- 🔒 停權帳號無法新增調做需求
CREATE POLICY "Users can insert own trades"
ON trade_requests FOR INSERT
WITH CHECK (
  auth.uid() = dealer_id
  AND is_user_active()  -- 🔒 阻擋停權帳號
);

COMMENT ON POLICY "Users can insert own trades" ON trade_requests IS 
  '🔒 [ANALYZE-01] 用戶可新增調做需求（停權帳號被阻擋）';


-- 刪除舊有的 UPDATE 政策
DROP POLICY IF EXISTS "Owners can update own trades" ON trade_requests;

-- 建立新的 UPDATE 政策：需要用戶為活躍狀態
-- 🔒 停權帳號無法更新調做需求
CREATE POLICY "Owners can update own trades"
ON trade_requests FOR UPDATE
USING (auth.uid() = dealer_id)
WITH CHECK (
  auth.uid() = dealer_id
  AND is_user_active()  -- 🔒 阻擋停權帳號
);

COMMENT ON POLICY "Owners can update own trades" ON trade_requests IS 
  '🔒 [ANALYZE-01] 擁有者可更新自己的調做需求（停權帳號被阻擋）';


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. 更新 dictionary_requests 表 RLS 政策：阻擋停權帳號
-- ═══════════════════════════════════════════════════════════════════════════

-- 刪除舊有的 INSERT 政策
DROP POLICY IF EXISTS "Users can insert dictionary requests" ON dictionary_requests;

-- 建立新的 INSERT 政策：需要用戶為活躍狀態
-- 🔒 停權帳號無法申請新增字典項目
CREATE POLICY "Users can insert dictionary requests"
ON dictionary_requests FOR INSERT
WITH CHECK (
  auth.uid() = dealer_id
  AND is_user_active()  -- 🔒 阻擋停權帳號
);

COMMENT ON POLICY "Users can insert dictionary requests" ON dictionary_requests IS 
  '🔒 [ANALYZE-01] 用戶可申請新增字典項目（停權帳號被阻擋）';


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. 測試 SQL（供手動驗證使用，不會自動執行）
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 1：停權帳號嘗試新增車輛（應失敗）
-- 預期結果: ERROR: new row violates row-level security policy
-- ═══════════════════════════════════════════════════════════════════════════

-- 準備：設定測試用戶為停權狀態
UPDATE users SET status = 'suspended', suspended_at = NOW(), suspended_reason = '測試用' 
WHERE id = 'your-test-user-id';

-- 測試：以該用戶身份嘗試新增車輛
-- （需透過 Supabase Client 模擬用戶身份）
INSERT INTO vehicles (owner_dealer_id, brand_id, spec_id, model_id, year)
VALUES ('your-test-user-id', 'brand-uuid', 'spec-uuid', 'model-uuid', 2024);
-- 預期錯誤: new row violates row-level security policy for table "vehicles"


-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 2：活躍帳號新增車輛（應成功）
-- 預期結果: INSERT 成功
-- ═══════════════════════════════════════════════════════════════════════════

-- 準備：設定測試用戶為活躍狀態
UPDATE users SET status = 'active', suspended_at = NULL, suspended_reason = NULL 
WHERE id = 'your-test-user-id';

-- 測試：以該用戶身份新增車輛
INSERT INTO vehicles (owner_dealer_id, brand_id, spec_id, model_id, year)
VALUES ('your-test-user-id', 'brand-uuid', 'spec-uuid', 'model-uuid', 2024);
-- 預期結果: INSERT 成功


-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 3：停權帳號嘗試發布調做需求（應失敗）
-- 預期結果: ERROR: new row violates row-level security policy
-- ═══════════════════════════════════════════════════════════════════════════

-- 準備：設定測試用戶為停權狀態
UPDATE users SET status = 'suspended' WHERE id = 'your-test-user-id';

-- 測試：以該用戶身份發布調做需求
INSERT INTO trade_requests (dealer_id, target_brand_id, contact_info, expires_at)
VALUES ('your-test-user-id', 'brand-uuid', '0912-345-678', NOW() + INTERVAL '7 days');
-- 預期錯誤: new row violates row-level security policy for table "trade_requests"


-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 4：驗證 is_user_active() 函數回傳值
-- ═══════════════════════════════════════════════════════════════════════════

-- 測試函數（需以特定用戶身份執行）
SELECT is_user_active();  -- 應回傳 true 或 false
SELECT is_user_suspended();  -- 應回傳 false 或 true

*/


-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 完成
-- ═══════════════════════════════════════════════════════════════════════════
