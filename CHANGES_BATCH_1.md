# v12 功能擴充 — 第 1 批：DB + 後端

> 本檔記錄本次修改的完整變更，供下次 AI 或工程師快速了解現況、不要重複已完成的工作。

---

## 🎯 需求對照表

| # | 需求 | 第 1 批提供 | 後續批次 |
|---|------|------------|---------|
| 1 | 車輛成本 + 整備費細項做帳 | ✅ DB + Service + Route | 前端 UI（第 2 批） |
| 2 | 可盤徽章 + 盤價 | ✅ DB + Service + Route | 前端 UI（第 2 批）+ admin 取消按鈕（第 3 批） |
| 3 | 下架 30 天自動刪除 + 營收 | ✅ DB + Service + Cron Job | 前端列表（第 3 批） |
| 4 | 找不到車輛→管理員代上傳 | ✅ DB + Service + Route | 前端申請表單（第 2 批）+ admin 審核頁（第 3 批） |
| 5 | 管理員上傳名片 | ✅ DB + Service + Route | admin UI（第 3 批） |
| 6 | 看所有車（簡單列表） | — | 前端新頁面 + BottomNav 入口（第 2 批） |
| 7 | 點數機制 | ✅ Service + Route | 車行讀取（第 2 批）+ admin 調整（第 3 批） |

---

## 📦 本批新增/修改的檔案

### 🗄️ SQL Migration（新建）

```
supabase/migrations/20260418000001_v12_features.sql
```

**內容**：
1. `vehicles` 新增欄位：`is_tradable BOOLEAN`、`trade_price INTEGER`、`archived_at TIMESTAMP`
2. `vehicles` 新增 trigger `sync_vehicle_archived_at`：狀態變 archived 時自動寫 archived_at；反之清空
3. `vehicles` 新增索引：`idx_vehicles_tradable`、`idx_vehicles_archived_at`
4. 新表：`vehicle_expenses`（整備費細項）
5. 新表：`revenue_records`（營收紀錄，含 vehicle_snapshot 快照）
6. 新表：`manual_vehicle_requests`（找不到車輛→代上傳）
7. `users` 新增：`business_card_url`（名片）、`credits`（點數；已存在則略過）+ `chk_credits_non_negative`

> **執行方式**：在 Supabase Dashboard SQL Editor 貼上執行，或用 `supabase db push`。所有建表/加欄位都有 `IF NOT EXISTS`，可安全重跑。

### 🔧 Backend（新建檔案）

```
backend/src/types/v12.ts
backend/src/utils/validation.v12.ts

backend/src/services/vehicle-expense.service.ts
backend/src/services/vehicle-tradable.service.ts
backend/src/services/manual-vehicle-request.service.ts
backend/src/services/credits.service.ts
backend/src/services/revenue.service.ts
backend/src/services/business-card.service.ts

backend/src/cron/jobs/settle-archived-vehicles.ts

backend/src/routes/vehicles/expenses.ts
backend/src/routes/vehicles/tradable.ts
backend/src/routes/manual-vehicle-requests.ts
backend/src/routes/admin/manual-vehicle-requests.ts
backend/src/routes/admin/credits.ts
backend/src/routes/admin/revenue.ts
backend/src/routes/admin/vehicles-tradable.ts
backend/src/routes/admin/business-cards.ts
```

### 🔄 Backend（修改既有檔案 — 整檔替換）

| 原檔 | 修改內容 |
|------|---------|
| `backend/src/cron/index.ts` | 掛上 `settleArchivedVehiclesJob`（每日 05:00） |
| `backend/src/routes/index.ts` | 掛上 `/api/v1/manual-vehicle-requests` |
| `backend/src/routes/admin/index.ts` | 掛上 5 個新 admin 子路由 |
| `backend/src/routes/vehicles/index.ts` | 掛上 `/vehicles/:vehicleId/expenses` + `/vehicles/:vehicleId/tradable` 子路由 |
| `backend/src/routes/users.ts` | select 多帶 credits/business_card_url；新增 `GET /users/me/credits` |

> `backend/src/services/vehicle.service.ts` **無須修改** — 因用 `SELECT *`，新欄位（is_tradable、trade_price、archived_at）會自動帶回。

---

## 🛰️ 新增的 API 端點總表

### 會員端（/api/v1/）

| Method | Path | 說明 |
|--------|------|------|
| GET | `/users/me/credits` | 查詢自己的點數 |
| GET | `/users/me` | （已更新）回傳會多帶 `credits`、`business_card_url` |
| GET | `/vehicles/:vehicleId/expenses` | 取得某台車整備費細項（含 total） |
| POST | `/vehicles/:vehicleId/expenses` | 新增一筆整備費 |
| PUT | `/vehicles/:vehicleId/expenses/:expenseId` | 更新某筆 |
| DELETE | `/vehicles/:vehicleId/expenses/:expenseId` | 刪除某筆 |
| PUT | `/vehicles/:vehicleId/tradable` | 切換是否可盤 + 盤價 |
| POST | `/manual-vehicle-requests` | 「找不到車輛」送交管理員代上傳 |
| GET | `/manual-vehicle-requests/mine` | 查自己的代上傳申請 |

### 管理員端（/api/v1/admin/）

