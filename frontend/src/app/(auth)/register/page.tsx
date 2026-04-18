'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

// 註冊表單驗證 Schema
const registerSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string()
    .min(6, '密碼至少需要 6 個字元')
    .regex(/[A-Za-z]/, '密碼需包含至少一個英文字母')
    .regex(/[0-9]/, '密碼需包含至少一個數字'),
  confirmPassword: z.string().min(6, '請確認您的密碼'),
  shopName: z.string().min(2, '車行名稱至少需要 2 個字元'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入有效的手機號碼（09開頭，共10碼）'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '兩次輸入的密碼不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      shopName: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      const normalizedShopName = data.shopName.trim();
      const normalizedPhone = data.phone.trim();
      const result = await signUp(data.email, data.password, {
        name: normalizedShopName,
        company_name: normalizedShopName,
        shop_name: normalizedShopName,
        phone: normalizedPhone,
      });
      if (result.error) {
        // Supabase 常見錯誤訊息處理
        let msg = result.error.message || '註冊失敗，請稍後再試';
        if (msg.includes('User already registered')) {
          msg = '此信箱已被註冊，請直接登入或重設密碼';
        } else if (msg.includes('Password should be at least')) {
          msg = '密碼長度不足，請輸入 6 位以上密碼';
        } else if (msg.includes('Password')) {
          msg = '密碼格式不符，請確認包含英數字';
        }
        setError(msg);
        return;
      }

      // 註冊成功
      setSuccess(true);
    } catch {
      setError('註冊過程發生錯誤，請稍後再試');
    }
  };

  // 註冊成功畫面
  if (success) {
    // 自動跳轉到等待審核頁（2秒後）
    setTimeout(() => {
      router.push('/pending-approval?status=pending');
    }, 2000);

    return (
      <Card className="card-gold-border">
        <CardHeader>
          <CardTitle className="text-green-600">🎉 註冊成功！</CardTitle>
          <CardDescription>
            帳號已建立成功，接下來將進入人工審核流程。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          正在跳轉到等待審核頁面...
        </CardContent>
        <CardFooter>
          <Link href="/pending-approval?status=pending" className="w-full">
            <Button variant="outline" className="w-full">
              查看審核狀態
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="card-gold-border">
      <CardHeader>
        <CardTitle className="text-gold-gradient">註冊新帳號</CardTitle>
        <CardDescription>
          填寫以下資訊以建立您的車商帳號
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* 錯誤訊息 */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 車行名稱 */}
          <div className="space-y-2">
            <Label htmlFor="shopName">車行名稱</Label>
            <Input
              id="shopName"
              type="text"
              placeholder="例：發財汽車"
              {...register('shopName')}
              disabled={loading}
            />
            {errors.shopName && (
              <p className="text-sm text-red-500">{errors.shopName.message}</p>
            )}
          </div>

          {/* 手機號碼 */}
          <div className="space-y-2">
            <Label htmlFor="phone">手機號碼</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0912345678"
              {...register('phone')}
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Email 欄位 */}
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* 密碼欄位 */}
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少 6 個字元，包含英文和數字"
              autoComplete="new-password"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* 確認密碼 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">確認密碼</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="再次輸入密碼"
              autoComplete="new-password"
              {...register('confirmPassword')}
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full btn-gold" disabled={loading}>
            {loading ? '註冊中...' : '註冊'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            已有帳號？{' '}
            <Link href="/login" className="text-gold-dark font-medium hover:underline">
              立即登入
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
