# 🔧 快速審核 - 路徑 404 問題修復

**日期：2026-03-24** | **狀態：已診斷並修復**

---

## ❌ 問題分析

### 您遇到的錯誤

```
URL: https://car-v12.onrender.com/api/v1/admin/vehicles/pv001/approve
狀態碼: 404 Not Found
```

### 根本原因

有 **2 個問題**：

| 問題 | 原因 |
|------|------|
| **1. 路徑結構不完全** | URL 缺少 API 版本前綴 `/v1` |
| **2. 車輛 ID 無效** | `pv001` 不是有效的 UUID 格式 |

---

## ✅ 正確的路徑格式

### API 路由結構

```
/api/v1/admin/vehicles/{vehicleId}/approve
 │     │    │           │          │
 │     │    │           │          └─ 操作
 │     │    │           └─ 車輛 ID (UUID)
 │     │    └─ 資源類型
 │     └─ API 版本
 └─ API 前綴
```

### 正確的端點

| 操作 | 正確路徑 |
|------|---------|
| 待審核列表 | `/api/v1/admin/vehicles/pending` |
| 車輛詳情 | `/api/v1/admin/vehicles/{vehicleId}/detail` |
| 核准車輛 | `/api/v1/admin/vehicles/{vehicleId}/approve` |
| 拒絕車輛 | `/api/v1/admin/vehicles/{vehicleId}/reject` |
| 上傳圖片 | `/api/v1/admin/vehicles/{vehicleId}/images` |

---

## 🔍 如何取得有效的車輛 ID

### 方法 1: 先取得待審核列表

```bash
curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**回應範例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",  // ← 這是有效的 UUID
      "year": 2024,
      "brand_name": "Toyota",
      "status": "pending"
    }
  ]
}
```

### 方法 2: 從數據庫查詢

訪問 Supabase Dashboard：
1. 打開 Supabase 控制台
2. 進入 `vehicles` 表
3. 找到 `status = 'pending'` 的記錄
4. 複製 `id` 欄位（應該是 UUID 格式）

**UUID 格式例子：**
```
550e8400-e29b-41d4-a716-446655440000
├─ 時間部分
├─ 版本和變異
├─ 時鐘序列
└─ 節點 ID
```

---

## 🚀 修正步驟

### 步驟 1: 取得有效的車輛 ID

使用 **Method 1** 或 **Method 2** 獲得真實的 UUID

### 步驟 2: 修改核准請求

**錯誤的請求：**
```bash
curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/pv001/approve"
```

**正確的請求：**
```bash
curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/550e8400-e29b-41d4-a716-446655440000/approve" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

### 步驟 3: 驗證回應

**成功（200）：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "approved_at": "2026-03-24T...",
    "approved_by": "admin-uuid"
  },
  "message": "車輛已核准"
}
```

**錯誤（400/404）：**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "找不到該車輛"
  }
}
```

---

## 📋 完整的審核流程

### 1. 取得待審核列表

```bash
curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/pending?limit=10" \
  -H "Authorization: Bearer {YOUR_AUTH_TOKEN}"
```

### 2. 取得車輛詳情

```bash
curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/{vehicleId}/detail" \
  -H "Authorization: Bearer {YOUR_AUTH_TOKEN}"
```

### 3. 核准車輛

```bash
curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/{vehicleId}/approve" \
  -H "Authorization: Bearer {YOUR_AUTH_TOKEN}" \
  -H "Content-Type: application/json"
```

### 4. 或拒絕車輛

```bash
curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/{vehicleId}/reject" \
  -H "Authorization: Bearer {YOUR_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "圖片不清晰，請重新上傳"
  }'
```

---

## 🎯 常見的 ID 格式錯誤

| 格式 | 是否有效 | 說明 |
|------|---------|------|
| `pv001` | ❌ 無效 | 不符合 UUID 格式 |
| `vehicle-123` | ❌ 無效 | 包含破折號但格式不對 |
| `550e8400-e29b-41d4-a716-446655440000` | ✅ 有效 | 標準 UUID v4 格式 |
| `550e8400e29b41d4a716446655440000` | ⚠️ 可能有效 | UUID 但缺少破折號 |

---

## 🔐 認證令牌問題

如果您看到 **401 Unauthorized**，請檢查：

```bash
# 正確的格式
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 錯誤的格式
Authorization: {TOKEN}  # ❌ 缺少 "Bearer"
```

---

## ✅ 快速檢查清單

在進行 API 調用之前，檢查：

- [ ] URL 是否包含 `/v1` 版本前綴？
- [ ] 車輛 ID 是否為有效的 UUID 格式？
- [ ] Authorization 標頭是否包含 Bearer token？
- [ ] Content-Type 是否為 application/json？
- [ ] 您是否有 Admin 權限？

---

## 🔗 相關文檔

- **API 文檔：** `FINAL_IMPLEMENTATION_REPORT.md`
- **測試指南：** `VERIFICATION_GUIDE.md`
- **路由配置：** `backend/src/routes/index.ts`
- **Admin 路由：** `backend/src/routes/admin/vehicles.ts`

---

## 💡 提示

### Postman 或 Insomnia 測試

1. **Method:** POST
2. **URL:** `https://car-v12.onrender.com/api/v1/admin/vehicles/{vehicleId}/approve`
3. **Headers:**
   ```
   Authorization: Bearer {TOKEN}
   Content-Type: application/json
   ```
4. **Body:** (空或 {})

---

**修復完成！現在您應該可以成功調用 API 了。** ✅
