# 🚀 FaCai-B 車輛審核系統 - 測試執行下一步

**日期**: 2025-03-19  
**版本**: 1.0  
**狀態**: 🎯 準備深度測試執行

---

## 📊 當前狀態概覽

### ✅ 已完成 (第 1-5 階段)

| 階段 | 項目 | 完成度 | 狀態 |
|------|------|--------|------|
| 1️⃣ | 代碼實現 | 100% | ✅ |
| 2️⃣ | 路由審計 | 100% | ✅ |
| 3️⃣ | 文檔編寫 | 100% | ✅ |
| 4️⃣ | 測試計劃 | 100% | ✅ |
| 5️⃣ | 自動化工具 | 100% | ✅ |

### 🔄 進行中 (第 6-7 階段)

| 階段 | 項目 | 預計時間 | 優先級 |
|------|------|---------|--------|
| 6️⃣ | 自動化測試執行 | 30 分鐘 | 🔴 高 |
| 7️⃣ | 手動 API 測試 | 2 小時 | 🔴 高 |
| 8️⃣ | 性能和負載測試 | 1 小時 | 🟠 中 |
| 9️⃣ | 前端 UI 測試 | 1.5 小時 | 🟠 中 |
| 🔟 | 安全測試 | 1 小時 | 🟠 中 |

### ⏳ 待執行 (第 8-10 階段)

| 階段 | 項目 | 預計時間 |
|------|------|---------|
| 📋 | 文檔簽署 | 30 分鐘 |
| 📊 | 結果彙總 | 30 分鐘 |
| ✅ | 最終批准 | 依變更而定 |

---

## 🎯 立即行動項 (優先級排序)

### 🔴 P0: 關鍵驗證 (今天完成)

#### 1. 環境驗證 (5 分鐘)
```bash
# 檢查後端運行
curl http://localhost:5000/api/v1/health -s | jq '.status'
# 預期: "ok"

# 檢查前端運行
curl http://localhost:3000 -s | grep -q "<!DOCTYPE" && echo "✅ 前端就緒" || echo "❌ 前端離線"
```

#### 2. 認證測試 (10 分鐘)
```bash
# 獲取測試令牌
curl -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' | jq '.data.token'

# 保存為 ADMIN_TOKEN 環境變數
export ADMIN_TOKEN="$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{\"role\":\"admin\"}' | jq -r '.data.token')"

echo "✅ Token: ${ADMIN_TOKEN:0:20}..."
```

#### 3. 核心端點驗證 (15 分鐘)
```bash
# 1️⃣ 待審核列表
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.data.data | length'
# 預期: 數字 >= 0

# 2️⃣ 選擇一個待審核車輛 ID
VEHICLE_ID=$(curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.data.data[0].id' 2>/dev/null || echo "")

if [ -z "$VEHICLE_ID" ]; then
  echo "⚠️ 沒有待審核車輛，使用測試 UUID"
  VEHICLE_ID="123e4567-e89b-12d3-a456-426614174000"
fi

echo "📌 使用車輛 ID: $VEHICLE_ID"

# 3️⃣ 取得車輛詳情
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.data'
```

---

### 🟠 P1: 深度測試 (1-2 天內完成)

#### 步驟 1: 運行自動化測試集合 (30 分鐘)

```bash
# 方法 A: 使用自動化腳本 (最快)
cd /path/to/car_v12
chmod +x test-automation.sh
./test-automation.sh 2>&1 | tee test-results-$(date +%Y%m%d-%H%M%S).log

# 方法 B: 使用 Postman (互動式)
# 1. 在 Postman 中導入 FaCai-B_API_Collection.postman_collection.json
# 2. 設置環境變數: BASE_URL, ADMIN_TOKEN
# 3. 運行 Collection Runner
```

#### 步驟 2: 手動核心流程驗證 (1 小時)

```bash
# 流程 1: 完整車輛審核流程
# 1. 獲取待審核車輛
# 2. 檢查詳情
# 3. 核准車輛
# 4. 驗證狀態變更

# 流程 2: 代客建檔流程
# 1. 創建代客建檔
# 2. 上傳圖片
# 3. 驗證已上傳圖片
# 4. 驗證狀態

# 流程 3: 拒絕和原因追蹤
# 1. 拒絕車輛
# 2. 驗證原因已保存
# 3. 驗證狀態變更
```

