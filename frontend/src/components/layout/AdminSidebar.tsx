'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardCheck,
  RefreshCw,
  Car,
  Users,
  BookOpen,
  Settings,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAdminManualRequests } from '@/hooks/useAdminManualRequests';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

/**
 * Admin 側邊導航欄
 *
 * [v12 新增] 代上傳申請
 * [v12.1 變更] 移除「營收紀錄」— 改為車行自己看，放在漢堡選單
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { data: pendingCount = 0 } = useSWR<number>(
    '/admin/dashboard/stats',
    async () => {
      const result = await api.get<{ pendingAuditCount: number }>('/admin/dashboard/stats');
      return result.success && result.data ? result.data.pendingAuditCount : 0;
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 60000,
    }
  );
  const safePendingCount = Number.isFinite(pendingCount) ? pendingCount : 0;

  // [v12] 代上傳申請 pending badge
  const { requests: pendingManualRequests } = useAdminManualRequests('pending');
  const pendingManualCount = pendingManualRequests.length;

  const navItems: NavItem[] = [
    { label: '平台概況', href: '/dashboard', icon: LayoutDashboard },
    { label: '車輛審核', href: '/audit', icon: ClipboardCheck, badge: safePendingCount },
    { label: '調做需求', href: '/trades', icon: RefreshCw },
    { label: '所有車輛', href: '/vehicles', icon: Car },
    { label: '代上傳申請', href: '/manual-requests', icon: HelpCircle, badge: pendingManualCount },
    { label: '會員管理', href: '/users', icon: Users },
    { label: '字典管理', href: '/dictionary', icon: BookOpen },
  ];

  const settingsItems: NavItem[] = [
    { label: '調整設定', href: '/settings/account', icon: Settings },
    { label: '調做發布', href: '/settings/services', icon: RefreshCw },
    { label: '更多服務', href: '/admin-services', icon: ShoppingBag },
    { label: '線上商城', href: '/admin-shop', icon: ShoppingBag },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside
      className={cn(
        'gold-texture cloud-pattern fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-amber-700/35 text-amber-950 shadow-[inset_-1px_0_0_rgba(120,70,8,0.35)] transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-full">
        <span className="font-calligraphy absolute left-8 top-1/3 text-[10rem] leading-none text-black/10">順</span>
      </div>

      {/* Logo 區塊 */}
      <div className="relative flex h-24 items-center justify-between border-b border-amber-900/25 px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-end gap-3">
            <div className="relative">
              <p className="font-calligraphy text-3xl font-semibold tracking-[0.2em] text-amber-950">儀表板</p>
              <span className="absolute -right-2 -top-1 h-5 w-5 rotate-6 rounded-[2px] border border-red-800/60 bg-red-700/35" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-900/70 transition-colors hover:bg-amber-100/45 hover:text-amber-950"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* 導航項目 */}
      <nav className="relative flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-black/80 text-amber-100 shadow-[inset_0_0_0_1px_rgba(255,225,150,0.28)]'
                      : 'text-amber-950/80 hover:bg-amber-100/45 hover:text-amber-950'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="adminSidebarIndicator"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-100"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  <Icon className={cn('h-5 w-5 shrink-0', active && 'text-amber-100')} />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-red-900/50 bg-red-700 px-1.5 text-xs font-bold text-amber-50">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {isCollapsed && item.badge && item.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-red-900/50 bg-red-700 px-1 text-[10px] font-bold text-amber-50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 設定分組 */}
        {!isCollapsed && (
          <div className="mt-6 space-y-2">
            <p className="font-calligraphy px-3 text-base font-semibold tracking-[0.2em] text-amber-900">設定</p>
            <ul className="space-y-1">
              {settingsItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-black/80 text-amber-100'
                          : 'text-amber-950/80 hover:bg-amber-100/45 hover:text-amber-950'
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="adminSidebarSettingsIndicator"
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-100"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}

                      <Icon className={cn('h-5 w-5 shrink-0', active && 'text-amber-100')} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* 底部登出按鈕 */}
      <div className="relative border-t border-amber-900/25 p-2">

        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-900/80 transition-colors hover:bg-red-100/45 hover:text-red-800',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? '登出' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>登出</span>}
        </button>
      </div>
    </aside>
  );
}
