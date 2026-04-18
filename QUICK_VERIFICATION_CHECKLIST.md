# ✅ FaCai-B 車輛審核系統 - 快速驗證檢查清單

**版本**: 1.0  
**狀態**: 準備執行  
**預計時間**: 1-3 小時  

---

## 🎯 5 分鐘快速驗證

### 前置條件檢查

```bash
# ✅ 後端運行?
curl http://localhost:5000/api/v1/health -s | jq '.status'
# 預期: "ok"

# ✅ 前端運行?
curl http://localhost:3000 -s | grep -q "<!DOCTYPE" && echo "✅" || echo "❌"

# ✅ 獲取令牌
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" -d '{"role":"admin"}' | jq -r '.data.token')

echo "✅ 令牌: ${ADMIN_TOKEN:0:30}..."

# ✅ 驗證待審核列表
curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data' | head -5
```

---

## 📋 第 1 天檢查清單 (09:00 - 12:30)

### ✅ 時間點 1: 環境驗證 (09:00 - 09:05)

```
[ ] 後端健康檢查 /health → 200 OK
    curl http://localhost:5000/api/v1/health

[ ] 前端可訪問 → 200 OK
    curl http://localhost:3000

[ ] 數據庫連接 → 正常
    檢查 .env 配置 SUPABASE_URL
```

**預期結果**: ✅ 環境正常

**如果失敗**:
```bash
# 啟動後端
cd backend && npm start

# 啟動前端 (新終端)
cd frontend && npm run dev
```

---

### ✅ 時間點 2: 認證獲取 (09:05 - 09:15)

```
[ ] 獲取 Admin 令牌
    curl -X POST http://localhost:5000/api/v1/auth/test-token \
      -H "Content-Type: application/json" \
      -d '{"role":"admin"}'
    
    預期: {"success":true,"data":{"token":"..."}}

[ ] 令牌格式有效 → 以 "eyJ" 開頭
    $ADMIN_TOKEN 變數已設置

[ ] 獲取 User 令牌 (選項)
    curl -X POST http://localhost:5000/api/v1/auth/test-token \
      -H "Content-Type: application/json" \
      -d '{"role":"user"}'
```

**預期結果**: ✅ 獲得有效的 Admin 令牌

**如果失敗**:
```bash
# 檢查認證端點
curl -X POST http://localhost:5000/api/v1/auth/test-token -v \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'

# 查看具體錯誤信息
```

---

### ✅ 時間點 3: 核心端點驗證 (09:15 - 09:30)

#### 端點 1: 待審核列表

```
[ ] GET /admin/vehicles/pending
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer $ADMIN_TOKEN"
    
    預期:
    - HTTP 200
    - JSON: {"success":true,"data":{"data":[...],"pagination":{...}}}
    - 有至少 0 個車輛 (可能為空)

[ ] 提取第一個車輛 ID
    VEHICLE_ID=$(curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.data[0].id')
    
    echo "找到車輛: $VEHICLE_ID"
    
    預期: 標準 UUID 格式 (或空字符串，表示無車輛)
```

**結果**: ☐ 通過 ☐ 失敗 ☐ 跳過 (無待審核車輛)

#### 端點 2: 車輛詳情 (如有車輛)

```
[ ] GET /admin/vehicles/{ID}/detail
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN"
    
    預期:
    - HTTP 200
    - JSON: {"success":true,"data":{...,"id":"...","status":"pending",...}}
    - 包含: id, status, brand, model, year, images, etc.

[ ] 驗證狀態為 "pending"
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.status'
    
    預期: "pending"
```

**結果**: ☐ 通過 ☐ 失敗 ☐ 跳過 (無車輛)

#### 端點 3: 核准車輛 (乾運行)

```
[ ] POST /admin/vehicles/{ID}/approve
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}'
    
    預期:
    - HTTP 200 (成功) 或
    - HTTP 409 (已核准) 或
    - HTTP 404 (不存在)

[ ] 驗證狀態更新
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.status'
    
    預期: "approved" (如果已核准)
```

