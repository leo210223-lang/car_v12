# 錯誤修復總結

## 修復日期：2026年3月24日

### 1. 422 Unprocessable Content 錯誤 (車輛 API)

#### 問題根源
後端驗證 schema 要求的欄位名稱與前端發送的不匹配：

**後端期望：**
- `createVehicleSchema` 和 `proxyCreateVehicleSchema` 都要求 `listing_price` (必填)
- `proxyCreateVehicleSchema` 要求 `owner_dealer_id` 而不是 `dealer_id`
- `spec_id` 和 `model_id` 都是必填項

**前端發送：**
- `asking_price` (應為 `listing_price`)
- `dealer_id` (應為 `owner_dealer_id`)
- 可能發送 undefined 的 `spec_id` 和 `model_id`

#### 修復方案

##### 1. 更新代客建檔型別定義 (useAudit.ts)
```typescript
export interface ProxyVehicleInput {
  owner_dealer_id: string;    // 改為 owner_dealer_id
  brand_id: string;
  spec_id: string;            // 改為必填
  model_id: string;           // 改為必填
  year: number;
  listing_price: number;      // 改為 listing_price
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
}
```

##### 2. 更新代客建檔頁面 (frontend/src/app/(admin)/vehicles/new/page.tsx)
- 移除不必要的欄位 (color, mileage, transmission, fuel_type, images)
- 簡化表單，只保留後端所需的必填欄位
- 更新驗證邏輯以確保 `spec_id` 和 `model_id` 都選擇
- 更新 `handleSubmit` 發送正確的欄位名稱和結構

##### 3. 修正 mockData.ts
```typescript
export async function createProxyMockVehicle(input: {
  owner_dealer_id: string;    // 改為 owner_dealer_id
  brand_id: string;
  spec_id: string;            // 改為必填
  model_id: string;           // 改為必填
  year: number;
  listing_price: number;      // 改為 listing_price
  // ... 其他欄位
})
```

##### 4. 新增 API 字段轉換 (useVehicles.ts)
在 `createVehicle` 和 `updateVehicle` 函數中新增轉換邏輯，將前端的 `asking_price` 轉換為後端期望的 `listing_price`：

```typescript
const createVehicle = useCallback(async (data: Partial<Vehicle>) => {
  // 轉換 asking_price 為 listing_price（API 所需格式）
  const payload = { ...data };
  if ('asking_price' in payload && payload.asking_price) {
    (payload as any).listing_price = payload.asking_price;
    delete (payload as any).asking_price;
  }
  return api.post<Vehicle>('/vehicles', payload);
}, []);
```

---

### 2. Input Autocomplete 警告

#### 問題
Chrome 瀏覽器對密碼輸入欄位發出警告：
```
[DOM] Input elements should have autocomplete attributes
```

#### 修復方案
為密碼輸入欄位添加適當的 `autocomplete` 屬性：

**文件修改：**
1. `frontend/src/app/(auth)/login/page.tsx`
   - 密碼欄位：`autoComplete="current-password"`

2. `frontend/src/app/(auth)/register/page.tsx`
   - 密碼欄位：`autoComplete="new-password"`
   - 確認密碼欄位：`autoComplete="new-password"`

---

### 3. 代客建檔表單簡化

將代客建檔表單從複雜的多欄位設計簡化為只包含後端必需的核心欄位：

**移除的欄位：**
- color（顏色）
- mileage（里程）
- transmission（變速箱）
- fuel_type（燃料類型）
- images（圖片 URL）

**保留的必填欄位：**
- 車行選擇 (dealer_id → owner_dealer_id)
- 品牌/規格/車型（cascading select）
- 年份
- 售價 (asking_price → listing_price)

**可選欄位：**
- 描述

---

## 編譯驗證

✅ 前端編譯成功 - 沒有 TypeScript 錯誤
✅ 所有變更已應用
✅ 型別檢查通過

---

## 後續建議

1. **測試 API 整合**：實際測試車輛建立和代客建檔流程
2. **404 錯誤調查**：檢查何種資源導致 404 錯誤
3. **增強錯誤處理**：添加更詳細的 API 錯誤消息
4. **一致性改進**：考慮在 Vehicle 型別中統一使用 `listing_price` 而非 `asking_price`
