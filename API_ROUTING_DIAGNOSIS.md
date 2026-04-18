# 🔍 FaCai-B 前端功能問題診斷報告

**日期**: 2026-03-24  
**系統**: FaCai-B 發財B平台  
**問題**: 前端數據無法加載

---

## 🔴 診斷結果

### 發現的問題

#### **問題 1️⃣: API 路由版本不匹配** ⭐ **主要問題**

**症狀**:
```
前端發出請求: GET http://localhost:3001/api/vehicles
                        └─ 缺少 /v1
後端期望: GET http://localhost:3001/api/v1/vehicles
                        └─ 需要 /v1 前綴
結果: 404 Not Found
```

**根本原因**:
```
API_BASE_URL = "http://localhost:3001/api"  (前端)
但後端路由掛在: router.use('/v1', v1Router)  (後端)

所以實際路由是: /api/v1/vehicles
而前端請求: /api/vehicles
結果: 404 錯誤
```

**影響範圍**:
- ❌ Admin - 車輛審核 (GET /admin/audit/trades)
- ❌ Admin - 所有車輛 (GET /admin/vehicles)
- ❌ Admin - 會員管理 (GET /admin/users)
- ❌ User - 尋車 (GET /trades)
- ❌ User - 盤車 (GET /vehicles)
- ❌ User - 我的車 (GET /user/vehicles)

---

## ✅ 修復方案

### 方案 A: 修改前端 API_BASE_URL (推薦)

**文件**: `frontend/src/lib/api.ts`

**修改前**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

**修改後**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
```

**環境變數也要更新**:

`frontend/.env.local`:
```bash
# 修改前
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 修改後
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

`frontend/.env.example`:
```bash
# 修改前
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 修改後
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Vercel 環境變數**:
```
需要在 vercel.json 中更新:
NEXT_PUBLIC_API_URL=生產環境後端 URL/api/v1
```

---

## 📊 修復前後對比

### 修復前

```
請求路徑:
GET http://localhost:3001/api/vehicles
    └─ 響應: 404 Not Found (沒有這個路由)

後端路由映射:
/api
  └─ /v1 ✓ (只有這個註冊)
      ├─ /vehicles ✓
      ├─ /admin ✓
      └─ ...

不匹配！
```

### 修復後

```
請求路徑:
GET http://localhost:3001/api/v1/vehicles
    └─ 響應: 200 OK (成功)

後端路由映射:
/api
  └─ /v1 ✓ (匹配！)
      ├─ /vehicles ✓
      ├─ /admin ✓
      └─ ...

完全匹配！
```

---

## 🔧 逐步修復步驟

### 步驟 1: 修改前端 API_BASE_URL

**文件**: `frontend/src/lib/api.ts` (第 10 行)

```typescript
// 修改前
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 修改後
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
```

### 步驟 2: 更新本地環境變數

**文件**: `frontend/.env.local` (第 8 行)

```bash
# 修改前
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 修改後
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 步驟 3: 更新環境變數模板

**文件**: `frontend/.env.example` (第 8 行)

```bash
# 修改前
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 修改後
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 步驟 4: 更新 vercel.json

**文件**: `vercel.json` (環境變數部分)

```json
{
  ...
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "NEXT_PUBLIC_API_URL": "@next_public_api_url"
  }
}
```

**Vercel 儀表板配置**:
```
進入 Vercel 儀表板 → 前端專案 → Settings → Environment Variables

添加:
NEXT_PUBLIC_API_URL = https://car-v12-backend.onrender.com/api/v1
(或您的後端 URL + /api/v1)
```

### 步驟 5: 本地測試

```bash
# 清除 Next.js 緩存
rm -rf .next
cd frontend
npm run dev

# 或 Windows
rmdir /s .next
cd frontend
npm run dev
```

### 步驟 6: 提交到 GitHub

```bash
git add frontend/src/lib/api.ts
git add frontend/.env.local
git add frontend/.env.example
git add vercel.json
git commit -m "fix: correct API base URL to include /v1 prefix"
git push origin main
```

### 步驟 7: Vercel 自動重新部署

- Vercel 會檢測到推送
- 自動觸發重新構建
- 部署新版本

---

## 🧪 驗證修復

### 本地驗證

**在瀏覽器開發者工具檢查**:

```
打開: http://localhost:3000
進入: F12 → Network 標籤
操作: 點擊 "所有車輛" 或 "車輛審核"

檢查請求 URL:
✅ http://localhost:3001/api/v1/vehicles (正確)
❌ http://localhost:3001/api/vehicles (錯誤)

