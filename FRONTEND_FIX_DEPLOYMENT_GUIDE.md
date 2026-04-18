# 🚀 FaCai-B 前端功能修復 - 完整部署指南

**日期**: 2026-03-24  
**狀態**: ✅ 代碼已修復並推送到 GitHub  
**下一步**: 配置 Vercel 環境變數並驗證

---

## 📋 修復概要

### 🔧 已完成的修改

| 文件 | 修改 | 詳情 |
|------|------|------|
| `frontend/src/lib/api.ts` | API_BASE_URL | 添加 `/v1` 前綴 |
| `frontend/.env.local` | NEXT_PUBLIC_API_URL | 更新為 `http://localhost:3001/api/v1` |
| `frontend/.env.example` | NEXT_PUBLIC_API_URL | 更新示例和註釋 |
| GitHub | 提交 | Commit: 7059310 |

### 📊 問題修復

| 問題 | 原因 | 修復 |
|------|------|------|
| Admin - 車輛審核無數據 | API URL 缺 /v1 | ✅ 已修復 |
| Admin - 所有車輛無數據 | API URL 缺 /v1 | ✅ 已修復 |
| Admin - 會員管理無數據 | API URL 缺 /v1 | ✅ 已修復 |
| User - 尋車無數據 | API URL 缺 /v1 | ✅ 已修復 |
| User - 盤車無數據 | API URL 缺 /v1 | ✅ 已修復 |
| User - 我的車無數據 | API URL 缺 /v1 | ✅ 已修復 |

---

## 🎯 立即行動清單

### 優先級 1️⃣: 配置 Vercel (立即做)

```
1. ⏱️ 進入 Vercel 儀表板
   https://vercel.com/dashboard

2. ⏱️ 選擇前端項目
   car-v12-git-main-leo210223-langs-projects

3. ⏱️ Settings → Environment Variables

4. ⏱️ 添加/編輯 NEXT_PUBLIC_API_URL
   值: https://car-v12-backend.onrender.com/api/v1
   
   ⚠️ 注意: 必須包含 /api/v1 前綴！

5. ⏱️ 確認 NEXT_PUBLIC_SUPABASE_URL 和 ANON_KEY 已設置

6. ⏱️ Vercel 自動重新部署
   進入 Deployments 標籤確認
```

**預計時間**: 5 分鐘

### 優先級 2️⃣: 驗證本地環境 (測試)

```
# 在本地環境中驗證修復
cd frontend
npm run dev

打開: http://localhost:3000

檢查:
✅ 頁面能否正常加載
✅ 登錄功能是否正常
✅ Admin - 車輛審核是否顯示數據
✅ Admin - 所有車輛是否顯示數據
✅ User - 尋車是否顯示數據
```

**預計時間**: 10 分鐘

### 優先級 3️⃣: 驗證 Vercel 部署 (確認)

```
# 等待 Vercel 部署完成後
打開: https://car-v12.vercel.app/login?redirect=%2F

登錄後測試:
✅ Admin 頁面 - 車輛審核
✅ Admin 頁面 - 所有車輛
✅ Admin 頁面 - 會員管理
✅ User 頁面 - 尋車
✅ User 頁面 - 盤車
✅ User 頁面 - 我的車

檢查 Network 標籤:
✅ API URL 包含 /api/v1
✅ 狀態碼 200 OK
✅ 響應包含有效數據
```

**預計時間**: 10 分鐘

---

## 📝 詳細步驟

### 步驟 1: 配置 Vercel 環境變數

#### A. 登錄 Vercel

```
網址: https://vercel.com
使用 GitHub 帳號登錄
```

#### B. 進入儀表板

```
點擊右上角 Dashboard
或直接: https://vercel.com/dashboard
```

#### C. 選擇項目

```
Projects 列表中找到:
car-v12-git-main-leo210223-langs-projects

點擊進入
```

#### D. 進入設置

```
頂部標籤: Settings (或 ⚙️ 圖標)
左側菜單: Environment Variables
```

#### E. 添加/編輯 NEXT_PUBLIC_API_URL

**如果不存在**:
```
點擊 "Add New Environment Variable"

填入:
Name:  NEXT_PUBLIC_API_URL
Value: https://car-v12-backend.onrender.com/api/v1

選擇環境: ☑️ Production

點擊 Save
```

**如果已存在**:
```
找到 NEXT_PUBLIC_API_URL 行
點擊編輯 (鉛筆圖標)

確認值為:
https://car-v12-backend.onrender.com/api/v1

確保包含 /api/v1 前綴!

點擊 Update
```

