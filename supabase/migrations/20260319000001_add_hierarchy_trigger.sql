-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔒 Migration: 20260319000001_add_hierarchy_trigger.sql
-- 📌 發財B平台 - 階層一致性觸發器 (ANALYZE-01 安全性修補)
-- 📅 建立日期: 2026-03-19
-- 📝 說明: 確保 vehicles 與 trade_requests 表中的 brand → spec → model 階層關聯正確
-- ═══════════════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Vehicles 表階層一致性觸發器
-- ═══════════════════════════════════════════════════════════════════════════

/**
 * check_vehicle_hierarchy()
 * 
 * 功能：驗證 vehicles 表中 brand_id → spec_id → model_id 的階層關聯
 * 觸發時機：INSERT 或 UPDATE 之前
 * 
 * 驗證規則：
 *   1. spec_id 必須屬於指定的 brand_id
 *   2. model_id 必須屬於指定的 spec_id
 * 
 * 錯誤代碼：HIERARCHY_VIOLATION
 */
CREATE OR REPLACE FUNCTION check_vehicle_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- ─────────────────────────────────────────────────────────────────────────
  -- 驗證 1: spec_id 必須屬於 brand_id
  -- ─────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 
    FROM specs 
    WHERE id = NEW.spec_id 
      AND brand_id = NEW.brand_id
  ) THEN
    RAISE EXCEPTION 'HIERARCHY_VIOLATION: spec_id (%) does not belong to brand_id (%). Please ensure the specification is associated with the correct brand.', 
      NEW.spec_id, 
      NEW.brand_id
      USING ERRCODE = 'check_violation';
  END IF;
  
  -- ─────────────────────────────────────────────────────────────────────────
  -- 驗證 2: model_id 必須屬於 spec_id
  -- ─────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 
    FROM models 
    WHERE id = NEW.model_id 
      AND spec_id = NEW.spec_id
  ) THEN
    RAISE EXCEPTION 'HIERARCHY_VIOLATION: model_id (%) does not belong to spec_id (%). Please ensure the model is associated with the correct specification.', 
      NEW.model_id, 
      NEW.spec_id
      USING ERRCODE = 'check_violation';
  END IF;
  
  -- 所有驗證通過，允許操作
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- 添加函數註解
COMMENT ON FUNCTION check_vehicle_hierarchy() IS 
  '🔒 [ANALYZE-01] 階層一致性驗證函數：確保 vehicles 表中 brand → spec → model 的關聯正確';

-- ─────────────────────────────────────────────────────────────────────────────
-- 綁定觸發器至 vehicles 表
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_check_vehicle_hierarchy ON vehicles;

CREATE TRIGGER trigger_check_vehicle_hierarchy
  BEFORE INSERT OR UPDATE OF brand_id, spec_id, model_id
  ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION check_vehicle_hierarchy();

-- 添加觸發器註解
COMMENT ON TRIGGER trigger_check_vehicle_hierarchy ON vehicles IS 
  '🔒 [ANALYZE-01] 在新增或更新車輛時驗證 brand → spec → model 階層一致性';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Trade Requests 表階層一致性觸發器
-- ═══════════════════════════════════════════════════════════════════════════

/**
 * check_trade_request_hierarchy()
 * 
 * 功能：驗證 trade_requests 表中 target_brand_id → target_spec_id → target_model_id 的階層關聯
 * 觸發時機：INSERT 或 UPDATE 之前
 * 
 * 驗證規則（注意：spec_id 與 model_id 為選填）：
 *   1. 若有 target_spec_id，必須屬於 target_brand_id
 *   2. 若有 target_model_id，則 target_spec_id 必須存在
 *   3. 若有 target_model_id，必須屬於 target_spec_id
 * 
 * 錯誤代碼：HIERARCHY_VIOLATION
 */
CREATE OR REPLACE FUNCTION check_trade_request_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- ─────────────────────────────────────────────────────────────────────────
  -- 驗證 1: 若有 target_spec_id，必須屬於 target_brand_id
  -- ─────────────────────────────────────────────────────────────────────────
  IF NEW.target_spec_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM specs 
      WHERE id = NEW.target_spec_id 
        AND brand_id = NEW.target_brand_id
    ) THEN
      RAISE EXCEPTION 'HIERARCHY_VIOLATION: target_spec_id (%) does not belong to target_brand_id (%). Please ensure the specification is associated with the correct brand.', 
        NEW.target_spec_id, 
        NEW.target_brand_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  
  -- ─────────────────────────────────────────────────────────────────────────
  -- 驗證 2: 若有 target_model_id，必須先有 target_spec_id
  -- ─────────────────────────────────────────────────────────────────────────
  IF NEW.target_model_id IS NOT NULL THEN
    -- 檢查是否已設定 target_spec_id
    IF NEW.target_spec_id IS NULL THEN
      RAISE EXCEPTION 'HIERARCHY_VIOLATION: target_model_id requires target_spec_id to be set. Cannot specify a model without its parent specification.'
        USING ERRCODE = 'check_violation';
    END IF;
    
    -- ─────────────────────────────────────────────────────────────────────────
    -- 驗證 3: target_model_id 必須屬於 target_spec_id
    -- ─────────────────────────────────────────────────────────────────────────
    IF NOT EXISTS (
      SELECT 1 
      FROM models 
      WHERE id = NEW.target_model_id 
        AND spec_id = NEW.target_spec_id
    ) THEN
      RAISE EXCEPTION 'HIERARCHY_VIOLATION: target_model_id (%) does not belong to target_spec_id (%). Please ensure the model is associated with the correct specification.', 
        NEW.target_model_id, 
        NEW.target_spec_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  
  -- 所有驗證通過，允許操作
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- 添加函數註解
COMMENT ON FUNCTION check_trade_request_hierarchy() IS 
  '🔒 [ANALYZE-01] 階層一致性驗證函數：確保 trade_requests 表中 brand → spec → model 的關聯正確（spec/model 為選填）';

