-- =============================================
-- 發財B平台 - 初始 Schema
-- Migration: 20260318000001_init_schema.sql
-- =============================================

-- 啟用必要擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. 用戶表（擴充 Supabase Auth）
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'suspended')),
  suspended_at TIMESTAMP,
  suspended_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_name);

-- =============================================
-- 2. 字典檔：品牌
-- =============================================
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_name_trgm ON brands USING gin (name gin_trgm_ops);
CREATE INDEX idx_brands_sort ON brands(sort_order) WHERE is_active = true;

-- =============================================
-- 3. 字典檔：規格
-- =============================================
CREATE TABLE public.specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE INDEX idx_specs_brand ON specs(brand_id) WHERE is_active = true;
CREATE INDEX idx_specs_name_trgm ON specs USING gin (name gin_trgm_ops);

-- =============================================
-- 4. 字典檔：車型
-- =============================================
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(spec_id, name)
);

CREATE INDEX idx_models_spec ON models(spec_id) WHERE is_active = true;
CREATE INDEX idx_models_name_trgm ON models USING gin (name gin_trgm_ops);

-- =============================================
-- 5. 車輛表
-- =============================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_dealer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  spec_id UUID NOT NULL REFERENCES specs(id),
  model_id UUID NOT NULL REFERENCES models(id),
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  listing_price INTEGER CHECK (listing_price IS NULL OR listing_price >= 0),
  acquisition_cost INTEGER CHECK (acquisition_cost IS NULL OR acquisition_cost >= 0),
  repair_cost INTEGER CHECK (repair_cost IS NULL OR repair_cost >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'archived', 'hidden')),
  previous_status VARCHAR(20),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 🔒 [ANALYZE-01] images 必須為 JSON 陣列格式
  CONSTRAINT chk_images_array CHECK (jsonb_typeof(images) = 'array')
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_dealer_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_brand ON vehicles(brand_id) WHERE status = 'approved';
CREATE INDEX idx_vehicles_spec ON vehicles(spec_id) WHERE status = 'approved';
CREATE INDEX idx_vehicles_model ON vehicles(model_id) WHERE status = 'approved';
CREATE INDEX idx_vehicles_year ON vehicles(year) WHERE status = 'approved';
CREATE INDEX idx_vehicles_created ON vehicles(created_at DESC) WHERE status = 'approved';
CREATE INDEX idx_vehicles_pending ON vehicles(created_at DESC) WHERE status = 'pending';

-- =============================================
-- 6. 盤車調做需求表
-- =============================================
CREATE TABLE public.trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_brand_id UUID NOT NULL REFERENCES brands(id),
  target_spec_id UUID REFERENCES specs(id),
  target_model_id UUID REFERENCES models(id),
  year_from INTEGER CHECK (year_from IS NULL OR (year_from >= 1990 AND year_from <= 2030)),
  year_to INTEGER CHECK (year_to IS NULL OR (year_to >= 1990 AND year_to <= 2030)),
  price_range_min INTEGER CHECK (price_range_min IS NULL OR price_range_min >= 0),
  price_range_max INTEGER CHECK (price_range_max IS NULL OR price_range_max >= 0),
  conditions TEXT,
  contact_info TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  reminded_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_year_range CHECK (year_from IS NULL OR year_to IS NULL OR year_from <= year_to),
  CONSTRAINT chk_price_range CHECK (price_range_min IS NULL OR price_range_max IS NULL OR price_range_min <= price_range_max)
);

CREATE INDEX idx_trade_requests_dealer ON trade_requests(dealer_id);
CREATE INDEX idx_trade_requests_brand ON trade_requests(target_brand_id) WHERE is_active = true;
CREATE INDEX idx_trade_requests_active ON trade_requests(expires_at DESC) WHERE is_active = true;
CREATE INDEX idx_trade_requests_expiring ON trade_requests(expires_at) WHERE is_active = true AND reminded_at IS NULL;

-- =============================================
-- 7. 字典檔新增申請表
-- =============================================
CREATE TABLE public.dictionary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('brand', 'spec', 'model')),
  parent_brand_id UUID REFERENCES brands(id),
  parent_spec_id UUID REFERENCES specs(id),
  suggested_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_dictionary_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dictionary_requests_status ON dictionary_requests(status) WHERE status = 'pending';
CREATE INDEX idx_dictionary_requests_dealer ON dictionary_requests(dealer_id);

-- =============================================
-- 8. 站內通知表
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- =============================================
-- 9. 稽核日誌表
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- =============================================
-- 10. 全域設定表
-- =============================================
CREATE TABLE public.app_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 預設資料
INSERT INTO app_settings (key, value) VALUES 
('external_services', '{
  "entertainment": { "name": "娛樂城", "url": null, "is_active": false },
  "relaxation": { "name": "紓壓專區", "url": null, "is_active": false },
  "comfort": { "name": "舒服專區", "url": null, "is_active": false }
}');

-- =============================================
-- 11. 線上商城商品表
-- =============================================
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL CHECK (category IN ('car_wash', 'android_device')),
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  purchase_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shop_products_category ON shop_products(category, sort_order) WHERE is_active = true;

