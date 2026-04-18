# ✅ Admin 系統驗證與部署清單

## 📋 目錄

1. [本地驗證檢查](#本地驗證檢查)
2. [環境變數驗證](#環境變數驗證)
3. [Admin 升級流程](#admin-升級流程)
4. [前端功能驗證](#前端功能驗證)
5. [後端 API 驗證](#後端-api-驗證)
6. [部署前檢查](#部署前檢查)

---

## 本地驗證檢查

### ✅ 1. 確認項目結構

```bash
# 檢查必需的檔案是否存在
backend/
├── scripts/
│   └── promote-to-admin.js          ✅ Admin 升級腳本
├── .env                             ✅ 環境變數（本地開發用）
├── .env.local                       ✅ 環境變數（優先級更高）
├── package.json                     ✅ "type": "module" 已設定
└── src/
    ├── middleware/
    │   ├── auth.ts                  ✅ JWT 驗證
    │   └── admin.ts                 ✅ Admin 檢查中間件
    └── routes/
        └── admin/                   ✅ Admin 路由

frontend/
└── src/
    ├── hooks/
    │   └── useUserRole.ts           ✅ 角色判斷鉤子
    ├── app/
    │   └── (admin)/
    │       ├── layout.tsx           ✅ Admin 佈局（自動重定向）
    │       └── settings/
    │           ├── services/        ✅ 更多服務管理
    │           ├── shop/            ✅ 商城管理
    │           └── account/         ✅ 帳號設定
    └── components/
        └── layout/
            └── AdminSidebar.tsx     ✅ Admin 側邊欄
```

### ✅ 2. 檢查依賴包

```bash
cd backend

# 驗證 @supabase/supabase-js 已安裝
npm list @supabase/supabase-js

# 預期輸出
# └── @supabase/supabase-js@2.39.0 (或更高版本)
```

### ✅ 3. 檢查 .gitignore

```bash
# 確保敏感檔案已被 git 忽略
cat .gitignore | grep -E "\.env|node_modules"

# 預期輸出
# .env.local
# .env
# node_modules/
```

---

## 環境變數驗證

### 🔐 步驟 1：設置環境變數

**文件位置：** `backend/.env` 或 `backend/.env.local`

**必需變數：**

```properties
SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🧪 步驟 2：驗證環境變數

#### 方式 A：運行升級腳本（推薦）

```bash
cd backend

# 測試環境變數（無需真實帳號）
node scripts/promote-to-admin.js test@example.com

# 預期結果
# ❌ 找不到帳號: test@example.com （正常，表示環境變數加載成功）
# 📋 現有帳號列表：
#    - your-email@example.com
```

#### 方式 B：Node.js 直接驗證

```bash
cd backend

# 創建臨時驗證腳本
cat > verify-env.js << 'EOF'
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('✅ 環境變數檢查結果：');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 已設定' : '❌ 未設定');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 已設定' : '❌ 未設定');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已設定' : '❌ 未設定');
EOF

node verify-env.js
```

---

## Admin 升級流程

### 📊 步驟 1：獲取現有帳號列表

```bash
cd backend

node scripts/promote-to-admin.js

# 交互模式下會提示輸入帳號
# 請輸入要升級的帳號 Email: 

# 或直接查看輸出：
# ❌ 找不到帳號: test@example.com
# 📋 現有帳號列表：
#    - edwardku4@gmail.com
#    - user2@example.com
```

### 🚀 步驟 2：升級帳號

```bash
cd backend

# 升級指定帳號
node scripts/promote-to-admin.js edwardku4@gmail.com

# 預期輸出
# 🔍 正在搜尋帳號: edwardku4@gmail.com
# ✅ 找到帳號：edwardku4@gmail.com (ID: xxx)
# 🔄 正在更新 metadata...
# ✅ 已發送升級命令！
# 📝 更新後的帳號資訊：
#    Email: edwardku4@gmail.com
#    User Metadata: {...,"role":"admin",...}
#    Role (metadata): admin
# ✨ 升級程序完成！
```

### ✅ 步驟 3：驗證 Admin 角色

**在 Supabase Dashboard 中驗證：**

1. 進入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的項目
3. 進入 **Authentication > Users**
4. 點擊已升級的帳號
5. 查看 **User Metadata**，應顯示 `"role": "admin"`

**預期結果：**

```json
{
  "email": "edwardku4@gmail.com",
  "email_verified": true,
  "phone": "0979942666",
  "phone_verified": false,
  "role": "admin",
  "shop_name": "翔宇",
  "sub": "d3c665a0-5f03-4ddf-b7b1-822fe9867b4a"
}
```

---

## 前端功能驗證

### 🌐 步驟 1：啟動前端應用

```bash
cd frontend

npm run dev

# 預期輸出
# ▲ Next.js 15.1.4
# - Local:        http://localhost:3000
```

### 👤 步驟 2：以 Admin 帳號登入

1. 打開 http://localhost:3000
2. 點擊「登入」
3. 輸入已升級的 Admin 帳號：`edwardku4@gmail.com`
4. 輸入密碼並登入

### ✅ 步驟 3：驗證 Admin 功能

| 檢查項目 | 預期結果 | 實際結果 |
|---------|--------|---------|
| 可訪問 `/admin` | ✅ 重定向到 `/admin/dashboard` | |
| Admin Sidebar 可見 | ✅ 顯示 Admin 導航菜單 | |
| 可訪問「更多服務」| ✅ `/admin/settings/services` 可正常加載 | |
| 可訪問「商城管理」| ✅ `/admin/settings/shop` 可正常加載 | |
| 可訪問「帳號設定」| ✅ `/admin/settings/account` 可正常加載 | |

### 🧪 步驟 4：前端調試

在瀏覽器 Console (F12) 運行：

```javascript
// 檢查 useUserRole() 的返回值
// （需要在 React Component 中運行，或使用開發者工具檢查組件狀態）

// 或檢查 localStorage 中的 session token
const authToken = localStorage.getItem('sb-ewnfshjptzkpbufjmmwy-auth-token');
const parsed = JSON.parse(authToken);
console.log('JWT Payload:', parsed);
console.log('User Metadata:', parsed.user_metadata);
console.log('Role:', parsed.user_metadata?.role);
```

**預期輸出：**

```json
{
  "user_metadata": {
    "role": "admin",
    "email": "edwardku4@gmail.com",
    "phone": "0979942666",
    "shop_name": "翔宇"
  }
}
```

---

## 後端 API 驗證

### 🔌 步驟 1：啟動後端伺服器

```bash
cd backend

npm run dev

# 預期輸出
# [3:45:00 PM] Starting compilation in watch mode...
# [3:45:02 PM] Successfully compiled 1 file with swc.
# 🚀 Server running at port 3001
```

### 🧪 步驟 2：測試 Admin 中間件

```bash
# 獲取有效的 JWT token
# 使用 Admin 帳號登入前端，從 localStorage 複製 token

# 測試受保護的 Admin API
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/admin/users
```

### ✅ 步驟 3：驗證 RLS 規則

在 Supabase Dashboard 中驗證 RLS：

1. 進入 **SQL Editor**
2. 運行以下查詢以驗證 RLS 規則：

```sql
-- 檢查 users 表的 RLS 策略
SELECT policy_name, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 預期結果
-- 應顯示適當的 RLS 規則，例如：
-- | 策略名稱 | 權限 | 角色 | 條件 |
-- |---------|------|------|------|
-- | admin_full_access | 允許 | admin | true |
-- | user_self_access | 允許 | authenticated | uid = auth.uid() |
```

---

## 部署前檢查

### 📋 部署到 Render / Vercel

#### 步驟 1：設置環境變數

**Render：**

1. 進入 Render Dashboard
2. 選擇你的服務
3. 進入 **Settings > Environment > Environment Variables**
4. 添加以下變數：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**Vercel (前端)：**

1. 進入 Vercel Dashboard
2. 選擇你的項目
3. 進入 **Settings > Environment Variables**
4. 添加以下變數：
   - `NEXT_PUBLIC_SUPABASE_URL` (公開)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (公開)

#### 步驟 2：驗證部署

```bash
# 本地測試生產構建
cd backend
npm run build

cd ../frontend
npm run build

# 檢查構建是否成功
# 預期：dist/ 或 .next/ 目錄已生成
```

#### 步驟 3：檢查日誌

部署後在雲平台查看日誌，確保：

- ✅ 環境變數正確加載
- ✅ Supabase 連接成功
- ✅ 無 RLS 相關錯誤

---

## 🐛 常見問題排查

### Q1: 升級後前端仍未識別 Admin

**解決方案：**

1. ✅ 登出當前帳號
2. ✅ 清除瀏覽器快取 (Ctrl+Shift+Del)
3. ✅ 重新登入
4. ✅ 刷新頁面 (Ctrl+F5)

### Q2: 環境變數在本地工作，但部署後不工作

**解決方案：**

1. ✅ 確認在部署平台（Render/Vercel）設置了環境變數
2. ✅ 確保使用的是 `.env` 文件，而非 `.env.local`
3. ✅ 重新部署應用以應用新的環境變數

### Q3: 腳本顯示「無法取得用戶列表」

**解決方案：**

1. ✅ 驗證 `SUPABASE_SERVICE_ROLE_KEY` 是否正確
2. ✅ 確認 Supabase 專案仍然在線
3. ✅ 檢查 Supabase Dashboard 中是否有任何警告

### Q4: Admin 頁面仍顯示「無法訪問」

**解決方案：**

1. ✅ 驗證 Supabase 中的 metadata 已更新為 `"role": "admin"`
2. ✅ 檢查 `useUserRole.ts` 邏輯是否正確
3. ✅ 在 Console 驗證 JWT token 中的角色信息

---

## 📊 最終檢查清單

- [ ] `.env` / `.env.local` 包含所有必需的環境變數
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 值正確無誤
- [ ] 運行 `node scripts/promote-to-admin.js` 成功
- [ ] Admin 角色在 Supabase Dashboard 顯示為 `"role": "admin"`
- [ ] Admin 帳號可訪問 `/admin` 路由
- [ ] Admin Sidebar 正常顯示
- [ ] 「更多服務」、「商城管理」、「帳號設定」頁面可正常加載
- [ ] 後端 API 正常運作（如有 Admin API）
- [ ] RLS 規則在生產環境中運作正常
- [ ] 環境變數已在部署平台中設置
- [ ] 生產構建成功 (`npm run build`)

---

## 📞 支持資源

- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - 詳細的環境變數設置指南
- [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md) - 權限系統完整文檔
- [QUICK_ADMIN_SETUP.md](./QUICK_ADMIN_SETUP.md) - 快速啟動指南
- [Supabase 文檔](https://supabase.com/docs) - 官方文檔
- [Next.js 文檔](https://nextjs.org/docs) - 前端框架文檔

---

**最後更新：2026-03-24**  
**版本：1.0**
