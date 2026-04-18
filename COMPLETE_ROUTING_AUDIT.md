# 🔍 完整的路由審計和深入測試報告

**日期：2026-03-24** | **狀態：詳細診斷** | **優先級：高**

---

## 📋 路由結構映射

### 完整的路由樹狀結構

```
/api
├── /health (公開)
│   └── GET /api/health → 健康檢查
│
└── /v1
    ├── /status (公開)
    │   └── GET /api/v1/status → API 狀態
    │
    ├── /vehicles (公開，需認證)
    │   ├── GET /api/v1/vehicles → 所有車輛
    │   ├── GET /api/v1/vehicles/{id} → 車輛詳情
    │   ├── POST /api/v1/vehicles → 新增車輛
    │   ├── PUT /api/v1/vehicles/{id} → 編輯車輛
    │   ├── DELETE /api/v1/vehicles/{id} → 刪除車輛
    │   └── POST /api/v1/vehicles/{id}/images → 上傳圖片
    │
    ├── /trades (公開，需認證)
    │   └── ...
    │
    ├── /notifications (公開，需認證)
    │   └── ...
    │
    ├── /dictionary (公開)
    │   └── ...
    │
    ├── /services (公開，需認證)
    │   └── ...
    │
    ├── /shop (公開，需認證)
    │   └── ...
    │
    └── /admin (需認證 + Admin 權限)
        ├── /audit (舊的審核路由)
        │   ├── GET /api/v1/admin/audit → 待審核列表
        │   ├── GET /api/v1/admin/audit/{id} → 詳情
        │   ├── POST /api/v1/admin/audit/{id}/approve → 核准
        │   └── POST /api/v1/admin/audit/{id}/reject → 拒絕
        │
        ├── /vehicles (新的審核路由) ⭐ 您需要的就是這個！
        │   ├── GET /api/v1/admin/vehicles/pending → 待審核列表
        │   ├── GET /api/v1/admin/vehicles/{id}/detail → 詳情
        │   ├── POST /api/v1/admin/vehicles/{id}/approve → 核准
        │   ├── POST /api/v1/admin/vehicles/{id}/reject → 拒絕
        │   └── POST /api/v1/admin/vehicles/{id}/images → 上傳圖片
        │
        ├── /dictionary → 字典管理
        ├── /users → 會員管理
        ├── /services → 服務管理
        └── /shop → 商城管理
```

---

## ⭐ 新實現的審核路由（完整清單）

### 路由配置檢查

| 層級 | 文件 | 路由前綴 | 檢查 |
|------|------|--------|------|
| **主路由** | `src/routes/index.ts` | `/v1` | ✅ 已掛載 |
| **Admin 路由** | `src/routes/admin/index.ts` | `/admin` | ✅ 已掛載 |
| **車輛路由** | `src/routes/admin/vehicles.ts` | `/vehicles` | ✅ 已掛載 |

### 完整的端點清單

```
✅ GET  /api/v1/admin/vehicles/pending
   - 待審核車輛列表
   - 需認證 + Admin 權限
   - 支援分頁：?limit=20&cursor=xxx

✅ GET  /api/v1/admin/vehicles/{vehicleId}/detail
   - 單一車輛詳情
   - 需認證 + Admin 權限
   - vehicleId：UUID 格式

✅ POST /api/v1/admin/vehicles/{vehicleId}/approve
   - 核准車輛
   - 需認證 + Admin 權限
   - 請求體：{}（空即可）

✅ POST /api/v1/admin/vehicles/{vehicleId}/reject
   - 拒絕車輛
   - 需認證 + Admin 權限
   - 請求體：{"rejection_reason": "理由"}

✅ POST /api/v1/admin/vehicles/{vehicleId}/images
   - 上傳圖片
   - 需認證 + Admin 權限
   - 請求：multipart/form-data，檔案欄位：images
```

---

## 🐛 為什麼您會看到 404？

### 問題診斷

**您的請求：**
```
POST /api/v1/admin/vehicles/pv001/approve
```

**問題分析：**

| 問題 | 原因 | 證據 |
|------|------|------|
| 404 錯誤 | 路由不存在或 ID 無效 | 後端路由配置檢查 |
| `pv001` | 不是有效的 UUID | 路由驗證器期望 UUID 格式 |

### 解決方案

#### 方案 A：使用真實的車輛 UUID

