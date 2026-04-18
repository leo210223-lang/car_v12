# 發財B平台 - 規格分析報告

**報告編號**: ANALYZE-01  
**分析日期**: 2026-03-18  
**分析對象**: `data-model.md` v1.0.0 + `tasks.md` v1.0.0  
**分析師**: GitHub Copilot

---

## 一、執行摘要

本報告針對「發財B平台」的資料模型設計與開發任務清單進行深度分析，識別潛在風險、設計缺陷與改進建議。

### 整體評估

| 維度 | 評分 | 說明 |
|------|------|------|
| 資料模型完整性 | ⭐⭐⭐⭐☆ (85%) | 核心實體完整，部分邊界情況未處理 |
| RLS 安全性 | ⭐⭐⭐⭐☆ (80%) | 主要政策完善，存在 3 個潛在漏洞 |
| 任務顆粒度 | ⭐⭐⭐⭐⭐ (95%) | 極細拆解，每步可驗證 |
| 可擴展性 | ⭐⭐⭐☆☆ (70%) | 部分設計限制未來擴展 |
| 一致性 | ⭐⭐⭐⭐☆ (85%) | 命名規範良好，少數不一致 |

---

## 二、資料模型分析

### 2.1 結構性問題

#### 🔴 **問題 1: `vehicles` 表缺少一致性約束**

**位置**: `data-model.md` - Section 2.5

**問題描述**:  
`vehicles` 表的 `brand_id`, `spec_id`, `model_id` 三者之間缺乏資料庫層級的一致性約束。理論上：
- `spec_id` 必須屬於 `brand_id` 指定的品牌
- `model_id` 必須屬於 `spec_id` 指定的規格

**現況**:
```sql
brand_id UUID NOT NULL REFERENCES brands(id),
spec_id UUID NOT NULL REFERENCES specs(id),
model_id UUID NOT NULL REFERENCES models(id),
```

**風險**: 應用層 Bug 可能導致 Toyota 品牌的車輛關聯到 BMW 的規格。

**建議修復**:
```sql
-- 新增 CHECK 約束或觸發器
CREATE OR REPLACE FUNCTION check_vehicle_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM specs WHERE id = NEW.spec_id AND brand_id = NEW.brand_id
  ) THEN
    RAISE EXCEPTION 'spec_id does not belong to brand_id';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM models WHERE id = NEW.model_id AND spec_id = NEW.spec_id
  ) THEN
    RAISE EXCEPTION 'model_id does not belong to spec_id';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_vehicle_hierarchy
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION check_vehicle_hierarchy();
```

**影響任務**: P1-T01 (Task 1.1.6)

---

#### 🔴 **問題 2: `trade_requests` 同樣缺少階層一致性約束**

**位置**: `data-model.md` - Section 2.6

**問題描述**:  
`trade_requests` 的 `target_brand_id`, `target_spec_id`, `target_model_id` 同樣缺乏一致性驗證。

**建議**: 複製相同的觸發器模式。

**影響任務**: P1-T01 (Task 1.1.7)

---

#### 🟡 **問題 3: `images` JSONB 欄位缺乏結構驗證**

**位置**: `data-model.md` - Section 2.5

**問題描述**:
```sql
images JSONB NOT NULL DEFAULT '[]',  -- 圖片 URL 陣列
```

缺乏 JSON Schema 驗證，可能存入無效結構。

**建議修復**:
```sql
-- 新增 CHECK 約束
ALTER TABLE vehicles ADD CONSTRAINT chk_images_array 
  CHECK (jsonb_typeof(images) = 'array');

-- 或更嚴格的驗證
ALTER TABLE vehicles ADD CONSTRAINT chk_images_structure
  CHECK (
    jsonb_typeof(images) = 'array' 
    AND (
      jsonb_array_length(images) = 0 
      OR jsonb_typeof(images->0) = 'string'
    )
  );
```

**影響任務**: P1-T01 (Task 1.1.6)

---

#### 🟡 **問題 4: 缺少 `vehicles.mileage` 里程欄位**

**位置**: `data-model.md` - Section 2.5

**問題描述**:  
二手車交易平台通常需要記錄里程數，但資料模型中缺少此欄位。

**建議修復**:
```sql
mileage INTEGER CHECK (mileage IS NULL OR mileage >= 0),
```

