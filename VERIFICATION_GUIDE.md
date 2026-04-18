# 🧪 車輛審核系統 - 快速驗證指南

**日期：2026-03-24** | **用途：測試和驗證實現**

---

## ⚡ 快速開始

### 1. 啟動開發環境

#### 後端
```bash
cd backend
npm install  # 如果還未安裝
npm run dev  # 啟動開發伺服器 (預設 port 5000)
```

#### 前端
```bash
cd frontend
npm install  # 如果還未安裝
npm run dev  # 啟動開發伺服器 (預設 port 3000)
```

### 2. 訪問頁面

```
代客建檔頁面：http://localhost:3000/admin/vehicles/new
審核列表頁面：http://localhost:3000/admin/audit
審核詳情頁面：http://localhost:3000/admin/audit/{vehicleId}
```

---

## ✅ 完整測試流程

### 場景 1: 代客建檔 + 圖片上傳

#### 步驟

1. **訪問代客建檔頁面**
   - URL: `http://localhost:3000/admin/vehicles/new`
   - 預期：看到完整的表單

2. **填寫表單**
   ```
   ✓ 選擇車行：選擇一個車行
   ✓ 選擇品牌：Toyota
   ✓ 選擇規格：Camry
   ✓ 選擇車型：2.5L
   ✓ 年份：2024
   ✓ 售價：1280000
   ✓ 描述：可選，留白也可以
   ```

3. **選擇圖片**
   - 方法A：點擊拖放區選擇圖片
   - 方法B：拖放圖片到拖放區
   - 預期：圖片出現在預覽網格中

4. **檢查圖片**
   - 預期：圖片縮圖顯示在下方網格
   - 預期：每張圖片有「X」刪除按鈕
   - 預期：顯示「已選 N 張圖片，最多可上傳 10 張」

5. **提交表單**
   - 點擊「建立並上架」按鈕
   - 預期：按鈕變為「建立中...」（禁用）

6. **等待上傳**
   - 預期：按鈕變為「上傳中...」（圖片上傳中）
   - 預期：完成後顯示「成功上傳 {N} 張圖片」或警告

7. **完成**
   - 預期：自動重定向到 `/dashboard`
   - 預期：看到成功提示

#### 驗證 API 調用

**使用瀏覽器開發者工具 (F12)，在 Network 標籤檢查：**

```
1. POST /admin/vehicles/proxy
   - 狀態：201 Created
   - 回應：{success: true, data: {id, ...}, message: "..."}

2. POST /admin/vehicles/{id}/images
   - 狀態：201 Created
   - 回應：{success: true, data: {results: [...]}, message: "..."}
```

---

### 場景 2: 審核車輛

#### 前置條件

- 必須有待審核的車輛（通常由用戶提交，或使用場景 1 的測試數據）

#### 步驟

1. **訪問審核列表**
   - URL: `http://localhost:3000/admin/audit`
   - 預期：看到「待審核」和「已退件」兩個標籤
   - 預期：列表顯示待審核車輛卡片

2. **篩選車輛**
   - 點擊「待審核」標籤（應已選中）
   - 預期：只顯示 status='pending' 的車輛
   - 點擊「已退件」標籤
   - 預期：只顯示 status='rejected' 的車輛

3. **進入詳情頁**
   - 點擊某個車輛卡片
   - URL 應變為：`http://localhost:3000/admin/audit/{vehicleId}`
   - 預期：看到車輛完整信息和圖片庫

4. **核准車輛**
   - 點擊「核准」按鈕
   - 預期：看到確認對話框「確認要核准此車輛嗎？」
   - 點擊確認
   - 預期：顯示「車輛已核准！」提示
   - 預期：1.5 秒後自動返回 `/admin/audit`
   - 預期：列表刷新，該車輛消失（因為不再是待審核）

#### 驗證 API 調用

```
1. GET /admin/vehicles/pending
   - 狀態：200 OK
   - 回應：{success: true, data: [...], pagination: {...}}

2. GET /admin/vehicles/{id}/detail
   - 狀態：200 OK
   - 回應：{success: true, data: {...}}

3. POST /admin/vehicles/{id}/approve
   - 狀態：200 OK
   - 回應：{success: true, data: {...}, message: "車輛已核准"}
```

#### 拒絕車輛的步驟（替代步驟 4）

1. 進入詳情頁（同上）

2. 點擊「拒絕」按鈕
   - 預期：看到「拒絕原因」輸入框
   - 預期：拒絕按鈕初始為禁用

3. 填寫拒絕原因
   - 輸入：「圖片不清晰，請重新上傳」
   - 預期：拒絕按鈕變為啟用

4. 點擊拒絕
   - 預期：看到確認對話框
   - 點擊確認
   - 預期：顯示「車輛已退件！」提示
   - 預期：1.5 秒後返回 `/admin/audit`
   - 預期：列表刷新

#### 驗證 API 調用

```
POST /admin/vehicles/{id}/reject
- 請求體：{rejection_reason: "..."}
- 狀態：200 OK
- 回應：{success: true, data: {...}, message: "已拒絕車輛"}
```

---

## 🔧 故障排查

### 問題 1: 代客建檔頁面提交失敗

**症狀：** 點擊「建立並上架」後沒有反應

**排查步驟：**
1. 打開瀏覽器開發者工具 (F12)
2. 切換到 Console 標籤，查看是否有錯誤
3. 切換到 Network 標籤，查看 POST 請求
4. 檢查請求體和回應

**常見原因：**
- 表單驗證失敗 → 檢查表單是否完整填寫
- 後端 API 錯誤 → 檢查後端伺服器是否運行
- 圖片上傳失敗 → 檢查圖片大小是否超過 10MB