#### 步驟 3: 邊界情況測試 (1 小時)

```bash
# UUID 驗證邊界
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/invalid-id/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  # 預期: 400 或 422

# 認證邊界
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer invalid-token"
  # 預期: 401

# 授權邊界
# 使用 user 角色令牌嘗試訪問 admin 端點
# 預期: 403
```

---

### 🟡 P2: 優化測試 (第 2-3 天)

#### 性能基準測試 (1 小時)

```bash
# 使用 Apache Bench 或 wrk
# 測試吞吐量: /api/v1/admin/vehicles/pending
ab -n 100 -c 10 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/v1/admin/vehicles/pending

# 預期: 響應時間 < 500ms, 失敗率 < 1%
```

#### 前端 UI 驗證 (1.5 小時)

```bash
# 使用瀏覽器開發者工具或 Playwright
# 1. 導航到審核頁面: http://localhost:3000/admin/audit
# 2. 驗證列表加載
# 3. 點擊車輛詳情
# 4. 驗證核准/拒絕按鈕
# 5. 測試圖片上傳
```

#### 負載和並發測試 (1 小時)

```bash
# 模擬 50 個並發用戶
# 預期: 系統應該無崩潰，性能降級 < 20%
```

---

## 📋 詳細測試檢查清單

### ✅ API 層級測試

```
待審核列表:
  [ ] GET /api/v1/admin/vehicles/pending - 成功取得列表
  [ ] GET /api/v1/admin/vehicles/pending?limit=10 - 限制結果數
  [ ] GET /api/v1/admin/vehicles/pending?cursor=xxx - 分頁游標

車輛詳情:
  [ ] GET /api/v1/admin/vehicles/{id}/detail - 成功取得詳情
  [ ] GET /api/v1/admin/vehicles/{invalid-id}/detail - 400 錯誤
  [ ] GET /api/v1/admin/vehicles/{not-exist-id}/detail - 404 錯誤

車輛核准:
  [ ] POST /api/v1/admin/vehicles/{id}/approve - 成功核准
  [ ] POST /api/v1/admin/vehicles/{id}/approve (已核准) - 衝突錯誤
  [ ] 核准後查詢狀態 - status = approved

車輛拒絕:
  [ ] POST /api/v1/admin/vehicles/{id}/reject - 成功拒絕
  [ ] POST /api/v1/admin/vehicles/{id}/reject (已拒絕) - 衝突錯誤
  [ ] 拒絕後查詢原因 - reason 已保存

圖片上傳:
  [ ] POST /api/v1/admin/vehicles/{id}/images - 上傳一張圖片
  [ ] POST /api/v1/admin/vehicles/{id}/images - 上傳多張圖片
  [ ] POST /api/v1/admin/vehicles/{id}/images (無效檔案) - 400 錯誤

代客建檔:
  [ ] POST /api/v1/admin/vehicles/proxy - 創建代客建檔
  [ ] POST /api/v1/admin/vehicles/proxy - 驗證返回 ID
  [ ] 驗證新車輛已保存
```

### ✅ 認證和授權測試

```
認證:
  [ ] 無令牌訪問 - 401 錯誤
  [ ] 無效令牌 - 401 錯誤
  [ ] 過期令牌 - 401 錯誤
  [ ] 有效令牌 - 200 成功

授權:
  [ ] Admin 訪問 /admin/vehicles - 200 成功
  [ ] User 訪問 /admin/vehicles - 403 禁止
  [ ] Guest 訪問 /admin/vehicles - 403 禁止
```

### ✅ 數據驗證測試

```
輸入驗證:
  [ ] 空白請求 - 400 錯誤
  [ ] 無效 JSON - 400 錯誤
  [ ] 缺少必填字段 - 400 錯誤
  [ ] 無效數據類型 - 400 錯誤

ID 驗證:
  [ ] 有效 UUID - 接受
  [ ] 無效 UUID 格式 - 400 錯誤
  [ ] 不存在的 ID - 404 錯誤
  [ ] 空字符串 ID - 400 錯誤
```

### ✅ 業務邏輯測試

