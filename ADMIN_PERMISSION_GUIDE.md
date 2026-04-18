# 權限系統與 Admin 管理清晰化

## 📊 當前現狀分析

### 1️⃣ 權限系統是否存在？✅ **已實現**

系統已有分層的權限架構：

**前端權限檢查 (useUserRole.ts)：**
```typescript
export type UserRole = 'admin' | 'user' | null;

- role: 'admin' | 'user'
- isAdmin: boolean
- isUser: boolean
```

**權限來源（優先順序）：**
1. `user.user_metadata.role` (用戶自訂 metadata)
2. `user.app_metadata.role` (Supabase Auth Hooks 設定)
3. 預設值：`'user'`

**後端權限檢查：**
- Supabase RLS (Row Level Security) 策略在資料庫層面執行
- 中間件：`middleware/admin.ts` - 驗證用戶是否為 admin
- 中間件：`middleware/auth.ts` - 驗證 JWT token

---

### 2️⃣ 您沒有 Admin 帳號嗎？ ⚠️ **需要建立**

#### 建立 Admin 帳號的方式（選一種）

**方式 A：透過 Supabase Dashboard（最簡單）** ✅ **推薦**
1. 登入 Supabase Dashboard
2. 進入 Authentication → Users
3. 找到您的使用者帳號
4. 點擊編輯，添加到 `user_metadata`：
```json
{
  "role": "admin"
}
```
5. 重新登入

**方式 B：執行 SQL 指令**
```sql
-- 更新您的帳號為 admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- 驗證
SELECT id, email, role FROM public.users WHERE email = 'your-email@example.com';
```

**方式 C：建立 Node.js 腳本**
```bash
node backend/scripts/promote-to-admin.js <your-email>
```

---

### 3️⃣ Admin 權限編輯"更多服務"頁面✅ **已實現**

#### 現有 Admin 功能

**存在的管理頁面：**
- `/(admin)/settings/services` - 服務管理
- `/(admin)/settings/shop` - 商品管理
- `/(admin)/vehicles` - 車輛審核
- `/(admin)/audit` - 稽核面板

**服務管理頁面功能：**
```typescript
// 可編輯項目：
- 服務名稱 (name)
- 服務描述 (description)
- 服務 URL (url)
- 服務圖標 (icon)
- 是否啟用 (is_active)
- 排序順序 (sort_order)

// 支援操作：
- 編輯服務內容
- 啟用/停用服務
- 調整服務順序
- 更新客服電話設定
```

#### 存取控制

**路由保護 (目前缺失 ⚠️):**
```typescript
// /(admin)/* 路由缺少 Admin 檢查
// 需要添加 useUserRole 檢查以防止普通用戶訪問
```

---

## 🔧 需要實施的改進

### 問題 1：Admin 路由缺少權限檢查
- ❌ Admin 路由未檢查 `isAdmin` 權限
- ❌ 普通用戶可能能訪問 `/admin/*` 路由

### 問題 2：服務管理頁面基於 Mock 數據
- ✓ 開發環境可用（使用 mockData.ts）
- ❌ 生產環境需要連接後端 API
- ❌ 缺少後端 API 端點實現

### 問題 3：缺少使用者角色提升工具
- ❌ 沒有簡便的 UI 工具來管理使用者權限
- ⚠️ 需要手動 SQL 或 Supabase Dashboard

---

## ✨ 建議的完整實施方案

### 第一步：創建 Admin 帳號（立即做）

使用 Supabase Dashboard 或 SQL：
```sql
-- 查看所有用戶
SELECT id, email, role FROM public.users;

-- 將某個用戶升級為 admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 第二步：保護 Admin 路由（推薦實施）

在 `/(admin)` 佈局頁面添加權限檢查：
```typescript
// frontend/src/app/(admin)/layout.tsx
import { useUserRole } from '@/hooks/useUserRole';
import { redirect } from 'next/navigation';

export default function AdminLayout({ children }) {
  const { isAdmin, loading } = useUserRole();
  
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) redirect('/'); // 非 admin 重定向回首頁
  
  return children;
}
```

### 第三步：實施後端 API（生產環境必需）

在後端建立服務管理 API 端點：
```typescript
// backend/src/routes/admin/services.ts
GET    /api/admin/services          - 列表
POST   /api/admin/services          - 新增
PUT    /api/admin/services/:id      - 編輯
DELETE /api/admin/services/:id      - 刪除
```

### 第四步：連接前端到後端 API

修改 `/(admin)/settings/services/page.tsx` 以呼叫真實 API：
```typescript
// 從 mockData 改為 API 呼叫
const result = await api.get('/admin/services');
const result = await api.put(`/admin/services/${id}`, data);
```

---

## 📋 當前系統檢查清單

### 前端
- ✅ 權限系統已實現 (useUserRole.ts)
- ✅ Admin 管理頁面已實現
- ✅ 服務編輯 UI 已實現
- ❌ Admin 路由保護缺失
- ⚠️ 目前使用 Mock 數據

### 後端
- ✅ RLS 安全策略已配置
- ✅ Admin 中間件已實現
- ⚠️ Admin 服務 API 端點未實現
- ❌ 服務管理 API 缺失

### 資料庫
- ✅ users 表有 role 欄位
- ✅ external_services 表已建立
- ✅ app_settings 表已建立
- ✅ RLS 策略已配置

---

## 🚀 立即行動方案

### 最簡單的完整流程（不需編程）：

1. **建立 Admin 帳號**
   - 登入 Supabase Dashboard
   - 編輯您的帳號，添加 `role: "admin"`
   - 重新登入前端

2. **測試 Admin 功能**
   - 訪問 `https://localhost:3000/(admin)/settings/services`
   - 編輯服務名稱、URL 等
   - 查看變更

3. **（可選）保護 Admin 路由**
   - 實施路由檢查以防止未授權訪問

---

## 📝 下一步建議順序

1. ✅ **立即：** 創建 Admin 帳號（5 分鐘）
2. ✅ **推薦：** 保護 Admin 路由（15 分鐘）
3. ⏳ **重要：** 實施後端 API 端點（1-2 小時）
4. ⏳ **遷移：** 前端從 Mock 切換到 API（30 分鐘）
5. ⏳ **增強：** 添加 Admin 使用者管理 UI（1 小時）
