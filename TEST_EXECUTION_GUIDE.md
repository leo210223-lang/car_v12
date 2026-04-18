# 🚀 測試執行指南

**版本**: 1.0  
**日期**: 2025-03-19  
**狀態**: 準備執行  

---

## 📋 目錄

1. [快速開始](#快速開始)
2. [前置條件檢查](#前置條件檢查)
3. [測試環境設置](#測試環境設置)
4. [運行自動化測試](#運行自動化測試)
5. [手動測試流程](#手動測試流程)
6. [常見問題](#常見問題)
7. [故障排除](#故障排除)

---

## 快速開始

### 5 分鐘快速檢查

```bash
# 1. 確認後端運行
curl http://localhost:5000/api/v1/health

# 2. 確認前端運行
curl http://localhost:3000

# 3. 簡單的認證測試
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'

# 4. 如果都返回成功，準備進行深度測試
echo "✅ 環境檢查完成！"
```

---

## 前置條件檢查

### ✅ 清單

- [ ] **Node.js**: `node --version` （應為 v18+）
- [ ] **npm**: `npm --version` （應為 v9+）
- [ ] **PostgreSQL/Supabase**: 數據庫連接可用
- [ ] **Redis**: 用於率限制（如果配置）
- [ ] **環境變數**: `.env.local` 已配置
- [ ] **後端依賴**: `cd backend && npm install` ✅
- [ ] **前端依賴**: `cd frontend && npm install` ✅
- [ ] **測試數據**: 已創建（見下）

### 驗證依賴

```bash
# 檢查後端依賴
cd backend
npm list express cors multer supabase

# 檢查前端依賴
cd frontend
npm list next react
```

---

## 測試環境設置

### 1️⃣ 創建測試用戶

使用 Supabase SQL 編輯器運行以下 SQL：

```sql
-- 管理員用戶
INSERT INTO users (id, email, password_hash, role, status, company_name)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@test.com',
  '$2a$10$hashed_password_here',
  'admin',
  'active',
  'Test Admin Company'
) ON CONFLICT (id) DO NOTHING;

-- 普通用戶 A
INSERT INTO users (id, email, password_hash, role, status, company_name)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'user-a@test.com',
  '$2a$10$hashed_password_here',
  'user',
  'active',
  'Test User Company A'
) ON CONFLICT (id) DO NOTHING;

-- 懸停用戶
INSERT INTO users (id, email, password_hash, role, status, company_name)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'user-b@test.com',
  '$2a$10$hashed_password_here',
  'user',
  'suspended',
  'Test User Company B'
) ON CONFLICT (id) DO NOTHING;

-- 經銷商
INSERT INTO users (id, email, password_hash, role, status, company_name, parent_dealer_id)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'dealer@test.com',
  '$2a$10$hashed_password_here',
  'dealer',
  'active',
  'Test Dealer Company',
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;
```

### 2️⃣ 創建測試車輛

```sql
-- 待審核車輛
INSERT INTO vehicles (id, owner_dealer_id, brand_id, spec_id, model_id, year, listing_price, status)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'brand-uuid-here',
  'spec-uuid-here',
  'model-uuid-here',
  2023,
  500000,
  'pending'
) ON CONFLICT (id) DO NOTHING;

-- 已核准車輛
INSERT INTO vehicles (id, owner_dealer_id, brand_id, spec_id, model_id, year, listing_price, status)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'brand-uuid-here',
  'spec-uuid-here',
  'model-uuid-here',
  2023,
  450000,
  'approved'
) ON CONFLICT (id) DO NOTHING;
```

### 3️⃣ 啟動開發服務器

**終端 1 - 後端**:
```bash
cd backend
npm run dev
# 預期輸出: Server running on http://localhost:5000
```

**終端 2 - 前端**:
```bash
cd frontend
npm run dev
# 預期輸出: ▲ Next.js started on http://localhost:3000
```

**終端 3 - 測試執行**:
```bash
cd /path/to/workspace
# 準備運行測試
```

---

## 運行自動化測試

### 方法 1️⃣: Bash 腳本（推薦）

```bash
# 使腳本可執行
chmod +x test-automation.sh

# 運行全部測試
./test-automation.sh

# 預期結果:
# ✅ 所有測試通過！系統準備就緒！
# 或
# ❌ 發現 X 個失敗測試，請檢查上述報告！
```

### 方法 2️⃣: 逐個運行測試

#### 認證測試

```bash
# 設置變數
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="password123"

# 測試 1: 成功登錄
curl -v -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"

# 預期: 200 OK + JWT 令牌
```

#### 待審核列表測試

```bash
# 獲取令牌
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

# 測試 1: 獲取待審核列表
curl -v -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=20' \
  -H "Authorization: Bearer $TOKEN"

# 預期: 200 OK + 車輛列表
```

#### 車輛詳情測試

```bash
# 替換為實際的車輛 UUID
VEHICLE_ID="b0000000-0000-0000-0000-000000000001"

curl -v -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
  -H "Authorization: Bearer $TOKEN"

# 預期: 200 OK + 車輛詳細信息
```

#### 核准測試

```bash
curl -v -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 預期: 200 OK + 狀態已更新為 "approved"
```

#### 拒絕測試

```bash
curl -v -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason":"車輛狀況不符"}'

# 預期: 200 OK + 狀態已更新為 "rejected"
```

---

## 手動測試流程

### 🧪 完整的工作流測試

1. **使用者端**
   ```bash
   # 登錄作為普通用戶
   USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user-a@test.com","password":"password123"}' | jq -r '.data.token')
   
   # 提交車輛進行審核
   curl -X POST http://localhost:5000/api/v1/vehicles \
     -H "Authorization: Bearer $USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "brand_id": "brand-uuid",
       "spec_id": "spec-uuid",
       "model_id": "model-uuid",
       "year": 2023,
       "listing_price": 520000
     }'
   
   # 檢查車輛狀態
   curl -X GET http://localhost:5000/api/v1/vehicles \
     -H "Authorization: Bearer $USER_TOKEN"
   ```

2. **管理員端**
   ```bash
   # 登錄作為管理員
   ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')
   
   # 查看待審核列表
   curl -X GET http://localhost:5000/api/v1/admin/vehicles/pending \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   
   # 查看車輛詳情
   VEHICLE_ID="b0000000-0000-0000-0000-000000000001"
   curl -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   
   # 核准或拒絕
   # 核准
   curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}'
   
   # 或拒絕
   curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/reject" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"rejection_reason":"不符合要求"}'
   ```

3. **代客建檔流程**
   ```bash
   # 1. 創建代客建檔車輛
   PROXY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/admin/vehicles/proxy \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "owner_dealer_id": "a0000000-0000-0000-0000-000000000002",
       "brand_id": "brand-uuid",
       "spec_id": "spec-uuid",
       "model_id": "model-uuid",
       "year": 2023,
       "listing_price": 550000,
       "acquisition_cost": 480000,
       "repair_cost": 20000
     }')
   
   PROXY_ID=$(echo $PROXY_RESPONSE | jq -r '.data.id')
   
   # 2. 上傳圖片
   # 首先創建測試圖片
   convert -size 800x600 xc:blue test-image.jpg
   
   curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$PROXY_ID/images" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -F "images=@test-image.jpg"
   
   # 3. 核准代客建檔車輛
   curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$PROXY_ID/approve" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

---

## 常見問題

### Q1: 認證失敗 (401 Unauthorized)

**症狀**: 所有需要認證的請求都返回 401

**解決方案**:
```bash
# 1. 驗證用戶存在
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# 2. 如果返回 401，檢查：
#    a) 用戶是否存在於數據庫
#    b) 密碼是否正確
#    c) 帳戶狀態是否為 'active'

# 3. 查看後端日誌獲取詳細信息
tail -f backend.log | grep -i auth
```

### Q2: 404 Not Found on POST /api/v1/admin/vehicles/pv001/approve

**症狀**: `POST /api/v1/admin/vehicles/pv001/approve` 返回 404

**原因**: `pv001` 不是有效的 UUID

**解決方案**:
```bash
# ❌ 錯誤
curl -X POST http://localhost:5000/api/v1/admin/vehicles/pv001/approve

# ✅ 正確 - 使用有效的 UUID
VEHICLE_ID="b0000000-0000-0000-0000-000000000001"
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve"
```

### Q3: CORS 錯誤

**症狀**: 前端請求被 CORS 政策阻止

**解決方案**:
```bash
# 檢查後端 CORS 配置
grep -A 10 "CORS" backend/src/app.ts

# 確保前端 URL 在允許清單中
# 開發模式應允許 localhost:3000
# 生產模式應允許 .vercel.app 和 .onrender.com
```

### Q4: 圖片上傳失敗

**症狀**: `POST /api/v1/admin/vehicles/{id}/images` 返回 400/413

**解決方案**:
```bash
# 1. 檢查文件大小
ls -lh test-image.jpg
# 應小於 10MB

# 2. 檢查文件格式
file test-image.jpg
# 應為 JPEG、PNG、WebP 或 GIF

# 3. 檢查文件數量
# 最多 10 張圖片

# 4. 驗證車輛 ID 有效
VEHICLE_ID="b0000000-0000-0000-0000-000000000001"
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Q5: 懸停帳戶無法登錄

**症狀**: 懸停帳戶登錄返回 401 或 403

**預期行為**: ✅ 這是正確的！懸停帳戶不應被允許登錄

**驗證測試**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-b@test.com","password":"password123"}'

# 預期: 401/403 Forbidden
```

---

## 故障排除

### 🔴 後端無法啟動

```bash
# 1. 檢查端口是否被占用
lsof -i :5000
# 或在 Windows 上:
netstat -ano | findstr :5000

# 2. 清空 node_modules 並重新安裝
cd backend
rm -rf node_modules package-lock.json
npm install

# 3. 檢查環境變數
cat .env.local | head -20

# 4. 查看詳細錯誤日誌
NODE_DEBUG=* npm run dev
```

### 🔴 無法連接到數據庫

```bash
# 1. 驗證 Supabase 連接
curl "https://YOUR_SUPABASE_URL/rest/v1/users?limit=1" \
  -H "apikey: YOUR_SUPABASE_KEY"

# 2. 檢查環境變數中的 URL 和密鑰
grep SUPABASE .env.local

# 3. 查看後端連接日誌
grep -i "supabase\|database\|connection" backend.log
```

### 🔴 測試腳本權限問題

```bash
# Windows PowerShell 上無法執行 .sh 文件
# 解決方案 1: 使用 Git Bash
# 安裝 Git for Windows 並在 Git Bash 中運行

# 解決方案 2: 使用 WSL
wsl ./test-automation.sh

# 解決方案 3: 直接使用 curl 命令
# （参考上面的手動測試流程）
```

### 🔴 測試失敗 - 車輛 ID 不存在

**症狀**: `GET /admin/vehicles/{id}/detail` 返回 404

**解決方案**:
```bash
# 1. 確認測試數據已創建
curl -X GET http://localhost:5000/api/v1/admin/vehicles/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. 複製返回的實際車輛 ID
# 3. 在測試中使用該 ID 替換示例 UUID

# 或者在 test-automation.sh 中更新：
SAMPLE_VEHICLE_ID="actual-uuid-from-database"
```

---

## 🎯 預期的測試結果

### 成功指標

```
✅ 認證測試: 3/3 通過
✅ 待審核列表: 5/5 通過
✅ 車輛詳情: 4/4 通過
✅ 車輛核准: 3/3 通過
✅ 車輛拒絕: 4/4 通過
✅ 圖片上傳: 3/3 通過
✅ 代客建檔: 3/3 通過
✅ 用戶車輛: 3/3 通過
✅ 邊界情況: 4/4 通過

📊 總計: 32/32 通過 (100%)
```

### 響應時間目標

| 端點 | 目標 | 實際 |
|------|------|------|
| GET /pending | < 100ms | __ |
| GET /:id/detail | < 50ms | __ |
| POST /approve | < 100ms | __ |
| POST /reject | < 100ms | __ |
| POST /images | < 500ms | __ |
| POST /proxy | < 200ms | __ |

---

## 📝 測試記錄

在 `test-results/` 目錄下記錄測試結果：

```bash
# 自動化測試結果
./test-automation.sh > test-results/automated_$(date +%Y%m%d_%H%M%S).log

# 手動測試檢查清單
# 見下面的模板
```

### 手動測試檢查清單

```
☐ 認證和授權
  ☐ 管理員可以登錄
  ☐ 普通用戶可以登錄
  ☐ 懸停帳戶無法登錄
  ☐ 無效密碼返回 401
  ☐ 過期令牌返回 401

☐ 待審核列表
  ☐ 管理員可以查看列表
  ☐ 普通用戶無法查看（403）
  ☐ 分頁工作正常
  ☐ 狀態過濾工作正常

☐ 車輛詳情
  ☐ 管理員可以查看詳情
  ☐ 顯示所有必要字段
  ☐ 無效 ID 返回 400
  ☐ 不存在的 ID 返回 404

☐ 車輛核准
  ☐ 管理員可以核准
  ☐ 狀態更新為 "approved"
  ☐ 重複核准返回錯誤
  ☐ 普通用戶無法核准

☐ 車輛拒絕
  ☐ 管理員可以拒絕
  ☐ 狀態更新為 "rejected"
  ☐ 保存拒絕原因
  ☐ 空原因返回 400
  ☐ 重複拒絕返回錯誤

☐ 圖片上傳
  ☐ 可以上傳單個圖片
  ☐ 可以上傳多個圖片
  ☐ 超大文件被拒絕
  ☐ 不支持的格式被拒絕
  ☐ 超過限制數量被拒絕

☐ 代客建檔
  ☐ 可以創建新車輛
  ☐ 可以上傳圖片
  ☐ 可以自動核准
  ☐ 無效所有者被拒絕
  ☐ 懸停所有者被拒絕

☐ 用戶端
  ☐ 用戶可以提交車輛
  ☐ 用戶可以查看自己的車輛
  ☐ 用戶可以看到審核狀態
  ☐ 用戶可以看到拒絕原因
```

---

## 📞 支持

如遇到問題，請檢查以下資源：

1. **API 文檔**: 見 `COMPLETE_ROUTING_AUDIT.md`
2. **實現摘要**: 見 `IMPLEMENTATION_SUMMARY.md`
3. **修復指南**: 見 `API_PATH_FIX.md`
4. **後端日誌**: `backend/logs/` 或控制台輸出
5. **前端檢查**: 瀏覽器開發者工具（F12）-> Network 標籤

---

**最後更新**: 2025-03-19  
**狀態**: ✅ 準備執行測試
