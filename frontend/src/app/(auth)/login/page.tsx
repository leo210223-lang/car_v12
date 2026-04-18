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
import { getSupabaseClient } from '@/lib/supabase/client';

// 登入表單驗證 Schema
const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string().min(6, '密碼至少需要 6 個字元'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        // Supabase 常見錯誤訊息處理
        let msg = result.error.message || '登入失敗，請檢查您的帳號密碼';
        if (msg.includes('Invalid login credentials')) {
          msg = '帳號或密碼錯誤，請重新輸入';
        } else if (msg.includes('Email not confirmed')) {
          msg = '您的信箱尚未驗證，請先完成信箱驗證';
        } else if (msg.includes('User is not allowed to sign in')) {
          msg = '此帳號已被停權或禁止登入';
        }
        setError(msg);
        return;
      }

      // 根據角色重定向
      const userRole = result.data?.user?.user_metadata?.role;
      if (userRole === 'admin') {
        router.push('/dashboard');
      } else {
        const supabase = getSupabaseClient();
        const userId = result.data?.user?.id;

        if (userId) {
          const { data: profile } = await supabase
            .from('users')
            .select('status')
            .eq('id', userId)
            .single();

          const status = profile?.status as 'active' | 'pending' | 'rejected' | 'suspended' | undefined;
          if (status !== 'active') {
            router.push(`/pending-approval?status=${status || 'pending'}`);
            return;
          }
        }

        router.push('/all-cars');
      }
    } catch {
      setError('登入過程發生錯誤，請稍後再試');
    }
  };

  return (
    <Card className="card-gold-border">
      <CardHeader>
        <CardTitle className="text-gold-gradient">登入</CardTitle>
        <CardDescription>
          輸入您的帳號密碼以登入平台
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
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full btn-gold" disabled={loading}>
            {loading ? '登入中...' : '登入'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            還沒有帳號？{' '}
            <Link href="/register" className="text-gold-dark font-medium hover:underline">
              立即註冊
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