**首先取得有效的車輛 ID：**
```bash
curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer {TOKEN}"
```

**然後核准該車輛：**
```bash
curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/550e8400-e29b-41d4-a716-446655440000/approve" \
  -H "Authorization: Bearer {TOKEN}"
```

#### 方案 B：檢查是否有 ID 驗證器

在 `src/routes/admin/vehicles.ts` 中，所有 `/{id}` 路由都使用了 `validateUuidParam('id')` 驗證器。

**檢查驗證器代碼：**
```typescript
router.post(
  '/:id/approve',
  validateUuidParam('id'),  // ← 這裡會驗證 ID
  asyncHandler(async (req: Request, res: Response) => {
    // ...
  })
);
```

如果您的 ID 不是有效的 UUID 格式，驗證器會拒絕該請求。

---

## 🧪 完整的功能測試套件

### 1️⃣ 健康檢查（無認證）

```bash
# 測試 API 是否運行
curl -X GET "https://car-v12.onrender.com/api/health"

# 預期回應：
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "version": "1.0.0",
#     "environment": "production"
#   }
# }
```

**檢查點：**
- [ ] 狀態碼 200
- [ ] `status: "healthy"`
- [ ] 有版本信息

---

### 2️⃣ API 狀態檢查（公開）

```bash
curl -X GET "https://car-v12.onrender.com/api/v1/status"

# 預期回應：
# {
#   "success": true,
#   "data": {
#     "api": "FaCai-B Platform API",
#     "version": "v1",
#     "status": "operational"
#   }
# }
```

**檢查點：**
- [ ] 版本為 `v1`
- [ ] 狀態為 `operational`

---

### 3️⃣ 認證檢查（無 Token）

```bash
# 嘗試訪問需認證的端點
curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/pending"

# 預期回應：401 Unauthorized
# {
#   "success": false,
#   "error": "Unauthorized"
# }
```

**檢查點：**
- [ ] 狀態碼 401
- [ ] 錯誤信息

---

### 4️⃣ 取得待審核列表

**第一步：獲得有效的 Token**
```bash
# 使用 Supabase Auth 或您的認證服務取得 Token
TOKEN="your-valid-jwt-token"
```

**第二步：取得列表**
```bash
curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/pending?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**預期回應（200）：**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "year": 2024,
      "brand_name": "Toyota",
      "spec_name": "Camry",
      "status": "pending",
      "created_at": "2026-03-24T...",
      "owner": {
        "id": "...",
        "company_name": "...",
        "phone": "..."
      }
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false,
    "total": 1
  }
}
```

**檢查點：**
- [ ] 狀態碼 200
- [ ] `success: true`
- [ ] `data` 是陣列
- [ ] 每個車輛有有效的 UUID `id`

---

### 5️⃣ 取得車輛詳情

**替換 {vehicleId} 為實際的 UUID：**
```bash
VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X GET "https://car-v12.onrender.com/api/v1/admin/vehicles/${VEHICLE_ID}/detail" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**預期回應（200）：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "year": 2024,
    "brand_name": "Toyota",
    "spec_name": "Camry",
    "model_name": "2.5L Auto",
    "color": "silver",
    "transmission": "auto",
    "fuel_type": "gasoline",
    "mileage": 0,
    "images": [],
    "description": "...",
    "acquisition_cost": null,
    "repair_cost": null,
    "asking_price": 1280000,
    "status": "pending",
    "rejection_reason": null,
    "created_at": "2026-03-24T...",
    "updated_at": "2026-03-24T...",
    "owner": {
      "id": "...",
      "company_name": "...",
      "phone": "..."
    }
  }
}
```

**檢查點：**
- [ ] 狀態碼 200
- [ ] 車輛的完整信息
- [ ] 圖片列表（可能為空）

---

### 6️⃣ 核准車輛

```bash
VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/${VEHICLE_ID}/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**預期回應（200）：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "approved_at": "2026-03-24T12:34:56Z",
    "approved_by": "admin-uuid"
  },
  "message": "車輛已核准"
}
```

**檢查點：**
- [ ] 狀態碼 200
- [ ] `status: "approved"`
- [ ] 有 `approved_at` 和 `approved_by`

**可能的錯誤：**
```json
// 400 - 狀態不合法
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "車輛狀態不允許此操作"
  }
}

// 404 - 車輛不存在
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "找不到該車輛"
  }
}
```

---

### 7️⃣ 拒絕車輛

