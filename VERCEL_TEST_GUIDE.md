# Vercel 部署和測試快速指南

## 📋 修復概要

已修復三個主要問題：
1. ✅ **車輛名稱/照片映射** - 後端數據轉換邏輯修復
2. ✅ **Admin 儀表板統計** - 從真實數據庫取得統計而非 Mock 數據
3. ✅ **服務編輯同步** - 改用實時 API 調用確保同步

**Git 提交**:
- `c3258a4`: 修復程式碼
- `c1c4eff`: 添加修復報告

---

## 🚀 部署步驟

### 1. 確認代碼已推送 ✓
```bash
git push origin main  # 已完成
```

### 2. Vercel 部署
1. 進入 [Vercel 控制台](https://vercel.com)
2. 選擇項目 `car_v12`
3. 點擊「Deployments」
4. 選擇最新提交（`c1c4eff`）並觸發重新部署
   - 或等待 Vercel 自動部署（通常在 30 秒內開始）

### 3. 後端部署（如有單獨部署）
- 如後端部署在 Render/其他平台，需手動觸發部署

---

## 🧪 測試清單

### 測試 1️⃣ : 車輛名稱/照片顯示 ✓

**位置**: `https://car-v12.vercel.app` (首頁)

**步驟**:
1. 進入首頁，查看車輛列表
2. 驗證每個車輛卡片顯示格式：
   - ✅ `[年份] [品牌名] [規格名]`（例: `2024 Toyota Camry`）
   - ✅ 圖片正確加載
3. 點擊進入車輛詳情，驗證完整名稱：
   - ✅ `[年份] [品牌名] [規格名] [型號名]`

**預期結果**:
- 所有車輛名稱正確顯示
- 車輛圖片正常加載
- 無缺失或錯亂的信息

**故障排查**:
- 若名稱仍為空：檢查後端是否部署成功
- 若圖片未加載：檢查 Supabase storage bucket 權限

---

### 測試 2️⃣ : Admin 儀表板統計 ✓

**位置**: `https://car-v12.vercel.app/admin/dashboard`

**前置條件**:
- 需用 admin 帳號登錄
- 確保數據庫中有測試數據

**步驟**:
1. 登錄 Admin 帳號
2. 進入「儀表板」頁面
3. 查看四個統計卡片：
   - 🟦 **待審核車輛** - 顯示 `status = 'pending'` 的車輛數
   - 🟩 **上架車輛總數** - 顯示 `status = 'approved'` 的車輛數
   - 🟨 **調做需求** - 顯示活躍的 `trade_requests`
   - 🟪 **會員總數** - 顯示所有用戶數

4. **驗證動態更新**:
   - 在另一個標籤頁進行以下操作：
     a. 新增待審核車輛 → 返回儀表板 → 「待審核車輛」應 +1
     b. 核准一個車輛 → 返回儀表板 → 「上架車輛」應 +1，「待審核」應 -1

**預期結果**:
- 四個統計卡片顯示準確的實時數據
- 操作後統計數字立即更新（無需手動刷新）

**故障排查**:
- 若統計數字為 0：檢查後端 API `/api/admin/dashboard/stats` 是否工作
- 若更新遲緩：檢查瀏覽器緩存設定

---

### 測試 3️⃣ : 服務編輯同步 ✓

**Admin 編輯端**: `https://car-v12.vercel.app/admin/settings/services`  
**User 查看端**: `https://car-v12.vercel.app/services`

**步驟**:

**A. Admin 編輯** (Admin 帳號)
1. 進入 Admin「設定 → 更多服務」
2. 編輯一個服務，例如「娛樂城」：
   - 修改名稱（例: 改為「娛樂城 v2」）
   - 修改網址（例: `https://entertainment.example.com`）
   - 點擊「保存」
3. 確認顯示「服務已更新」提示

**B. User 查看** (User 帳號或新的瀏覽窗口)
1. 進入「更多服務」頁面
2. 查看「娛樂城」服務：
   - ✅ 名稱應顯示為新的名稱（「娛樂城 v2」）
   - ✅ 網址指向新的連結
3. 若編輯未顯示，刷新頁面（F5）應立即更新

**預期結果**:
- Admin 編輯後，User 端實時或刷新後看到最新數據
- 無任何緩存問題導致的數據不一致

**故障排查**:
- 若 User 端未更新：檢查浏覽器緩存或服務 worker
- 若 Admin 編輯失敗：檢查 API `/api/admin/services` 是否返回成功

---

## 📊 性能測試（可選）

使用瀏覽器開發者工具檢查：

```
Network 標籤:
- GET /api/admin/dashboard/stats    → <200ms (期望)
- GET /api/admin/services           → <200ms (期望)
- GET /vehicles                     → <500ms (期望)

Console 標籤:
- 無紅色錯誤
- 無未處理的 Promise rejection
```

---

## 🔍 日誌檢查

### 前端日誌
進入瀏覽器開發者工具（F12），查看 Console 標籤：
```javascript
// 正常日誌
[API] GET /api/admin/dashboard/stats → {success: true, data: {...}}
[API] GET /admin/services → {success: true, data: {...}}

// 異常日誌（需要調查）
Failed to fetch dashboard stats: ...
更新失敗
```

### 後端日誌
檢查後端日誌（若部署在 Render）：
- 進入 Render 控制台 → 選擇服務 → Logs
- 搜尋 `[Dashboard]` 或 `[SettingsService]` 標籤

---

## ⚠️ 已知限制

- **Mock 數據仍存在於代碼中** - 前端開發模式下 API 失敗會降級到 Mock 數據
- **服務實時推送** - 當前實現基於 HTTP 拉取，不支持 WebSocket 推送
- **緩存政策** - 某些數據可能被瀏覽器或 CDN 緩存，導致延遲

## 🔄 回滾方案

若部署後發現問題，可快速回滾：

```bash
# 查看提交歷史
git log --oneline

# 回滾到上一個穩定版本
git revert c1c4eff

# 推送回滾
git push origin main
```

---

## 📞 支持

測試過程中遇到問題，請提供：
1. 錯誤截圖或日誌
2. 重現步驟
3. 瀏覽器版本和 OS
4. 後端 API 響應（開發者工具 Network 標籤）

祝測試順利！ 🎉
