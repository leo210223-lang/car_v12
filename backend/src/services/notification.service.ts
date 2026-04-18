/**
 * FaCai-B Platform - Notification Service
 * File: backend/src/services/notification.service.ts
 * 
 * 通知系統業務邏輯
 */

import { supabaseAdmin } from '../config/supabase';
import { 
  Notification, 
  NotificationType,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface NotificationListResult {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface NotificationListQuery {
  cursor?: string;
  limit?: number;
  is_read?: boolean;
}

export interface SendNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Notification Service
// ============================================================================

export const notificationService = {
  /**
   * 取得用戶的通知列表
   */
  async list(
    userId: string,
    query: NotificationListQuery
  ): Promise<ServiceResult<NotificationListResult>> {
    try {
      const { cursor, limit = 20, is_read } = query;

      let queryBuilder = supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      // 游標分頁
      if (cursor) {
        const { data: cursorNotification } = await supabaseAdmin
          .from('notifications')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorNotification) {
          queryBuilder = queryBuilder.lt('created_at', cursorNotification.created_at);
        }
      }

      // 篩選已讀/未讀
      if (is_read !== undefined) {
        queryBuilder = queryBuilder.eq('is_read', is_read);
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[NotificationService] List error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 處理分頁
      const hasMore = data.length > limit;
      const notifications = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? notifications[notifications.length - 1]?.id : null;

      return {
        success: true,
        data: {
          notifications: notifications as Notification[],
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[NotificationService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得通知列表失敗' },
      };
    }
  },

  /**
   * 取得未讀通知數量
   */
  async getUnreadCount(
    userId: string
  ): Promise<ServiceResult<{ count: number }>> {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[NotificationService] GetUnreadCount error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return {
        success: true,
        data: { count: count ?? 0 },
      };
    } catch (err) {
      console.error('[NotificationService] GetUnreadCount exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得未讀數量失敗' },
      };
    }
  },

  /**
   * 標記單一通知為已讀
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<ServiceResult<Notification>> {
    try {
      // 先驗證通知屬於該用戶
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('notifications')
        .select('user_id, is_read')
        .eq('id', notificationId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該通知' },
        };
      }

      if (existing.user_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您無權操作此通知' },
        };
      }

      // 如果已經是已讀，直接返回
      if (existing.is_read) {
        const { data } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('id', notificationId)
          .single();
        
        return { success: true, data: data as Notification };
      }

      // 更新為已讀
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('[NotificationService] MarkAsRead error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Notification };
    } catch (err) {
      console.error('[NotificationService] MarkAsRead exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '標記已讀失敗' },
      };
    }
  },

  /**
   * 標記所有通知為已讀
   */
  async markAllAsRead(
    userId: string
  ): Promise<ServiceResult<{ updated: number }>> {
    try {
      // 先取得未讀數量
      const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!unreadCount || unreadCount === 0) {
        return {
          success: true,
          data: { updated: 0 },
        };
      }

      // 批次更新
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[NotificationService] MarkAllAsRead error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return {
        success: true,
        data: { updated: unreadCount },
      };
    } catch (err) {
      console.error('[NotificationService] MarkAllAsRead exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '批次標記已讀失敗' },
      };
    }
  },

  /**
   * 發送通知
   */
  async send(
    input: SendNotificationInput
  ): Promise<ServiceResult<Notification>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data ?? null,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[NotificationService] Send error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Notification };
    } catch (err) {
      console.error('[NotificationService] Send exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '發送通知失敗' },
      };
    }
  },

  /**
   * 批次發送通知（給多個用戶）
   */
  async sendBatch(
    inputs: SendNotificationInput[]
  ): Promise<ServiceResult<{ sent: number }>> {
    try {
      if (inputs.length === 0) {
        return { success: true, data: { sent: 0 } };
      }

      const records = inputs.map((input) => ({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? null,
        is_read: false,
      }));

      const { error } = await supabaseAdmin
        .from('notifications')
        .insert(records);

      if (error) {
        console.error('[NotificationService] SendBatch error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: { sent: inputs.length } };
    } catch (err) {
      console.error('[NotificationService] SendBatch exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '批次發送通知失敗' },
      };
    }
  },

  /**
   * 刪除通知（用戶自己刪除）
   */
  async delete(
    notificationId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      // 先驗證通知屬於該用戶
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('notifications')
        .select('user_id')
        .eq('id', notificationId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該通知' },
        };
      }

      if (existing.user_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您無權刪除此通知' },
        };
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[NotificationService] Delete error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true };
    } catch (err) {
      console.error('[NotificationService] Delete exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除通知失敗' },
      };
    }
  },
};

export default notificationService;