```bash
VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/${VEHICLE_ID}/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "圖片不清晰，請重新上傳清晰的正面和側面照"
  }'
```

**預期回應（200）：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "rejected",
    "rejection_reason": "圖片不清晰，請重新上傳清晰的正面和側面照",
    "rejected_at": "2026-03-24T12:34:56Z",
    "rejected_by": "admin-uuid"
  },
  "message": "已拒絕車輛"
}
```

**檢查點：**
- [ ] 狀態碼 200
- [ ] `status: "rejected"`
- [ ] `rejection_reason` 已記錄
- [ ] 有 `rejected_at` 和 `rejected_by`

---

### 8️⃣ 上傳圖片

```bash
VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST "https://car-v12.onrender.com/api/v1/admin/vehicles/${VEHICLE_ID}/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png" \
  -F "images=@/path/to/image3.webp"
```

**預期回應（201）：**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "success": true,
        "url": "https://car-v12.supabase.co/storage/v1/object/public/vehicles/550e8400-e29b-41d4-a716-446655440000/img1.jpg"
      },
      {
        "success": true,
        "url": "https://car-v12.supabase.co/storage/v1/object/public/vehicles/550e8400-e29b-41d4-a716-446655440000/img2.png"
      },
      {
        "success": true,
        "url": "https://car-v12.supabase.co/storage/v1/object/public/vehicles/550e8400-e29b-41d4-a716-446655440000/img3.webp"
      }
    ],
    "summary": {
      "total": 3,
      "success": 3,
      "failed": 0
    }
  },
  "message": "成功上傳 3 張圖片"
}
```

**檢查點：**
- [ ] 狀態碼 201
- [ ] 每個圖片都有 `url`
- [ ] `summary.success === 3`
- [ ] `summary.failed === 0`

---

## ✅ 測試檢查清單

### 前置條件

- [ ] 有效的 JWT Token（Admin 權限）
- [ ] 待審核的車輛存在
- [ ] 網絡連接正常
- [ ] CORS 配置允許您的源

### 端點測試

| 端點 | 方法 | 狀態 | 備註 |
|------|------|------|------|
| `/api/health` | GET | ⏳ | 無認證 |
| `/api/v1/status` | GET | ⏳ | 無認證 |
| `/api/v1/admin/vehicles/pending` | GET | ⏳ | 需認證 |
| `/api/v1/admin/vehicles/{id}/detail` | GET | ⏳ | 需認證 |
| `/api/v1/admin/vehicles/{id}/approve` | POST | ⏳ | 需認證 |
| `/api/v1/admin/vehicles/{id}/reject` | POST | ⏳ | 需認證 |
| `/api/v1/admin/vehicles/{id}/images` | POST | ⏳ | 需認證 |

### 功能驗證

- [ ] 認證成功，取得有效 Token
- [ ] 待審核列表返回正確格式
- [ ] 車輛詳情包含完整信息
- [ ] 核准操作更新狀態
- [ ] 拒絕操作記錄原因
- [ ] 圖片上傳返回 URL

---

## 🔐 常見問題

### Q1: 為什麼仍然看到 404？

**檢查清單：**
1. [ ] 路徑是否為 `/api/v1/admin/vehicles/{id}/approve`？（不是 `/audit`）
2. [ ] `{id}` 是否為有效的 UUID？
3. [ ] 是否有有效的認證 Token？
4. [ ] 是否有 Admin 權限？

### Q2: 如何驗證我有 Admin 權限？

```typescript
// 在 requireAdmin 中間件中檢查
if (!req.user?.metadata?.role === 'admin') {
  // 無權限
}
```

### Q3: 認證 Token 應該如何格式化？

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                 ↑     ↑
                 固定值  您的 Token
```

---

## 📊 數據庫狀態檢查

### 檢查是否有待審核的車輛

```sql
-- Supabase SQL 編輯器
SELECT id, year, brand_name, status, created_at 
FROM vehicles 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;
```

**應該返回至少 1 行數據。**

---

## 🚀 下一步

1. **驗證路由：** 按照上面的測試套件逐一測試
2. **檢查認證：** 確保有有效的 Token 和 Admin 權限
3. **使用有效 ID：** 不要使用 `pv001`，而是使用真實的 UUID
4. **監控日誌：** 查看後端日誌了解詳細信息

---

**祝您測試順利！有任何問題請參考本文檔。** ✅
