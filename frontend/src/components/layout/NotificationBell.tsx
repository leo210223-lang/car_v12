'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

/**
 * 通知類型對應的圖示與顏色
 */
const notificationStyles: Record<string, { emoji: string; bgColor: string }> = {
  vehicle_approved: { emoji: '✅', bgColor: 'bg-green-100' },
  vehicle_rejected: { emoji: '❌', bgColor: 'bg-red-100' },
  trade_expiring: { emoji: '⏰', bgColor: 'bg-yellow-100' },
  account_suspended: { emoji: '🚫', bgColor: 'bg-red-100' },
  account_reactivated: { emoji: '🎉', bgColor: 'bg-green-100' },
  dictionary_approved: { emoji: '📝', bgColor: 'bg-blue-100' },
  dictionary_rejected: { emoji: '📝', bgColor: 'bg-red-100' },
};

/**
 * 格式化時間
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-TW');
}

/**
 * 通知鈴鐺元件
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="relative">
      {/* 鈴鐺按鈕 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        
        {/* 未讀計數 */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -right-1 -top-1',
              'flex h-5 w-5 items-center justify-center',
              'rounded-full bg-destructive text-xs font-bold text-white'
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      {/* 通知面板 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 面板 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 top-full z-50 mt-2',
                'w-80 max-h-[70vh] overflow-hidden',
                'rounded-xl border border-amber-800/30 bg-amber-50 shadow-xl'
              )}
            >
              {/* 標題列 */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="font-semibold text-foreground">通知</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await markAllAsRead();
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    全部已讀
                  </Button>
                )}
              </div>

              {/* 通知列表 */}
              <div className="max-h-[50vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    暫無通知
                  </div>
                ) : (
                  <ul>
                    {notifications.slice(0, 10).map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={() => markAsRead(notification.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* 查看全部 */}
              {notifications.length > 0 && (
                <div className="border-t border-border p-2">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-primary-600"
                    onClick={() => setIsOpen(false)}
                  >
                    查看全部通知
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 單則通知項目
 */
function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const style = notificationStyles[notification.type] || { emoji: '📣', bgColor: 'bg-gray-100' };

  return (
    <li
      className={cn(
        'flex gap-3 px-4 py-3 transition-colors hover:bg-muted cursor-pointer',
        !notification.is_read && 'bg-primary-50/50'
      )}
      onClick={onRead}
    >
      {/* 圖示 */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', style.bgColor)}>
        <span className="text-lg">{style.emoji}</span>
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.is_read && 'font-semibold')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>

      {/* 未讀指示器 */}
      {!notification.is_read && (
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-primary-500" />
        </div>
      )}
    </li>
  );
}
