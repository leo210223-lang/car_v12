# 🔧 環境變數設置與驗證指南

## 📋 概述

本指南說明如何正確設置後端環境變數，以支援 Admin 升級功能和其他 Supabase 集成。

---

## 🚀 快速開始

### 1️⃣ 後端環境變數設置

#### 步驟 1：準備環境變數文件

進入 `backend/` 目錄：

```bash
cd backend
```

確保存在以下任一檔案（優先級順序）：
- **`.env.local`** （優先，適合本地開發）
- **`.env`** （備用）

#### 步驟 2：填入環境變數

**必需的變數：**

```properties
# Supabase 設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**如何獲取這些值：**

1. 打開 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的項目
3. 進入 **Settings > API**
4. 複製：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

**示例 `.env` 文件：**

```properties
# 伺服器設定
PORT=3001
NODE_ENV=development

# Supabase 設定
SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmZzaGpwdHprcGJ1ZmptbXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwNzMsImV4cCI6MjA4OTU3NzA3M30.NFgofmyAW9sX5T-ox_8sWDuJc7j6PIY44oo6yBcqxPk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmZzaGpwdHprcGJ1ZmptbXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAwMTA3MywiZXhwIjoyMDg5NTc3MDczfQ.xWIwUVi0_ef7W95QYb6VufyN7B6aagkxRvqmaLMvXng

# Redis (可選)
REDIS_URL=

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://car-v12.vercel.app

# 其他設定
RATE_LIMIT_MAX=100
```

---

## 🔐 驗證環境變數

### 方式 1️⃣：運行 Admin 升級腳本（推薦）

此方法會自動驗證環境變數和 Supabase 連接：

```bash
# 進入後端目錄
cd backend

# 運行升級腳本（測試環境變數）
node scripts/promote-to-admin.js test@example.com

# 或使用實際帳號升級
node scripts/promote-to-admin.js your-email@example.com
```

**預期輸出（成功）：**

```
🔍 正在搜尋帳號: your-email@example.com
✅ 找到帳號：your-email@example.com (ID: xxx)
🔄 正在更新 metadata...
✅ 已發送升級命令！
   更新回應: {...}
🔍 正在驗證更新...
📝 更新後的帳號資訊：
   Email: your-email@example.com
   User Metadata: {...,"role":"admin",...}
   Role (metadata): admin
✨ 升級程序完成！
```

**常見錯誤和解決方案：**

| 錯誤 | 原因 | 解決方案 |
|------|------|--------|
| `❌ 錯誤：未設定 SUPABASE_URL` | 環境變數未正確加載 | 檢查 `.env` 文件中是否有正確的值 |
| `❌ 找不到帳號: test@example.com` | Supabase 中不存在此帳號 | 這是正常的；使用真實帳號 |
| `❌ 無法取得用戶列表` | Supabase 連接失敗 | 驗證 `SUPABASE_SERVICE_ROLE_KEY` 是否正確 |

### 方式 2️⃣：直接檢查環境變數

```bash
cd backend

# Windows PowerShell
$env:SUPABASE_URL
$env:SUPABASE_SERVICE_ROLE_KEY

# Git Bash / Mac / Linux
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

## 🧪 前端驗證

升級 Admin 後，登出並重新登入前端應用，應能看到：

1. ✅ 可訪問 `/admin` 路由
2. ✅ Admin Sidebar 可見
3. ✅ 可訪問「更多服務」管理頁面
4. ✅ `useUserRole()` 返回 `role: 'admin'`

### 調試前端角色識別：

在瀏覽器開發工具 (F12) → Console 運行：

```javascript
// 檢查 Supabase session
const session = localStorage.getItem('sb-ewnfshjptzkpbufjmmwy-auth-token');
const token = JSON.parse(session);
console.log('JWT Claims:', token);
console.log('User Metadata:', token.user_metadata);
console.log('Role:', token.user_metadata?.role);
```

---

## 📝 環境變數參考表

| 變數名 | 說明 | 必需 | 來源 |
|--------|------|------|------|
| `SUPABASE_URL` | Supabase 項目 URL | ✅ | Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | 公開 API 金鑰（前端使用） | ✅ | Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | 服務角色金鑰（後端專用） | ✅ | Settings > API > service_role secret |
| `PORT` | Express 伺服器埠號 | ❌ | 默認 3001 |
| `NODE_ENV` | 執行環境 | ❌ | 默認 development |
| `REDIS_URL` | Redis 連線 URL | ❌ | 可選，用於快取/限流 |
| `CORS_ORIGINS` | CORS 允許來源 | ❌ | 多個以逗號分隔 |

---

## 🔒 安全提示

⚠️ **重要：**

1. **`.env` 和 `.env.local` 已在 `.gitignore` 中** - 不會被提交到 git
2. **`SUPABASE_SERVICE_ROLE_KEY` 是私密的** - 可繞過 RLS，切勿公開分享
3. **生產環境** - 使用 Render 或 Vercel 的環境變數設置，不要在 `.env` 文件中存儲

---

## ✅ 檢查清單

- [ ] `.env` 或 `.env.local` 包含所有必需的環境變數
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 值正確
- [ ] 運行 `node scripts/promote-to-admin.js` 無錯誤
- [ ] Admin 角色成功升級（顯示 `role: admin`）
- [ ] 重新登入前端應用後可訪問 `/admin`
- [ ] 前端 Console 顯示正確的 `role: 'admin'`

---

## 📞 故障排除

### Q1: 運行腳本時顯示「未設定 SUPABASE_URL」

**A:** 檢查以下項目：

1. 確保在 `backend/` 目錄中運行命令
2. 檢查 `.env` 文件中是否有 `SUPABASE_URL=` 的行
3. 嘗試手動設置環境變數再運行：

```bash
# PowerShell
$env:SUPABASE_URL="https://your-url.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-key"
node scripts/promote-to-admin.js email@example.com
```

### Q2: 腳本升級成功但前端仍未識別 Admin

**A:** 

1. **重新登入** - 新角色需要更新 JWT token
2. **清除快取** - Ctrl+Shift+Del 清除瀏覽器快取
3. **檢查 Supabase RLS** - 確保 RLS 規則允許查詢

### Q3: 環境變數在生產環境中不工作

**A:** 在 Render/Vercel 中手動設置環境變數：

- **Render:** Environment > Add Environment Variable
- **Vercel:** Settings > Environment Variables

不要依賴 `.env` 文件在生產環境中工作。

---

## 📚 相關文檔

- [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md) - 完整的權限系統設計
- [QUICK_ADMIN_SETUP.md](./QUICK_ADMIN_SETUP.md) - 快速升級 Admin 指南
- [backend/.env.example](./backend/.env.example) - 環境變數範本

---

**最後更新：2026-03-24**  
**版本：1.0**
