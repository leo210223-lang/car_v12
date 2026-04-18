# Render 後端部署診斷報告

## 🚨 問題狀態
- **服務名稱**: car-v12-backend
- **部署環境**: Render.com (免費方案)
- **錯誤類型**: Instance failed: dbkwz
- **狀態**: ❌ 部署失敗

---

## 🔍 根本原因分析

### 1. 環境變數配置問題
```yaml
# 當前 render.yaml 中的問題：
sync: false  # SUPABASE_SERVICE_ROLE_KEY 的同步設置為 false
```

**問題分析**:
- `SUPABASE_SERVICE_ROLE_KEY` 標記為 `sync: false`，意味著該變數需要手動在 Render 控制台設置
- 如果未在 Render 儀表板中正確配置，應用啟動時會因缺少必需環境變數而失敗
- 應用程式的 `env.ts` 在啟動時驗證此變數是必需的

### 2. 可能的根本原因

#### A. 環境變數未在 Render 儀表板配置
- `SUPABASE_SERVICE_ROLE_KEY` 為空或未設置

#### B. 構建命令可能失敗
- 依賴安裝問題（如 `npm install --production=false` 失敗）
- TypeScript 編譯錯誤

#### C. Node.js 版本兼容性
- Render 上的 Node.js 版本與本地版本不匹配

---

## ✅ 修復方案

### 步驟 1: 更新 render.yaml (改進同步策略)

```yaml
# 將 SUPABASE_SERVICE_ROLE_KEY 改為自動同步
- key: SUPABASE_SERVICE_ROLE_KEY
  sync: true  # 改為 true，允許自動同步
  # 或者使用 Render secret reference:
  # value: ${SUPABASE_SERVICE_ROLE_KEY}
```

### 步驟 2: 在 Render 控制台手動驗證環境變數

必須在 Render 儀表板設置以下變數：
1. ✅ `SUPABASE_URL` - 已配置
2. ✅ `SUPABASE_ANON_KEY` - 已配置
3. ❌ `SUPABASE_SERVICE_ROLE_KEY` - **需驗證**
4. ✅ `PORT` - 已設置為 3001
5. ✅ `NODE_ENV` - 已設置為 production
6. ✅ `CORS_ORIGINS` - 已配置
7. ✅ `NPM_CONFIG_PRODUCTION` - 已設置為 false

### 步驟 3: 檢查構建過程

當前構建命令:
```bash
npm install --production=false && npm run build
```

**驗證**:
- `npm run build` 執行 `tsc`（TypeScript 編譯）
- 確保生成 `dist/` 目錄

### 步驟 4: 修改啟動策略（使其對部署更容忍）

可選：在 `env.ts` 中允許在非生產環境下缺少 `SUPABASE_SERVICE_ROLE_KEY`:

```typescript
// backend/src/config/env.ts
function validateRequiredEnvVars(): void {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    // 在生產環境嚴格檢查，其他環境寬鬆
    if (process.env['NODE_ENV'] === 'production') {
      if (!process.env[varName] || process.env[varName]?.trim() === '') {
        missing.push(varName);
      }
    } else {
      // 開發/測試環境可以跳過
      console.warn(`[ENV] Warning: ${varName} not set`);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `[ENV] Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nPlease check your .env file or environment configuration.`
    );
  }
}
```

---

## 🛠️ 立即行動清單

### 優先順序 1 (必須)
- [ ] 登錄 Render 儀表板
- [ ] 進入 `car-v12-backend` 服務設置
- [ ] 驗證 Environment Variables:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` 已設置且不為空
  - [ ] `SUPABASE_URL` 正確
  - [ ] `SUPABASE_ANON_KEY` 正確
- [ ] 點擊 "Deploy Latest Commit" 重新部署

### 優先順序 2 (改進)
- [ ] 更新 `render.yaml` 中 `SUPABASE_SERVICE_ROLE_KEY` 的 `sync` 設置
- [ ] 推送至 GitHub
- [ ] Render 會自動重新部署

### 優先順序 3 (優化)
- [ ] 考慮使用 Render Secrets 而非環境變數存儲敏感信息
- [ ] 添加構建日誌檢查以診斷 npm/tsc 失敗

---

## 📋 檢查清單

| 項目 | 狀態 | 備註 |
|------|------|------|
| render.yaml 配置 | ⚠️ | SUPABASE_SERVICE_ROLE_KEY 的 sync 設置可能有問題 |
| 環境變數完整性 | ❌ | SUPABASE_SERVICE_ROLE_KEY 需要驗證 |
| 構建命令 | ✅ | npm install && npm run build |
| 啟動命令 | ✅ | npm run start (node dist/index.js) |
| 主程序入口 | ✅ | dist/index.js 存在且可執行 |
| Node.js 版本 | ⚠️ | 需驗證 Render 使用的 Node.js 版本 |

---

## 🔗 相關資源

- **Render 環境變數文檔**: https://render.com/docs/environment-variables
- **Render Secrets 管理**: https://render.com/docs/configure-environment-variables
- **構建和部署日誌**: Render 儀表板 > Logs 標籤

---

## 📝 後續步驟

1. **立即**: 在 Render 儀表板驗證 `SUPABASE_SERVICE_ROLE_KEY`
2. **今日**: 更新 render.yaml 並重新部署
3. **本週**: 監控部署日誌確保無構建錯誤
4. **長期**: 考慮從免費方案升級至付費方案以獲得更好的支持和性能

---

**最後更新**: 2026-03-24
**狀態**: 待修復
