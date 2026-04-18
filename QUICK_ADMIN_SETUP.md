# Admin 權限設置完整指南

## 🎯 三個核心要點已完全釐清

### ✅ 1. 系統有分 Admin 和 User 權限

**現狀：**
- ✅ 前端有 `useUserRole()` Hook，支持 `admin` 和 `user` 角色
- ✅ 後端有 RLS (Row Level Security) 安全策略
- ✅ Admin 路由現已強化，非 Admin 用戶會被重定向到首頁

**權限檢查位置：**
```typescript
// 前端：frontend/src/hooks/useUserRole.ts
const { isAdmin, isUser, role } = useUserRole();

// 路由保護：frontend/src/app/(admin)/layout.tsx
if (!isAdmin) router.replace('/find-car');
```

---

### ⚠️ 2. 您需要一個 Admin 帳號

**三種建立方式（選一種）：**

#### 方式 A：使用 Supabase Dashboard（最簡單）⭐ 推薦

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇您的專案
3. 進入 **Authentication** → **Users**
4. 找到您的帳號，點擊編輯按鈕
5. 展開 **User metadata**
6. 添加以下 JSON：
   ```json
   {
     "role": "admin"
   }
   ```
7. 點擊 **Save** 按鈕
8. **重新登入前端應用**（清除 cookies 或重新登入）

---

#### 方式 B：使用我們提供的腳本

**步驟 1：安裝依賴**
```bash
cd backend
npm install --save-dev @supabase/supabase-js dotenv
```

**步驟 2：檢查環境變數**
確保 `backend/.env.local` 包含：
```env
SUPABASE_URL=你的_supabase_url
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

**步驟 3：運行腳本**
```bash
node scripts/promote-to-admin.js your-email@example.com
```

或交互模式：
```bash
node scripts/promote-to-admin.js
```

**步驟 4：重新登入**
返回前端應用並重新登入

---

#### 方式 C：直接 SQL 查詢

1. 進入 Supabase Dashboard → **SQL Editor**
2. 執行查詢檢視所有用戶：
   ```sql
   SELECT id, email, raw_user_meta_data FROM auth.users;
   ```
3. 找到您的帳號，並執行：
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = 
     jsonb_set(
       COALESCE(raw_user_meta_data, '{}'::jsonb),
       '{role}',
       '"admin"'::jsonb
     )
   WHERE email = 'your-email@example.com';
   ```
4. 驗證：
   ```sql
   SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'your-email@example.com';
   ```

---

### ✅ 3. Admin 可以簡單編輯"更多服務"頁面

**已實現的功能：**

頁面位置：`/(admin)/settings/services`

**可編輯項目：**
- 🎮 **娛樂城** - 修改網址、描述
- 🌸 **紓壓專區** - 修改網址、描述  
- 😊 **舒服專區** - 修改網址、描述
- 🛍️ **線上商城** - 描述可編輯（網址固定為 `/shop`）

**操作流程：**
1. 以 Admin 身份登入
2. 進入側邊欄 **設定** → **更多服務**
3. 點擊任一服務的 **編輯** 按鈕
4. 修改 **網址** 或 **描述**
5. 點擊 **保存** 按鈕

**還可以：**
- 修改客服電話
- （未來）啟用/停用服務
- （未來）調整服務排序

---

## 🚀 快速開始（只需 5 分鐘）

### 步驟 1：建立 Admin 帳號（選一種方式）

**最快方式 - Supabase Dashboard：**
1. 登入 Supabase Dashboard
2. 編輯您的帳號，添加 `"role": "admin"`
3. 點擊保存

### 步驟 2：重新登入應用

- 清除瀏覽器 cookies 或開啟無痕模式
- 重新登入前端應用

### 步驟 3：驗證 Admin 權限

- 訪問 `http://localhost:3000/(admin)/dashboard`
- 如果看到 Admin 側邊欄，表示成功 ✅

### 步驟 4：編輯服務

- 點擊側邊欄 **設定** → **更多服務**
- 點擊服務卡片的 **編輯** 按鈕
- 修改網址或描述，然後保存

---

## 📋 系統權限架構詳解

### 權限檢查流程

```
用戶訪問 → 檢查 useUserRole() → 檢查 isAdmin
   ↓
是 → 顯示 Admin 頁面
   ↓
否 → 重定向到首頁
```

### 前端權限檢查

```typescript
// hooks/useUserRole.ts - 自動檢查角色
const { isAdmin, isUser, role } = useUserRole();
// role: 'admin' | 'user' | null

// app/(admin)/layout.tsx - 路由保護
useEffect(() => {
  if (!loading && !isAdmin) {
    router.replace('/find-car'); // 非 admin 重定向
  }
}, [isAdmin, loading, router]);
```

### 後端權限檢查

```typescript
// middleware/admin.ts - API 保護
export const adminOnly = (req, res, next) => {
  const role = req.user.app_metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: '需要 Admin 權限' });
  }
  next();
};
```

---

## 🔐 安全性

### 已實施的安全措施

✅ **前端路由保護** - 非 Admin 無法訪問 `/admin/*` 路由  
✅ **JWT Token 驗證** - 所有 API 請求需要有效的 JWT  
✅ **RLS 資料庫策略** - 資料庫層面強制權限檢查  
✅ **環境變數** - 敏感資訊不公開

### 最佳實踐

1. **使用強密碼** - Admin 帳號使用複雜密碼
2. **定期備份** - 備份管理頁面的重要設置
3. **監控日誌** - 檢查管理操作日誌（如有）
4. **限制存取** - 只授權必要人員 Admin 權限

---

## 🐛 常見問題

### Q1：升級後還是看不到 Admin 功能？

**A：** 需要重新登入！
- 清除瀏覽器 cookies
- 或在無痕模式下重新登入
- 或執行 `localStorage.clear()` 在瀏覽器控制台

### Q2：升級腳本出錯，說找不到環境變數？

**A：** 檢查 `backend/.env.local` 是否存在正確的環境變數：
```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Q3：我編輯服務後，更新沒有生效？

**A：** 目前使用 Mock 數據（開發模式）。
- 重新整理頁面查看更新
- 資料存儲在瀏覽器 localStorage
- 重新整理後重置為預設值

### Q4：如何移除某人的 Admin 權限？

**A：** 進入 Supabase Dashboard，編輯用戶 metadata，移除或改為 `"role": "user"`

---

## 📈 下一步優化建議

### 優先級：高 🔴

1. **實施後端服務 API**
   - 目前使用 Mock 數據
   - 需要在 `backend/src/routes/admin/services.ts` 實施
   - 這樣編輯會永久保存

2. **添加管理員管理頁面**
   - 允許 Admin 提升其他用戶為 Admin
   - UI 介面，無需 SQL

### 優先級：中 🟡

1. **添加操作日誌**
   - 記錄所有 Admin 的修改操作
   - 用於審計和回溯

2. **備份和還原功能**
   - 服務配置的備份
   - 快速還原到之前版本

### 優先級：低 🟢

1. **多語言支持**
   - 服務描述支持多個語言
   
2. **服務預覽**
   - Admin 編輯前預覽實際效果

---

## 📞 支援

如果遇到問題：
1. 檢查 `ADMIN_PERMISSION_GUIDE.md` 的故障排除部分
2. 查看瀏覽器控制台錯誤信息
3. 檢查 Supabase Dashboard 的日誌

---

**最後更新：2026年3月24日**
