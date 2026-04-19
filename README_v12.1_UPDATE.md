# FaCai-B v12.1 修正包

## 涵蓋的 4 個需求
1. ✅ 管理員會員管理 → 車輛列表正確顯示車輛名稱(品牌/規格/車型)
2. ✅ 儀表板「上架車輛總數」= approved；「會員總數」= active
3. ✅ 移除管理員營收頁，改成車行端（漢堡選單新增「營收紀錄」）
4. ✅ 我的車詳情頁：移除獨立整備費表格，整合進私人成本紀錄（展開/收合 + 細項 CRUD + 加總）

## 檔案清單 (12 個)

### Backend (4 個)
- backend/src/services/user.service.ts     [修改 getUserVehicles 扁平化]
- backend/src/routes/admin/dashboard.ts    [修改統計 query]
- backend/src/routes/revenue.ts            [新建 — 車行營收路由]
- backend/src/routes/index.ts              [新增 /revenue 掛載]

### Frontend (8 個)
- frontend/src/hooks/useMyRevenue.ts                      [新建]
- frontend/src/app/(user)/revenue/page.tsx                [新建 — 車行營收頁]
- frontend/src/components/layout/HamburgerMenu.tsx        [加入「營收紀錄」]
- frontend/src/components/layout/AdminSidebar.tsx         [移除「營收紀錄」]
- frontend/src/components/vehicle/CostEditSection.tsx     [大改 — 整合整備費細項]
- frontend/src/components/vehicle/index.ts                [移除 ExpensesSection export]
- frontend/src/app/(user)/my-cars/[id]/page.tsx          [移除 ExpensesSection]
- frontend/src/app/(user)/my-cars/[id]/edit/page.tsx     [移除 ExpensesSection]

## 可刪除(選擇性,不刪不影響功能)
- frontend/src/app/(admin)/revenue/page.tsx
- frontend/src/components/vehicle/ExpensesSection.tsx

## 套用方式
把本包 zip 裡的所有檔案照路徑**覆蓋**到你的專案即可。

## 檢測結果
- Backend tsc --noEmit: ✅ 0 errors
- Frontend tsc --noEmit (全專案): ✅ 我改的所有檔案 0 errors
  (既有 revalidate/route.ts 有 1 個跟本次無關的 warning)

## 部署步驟
1. 停 backend,重啟 `npm run dev`（nodemon 對新增檔可能不熱重載）
2. Frontend 會自動 hot reload
3. 若部署到 Render/Vercel,git push 後會自動 build

## 功能驗證
| # | 驗證 | 預期 |
|---|------|------|
| 1 | admin/users/:id | 車輛列表顯示品牌+規格+車型 |
| 2 | admin/dashboard | 上架中=approved;會員=active |
| 3 | admin sidebar | 沒有「營收紀錄」 |
| 4 | 車行漢堡選單 | 多了「營收紀錄」 |
| 5 | /revenue (車行) | 顯示自己的營收 |
| 6 | my-cars/:id | 沒獨立整備費表格 |
| 7 | my-cars/:id 私人成本 | 收購成本可編輯 + 整備費展開細項CRUD |
