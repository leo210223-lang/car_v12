# 🎯 Admin 系統快速參考卡

**版本：1.0** | **更新：2026-03-24** | **打印此頁面作為快速參考！**

---

## ⚡ 最常用的命令

```bash
# 升級 admin 帳號（最常用）
cd backend
node scripts/promote-to-admin.js your-email@example.com

# 診斷系統問題
node scripts/promote-to-admin.js --diagnose

# 驗證環境變數
node scripts/promote-to-admin.js --verify

# 啟動前端開發伺服器
cd frontend
npm run dev          # 訪問 http://localhost:3000

# 啟動後端開發伺服器
cd backend
npm run dev          # 訪問 http://localhost:3001
```

---

## 🔐 三步升級流程

```
第 1 步：運行升級命令
  cd backend
  node scripts/promote-to-admin.js your-email@example.com
  
  ↓ 預期：Role (metadata): admin

第 2 步：前端清除快取
  - 登出當前帳號
  - 按 Ctrl+Shift+Del 清除瀏覽器快取
  - 關閉瀏覽器完全重啟

第 3 步：重新登入
  - 打開 http://localhost:3000
  - 重新登入
  - 訪問 /admin 頁面
  
  ✅ 完成！
```

---

## 📍 四大管理頁面

| 功能 | URL | 作用 |
|------|-----|------|
| 💼 更多服務 | `/admin/settings/services` | 編輯服務列表 |
| 🛒 商城管理 | `/admin/settings/shop` | 編輯商城設置 |
| 👤 帳號設定 | `/admin/settings/account` | 查看帳號權限 |
| 🚗 車輛審核 | `/admin/vehicles` | 審核新車信息 |

---

## ❌ 5 大常見問題及解決方案

### 問題 1：「未設定 SUPABASE_URL」

**解決：** 檢查 `backend/.env` 是否包含：
```properties
SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**獲取方式：**
1. 進入 https://app.supabase.com
2. Settings > API
3. 複製 Project URL 和 service_role secret

---

### 問題 2：「找不到帳號」

**解決：** 查看所有帳號
```bash
cd backend
node scripts/promote-to-admin.js --diagnose
```

使用列出的帳號升級：
```bash
node scripts/promote-to-admin.js real-email@example.com
```

---

### 問題 3：升級後無法訪問 `/admin`

**解決：**
1. ✅ 完全登出前端
2. ✅ Ctrl+Shift+Del 清除快取
3. ✅ 重啟瀏覽器（關閉後重新打開）
4. ✅ 重新登入
5. ✅ 訪問 `/admin`

---

### 問題 4：不確定升級是否成功

**驗證方法：**

**方式 A - 檢查腳本輸出：**
```
✨ 升級程序完成！
Role (metadata): admin  ← 應顯示 admin
```

**方式 B - Supabase Dashboard：**
1. 進入 https://app.supabase.com
2. Authentication > Users
3. 找到該帳號
4. 查看 User Metadata，應有 `"role": "admin"`

**方式 C - 前端 Console：**
```javascript
const token = localStorage.getItem('sb-ewnfshjptzkpbufjmmwy-auth-token');
const parsed = JSON.parse(token);
console.log('Role:', parsed.user_metadata?.role); // 應顯示 admin
```

---

### 問題 5：不知道現在有哪些 Admin

**查看方式：**
```bash
cd backend
node scripts/promote-to-admin.js --diagnose

# 輸出示例
帳號列表：
   - admin@example.com              [admin]  ← Admin 帳號
   - user1@example.com              [user]   ← 普通用戶
   - user2@example.com              [user]   ← 普通用戶
```

---

## 📚 文檔導覽

| 需求 | 閱讀這份 | 時間 |
|------|---------|------|
| 快速開始 | [ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md) | 10 分鐘 |
| 環境變數 | [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) | 15 分鐘 |
| 遇到問題 | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 查詢式 |
| 部署驗證 | [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) | 30 分鐘 |
| 系統設計 | [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md) | 25 分鐘 |
| 找文檔 | [DOCUMENTATION_MAP.md](./DOCUMENTATION_MAP.md) | 15 分鐘 |

---

## 🔧 環境變數設置

### 必需的變數（3 個）

```properties
# 進入 Supabase Dashboard → Settings > API 複製這些值

SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 可選的變數（3 個）

```properties
PORT=3001
NODE_ENV=development
REDIS_URL=                    # 留空則使用內存
```

---

## ✅ 檢查清單

### 初次安裝

- [ ] 確認環境變數已設置在 `backend/.env`
- [ ] 運行 `node scripts/promote-to-admin.js --verify`
- [ ] 升級第一個 admin 帳號
- [ ] 重新登入前端
- [ ] 訪問 `/admin` 確認可用

