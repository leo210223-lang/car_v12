# Render 後端部署 - 修復指南

## 🔴 當前問題
**服務**: car-v12-backend  
**狀態**: Instance failed: dbkwz  
**原因**: 環境變數配置不完整

---

## ⚡ 快速修復步驟 (3分鐘)

### 1. 登錄 Render 儀表板
https://dashboard.render.com/

### 2. 進入後端服務
- 點擊 **car-v12-backend** 服務
- 進入 **Environment** 標籤

### 3. 驗證環境變數 ✅

確保以下變數已設置且**不為空**：

```
SUPABASE_URL=https://ewnfshjptzkpbufjmmwy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmZzaGpwdHprcGJ1ZmptbXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEwNzMsImV4cCI6MjA4OTU3NzA3M30.NFgofmyAW9sX5T-ox_8sWDuJc7j6PIY44oo6yBcqxPk
SUPABASE_SERVICE_ROLE_KEY=<你的 Service Role Key - 需要手動填入>
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://car-v12.vercel.app,https://car-v12-leo210223-langs-projects.vercel.app,http://localhost:3000,http://localhost:5173
NPM_CONFIG_PRODUCTION=false
```

### 4. 特別關注：SUPABASE_SERVICE_ROLE_KEY
⚠️ **這是導致失敗的關鍵變數！**

- 檢查此變數是否為**空白**或**未設置**
- 必須從你的 Supabase 專案設置中複製
- **方式**: 
  1. 進入 [Supabase 控制台](https://app.supabase.com)
  2. 選擇你的專案 (`ewnfshjptzkpbufjmmwy`)
  3. 進入 **Settings → API** → **Service Role Key**
  4. 複製該 Key
  5. 在 Render 中貼上

### 5. 重新部署
點擊 **Deployments** 標籤，然後:
- 點擊最新失敗的部署
- 點擊 **Redeploy Latest Commit**

### 6. 監控構建日誌
- 查看實時日誌確認以下事項:
  ```
  ✅ Installing dependencies...
  ✅ Building TypeScript...
  ✅ Starting Node.js server...
  ✅ Supabase connected
  ✅ Server running at http://localhost:3001
  ```

---

## 🔧 我已做的改進

### backend/src/config/env.ts
```typescript
// ✅ 改進: 環境變數驗證現在更友善
// - 生產環境: 嚴格檢查所有必需變數
// - 其他環境: 警告但不阻止啟動
```

### backend/src/index.ts
```typescript
// ✅ 改進: 啟動日誌更詳細
// - 顯示 Supabase URL (部分)
// - 顯示 CORS 來源
// - 幫助診斷配置問題
```

### backend/render.yaml
```yaml
# ✅ 更新: SUPABASE_SERVICE_ROLE_KEY 說明更清楚
# sync: false - 必須手動在 Render 儀表板設置
```

---

## 📊 故障排除清單

| 項目 | 檢查項目 | 預期結果 |
|------|---------|--------|
| **SUPABASE_SERVICE_ROLE_KEY** | 是否為空 | ❌ 不能為空 |
| **SUPABASE_URL** | 是否包含 `ewnfshjptzkpbufjmmwy` | ✅ 應該包含 |
| **SUPABASE_ANON_KEY** | 是否以 `eyJ` 開頭 | ✅ JWT token |
| **NODE_ENV** | 是否為 `production` | ✅ 應該是 production |
| **PORT** | 是否為 `3001` | ✅ 應該是 3001 |
| **CORS_ORIGINS** | 是否包含 Vercel URL | ✅ 應該包含 |

---

## 🚀 部署後驗證

部署成功後，在瀏覽器測試以下端點：

```bash
# 健康檢查
curl https://car-v12-backend.onrender.com/health

# 應返回:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-24T...",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

---

## 📞 如果仍然失敗

### 查看完整構建日誌
1. 進入 **Logs** 標籤
2. 尋找關鍵詞:
   - `Error` - 構建或啟動錯誤
   - `missing` - 缺少依賴或環境變數
   - `ENOENT` - 文件未找到

### 常見錯誤消息

| 錯誤 | 原因 | 解決方案 |
|------|------|--------|
| `Missing required env vars` | 缺少環境變數 | 檢查 SUPABASE_SERVICE_ROLE_KEY |
| `ENOENT: no such file or directory` | 構建失敗 | 運行 `npm run build` 檢查本地構建 |
| `Cannot find module` | 依賴缺失 | 運行 `npm install` 確保本地依賴完整 |
| `Connection refused` | Supabase 連線失敗 | 檢查 SUPABASE_URL 和金鑰是否正確 |

---

## 💡 最佳實踐

### 1. 使用 Render Secrets 存儲敏感信息
```bash
# 而不是直接在 environment 中設置，使用 Secrets:
SUPABASE_SERVICE_ROLE_KEY = ${SUPABASE_SERVICE_ROLE_KEY}  # 引用 Secret
```

### 2. 定期驗證環境變數
每次部署前檢查 Render 儀表板中的環境變數

### 3. 本地測試
```bash
# 模擬 Render 環境進行本地測試
NODE_ENV=production npm run start
```

### 4. 監控部署日誌
Render 提供實時日誌，便於診斷問題

---

## 📝 相關文檔

- [RENDER_DEPLOYMENT_DIAGNOSIS.md](./RENDER_DEPLOYMENT_DIAGNOSIS.md) - 詳細診斷報告
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Vercel 前端部署指南
- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - 總體系統狀態總結

---

**最後更新**: 2026-03-24  
**狀態**: 待修復 (預期 5 分鐘內恢復)