#### F. 驗證其他環境變數

確認以下變數已設置:

```
✅ NEXT_PUBLIC_SUPABASE_URL
   值: https://ewnfshjptzkpbufjmmwy.supabase.co

✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   值: eyJ... (完整 JWT token)

✅ NEXT_PUBLIC_API_URL (新加的)
   值: https://car-v12-backend.onrender.com/api/v1
```

### 步驟 2: 監控部署

#### A. 進入部署頁面

```
頂部標籤: Deployments
或直接: https://vercel.com/[PROJECT]/deployments
```

#### B. 查看最新部署

```
應該看到:
部署狀態: ⏳ In Progress 或 ✅ Ready

如果環境變數保存成功，會自動觸發重新部署
```

#### C. 等待部署完成

```
預計時間: 2-5 分鐘

部署完成後應顯示:
✅ Ready for Production
```

#### D. 查看部署日誌 (可選)

```
點擊最新部署行
進入 "View Details" 或 "Logs"

應該看到:
✓ Environment variables loaded
✓ Installing dependencies
✓ Building Next.js
✓ Creating optimized production bundle
✓ Deployment complete
```

### 步驟 3: 驗證本地環境

#### A. 確保後端運行中

```bash
# 在 backend 目錄中
npm run dev

# 應該看到:
[Startup] ✅ Supabase connected
✅ Server running at http://localhost:3001
```

#### B. 運行前端

```bash
# 在 frontend 目錄中
npm run dev

# 應該看到:
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

#### C. 打開瀏覽器

```
http://localhost:3000/login
```

#### D. 執行測試操作

**登錄**:
```
使用測試帳號登錄
應該顯示用戶名和菜單
```

**Admin - 車輛審核**:
```
進入: 左側菜單 → 車輛審核
期望: 顯示待審核車輛列表 (如有的話)
檢查: F12 → Network → 應該看到成功的 API 請求
```

**Admin - 所有車輛**:
```
進入: 左側菜單 → 所有車輛
期望: 顯示所有車輛列表 (如有的話)
檢查: F12 → Network → 應該看到成功的 API 請求
```

**Admin - 會員管理**:
```
進入: 左側菜單 → 會員管理
期望: 顯示會員列表 (如有的話)
檢查: F12 → Network → 應該看到成功的 API 請求
```

**User - 尋車**:
```
進入: 左側菜單 → 尋車
期望: 顯示調做列表 (如有的話)
檢查: F12 → Network → 應該看到成功的 API 請求
```

### 步驟 4: 驗證 Vercel 部署

#### A. 等待部署完成

```
檢查 Vercel 儀表板
確認部署狀態: ✅ Ready
```

#### B. 訪問網站

```
https://car-v12.vercel.app/login?redirect=%2F
或
https://car-v12.vercel.app
```

#### C. 執行測試

**登錄**:
```
使用測試帳號登錄
應該成功並顯示儀表板
```

**檢查 Network (F12)**:

打開 DevTools → Network 標籤
重新加載頁面
查看 API 請求:

```
應該看到:
GET https://car-v12-backend.onrender.com/api/v1/...

檢查:
✅ URL 包含 /api/v1
✅ 狀態 200 OK
✅ 響應是有效的 JSON
✅ 包含預期的數據
```

**測試各個功能**:

```
進入 Admin 各頁面 → 應該顯示數據
進入 User 各頁面 → 應該顯示數據

如果全部成功 → 修復完成！ 🎉
```

---

## 🔍 驗證檢查清單

### 代碼修改驗證 ✅

- [x] frontend/src/lib/api.ts - API_BASE_URL 包含 /v1
- [x] frontend/.env.local - NEXT_PUBLIC_API_URL 更新
- [x] frontend/.env.example - 示例和註釋更新
- [x] Git 提交: 7059310
- [x] Git push: 已推送到 GitHub

### 本地環境驗證

- [ ] 後端運行中 (http://localhost:3001/health)
- [ ] 前端運行中 (http://localhost:3000)
- [ ] 能正常登錄
- [ ] Admin 頁面顯示數據
- [ ] User 頁面顯示數據
- [ ] Network 標籤顯示正確的 API URL

### Vercel 配置驗證

- [ ] 進入 Vercel Settings
- [ ] NEXT_PUBLIC_API_URL 已設置為 `...onrender.com/api/v1`
- [ ] NEXT_PUBLIC_SUPABASE_URL 已設置
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY 已設置
- [ ] Vercel 部署完成 (✅ Ready)

### Vercel 功能驗證

- [ ] 訪問 https://car-v12.vercel.app
- [ ] 能正常登錄
- [ ] Admin 頁面顯示數據
- [ ] User 頁面顯示數據
- [ ] Network 標籤顯示正確的 API URL (包含 /api/v1)
- [ ] 所有 API 響應狀態 200 OK

---

## 📊 API 路由驗證

### 應該看到的請求

```
GET https://car-v12-backend.onrender.com/api/v1/vehicles
   └─ 響應: 200 OK, JSON 數據

