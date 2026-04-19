import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { createClient } from '@/lib/supabase/server';

interface UserLayoutProps {
  children: ReactNode;
}

/**
 * User 佈局 - 包含頂部導航列與底部導航
 */
export default async function UserLayout({ children }: UserLayoutProps) {
  async function enforceUserAccess() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const role = user.user_metadata?.role || user.app_metadata?.role;
    if (role === 'admin') {
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    const status = profile?.status as 'active' | 'pending' | 'rejected' | 'suspended' | undefined;
    if (status !== 'active') {
      redirect(`/pending-approval?status=${status || 'pending'}`);
    }
  }

  // Server-side route guard: block non-active users from user area.
  await enforceUserAccess();

  return (
    <div className="gold-texture cloud-pattern min-h-screen">
      {/* 頂部導航列 */}
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-amber-800/30 bg-white pt-[env(safe-area-inset-top)] shadow-sm">
        <div className="relative z-40 mx-auto flex h-16 w-full max-w-lg items-center justify-between gap-2 px-4">
          {/* 左側：Logo */}
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-md px-2 py-1">
              <span className="font-calligraphy block truncate text-xl font-bold text-amber-900">發財B</span>
            </div>
          </div>

          {/* 右側：通知 + 選單 */}
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="min-h-[calc(100vh-4rem)] pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* 底部導航列 */}
      <BottomNav />
    </div>
  );
}
