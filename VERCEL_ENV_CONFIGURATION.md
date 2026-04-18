# ⚙️ Vercel 前端環境變數配置指南

## 🎯 目標

在 Vercel 儀表板中配置生產環境的 `NEXT_PUBLIC_API_URL`，使前端能正確連接到後端服務。

**預計時間**: 5 分鐘

---

## 📋 前提條件

您需要知道：

| 變數 | 來源 | 示例 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 後端服務 URL | `https://car-v12-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 控制台 | `https://ewnfshjptzkpbufjmmwy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 控制台 | `eyJ...` (JWT token) |

---

## 🚀 步驟 1: 登錄 Vercel 儀表板

### 進入 Vercel
```
https://vercel.com/dashboard
```

### 選擇前端專案
```
Projects → car-v12-git-main-leo210223 (或您的項目名)
或
直接訪問: https://vercel.com/[YOUR_USERNAME]/car-v12-...
```

---

## ⚙️ 步驟 2: 進入環境變數設置

### 找到 Settings
```
在專案頁面上，點擊頂部的 "Settings" 標籤
```

### 進入 Environment Variables
```
左側菜單 → Environment Variables
或
直接訪問: https://vercel.com/[PROJECT]/settings/environment-variables
```

---

## 📝 步驟 3: 添加/編輯環境變數

### 3.1 NEXT_PUBLIC_API_URL (重要！)

#### 如果變數不存在：

```
點擊 "Add New Environment Variable" 按鈕

┌──────────────────────────────────────┐
│ Add New Environment Variable          │
├──────────────────────────────────────┤
│ Name:   [NEXT_PUBLIC_API_URL    ]   │
│ Value:  [                          ]│
│         └─ 見下面的值配置表            │
│                                      │
│ [Cancel]          [Save]            │
└──────────────────────────────────────┘
```

#### 配置值

**根據您的後端部署選擇**:

| 後端部署平台 | Value | 狀態 |
|------------|-------|------|
| **Render** | `https://car-v12-backend.onrender.com/api/v1` | ✅ 推薦 |
| **本地開發** | `http://localhost:3001/api/v1` | ⚠️ 僅測試 |
| **自定義域** | `https://your-domain.com/api/v1` | ✅ 如適用 |

**示例 (使用 Render)**:
```
Name:  NEXT_PUBLIC_API_URL
Value: https://car-v12-backend.onrender.com/api/v1
```

**重要**: 確保包含 `/api/v1` 前綴！

#### 設置環境

```
在 "Select Environment(s)" 選擇:
☑️ Production     ← 必須勾選
☐ Preview
☐ Development
```

### 3.2 NEXT_PUBLIC_SUPABASE_URL

```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://ewnfshjptzkpbufjmmwy.supabase.co

Environment: ☑️ Production
```

### 3.3 NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmZzaGpwdHprcGJ1ZmptbXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwNzMsImV4cCI6MjA4OTU3NzA3M30.NFgofmyAW9sX5T-ox_8sWDuJc7j6PIY44oo6yBcqxPk
       └─ 從 Supabase 複製整個 Token

Environment: ☑️ Production
```

---

## 🔍 驗證配置

### 檢查清單

```
☐ NEXT_PUBLIC_API_URL 已添加
  ├─ 值: https://car-v12-backend.onrender.com/api/v1
  └─ Environment: Production

☐ NEXT_PUBLIC_SUPABASE_URL 已添加
  ├─ 值: https://ewnfshjptzkpbufjmmwy.supabase.co
  └─ Environment: Production

☐ NEXT_PUBLIC_SUPABASE_ANON_KEY 已添加
  ├─ 值: eyJ... (JWT token)
  └─ Environment: Production
```

---

## 🔄 步驟 4: 觸發重新部署

### 方式 A: 自動重新部署 (推薦)

環境變數保存後，Vercel 會自動觸發新部署。您應該看到：

```
頁面頂部顯示:
⏳ Redeploy triggered
或
✅ Deployment in progress...
```

### 方式 B: 手動重新部署

如果沒有自動觸發，手動觸發：

```
進入 "Deployments" 標籤
↓
找到最新的部署 (通常顯示日期和時間)
↓
點擊該部署
↓
點擊 "Redeploy" 或 "Redeploy With Cache"
```

---

## 📊 監控部署

### 查看部署日誌

```
進入 "Deployments" 標籤
↓
點擊最新的部署
↓
進入 "Details" 或 "Logs"
↓
查看完整日誌（應該成功完成）
```

### 預期日誌信息

```
✓ Environment variables loaded
✓ Building Next.js application
✓ Created optimized production bundle
✓ Deployment complete
✓ Published to https://car-v12.vercel.app
```

### 如果部署失敗

查看錯誤日誌中的 "Error" 或 "Failed" 信息：
- ❌ npm install 失敗 → 檢查 package.json 依賴
- ❌ tsc 編譯失敗 → 檢查 TypeScript 錯誤
- ❌ 環境變數未定義 → 重新檢查環境變數配置

---

## ✅ 步驟 5: 驗證前端正常運行

### 5.1 訪問網站

```
打開: https://car-v12.vercel.app
或
您在 Vercel 儀表板看到的自動生成的 URL
```

### 5.2 登錄

```
進入登錄頁面: /login
使用測試帳號登錄
```

### 5.3 驗證功能

#### Admin 功能
```
進入: /admin/vehicles (所有車輛)
期望: 顯示車輛列表
檢查: Network 標籤中的 API 請求 URL
```

#### User 功能
```
進入: /trades (尋車)
期望: 顯示調做列表
檢查: Network 標籤中的 API 請求 URL
```

### 5.4 檢查 Network 標籤

**打開 DevTools**:
```
F12 或 右鍵 → 檢查 → Network 標籤
```

**查看 API 請求**:
```
篩選: XHR 或 Fetch
找到: /api/v1/ 開頭的請求

