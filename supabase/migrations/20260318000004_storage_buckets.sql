-- ═══════════════════════════════════════════════════════════════════════════════
-- 發財B平台 - Storage Bucket 設定
-- 檔案: supabase/migrations/20260318000004_storage_buckets.sql
-- 版本: 1.1.0
-- 建立日期: 2026-03-18
-- 最後修訂: 2026-03-19
-- 
-- 功能說明:
--   1. 建立 vehicle-images Bucket 供車輛圖片上傳
--   2. 設定完整 RLS 政策確保圖片存取安全
--   3. 限制上傳格式 (image/jpeg, image/png, image/webp, image/gif)
--   4. 限制單檔大小 (5MB)
--   5. 停權帳號無法上傳/更新圖片
--
-- 相依性:
--   - 必須先執行 20260318000001_init_schema.sql (建立 vehicles 表)
--   - 必須先執行 20260318000002_enable_rls.sql (RLS 政策)
--   - 必須先執行 20260318000003_auth_hooks.sql (is_admin 函數)
--
-- 資料夾結構:
--   vehicle-images/
--   └── {vehicle_id}/
--       ├── main.jpg          (主圖)
--       ├── 1.jpg             (附圖)
--       ├── 2.jpg
--       └── ...
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: 建立 Storage Bucket
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 建立 vehicle-images Bucket
-- 設定:
--   - public: true (允許公開讀取已核准車輛圖片的 URL)
--   - file_size_limit: 5MB (單檔上限)
--   - allowed_mime_types: 僅限圖片格式
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,                                                                -- 允許公開讀取
  5242880,                                                             -- 5MB = 5 * 1024 * 1024 bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]  -- 僅限圖片格式
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: 輔助函數 - 從路徑取得 vehicle_id
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: get_vehicle_id_from_storage_path
-- 說明: 從 Storage 物件路徑中取得 vehicle_id
-- 路徑格式: {vehicle_id}/{filename} 或 {vehicle_id}/thumbnails/{filename}
-- 回傳: vehicle_id (UUID) 或 NULL
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION storage.get_vehicle_id_from_storage_path(object_path TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  path_parts TEXT[];
  vehicle_id_str TEXT;
BEGIN
  -- 參數驗證
  IF object_path IS NULL OR object_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- 使用 storage.foldername 取得路徑的第一個部分
  -- storage.foldername 回傳路徑的目錄部分陣列
  path_parts := storage.foldername(object_path);
  
  IF path_parts IS NULL OR array_length(path_parts, 1) < 1 THEN
    -- 若無法使用 foldername，嘗試手動分割
    path_parts := string_to_array(object_path, '/');
    IF array_length(path_parts, 1) < 1 THEN
      RETURN NULL;
    END IF;
    vehicle_id_str := path_parts[1];
  ELSE
    vehicle_id_str := path_parts[1];
  END IF;
  
  -- 嘗試轉換為 UUID
  BEGIN
    RETURN vehicle_id_str::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- 路徑第一段不是有效的 UUID
      RETURN NULL;
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$;

COMMENT ON FUNCTION storage.get_vehicle_id_from_storage_path(TEXT) IS
  '從 Storage 物件路徑取得 vehicle_id。路徑格式: {vehicle_id}/{filename}';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: 輔助函數 - 檢查車輛擁有者與狀態
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: storage_is_vehicle_owner
-- 說明: 檢查當前用戶是否為指定車輛的擁有者
-- 回傳: BOOLEAN
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION storage.storage_is_vehicle_owner(vehicle_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- 未登入時回傳 FALSE
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 若 vehicle_id 為 NULL，回傳 FALSE
  IF vehicle_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 檢查是否為擁有者
  RETURN EXISTS (
    SELECT 1 
    FROM public.vehicles 
    WHERE id = vehicle_id 
      AND owner_dealer_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION storage.storage_is_vehicle_owner(UUID) IS
  '檢查當前用戶是否為指定車輛的擁有者。';

-- -----------------------------------------------------------------------------
-- 函數: storage_is_vehicle_approved
-- 說明: 檢查指定車輛是否已核准
-- 回傳: BOOLEAN
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION storage.storage_is_vehicle_approved(vehicle_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- 若 vehicle_id 為 NULL，回傳 FALSE
  IF vehicle_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 檢查車輛狀態
  RETURN EXISTS (
    SELECT 1 
    FROM public.vehicles 
    WHERE id = vehicle_id 
      AND status = 'approved'
  );
END;
$$;

COMMENT ON FUNCTION storage.storage_is_vehicle_approved(UUID) IS
  '檢查指定車輛是否為已核准狀態。';

-- -----------------------------------------------------------------------------
-- 函數: storage_is_user_active
-- 說明: 檢查當前用戶帳號是否為 active 狀態
-- 回傳: BOOLEAN
-- 用途: 阻擋停權用戶上傳/更新圖片
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION storage.storage_is_user_active()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- 未登入時回傳 FALSE
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 檢查用戶狀態
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
      AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION storage.storage_is_user_active() IS
  '檢查當前用戶帳號是否為 active 狀態。用於阻擋停權用戶上傳圖片。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: 清除既有 Storage RLS 政策
-- ═══════════════════════════════════════════════════════════════════════════════

-- 移除既有政策以避免衝突
DROP POLICY IF EXISTS "Vehicle owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload any vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view approved vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can view own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any vehicle images" ON storage.objects;

-- 移除任何以 vehicle_images 開頭的政策
DROP POLICY IF EXISTS "vehicle_images_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_select_owner" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_select_admin" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_delete_owner" ON storage.objects;
DROP POLICY IF EXISTS "vehicle_images_delete_admin" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: Storage RLS 政策 - INSERT (上傳)
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_insert_owner
-- 說明: 車輛擁有者可上傳圖片到自己的車輛資料夾
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 路徑必須以有效的 {vehicle_id}/ 開頭
--   3. 用戶必須是該車輛的擁有者
--   4. 用戶帳號必須為 active 狀態（停權用戶無法上傳）
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_insert_owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND storage.storage_is_vehicle_owner(
    storage.get_vehicle_id_from_storage_path(name)
  )
  AND storage.storage_is_user_active()
);

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_insert_admin
-- 說明: Admin 可上傳圖片到任何車輛資料夾（代客建檔用）
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是 Admin
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: Storage RLS 政策 - SELECT (讀取)
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_select_public
-- 說明: 公開讀取已核准車輛的圖片
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 車輛狀態必須為 approved
-- 適用: anon 角色（未登入訪客）與 authenticated 角色
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_select_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'vehicle-images'
  AND storage.storage_is_vehicle_approved(
    storage.get_vehicle_id_from_storage_path(name)
  )
);

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_select_owner
-- 說明: 車輛擁有者可讀取自己所有車輛的圖片（含待審核）
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是車輛擁有者
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_select_owner"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND storage.storage_is_vehicle_owner(
    storage.get_vehicle_id_from_storage_path(name)
  )
);

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_select_admin
-- 說明: Admin 可讀取所有車輛圖片（後台審核用）
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是 Admin
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_select_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: Storage RLS 政策 - UPDATE (更新/覆蓋)
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_update_owner
-- 說明: 車輛擁有者可更新（覆蓋）自己車輛的圖片
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是車輛擁有者
--   3. 用戶帳號必須為 active 狀態（停權用戶無法更新）
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_update_owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND storage.storage_is_vehicle_owner(
    storage.get_vehicle_id_from_storage_path(name)
  )
)
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND storage.storage_is_vehicle_owner(
    storage.get_vehicle_id_from_storage_path(name)
  )
  AND storage.storage_is_user_active()
);

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_update_admin
-- 說明: Admin 可更新任何車輛圖片
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是 Admin
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: Storage RLS 政策 - DELETE (刪除)
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_delete_owner
-- 說明: 車輛擁有者可刪除自己車輛的圖片
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是車輛擁有者
-- 注意: 允許停權用戶刪除（讓他們整理自己的資料）
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND storage.storage_is_vehicle_owner(
    storage.get_vehicle_id_from_storage_path(name)
  )
);

-- -----------------------------------------------------------------------------
-- 政策: vehicle_images_delete_admin
-- 說明: Admin 可刪除任何車輛圖片
-- 條件:
--   1. 必須是 vehicle-images bucket
--   2. 用戶必須是 Admin
-- -----------------------------------------------------------------------------
CREATE POLICY "vehicle_images_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
);