---

### 問題 2: 審核詳情頁無法加載

**症狀：** 頁面一直顯示「載入中...」

**排查步驟：**
1. 檢查 URL 中的 vehicleId 是否有效
2. 打開 Network 標籤，查看 GET 請求
3. 檢查回應狀態碼（應為 200）

**常見原因：**
- 車輛 ID 無效 → 回到列表重新點擊
- 後端伺服器未運行 → 檢查後端是否啟動
- 數據庫連接失敗 → 檢查 Supabase 配置

---

### 問題 3: 圖片上傳失敗

**症狀：** 提交後看到警告 "圖片上傳失敗"

**排查步驟：**
1. 檢查瀏覽器 Console 是否有錯誤
2. 查看 Network 標籤中 POST `/admin/vehicles/{id}/images` 的回應
3. 檢查回應中的 `results` 陣列

**常見原因：**
- 圖片格式不支援 → 使用 JPG、PNG、WebP
- 圖片過大 → 檢查單個圖片是否超過 10MB
- 後端服務未啟動 → 檢查 imageService

---

## 📊 驗證檢查表

### 後端驗證

- [ ] 後端伺服器正常運行
  - [ ] `npm run dev` 無錯誤
  - [ ] 控制台顯示 "Server running on port 5000"

- [ ] 所有 API 端點都能調用
  - [ ] GET `/admin/vehicles/pending` → 200
  - [ ] GET `/admin/vehicles/{id}/detail` → 200
  - [ ] POST `/admin/vehicles/{id}/approve` → 200
  - [ ] POST `/admin/vehicles/{id}/reject` → 200
  - [ ] POST `/admin/vehicles/{id}/images` → 201

### 前端驗證

- [ ] 前端伺服器正常運行
  - [ ] `npm run dev` 無錯誤
  - [ ] 可訪問 `http://localhost:3000`

- [ ] 代客建檔頁面
  - [ ] 表單正確顯示
  - [ ] 圖片選擇功能正常
  - [ ] 拖放上傳功能正常
  - [ ] 提交流程完整（建立→上傳→重定向）

- [ ] 審核流程
  - [ ] 列表頁面能加載待審核車輛
  - [ ] 詳情頁面能顯示車輛信息
  - [ ] 核准功能正常（含確認對話框）
  - [ ] 拒絕功能正常（含原因輸入）
  - [ ] 操作後列表自動刷新

### 數據驗證

- [ ] 代客建檔後
  - [ ] 數據庫中車輛狀態為 'approved'
  - [ ] 圖片正確上傳到儲存服務
  - [ ] vehicles.images 欄位包含所有圖片 URL

- [ ] 審核後
  - [ ] 車輛狀態正確更新
  - [ ] audit_logs 表記錄了操作
  - [ ] User 端可見審核結果

---

## 🔬 API 測試 (使用 curl)

### 測試待審核列表

```bash
curl -X GET "http://localhost:5000/api/admin/vehicles/pending?limit=10" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**預期回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "year": 2024,
      "brand_name": "Toyota",
      "status": "pending"
    }
  ],
  "pagination": {
    "nextCursor": "...",
    "hasMore": false,
    "total": 1
  }
}
```

### 測試車輛詳情

```bash
curl -X GET "http://localhost:5000/api/admin/vehicles/{vehicleId}/detail" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

### 測試核准車輛

```bash
curl -X POST "http://localhost:5000/api/admin/vehicles/{vehicleId}/approve" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

### 測試拒絕車輛

```bash
curl -X POST "http://localhost:5000/api/admin/vehicles/{vehicleId}/reject" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "圖片不清晰"
  }'
```

### 測試圖片上傳

```bash
curl -X POST "http://localhost:5000/api/admin/vehicles/{vehicleId}/images" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**預期回應：**
```json
{
  "success": true,
  "data": {
    "results": [
      {"success": true, "url": "https://..."},
      {"success": true, "url": "https://..."}
    ],
    "summary": {"total": 2, "success": 2, "failed": 0}
  },
  "message": "成功上傳 2 張圖片"
}
```

---

## 📝 測試數據生成

### 手動建立測試車輛

使用代客建檔功能（場景 1）建立測試車輛。

### 使用 Mock 數據

前端已配備 Mock 數據支援（在 `isDev` 時）。如果 API 失敗，會自動使用 Mock 數據。

---

## 🎯 測試優先級

### 必做項（關鍵路徑）

1. [ ] 代客建檔：建立車輛 + 上傳圖片
2. [ ] 審核列表：取得待審核車輛
3. [ ] 審核詳情：查看車輛信息
4. [ ] 核准車輛：完整流程
5. [ ] 拒絕車輛：完整流程

### 可選項（邊界情況）

1. [ ] 無圖片代客建檔
2. [ ] 圖片上傳部分失敗
3. [ ] 無效圖片格式處理
4. [ ] 分頁功能（多個待審核車輛）
5. [ ] 錯誤消息顯示

---

## 📞 技術支援

如有問題，請檢查：

1. **後端日誌**
   ```bash
   # 檢查後端控制台輸出
   tail -f console.log
   ```

2. **前端日誌**
   ```bash
   # 瀏覽器開發者工具 (F12) → Console
   # 查看 JavaScript 錯誤
   ```

3. **API 請求日誌**
   - 瀏覽器 Network 標籤
   - 檢查請求 URL、方法、標頭、回應

4. **數據庫**
   - 檢查 Supabase 控制台
   - 驗證 vehicles 表的數據

---

**完成時間：2026-03-24**
