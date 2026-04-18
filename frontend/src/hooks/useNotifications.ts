'use client';

import useSWR from 'swr';
import { api, ApiResponse } from '@/lib/api';

export interface Notification {
  id: string;
  user_id: string;
  type: 'vehicle_approved' | 'vehicle_rejected' | 'trade_expiring' | 'account_suspended' | 'account_reactivated' | 'dictionary_approved' | 'dictionary_rejected';
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

interface UnreadCountData {
  count: number;
}

// SWR Fetcher
const notificationsFetcher = async (url: string) => {
  const response = await api.get<Notification[]>(url);
  return response;
};

const unreadCountFetcher = async (url: string) => {
  const response = await api.get<UnreadCountData>(url);
  return response;
};

/**
 * 通知管理 Hook
 */
export function useNotifications() {
  // 獲取通知列表
  const { 
    data: notificationsResponse, 
    error: notificationsError,
    mutate: mutateNotifications
  } = useSWR<ApiResponse<Notification[]>>(
    '/notifications',
    notificationsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 秒內不重複請求
    }
  );

  // 獲取未讀計數
  const { 
    data: unreadResponse, 
    error: unreadError,
    mutate: mutateUnreadCount
  } = useSWR<ApiResponse<UnreadCountData>>(
    '/notifications/unread-count',
    unreadCountFetcher,
    {
      refreshInterval: 60000, // 每分鐘自動刷新
      revalidateOnFocus: true,
    }
  );

  // 標記單則通知為已讀
  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // 更新本地狀態
      mutateNotifications();
      mutateUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  // 標記全部為已讀
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      // 更新本地狀態
      mutateNotifications();
      mutateUnreadCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };

  return {
    notifications: notificationsResponse?.data ?? [],
    unreadCount: unreadResponse?.data?.count ?? 0,
    isLoading: !notificationsResponse && !notificationsError,
    isError: !!notificationsError || !!unreadError,
    markAsRead,
    markAllAsRead,
    refresh: () => {
      mutateNotifications();
      mutateUnreadCount();
    },
  };
}
