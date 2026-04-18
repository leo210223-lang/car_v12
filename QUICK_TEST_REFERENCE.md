# 🚀 FaCai-B 車輛審核系統 - 快速測試參考

**版本**: 1.0  
**日期**: 2025-03-19  

---

## ⚡ 5 分鐘快速檢查

### 1. 環境驗證 (2 分鐘)

```bash
# 檢查後端
curl -s http://localhost:5000/api/v1/health | jq '.'

# 檢查前端
curl -s http://localhost:3000 | head -20

# 預期: 都應返回成功響應
```

### 2. 認證驗證 (1 分鐘)

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

echo "Token: $TOKEN"
# 預期: 應顯示有效的 JWT 令牌（開頭為 eyJ）
```

### 3. 核心功能驗證 (2 分鐘)

```bash
# 獲取待審核列表
curl -s -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=5' \
  -H "Authorization: Bearer $TOKEN" | jq '.data.data | length'

# 預期: 應顯示數字（待審核車輛數量）
```

---

## 🔑 常用 API 命令速查

### 獲取令牌

```bash
# 管理員
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

# 普通用戶
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-a@test.com","password":"password123"}' | jq -r '.data.token')
```

### 待審核列表

```bash
# 獲取列表
curl -s -X GET 'http://localhost:5000/api/v1/admin/vehicles/pending?limit=20' \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# 更新 VEHICLE_ID 變數（從上面複製第一個 ID）
VEHICLE_ID="<copy-id-here>"
```

### 查看詳情

```bash
curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### 核准

```bash
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 拒絕

```bash
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason":"車輛狀況不符"}'
```

### 上傳圖片

```bash
# 先創建測試圖片
convert -size 800x600 xc:blue test-image.jpg 2>/dev/null || echo "Skip image creation"

# 上傳
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@test-image.jpg"
```

### 代客建檔

```bash
# 創建
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/proxy" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_dealer_id": "a0000000-0000-0000-0000-000000000002",
    "brand_id": "550e8400-e29b-41d4-a716-333333333333",
    "spec_id": "550e8400-e29b-41d4-a716-444444444444",
    "model_id": "550e8400-e29b-41d4-a716-555555555555",
    "year": 2023,
    "listing_price": 550000
  }' | jq '.data.id'
```

---

## 🧪 測試命令速查

### 自動化測試

```bash
# 運行全部測試
chmod +x test-automation.sh
./test-automation.sh

# 預期: 32/32 通過
```

### 運行特定測試

```bash
# 認證測試
./test-automation.sh 2>&1 | grep -A 10 "認證"

# 待審核列表測試
./test-automation.sh 2>&1 | grep -A 10 "待審核"
```

---

## ✅ 測試清單

### 每次開發後檢查 (10 分鐘)

- [ ] 後端能啟動: `npm run dev` ✅
- [ ] 前端能啟動: `npm run dev` ✅
- [ ] 認證工作: 能登錄 ✅
- [ ] 待審核列表: 能查看 ✅
- [ ] 車輛詳情: 能查看 ✅
- [ ] 核准/拒絕: 能執行 ✅
- [ ] 圖片上傳: 能成功 ✅
- [ ] 沒有 console 錯誤 ✅

### 完整測試套件 (1-2 小時)

- [ ] 運行自動化測試: `./test-automation.sh`
- [ ] 檢查所有端點文檔
- [ ] 執行邊界情況測試
- [ ] 執行工作流集成測試
- [ ] 檢查性能指標
- [ ] 記錄所有結果

---

## 🔴 常見問題速查

| 問題 | 症狀 | 解決方案 |
|------|------|--------|
| 認證失敗 | 401 | 檢查用戶是否存在，密碼是否正確 |
| 404 Not Found | 端點不存在 | 檢查 URL 是否正確，使用實際的 UUID |
| CORS 錯誤 | 跨域被阻止 | 檢查後端 CORS 配置 |
| 圖片上傳失敗 | 413/400 | 檢查文件大小 < 10MB，格式是否支持 |
| 拒絕失敗 | 400 | 檢查 rejection_reason 不為空 |
| 代客建檔失敗 | 404/400 | 檢查車主 ID 是否存在且為 active |

**詳細故障排除**: 見 `TEST_EXECUTION_GUIDE.md`

---

## 📊 數據庫快速查詢

### 檢查測試用戶

```sql
-- Supabase SQL 編輯器
SELECT id, email, role, status FROM users 
WHERE email LIKE '%test%' OR email LIKE '%@test.com%'
LIMIT 10;
```

### 檢查待審核車輛

```sql
SELECT id, owner_dealer_id, year, listing_price, status, created_at 
FROM vehicles 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

### 檢查稽核日誌

```sql
SELECT id, vehicle_id, action, admin_id, created_at 
FROM audit_logs 
ORDER BY created_at DESC
LIMIT 20;
```