檢查響應:
✅ 200 OK - JSON 數據 (成功)
❌ 404 Not Found (失敗)
❌ 非 JSON 回應 (CORS 或其他問題)
```

### Vercel 驗證

**部署後測試**:

```bash
# 訪問 Vercel 部署的網站
https://car-v12.vercel.app/login?redirect=%2Fadmin%2Fvehicles

# 登錄後進入 Admin → 所有車輛
# 應該看到車輛列表加載成功

# 檢查 Network 標籤:
✅ 請求 URL: https://car-v12-backend.onrender.com/api/v1/vehicles
✅ 狀態: 200 OK
✅ 響應: JSON 包含車輛數據
```

---

## 📋 修復清單

### 代碼修改
- [ ] 修改 `frontend/src/lib/api.ts` (第 10 行)
- [ ] 修改 `frontend/.env.local` (第 8 行)
- [ ] 修改 `frontend/.env.example` (第 8 行)
- [ ] 修改 `vercel.json` 配置 (確認環境變數正確)

### 環境配置
- [ ] 在 Vercel 儀表板設置 NEXT_PUBLIC_API_URL
- [ ] 值為: `https://car-v12-backend.onrender.com/api/v1`

### 測試驗證
- [ ] 本地運行: 車輛列表能加載
- [ ] 本地運行: Admin 車輛審核能加載
- [ ] 本地運行: 其他頁面能加載
- [ ] Vercel 網站: 部署成功
- [ ] Vercel 網站: 打開頁面，檢查 Network 標籤
- [ ] Vercel 網站: 確認 API URL 正確

### 提交
- [ ] 所有文件已修改
- [ ] Git commit: "fix: correct API base URL"
- [ ] Git push: 推送到 main 分支
- [ ] Vercel: 確認自動部署完成

---

## 🎯 預期結果

修復完成後：

```
✅ Admin - 車輛審核: 顯示待審核車輛列表
✅ Admin - 所有車輛: 顯示所有車輛列表
✅ Admin - 會員管理: 顯示會員列表
✅ User - 尋車: 顯示調做列表
✅ User - 盤車: 顯示可用車輛
✅ User - 我的車: 顯示用戶的車輛

所有 API 請求都會包含正確的 /v1 前綴
所有響應都會返回 200 OK 並包含有效的 JSON 數據
```

---

## 💡 為什麼會出現這個問題？

### 根本原因

1. **後端路由設計**:
   ```typescript
   // 後端在 /api/v1 下組織路由
   router.use('/v1', v1Router);
   ```

2. **前端配置不匹配**:
   ```typescript
   // 前端 API_BASE_URL 沒有包括 /v1
   const API_BASE_URL = 'http://localhost:3001/api'  // 缺少 /v1
   ```

3. **結果**:
   - 前端請求: `/api/vehicles`
   - 後端期望: `/api/v1/vehicles`
   - 404 錯誤

### 為什麼用 /v1？

API 版本控制是最佳實踐：
- `v1` 表示 API 版本 1
- 未來可以有 `/api/v2`, `/api/v3` 等
- 允許向後相容性
- 便於 API 升級和維護

---

## 📞 如果仍有問題

### 檢查清單

| 項目 | 檢查 | 解決 |
|------|------|------|
| API_BASE_URL | 是否包含 `/v1`? | 檢查 api.ts 第 10 行 |
| 環境變數 | NEXT_PUBLIC_API_URL 是否正確? | 檢查 .env.local |
| 後端運行 | 後端是否運行中? | 運行 `npm run dev` 在 backend 目錄 |
| CORS | 是否有 CORS 錯誤? | 檢查瀏覽器控制台 |
| 認證 | 是否正確登錄? | 檢查 Supabase 認證 |

### 常見錯誤

| 錯誤 | 原因 | 解決 |
|------|------|------|
| 404 Not Found | API URL 不正確 | 添加 `/v1` 前綴 |
| CORS 錯誤 | 後端 CORS 配置 | 檢查 app.ts CORS 設置 |
| 401 Unauthorized | 未認證 | 檢查登錄狀態 |
| 403 Forbidden | 權限不足 | 確認用戶是 Admin |
| JSON 解析失敗 | 非 JSON 響應 | 檢查響應 Content-Type |

---

**狀態**: ⚠️ **問題已診斷，等待修復**  
**預期修復時間**: 5-10 分鐘  
**難度**: 簡單 ⭐  
**風險**: 低 (配置更改，無後端邏輯改動)
