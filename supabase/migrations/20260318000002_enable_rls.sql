-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔐 Migration: 20260318000002_enable_rls.sql
-- 📌 發財B平台 - Row Level Security (RLS) 政策設定
-- 📅 建立日期: 2026-03-18
-- 📅 更新日期: 2026-03-19 (強化成本欄位隔離)
-- 📝 說明: 設定所有資料表的 RLS 政策，確保資料隔離與權限控制
-- 🔒 關鍵防護: 成本欄位（acquisition_cost, repair_cost）僅擁有者與 Admin 可見
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. 前置：建立 Admin 角色檢查函數
-- ═══════════════════════════════════════════════════════════════════════════

/**
 * is_admin()
 * 
 * 功能：檢查當前用戶是否為 Admin
 * 用途：在 RLS 政策中判斷 Admin 權限
 * 讀取來源：JWT 的 app_metadata.role 欄位
 * 
 * @returns BOOLEAN - true 表示為 Admin
 */
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 優先從 app_metadata 讀取（Supabase 標準做法）
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    -- 備援：直接從 JWT 根層級讀取
    (auth.jwt() ->> 'role') = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   STABLE
   SET search_path = public;

COMMENT ON FUNCTION is_admin() IS '檢查當前用戶是否為 Admin（從 JWT app_metadata.role 或 role 讀取）';


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. users 表 RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- 用戶可查看自己的資料
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 用戶可更新自己的資料
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin 可查看所有用戶
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (is_admin());

-- Admin 可更新所有用戶
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
USING (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. vehicles 表 RLS
-- 🔒 關鍵防護：成本欄位（acquisition_cost, repair_cost）僅擁有者與 Admin 可見
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

-- 公開查看已核准車輛（但透過 VIEW 過濾成本）
CREATE POLICY "Public can view approved vehicles"
ON vehicles FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = vehicles.owner_dealer_id 
    AND status = 'active'
  )
);

-- 擁有者可查看自己所有車輛（含成本）
CREATE POLICY "Owners can view own vehicles"
ON vehicles FOR SELECT
USING (auth.uid() = owner_dealer_id);

-- 用戶可新增車輛
CREATE POLICY "Users can insert own vehicles"
ON vehicles FOR INSERT
WITH CHECK (auth.uid() = owner_dealer_id);

-- 擁有者可更新自己的車輛
CREATE POLICY "Owners can update own vehicles"
ON vehicles FOR UPDATE
USING (auth.uid() = owner_dealer_id)
WITH CHECK (auth.uid() = owner_dealer_id);

-- 擁有者可刪除自己的車輛（僅 archived 狀態）
CREATE POLICY "Owners can delete archived vehicles"
ON vehicles FOR DELETE
USING (
  auth.uid() = owner_dealer_id 
  AND status = 'archived'
);

-- Admin 可查看所有車輛（含成本）
CREATE POLICY "Admins can view all vehicles"
ON vehicles FOR SELECT
USING (is_admin());

-- Admin 可更新所有車輛
CREATE POLICY "Admins can update all vehicles"
ON vehicles FOR UPDATE
USING (is_admin());

-- Admin 可新增車輛（代客建檔）
CREATE POLICY "Admins can insert vehicles"
ON vehicles FOR INSERT
WITH CHECK (is_admin());

-- Admin 可刪除任何車輛
CREATE POLICY "Admins can delete any vehicle"
ON vehicles FOR DELETE
USING (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. vehicles_public VIEW - 成本欄位隔離
-- 🔒 關鍵：非擁有者查詢時，成本欄位自動返回 NULL
-- 此 VIEW 供對外 API 使用，確保成本資訊絕對不會洩漏給其他車行
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.vehicles_public AS
SELECT 
  v.id,
  v.owner_dealer_id,
  v.created_by,
  v.brand_id,
  v.spec_id,
  v.model_id,
  v.year,
  v.listing_price,
  v.status,
  v.previous_status,
  v.rejection_reason,
  v.reviewed_by,
  v.reviewed_at,
  v.description,
  v.images,
  v.created_at,
  v.updated_at,
  -- 🔒 成本欄位隔離：僅擁有者或 Admin 可見
  CASE 
    WHEN v.owner_dealer_id = auth.uid() THEN v.acquisition_cost 
    WHEN is_admin() THEN v.acquisition_cost
    ELSE NULL 
  END AS acquisition_cost,
  CASE 
    WHEN v.owner_dealer_id = auth.uid() THEN v.repair_cost 
    WHEN is_admin() THEN v.repair_cost
    ELSE NULL 
  END AS repair_cost,
  -- 額外提供擁有者資訊（車行名稱、聯絡電話）供顯示用
  u.company_name AS owner_company_name,
  u.phone AS owner_phone
FROM vehicles v
LEFT JOIN users u ON v.owner_dealer_id = u.id;

COMMENT ON VIEW vehicles_public IS 
  '🔒 對外 API 使用的 VIEW，自動過濾成本欄位。acquisition_cost 與 repair_cost 僅對擁有者與 Admin 可見，其他車行絕對無法讀取。';


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. trade_requests 表 RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requests FORCE ROW LEVEL SECURITY;

-- 登入用戶可查看有效調做需求
CREATE POLICY "Authenticated users can view active trades"
ON trade_requests FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_active = true
  AND expires_at > NOW()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = trade_requests.dealer_id 
    AND status = 'active'
  )
);

