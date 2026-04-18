-- =============================================
-- 發財B平台 - v12 功能擴充
-- Migration: 20260418000001_v12_features.sql
--
-- 包含：
--  1) vehicles 新增：is_tradable、trade_price、archived_at
--  2) vehicle_expenses 表（整備費細項）
--  3) revenue_records 表（營收紀錄）
--  4) manual_vehicle_requests 表（找不到車輛→管理員代上傳）
--  5) users 新增：business_card_url（名片）
--     credits 欄位已存在，本檔不重覆建立
-- =============================================

-- =============================================
-- 1. vehicles：新增欄位
-- =============================================
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS is_tradable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trade_price INTEGER,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- 為 trade_price 加上檢查
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_trade_price_non_negative'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT chk_vehicles_trade_price_non_negative
      CHECK (trade_price IS NULL OR trade_price >= 0);
  END IF;
END $$;

-- 盤車可見索引（提升盤車列表查詢效率）
CREATE INDEX IF NOT EXISTS idx_vehicles_tradable
  ON public.vehicles(created_at DESC)
  WHERE is_tradable = true AND status = 'approved';

-- 下架時間索引（用於 30 天自動刪除 cron）
CREATE INDEX IF NOT EXISTS idx_vehicles_archived_at
  ON public.vehicles(archived_at)
  WHERE status = 'archived' AND archived_at IS NOT NULL;

-- 觸發器：status 變成 archived 時自動寫入 archived_at，取消 archived 時清空
CREATE OR REPLACE FUNCTION sync_vehicle_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 從非 archived → archived
  IF NEW.status = 'archived' AND (OLD.status IS DISTINCT FROM 'archived') THEN
    NEW.archived_at = NOW();
  -- 從 archived → 非 archived
  ELSIF NEW.status <> 'archived' AND OLD.status = 'archived' THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vehicles_archived_at ON public.vehicles;
CREATE TRIGGER trigger_vehicles_archived_at
  BEFORE UPDATE OF status ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_archived_at();

-- 既有已下架但沒有 archived_at 的資料 → 用 updated_at 回填
UPDATE public.vehicles
   SET archived_at = updated_at
 WHERE status = 'archived'
   AND archived_at IS NULL;

COMMENT ON COLUMN public.vehicles.is_tradable IS '是否可盤（可在盤車列表顯示）';
COMMENT ON COLUMN public.vehicles.trade_price IS '盤價（可盤時才顯示）';
COMMENT ON COLUMN public.vehicles.archived_at IS '下架時間（用於 30 天自動刪除）';


-- =============================================
-- 2. vehicle_expenses（整備費細項 / 做帳）
-- =============================================
CREATE TABLE IF NOT EXISTS public.vehicle_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  owner_dealer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  note TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle
  ON public.vehicle_expenses(vehicle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_owner
  ON public.vehicle_expenses(owner_dealer_id);

DROP TRIGGER IF EXISTS trigger_vehicle_expenses_updated_at ON public.vehicle_expenses;
CREATE TRIGGER trigger_vehicle_expenses_updated_at
  BEFORE UPDATE ON public.vehicle_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE  public.vehicle_expenses IS '車輛整備費用細項（車行做帳用，私有）';
COMMENT ON COLUMN public.vehicle_expenses.item_name IS '項目名稱，例如：洗車、鍍膜、鈑金';
COMMENT ON COLUMN public.vehicle_expenses.amount IS '金額';


-- =============================================
-- 3. revenue_records（營收紀錄：下架 30 天自動結算）
-- =============================================
CREATE TABLE IF NOT EXISTS public.revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID,  -- 車輛 30 天後會被刪除，故不用 FK
  owner_dealer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- 快照：刪除車輛前保存的資訊（車輛刪除後仍可查閱）
  vehicle_snapshot JSONB NOT NULL,

  -- 金額
  listing_price    INTEGER,          -- 售價（= 當時的 listing_price）
  acquisition_cost INTEGER,          -- 收購成本
  repair_cost_base INTEGER,          -- vehicles.repair_cost 欄位值（舊欄位）
  expenses_total   INTEGER NOT NULL DEFAULT 0,  -- vehicle_expenses 加總
  total_cost       INTEGER NOT NULL DEFAULT 0,  -- acquisition_cost + repair_cost_base + expenses_total
  profit           INTEGER NOT NULL DEFAULT 0,  -- listing_price - total_cost

  archived_at      TIMESTAMP NOT NULL,
  settled_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_records_owner
  ON public.revenue_records(owner_dealer_id, settled_at DESC);

CREATE INDEX IF NOT EXISTS idx_revenue_records_settled_at
  ON public.revenue_records(settled_at DESC);

COMMENT ON TABLE  public.revenue_records IS '車輛下架 30 天後自動結算產生的營收紀錄';
COMMENT ON COLUMN public.revenue_records.vehicle_snapshot IS '結算當下車輛資訊快照（品牌/車型/年份/圖片等）';
COMMENT ON COLUMN public.revenue_records.profit IS '獲利 = listing_price - (acquisition_cost + repair_cost_base + expenses_total)';


-- =============================================
-- 4. manual_vehicle_requests（找不到車輛→管理員代上傳）
-- =============================================
CREATE TABLE IF NOT EXISTS public.manual_vehicle_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 使用者填寫的車輛資訊（自由文字，因為字典找不到）
  brand_text    VARCHAR(100) NOT NULL,
  spec_text     VARCHAR(100),
  model_text    VARCHAR(100),
  year          INTEGER,
  color         VARCHAR(50),
  mileage       INTEGER,
  transmission  VARCHAR(20),
  fuel_type     VARCHAR(20),
  listing_price INTEGER,
  acquisition_cost INTEGER,
  repair_cost   INTEGER,
  description   TEXT,
  images        JSONB NOT NULL DEFAULT '[]',
  contact_note  TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,

  -- 管理員核准後連結到實際車輛
  created_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,

  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_manual_req_images_array CHECK (jsonb_typeof(images) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_manual_vehicle_requests_status
  ON public.manual_vehicle_requests(created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_manual_vehicle_requests_requester
  ON public.manual_vehicle_requests(requester_id, created_at DESC);

DROP TRIGGER IF EXISTS trigger_manual_vehicle_requests_updated_at ON public.manual_vehicle_requests;
CREATE TRIGGER trigger_manual_vehicle_requests_updated_at
  BEFORE UPDATE ON public.manual_vehicle_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.manual_vehicle_requests IS '使用者於新增車輛時找不到字典選項，送交管理員代為上傳';


-- =============================================
-- 5. users：名片欄位
-- =============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS business_card_url TEXT;

COMMENT ON COLUMN public.users.business_card_url IS '車行名片圖片（管理後台上傳，車行不可見）';


-- =============================================
-- 6. credits 相容性（若舊 schema 尚未加入此欄位，也補上）
-- =============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_credits_non_negative'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT chk_credits_non_negative CHECK (credits >= 0);
  END IF;
END $$;


-- =============================================
-- ✅ v12 功能擴充完成
-- =============================================
