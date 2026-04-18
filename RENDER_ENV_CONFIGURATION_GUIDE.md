# 🔧 Render 環境變數配置 - 完整指南

## 🎯 目標
配置 `SUPABASE_SERVICE_ROLE_KEY` 和其他環境變數，使後端服務在 Render 上正常運行。

**預計時間**: 5-10 分鐘

---

## 📋 前提條件

### 您需要以下信息

| 項目 | 來源 | 狀態 |
|------|------|------|
| **Supabase Service Role Key** | https://app.supabase.com | ❓ 需要獲取 |
| **Supabase URL** | Supabase 控制台 | ✅ 已有 |
| **Supabase Anon Key** | Supabase 控制台 | ✅ 已有 |
| **Render 登錄信息** | Render 帳戶 | ✅ 需要 |

---

## 🚀 步驟 1: 獲取 Supabase Service Role Key

### 方式 A: 直接獲取 (推薦)

**第一步**: 進入 Supabase 控制台
```
https://app.supabase.com
```

**第二步**: 登錄您的帳戶
- 使用您的 Supabase 帳戶信息登錄
- 如果還沒有帳戶，需要先註冊

**第三步**: 選擇正確的專案
```
專案名稱: car_v12 (或類似的項目名)
專案 ID: ewnfshjptzkpbufjmmwy
```

**第四步**: 進入 API 設置
```
左側菜單 → Settings (設置)
                ↓
             Configuration
                ↓
              API Keys
```

或者直接訪問:
```
https://app.supabase.com/project/ewnfshjptzkpbufjmmwy/settings/api
```

**第五步**: 找到 Service Role Key
```
在 API Keys 頁面上，您會看到:

╔════════════════════════════════════════════════════╗
║                  PROJECT API KEYS                   ║
╠════════════════════════════════════════════════════╣
║                                                      ║
║  anon public                                         ║
║  Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    ║
║  ✓ Copy                                             ║
║                                                      ║
║  service_role secret                                ║
║  Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    ║  ← 我們需要這個
║  ✓ Copy                                             ║
║                                                      ║
╚════════════════════════════════════════════════════╝
```

**第六步**: 複製 Service Role Key
- 找到 "service_role secret" 部分
- 點擊 **Copy** 按鈕複製整個 Key
- 該 Key 會以 `eyJ...` 開頭
- **重要**: 這是敏感信息，不要分享給他人！

### 方式 B: 從 .env 文件獲取 (備用)

如果您在本地已有 `.env` 文件:
```bash
# 查看本地環境變數
cat backend/.env | grep SUPABASE_SERVICE_ROLE_KEY

# 或在 PowerShell 中
type backend\.env | findstr SUPABASE_SERVICE_ROLE_KEY
```

---

## 🌐 步驟 2: 進入 Render 儀表板

### 第一步: 登錄 Render
```
https://dashboard.render.com
```

**登錄選項**:
- GitHub 帳戶登錄 (推薦)
- Google 帳戶登錄
- Email 帳戶登錄

### 第二步: 驗證您在正確的組織
```
左上角應顯示: "Your Team" 或您的帳戶名
```

### 第三步: 查看服務列表
```
左側菜單 → Services
              ↓
    您應該看到列表:
    - car-v12-git-main-leo210223 (Frontend - Vercel)
    - car-v12-78d4ziwr9 (Backend - Render)
```

---

## 🔧 步驟 3: 進入後端服務設置

### 方式 A: 通過服務列表

```
1. 點擊 Services
2. 找到後端服務:
   - 名稱: car-v12-backend
   - 或包含 backend 的任何服務
3. 點擊進入該服務
```

### 方式 B: 直接訪問 URL

如果您已知道服務 ID，可以直接訪問:
```
https://dashboard.render.com/services/[SERVICE_ID]
```

示例:
```
https://dashboard.render.com/services/srv_XXXXX...
```

---

## 📝 步驟 4: 進入環境變數配置

### 第一步: 定位環境變數部分
```
服務頁面 → 向下滾動

您應該看到幾個標籤:
  - Overview (概覽)
  - Environment (環境變數) ← 點擊這個
  - Logs (日誌)
  - Deploys (部署)
  - Settings (設置)
```

### 第二步: 點擊 Environment 標籤
```
看起來應該是:
┌─────────────────────────────────────┐
│ Overview │ Environment │ Logs │ ... │
│          │    ✓ Current │      │     │
└─────────────────────────────────────┘
```

### 第三步: 查看當前環境變數
```
您應該看到一個列表，類似:

Variable Name              | Value
------------------------------------------
NODE_ENV                  | production
PORT                      | 3001
SUPABASE_URL              | https://ewn...
SUPABASE_ANON_KEY         | eyJ...
SUPABASE_SERVICE_ROLE_KEY | (空或不存在)  ← 需要添加
CORS_ORIGINS              | https://...
NPM_CONFIG_PRODUCTION     | false
```

---

## ✅ 步驟 5: 配置環境變數