| Method | Path | 說明 |
|--------|------|------|
| GET | `/admin/manual-vehicle-requests` | 列出代上傳申請（可 status 過濾） |
| GET | `/admin/manual-vehicle-requests/:id` | 單筆詳情 |
| POST | `/admin/manual-vehicle-requests/:id/approve` | 核准並代建車輛（需傳 brand_id/spec_id/model_id/year） |
| POST | `/admin/manual-vehicle-requests/:id/reject` | 拒絕（需傳 reason） |
| GET | `/admin/credits/:userId` | 查某會員點數 |
| PUT | `/admin/credits/:userId` | 直接設定某會員點數 |
| GET | `/admin/revenue` | 查全部營收紀錄（可 owner_id 篩選） |
| POST | `/admin/revenue/settle/:vehicleId` | 手動結算某台已 archived 車（偵錯/補救用） |
| POST | `/admin/vehicles-tradable/:vehicleId/cancel` | 取消某台車的可盤狀態 |
| POST | `/admin/business-cards/:userId` | 上傳名片（multipart/form-data, field=card） |
| DELETE | `/admin/business-cards/:userId` | 刪除名片 |

---

## 🧾 資料庫 Schema 摘要

### `vehicle_expenses`
```
id              UUID PK
vehicle_id      UUID FK → vehicles (ON DELETE CASCADE)
owner_dealer_id UUID FK → users    (ON DELETE CASCADE)
item_name       VARCHAR(100) NOT NULL  -- 例：洗車、鍍膜
amount          INTEGER NOT NULL CHECK (amount >= 0)
note            TEXT
expense_date    DATE NOT NULL DEFAULT CURRENT_DATE
created_at / updated_at
```

### `revenue_records`
```
id               UUID PK
vehicle_id       UUID (no FK — 車輛結算後會被刪除)
owner_dealer_id  UUID FK → users (ON DELETE SET NULL)
vehicle_snapshot JSONB NOT NULL   -- { brand_name, spec_name, model_name, year, images, ... }
listing_price    INTEGER
acquisition_cost INTEGER
repair_cost_base INTEGER          -- vehicles.repair_cost 欄位值（舊欄位）
expenses_total   INTEGER          -- 所有 vehicle_expenses 加總
total_cost       INTEGER          -- acquisition_cost + repair_cost_base + expenses_total
profit           INTEGER          -- listing_price - total_cost
archived_at      TIMESTAMP
settled_at       TIMESTAMP
```

### `manual_vehicle_requests`
```
id                UUID PK
requester_id      UUID FK → users
brand_text        VARCHAR(100) NOT NULL  -- 使用者自由文字
spec_text         VARCHAR(100)
model_text        VARCHAR(100)
year / color / mileage / transmission / fuel_type / listing_price / ...
images            JSONB (array)
contact_note      TEXT
status            pending | approved | rejected
rejection_reason  TEXT
created_vehicle_id UUID (核准後連結到真實 vehicles.id)
reviewed_by / reviewed_at
```

### `users` 新欄位
```
business_card_url  TEXT          -- 管理員上傳的名片圖片 URL
credits            INTEGER NOT NULL DEFAULT 0 (若原本未有則新增)
```

### `vehicles` 新欄位
```
is_tradable   BOOLEAN NOT NULL DEFAULT false
trade_price   INTEGER CHECK (>=0 or NULL)
archived_at   TIMESTAMP          -- 觸發器自動維護
```

---

## ⏰ Cron 任務

新增一個每日 05:00（Asia/Taipei）執行的任務：`settleArchivedVehiclesJob`
- 找出 `status = 'archived' AND archived_at < now() - 30 days` 的車輛
- 每台呼叫 `revenueService.settle()`：
  1. 計算 `expenses_total`（vehicle_expenses 加總）
  2. 組 vehicle_snapshot（保留品牌/車型/圖片等）
  3. 寫入 `revenue_records`
  4. 刪除該 vehicle（CASCADE 同時刪除 expenses）

---

## ⚠️ 部署前置作業

1. **執行 SQL migration**
   ```bash
   # 方式 A：Supabase Dashboard → SQL Editor → 貼上 20260418000001_v12_features.sql
   # 方式 B：supabase db push
   ```

2. **建立 Supabase Storage bucket**：`business-cards`
   - 設為 Public
   - 選單：Storage → New Bucket → Name: `business-cards`, Public: ✅

3. **環境變數**：無須變動（沿用既有的 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`）

4. **套件安裝**：所有新功能只用到已存在的套件（`multer`、`zod`、`@supabase/supabase-js`、`node-cron`），**無須 `npm install`**

---

## 🧪 驗證方式（curl 範例）

```bash
# 1) 查自己的點數
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/users/me/credits

# 2) 設某台車可盤 + 盤價 50 萬
curl -X PUT -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"is_tradable": true, "trade_price": 500000}' \
  http://localhost:3001/api/v1/vehicles/<VEHICLE_ID>/tradable

# 3) 新增整備費
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"item_name": "洗車", "amount": 800}' \
  http://localhost:3001/api/v1/vehicles/<VEHICLE_ID>/expenses

# 4) admin 調點數
curl -X PUT -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"credits": 100}' \
  http://localhost:3001/api/v1/admin/credits/<USER_ID>

# 5) admin 查營收
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  http://localhost:3001/api/v1/admin/revenue
```

---

## 🧭 下一批預告

- **第 2 批（車行端前端）**：
  - 我的車編輯頁加整備費細項 UI + 可盤 toggle
  - 新增車輛表單加「找不到？申請代上傳」入口
  - 新頁面 `/all-cars`（簡單列表無照片）+ BottomNav 加入口
  - 個人資料頁顯示點數
  - VehicleCard 右上角「可盤」徽章

- **第 3 批（管理後台前端）**：
  - 會員詳情頁：點數調整 UI + 名片上傳
  - 車輛詳情頁：取消可盤
  - 新頁面：代上傳申請審核
  - 新頁面：營收紀錄列表
  - AdminSidebar 新增導覽項