例如:
GET https://car-v12-backend.onrender.com/api/v1/vehicles

驗證:
✅ URL 包含 /api/v1
✅ 狀態碼 200 (成功)
✅ 響應是有效的 JSON
✅ 包含預期的數據 (車輛列表等)
```

---

## 🆘 故障排除

### 問題 1: 頁面能打開但沒有數據

**症狀**:
```
頁面加載成功，但列表為空或顯示"加載中..."一直不停止
```

**檢查步驟**:
1. 打開 DevTools → Network 標籤
2. 重新加載頁面
3. 查看 API 請求:
   - ❌ 404 Not Found → API URL 錯誤
   - ❌ 503 Service Unavailable → 後端離線
   - ❌ 401 Unauthorized → 認證問題
   - ✅ 200 OK → 檢查響應數據

**解決方案**:
- 確認 NEXT_PUBLIC_API_URL 是否正確
- 確認後端是否運行中（訪問 `/health` 端點）
- 檢查是否成功登錄

### 問題 2: CORS 錯誤

**症狀**:
```
Console 出現:
Access to XMLHttpRequest at '...' from origin 'https://car-v12.vercel.app'
has been blocked by CORS policy
```

**原因**:
- 後端 CORS 配置沒有包含 Vercel 前端 URL

**解決方案**:
1. 檢查後端的 CORS_ORIGINS 環境變數
2. 確保包含: `https://car-v12.vercel.app`
3. 在 Render 儀表板更新 CORS_ORIGINS
4. 重新部署後端

### 問題 3: 白屏或 500 錯誤

**症狀**:
```
頁面全白或顯示 500 Internal Server Error
```

**檢查步驟**:
1. 查看 Vercel 部署日誌 (Deployments → Logs)
2. 查看瀏覽器控制台錯誤 (F12)
3. 檢查環境變數是否都已設置

**常見原因**:
- ❌ 環境變數未設置或格式錯誤
- ❌ Supabase 配置錯誤
- ❌ Next.js 構建失敗

**解決方案**:
- 重新驗證所有環境變數
- 重新部署 (`npm run build` 本地測試)
- 查看詳細的構建日誌

---

## 📋 完整環境變數清單

### 必須設置 (Production)

```
✅ NEXT_PUBLIC_SUPABASE_URL
   值: https://ewnfshjptzkpbufjmmwy.supabase.co

✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   值: eyJ... (完整 JWT token)

✅ NEXT_PUBLIC_API_URL
   值: https://car-v12-backend.onrender.com/api/v1
       └─ 注意: 包含 /api/v1 前綴！
```

### 可選設置

```
⭐ NEXT_PUBLIC_APP_NAME
   值: 發財B平台
   (用於頁面標題和品牌)

⭐ NEXT_PUBLIC_APP_URL
   值: https://car-v12.vercel.app
   (用於分享和 SEO)
```

---

## 🔄 更新環境變數流程

如果需要更新環境變數（例如後端 URL 變更）:

```
1. 進入 Vercel Settings → Environment Variables
2. 點擊要編輯的變數
3. 修改值
4. 點擊 Save
5. Vercel 自動觸發重新部署
6. 等待部署完成
7. 驗證新配置生效
```

---

## 🎯 預期結果

配置完成後：

```
✅ 前端部署成功 (https://car-v12.vercel.app)
✅ 頁面能正常打開
✅ 登錄功能工作正常
✅ Admin - 車輛審核: 顯示車輛列表
✅ Admin - 所有車輛: 顯示車輛列表
✅ Admin - 會員管理: 顯示會員列表
✅ User - 尋車: 顯示調做列表
✅ User - 盤車: 顯示車輛列表
✅ User - 我的車: 顯示個人車輛

所有 API 請求都成功 (200 OK)
所有數據都正確加載和顯示
```

---

## 📞 快速參考

| 步驟 | URL | 操作 |
|------|-----|------|
| 1 | https://vercel.com/dashboard | 進入儀表板 |
| 2 | Projects → 選擇項目 | 進入項目 |
| 3 | Settings → Environment Variables | 環境變數頁 |
| 4 | 添加/編輯環境變數 | 配置變數 |
| 5 | 查看 Deployments | 確認部署 |
| 6 | https://car-v12.vercel.app | 訪問網站 |

---

## 💾 環境變數複製模板

準備好後，可以直接複製以下格式：

```
NEXT_PUBLIC_API_URL = https://car-v12-backend.onrender.com/api/v1
NEXT_PUBLIC_SUPABASE_URL = https://ewnfshjptzkpbufjmmwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmZzaGpwdHprcGJ1ZmptbXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwNzMsImV4cCI6MjA4OTU3NzA3M30.NFgofmyAW9sX5T-ox_8sWDuJc7j6PIY44oo6yBcqxPk
```

---

**狀態**: ✅ 配置指南完成  
**最後更新**: 2026-03-24  
**預計完成時間**: 5 分鐘

祝您配置順利！🎉