**結果**: ☐ 通過 ☐ 失敗 ☐ 跳過 (無車輛)

#### 端點 4: 拒絕車輛 (測試另一輛)

```
[ ] 獲取另一輛待審核車輛 (如有)
    VEHICLE_ID_2=$(curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.data[1].id' 2>/dev/null)

[ ] POST /admin/vehicles/{ID}/reject
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID_2/reject" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"reason":"不符合條件"}'
    
    預期:
    - HTTP 200 (成功) 或
    - HTTP 404 (不存在)
```

**結果**: ☐ 通過 ☐ 失敗 ☐ 跳過

---

### ✅ 時間點 4: 自動化測試運行 (09:30 - 10:00)

```
[ ] 第 1 步: 確保令牌已設置
    echo $ADMIN_TOKEN
    預期: 有值

[ ] 第 2 步: 運行完整測試
    chmod +x complete-test-execution.sh
    ./complete-test-execution.sh --full 2>&1 | tee execution-$(date +%s).log

[ ] 第 3 步: 查看摘要
    tail -30 execution-*.log | grep -E "✅|❌|📊"

[ ] 第 4 步: 檢查報告
    ls -lah test-results/
    cat test-results/test-report-*.md | head -50
```

**預期結果**:
- ✅ 通過: 15+
- ❌ 失敗: 0-2
- ⊘ 跳過: 0-2
- 通過率: 85%+

---

### ✅ 時間點 5: 結果分析 (10:00 - 10:30)

```
[ ] 分析失敗項目
    grep "FAIL" test-results/test-report-*.md
    
[ ] 對於每個失敗項:
    - 記錄錯誤消息
    - 檢查是預期失敗還是錯誤
    - 決定是否需要修複

[ ] 檢查性能指標
    grep -E "時間|ms|毫秒" test-results/test-report-*.md

[ ] 驗證安全檢查
    grep -E "認證|授權|401|403" test-results/test-report-*.md
```

**預期結果**: ✅ 所有關鍵測試都通過

---

## 📋 第 2 天檢查清單 (08:00 - 12:30)

### ✅ 時間點 1: 手動 API 流程測試 (08:00 - 09:00)

#### 流程 1: 完整審核流程

```
1️⃣  取得待審核車輛列表
    VEHICLE_ID=$(curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.data[0].id')
    
    [ ] ✅ 返回 HTTP 200
    [ ] ✅ 返回有效的 JSON
    [ ] ✅ 包含至少一個車輛

2️⃣  查看車輛詳情
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data'
    
    [ ] ✅ 返回 HTTP 200
    [ ] ✅ 包含: id, status, brand, model, year, listing_price
    [ ] ✅ status = "pending"

3️⃣  核准車輛
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"notes":"符合條件"}'
    
    [ ] ✅ 返回 HTTP 200
    [ ] ✅ 返回 success: true

4️⃣  驗證狀態已更新
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.status'
    
    [ ] ✅ 狀態 = "approved"
    [ ] ✅ 不能再次核准 (返回 409)
```

**結果**: ☐ 完全通過 ☐ 部分通過 ☐ 失敗

#### 流程 2: 拒絕和原因追蹤

```
1️⃣  取得待審核車輛
    VEHICLE_ID=$(curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.data[0].id')

2️⃣  拒絕車輛
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/reject" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"reason":"不符合品牌要求"}'
    
    [ ] ✅ 返回 HTTP 200
    [ ] ✅ 返回 success: true

3️⃣  驗證拒絕原因已保存
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | {status, rejection_reason}'
    
    [ ] ✅ status = "rejected"
    [ ] ✅ rejection_reason = "不符合品牌要求"

4️⃣  驗證不能再審核
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}'
    
    [ ] ✅ 返回 HTTP 409 (衝突)
```

**結果**: ☐ 完全通過 ☐ 部分通過 ☐ 失敗

#### 流程 3: 代客建檔

