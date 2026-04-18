# 🔍 車輛審核系統問題診斷報告

**診斷日期：2026-03-24** | **狀態：已識別關鍵問題** | **優先級：🔴 高**

---

## 📋 識別的核心問題

### 問題 1️⃣：Admin 審核 API 端點缺失 🔴 **關鍵**

**症狀：**
- ❌ Admin 送出審核後，車輛無法更新狀態
- ❌ 車輛審核頁面查不到已送審的車輛
- ❌ 前端無法顯示「待審核」列表

**根本原因：**
後端缺少以下 API 端點：
- ❌ `GET /api/admin/vehicles/pending` - 獲取待審核車輛列表
- ❌ `GET /api/admin/vehicles/:id/detail` - 獲取車輛詳細信息
- ❌ `POST /api/admin/vehicles/:id/approve` - 核准車輛
- ❌ `POST /api/admin/vehicles/:id/reject` - 拒絕車輛

**文件位置：**
- ✅ 服務層已實現：`backend/src/services/audit.service.ts`
  - `listPending()` - 待審核列表 ✅ 已開發
  - `getDetail()` - 詳細信息 ✅ 已開發  
  - `approve()` - 核准邏輯 ✅ 已開發
  - `reject()` - 拒絕邏輯 ✅ 已開發

- ❌ 路由層缺失：`backend/src/routes/admin/vehicles.ts`
  - 只有 `POST /api/admin/vehicles/proxy` 代客建檔
  - **缺少上述 4 個核心端點**

**影響範圍：**
- User：無法查看「我的車輛」中的審核狀態
- Admin：無法進行車輛審核工作
- 整個審核流程：完全中斷 ⚠️

---

### 問題 2️⃣：代客建檔圖片上傳未實現 🟡 **重要**

**症狀：**
- ❌ Admin 代客建檔時無法上傳車輛照片
- ❌ 圖片 upload 路由未實現

**根本原因：**
`backend/src/routes/vehicles/upload.ts` 中：
- ✅ 單張圖片上傳已實現
- ✅ 圖片壓縮服務已實現
- ❌ **批量圖片上傳端點缺失**
- ❌ **Admin 代客建檔圖片上傳邏輯缺失**

**文件位置：**
- ✅ 圖片服務已實現：`backend/src/services/image.service.ts`
  - `upload()` - 單張上傳 ✅
  - `compress()` - 圖片壓縮 ✅
  - `delete()` - 刪除圖片 ✅

- ❌ 上傳路由：`backend/src/routes/vehicles/upload.ts`
  - 只有 `POST /api/vehicles/:id/upload` 用戶上傳
  - **缺少 `POST /api/admin/vehicles/batch-upload` 批量上傳**

**影響範圍：**
- Admin：無法代客建檔帶圖片的車輛
- User：圖片上傳可能正常 ✅

---

### 問題 3️⃣：前端審核頁面缺失 🟡 **重要**

**症狀：**
- ❌ `/admin/vehicles` 頁面只能查看「所有車輛」
- ❌ 沒有「待審核詳情頁」
- ❌ 無法進行「核准」「拒絕」操作

**根本原因：**
前端缺少詳細審核頁面：
- ✅ 車輛列表頁面已實現：`frontend/src/app/(admin)/vehicles/page.tsx`
- ❌ **車輛詳情審核頁面缺失**：需要 `frontend/src/app/(admin)/vehicles/[id]/page.tsx`
- ❌ **審核操作表單缺失**：核准/拒絕表單未實現

**文件位置：**
```
frontend/src/app/(admin)/vehicles/
├── page.tsx         ✅ 車輛列表
└── [id]/            ❌ 缺失
    └── page.tsx     ❌ 需要創建
```

**應包含的功能：**
- 車輛完整信息展示（品牌、規格、型號、年份、價格等）
- 車輛圖片輪播
- 車主信息展示
- 「核准」按鈕 + 確認
- 「拒絕」按鈕 + 拒絕原因輸入框
- 審核狀態追蹤

**影響範圍：**
- Admin：無法進行視覺化審核
- User：無法追蹤審核進度

---

### 問題 4️⃣：前端缺少對審核的資料更新機制 🟡 **重要**

**症狀：**
- ❌ Admin 審核後，前端列表未自動刷新
- ❌ 車輛狀態未更新（仍顯示 pending）
- ❌ 用戶無法實時看到審核結果

**根本原因：**
前端 Hook 中的刷新機制不完整：
- ✅ `useVehicles.ts` 中有 `refresh()` 方法
- ❌ **審核操作後未調用 refresh()**
- ❌ **缺少 WebSocket 或輪詢機制**

**相關文件：**
- `frontend/src/hooks/useVehicles.ts` - 需要添加 `approveVehicle()`, `rejectVehicle()` 方法
- 需要在操作成功後調用 `refresh()`