```
狀態流:
  [ ] pending → approved → ✅
  [ ] pending → rejected → ✅
  [ ] approved → 不能更改狀態 → ✅
  [ ] rejected → 不能更改狀態 → ✅

圖片流:
  [ ] 上傳 → 驗證存在 → ✅
  [ ] 多張上傳 → 驗證數量 → ✅
  [ ] 無效檔案 → 拒絕 → ✅

代客建檔:
  [ ] 創建 → 驗證 status = pending → ✅
  [ ] 創建 → 驗證 owner_dealer_id 正確 → ✅
  [ ] 創建 → 驗證可上傳圖片 → ✅
```

---

## 📊 測試執行時間表

### 第 1 天 (今天)

| 時間 | 活動 | 預計時間 | 狀態 |
|------|------|---------|------|
| 08:00 | 環境驗證 | 5 分鐘 | ⏳ |
| 08:05 | 認證測試 | 10 分鐘 | ⏳ |
| 08:15 | 核心端點驗證 | 15 分鐘 | ⏳ |
| 08:30 | 自動化測試運行 | 30 分鐘 | ⏳ |
| 09:00 | 結果分析 | 30 分鐘 | ⏳ |
| 09:30 | **第 1 天完成** | | |

### 第 2 天

| 時間 | 活動 | 預計時間 |
|------|------|---------|
| 08:00 | 手動核心流程測試 | 1 小時 |
| 09:00 | 邊界情況測試 | 1 小時 |
| 10:00 | 缺陷修復 (如需要) | 1-2 小時 |
| 12:00 | 性能和負載測試 | 1 小時 |
| 13:00 | **第 2 天完成** | |

### 第 3 天

| 時間 | 活動 | 預計時間 |
|------|------|---------|
| 08:00 | 前端 UI 測試 | 1.5 小時 |
| 09:30 | 安全測試 | 1 小時 |
| 10:30 | 缺陷修復和驗證 | 1-2 小時 |
| 12:00 | 最終驗證 | 30 分鐘 |
| 12:30 | **完成** | |

---

## 🛠️ 工具和資源

### 已準備的資源

| 資源 | 位置 | 用途 |
|------|------|------|
| 自動化腳本 | `test-automation.sh` | 32 個 API 測試用例 |
| Postman 集合 | `FaCai-B_API_Collection.postman_collection.json` | 互動式 API 測試 |
| 測試計劃 | `COMPREHENSIVE_TEST_PLAN.md` | 詳細測試用例 |
| 執行指南 | `TEST_EXECUTION_GUIDE.md` | 逐步說明 |
| 快速查詢 | `QUICK_TEST_REFERENCE.md` | 常用命令 |

### 推薦工具

```bash
# API 測試
curl                  # 最基本 ✅ (已安裝)
Postman              # 互動式 📮 (建議使用)
httpie               # 友好的 curl 替代品
  apt-get install httpie  # 或 brew install httpie

# 性能測試
ab (Apache Bench)    # 簡單負載測試
  apt-get install apache2-utils
wrk                  # 高性能負載測試
  brew install wrk

# 前端測試
Playwright           # 自動化 UI 測試
  npm install -g @playwright/test
```

---

## 📈 預期成果

完成此測試執行後，您將獲得：

### 1. 完整的驗證報告
- ✅ 32 個 API 測試結果
- ✅ 14 個邊界情況結果
- ✅ 3 個集成工作流結果
- ✅ 性能基準數據

### 2. 缺陷報告 (如有)
- 優先級分類
- 詳細步驟重現
- 預期 vs 實際結果
- 建議修復方案

### 3. 簽署的批准文件
- QA 簽署
- 開發人員確認
- 管理層批准
- 上線許可

### 4. 最終交付物
- 測試結果彙總
- 性能報告
- 安全評估
- 上線清單

---

## ⚠️ 常見問題和故障排除

### Q1: 環境驗證失敗？

```bash
# 檢查後端是否運行
ps aux | grep node | grep -v grep

# 啟動後端
cd backend
npm start

# 檢查前端是否運行
curl -I http://localhost:3000

# 啟動前端
cd frontend
npm run dev
```

### Q2: 認證令牌過期？

```bash
# 重新獲取令牌
curl -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' | jq '.data.token'

# 更新環境變數
export ADMIN_TOKEN="new-token"
```

### Q3: 404 錯誤在車輛 ID？