```
1️⃣  創建代客建檔
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/proxy" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "owner_dealer_id":"dealer-uuid",
        "brand_id":"brand-uuid",
        "model_id":"model-uuid",
        "spec_id":"spec-uuid",
        "year":2024,
        "listing_price":250000
      }'
    
    [ ] ✅ 返回 HTTP 200/201
    [ ] ✅ 返回新車輛 ID
    
    NEW_VEHICLE_ID=$(...)

2️⃣  驗證新車輛已保存
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$NEW_VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data'
    
    [ ] ✅ owner_dealer_id 正確
    [ ] ✅ status = "pending"
    [ ] ✅ 所有字段都已保存

3️⃣  上傳圖片
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$NEW_VEHICLE_ID/images" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "images=@test-image-1.jpg" \
      -F "images=@test-image-2.jpg"
    
    [ ] ✅ 返回 HTTP 200
    [ ] ✅ 返回上傳的圖片信息

4️⃣  驗證圖片已保存
    curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$NEW_VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.images | length'
    
    [ ] ✅ 圖片數量 = 2
```

**結果**: ☐ 完全通過 ☐ 部分通過 ☐ 失敗

---

### ✅ 時間點 2: 邊界情況測試 (09:00 - 10:00)

#### UUID 驗證

```
[ ] 無效 UUID 格式
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/invalid-id/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN"
    
    預期: HTTP 400, 錯誤消息提及 UUID

[ ] 有效 UUID 但不存在
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/00000000-0000-0000-0000-000000000000/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN"
    
    預期: HTTP 404

[ ] 空 ID
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles//detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN"
    
    預期: HTTP 404 或 400
```

**結果**: ☐ 全部通過 ☐ 部分通過 ☐ 失敗

#### 認證邊界

```
[ ] 無令牌
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending"
    
    預期: HTTP 401

[ ] 無效令牌
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer invalid-token"
    
    預期: HTTP 401

[ ] 格式錯誤的授權頭
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: InvalidToken"
    
    預期: HTTP 401
```

**結果**: ☐ 全部通過 ☐ 部分通過 ☐ 失敗

#### 授權邊界

```
[ ] User 令牌訪問 Admin 端點
    USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
      -H "Content-Type: application/json" \
      -d '{"role":"user"}' | jq -r '.data.token')
    
    curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
      -H "Authorization: Bearer $USER_TOKEN"
    
    預期: HTTP 403 或 401
```

**結果**: ☐ 通過 ☐ 失敗

---

### ✅ 時間點 3: 數據驗證和邏輯 (10:00 - 10:30)

#### 邏輯驗證

```
[ ] 重複核准同一輛車
    1. 第一次核准 → HTTP 200
    2. 第二次核准 → HTTP 409 (衝突)

[ ] 重複拒絕同一輛車
    1. 第一次拒絕 → HTTP 200
    2. 第二次拒絕 → HTTP 409 (衝突)

[ ] 核准後再拒絕
    1. 核准車輛 → HTTP 200
    2. 嘗試拒絕 → HTTP 409 (衝突)

[ ] 拒絕後再核准
    1. 拒絕車輛 → HTTP 200
    2. 嘗試核准 → HTTP 409 (衝突)
```

**結果**: ☐ 全部通過 ☐ 部分通過 ☐ 失敗

#### 圖片驗證

```
[ ] 上傳有效檔案 (JPEG, PNG)
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/{ID}/images" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "images=@valid-image.jpg"
    
    預期: HTTP 200

[ ] 上傳無效檔案類型
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/{ID}/images" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "images=@test-file.txt"
    
    預期: HTTP 400, 提及不支援的檔案類型

[ ] 上傳過大檔案 (>10MB)
    # 創建 11MB 的測試檔案
    dd if=/dev/zero of=large-file.jpg bs=1M count=11
    
    curl -X POST "http://localhost:5000/api/v1/admin/vehicles/{ID}/images" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "images=@large-file.jpg"
    
    預期: HTTP 413 或 400
```

