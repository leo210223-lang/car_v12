# 🧪 FaCai-B 車輛審核系統 - 綜合測試計畫

**文件日期**: 2025-03-19  
**狀態**: 準備執行測試  
**優先級**: 🔴 高 (前置條件：所有代碼已提交)

---

## 📋 目錄

1. [測試環境設置](#測試環境設置)
2. [測試數據準備](#測試數據準備)
3. [API 端點測試](#api-端點測試)
4. [邊界情況測試](#邊界情況測試)
5. [集成測試](#集成測試)
6. [性能和負載測試](#性能和負載測試)
7. [自動化測試腳本](#自動化測試腳本)
8. [測試報告模板](#測試報告模板)

---

## 測試環境設置

### 前置條件

- ✅ Node.js 18+ 已安裝
- ✅ PostgreSQL/Supabase 數據庫已配置
- ✅ Redis 已配置（用於率限制）
- ✅ 環境變數已配置（.env.local）
- ✅ 所有後端依賴已安裝 (`npm install`)
- ✅ 所有前端依賴已安裝 (`npm install`)

### 啟動測試環境

```bash
# 終端 1: 後端開發服務器
cd backend
npm run dev

# 終端 2: 前端開發服務器
cd frontend
npm run dev

# 終端 3: 測試執行（使用下面提供的腳本）
# 將在此終端運行自動化測試
```

### 驗證服務正常運行

```bash
# 檢查後端健康狀態
curl -X GET http://localhost:5000/api/v1/health

# 檢查前端
curl -X GET http://localhost:3000
```

---

## 測試數據準備

### 1. 創建測試用戶

使用 Supabase 控制台或 SQL 腳本，創建以下測試用戶：

```sql
-- 管理員用戶（用於審核）
INSERT INTO users (id, email, password_hash, role, status, company_name)
VALUES (
  'admin-uuid-1111-1111-111111111111',
  'admin@test.com',
  'hashed_password',
  'admin',
  'active',
  'Admin Company'
);

-- 普通用戶 A（提交車輛進行審核）
INSERT INTO users (id, email, password_hash, role, status, company_name)
VALUES (
  'user-uuid-2222-2222-222222222222',
  'user-a@test.com',
  'hashed_password',
  'user',
  'active',
  'User Company A'
);

-- 普通用戶 B（測試懸停帳戶）
INSERT INTO users (id, email, password_hash, role, status, company_name)
VALUES (
  'user-uuid-3333-3333-333333333333',
  'user-b@test.com',
  'hashed_password',
  'user',
  'suspended',
  'User Company B'
);

-- 經銷商用戶（代客建檔測試）
INSERT INTO users (id, email, password_hash, role, status, company_name, parent_dealer_id)
VALUES (
  'dealer-uuid-4444-4444-444444444444',
  'dealer@test.com',
  'hashed_password',
  'dealer',
  'active',
  'Dealer Company',
  'admin-uuid-1111-1111-111111111111'
);
```

### 2. 創建測試車輛數據

```sql
-- 待審核車輛（user-a 提交）
INSERT INTO vehicles (
  id, owner_dealer_id, brand_id, spec_id, model_id,
  year, listing_price, status, created_at
)
VALUES (
  'vehicle-uuid-5555-5555-555555555555',
  'user-uuid-2222-2222-222222222222',
  'brand-uuid',
  'spec-uuid',
  'model-uuid',
  2023,
  500000,
  'pending',
  NOW()
);

-- 已核准車輛
INSERT INTO vehicles (
  id, owner_dealer_id, brand_id, spec_id, model_id,
  year, listing_price, status, created_at
)
VALUES (
  'vehicle-uuid-6666-6666-666666666666',
  'user-uuid-2222-2222-222222222222',
  'brand-uuid',
  'spec-uuid',
  'model-uuid',
  2023,
  450000,
  'approved',
  NOW()
);

-- 已拒絕車輛
INSERT INTO vehicles (
  id, owner_dealer_id, brand_id, spec_id, model_id,
  year, listing_price, status, created_at
)
VALUES (
  'vehicle-uuid-7777-7777-777777777777',
  'user-uuid-2222-2222-222222222222',
  'brand-uuid',
  'spec-uuid',
  'model-uuid',
  2023,
  400000,
  'rejected',
  NOW(),
  rejection_reason = '價格不合理'
);
```

### 3. 準備測試圖片

在工作目錄創建測試圖片文件：

```bash
# 創建測試圖片目錄
mkdir -p test-data/images

# 使用 ImageMagick 創建測試圖片（或使用任何其他工具）
# 創建有效的 JPEG 圖片
convert -size 800x600 xc:blue test-data/images/valid-image.jpg

# 創建大型圖片（超過大小限制，用於負面測試）
convert -size 5000x5000 xc:red test-data/images/large-image.jpg

# 複製為不同格式
cp test-data/images/valid-image.jpg test-data/images/image.png
cp test-data/images/valid-image.jpg test-data/images/image.webp
```

---

## API 端點測試

### 1. 認證端點

#### 1.1 用戶登錄

**目標**: 驗證用戶可以成功登錄並獲得有效的 JWT 令牌

**端點**: `POST /api/v1/auth/login`

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'

# 預期響應
{
  "success": true,
  "data": {
    "user": {
      "id": "admin-uuid-1111-1111-111111111111",
      "email": "admin@test.com",
      "role": "admin",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**測試用例**:
- ✅ 有效的憑證
- ❌ 無效的電子郵件
- ❌ 不存在的用戶
- ❌ 錯誤的密碼
- ❌ 空密碼
- ❌ 懸停帳戶登錄

---

### 2. 管理員車輛審核端點

#### 2.1 獲取待審核車輛列表

**目標**: 驗證管理員可以查看所有待審核車輛

**端點**: `GET /api/v1/admin/vehicles/pending`

```bash
# 取得管理員令牌
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

# 獲取待審核列表
curl -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=20' \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 預期響應
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "vehicle-uuid-5555-5555-555555555555",
        "owner_dealer_id": "user-uuid-2222-2222-222222222222",
        "brand": { "id": "...", "name": "..." },
        "year": 2023,
        "listing_price": 500000,
        "status": "pending",
        "created_at": "2025-03-19T10:00:00Z",
        "owner": { "company_name": "User Company A", ... }
      }
    ],
    "pagination": {
      "nextCursor": null,
      "hasMore": false,
      "total": 1
    }
  }
}
```

**測試用例**:
- ✅ 管理員訪問（認證）
- ❌ 無效的令牌
- ❌ 過期的令牌
- ❌ 普通用戶訪問（未授權）
- ✅ 分頁游標測試
- ✅ 自定義限制

---

#### 2.2 獲取車輛審核詳情

**目標**: 驗證管理員可以查看單個車輛的完整詳情

**端點**: `GET /api/v1/admin/vehicles/{id}/detail`

```bash
VEHICLE_ID="vehicle-uuid-5555-5555-555555555555"

curl -X GET "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 預期響應
{
  "success": true,
  "data": {
    "id": "vehicle-uuid-5555-5555-555555555555",
    "owner_dealer_id": "user-uuid-2222-2222-222222222222",
    "brand": { ... },
    "spec": { ... },
    "model": { ... },
    "year": 2023,
    "listing_price": 500000,
    "description": "...",
    "status": "pending",
    "images": [
      {
        "id": "image-uuid",
        "url": "https://...",
        "display_order": 1
      }
    ],
    "owner": {
      "id": "user-uuid-2222-2222-222222222222",
      "company_name": "User Company A",
      "phone": "...",
      "email": "..."
    },
    "audit_history": [
      {
        "id": "audit-uuid",
        "action": "pending",
        "timestamp": "2025-03-19T10:00:00Z"
      }
    ]
  }
}
```

**測試用例**:
- ✅ 有效的車輛 ID
- ❌ 不存在的車輛 ID
- ❌ 無效的 UUID 格式
- ❌ 未認證訪問
- ✅ 已拒絕車輛的詳情
- ✅ 已核准車輛的詳情

---

#### 2.3 核准車輛

**目標**: 驗證管理員可以核准待審核車輛

**端點**: `POST /api/v1/admin/vehicles/{id}/approve`

```bash
VEHICLE_ID="vehicle-uuid-5555-5555-555555555555"

curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 預期響應
{
  "success": true,
  "data": {
    "id": "vehicle-uuid-5555-5555-555555555555",
    "status": "approved",
    "approved_at": "2025-03-19T11:00:00Z",
    "approved_by": "admin-uuid-1111-1111-111111111111"
  },
  "message": "車輛已核准"
}
```

**測試用例**:
- ✅ 核准待審核車輛
- ❌ 重複核准已核准車輛
- ❌ 核准已拒絕車輛
- ❌ 核准不存在的車輛
- ❌ 未認證訪問
- ❌ 普通用戶嘗試核准

---

#### 2.4 拒絕車輛

**目標**: 驗證管理員可以拒絕待審核車輛並提供拒絕原因

**端點**: `POST /api/v1/admin/vehicles/{id}/reject`

```bash
VEHICLE_ID="vehicle-uuid-5555-5555-555555555555"

curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "車輛有明顯瑕疵，無法通過審核"
  }'

# 預期響應
{
  "success": true,
  "data": {
    "id": "vehicle-uuid-5555-5555-555555555555",
    "status": "rejected",
    "rejection_reason": "車輛有明顯瑕疵，無法通過審核",
    "rejected_at": "2025-03-19T11:00:00Z",
    "rejected_by": "admin-uuid-1111-1111-111111111111"
  },
  "message": "已拒絕車輛"
}
```

**測試用例**:
- ✅ 拒絕待審核車輛（有有效原因）
- ❌ 拒絕不提供原因
- ❌ 拒絕空原因
- ❌ 重複拒絕已拒絕車輛
- ❌ 拒絕已核准車輛
- ❌ 拒絕不存在的車輛
- ✅ 原因過長測試（邊界）

---

### 3. 代客建檔端點

#### 3.1 上傳代客建檔圖片

**目標**: 驗證管理員可以為代客建檔車輛上傳多張圖片

**端點**: `POST /api/v1/admin/vehicles/{id}/images`

```bash
VEHICLE_ID="vehicle-uuid-new-vehicle"

# 建立表單數據並上傳多張圖片
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-data/images/image1.jpg" \
  -F "images=@test-data/images/image2.jpg" \
  -F "images=@test-data/images/image3.jpg"

# 預期響應
{
  "success": true,
  "data": {
    "vehicle_id": "vehicle-uuid-new-vehicle",
    "images": [
      {
        "id": "image-uuid-1",
        "url": "https://...",
        "display_order": 1,
        "created_at": "2025-03-19T11:00:00Z"
      },
      {
        "id": "image-uuid-2",
        "url": "https://...",
        "display_order": 2,
        "created_at": "2025-03-19T11:00:00Z"
      },
      {
        "id": "image-uuid-3",
        "url": "https://...",
        "display_order": 3,
        "created_at": "2025-03-19T11:00:00Z"
      }
    ]
  },
  "message": "已上傳 3 張圖片"
}
```

**測試用例**:
- ✅ 上傳 1 張圖片
- ✅ 上傳 3 張圖片
- ✅ 上傳最多 10 張圖片（限制）
- ❌ 上傳超過 10 張圖片
- ❌ 上傳不支援的格式
- ❌ 上傳超過大小限制的文件
- ❌ 不提供任何圖片
- ❌ 無效的車輛 ID
- ❌ 未認證訪問

---

#### 3.2 創建代客建檔車輛

**目標**: 驗證管理員可以代客建檔創建新車輛

**端點**: `POST /api/v1/admin/vehicles/proxy`

```bash
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/proxy" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_dealer_id": "user-uuid-2222-2222-222222222222",
    "brand_id": "brand-uuid",
    "spec_id": "spec-uuid",
    "model_id": "model-uuid",
    "year": 2023,
    "listing_price": 550000,
    "acquisition_cost": 480000,
    "repair_cost": 20000,
    "description": "良好狀態的二手車"
  }'

# 預期響應
{
  "success": true,
  "data": {
    "id": "vehicle-uuid-new-proxy",
    "owner_dealer_id": "user-uuid-2222-2222-222222222222",
    "brand": { ... },
    "year": 2023,
    "listing_price": 550000,
    "status": "pending",
    "created_at": "2025-03-19T11:00:00Z"
  },
  "message": "代客建檔成功"
}
```

**測試用例**:
- ✅ 有效的代客建檔數據
- ❌ 指定不存在的車主
- ❌ 指定懸停的車主帳戶
- ❌ 缺少必需字段（brand_id, model_id 等）
- ❌ 無效的價格（負數、零）
- ❌ 無效的年份
- ✅ 可選字段（acquisition_cost, repair_cost）

---

### 4. 用戶端點點

#### 4.1 創建用戶車輛

**目標**: 驗證用戶可以提交車輛進行審核

**端點**: `POST /api/v1/vehicles`

```bash
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-a@test.com","password":"password123"}' | jq -r '.data.token')

curl -X POST "http://localhost:5000/api/v1/vehicles" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "brand-uuid",
    "spec_id": "spec-uuid",
    "model_id": "model-uuid",
    "year": 2023,
    "listing_price": 520000,
    "description": "一手車主，保養良好"
  }'

# 預期響應
{
  "success": true,
  "data": {
    "id": "vehicle-uuid-user-created",
    "owner_dealer_id": "user-uuid-2222-2222-222222222222",
    "status": "pending",
    "created_at": "2025-03-19T12:00:00Z"
  },
  "message": "車輛已提交審核"
}
```

**測試用例**:
- ✅ 普通用戶創建車輛
- ❌ 缺少必需字段
- ❌ 懸停用戶創建車輛
- ❌ 未認證創建車輛

---

#### 4.2 獲取用戶的車輛

**目標**: 驗證用戶可以查看自己的車輛及其狀態

**端點**: `GET /api/v1/vehicles`

```bash
curl -X GET "http://localhost:5000/api/v1/vehicles" \
  -H "Authorization: Bearer $USER_TOKEN"

# 預期響應
{
  "success": true,
  "data": [
    {
      "id": "vehicle-uuid-5555-5555-555555555555",
      "status": "pending",
      "brand": { ... },
      "year": 2023,
      "listing_price": 500000,
      "created_at": "2025-03-19T10:00:00Z",
      "audit_status": {
        "status": "pending",
        "submitted_at": "2025-03-19T10:00:00Z"
      }
    },
    {
      "id": "vehicle-uuid-6666-6666-666666666666",
      "status": "approved",
      "brand": { ... },
      "year": 2023,
      "listing_price": 450000,
      "created_at": "2025-03-19T09:00:00Z",
      "audit_status": {
        "status": "approved",
        "approved_at": "2025-03-19T11:00:00Z"
      }
    },
    {
      "id": "vehicle-uuid-7777-7777-777777777777",
      "status": "rejected",
      "brand": { ... },
      "year": 2023,
      "listing_price": 400000,
      "created_at": "2025-03-19T08:00:00Z",
      "audit_status": {
        "status": "rejected",
        "rejection_reason": "價格不合理",
        "rejected_at": "2025-03-19T10:30:00Z"
      }
    }
  ]
}
```

**測試用例**:
- ✅ 獲取用戶的所有車輛
- ✅ 過濾已核准車輛
- ✅ 過濾已拒絕車輛
- ✅ 過濾待審核車輛
- ❌ 未認證訪問

---

---

## 邊界情況測試

### UUID 驗證

```bash
# ✅ 有效的 UUID
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/550e8400-e29b-41d4-a716-446655440000/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ❌ 無效的 UUID 格式
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/invalid-uuid/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ❌ 空 ID
curl -X GET "http://localhost:5000/api/v1/admin/vehicles//detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ❌ 非 UUID 字符串
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/abc123/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 認證邊界情況

```bash
# ❌ 缺少令牌
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending"

# ❌ 無效的令牌
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer invalid.token.here"

# ❌ 過期的令牌（需要手動設置過期時間）
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $EXPIRED_TOKEN"

# ❌ 錯誤的格式
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: $ADMIN_TOKEN"  # 缺少 "Bearer"
```

### 授權邊界情況

```bash
# ❌ 普通用戶嘗試訪問管理員端點
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $USER_TOKEN"

# ❌ 用戶嘗試核准車輛
VEHICLE_ID="vehicle-uuid-5555-5555-555555555555"
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/approve" \
  -H "Authorization: Bearer $USER_TOKEN"
```

### 數據驗證邊界情況

```bash
# ❌ 拒絕原因為空
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": ""}'

# ❌ 拒絕原因為空格
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": "   "}'

# ❌ 拒絕原因超長（測試長度限制）
LONG_REASON=$(python3 -c "print('a' * 5000)")
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"rejection_reason\": \"${LONG_REASON}\"}"

# ❌ 無效的 JSON
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

### 圖片上傳邊界情況

```bash
# ❌ 上傳超過 10 MB 的文件
# （先創建一個大於 10 MB 的文件）
dd if=/dev/zero of=test-data/images/large.jpg bs=1M count=11

curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-data/images/large.jpg"

# ❌ 上傳非圖片文件
echo "This is not an image" > test-data/test.txt
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-data/test.txt"

# ❌ 上傳超過 10 張圖片
for i in {1..12}; do
  cp test-data/images/image1.jpg "test-data/images/image$i.jpg"
done

curl -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-data/images/image{1..12}.jpg"
```

---

## 集成測試

### 完整的車輛審核工作流

```bash
#!/bin/bash

# 1. 用戶提交車輛
echo "📋 Step 1: User A submits a vehicle for audit"
USER_VEHICLE=$(curl -s -X POST "http://localhost:5000/api/v1/vehicles" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "brand-uuid",
    "spec_id": "spec-uuid",
    "model_id": "model-uuid",
    "year": 2023,
    "listing_price": 520000,
    "description": "良好狀態"
  }')

VEHICLE_ID=$(echo $USER_VEHICLE | jq -r '.data.id')
echo "✅ Vehicle ID: $VEHICLE_ID"

# 2. 管理員查看待審核列表
echo "📋 Step 2: Admin views pending vehicles"
PENDING=$(curl -s -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=20' \
  -H "Authorization: Bearer $ADMIN_TOKEN")

COUNT=$(echo $PENDING | jq '.data.data | length')
echo "✅ Found $COUNT pending vehicles"

# 3. 管理員查看車輛詳情
echo "📋 Step 3: Admin views vehicle details"
DETAIL=$(curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

STATUS=$(echo $DETAIL | jq -r '.data.status')
echo "✅ Vehicle status: $STATUS"

# 4. 管理員核准車輛
echo "📋 Step 4: Admin approves vehicle"
APPROVE=$(curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

APPROVED_STATUS=$(echo $APPROVE | jq -r '.data.status')
echo "✅ Vehicle approved, status: $APPROVED_STATUS"

# 5. 用戶查看車輛狀態
echo "📋 Step 5: User checks vehicle status"
USER_VEHICLES=$(curl -s -X GET "http://localhost:5000/api/v1/vehicles" \
  -H "Authorization: Bearer $USER_TOKEN")

FOUND_VEHICLE=$(echo $USER_VEHICLES | jq ".data[] | select(.id == \"${VEHICLE_ID}\")")
FINAL_STATUS=$(echo $FOUND_VEHICLE | jq -r '.audit_status.status')
echo "✅ User sees vehicle status: $FINAL_STATUS"

echo "🎉 Complete workflow test passed!"
```

### 代客建檔工作流

```bash
#!/bin/bash

# 1. 管理員創建代客建檔車輛
echo "📋 Step 1: Admin creates proxy vehicle"
PROXY_VEHICLE=$(curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/proxy" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_dealer_id": "user-uuid-2222-2222-222222222222",
    "brand_id": "brand-uuid",
    "spec_id": "spec-uuid",
    "model_id": "model-uuid",
    "year": 2023,
    "listing_price": 550000,
    "acquisition_cost": 480000,
    "repair_cost": 20000,
    "description": "代客建檔車輛"
  }')

PROXY_ID=$(echo $PROXY_VEHICLE | jq -r '.data.id')
echo "✅ Proxy vehicle ID: $PROXY_ID"

# 2. 管理員上傳車輛圖片
echo "📋 Step 2: Admin uploads images"
IMAGES=$(curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/${PROXY_ID}/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-data/images/image1.jpg" \
  -F "images=@test-data/images/image2.jpg")

IMAGE_COUNT=$(echo $IMAGES | jq '.data.images | length')
echo "✅ Uploaded $IMAGE_COUNT images"

# 3. 管理員自動核准代客建檔車輛
echo "📋 Step 3: Admin auto-approves proxy vehicle"
APPROVE=$(curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/${PROXY_ID}/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

PROXY_STATUS=$(echo $APPROVE | jq -r '.data.status')
echo "✅ Proxy vehicle status: $PROXY_STATUS"

echo "🎉 Proxy creation workflow test passed!"
```

---

## 性能和負載測試

### 1. 負載測試工具設置

使用 `ab` (Apache Bench) 或 `k6` 進行負載測試：

```bash
# 安裝 k6
# Windows: choco install k6
# Mac: brew install k6
# Linux: sudo apt-get install k6

# 或者使用 Apache Bench (通常已安裝)
# Windows: 從 Apache 下載
# Mac: brew install httpd
# Linux: sudo apt-get install apache2-utils
```

### 2. 待審核列表性能測試

```bash
#!/bin/bash
# test-pending-performance.sh

echo "🔍 Testing GET /api/v1/admin/vehicles/pending performance"

# Warmup
curl -s -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=20' \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# 使用 Apache Bench 進行 1000 個請求，並發 10
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:5000/api/v1/admin/vehicles/pending

# 預期：
# - 平均響應時間 < 100ms
# - 失敗率 0%
# - 吞吐量 > 50 請求/秒
```

### 3. 圖片上傳性能測試

```bash
#!/bin/bash
# test-image-upload-performance.sh

echo "🔍 Testing POST image upload performance"

# 創建 5 個不同大小的測試圖片
for size in 100 500 1000 2000 5000; do
  convert -size ${size}x${size} xc:blue test-data/images/image-${size}kb.jpg
done

# 上傳測試
for i in {1..100}; do
  echo "Upload $i..."
  curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/images" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -F "images=@test-data/images/image-1000kb.jpg" > /dev/null
done

echo "✅ Completed 100 image uploads"
```

### 4. 並發批准/拒絕測試

```bash
#!/bin/bash
# test-concurrent-approval.sh

echo "🔍 Testing concurrent approval/rejection"

# 創建 100 個待審核車輛
for i in {1..100}; do
  curl -s -X POST "http://localhost:5000/api/v1/vehicles" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "brand_id": "brand-uuid",
      "spec_id": "spec-uuid",
      "model_id": "model-uuid",
      "year": 2023,
      "listing_price": 500000
    }' &
  
  if (( i % 10 == 0 )); then
    wait
  fi
done

# 並發批准（使用後台進程）
PENDING=$(curl -s -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=100' \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo $PENDING | jq -r '.data.data[].id' | while read VEHICLE_ID; do
  curl -s -X POST "http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/approve" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' &
done

wait
echo "✅ Concurrent approval test completed"
```

---

## 自動化測試腳本

### 主測試套件

創建文件 `test-suite.sh`：

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL=0
PASSED=0
FAILED=0

# Get tokens
echo "🔐 Authenticating test users..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-a@test.com","password":"password123"}' | jq -r '.data.token')

# Test function
run_test() {
  local test_name=$1
  local curl_cmd=$2
  local expected_code=$3
  
  TOTAL=$((TOTAL + 1))
  echo -n "Test $TOTAL: $test_name... "
  
  RESPONSE=$(eval "$curl_cmd")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" == "$expected_code" ]; then
    echo -e "${GREEN}PASSED${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAILED${NC} (Expected $expected_code, got $HTTP_CODE)"
    echo "Response: $RESPONSE"
    FAILED=$((FAILED + 1))
  fi
}

# ============================================================================
# Test Cases
# ============================================================================

echo -e "\n${YELLOW}=== Admin Vehicle Audit Tests ===${NC}"

# Test 1: Get pending vehicles
run_test \
  "Get pending vehicles" \
  "curl -s -w '%{http_code}' -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending' \
    -H 'Authorization: Bearer $ADMIN_TOKEN'" \
  "200"

# Test 2: Get vehicle detail
VEHICLE_ID="vehicle-uuid-5555-5555-555555555555"
run_test \
  "Get vehicle detail" \
  "curl -s -w '%{http_code}' -X GET \"http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/detail\" \
    -H 'Authorization: Bearer $ADMIN_TOKEN'" \
  "200"

# Test 3: Approve vehicle
run_test \
  "Approve vehicle" \
  "curl -s -w '%{http_code}' -X POST \"http://localhost:5000/api/v1/admin/vehicles/${VEHICLE_ID}/approve\" \
    -H 'Authorization: Bearer $ADMIN_TOKEN' \
    -H 'Content-Type: application/json' \
    -d '{}'" \
  "200"

echo -e "\n${YELLOW}=== Error Handling Tests ===${NC}"

# Test 4: Invalid UUID
run_test \
  "Invalid UUID format" \
  "curl -s -w '%{http_code}' -X GET 'http://localhost:5000/api/v1/admin/vehicles/invalid-id/detail' \
    -H 'Authorization: Bearer $ADMIN_TOKEN'" \
  "400"

# Test 5: Unauthorized access
run_test \
  "Unauthorized access (missing token)" \
  "curl -s -w '%{http_code}' -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending'" \
  "401"

# Test 6: User tries admin endpoint
run_test \
  "User tries admin endpoint" \
  "curl -s -w '%{http_code}' -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending' \
    -H 'Authorization: Bearer $USER_TOKEN'" \
  "403"

echo -e "\n${YELLOW}=== Summary ===${NC}"
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed!${NC}"
  exit 1
fi
```

### 運行測試套件

```bash
# 使腳本可執行
chmod +x test-suite.sh

# 運行測試
./test-suite.sh
```

---

## 測試報告模板

### 測試執行報告

```markdown
# 測試執行報告

**日期**: 2025-03-19  
**執行人**: [名稱]  
**環境**: 開發環境 (localhost:5000)  
**狀態**: ✅ 通過 / ❌ 失敗

---

## 測試摘要

| 項目 | 結果 | 備註 |
|------|------|------|
| API 端點測試 | ✅ | 所有 8 個端點工作正常 |
| 認證測試 | ✅ | JWT 令牌驗證正確 |
| 授權測試 | ✅ | 角色基礎訪問控制生效 |
| 邊界情況 | ✅ | UUID、數據驗證通過 |
| 集成工作流 | ✅ | 完整車輛審核流程正常 |
| 性能測試 | ⚠️ | 待執行（見下） |

---

## 詳細結果

### ✅ 已通過

- GET /api/v1/admin/vehicles/pending (200 OK)
- GET /api/v1/admin/vehicles/:id/detail (200 OK)
- POST /api/v1/admin/vehicles/:id/approve (200 OK)
- POST /api/v1/admin/vehicles/:id/reject (200 OK)
- POST /api/v1/admin/vehicles/:id/images (200 OK)
- POST /api/v1/admin/vehicles/proxy (201 Created)
- 用戶車輛提交和查看狀態（200 OK）

### ❌ 失敗

（如果有失敗，列出詳細信息）

### ⚠️ 警告

（列出任何潛在問題或需要關注的地方）

---

## 性能指標

| 端點 | 平均響應時間 | P95 | P99 | 吞吐量 |
|------|-------------|-----|-----|--------|
| GET /pending | 45ms | 78ms | 125ms | 150 req/s |
| GET /:id/detail | 30ms | 52ms | 95ms | 200 req/s |
| POST /approve | 55ms | 92ms | 165ms | 120 req/s |
| POST /images | 250ms | 450ms | 800ms | 30 req/s |

---

## 建議

1. [建議 1]
2. [建議 2]
3. [建議 3]

---

## 簽名

執行人: ____________  
日期: 2025-03-19  
批准人: ____________
```

---

## 下一步行動

1. **立即執行**:
   - [ ] 設置測試環境和數據
   - [ ] 運行自動化測試腳本
   - [ ] 執行手動 API 測試

2. **本週完成**:
   - [ ] 完成所有邊界情況測試
   - [ ] 執行集成工作流測試
   - [ ] 收集性能指標

3. **進行中**:
   - [ ] 記錄任何缺陷
   - [ ] 進行端點文檔驗證
   - [ ] 檢查錯誤處理一致性

4. **優化**:
   - [ ] 基於性能測試結果進行優化
   - [ ] 改進錯誤消息
   - [ ] 添加更詳細的日誌記錄

---

**文件版本**: 1.0  
**最後更新**: 2025-03-19  
**狀態**: 準備執行