**影響**: 可能需要在 Phase 1 完成後追加 Migration。

---

#### 🟢 **問題 5: `audit_logs.user_id` 應為可空**

**位置**: `data-model.md` - Section 2.9

**問題描述**:
```sql
user_id UUID NOT NULL REFERENCES users(id),
```

某些系統操作（如 Cron Job 清理孤兒圖片）沒有明確的 user_id。

**建議修復**:
```sql
user_id UUID REFERENCES users(id),  -- 移除 NOT NULL
```

**影響任務**: P2-T13 (Task 2.13.8 ~ 2.13.10)

---

### 2.2 索引優化建議

#### 🟡 **建議 1: 複合索引優化搜尋效能**

**現況**: 單欄位索引
```sql
CREATE INDEX idx_vehicles_brand ON vehicles(brand_id) WHERE status = 'approved';
CREATE INDEX idx_vehicles_spec ON vehicles(spec_id) WHERE status = 'approved';
CREATE INDEX idx_vehicles_year ON vehicles(year) WHERE status = 'approved';
```

**建議**: 新增複合索引支援常見查詢模式
```sql
-- 品牌 + 年份範圍查詢
CREATE INDEX idx_vehicles_brand_year ON vehicles(brand_id, year DESC) 
  WHERE status = 'approved';

-- 完整階梯式選單查詢
CREATE INDEX idx_vehicles_cascade ON vehicles(brand_id, spec_id, model_id, year DESC) 
  WHERE status = 'approved';
```

---

#### 🟡 **建議 2: 新增 `listing_price` 索引**

價格篩選是常見操作，但缺少對應索引。

```sql
CREATE INDEX idx_vehicles_price ON vehicles(listing_price) 
  WHERE status = 'approved' AND listing_price IS NOT NULL;
```

---

## 三、RLS 安全性分析

### 3.1 潛在安全漏洞

#### 🔴 **漏洞 1: `vehicles_public` VIEW 繞過 RLS**

**位置**: `data-model.md` - Section 3.2

**問題描述**:
```sql
CREATE VIEW public.vehicles_public AS
SELECT 
  ...
  CASE WHEN owner_dealer_id = auth.uid() THEN acquisition_cost ELSE NULL END AS acquisition_cost,
  ...
FROM vehicles;
```

此 VIEW 定義在 `public` schema，預設可被任何人存取。如果 API 端點直接查詢此 VIEW 而非透過 RLS 保護的 `vehicles` 表，可能暴露不必要的資料。

**風險等級**: 中

**建議修復**:
```sql
-- 方案 1: 為 VIEW 設定權限
GRANT SELECT ON vehicles_public TO authenticated;
REVOKE SELECT ON vehicles_public FROM anon;

-- 方案 2: 使用安全性強化的 VIEW
CREATE VIEW public.vehicles_public WITH (security_invoker = true) AS
...
```

**影響任務**: P1-T03 (Task 1.3.10)

---

#### 🔴 **漏洞 2: Admin 角色判斷依賴 JWT 未驗證**

**位置**: `data-model.md` - 多處 RLS 政策

**問題描述**:
```sql
USING (auth.jwt()->>'role' = 'admin');
```

此檢查直接信任 JWT 中的 `role` 欄位。如果 JWT 簽名密鑰洩露，攻擊者可偽造 Admin 身份。

**風險等級**: 中（依賴 Supabase 密鑰管理）

**建議**: 
1. 確保 `SUPABASE_JWT_SECRET` 妥善保管
2. 考慮在關鍵操作中二次驗證（如查詢 `users` 表確認角色）

---

#### 🟡 **漏洞 3: `dictionary_requests` 缺少 INSERT 政策**

**位置**: `data-model.md` - Section 2.7（RLS 未定義）

**問題描述**:  
`dictionary_requests` 表在資料模型中定義，但 RLS 政策區段未完整列出。

