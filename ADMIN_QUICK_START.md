# 🔐 Admin 系統 - 快速開始指南

**最近更新：2026-03-24** | **狀態：✅ 完全實施**

---

## 🚀 60 秒快速開始

### 第 1 步：設置環境變數

```bash
# 確保 backend/.env 包含以下內容：
SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 第 2 步：升級 Admin 帳號

```bash
cd backend
node scripts/promote-to-admin.js your-email@example.com

# 預期輸出
# ✨ 升級程序完成！
# Role (metadata): admin
```

### 第 3 步：重新登入

1. 在前端登出當前帳號
2. 清除瀏覽器快取（Ctrl+Shift+Del）
3. 重新登入
4. 訪問 http://localhost:3000/admin

✅ **完成！** 您現在可以管理「更多服務」了。

---

## 📚 詳細文檔

### 快速問題解答

| 問題 | 答案 | 文檔 |
|------|------|------|
| 如何升級 admin？ | 運行 `node scripts/promote-to-admin.js email@example.com` | [QUICK_ADMIN_SETUP.md](./QUICK_ADMIN_SETUP.md) |
| 環境變數怎麼設置？ | 編輯 `backend/.env` 文件 | [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) |
| 升級後無法訪問 admin？ | 清除快取並重新登入 | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| 系統如何驗證？ | 運行 `--diagnose` 命令 | [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) |
| 權限系統如何設計的？ | 三層防護：中間件、hook、路由 | [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md) |

### 按用途選擇文檔

**👶 新人入門（5 分鐘）：**
→ [QUICK_ADMIN_SETUP.md](./QUICK_ADMIN_SETUP.md)

**🔧 配置環境（10 分鐘）：**
→ [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

**🆘 遇到問題（查詢式）：**
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**✅ 部署前檢查（完整驗證）：**
→ [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)

**🏗️ 理解架構（深度學習）：**
→ [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md)

**📊 項目總結（概覽）：**
→ [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## 🧪 診斷命令

### 快速診斷系統

```bash
cd backend

# 一鍵診斷環境和 Supabase 連接
node scripts/promote-to-admin.js --diagnose

# 驗證環境變數是否已加載
node scripts/promote-to-admin.js --verify

# 查看幫助和用法
node scripts/promote-to-admin.js --help
```

### 輸出示例

✅ **成功：**
```
3️⃣ Supabase 連接檢查：
   ✅ 連接成功
   📊 當前帳號數: 1
   帳號列表：
      - edwardku4@gmail.com            [admin]
```

❌ **失敗：**
```
❌ 錯誤：未設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY
→ 檢查 backend/.env 文件
```

---

## 📋 核心功能

### ✅ 已實現

| 功能 | 狀態 | 位置 |
|------|------|------|
| 環境變數配置 | ✅ | `backend/.env` |
| Admin 升級腳本 | ✅ | `backend/scripts/promote-to-admin.js` |
| 前端權限鉤子 | ✅ | `frontend/src/hooks/useUserRole.ts` |
| 路由保護 | ✅ | `frontend/src/app/(admin)/layout.tsx` |
| 更多服務管理 | ✅ | `frontend/src/app/(admin)/settings/services/` |
| 商城管理 | ✅ | `frontend/src/app/(admin)/settings/shop/` |
| 帳號設定 | ✅ | `frontend/src/app/(admin)/settings/account/` |
| Admin Sidebar | ✅ | `frontend/src/components/layout/AdminSidebar.tsx` |
| RLS 安全策略 | ✅ | Supabase 數據庫 |

---

## 🎯 常見任務

### 任務 1️⃣：升級一個用戶為 Admin

```bash
cd backend

# 查看所有用戶
node scripts/promote-to-admin.js --diagnose

# 升級指定用戶
node scripts/promote-to-admin.js user@example.com

# 驗證升級成功
# 進入 Supabase Dashboard → Authentication > Users
# 查看該用戶的 Metadata 中 role 欄位應為 "admin"
```

### 任務 2️⃣：管理「更多服務」

1. 以 Admin 帳號登入前端
2. 訪問 http://localhost:3000/admin
3. 點擊側邊欄「設定」→「更多服務」
4. 編輯、新增或刪除服務

### 任務 3️⃣：部署到 Render/Vercel

**Render（後端）：**

```
Settings > Environment Variables:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
```

**Vercel（前端）：**

```
Settings > Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 任務 4️⃣：驗證系統正常運作

