'use client';

import { Bell, Menu, Moon, Sun, User, ChevronDown, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [notificationCount] = useState(3); // 暫時寫死，之後接 API
  const { user, signOut, loading } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // 檢查系統主題
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  // 切換主題
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <motion.header
      initial={false}
      animate={{ 
        marginLeft: sidebarOpen ? 240 : 72,
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'fixed top-0 right-0 z-30',
        'h-16 bg-background/80 backdrop-blur-md',
        'border-b border-border',
        'flex items-center justify-between px-4'
      )}
      style={{ left: 0 }}
    >
      {/* 左側：漢堡選單 + 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <h1 className="text-lg font-semibold hidden md:block">
          歡迎使用 <span className="text-gold-gradient">發財B平台</span>
        </h1>
      </div>

      {/* 右側：功能按鈕 */}
      <div className="flex items-center gap-2">
        {/* 主題切換 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.div>
        </Button>

        {/* 通知鈴鐺 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'w-5 h-5 rounded-full',
                'bg-destructive text-white',
                'text-xs font-bold',
                'flex items-center justify-center'
              )}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </motion.span>
          )}
        </Button>

        {/* 使用者頭像與下拉選單 */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setAvatarMenuOpen(v => !v)}>
            <div className={cn(
              'w-8 h-8 rounded-full',
              'bg-linear-to-br from-primary-400 to-primary-600',
              'flex items-center justify-center',
              'text-white font-semibold'
            )}>
              <User className="w-4 h-4" />
            </div>
            <ChevronDown className="ml-1 w-4 h-4 text-muted-foreground" />
          </Button>
          {avatarMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
              <div className="px-4 py-3 border-b border-border">
                <div className="font-semibold truncate">{profile?.name || profile?.company_name || user?.user_metadata?.shop_name || '車行名稱'}</div>
                <div className="hidden sm:block text-xs text-muted-foreground text-ellipsis overflow-hidden">{user?.email || 'user@example.com'}</div>
              </div>
              <button
                className="flex items-center gap-2 w-full px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors"
                onClick={async () => { setAvatarMenuOpen(false); await signOut(); }}
                disabled={loading}
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
