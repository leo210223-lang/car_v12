'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Car, RefreshCw, MoreHorizontal, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Search;
}

/**
 * [v12] 在「尋車」左邊新增「看所有車」入口，簡單列表無照片
 */
const navItems: NavItem[] = [
  { label: '看所有車', href: '/all-cars', icon: List },
  { label: '尋車', href: '/find-car', icon: Search },
  { label: '我的車', href: '/my-cars', icon: Car },
  { label: '盤車', href: '/trade', icon: RefreshCw },
  { label: '更多', href: '/services', icon: MoreHorizontal },
];

/**
 * 底部導航列（User 用）
 */
export function BottomNav() {
  const pathname = usePathname();

  // 判斷是否為當前路由
  const isActive = (href: string) => {
    if (href === '/all-cars') {
      return pathname === '/all-cars' || pathname.startsWith('/all-cars/');
    }
    if (href === '/find-car') {
      return pathname === '/find-car' || pathname.startsWith('/find-car/');
    }
    if (href === '/my-cars') {
      return pathname === '/my-cars' || pathname.startsWith('/my-cars/');
    }
    if (href === '/trade') {
      return pathname === '/trade' || pathname.startsWith('/trade/');
    }
    if (href === '/services') {
      return pathname === '/services' || pathname === '/shop' || pathname === '/profile';
    }
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-pb">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-11 min-w-14 flex-col items-center justify-center gap-1 px-1.5 transition-colors',
                active ? 'text-primary-600' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* 活躍指示器 */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 h-1 w-8 rounded-full bg-primary-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* 圖示 */}
              <Icon className={cn('h-5 w-5', active && 'text-primary-500')} />

              {/* 文字 */}
              <span className={cn('text-[11px] font-medium whitespace-nowrap', active && 'text-primary-600')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