```bash
# 1. 後端診斷
cd backend
node scripts/promote-to-admin.js --diagnose

# 2. 前端測試
cd frontend
npm run dev
# 訪問 http://localhost:3000/admin

# 3. 檢查 JWT token（瀏覽器 F12 → Console）
const token = localStorage.getItem('sb-ewnfshjptzkpbufjmmwy-auth-token');
const parsed = JSON.parse(token);
console.log('Role:', parsed.user_metadata?.role); // 應顯示 'admin'
```

---

## 🆘 常見問題

### Q: 升級後無法訪問 `/admin` 頁面？

**A:** 這很可能是 JWT token 未刷新。解決方法：

1. 完全登出前端應用
2. 清除瀏覽器快取 (Ctrl+Shift+Del)
3. 重新登入
4. 刷新頁面 (Ctrl+F5)

詳細說明見 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#問題-5️⃣admin-帳號無法訪問-admin)

### Q: 「未設定 SUPABASE_URL」錯誤？

**A:** 檢查 `backend/.env` 文件中是否有以下行：

```properties
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

獲取這些值：進入 https://app.supabase.com → Settings > API

詳細說明見 [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

### Q: 如何查看所有 Admin 帳號？

**A:** 運行診斷命令：

```bash
cd backend
node scripts/promote-to-admin.js --diagnose

# 輸出中會顯示所有帳號及其角色
帳號列表：
   - admin@example.com              [admin]
   - user@example.com               [user]
```

### Q: 如何撤銷 Admin 權限？

**A:** 進入 Supabase Dashboard：

1. Authentication > Users
2. 選擇要撤銷的用戶
3. 編輯 Metadata，刪除或改為 `"role": "user"`
4. 保存

---

## 📞 資源列表

### 文檔

- 📖 [QUICK_ADMIN_SETUP.md](./QUICK_ADMIN_SETUP.md) - 快速升級指南
- 🔧 [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - 環境變數設置
- 🆘 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排除
- ✅ [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - 驗證檢查表
- 🏗️ [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md) - 系統設計
- 📊 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 實施總結

### 官方文檔

- [Supabase Auth 文檔](https://supabase.com/docs/guides/auth)
- [Supabase RLS 文檔](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js 環境變數](https://nextjs.org/docs/basic-features/environment-variables)
- [Express 文檔](https://expressjs.com/)

### 腳本位置

| 腳本 | 位置 | 用途 |
|------|------|------|
| 升級工具 | `backend/scripts/promote-to-admin.js` | Admin 帳號管理 |

---

## ✨ 功能亮點

### 🔐 安全性

- ✅ JWT token 驗證
- ✅ 數據庫 RLS (Row Level Security)
- ✅ 中間件權限檢查
- ✅ 前端路由保護
- ✅ 環境變數隔離

### 🛠️ 易用性

- ✅ 一鍵升級命令
- ✅ 診斷和驗證工具
- ✅ 詳細錯誤提示
- ✅ 交互模式支持
- ✅ 完善的文檔

### 📊 管理界面

- ✅ 服務管理頁面
- ✅ 商城管理頁面
- ✅ 帳號設定頁面
- ✅ 車輛審核面板
- ✅ 稽核日誌

---

## 🎉 立即開始

```bash
# 第 1 步：進入後端目錄
cd backend

# 第 2 步：驗證環境變數
node scripts/promote-to-admin.js --verify

# 第 3 步：升級一個用戶
node scripts/promote-to-admin.js your-email@example.com

# 第 4 步：登出並重新登入前端
# → 訪問 http://localhost:3000/admin

# 🎉 享受 Admin 功能！
```

---

**需要幫助？** 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**想了解更多？** 閱讀 [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md)

**準備部署？** 按照 [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) 進行驗證

---

**最後更新：2026-03-24** | **版本：1.0** | **狀態：✅ 生產就緒**
