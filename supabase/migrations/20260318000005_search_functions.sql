-- ═══════════════════════════════════════════════════════════════════════════════
-- 發財B平台 - 字典搜尋函數
-- 檔案: supabase/migrations/20260318000005_search_functions.sql
-- 版本: 1.0.0
-- 建立日期: 2026-03-19
-- 
-- 功能說明:
--   1. 提供品牌/規格/車型的模糊搜尋功能
--   2. 支援中英文搜尋
--   3. 使用 pg_trgm 擴充優化搜尋效能
--
-- 相依性:
--   - 必須先執行 20260318000001_init_schema.sql (建立字典表與 pg_trgm 擴充)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: 品牌搜尋函數
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: search_brands
-- 說明: 模糊搜尋品牌名稱
-- 參數:
--   - search_term: 搜尋關鍵字
--   - limit_count: 最大回傳筆數 (預設 20)
-- 回傳: 品牌資料表
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_brands(
  search_term TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  sort_order INTEGER,
  is_active BOOLEAN,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 若搜尋詞為空，回傳所有啟用的品牌
  IF search_term IS NULL OR TRIM(search_term) = '' THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.name,
      b.sort_order,
      b.is_active,
      1.0::REAL AS similarity_score
    FROM public.brands b
    WHERE b.is_active = true
    ORDER BY b.sort_order ASC, b.name ASC
    LIMIT limit_count;
    RETURN;
  END IF;
  
  -- 模糊搜尋
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.sort_order,
    b.is_active,
    similarity(b.name, search_term) AS similarity_score
  FROM public.brands b
  WHERE b.is_active = true
    AND (
      b.name ILIKE '%' || search_term || '%'
      OR similarity(b.name, search_term) > 0.1
    )
  ORDER BY 
    similarity(b.name, search_term) DESC,
    b.sort_order ASC,
    b.name ASC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_brands(TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.search_brands(TEXT, INTEGER) IS
  '模糊搜尋品牌名稱。支援中英文搜尋。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: 規格搜尋函數
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: search_specs
-- 說明: 模糊搜尋規格名稱（可限定品牌）
-- 參數:
--   - search_term: 搜尋關鍵字
--   - filter_brand_id: 限定品牌 ID (選填)
--   - limit_count: 最大回傳筆數 (預設 50)
-- 回傳: 規格資料表
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_specs(
  search_term TEXT DEFAULT NULL,
  filter_brand_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  brand_id UUID,
  brand_name VARCHAR(100),
  name VARCHAR(100),
  sort_order INTEGER,
  is_active BOOLEAN,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 若搜尋詞為空，回傳所有啟用的規格（可限定品牌）
  IF search_term IS NULL OR TRIM(search_term) = '' THEN
    RETURN QUERY
    SELECT 
      s.id,
      s.brand_id,
      b.name AS brand_name,
      s.name,
      s.sort_order,
      s.is_active,
      1.0::REAL AS similarity_score
    FROM public.specs s
    JOIN public.brands b ON b.id = s.brand_id
    WHERE s.is_active = true
      AND b.is_active = true
      AND (filter_brand_id IS NULL OR s.brand_id = filter_brand_id)
    ORDER BY b.sort_order ASC, s.sort_order ASC, s.name ASC
    LIMIT limit_count;
    RETURN;
  END IF;
  
  -- 模糊搜尋
  RETURN QUERY
  SELECT 
    s.id,
    s.brand_id,
    b.name AS brand_name,
    s.name,
    s.sort_order,
    s.is_active,
    similarity(s.name, search_term) AS similarity_score
  FROM public.specs s
  JOIN public.brands b ON b.id = s.brand_id
  WHERE s.is_active = true
    AND b.is_active = true
    AND (filter_brand_id IS NULL OR s.brand_id = filter_brand_id)
    AND (
      s.name ILIKE '%' || search_term || '%'
      OR similarity(s.name, search_term) > 0.1
    )
  ORDER BY 
    similarity(s.name, search_term) DESC,
    b.sort_order ASC,
    s.sort_order ASC,
    s.name ASC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_specs(TEXT, UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.search_specs(TEXT, UUID, INTEGER) IS
  '模糊搜尋規格名稱。可限定品牌篩選。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: 車型搜尋函數
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: search_models
-- 說明: 模糊搜尋車型名稱（可限定規格）
-- 參數:
--   - search_term: 搜尋關鍵字
--   - filter_spec_id: 限定規格 ID (選填)
--   - limit_count: 最大回傳筆數 (預設 100)
-- 回傳: 車型資料表
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_models(
  search_term TEXT DEFAULT NULL,
  filter_spec_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  spec_id UUID,
  spec_name VARCHAR(100),
  brand_id UUID,
  brand_name VARCHAR(100),
  name VARCHAR(100),
  sort_order INTEGER,
  is_active BOOLEAN,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 若搜尋詞為空，回傳所有啟用的車型（可限定規格）
  IF search_term IS NULL OR TRIM(search_term) = '' THEN
    RETURN QUERY
    SELECT 
      m.id,
      m.spec_id,
      s.name AS spec_name,
      s.brand_id,
      b.name AS brand_name,
      m.name,
      m.sort_order,
      m.is_active,
      1.0::REAL AS similarity_score
    FROM public.models m
    JOIN public.specs s ON s.id = m.spec_id
    JOIN public.brands b ON b.id = s.brand_id
    WHERE m.is_active = true
      AND s.is_active = true
      AND b.is_active = true
      AND (filter_spec_id IS NULL OR m.spec_id = filter_spec_id)
    ORDER BY b.sort_order ASC, s.sort_order ASC, m.sort_order ASC, m.name ASC
    LIMIT limit_count;
    RETURN;
  END IF;
  
  -- 模糊搜尋
  RETURN QUERY
  SELECT 
    m.id,
    m.spec_id,
    s.name AS spec_name,
    s.brand_id,
    b.name AS brand_name,
    m.name,
    m.sort_order,
    m.is_active,
    similarity(m.name, search_term) AS similarity_score
  FROM public.models m
  JOIN public.specs s ON s.id = m.spec_id
  JOIN public.brands b ON b.id = s.brand_id
  WHERE m.is_active = true
    AND s.is_active = true
    AND b.is_active = true
    AND (filter_spec_id IS NULL OR m.spec_id = filter_spec_id)
    AND (
      m.name ILIKE '%' || search_term || '%'
      OR similarity(m.name, search_term) > 0.1
    )
  ORDER BY 
    similarity(m.name, search_term) DESC,
    b.sort_order ASC,
    s.sort_order ASC,
    m.sort_order ASC,
    m.name ASC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_models(TEXT, UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.search_models(TEXT, UUID, INTEGER) IS
  '模糊搜尋車型名稱。可限定規格篩選。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: 階層式字典查詢函數
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- 函數: get_brand_hierarchy
-- 說明: 取得指定品牌的完整階層結構 (品牌 -> 規格 -> 車型)
-- 參數:
--   - target_brand_id: 品牌 ID
-- 回傳: 完整階層 JSON
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_brand_hierarchy(target_brand_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'sort_order', b.sort_order,
    'specs', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'sort_order', s.sort_order,
            'models', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', m.id,
                    'name', m.name,
                    'sort_order', m.sort_order
                  ) ORDER BY m.sort_order, m.name
                )
                FROM public.models m
                WHERE m.spec_id = s.id AND m.is_active = true
              ),
              '[]'::jsonb
            )
          ) ORDER BY s.sort_order, s.name
        )
        FROM public.specs s
        WHERE s.brand_id = b.id AND s.is_active = true
      ),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.brands b
  WHERE b.id = target_brand_id AND b.is_active = true;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_brand_hierarchy(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_brand_hierarchy(UUID) IS
  '取得指定品牌的完整階層結構 (品牌 -> 規格 -> 車型)。';

-- -----------------------------------------------------------------------------
-- 函數: get_all_brands_simple
-- 說明: 取得所有啟用的品牌（簡易版，不含階層）
-- 回傳: 品牌陣列
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_all_brands_simple()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'name', b.name,
          'sort_order', b.sort_order
        ) ORDER BY b.sort_order, b.name
      )
      FROM public.brands b
      WHERE b.is_active = true
    ),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_brands_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_brands_simple() TO anon;

COMMENT ON FUNCTION public.get_all_brands_simple() IS
  '取得所有啟用的品牌列表（簡易版）。';

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: 測試 SQL
-- ═══════════════════════════════════════════════════════════════════════════════

/*
═══════════════════════════════════════════════════════════════════════════════
🧪 測試案例
═══════════════════════════════════════════════════════════════════════════════

-- 測試 1: 搜尋品牌
SELECT * FROM public.search_brands('Toyota');
SELECT * FROM public.search_brands('豐田');
SELECT * FROM public.search_brands(NULL);  -- 回傳所有品牌

-- 測試 2: 搜尋規格（限定品牌）
SELECT * FROM public.search_specs('Camry', (SELECT id FROM brands WHERE name = 'Toyota'));
SELECT * FROM public.search_specs(NULL, (SELECT id FROM brands WHERE name = 'Toyota'));

-- 測試 3: 搜尋車型（限定規格）
SELECT * FROM public.search_models('Hybrid');

-- 測試 4: 取得品牌階層
SELECT public.get_brand_hierarchy((SELECT id FROM brands WHERE name = 'Toyota'));

-- 測試 5: 取得所有品牌
SELECT public.get_all_brands_simple();

═══════════════════════════════════════════════════════════════════════════════
*/
