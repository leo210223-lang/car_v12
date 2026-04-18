'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Admin 後台佈局
 * 僅限 Admin 角色存取
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAdmin, loading } = useUserRole();

  // 權限檢查 - 非 Admin 重定向
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/find-car');
    }
  }, [isAdmin, loading, router]);

  // 載入中狀態
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
          <span className="text-sm text-muted-foreground">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gold-texture cloud-pattern relative flex min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <span className="font-calligraphy absolute -bottom-[3vw] -left-[6vw] text-[44vw] leading-none text-amber-900/10">
          順
        </span>
      </div>
      {/* 側邊導航 */}
      <AdminSidebar />

      {/* 主內容區 */}
      <main className="gold-texture cloud-pattern relative z-10 ml-64 flex-1 p-6 transition-all duration-300">
        <span className="font-calligraphy pointer-events-none absolute right-8 top-4 text-[9rem] leading-none text-amber-900/10">順</span>
        {/* 頂部區域可放置麵包屑或其他元素 */}
        {children}
      </main>
    </div>
  );
}