**結果**: ☐ 全部通過 ☐ 部分通過 ☐ 失敗

---

### ✅ 時間點 4: 性能測試 (10:30 - 11:30)

#### 響應時間測試

```
[ ] 待審核列表響應時間
    time curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending?limit=10" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
    
    預期: < 1000ms (1 秒)
    記錄實際時間: ______ ms

[ ] 詳情頁面響應時間
    time curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
    
    預期: < 500ms
    記錄實際時間: ______ ms

[ ] 核准操作響應時間
    time curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}' > /dev/null
    
    預期: < 1000ms
    記錄實際時間: ______ ms
```

**結果**: ☐ 全部在目標內 ☐ 部分超過目標 ☐ 全部超過目標

記錄性能數據:
- 待審核列表: ________ ms
- 詳情頁面: ________ ms
- 核准操作: ________ ms

---

## 📋 第 3 天檢查清單 (08:00 - 12:00)

### ✅ 時間點 1: 前端 UI 測試 (08:00 - 09:30)

#### 審核頁面 (http://localhost:3000/admin/audit)

```
[ ] 頁面加載
    - [ ] 無錯誤 (檢查瀏覽器控制台)
    - [ ] 列表顯示
    - [ ] 加載指示符 (如適用)

[ ] 列表功能
    - [ ] 顯示待審核車輛
    - [ ] 分頁工作
    - [ ] 搜索/篩選 (如實現)
    - [ ] 刷新有效

[ ] 車輛項目
    - [ ] 顯示車輛信息
    - [ ] 顯示品牌和型號
    - [ ] 顯示價格
    - [ ] 點擊進入詳情
```

**結果**: ☐ 全部工作 ☐ 部分工作 ☐ 不工作

#### 詳情頁面 (http://localhost:3000/admin/audit/{id})

```
[ ] 頁面加載
    - [ ] 無錯誤
    - [ ] 顯示車輛詳情
    - [ ] 顯示圖片 (如有)

[ ] 詳情信息
    - [ ] 顯示基本信息 (品牌、型號、年份等)
    - [ ] 顯示價格
    - [ ] 顯示當前狀態
    - [ ] 顯示提交人信息 (如適用)

[ ] 操作按鈕
    - [ ] 核准按鈕存在
    - [ ] 拒絕按鈕存在
    - [ ] 按鈕點擊可工作
    - [ ] 無障礙提示文本

[ ] 交互
    - [ ] 核准後頁面更新
    - [ ] 拒絕後頁面更新
    - [ ] 顯示成功消息
    - [ ] 返回列表工作
```

**結果**: ☐ 全部工作 ☐ 部分工作 ☐ 不工作

#### 代客建檔頁面 (http://localhost:3000/admin/vehicles/new)

```
[ ] 頁面加載
    - [ ] 無錯誤
    - [ ] 表單顯示
    - [ ] 所有字段可見

[ ] 表單字段
    - [ ] 經銷商選擇工作
    - [ ] 品牌選擇工作
    - [ ] 型號選擇工作
    - [ ] 年份選擇工作
    - [ ] 價格輸入工作

[ ] 圖片上傳
    - [ ] 上傳按鈕可見
    - [ ] 可選擇檔案
    - [ ] 預覽顯示
    - [ ] 刪除功能工作

[ ] 提交
    - [ ] 驗證工作
    - [ ] 提交按鈕功能
    - [ ] 成功消息顯示
    - [ ] 返回列表工作
```

**結果**: ☐ 全部工作 ☐ 部分工作 ☐ 不工作

---

### ✅ 時間點 2: 最終簽署 (09:30 - 12:00)

#### 測試完成檢查清單

```
[ ] 所有手動測試已執行
[ ] 所有自動化測試已運行
[ ] 所有結果已記錄
[ ] 所有失敗項已分析
[ ] 所有缺陷已報告
[ ] 所有性能指標已收集
[ ] 所有簽署已完成
```

#### 簽署