**影響範圍：**
- Admin：無法即時看到審核結果
- User：無法實時收到審核狀態通知

---

## 📊 問題嚴重程度分析

| 問題 | 嚴重性 | 影響用戶 | 解決難度 | 優先級 |
|------|-------|--------|--------|-------|
| 審核 API 端點缺失 | 🔴 致命 | Admin | 低 | 1️⃣ |
| 代客建檔圖片上傳 | 🟡 重要 | Admin | 中 | 2️⃣ |
| 前端審核頁面缺失 | 🟡 重要 | Admin+User | 中 | 3️⃣ |
| 資料更新機制缺失 | 🟡 重要 | Admin+User | 低 | 4️⃣ |

---

## 🚀 解決方案

### 第 1 步：實施審核 API 端點 (1-2 小時) 🔴 **優先**

**修改文件：** `backend/src/routes/admin/vehicles.ts`

需要添加以下端點：

```typescript
// 1. 獲取待審核車輛列表
GET /api/admin/vehicles/pending

// 2. 獲取車輛詳細信息
GET /api/admin/vehicles/:id/detail

// 3. 核准車輛
POST /api/admin/vehicles/:id/approve

// 4. 拒絕車輛
POST /api/admin/vehicles/:id/reject
body: { rejection_reason: string }
```

**關鍵邏輯：** 已全部在 `audit.service.ts` 中實現，只需在路由中調用

---

### 第 2 步：實施前端審核詳情頁面 (1-2 小時) 🟡 **重要**

**創建文件：** `frontend/src/app/(admin)/vehicles/[id]/page.tsx`

需要包含：
- 車輛完整資訊（含圖片)
- 車主資訊
- 核准/拒絕表單
- 狀態追蹤

---

### 第 3 步：添加代客建檔圖片上傳 (30 分鐘) 🟡 **重要**

**修改文件：** 
- `backend/src/routes/vehicles/upload.ts` - 添加批量上傳端點
- `backend/src/routes/admin/vehicles.ts` - 集成批量上傳到代客建檔

---

### 第 4 步：添加前端審核操作 Hook (30 分鐘) 🟡 **重要**

**修改文件：** `frontend/src/hooks/useVehicles.ts`

添加方法：
```typescript
const approveVehicle = async (id: string) => { ... }
const rejectVehicle = async (id: string, reason: string) => { ... }
```

操作後調用 `refresh()` 刷新列表

---

## 📝 User 使用者是否也會遇到問題？

### ✅ User 車輛上傳：**正常工作**
- 新增車輛表單：✅ 完整實現
- 圖片上傳：✅ 可正常上傳單張
- 審核狀態查詢：✅ `/my-cars` 可看到狀態
- **但：** 無法實時看到 Admin 的審核反饋（拒絕原因等）

### ⚠️ User 審核追蹤：**部分缺失**
- ❌ 無法看到「拒絕原因」詳情
- ❌ 無法實時收到審核通知
- ❌ 需要手動刷新才能看到最新狀態

### ✅ User 車輛編輯：**正常工作**
- 修改已駁回的車輛：✅ 可正常編輯
- 重新送審：✅ 可正常提交

---

## 💡 建議修復順序

```
1️⃣ 審核 API 端點           (高優先級，1-2 小時)
   ↓
2️⃣ 前端審核詳情頁面       (高優先級，1-2 小時)  
   ↓
3️⃣ 前端審核操作 Hook      (中優先級，30 分鐘)
   ↓
4️⃣ 代客建檔圖片上傳       (中優先級，30 分鐘)
   ↓
5️⃣ 優化 User 體驗         (低優先級，可後續完善)
   - 拒絕原因提示
   - 實時通知
   - WebSocket 推送
```

---

## ✨ 完全解決後的預期效果

### Admin 側：
- ✅ 可訪問 `/admin/vehicles` 查看「所有車輛」
- ✅ 可點擊車輛進入詳情頁 `/admin/vehicles/[id]`
- ✅ 可進行「核准」或「拒絕」操作
- ✅ 列表會自動更新，反映最新狀態
- ✅ 可代客建檔並上傳多張圖片

### User 側：
- ✅ 新增車輛後可在 `/my-cars` 看到「待審核」狀態
- ✅ Admin 核准後自動變為「已上架」
- ✅ Admin 拒絕後會看到「已退件」及拒絕原因
- ✅ 可編輯已退件的車輛並重新送審

---

## 📞 下一步行動

1. ✅ **確認本診斷報告的準確性**
2. ⏳ **按優先級順序實施修復**
3. 📊 **測試各個場景（Admin 審核、User 追蹤等）**
4. 🚀 **上線部署**

---

**診斷者：GitHub Copilot**  
**診斷日期：2026-03-24**  
**完成度：100% 已識別問題** ✅