### 部署前

- [ ] 所有環境變數已驗證
- [ ] 已升級至少一個 admin 帳號
- [ ] 前端可訪問 `/admin` 頁面
- [ ] 後端 API 正常運作
- [ ] Supabase RLS 規則已驗證
- [ ] 環境變數已在部署平台設置

---

## 🚨 緊急 SOS

遇到嚴重問題？按照以下步驟：

```bash
# 第 1 步：進入後端目錄
cd backend

# 第 2 步：運行完整診斷
node scripts/promote-to-admin.js --diagnose

# 第 3 步：查看輸出
# ✅ 連接成功 = 環境變數正確
# ❌ 連接失敗 = 檢查環境變數

# 第 4 步：查看文檔
# 進入 TROUBLESHOOTING.md
# 找到對應的問題編號

# 第 5 步：運行建議的命令
# 按照文檔中的解決步驟
```

---

## 💡 快速提示

| 情況 | 做法 |
|------|------|
| 升級後無法訪問 `/admin` | 清除快取 + 重新登入 |
| 不知道是否升級成功 | 運行診斷或查看 Supabase Dashboard |
| 環境變數設置錯誤 | 查看 `backend/.env` + [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) |
| 無法連接 Supabase | 檢查 `SUPABASE_SERVICE_ROLE_KEY` 是否正確 |
| 想快速升級多個 admin | 逐個運行升級命令 |
| 想撤銷 admin 權限 | 進入 Supabase Dashboard 手動編輯 Metadata |

---

## 📞 聯絡方式

- **文檔問題？** 查看 [DOCUMENTATION_MAP.md](./DOCUMENTATION_MAP.md)
- **故障排除？** 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **系統設計？** 查看 [ADMIN_PERMISSION_GUIDE.md](./ADMIN_PERMISSION_GUIDE.md)
- **部署幫助？** 查看 [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)

---

## 🎯 一頁紙版本

**最簡化的流程（只需 3 步）：**

```
1️⃣  編輯 backend/.env
    SUPABASE_URL=https://...
    SUPABASE_SERVICE_ROLE_KEY=...

2️⃣  運行升級
    cd backend
    node scripts/promote-to-admin.js your-email@example.com

3️⃣  前端重新登入
    - 登出
    - 清除快取 (Ctrl+Shift+Del)
    - 重新登入
    - 訪問 /admin

✅ Done!
```

---

## 📱 手機版快速參考

**升級命令：**
```
node scripts/promote-to-admin.js email@example.com
```

**診斷命令：**
```
node scripts/promote-to-admin.js --diagnose
```

**驗證命令：**
```
node scripts/promote-to-admin.js --verify
```

**遇到問題：**
→ 查看 TROUBLESHOOTING.md

---

**打印此頁並貼在辦公室牆上！** 📌

**版本：1.0** | **更新：2026-03-24** | **生產就緒 ✅**

---

## 最後一句話

如果只能記住一個命令，記住這個：

```bash
cd backend && node scripts/promote-to-admin.js --diagnose
```

這個命令會告訴你所有的問題！ 🎯

---

**祝你使用愉快！** 🚀✨

---

# 🚀 車輛審核系統完成回顧

**最後更新：2026-03-24** | **狀態：✅ 完成**

## 📍 關鍵檔案

### 後端 API
- `backend/src/routes/admin/vehicles.ts` - 5 個新端點

### 前端
- `frontend/src/app/(admin)/vehicles/new/page.tsx` - 圖片上傳 UI
- `frontend/src/hooks/useAudit.ts` - API 端點更新

## 🔄 新增 API 端點

| 端點 | 方法 | 功能 |
|------|------|------|
| `/admin/vehicles/pending` | GET | 待審核列表 |
| `/admin/vehicles/:id/detail` | GET | 車輛詳情 |
| `/admin/vehicles/:id/approve` | POST | 核准車輛 |
| `/admin/vehicles/:id/reject` | POST | 拒絕車輛 |
| `/admin/vehicles/:id/images` | POST | 圖片上傳 |

## ✨ 新功能

- ✅ Admin 代客建檔時可上傳圖片
- ✅ Admin 可查看待審核車輛列表
- ✅ Admin 可核准或拒絕車輛
- ✅ 完整的前端 UI 支援

## 📊 改動

- 修改檔案：3 個
- 新增程式碼：~300 行
- TypeScript 編譯：✅ 通過

## 📚 文檔

- `FINAL_IMPLEMENTATION_REPORT.md` - 完整報告
- `VERIFICATION_GUIDE.md` - 測試指南
- `COMPLETION_SUMMARY.md` - 完成總結
- `DELIVERY_CHECKLIST.md` - 交付清單