### 創建或刷新測試用戶

```sql
-- 刪除現有
DELETE FROM users WHERE email LIKE '%test%';

-- 創建新的
INSERT INTO users (id, email, password_hash, role, status, company_name) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@test.com', '$2a$..', 'admin', 'active', 'Admin'),
('a0000000-0000-0000-0000-000000000002', 'user-a@test.com', '$2a$..', 'user', 'active', 'User A'),
('a0000000-0000-0000-0000-000000000003', 'user-b@test.com', '$2a$..', 'user', 'suspended', 'User B');
```

---

## 🎯 測試優先級

### 🔴 必須測試（關鍵路徑）

1. ✅ 認證 (登錄/授權)
2. ✅ 待審核列表 (管理員能查看)
3. ✅ 車輛詳情 (管理員能查看完整信息)
4. ✅ 核准/拒絕 (審核功能工作)
5. ✅ 用戶提交與查看狀態

### 🟠 應該測試（次要功能）

6. ⚠️ 圖片上傳
7. ⚠️ 代客建檔
8. ⚠️ 分頁和過濾

### 🟡 可選測試（優化和邊界）

9. 〰️ 性能測試
10. 〰️ 負載測試
11. 〰️ SQL 注入防護

---

## 📈 性能基準

| 操作 | 目標 | 狀態 |
|------|------|------|
| 獲取待審核列表 | < 100ms | ⏳ |
| 獲取車輛詳情 | < 50ms | ⏳ |
| 核准/拒絕 | < 100ms | ⏳ |
| 上傳圖片 | < 500ms | ⏳ |
| 代客建檔 | < 200ms | ⏳ |

**實際測試**: 執行 `./test-automation.sh` 並記錄響應時間

---

## 🔍 調試技巧

### 查看完整的 curl 請求/響應

```bash
# 加上 -v 參數顯示詳細信息
curl -v -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $TOKEN"
```

### 格式化 JSON 響應

```bash
curl -s ... | jq '.'              # 完整格式
curl -s ... | jq '.data'          # 只顯示數據
curl -s ... | jq '.data.id'       # 特定字段
```

### 查看後端日誌

```bash
# 查看最後 50 行
tail -50 backend/logs/*.log

# 實時監控
tail -f backend.log | grep -i error
```

### 查看前端網絡請求

```
在 Chrome 開發者工具中:
1. 按 F12 打開開發者工具
2. 切換到 Network 標籤
3. 執行操作
4. 查看請求/響應詳情
```

---

## 📞 快速聯繫

### 資源

| 項目 | 文檔 |
|------|------|
| 完整路由審計 | `COMPLETE_ROUTING_AUDIT.md` |
| 實現摘要 | `IMPLEMENTATION_SUMMARY.md` |
| 執行指南 | `TEST_EXECUTION_GUIDE.md` |
| 綜合測試計畫 | `COMPREHENSIVE_TEST_PLAN.md` |
| Postman 集合 | `FaCai-B_API_Collection.postman_collection.json` |
| API 修復指南 | `API_PATH_FIX.md` |

### 快速命令

```bash
# 查看所有可用的 npm 腳本
cd backend && npm run     # 列出所有可用命令

# 查看路由
grep -r "router.get\|router.post" backend/src/routes/ | head -20

# 檢查類型錯誤
cd backend && npm run build

# 運行測試
./test-automation.sh

# 查看 git 狀態
git status
git log --oneline | head -10
```

---

## 🎓 學習資源

### API 概念

- **待審核列表**: 顯示所有 status='pending' 的車輛
- **車輛詳情**: 返回車輛的完整信息包括圖片、擁有者等
- **核准/拒絕**: 更新車輛狀態並記錄審核日誌
- **代客建檔**: 管理員代替客戶創建車輛記錄
- **圖片上傳**: 支持批量上傳到 Supabase Storage

### 路由結構

```
/api/v1/
├── auth/
│   └── login
├── admin/
│   └── vehicles/
│       ├── pending (GET)
│       ├── /:id/detail (GET)
│       ├── /:id/approve (POST)
│       ├── /:id/reject (POST)
│       ├── /:id/images (POST)
│       └── proxy (POST)
└── vehicles/
    ├── (GET)
    └── (POST)
```

---

## 📝 測試模板

### 快速測試記錄

```
日期: 2025-03-19
測試人員: ________
開始時間: __:__
結束時間: __:__

✅ 認證
✅ 待審核列表
✅ 車輛詳情
✅ 核准
✅ 拒絕
✅ 圖片上傳
✅ 代客建檔
✅ 用戶功能

發現缺陷:
1. __________
2. __________

簽名: ________
```

---

**最後更新**: 2025-03-19  
**狀態**: ✅ 準備使用  
**版本**: 1.0.0