GET https://car-v12-backend.onrender.com/api/v1/admin/vehicles
   └─ 響應: 200 OK, JSON 數據

GET https://car-v12-backend.onrender.com/api/v1/admin/users
   └─ 響應: 200 OK, JSON 數據

GET https://car-v12-backend.onrender.com/api/v1/trades
   └─ 響應: 200 OK, JSON 數據
```

### 不應該看到的請求 (過時的)

```
❌ GET https://car-v12-backend.onrender.com/api/vehicles
   (缺少 /v1 - 會返回 404)
```

---

## 🆘 故障排除

### 問題 1: Vercel 部署失敗

**檢查日誌**:
```
Deployments → 最新部署 → Logs
查看 Error 或 Failed 信息
```

**常見原因**:
- ❌ npm install 失敗 → 檢查 package.json
- ❌ 構建失敗 → 檢查 TypeScript 或 Next.js 錯誤
- 解決: 清除緩存並重新部署

### 問題 2: Vercel 部署成功但頁面無數據

**檢查步驟**:
1. 打開 DevTools (F12)
2. Network 標籤
3. 重新加載頁面
4. 查看 API 請求

**檢查內容**:
- ❌ URL 不包含 /api/v1 → 環境變數未設置
- ❌ 404 Not Found → 後端路由錯誤
- ❌ 503 Service Unavailable → 後端離線
- ❌ 401 Unauthorized → 認證問題

**解決**:
- 確認環境變數已設置
- 檢查後端是否運行中
- 檢查登錄狀態

### 問題 3: CORS 錯誤

**症狀**:
```
Console: Access to XMLHttpRequest ... blocked by CORS policy
```

**原因**:
後端 CORS_ORIGINS 不包含 Vercel URL

**解決**:
1. 進入 Render 儀表板
2. car-v12-backend → Environment
3. 編輯 CORS_ORIGINS
4. 添加: `https://car-v12.vercel.app`
5. 重新部署

### 問題 4: 本地環境正常但 Vercel 無法訪問

**原因**:
API URL 在本地和 Vercel 上不同

**解決**:
確保 Vercel 環境變數值是生產環境後端 URL:
```
NEXT_PUBLIC_API_URL = https://car-v12-backend.onrender.com/api/v1
(不是 http://localhost:3001/api/v1)
```

---

## 📞 相關文檔

- **[API_ROUTING_DIAGNOSIS.md](./API_ROUTING_DIAGNOSIS.md)** - 詳細的路由診斷
- **[VERCEL_ENV_CONFIGURATION.md](./VERCEL_ENV_CONFIGURATION.md)** - Vercel 環境變數配置指南
- **[RENDER_ENV_CONFIGURATION_GUIDE.md](./RENDER_ENV_CONFIGURATION_GUIDE.md)** - Render 後端環境變數配置指南

---

## ✅ 預期結果

修復完成後：

```
🎉 FaCai-B 平台完全恢復！

前端功能:
✅ 登錄/登出
✅ Admin - 車輛審核 (顯示數據)
✅ Admin - 所有車輛 (顯示數據)
✅ Admin - 會員管理 (顯示數據)
✅ User - 尋車 (顯示數據)
✅ User - 盤車 (顯示數據)
✅ User - 我的車 (顯示數據)

部署:
✅ Vercel 前端 正常運行
✅ Render 後端 正常運行
✅ Supabase 數據庫 連接成功
```

---

## 🚀 最後確認

在聲稱完成前，請驗證：

```
1️⃣ GitHub 上的代碼已推送
   Commit: 7059310 (fix: correct API routing)

2️⃣ Vercel 環境變數已配置
   NEXT_PUBLIC_API_URL 設置為正確值

3️⃣ 本地環境測試通過
   所有頁面都顯示數據

4️⃣ Vercel 部署測試通過
   所有功能都正常工作

5️⃣ API 請求都包含 /v1 前綴
   Network 標籤驗證
```

---

**狀態**: ✅ **修復完成，等待 Vercel 配置和驗證**  
**Commit**: 7059310  
**Branch**: main  
**預計完成時間**: 20 分鐘 (配置 + 驗證)

祝部署順利！🎉
