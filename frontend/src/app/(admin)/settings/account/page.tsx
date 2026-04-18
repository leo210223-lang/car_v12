'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

/**
 * Admin 帳號管理頁面
 * 顯示當前用戶信息和 Admin 提示
 */
export default function AdminAccountPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.user_metadata?.role === 'admin' || 
                  user?.app_metadata?.role === 'admin';

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      toast.success('已複製到剪貼板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopySetupGuide = () => {
    const guide = `升級 ${user?.email} 為 Admin：

1. 進入 Supabase Dashboard
2. Authentication → Users
3. 找到 ${user?.email}，點擊編輯
4. 在 User metadata 中添加：
{
  "role": "admin"
}
5. 點擊 Save
6. 重新登入應用`;
    
    navigator.clipboard.writeText(guide);
    toast.success('已複製設置步驟');
  };

  return (
    <div className="space-y-6 p-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">帳號設定</h1>
        <p className="mt-2 text-muted-foreground">管理您的帳號和權限設定</p>
      </div>

      {/* 當前帳號資訊 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <h2 className="mb-4 text-xl font-semibold text-foreground">帳號資訊</h2>
        
        <div className="space-y-4">
          {/* 電子郵件 */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              電子郵件
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyEmail}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 帳號 ID */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              帳號 ID
            </label>
            <Input
              type="text"
              value={user?.id || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* 帳號建立時間 */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              建立時間
            </label>
            <Input
              type="text"
              value={user?.created_at ? new Date(user.created_at).toLocaleString() : ''}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </motion.div>

      {/* 權限狀態 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-lg border p-6 ${
          isAdmin
            ? 'border-green-300 bg-green-50'
            : 'border-amber-300 bg-amber-50'
        }`}
      >
        <div className="flex items-start gap-3">
          <Shield className={`h-5 w-5 mt-0.5 shrink-0 ${
            isAdmin ? 'text-green-600' : 'text-amber-600'
          }`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${
              isAdmin ? 'text-green-900' : 'text-amber-900'
            }`}>
              {isAdmin ? '✅ 您已是 Admin' : '⚠️ 您不是 Admin'}
            </h3>
            <p className={`text-sm mt-1 ${
              isAdmin ? 'text-green-700' : 'text-amber-700'
            }`}>
              {isAdmin 
                ? '您擁有管理員權限，可以編輯系統設定。'
                : '您目前是普通用戶，無法訪問管理頁面。'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Admin 升級指南 */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border-2 border-dashed border-amber-300 bg-white p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            升級為 Admin
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                要升級此帳號為 Admin，請按以下步驟進行：
              </p>

              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>進入 <a 
                  href="https://app.supabase.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >Supabase Dashboard</a></li>
                <li>選擇您的專案，進入 <strong>Authentication</strong> → <strong>Users</strong></li>
                <li>搜尋此帳號：<code className="bg-muted px-2 py-1 rounded text-xs">{user?.email}</code></li>
                <li>點擊編輯按鈕</li>
                <li>在 <strong>User metadata</strong> 中添加：
                  <code className="block bg-muted p-2 rounded text-xs mt-1 whitespace-pre">
{`{
  "role": "admin"
}`}
                  </code>
                </li>
                <li>點擊 <strong>Save</strong> 按鈕</li>
                <li>返回應用並<strong>重新登入</strong></li>
              </ol>
            </div>

            <Button
              onClick={handleCopySetupGuide}
              variant="outline"
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              複製設置步驟
            </Button>
          </div>
        </motion.div>
      )}

      {/* 提示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-blue-200 bg-blue-50 p-4"
      >
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">💡 提示：</p>
            <p className="mt-1">升級後需要重新登入以使變更生效。請清除瀏覽器 cookies 或開啟無痕模式重新登入。</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