```bash
# 確認使用正確的 UUID 格式
# 正確: 123e4567-e89b-12d3-a456-426614174000
# 錯誤: pv001, vehicle123 等

# 查詢實際車輛 ID
curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.data.data[].id'
```

### Q4: CORS 錯誤？

```bash
# 檢查 CORS 配置
curl -I -X OPTIONS http://localhost:5000/api/v1/admin/vehicles/pending \
  -H "Origin: http://localhost:3000"

# 驗證響應頭中有 Access-Control-Allow-Origin
```

### Q5: 圖片上傳失敗？

```bash
# 檢查檔案大小和類型
ls -lh test-image.jpg

# 驗證支援的類型: jpeg, png, webp, gif
# 確認大小 < 10MB

# 測試上傳
curl -X POST http://localhost:5000/api/v1/admin/vehicles/{id}/images \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-image.jpg"
```

---

## 📞 支援和聯繫

### 遇到問題？

1. 檢查 [`QUICK_TEST_REFERENCE.md`](QUICK_TEST_REFERENCE.md) 的常見問題
2. 查看 [`TEST_EXECUTION_GUIDE.md`](TEST_EXECUTION_GUIDE.md) 的故障排除
3. 閱讀 [`API_PATH_FIX.md`](API_PATH_FIX.md) 的常見 404 修復
4. 查看代碼實現 [`COMPLETE_ROUTING_AUDIT.md`](COMPLETE_ROUTING_AUDIT.md)

### 記錄結果

使用 [`TEST_RESULTS_TEMPLATE.md`](TEST_RESULTS_TEMPLATE.md) 來記錄您的結果。

---

## 🎯 成功標準

### 必須通過 (最小要求)

```
✅ 32/32 API 端點可訪問或有文件記錄的失敗
✅ 認證和授權正常工作
✅ 所有業務邏輯驗證通過
✅ 沒有未識別的安全漏洞
✅ 批准權限工作正確
```

### 應該通過 (推薦)

```
✅ 所有性能目標達到
✅ 前端 UI 無視覺問題
✅ 瀏覽器控制台無錯誤
✅ 所有邊界情況已測試
✅ 完整的文檔和簽署
```

---

## 🚀 立即開始

### 現在就做 (下一個 30 分鐘)

```bash
# 1. 驗證環境 (5 分鐘)
curl http://localhost:5000/api/v1/health -s | jq '.status'

# 2. 獲取令牌 (5 分鐘)
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' | jq -r '.data.token')

# 3. 運行自動化測試 (15 分鐘)
./test-automation.sh 2>&1 | tee test-results.log

# 4. 檢查結果 (5 分鐘)
grep "✅\|❌" test-results.log | tail -10
```

### 預計完成時間

- **快速驗證**: 5 分鐘
- **自動化測試**: 30 分鐘
- **完整測試** (包括手動和性能): 3-4 小時
- **全部完成**: 今天到後天

---

## 📋 檢查清單

- [ ] 已閱讀本文檔
- [ ] 已驗證環境
- [ ] 已獲取測試令牌
- [ ] 已準備好運行自動化測試
- [ ] 已準備好執行手動測試
- [ ] 已準備好記錄結果
- [ ] 已通知所有相關人員

---

## 🎉 總結

FaCai-B 車輛審核系統已經：

✅ 完成代碼實現  
✅ 完成路由審計  
✅ 完成文檔編寫  
✅ 完成測試計劃  
✅ 準備自動化工具  

**現在準備進入測試執行階段。按照本文檔中的步驟，您可以在 1-3 天內完成深度測試。**

---

**文檔版本**: 1.0  
**狀態**: 🎯 準備執行測試  
**下一步**: 開始環境驗證和自動化測試！

**相關文檔**:
- 📖 [`TEST_EXECUTION_GUIDE.md`](TEST_EXECUTION_GUIDE.md) - 詳細執行步驟
- ⚡ [`QUICK_TEST_REFERENCE.md`](QUICK_TEST_REFERENCE.md) - 快速命令查詢
- 🤖 [`test-automation.sh`](test-automation.sh) - 自動化測試腳本
- 📮 [`FaCai-B_API_Collection.postman_collection.json`](FaCai-B_API_Collection.postman_collection.json) - Postman 集合
