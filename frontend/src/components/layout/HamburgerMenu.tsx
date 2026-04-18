'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, LogOut, MoreVertical, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  href?: string;
  icon: typeof User;
  onClick?: () => void;
  destructive?: boolean;
}

/**
 * 漢堡選單元件
 */
export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { profile } = useUserProfile(user?.id);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const menuItems: MenuItem[] = [
    { label: '個人資料', href: '/profile', icon: User },
    { label: '更多服務', href: '/services', icon: MoreVertical },
    { label: '登出', icon: LogOut, onClick: handleSignOut, destructive: true },
  ];

  return (
    <div className="relative">
      {/* 漢堡按鈕 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* 選單面板 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setIsOpen(false)}
            />

            {/* 側邊面板 */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className={cn(
                'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]'
              )}
            >
              {/* 用戶資訊 */}
              <div className="border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {profile?.name || profile?.company_name || user?.user_metadata?.shop_name || '車行名稱'}
                    </p>
                    <p className="hidden sm:block text-xs text-muted-foreground text-ellipsis overflow-hidden">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 選單項目 */}
              <nav className="p-1.5">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  
                  if (item.href) {
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2',
                          'text-foreground hover:bg-muted transition-colors'
                        )}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={index}
                      onClick={item.onClick}
                      disabled={loading}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2',
                        'transition-colors',
                        item.destructive
                          ? 'text-destructive hover:bg-destructive/10'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', item.destructive ? 'text-destructive' : 'text-muted-foreground')} />
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* 底部版本資訊 */}
              <div className="border-t border-border px-3 py-2">
                <p className="text-center text-[11px] text-muted-foreground">
                  發財B平台 v1.0.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
