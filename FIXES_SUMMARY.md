# ✅ 修復驗證清單

## 🔧 已進行的修復

### 1. 前端環境變數 ✅

**文件**：`frontend/.env.local`
```bash
# ✅ 已修正為本地後端 URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. 前端 API 客户端 ✅

**文件**：`frontend/src/lib/api.ts`
```typescript
// ✅ 已修正，移除了 /v1 後綴
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

### 3. Vercel 部署配置 ✅

**文件**：`vercel.json`
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

## 📋 驗證步驟（必須執行）

### Step 1: 啟動後端

```bash
cd backend
npm run build
npm start
```

**預期**：服務器在 http://localhost:3001 運行

### Step 2: 啟動前端（新終端）

```bash
cd frontend
npm run dev
```

**預期**：Next.js 在 http://localhost:3000 運行

### Step 3: 測試 API

訪問：http://localhost:3000

驗證：
- ✅ 「車輛審核」功能可用
- ✅ 「所有車輛」功能可用  
- ✅ 「會員管理」功能可用
- ✅ Network 顯示 API 指向 `http://localhost:3001/api/v1/...`

---

## 🚀 生產部署

### Vercel 環境變數設定

```
NEXT_PUBLIC_SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://car-v12.onrender.com/api
```

### 推送代碼

```bash
git add .
git commit -m "fix: 修復 Vercel 部署和 API URL 配置"
git push origin main
```

---

## 📊 簡明對比

| 項目 | 本地 | 生產 |
|------|------|------|
| 前端 | localhost:3000 | car-v12.vercel.app |
| 後端 | localhost:3001 | car-v12.onrender.com |
| API URL | http://localhost:3001/api | https://car-v12.onrender.com/api |

---

**狀態**：✅ 所有關鍵修復已完成