**預期政策**:
```sql
-- 啟用 RLS
ALTER TABLE dictionary_requests ENABLE ROW LEVEL SECURITY;

-- 用戶可新增申請
CREATE POLICY "Users can insert dictionary requests"
ON dictionary_requests FOR INSERT
WITH CHECK (auth.uid() = dealer_id);

-- 用戶可查看自己的申請
CREATE POLICY "Users can view own requests"
ON dictionary_requests FOR SELECT
USING (auth.uid() = dealer_id);

-- Admin 可查看所有申請
CREATE POLICY "Admins can view all requests"
ON dictionary_requests FOR SELECT
USING (auth.jwt()->>'role' = 'admin');

-- Admin 可更新申請（審核）
CREATE POLICY "Admins can update requests"
ON dictionary_requests FOR UPDATE
USING (auth.jwt()->>'role' = 'admin');
```

**影響任務**: P1-T03 (Task 1.3.14)

---

### 3.2 RLS 政策衝突檢測

| 表名 | SELECT 政策數 | 潛在衝突 | 說明 |
|------|--------------|----------|------|
| vehicles | 3 | ⚠️ 可能 | 公開查看 + 擁有者查看 + Admin 查看可能重疊 |
| trade_requests | 3 | ✅ 無 | 政策條件互斥 |
| users | 2 | ✅ 無 | 條件互斥（uid vs admin role） |

**vehicles 政策衝突分析**:

當 Admin 同時是車輛擁有者時，三個 SELECT 政策都會匹配。PostgreSQL RLS 使用 OR 邏輯合併，這不會造成安全問題，但可能影響效能（多次計算）。

**建議**: 無需修改，但在文件中註明此行為。

---

## 四、任務清單分析

### 4.1 任務相依性問題

#### 🟡 **問題 1: 缺少明確的 Supabase CLI 安裝任務**

**位置**: `tasks.md` - Phase 1

**問題描述**:  
任務假設開發環境已安裝 Supabase CLI，但未在任務清單中明確列出。

**建議**: 在 P1-T01 前新增任務：
```
| 1.0.1 | 安裝 Supabase CLI | `npx supabase --version` 顯示版本號 |
| 1.0.2 | 初始化 Supabase 專案 | `supabase init` 建立 `supabase/` 目錄 |
| 1.0.3 | 連接 Supabase 專案 | `supabase link --project-ref <ref>` |
```

---

#### 🟡 **問題 2: 前後端環境變數同步**

**位置**: `tasks.md` - P2-T02, P3-T01

**問題描述**:  
後端 (P2-T02) 和前端 (P3-T01) 各自定義 `.env.example`，但缺少確保兩者 `SUPABASE_URL` 一致的驗證任務。

**建議**: 新增驗證任務或共用環境變數來源（如 `.env.shared`）。

---

#### 🟡 **問題 3: Redis 可選性未明確處理**

**位置**: `tasks.md` - P2-T02, P2-T04

**問題描述**:  
P2-T02 提到 Redis「連線失敗時 graceful fallback」，但未明確說明 fallback 行為（例如使用記憶體 Store）。

**建議**: 在 P2-T04 新增任務：
```
| 2.4.8 | 無 Redis 時使用 MemoryStore | `REDIS_URL` 未設定時使用記憶體限流 |
```

---

### 4.2 任務完整性檢查

| Phase | 預期任務數 | 實際任務數 | 覆蓋率 |
|-------|-----------|-----------|--------|
| Phase 1 (資料層) | 6 | 6 | 100% |
| Phase 2 (邏輯層) | 13 | 13 | 100% |
| Phase 3 (介面層) | 13 | 13 | 100% |

**遺漏功能檢測**:

| 功能 | data-model.md | tasks.md | 狀態 |
|------|--------------|----------|------|
| 車輛階層一致性驗證 | ❌ 未定義 | ❌ 未涵蓋 | 🔴 缺失 |
| 里程數欄位 | ❌ 未定義 | ❌ 未涵蓋 | 🟡 可選 |
| 圖片數量上限驗證（DB 層） | ❌ 未定義 | ✅ 前端驗證 | 🟡 建議補充 |
| 停權用戶登入阻擋 | ❌ 未定義 | ❌ 未涵蓋 | 🔴 缺失 |

---

### 4.3 驗收標準 (AC) 品質評估

| 評估項目 | 符合比例 | 說明 |
|----------|---------|------|
| 可測試性 | 95% | 絕大多數 AC 可透過自動化測試驗證 |
| 明確性 | 90% | 少數 AC 使用模糊詞彙（如「正確」） |
| 完整性 | 85% | 部分任務缺少錯誤情境的 AC |

