-- =============================================
-- 修復 trade_requests 舊資料髒值（品牌/車型缺失）
-- Migration: 20260328000001_fix_trade_request_bad_data.sql
-- =============================================

BEGIN;

-- 1) 建立通用品牌：Other（啟用）
INSERT INTO public.brands (name, sort_order, is_active)
VALUES ('Other', 9999, true)
ON CONFLICT (name) DO UPDATE
SET is_active = true;

-- 2) 在 Other 品牌下建立通用規格
WITH other_brand AS (
  SELECT id FROM public.brands WHERE name = 'Other' LIMIT 1
)
INSERT INTO public.specs (brand_id, name, sort_order, is_active)
SELECT id, 'Other', 9999, true
FROM other_brand
ON CONFLICT (brand_id, name) DO UPDATE
SET is_active = true;

-- 3) 在 Other 規格下建立通用車型
WITH other_brand AS (
  SELECT id FROM public.brands WHERE name = 'Other' LIMIT 1
),
other_spec AS (
  SELECT s.id
  FROM public.specs s
  JOIN other_brand b ON s.brand_id = b.id
  WHERE s.name = 'Other'
  LIMIT 1
)
INSERT INTO public.models (spec_id, name, sort_order, is_active)
SELECT id, 'Other', 9999, true
FROM other_spec
ON CONFLICT (spec_id, name) DO UPDATE
SET is_active = true;

-- 4) 回填 trade_requests：品牌/規格/車型缺失的舊資料
WITH fallback_ids AS (
  SELECT
    b.id AS other_brand_id,
    s.id AS other_spec_id,
    m.id AS other_model_id
  FROM public.brands b
  JOIN public.specs s ON s.brand_id = b.id AND s.name = 'Other'
  JOIN public.models m ON m.spec_id = s.id AND m.name = 'Other'
  WHERE b.name = 'Other'
  LIMIT 1
)
UPDATE public.trade_requests tr
SET
  target_brand_id = COALESCE(tr.target_brand_id, f.other_brand_id),
  target_spec_id = COALESCE(
    tr.target_spec_id,
    -- 若既有 model 存在，優先回填對應 spec
    (SELECT mm.spec_id FROM public.models mm WHERE mm.id = tr.target_model_id),
    f.other_spec_id
  ),
  target_model_id = COALESCE(tr.target_model_id, f.other_model_id)
FROM fallback_ids f
WHERE
  tr.target_brand_id IS NULL
  OR tr.target_model_id IS NULL
  OR tr.target_spec_id IS NULL;

-- 5) 強化欄位完整性約束
ALTER TABLE public.trade_requests
  ALTER COLUMN target_brand_id SET NOT NULL,
  ALTER COLUMN target_model_id SET NOT NULL;

COMMIT;
