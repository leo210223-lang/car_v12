import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 更新 Supabase Session
 * 用於在 Middleware 中刷新認證 Token
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 檢查 Supabase 是否已設定
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
    // Supabase 未設定，返回空 user（開發模式用）
    return { supabaseResponse, user: null };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 重要：不要在 createServerClient 和 supabase.auth.getUser() 之間寫入任何邏輯
  // 簡單的錯誤可能導致使用者被隨機登出
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
