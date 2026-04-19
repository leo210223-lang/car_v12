# FaCai-B v12.2 修正包

## 本次 3 個需求

1. ✅ 我的車詳情頁：移除「車行資訊」卡片（車行自己看自己不需要）
2. ✅ 營收紀錄：加入年月篩選（以「下架月份」archived_at 為準）
3. ✅ 管理員儀表板：統計/待審核獨立 loading/error，單一查詢失敗不影響另一個；數字抓不到時顯示骨架而非 0/紅色錯誤頁

## 檔案清單（8 個）

### Backend (3)
- backend/src/services/revenue.service.ts      [listByOwner 加日期區間，以 archived_at 為準]
- backend/src/routes/revenue.ts                [route 接受 year+month 或 from/to]
- backend/src/routes/admin/dashboard.ts        [每個 count 獨立 try/catch，不會一個失敗全部掛]

### Frontend (5)
- frontend/src/components/vehicle/VehicleDetail.tsx           [加 showDealer prop（預設 true）]
- frontend/src/app/(user)/my-cars/[id]/page.tsx               [傳 showDealer={false}]
- frontend/src/hooks/useMyRevenue.ts                          [支援 year/month 參數]
- frontend/src/app/(user)/revenue/page.tsx                    [加月份選擇器 UI]
- frontend/src/app/(admin)/dashboard/page.tsx                 [stats/pending 獨立 loading/error]

## 套用方式
把本包的 `backend/`、`frontend/` 兩個資料夾照路徑**覆蓋**到你的專案根目錄。

## 檢測結果
- Backend `tsc --noEmit`：✅ 0 errors
- Frontend `tsc --noEmit`：✅ 我改的所有檔案 0 errors
- Runtime HTTP 驗證：✅ 所有路由都回 401 (路徑存在，需認證)，非 404/500

## 重要行為說明

### 需求 1 — 車行資訊卡片
- `VehicleDetail` 新增 `showDealer` prop（**預設 true**）
- 只有「我的車詳情頁」傳 `showDealer={false}`
- 尋車頁、admin 車輛詳情頁完全不受影響

### 需求 2 — 營收月份篩選
- 以 `archived_at`（實際下架日）為篩選基準
- 例：10/1 下架的車 → 11/1 被自動結算 → 查「2026 年 10 月」可看到
- 支援自動跳月（當月到 12 月 → 按下一月自動跳下一年 1 月）
- 有「依月份」「全部」兩種檢視模式切換
- 年份下拉：當年 + 往前 4 年
- 月份下拉：1~12
- 左右箭頭可快速切換上／下月

### 需求 3 — 儀表板穩定性
- 4 個 count 查詢各自用 safeCount() 包一層 try/catch，任一失敗不影響其他
- stats 載入時每個數字顯示骨架（不會閃 0）
- pending 載入時列表顯示 spinner
- 任一區塊失敗會顯示淡色提示條（amber-100 背景），不會整頁變紅
- SWR 新增 `shouldRetryOnError: true, errorRetryCount: 2`

## 部署步驟
1. 解壓 zip，把 `backend` / `frontend` 覆蓋
2. 停 backend (Ctrl+C)，重新 `npm run dev`（nodemon 對新 route 檔會熱重載，但保險起見）
3. frontend 自動 hot reload
4. 推 GitHub → Vercel 自動重新 build

## 驗證項目
| 需求 | 驗證步驟 |
|------|---------|
| 1    | 我的車 → 點車輛詳情 → 應看不到「車行資訊」卡片 |
| 1-證  | 尋車頁 → 點車輛 → 應仍看到「車行資訊」（未受影響） |
| 2    | 車行漢堡選單 → 營收紀錄 → 看到月份選擇器 |
| 2    | 選「2026 年 10 月」→ 如有結算紀錄會顯示 |
| 2    | 點「全部」→ 顯示所有營收 |
| 3    | Admin 儀表板 → 數字應正常顯示且持續穩定（60 秒自動重整） |
| 3-證  | 任一 API 臨時爆掉時，頁面仍可使用，只會顯示淡色提示條 |