-- ─────────────────────────────────────────────────────────────────────────────
-- 綁定觸發器至 trade_requests 表
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_check_trade_request_hierarchy ON trade_requests;

CREATE TRIGGER trigger_check_trade_request_hierarchy
  BEFORE INSERT OR UPDATE OF target_brand_id, target_spec_id, target_model_id
  ON trade_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_trade_request_hierarchy();

-- 添加觸發器註解
COMMENT ON TRIGGER trigger_check_trade_request_hierarchy ON trade_requests IS 
  '🔒 [ANALYZE-01] 在新增或更新調做需求時驗證 brand → spec → model 階層一致性';


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 驗證測試 SQL（供手動測試使用，不會自動執行）
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 1: 跨品牌 INSERT 應被拒絕
-- 預期結果: ERROR: HIERARCHY_VIOLATION
-- ═══════════════════════════════════════════════════════════════════════════

-- 準備測試資料
INSERT INTO brands (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Toyota'),
  ('22222222-2222-2222-2222-222222222222', 'BMW');

INSERT INTO specs (id, brand_id, name) VALUES 
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Camry'),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '3 Series');

INSERT INTO models (id, spec_id, name) VALUES 
  ('cccc1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '2.5 Hybrid'),
  ('dddd2222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', '320i');

-- 測試：Toyota 品牌 + BMW 3 Series 規格（應失敗）
INSERT INTO vehicles (owner_dealer_id, brand_id, spec_id, model_id, year)
VALUES (
  'eeee1111-1111-1111-1111-111111111111',  -- 假設的 user_id
  '11111111-1111-1111-1111-111111111111',  -- Toyota
  'bbbb2222-2222-2222-2222-222222222222',  -- BMW 3 Series (錯誤!)
  'dddd2222-2222-2222-2222-222222222222',  -- 320i
  2024
);
-- 預期錯誤: HIERARCHY_VIOLATION: spec_id does not belong to brand_id

-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 2: 正確階層 INSERT 應成功
-- 預期結果: INSERT 成功
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO vehicles (owner_dealer_id, brand_id, spec_id, model_id, year)
VALUES (
  'eeee1111-1111-1111-1111-111111111111',  -- 假設的 user_id
  '11111111-1111-1111-1111-111111111111',  -- Toyota
  'aaaa1111-1111-1111-1111-111111111111',  -- Camry (正確!)
  'cccc1111-1111-1111-1111-111111111111',  -- 2.5 Hybrid (正確!)
  2024
);
-- 預期結果: INSERT 成功

-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 3: UPDATE 時觸發驗證
-- 預期結果: ERROR: HIERARCHY_VIOLATION
-- ═══════════════════════════════════════════════════════════════════════════

-- 嘗試將車輛的 spec_id 改為不相容的值
UPDATE vehicles 
SET spec_id = 'bbbb2222-2222-2222-2222-222222222222'  -- BMW 3 Series (與 Toyota 不相容)
WHERE brand_id = '11111111-1111-1111-1111-111111111111';
-- 預期錯誤: HIERARCHY_VIOLATION: spec_id does not belong to brand_id

-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 4: trade_requests 有 model 但無 spec（應失敗）
-- 預期結果: ERROR: HIERARCHY_VIOLATION
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO trade_requests (dealer_id, target_brand_id, target_spec_id, target_model_id, contact_info, expires_at)
VALUES (
  'eeee1111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',  -- Toyota
  NULL,                                      -- 無 spec (錯誤!)
  'cccc1111-1111-1111-1111-111111111111',  -- 2.5 Hybrid
  '0912-345-678',
  NOW() + INTERVAL '7 days'
);
-- 預期錯誤: HIERARCHY_VIOLATION: target_model_id requires target_spec_id to be set

-- ═══════════════════════════════════════════════════════════════════════════
-- 測試案例 5: trade_requests 僅有 brand（應成功，因為 spec/model 選填）
-- 預期結果: INSERT 成功
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO trade_requests (dealer_id, target_brand_id, target_spec_id, target_model_id, contact_info, expires_at)
VALUES (
  'eeee1111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',  -- Toyota
  NULL,                                      -- 無 spec (OK)
  NULL,                                      -- 無 model (OK)
  '0912-345-678',
  NOW() + INTERVAL '7 days'
);
-- 預期結果: INSERT 成功

*/

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 完成
-- ═══════════════════════════════════════════════════════════════════════════
