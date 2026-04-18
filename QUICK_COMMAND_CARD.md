# ⚡ FaCai-B 車輛審核系統 - 快速命令卡片

打印此卡片並隨時參考！

---

## 🎯 5 分鐘快速開始

```bash
# 1. 檢查環境 (應返回 "ok")
curl http://localhost:5000/api/v1/health -s | jq '.status'

# 2. 獲取令牌
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" -d '{"role":"admin"}' | jq -r '.data.token')

# 3. 驗證令牌有效 (應返回數字 >= 0)
curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.data | length'
```

---

## 🤖 自動化測試

```bash
# 快速驗證 (15 分鐘)
./complete-test-execution.sh --quick

# 完整測試 (30 分鐘)
./complete-test-execution.sh --full
```

---

## 📋 核心 API 端點

### 1️⃣ 待審核列表
```bash
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data'
```

### 2️⃣ 車輛詳情
```bash
VEHICLE_ID="<UUID>"
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data'
```

### 3️⃣ 核准車輛
```bash
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"符合條件"}'
```

### 4️⃣ 拒絕車輛
```bash
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"不符合要求"}'
```

### 5️⃣ 上傳圖片
```bash
curl -X POST "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/images" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 6️⃣ 代客建檔
```bash
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
```

---

## 🔍 常見測試

### 驗證 UUID 邊界
```bash
# 無效 UUID → 應返回 400
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/invalid-id/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 不存在的 UUID → 應返回 404
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/00000000-0000-0000-0000-000000000000/detail" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 驗證認證
```bash
# 無令牌 → 應返回 401
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending"

# 無效令牌 → 應返回 401
curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer invalid-token"
```

### 驗證授權
```bash
# User 令牌訪問 Admin 端點 → 應返回 403/401
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" -d '{"role":"user"}' | jq -r '.data.token')

curl -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## 📊 性能測試

```bash
# 測試響應時間
time curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# 預期: < 1000ms
```

---

## 🐛 故障排除

### 後端連接失敗？
```bash
ps aux | grep "npm.*start" | grep -v grep
# 如果無輸出，執行:
cd backend && npm start
```

### 令牌獲取失敗？
```bash
curl -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' -v
```

### 404 錯誤？
```bash
# 確認 UUID 格式正確
# 正確: 123e4567-e89b-12d3-a456-426614174000
# 錯誤: pv001, vehicle-123

# 查詢實際車輛 ID
curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.data[].id'
```

### 403 Forbidden？
```bash
# 確認令牌角色為 "admin"
# 確認使用 /admin/vehicles 端點 (不是其他路由)
```

---

## 📚 文檔快速鏈接

| 需要 | 查看 | 時間 |
|------|------|------|
| 概覽 | START_TESTING_NOW.md | 5 分鐘 |
| 快速查詢 | QUICK_TEST_REFERENCE.md | 5 分鐘 |
| 完整檢查清單 | QUICK_VERIFICATION_CHECKLIST.md | 30 分鐘 |
| 診斷幫助 | DEEP_DIAGNOSTICS.md | 20 分鐘 |
| API 文檔 | COMPLETE_ROUTING_AUDIT.md | 15 分鐘 |
| 修復指南 | API_PATH_FIX.md | 10 分鐘 |

---

## 🎯 現在就做 (1 分鐘)

```bash
# 複製粘貼以下內容到終端

# 驗證環境
curl http://localhost:5000/api/v1/health -s | jq '.status'

# 獲取令牌
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/test-token \
  -H "Content-Type: application/json" -d '{"role":"admin"}' | jq -r '.data.token')

echo "✅ 令牌已設置！現在可以運行測試了。"

# 運行自動化測試
./complete-test-execution.sh --full
```

---

## ⚡ 5 個最常用的命令

```bash
# 1️⃣  待審核列表
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:5000/api/v1/admin/vehicles/pending" | jq '.data.data | .[0]'

# 2️⃣  車輛詳情
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/detail" | jq '.data'

# 3️⃣  核准
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/approve" \
  -d '{}'

# 4️⃣  拒絕
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:5000/api/v1/admin/vehicles/$VEHICLE_ID/reject" \
  -d '{"reason":"不符合"}'

# 5️⃣  運行測試
./complete-test-execution.sh --full
```

---

## 💡 關鍵提示

**🔴 重要**:
- 始終使用有效的 UUID 格式，例如: `123e4567-e89b-12d3-a456-426614174000`
- 不要使用 `pv001` 或 `vehicle-123` 這類格式
- 確保在 Authorization 頭中使用 `Bearer ` 前綴

**🟡 注意**:
- 核准後，狀態變為 `approved`，不能再核准
- 拒絕後，狀態變為 `rejected`，不能再拒絕
- 圖片只接受: JPEG, PNG, WebP, GIF
- 單個文件最大 10MB，最多 10 張

**🟢 測試順序**:
1. 環境驗證 → 2. 認證測試 → 3. API 測試 → 4. 邊界測試 → 5. 性能測試

---

## 📖 如何使用本卡片

1. **打印本頁面**（A4 紙張）
2. **放在您的工作台旁**
3. **遇到問題時快速查找命令**
4. **將常用命令複製到終端**

---

## 🎉 完成標誌

```bash
# 如果此命令返回 JSON，說明環境已完全就緒！
curl -s -X GET "http://localhost:5000/api/v1/admin/vehicles/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.data | length'

# 預期: 返回一個數字（0 或更多）
# ✅ 成功！開始測試吧！
```

---

**版本**: 1.0  
**日期**: 2025-03-24  
**狀態**: ✅ 準備執行

💪 **現在就開始測試！** 🚀
