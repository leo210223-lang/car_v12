'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Search, 
  FileText, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: '尋車', href: '/find-car', icon: Search },
  { label: '我的車', href: '/my-cars', icon: Car },
  { label: '盤車需求', href: '/trade', icon: FileText },
  { label: '通知', href: '/notifications', icon: Bell },
];

const adminNavItems: NavItem[] = [
  { label: '管理後台', href: '/dashboard', icon: LayoutDashboard, adminOnly: true },
  { label: '會員管理', href: '/admin/users', icon: Users, adminOnly: true },
  { label: '字典管理', href: '/admin/dictionary', icon: BookOpen, adminOnly: true },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useUserRole();

  const sidebarVariants = {
    open: { width: 240 },
    closed: { width: 72 },
  };

  const allNavItems = isAdmin 
    ? [...navItems, ...adminNavItems] 
    : navItems;

  return (
    <motion.aside
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-sidebar text-sidebar-foreground',
        'border-r border-sidebar-border',
        'flex flex-col'
      )}
    >
      {/* Logo 區域 */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">🚗</span>
              <span className="text-xl font-bold text-gold-gradient">發財B</span>
            </motion.div>
          ) : (
            <motion.span
              key="logo-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl mx-auto"
            >
              🚗
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* 導航列表 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    'hover:bg-sidebar-accent',
                    isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                    !isActive && 'text-sidebar-foreground',
                    !isOpen && 'justify-center'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin 分隔線 */}
        {isAdmin && isOpen && (
          <div className="px-4 py-2 mt-4">
            <div className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
              管理功能
            </div>
          </div>
        )}
      </nav>

      {/* 底部功能區 */}
      <div className="border-t border-sidebar-border p-2">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'transition-all duration-200',
            'hover:bg-sidebar-accent text-sidebar-foreground',
            !isOpen && 'justify-center'
          )}
        >
          <Settings className="w-5 h-5" />
          {isOpen && <span className="font-medium">個人資料</span>}
        </Link>
      </div>

      {/* 收合按鈕 */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-20',
          'w-6 h-6 rounded-full',
          'bg-sidebar-primary text-sidebar-primary-foreground',
          'flex items-center justify-center',
          'shadow-md hover:shadow-lg',
          'transition-all duration-200 hover:scale-110'
        )}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    </motion.aside>
  );
}

export default Sidebar;
