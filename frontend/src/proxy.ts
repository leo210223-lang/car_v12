import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 公開路由（不需登入即可訪問）
const publicRoutes = ['/login', '/register', '/forgot-password'];

// Admin 專屬路由（需 admin 角色才可訪問）
const adminRoutes = ['/dashboard', '/admin', '/audit', '/vehicles', '/users', '/dictionary'];

// 認證回調路由
const authCallbackRoutes = ['/auth/callback'];

// 開發模式：允許繞過認證的路由（僅在開發環境生效）
const devBypassRoutes = ['/find-car', '/my-cars', '/profile', '/trade', '/services', '/shop'];

// 開發模式：Admin 路由也允許繞過
const devAdminBypassRoutes = ['/dashboard', '/audit', '/vehicles', '/users', '/dictionary', '/admin'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔧 開發模式繞過：當 Supabase 未設定時，允許直接訪問特定路由
  const isDev = process.env.NODE_ENV === 'development';
  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here';
  
  if (isDev && !isSupabaseConfigured) {
    const isDevBypass = devBypassRoutes.some(route => pathname.startsWith(route));
    const isDevAdminBypass = devAdminBypassRoutes.some(route => pathname.startsWith(route));
    if (isDevBypass || isDevAdminBypass) {
      return NextResponse.next();
    }
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (authCallbackRoutes.some(route => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return supabaseResponse;
  }

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (!user) {
    if (isPublicRoute) {
      return supabaseResponse;
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute) {
    return NextResponse.redirect(new URL('/find-car', request.url));
  }

  if (isAdminRoute) {
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/find-car', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，但排除：
     * - _next/static (靜態文件)
     * - _next/image (圖片優化)
     * - favicon.ico (網站圖示)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