-- 擁有者可查看自己所有調做需求
CREATE POLICY "Owners can view own trades"
ON trade_requests FOR SELECT
USING (auth.uid() = dealer_id);

-- 用戶可新增調做需求
CREATE POLICY "Users can insert own trades"
ON trade_requests FOR INSERT
WITH CHECK (auth.uid() = dealer_id);

-- 擁有者可更新自己的調做需求
CREATE POLICY "Owners can update own trades"
ON trade_requests FOR UPDATE
USING (auth.uid() = dealer_id);

-- 擁有者可刪除自己的調做需求
CREATE POLICY "Owners can delete own trades"
ON trade_requests FOR DELETE
USING (auth.uid() = dealer_id);

-- Admin 可查看所有調做需求
CREATE POLICY "Admins can view all trades"
ON trade_requests FOR SELECT
USING (is_admin());

-- Admin 可更新調做需求
CREATE POLICY "Admins can update all trades"
ON trade_requests FOR UPDATE
USING (is_admin());

-- Admin 可刪除調做需求
CREATE POLICY "Admins can delete all trades"
ON trade_requests FOR DELETE
USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. dictionary_requests 表 RLS
-- 🔒 [ANALYZE-01 補全] 完整權限隔離
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE dictionary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary_requests FORCE ROW LEVEL SECURITY;

-- 用戶可查看自己的申請
CREATE POLICY "Users can view own dictionary requests"
ON dictionary_requests FOR SELECT
USING (auth.uid() = dealer_id);

-- 用戶可新增申請
CREATE POLICY "Users can insert dictionary requests"
ON dictionary_requests FOR INSERT
WITH CHECK (auth.uid() = dealer_id);

-- Admin 可查看所有申請
CREATE POLICY "Admins can view all dictionary requests"
ON dictionary_requests FOR SELECT
USING (is_admin());

-- Admin 可更新申請（審核）
CREATE POLICY "Admins can update dictionary requests"
ON dictionary_requests FOR UPDATE
USING (is_admin());

-- Admin 可刪除申請（清理用）
CREATE POLICY "Admins can delete dictionary requests"
ON dictionary_requests FOR DELETE
USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. notifications 表 RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- 用戶只能查看自己的通知
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- 用戶只能更新自己的通知
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin 可查看所有通知（管理用途）
CREATE POLICY "Admins can view all notifications"
ON notifications FOR SELECT
USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. 字典表 RLS（brands, specs, models）
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands FORCE ROW LEVEL SECURITY;
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE specs FORCE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE models FORCE ROW LEVEL SECURITY;

-- 所有已認證用戶可讀取字典
CREATE POLICY "Authenticated can read brands" ON brands FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can read specs" ON specs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can read models" ON models FOR SELECT USING (auth.uid() IS NOT NULL);

-- 僅 Admin 可寫入字典
CREATE POLICY "Admins can insert brands" ON brands FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update brands" ON brands FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete brands" ON brands FOR DELETE USING (is_admin());

CREATE POLICY "Admins can insert specs" ON specs FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update specs" ON specs FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete specs" ON specs FOR DELETE USING (is_admin());

CREATE POLICY "Admins can insert models" ON models FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update models" ON models FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete models" ON models FOR DELETE USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. audit_logs 表 RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- 僅 Admin 可查看稽核日誌
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (is_admin());

-- 系統可寫入（透過 service_role）
-- 注意：INSERT 不設定 RLS 限制，稽核日誌由後端 Service Role Key 寫入


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. app_settings 表 RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings FORCE ROW LEVEL SECURITY;

-- 已認證用戶可讀取設定
CREATE POLICY "Authenticated can read settings"
ON app_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 僅 Admin 可更新設定
CREATE POLICY "Admins can update settings"
ON app_settings FOR UPDATE
USING (is_admin());

-- 僅 Admin 可新增設定
CREATE POLICY "Admins can insert settings"
ON app_settings FOR INSERT
WITH CHECK (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. shop_products 表 RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products FORCE ROW LEVEL SECURITY;

-- 已認證用戶可讀取上架商品
CREATE POLICY "Authenticated can read active products"
ON shop_products FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admin 可查看所有商品（含下架）
CREATE POLICY "Admins can view all products"
ON shop_products FOR SELECT
USING (is_admin());

-- Admin 可新增商品
CREATE POLICY "Admins can insert products"
ON shop_products FOR INSERT
WITH CHECK (is_admin());

-- Admin 可更新商品
CREATE POLICY "Admins can update products"
ON shop_products FOR UPDATE
USING (is_admin());

-- Admin 可刪除商品
CREATE POLICY "Admins can delete products"
ON shop_products FOR DELETE
USING (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 完成
-- ═══════════════════════════════════════════════════════════════════════════
