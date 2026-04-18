'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, Loader2, LogOut, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { mutateUserProfileCache, useUserProfile } from '@/hooks/useUserProfile';
import { useMyCredits } from '@/hooks/useCredits';
import api from '@/lib/api';
import { toast } from 'sonner';

/**
 * 個人資料頁面
 *
 * [v12] 顯示點數（唯讀，僅管理員可調整）
 */
export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const { profile, loading: profileLoading, error, refetch } = useUserProfile(user?.id);
  const { credits, isLoading: creditsLoading } = useMyCredits();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });

  // 當 profile 載入時同步 formData
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        company_name: profile?.company_name ?? undefined,
      };

      const response = await api.put('/users/profile', payload, { cache: 'no-store' });
      if (!response.success) {
        toast.error(response.message || '更新失敗，請稍後再試');
        return;
      }

      await mutateUserProfileCache();
      await refetch();
      toast.success('資料已更新');
      setIsEditing(false);
    } catch (error) {
      console.error('[ProfilePage] Update profile failed:', error);
      toast.error('更新失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return <div className="text-center py-10 text-muted-foreground">載入中...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* 標題列 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">個人資料</h1>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            編輯
          </Button>
        ) : (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            儲存
          </Button>
        )}
      </div>

      {/* 用戶頭像 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100">
          <User className="h-12 w-12 text-primary-600" />
        </div>
        <p className="mt-3 font-semibold text-foreground">{formData.name || '會員名稱'}</p>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
      </div>

      {/* [v12] 點數卡片 */}
      <div className="mb-6 rounded-xl border border-amber-300 bg-linear-to-br from-amber-50 to-yellow-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/90 shadow-md">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-900/80">我的點數</p>
              <p className="text-2xl font-bold text-amber-900">
                {creditsLoading ? '...' : credits.toLocaleString('zh-TW')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-amber-900/60">如需加值</p>
            <p className="text-[11px] text-amber-900/60">請聯絡管理員</p>
          </div>
        </div>
      </div>

      {/* 表單 */}
      <div className="space-y-4">
        {/* 會員名稱 */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            會員名稱
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            placeholder="請輸入會員名稱"
          />
        </div>
        {/* 電話 */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            聯絡電話
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            placeholder="請輸入聯絡電話"
          />
        </div>
        {/* Email（不可編輯） */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            電子郵件
          </Label>
          <Input
            id="email"
            value={profile?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">電子郵件無法更改</p>
        </div>
      </div>
      {/* 登出按鈕 */}
      <div className="mt-10 flex justify-center">
        <Button
          variant="destructive"
          onClick={signOut}
          disabled={loading}
          className="w-40 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          登出
        </Button>
      </div>
    </div>
  );
}