**需改進的 AC 範例**:

| 任務 | 現有 AC | 建議改進 |
|------|---------|---------|
| 2.6.8 | 非擁有者查看時過濾成本欄位 | 非擁有者 GET /api/vehicles/:id 回應中 `acquisition_cost=null`, `repair_cost=null` |
| 2.9.3 | 排除已停權車行的需求 | GET /api/trades 不回傳 `users.status='suspended'` 的車行需求 |
| 3.6.7 | 價格為 null 顯示「洽詢」 | `listing_price=null` 時 VehicleCard 顯示文字「洽詢」 |

---

## 五、效能風險分析

### 5.1 查詢效能熱點

| 查詢模式 | 預估頻率 | 風險 | 建議 |
|----------|---------|------|------|
| 尋車列表（多條件篩選） | 極高 | 🔴 高 | 確保複合索引涵蓋常見組合 |
| 盤車列表（含車行 JOIN） | 高 | 🟡 中 | 預先計算或快取車行狀態 |
| 搜尋建議（pg_trgm） | 高 | 🟡 中 | 限制回傳數量 + 設定相似度閾值 |
| 待審核車輛計數 | 低 | 🟢 低 | Admin 專用，可接受 |

### 5.2 N+1 查詢風險

**高風險端點**:

1. `GET /api/vehicles` - 需載入品牌/規格/車型名稱
2. `GET /api/trades` - 需載入車行資訊 + 品牌/規格/車型名稱

**建議**: 使用 JOIN 或 Supabase 的 `select('*, brands(*), specs(*), models(*)')` 語法。

---

## 六、建議行動項目

### 🔴 Critical (阻擋上線)

| # | 項目 | 影響範圍 | 建議解決時機 |
|---|------|---------|-------------|
| 1 | 新增車輛階層一致性觸發器 | P1-T01 | Phase 1 開發時 |
| 2 | 補充 `dictionary_requests` RLS 政策 | P1-T03 | Phase 1 開發時 |
| 3 | 新增停權用戶登入阻擋機制 | P2-T03 | Phase 2 開發時 |

### 🟡 High (建議修復)

| # | 項目 | 影響範圍 | 建議解決時機 |
|---|------|---------|-------------|
| 4 | `images` JSONB 結構驗證 | P1-T01 | Phase 1 開發時 |
| 5 | `audit_logs.user_id` 改為可空 | P2-T13 | Phase 2 開發時 |
| 6 | 新增複合索引優化查詢 | P1-T02 | Phase 1 開發時 |
| 7 | Redis fallback 行為明確化 | P2-T04 | Phase 2 開發時 |

### 🟢 Nice to Have (可延後)

| # | 項目 | 影響範圍 | 建議解決時機 |
|---|------|---------|-------------|
| 8 | 新增里程數欄位 | P1-T01 | Phase 1 或後續迭代 |
| 9 | 圖片數量 DB 層驗證 | P1-T01 | 可僅依賴前端驗證 |
| 10 | VIEW 權限強化 | P1-T03 | Phase 1 開發時 |

---

## 七、風險矩陣

```
影響程度
    ↑
高  │ [3]停權登入  [1]階層一致性
    │
中  │ [6]索引優化  [2]RLS補充  [4]JSONB驗證
    │
低  │ [8]里程欄位  [9]圖片數量驗證
    │
    └─────────────────────────────────→ 發生機率
         低            中           高
```

---

## 八、結論

### 整體評估

發財B平台的資料模型設計整體良好，核心實體關係清晰，RLS 政策涵蓋主要安全需求。任務清單顆粒度極細，可執行性高。

### 主要風險

1. **資料完整性**: 車輛階層缺乏 DB 層驗證，依賴應用層正確性
2. **安全性**: 停權用戶可能仍能登入系統（需在 Auth Hook 或中間件處理）
3. **效能**: 複雜查詢缺少最佳化索引

### 建議優先級

1. **立即處理**: 問題 1, 2, 3（阻擋上線）
2. **Phase 1 期間**: 問題 4, 5, 6
3. **Phase 2 期間**: 問題 7
4. **未來迭代**: 問題 8, 9, 10

---

**報告結束**

---

*此報告由 GitHub Copilot 自動產生，建議由資深工程師複審後採納建議。*