```
QA 測試人員:
姓名: _________________________
日期: _________________________
簽署: _________________________

開發人員確認:
姓名: _________________________
日期: _________________________
簽署: _________________________

管理層批准:
姓名: _________________________
日期: _________________________
簽署: _________________________
```

---

## 📊 結果總結表

### 第 1 天結果

| 階段 | 項目 | 狀態 | 備註 |
|------|------|------|------|
| 1 | 環境驗證 | ☐ ✅ ☐ ❌ | |
| 2 | 認證獲取 | ☐ ✅ ☐ ❌ | |
| 3 | 待審核列表 | ☐ ✅ ☐ ❌ | |
| 3 | 車輛詳情 | ☐ ✅ ☐ ❌ ☐ ⊘ | |
| 3 | 核准操作 | ☐ ✅ ☐ ❌ ☐ ⊘ | |
| 3 | 拒絕操作 | ☐ ✅ ☐ ❌ ☐ ⊘ | |
| 4 | 自動化測試 | ☐ ✅ ☐ ❌ | |
| 5 | 結果分析 | ☐ ✅ ☐ ❌ | |

### 第 2 天結果

| 階段 | 項目 | 狀態 | 備註 |
|------|------|------|------|
| 1 | 審核流程 | ☐ ✅ ☐ ❌ | |
| 1 | 拒絕流程 | ☐ ✅ ☐ ❌ | |
| 1 | 代客建檔 | ☐ ✅ ☐ ❌ | |
| 2 | UUID 驗證 | ☐ ✅ ☐ ❌ | |
| 2 | 認證邊界 | ☐ ✅ ☐ ❌ | |
| 2 | 授權邊界 | ☐ ✅ ☐ ❌ | |
| 3 | 邏輯驗證 | ☐ ✅ ☐ ❌ | |
| 3 | 圖片驗證 | ☐ ✅ ☐ ❌ | |
| 4 | 性能測試 | ☐ ✅ ☐ ❌ | |

### 第 3 天結果

| 階段 | 項目 | 狀態 | 備註 |
|------|------|------|------|
| 1 | 審核頁面 | ☐ ✅ ☐ ❌ | |
| 1 | 詳情頁面 | ☐ ✅ ☐ ❌ | |
| 1 | 代客建檔頁面 | ☐ ✅ ☐ ❌ | |
| 2 | 最終簽署 | ☐ ✅ ☐ ❌ | |

---

## 🎯 成功標準

### 最小要求 (必須)

```
✅ [ ] 32/32 API 測試通過或已記錄
✅ [ ] 所有認證邊界正確處理
✅ [ ] 所有授權邊界正確處理
✅ [ ] 沒有未預期的 5xx 錯誤
✅ [ ] 關鍵業務流程可工作
```

### 推薦要求 (應該)

```
☐ [ ] 所有性能目標達到
☐ [ ] 前端 UI 無缺陷
☐ [ ] 瀏覽器控制台無錯誤
☐ [ ] 所有邊界情況已測試
```

---

## 📝 注意和備忘

```
待驗證的重點:
- [ ] UUID 驗證在所有 ID 參數上
- [ ] 認證中間件在所有 admin 路由上
- [ ] 授權檢查在所有 admin 路由上
- [ ] 圖片上傳的檔案驗證
- [ ] 業務邏輯狀態轉換

已知問題或偏差:
(無當前)

需要修復的項目:
1. ________________________
2. ________________________
3. ________________________
```

---

**版本**: 1.0  
**狀態**: 準備執行  
**預計完成**: 3 天內

**開始執行**: 運行以下命令

```bash
# 現在就做 (5 分鐘)
curl http://localhost:5000/api/v1/health && \
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" -d '{"role":"admin"}' | jq -r '.data.token') && \
echo "✅ 環境就緒，令牌已獲取"

# 運行完整測試 (30 分鐘)
./complete-test-execution.sh --full

# 手動測試 (1 小時)
# 按照上面的檢查清單執行
```

**祝您測試順利！ 🚀**
