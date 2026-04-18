# 🔧 FaCai-B Platform - 故障診斷報告

## 📊 執行日期：2026-03-24

---

## 🔴 根本問題

### 為什麼「車輛審核」、「所有車輛」、「會員管理」無法使用？

#### 1️⃣ **本地開發環境問題**（已修復）

**症狀**：
- API 端點返回前端 HTML 而不是 JSON
- 後端根本沒有啟動

**根本原因**：
- 後端配置設定 `PORT=3001`，但前端環境變數指向 `https://car-v12.onrender.com/api/v1`（生產）
- API URL 中有 `/v1` 後綴，但後端實際路由是 `/api`（沒有 `/v1`）

**修復方案**：
```bash
# ✅ 已修復前端環境變數
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # 本地開發
NEXT_PUBLIC_API_URL=https://car-v12.onrender.com/api  # 生產
```

---

#### 2️⃣ **Vercel 部署配置缺失**（已修復）

**症狀**：
- `vercel.json` 只有 `{"version": 2}`
- Vercel 不知道如何構建和部署項目

**根本原因**：
- Vercel 配置完全空缺
- 沒有指定 Next.js 框架
- 沒有環境變數配置

**修復方案**：
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "npm install --legacy-peer-deps",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "NEXT_PUBLIC_API_URL": "@next_public_api_url"
  }
}
```

---

## ✅ 已進行的修復

### 文件修改清單

| 文件 | 修改內容 | 優先級 |
|------|---------|--------|
| `frontend/.env.local` | 更新 API URL 為 `http://localhost:3001/api` | 🔴 Critical |
| `frontend/src/lib/api.ts` | 移除 `/v1` 後綴，改為 `/api` | 🔴 Critical |
| `frontend/.env.example` | 更新示例為正確的 API URL | 🟡 Important |
| `vercel.json` | 創建完整的 Vercel 配置 | 🔴 Critical |
| `VERCEL_SETUP.md` | 新增 Vercel 部署指南 | 🟡 Important |

---

## 🚀 後續步驟

### 第 1 步：本地驗證（必須）

```bash
# 確保後端在運行
cd backend
npm install
npm run build
npm start  # 應在 http://localhost:3001 監聽

# 確保前端在運行
cd frontend
npm install
npm run dev  # 應在 http://localhost:3000 監聽
```

**測試**：
- 訪問 http://localhost:3000
- 測試「車輛審核」、「所有車輛」、「會員管理」
- 打開 F12 檢查 Network，API 應指向 `http://localhost:3001/api`

### 第 2 步：Vercel 環境變數配置（必須）

**在 Vercel Dashboard 設定：**

```
Settings → Environment Variables
```

添加以下變數：

| 變數 | 值 |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ewnfshjptzkpbufjmmwy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` |
| `NEXT_PUBLIC_API_URL` | `https://car-v12.onrender.com/api` |

### 第 3 步：更新後端 CORS 配置（必須）

**在 Render 或 `backend/render.yaml` 中：**

```yaml
CORS_ORIGINS: https://car-v12.vercel.app,https://car-v12-leo210223-langs-projects.vercel.app,http://localhost:3000
```

### 第 4 步：推送代碼並部署（必須）

```bash
git add .
git commit -m "fix: Vercel 部署配置和 API URL 修正"
git push origin main

# Vercel 會自動部署前端
# Render 會自動部署後端
```

---

## 📋 驗證清單

在完全測試所有功能前，請確認：

- [ ] **本地開發**
  - [ ] 後端啟動成功（port 3001）
  - [ ] 前端啟動成功（port 3000）
  - [ ] 「車輛審核」功能可用
  - [ ] 「所有車輛」功能可用
  - [ ] 「會員管理」功能可用
  - [ ] Network tab 顯示 API 請求正確（`localhost:3001/api/...`）

- [ ] **Vercel 環境變數**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` 已設定
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已設定
  - [ ] `NEXT_PUBLIC_API_URL` 指向 Render 後端 URL

- [ ] **生產部署**
  - [ ] Vercel 構建成功
  - [ ] Render 構建成功
  - [ ] 訪問 `https://car-v12.vercel.app` 可正常使用
  - [ ] Network tab 顯示 API 請求指向 `https://car-v12.onrender.com/api`

---

## 🐛 常見問題

### Q: 為什麼 Vercel 上的功能還是不工作？

**A**: 檢查以下幾點：
1. ✅ 環境變數是否已在 Vercel Dashboard 設定？
2. ✅ `NEXT_PUBLIC_API_URL` 是否指向生產後端？
3. ✅ 後端是否在運行？（訪問 `https://car-v12.onrender.com/health`）
4. ✅ 後端 CORS 是否允許 Vercel 域名？

### Q: API 請求返回 CORS 錯誤怎麼辦？

**A**: 
1. 檢查後端 `CORS_ORIGINS` 配置
2. 確認前端發送的 Origin header 是什麼
3. 在後端 app.ts 中查看 CORS 日誌

### Q: 本地開發和生產環境切換怎麼做？

**A**: 
```bash
# 本地開發：使用 .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 生產環境：使用 Vercel 環境變數
NEXT_PUBLIC_API_URL=https://car-v12.onrender.com/api
```

---

## 📞 後續支持

- **Render 部署日誌**：https://dashboard.render.com
- **Vercel 部署日誌**：https://vercel.com/dashboard
- **本地故障排除**：見 `VERCEL_SETUP.md`

---

## 📝 技術規格

**部署架構**：
```
Frontend (Next.js)  → Vercel
    ↓ (CORS/API)
Backend (Express)   → Render
    ↓ (Database)
Supabase PostgreSQL
```

**關鍵 URL 對應**：
```
本地開發：
  前端：http://localhost:3000
  後端：http://localhost:3001/api

生產環境：
  前端：https://car-v12.vercel.app
  後端：https://car-v12.onrender.com/api
```

---

**報告完成時間**：2026-03-24 13:45:00 UTC+8
**修復狀態**：✅ 已修復所有關鍵配置