### 5.1 添加 SUPABASE_SERVICE_ROLE_KEY (必須)

#### 方式 A: 如果變數已存在

```
1. 找到 SUPABASE_SERVICE_ROLE_KEY 行
2. 點擊該行右側的編輯按鈕 (鉛筆圖標)
3. 在彈出窗口中:
   - Value 欄位: 貼上複製的 Service Role Key
4. 點擊 Save 或 Update
```

#### 方式 B: 如果變數不存在

```
1. 向上滾動找到 "Add Environment Variable" 按鈕
   或 "New Variable" 按鈕

2. 點擊該按鈕，會看到:
   
   ┌──────────────────────────────┐
   │ Add Environment Variable      │
   ├──────────────────────────────┤
   │ Variable Name: [_________]    │
   │ Value:        [_________]    │
   │                              │
   │ [Cancel]      [Add Variable]  │
   └──────────────────────────────┘

3. 填入:
   - Variable Name: SUPABASE_SERVICE_ROLE_KEY
   - Value: (貼上複製的 Key)

4. 點擊 Add Variable
```

### 5.2 驗證其他環境變數

檢查以下變數是否正確設置:

| 變數名 | 期望值 | 檢查 |
|--------|--------|------|
| `NODE_ENV` | `production` | ✅ 已設置 |
| `PORT` | `3001` | ✅ 已設置 |
| `SUPABASE_URL` | `https://ewnfshjptzkpbufjmmwy.supabase.co` | ✅ 已設置 |
| `SUPABASE_ANON_KEY` | `eyJ...` (JWT token) | ✅ 已設置 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (長 token) | ✅ **需要添加** |
| `CORS_ORIGINS` | 多個 URL (逗號分隔) | ✅ 已設置 |
| `NPM_CONFIG_PRODUCTION` | `false` | ✅ 已設置 |

### 5.3 添加或更新其他變數 (可選)

如果需要調整其他變數:

**CORS_ORIGINS** (如果需要添加新的前端 URL)
```
當前值:
https://car-v12.vercel.app,https://car-v12-leo210223-langs-projects.vercel.app,http://localhost:3000,http://localhost:5173

如果要添加新 URL，格式為:
url1,url2,url3
```

---

## 💾 步驟 6: 保存並部署

### 第一步: 確認所有變數已正確設置
```
檢查清單:
☐ SUPABASE_SERVICE_ROLE_KEY 已填入
☐ 值不為空
☐ 值以 eyJ 開頭 (JWT token)
☐ 其他變數無誤
```

### 第二步: 自動保存
```
在 Render 中，環境變數通常會自動保存
您應該看到確認信息:
✅ Environment variables saved
或
✅ Configuration updated
```

### 第三步: 進入部署頁面
```
點擊 "Deployments" 標籤
或
在頁面頂部找到 "Redeploy Latest Commit" 按鈕
```

### 第四步: 重新部署
```
方式 A: 使用按鈕
┌─────────────────────────────────┐
│ [Redeploy Latest Commit] [+]    │
└─────────────────────────────────┘

方式 B: 使用部署列表
進入 Deployments 標籤
找到最近的部署 (會顯示 "failed")
點擊部署行
點擊 "Redeploy" 按鈕
```

### 第五步: 監控部署進度
```
您應該看到:
┌─────────────────────────────────┐
│ Deployment in progress...        │
│ [████░░░░░░░░░░] 25%            │
└─────────────────────────────────┘

或進入 Logs 標籤查看詳細信息
```

---

## 📊 驗證部署成功

### 檢查 1: 查看部署日誌

```
進入 Logs 標籤，應該看到:

[Startup] Verifying Supabase connection...
[Startup] ✅ Supabase connected
[Startup] Initializing Redis...
[Startup] ⚠️  Redis unavailable
==================================================
✅ Server running at http://localhost:3001
```

### 檢查 2: 測試健康檢查端點

在終端中運行:

```bash
# macOS/Linux
curl https://car-v12-backend.onrender.com/health

# Windows PowerShell
Invoke-WebRequest -Uri "https://car-v12-backend.onrender.com/health"
```

**成功響應** (狀態碼 200):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-24T10:30:00.000Z",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### 檢查 3: 查看部署狀態

```
在 Render 儀表板:
- 部署狀態應顯示: Live ✓
- 或顯示: In progress (如果還在部署)
- 不應顯示: Failed ✗
```

---

## 🆘 故障排除

### 問題 1: 部署仍然失敗

**症狀**:
```
❌ Instance failed: dbkwz
或
❌ Build failed
```

**檢查清單**:
1. ☐ SUPABASE_SERVICE_ROLE_KEY 是否為空?
2. ☐ 複製的 Key 是否完整 (以 eyJ 開頭)?
3. ☐ 是否點擊了 Save/Add Variable?
4. ☐ 是否點擊了 Redeploy?

**解決方案**:
- 重新複製 Supabase Service Role Key
- 確保沒有多餘的空格或換行
- 再次點擊 Redeploy

