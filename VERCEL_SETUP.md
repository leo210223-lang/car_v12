# 🚀 Vercel 部署指南 - FaCai-B Platform

## 概述

本項目使用以下部署方案：
- **前端（Next.js）**：部署在 **Vercel**
- **後端（Express）**：部署在 **Render** （或其他平台）

---

## 📋 環境變數配置

### Vercel 環境變數設定步驟

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的項目
3. 進入 **Settings → Environment Variables**
4. 添加以下環境變數：

| 變數名 | 值 | 說明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ewnfshjptzkpbufjmmwy.supabase.co` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase 匿名金鑰 |
| `NEXT_PUBLIC_API_URL` | `https://car-v12.onrender.com/api` | **後端 API 地址** |

> **重要**：確保 `NEXT_PUBLIC_API_URL` 指向你的**生產後端 URL**（例如 Render 上的後端）

---

## 🔧 本地開發配置

### 前端環境變數（`.env.local`）

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=發財B平台
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 後端環境變數（`.env`）

```bash
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 📦 部署流程

### 1️⃣ 後端部署（Render）

已配置：`./render.yaml`

**關鍵設定：**
- **Root Directory**: `backend`
- **Build Command**: `npm install --production=false && npm run build`
- **Start Command**: `npm run start`
- **Environment**: Node.js
- **Port**: `3001`

### 2️⃣ 前端部署（Vercel）

配置文件：`./vercel.json`

**部署步驟：**

```bash
# 方式 1：使用 Vercel CLI
npm install -g vercel
vercel login
vercel

# 方式 2：使用 GitHub 連接
# 1. 推送代碼到 GitHub
# 2. 在 Vercel Dashboard 連接你的 GitHub repo
# 3. Vercel 會自動部署
```

**驗證部署成功：**
```bash
# 檢查 Vercel 上的環境變數已設定
# 檢查構建日誌無錯誤
# 訪問 https://car-v12.vercel.app 確認可訪問
```

---

## ✅ 故障排除

### 問題 1：前端無法連接後端

**症狀**：API 請求失敗，返回 CORS 錯誤

**解決方案**：
1. 檢查 `NEXT_PUBLIC_API_URL` 是否正確設定在 Vercel 環境變數
2. 確認後端的 `CORS_ORIGINS` 包含 `https://car-v12.vercel.app`
3. 後端 `render.yaml` 應包含：
   ```yaml
   CORS_ORIGINS: https://car-v12.vercel.app,http://localhost:3000
   ```

### 問題 2：Vercel 構建失敗

**症狀**：部署時 build 命令失敗

**解決方案**：
1. 檢查 Node.js 版本：`node --version` (應 >= 18)
2. 檢查依賴是否安裝成功：
   ```bash
   npm install --legacy-peer-deps
   ```
3. 檢查構建日誌中的詳細錯誤

### 問題 3：「車輛審核」、「所有車輛」、「會員管理」無法使用

**症狀**：頁面載入但功能不可用

**解決方案**：
1. 打開瀏覽器開發工具 (F12)
2. 檢查 **Network** 選項卡中的 API 請求
3. 確認：
   - API URL 是否正確（應為後端 URL）
   - 響應狀態是否為 200
   - CORS 是否通過

---

## 🚀 快速啟動

### 本地開發

```bash
# 終端 1: 啟動後端
cd backend
npm install
npm run build
npm run start

# 終端 2: 啟動前端
cd frontend
npm install
npm run dev

# 訪問 http://localhost:3000
```

### 生產環境

- **前端**：自動部署到 Vercel（推送到 main 分支）
- **後端**：自動部署到 Render（推送到 main 分支）

---

## 📝 部署檢查清單

- [ ] 後端環境變數正確設定（Render）
- [ ] 前端環境變數正確設定（Vercel）
- [ ] 後端 CORS_ORIGINS 包含 Vercel 域名
- [ ] API_URL 在前端指向生產後端
- [ ] 本地測試通過
- [ ] 部署日誌無錯誤
- [ ] 生產環境功能可正常使用

---

## 📞 聯絡方式

如有任何問題，請查看：
- Render 部署日誌：https://dashboard.render.com
- Vercel 部署日誌：https://vercel.com/dashboard
- 專案文檔：`./AGENTS.md`, `./README.md`