-- =============================================
-- 12. 通用觸發器：自動更新 updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trade_requests_updated_at
  BEFORE UPDATE ON trade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_shop_products_updated_at
  BEFORE UPDATE ON shop_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 13. 模糊搜尋函數
-- =============================================
CREATE OR REPLACE FUNCTION search_vehicles(search_term TEXT, similarity_threshold FLOAT DEFAULT 0.3)
RETURNS TABLE (
  vehicle_id UUID,
  brand_name TEXT,
  spec_name TEXT,
  model_name TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    b.name,
    s.name,
    m.name,
    GREATEST(
      similarity(b.name, search_term),
      similarity(s.name, search_term),
      similarity(m.name, search_term)
    ) as score
  FROM vehicles v
  JOIN brands b ON v.brand_id = b.id
  JOIN specs s ON v.spec_id = s.id
  JOIN models m ON v.model_id = m.id
  WHERE v.status = 'approved'
    AND (
      b.name % search_term OR
      s.name % search_term OR
      m.name % search_term
    )
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 14. 表格與欄位註解
-- =============================================

-- users 表
COMMENT ON TABLE users IS '車行會員資料（擴充 Supabase Auth）';
COMMENT ON COLUMN users.id IS '主鍵，對應 auth.users.id';
COMMENT ON COLUMN users.status IS '帳號狀態：active=啟用, suspended=停權';
COMMENT ON COLUMN users.suspended_at IS '停權時間';
COMMENT ON COLUMN users.suspended_reason IS '停權原因說明';

-- brands 表
COMMENT ON TABLE brands IS '汽車品牌字典';
COMMENT ON COLUMN brands.sort_order IS '排序權重（數字越小越前面）';

-- specs 表
COMMENT ON TABLE specs IS '汽車規格字典（車系/車款）';
COMMENT ON COLUMN specs.brand_id IS '所屬品牌 ID';

-- models 表
COMMENT ON TABLE models IS '汽車車型字典（細部型號）';
COMMENT ON COLUMN models.spec_id IS '所屬規格 ID';

-- vehicles 表
COMMENT ON TABLE vehicles IS '車輛資料表';
COMMENT ON COLUMN vehicles.owner_dealer_id IS '車輛擁有者（車行）';
COMMENT ON COLUMN vehicles.created_by IS '建檔者（Admin 代客建檔時使用）';
COMMENT ON COLUMN vehicles.listing_price IS '展示價格（NULL 表示洽詢）';
COMMENT ON COLUMN vehicles.acquisition_cost IS '收購成本（私有，僅擁有者可見）';
COMMENT ON COLUMN vehicles.repair_cost IS '整備費用（私有，僅擁有者可見）';
COMMENT ON COLUMN vehicles.status IS '狀態：pending=待審核, approved=已核准, rejected=已退件, archived=已下架, hidden=停權隱藏';
COMMENT ON COLUMN vehicles.previous_status IS '原狀態（停權恢復時使用）';
COMMENT ON COLUMN vehicles.images IS '圖片 URL 陣列（JSONB，必須為陣列格式）';

-- trade_requests 表
COMMENT ON TABLE trade_requests IS '盤車調做需求（車行想收購的車型）';
COMMENT ON COLUMN trade_requests.target_brand_id IS '目標品牌（必填）';
COMMENT ON COLUMN trade_requests.target_spec_id IS '目標規格（選填）';
COMMENT ON COLUMN trade_requests.target_model_id IS '目標車型（選填）';
COMMENT ON COLUMN trade_requests.expires_at IS '需求到期時間';
COMMENT ON COLUMN trade_requests.reminded_at IS '已發送到期提醒的時間';

-- dictionary_requests 表
COMMENT ON TABLE dictionary_requests IS '字典檔新增申請';
COMMENT ON COLUMN dictionary_requests.request_type IS '申請類型：brand=品牌, spec=規格, model=車型';
COMMENT ON COLUMN dictionary_requests.created_dictionary_id IS '審核通過後建立的字典項目 ID';

-- notifications 表
COMMENT ON TABLE notifications IS '站內通知';
COMMENT ON COLUMN notifications.type IS '通知類型（如 VEHICLE_APPROVED, ACCOUNT_SUSPENDED 等）';

-- audit_logs 表
COMMENT ON TABLE audit_logs IS '稽核日誌（記錄 Admin 重要操作）';
COMMENT ON COLUMN audit_logs.action IS '操作類型（如 VEHICLE_APPROVED, USER_SUSPENDED 等）';
COMMENT ON COLUMN audit_logs.details IS '操作詳細資訊（JSON 格式）';

-- app_settings 表
COMMENT ON TABLE app_settings IS '全域系統設定';
COMMENT ON COLUMN app_settings.key IS '設定鍵名';
COMMENT ON COLUMN app_settings.value IS '設定值（JSON 格式）';

-- shop_products 表
COMMENT ON TABLE shop_products IS '線上商城商品';
COMMENT ON COLUMN shop_products.category IS '商品分類：car_wash=汽車美容, android_device=安卓機';

-- =============================================
-- 🎉 初始 Schema 建立完成
-- 版本: 1.1.0 (含 ANALYZE-01 安全性修補)
-- 下一步：執行 20260319000001_add_hierarchy_trigger.sql
-- =============================================