### 問題 2: 無法登錄 Render

**解決方案**:
1. 確認您使用的是正確的帳戶
2. 如果使用 GitHub 登錄，確認已授權 Render
3. 清除瀏覽器 Cookie 後重試
4. 使用隱私模式重試

### 問題 3: 找不到服務

**解決方案**:
1. 確認您在 Render 儀表板的正確頁面
2. 檢查左側菜單 → Services
3. 服務應該出現在列表中
4. 如果看不到，可能需要與 Render 支援聯繫

### 問題 4: 健康檢查失敗

**症狀**:
```
curl: (7) Failed to connect
或
Connection timeout
```

**原因和解決**:
| 原因 | 解決方案 |
|------|--------|
| 部署還未完成 | 等待 5-10 分鐘後重試 |
| CORS 設置問題 | 檢查 CORS_ORIGINS 變數 |
| 應用程序崩潰 | 查看 Logs 標籤找出錯誤 |
| 網絡問題 | 檢查您的網絡連接 |

---

## 📱 使用 Render 移動應用配置 (備用方案)

如果網頁有問題，可以使用 Render 官方移動應用:

1. 下載 Render 應用
2. 登錄您的帳戶
3. 選擇服務
4. 進入 Environment
5. 添加/編輯變數

---

## 🔐 安全最佳實踐

### ✅ 應該做的

1. ✅ **使用 Render Secrets** (敏感信息)
   ```
   將 SUPABASE_SERVICE_ROLE_KEY 標記為 Secret
   這樣它不會在日誌中顯示
   ```

2. ✅ **定期輪換金鑰**
   ```
   每 3-6 個月更新一次 Service Role Key
   ```

3. ✅ **限制金鑰權限**
   ```
   在 Supabase 中為 Service Role Key 設置作用域
   ```

4. ✅ **監控訪問日誌**
   ```
   定期檢查 Render 和 Supabase 的訪問日誌
   ```

### ❌ 不應該做的

1. ❌ **不要在 GitHub 中提交敏感信息**
2. ❌ **不要在郵件中分享金鑰**
3. ❌ **不要在公共論壇中發布金鑰**
4. ❌ **不要使用相同的金鑰在多個環境**

---

## 📋 配置檢查清單

### 配置前
- [ ] 已登錄 Render 帳戶
- [ ] 已訪問後端服務頁面
- [ ] 已打開 Supabase 控制台
- [ ] 已複製 Service Role Key

### 配置中
- [ ] 進入 Environment 標籤
- [ ] 添加/更新 SUPABASE_SERVICE_ROLE_KEY
- [ ] 確認值不為空
- [ ] 驗證其他變數正確
- [ ] 點擊 Save 或 Add Variable

### 配置後
- [ ] 點擊 Redeploy Latest Commit
- [ ] 等待部署完成 (5-10 分鐘)
- [ ] 查看部署日誌確認成功
- [ ] 測試健康檢查端點
- [ ] 驗證應用正常運行

---

## 📞 獲取幫助

### 相關文檔
- **[RENDER_FIX_GUIDE.md](./RENDER_FIX_GUIDE.md)** - Render 修復指南
- **[QUICK_FIX_REFERENCE.md](./QUICK_FIX_REFERENCE.md)** - 快速參考卡
- **[ERROR_ANALYSIS_REPORT.md](./ERROR_ANALYSIS_REPORT.md)** - 錯誤分析

### 外部資源
- **Render 文檔**: https://render.com/docs
- **Supabase 文檔**: https://supabase.com/docs
- **Render 支援**: https://render.com/support

### 常見問題

| 問題 | 答案 |
|------|------|
| **Service Role Key 在哪裡?** | Supabase 控制台 → Settings → API |
| **能否手動創建 Key?** | 不能，只能使用 Supabase 生成的 |
| **Key 會過期嗎?** | 不會，但建議定期輪換 |
| **能否刪除 Key?** | 可以，但會導致應用無法連接 |
| **部署需要多久?** | 通常 5-10 分鐘 |

---

## 🎯 完成指標

配置完成時，您應該看到:

```
✅ 環境變數已添加
✅ 部署已啟動
✅ 應用日誌顯示成功
✅ 健康檢查端點響應 200
✅ 應用狀態: Live
```

---

## 🚀 下一步

配置完成後:

1. **驗證前端連接**
   - 訪問 https://car-v12.vercel.app
   - 檢查是否有 CORS 錯誤

2. **測試 API 連通性**
   - 在前端進行登錄
   - 檢查 API 調用是否成功

3. **驗證核心功能**
   - 車輛審核
   - 所有車輛
   - 會員管理

4. **監控系統**
   - 定期檢查 Render 日誌
   - 監控性能指標
   - 設置警報

---

**狀態**: ✅ 配置指南完成  
**最後更新**: 2026-03-24  
**預計完成時間**: 10 分鐘

祝您配置順利！🎉
