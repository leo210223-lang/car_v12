# 🆘 快速故障排除指南

## 📋 目錄

1. [環境變數問題](#環境變數問題)
2. [Admin 升級問題](#admin-升級問題)
3. [前端訪問問題](#前端訪問問題)
4. [後端連接問題](#後端連接問題)
5. [快速診斷命令](#快速診斷命令)

---

## 環境變數問題

### 問題 1️⃣：「未設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY」

**症狀：**
```
❌ 錯誤：未設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY
請檢查 .env.local 檔案
```

**原因：** `.env` 或 `.env.local` 文件中缺少必需的環境變數

**解決方案：**

```bash
# 步驟 1：進入 backend 目錄
cd backend

# 步驟 2：檢查 .env 文件是否存在
ls -la .env*

# 步驟 3：檢查 .env 內容
cat .env

# 步驟 4：確保包含以下行
# SUPABASE_URL=https://your-url.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-key

# 步驟 5：如果缺少，請編輯 .env 並添加這些行
# （見環境變數設置指南）
```

**快速驗證：**

```bash
cd backend
node scripts/promote-to-admin.js --verify
```

預期輸出：
```
✅ 環境變數已成功加載
   SUPABASE_URL: https://ewnfshjptzkpbufjmmwy.supabase.co...
   SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Admin 升級問題

### 問題 2️⃣：「找不到帳號」

**症狀：**
```
❌ 找不到帳號: your-email@example.com
📋 現有帳號列表：
   - other-email@example.com
```

**原因：** 輸入的帳號不在 Supabase 中

**解決方案：**

```bash
# 步驟 1：查看所有存在的帳號
cd backend
node scripts/promote-to-admin.js --diagnose

# 步驟 2：使用列出的帳號之一進行升級
node scripts/promote-to-admin.js other-email@example.com

# 步驟 3：如果沒有任何帳號，先在前端註冊一個帳號
# 或在 Supabase Dashboard 中手動創建
```

### 問題 3️⃣：「無法取得用戶列表」

**症狀：**
```
❌ 錯誤：無法取得用戶列表: ...
```

**原因：** Supabase 連接失敗或金鑰無效

**解決方案：**

```bash
# 步驟 1：驗證環境變數
cd backend
node scripts/promote-to-admin.js --verify

# 步驟 2：驗證 SUPABASE_SERVICE_ROLE_KEY 是否正確
# 進入 https://app.supabase.com → Settings > API
# 複製 service_role secret，確保完整無截斷

# 步驟 3：檢查 Supabase 項目是否在線
# 進入 https://app.supabase.com
# 檢查是否有任何警告或服務中斷

# 步驟 4：運行診斷
node scripts/promote-to-admin.js --diagnose
```

### 問題 4️⃣：升級成功但「角色仍為 user」

**症狀：**
```
✨ 升級程序完成！
但 Supabase Dashboard 中 role 仍顯示 user
```

**原因：** JWT token 未更新，或頁面未刷新

**解決方案：**

```bash
# 步驟 1：在 Supabase Dashboard 驗證角色是否已更新
# 進入 https://app.supabase.com → Authentication > Users
# 查看該帳號的 User Metadata

# 步驟 2：如果已更新為 admin，則：
# - 登出前端應用
# - 清除瀏覽器快取 (Ctrl+Shift+Del)
# - 重新登入

# 步驟 3：重新整理頁面 (Ctrl+F5)

# 步驟 4：檢查 localStorage 中的 JWT token
# 按 F12 → Application → Local Storage
# 查看 sb-xxx-auth-token 中的 role 欄位
```

---

## 前端訪問問題

### 問題 5️⃣：Admin 帳號無法訪問 `/admin`

**症狀：**
- 升級為 admin
- 訪問 `http://localhost:3000/admin` 仍被重定向回首頁

**原因：** 前端未識別新的角色

**解決方案：**

```bash
# 步驟 1：確保後端已升級帳號
cd backend
node scripts/promote-to-admin.js --diagnose

# 步驟 2：在前端重新登入
# - 登出當前帳號
# - 清除瀏覽器快取 (Ctrl+Shift+Del)
# - 重新登入

# 步驟 3：驗證 JWT token（F12 → Console）
const token = localStorage.getItem('sb-ewnfshjptzkpbufjmmwy-auth-token');
const parsed = JSON.parse(token);
console.log('Role:', parsed.user_metadata?.role);

# 預期輸出：Role: admin

# 步驟 4：如果仍顯示 user，檢查 RLS 規則
# 進入 Supabase Dashboard → SQL Editor
# 運行：SELECT * FROM users WHERE email = 'your-email@example.com';
```

### 問題 6️⃣：Admin Sidebar 未顯示

**症狀：**
- 訪問 `/admin` 頁面
- 但 Admin Sidebar 未出現

**原因：** 權限檢查失敗或組件未正確渲染

**解決方案：**

```bash
# 步驟 1：檢查前端日誌 (F12 → Console)
# 應該沒有 403 或權限相關的錯誤

# 步驟 2：檢查 useUserRole hook
# 在 React DevTools 中檢查組件狀態
# isAdmin 應為 true，loading 應為 false

# 步驟 3：驗證 RLS 規則允許訪問
# 進入 Supabase Dashboard → SQL Editor
SELECT * FROM users;
# 如果返回 0 行，表示 RLS 規則阻止了查詢
```

---

## 後端連接問題

### 問題 7️⃣：後端無法連接到 Supabase

**症狀：**
```
[ERROR] Supabase connection failed
```

**原因：** 環境變數未設置或 Supabase 離線

**解決方案：**

```bash
# 步驟 1：確認後端在運行
cd backend
npm run dev

# 步驟 2：檢查環境變數
node scripts/promote-to-admin.js --verify

# 步驟 3：檢查 Supabase 狀態
# 訪問 https://status.supabase.com

# 步驟 4：嘗試重新連接
# 停止後端 (Ctrl+C)
# 等待 5 秒
# 重新啟動 npm run dev
```

### 問題 8️⃣：RLS 規則阻止查詢

**症狀：**
```
[ERROR] new row violates row-level security policy
```

**原因：** RLS 規則配置不正確

**解決方案：**

```bash
# 進入 Supabase Dashboard → SQL Editor

# 1. 查看當前 RLS 規則
SELECT policy_name, roles, qual 
FROM pg_policies 
WHERE tablename = 'users';

# 2. 如果缺少規則，運行：
-- 允許 admin 訪問所有數據
CREATE POLICY "admin_full_access" 
ON users 
FOR ALL 
TO authenticated 
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

# 3. 驗證規則已創建
SELECT policy_name FROM pg_policies WHERE tablename = 'users';
```

---

## 快速診斷命令

### 一鍵診斷

```bash
cd backend

# 1. 診斷環境和連接
node scripts/promote-to-admin.js --diagnose

# 2. 驗證環境變數
node scripts/promote-to-admin.js --verify

# 3. 查看幫助
node scripts/promote-to-admin.js --help
```

### 診斷輸出解析

**成功的診斷輸出：**

```
🔍 開始診斷環境...

1️⃣ 環境變數檢查：
   SUPABASE_URL: ✅ 已設定
   SUPABASE_SERVICE_ROLE_KEY: ✅ 已設定

2️⃣ .env 檔案檢查：
   .env.local 存在: ❌
   .env 存在: ✅

3️⃣ Supabase 連接檢查：
   ✅ 連接成功
   📊 當前帳號數: 1
   帳號列表：
      - edwardku4@gmail.com            [admin]

✅ 診斷完成
```

**失敗的診斷輸出：**

```
3️⃣ Supabase 連接檢查：
   ❌ 連接失敗: Supabase project not found
```

→ 檢查 `SUPABASE_URL` 是否正確

---

## 📞 尋求幫助

如果上述方案無法解決，請檢查：

1. **官方文檔：**
   - [Supabase 認證文檔](https://supabase.com/docs/guides/auth)
   - [Supabase RLS 文檔](https://supabase.com/docs/guides/auth/row-level-security)
   - [Next.js 環境變數](https://nextjs.org/docs/basic-features/environment-variables)

2. **項目文檔：**
   - [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - 環境變數設置
   - [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md) - 權限系統
   - [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - 驗證清單

3. **日誌檢查：**
   - 前端：F12 → Console 標籤
   - 後端：npm run dev 的終端輸出
   - Supabase：Dashboard → Logs 標籤

---

**最後更新：2026-03-24**  
**版本：1.0**
