/**
 * FaCai-B Platform - User Service
 * File: backend/src/services/user.service.ts
 * 
 * 會員管理業務邏輯（Admin 專用）
 */

import { supabaseAdmin } from '../config/supabase';
import { User, UserStatus } from '../types';
import { notificationService } from './notification.service';

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserDetail extends User {
  vehicle_count: number;
  trade_count: number;
}

export interface UserListResult {
  users: UserDetail[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface UserListQuery {
  cursor?: string;
  limit?: number;
  status?: UserStatus;
  status_group?: 'suspended_rejected';
  search?: string;
}

export interface SuspendUserInput {
  reason: string;
}

// ============================================================================
// User Service
// ============================================================================

export const userService = {
  /**
   * 取得會員列表（Admin）
   */
  async list(
    query: UserListQuery
  ): Promise<ServiceResult<UserListResult>> {
    try {
      const { cursor, limit = 20, status, status_group, search } = query;

      let queryBuilder = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      // 游標分頁
      if (cursor) {
        const { data: cursorUser } = await supabaseAdmin
          .from('users')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorUser) {
          queryBuilder = queryBuilder.lt('created_at', cursorUser.created_at);
        }
      }

      // 狀態篩選
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }
      if (status_group === 'suspended_rejected') {
        queryBuilder = queryBuilder.in('status', ['suspended', 'rejected']);
      }

      // 搜尋（公司名稱或 Email）
      if (search) {
        queryBuilder = queryBuilder.or(
          `company_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[UserService] List error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 處理分頁
      const hasMore = data.length > limit;
      const users = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? users[users.length - 1]?.id : null;

      // 取得每位會員的車輛數與調做數
      const userIds = users.map((u) => u.id);

      const [vehicleCounts, tradeCounts] = await Promise.all([
        this.getVehicleCounts(userIds),
        this.getTradeCounts(userIds),
      ]);

      const usersWithCounts: UserDetail[] = users.map((u) => ({
        ...u,
        vehicle_count: vehicleCounts[u.id] || 0,
        trade_count: tradeCounts[u.id] || 0,
      }));

      return {
        success: true,
        data: {
          users: usersWithCounts,
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[UserService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得會員列表失敗' },
      };
    }
  },

  /**
   * 取得會員詳情（Admin）
   */
  async getById(
    userId: string
  ): Promise<ServiceResult<UserDetail>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該會員' },
          };
        }
        console.error('[UserService] GetById error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 取得車輛數與調做數
      const [vehicleCounts, tradeCounts] = await Promise.all([
        this.getVehicleCounts([userId]),
        this.getTradeCounts([userId]),
      ]);

      const userDetail: UserDetail = {
        ...data,
        vehicle_count: vehicleCounts[userId] || 0,
        trade_count: tradeCounts[userId] || 0,
      };

      return { success: true, data: userDetail };
    } catch (err) {
      console.error('[UserService] GetById exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得會員詳情失敗' },
      };
    }
  },

  /**
   * 核准會員註冊（pending -> active）
   */
  async approve(
    userId: string,
    adminId: string
  ): Promise<ServiceResult<User>> {
    try {
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該會員' },
        };
      }

      if (existingUser.status !== 'pending') {
        return {
          success: false,
          error: { code: 'INVALID_STATUS', message: '僅能核准待審核會員' },
        };
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status: 'active' as UserStatus,
          suspended_at: null,
          suspended_reason: null,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      await supabaseAdmin.from('audit_logs').insert({
        user_id: adminId,
        action: 'USER_REACTIVATED',
        target_type: 'user',
        target_id: userId,
        details: { from_status: 'pending', to_status: 'active' },
      });

      return { success: true, data: updatedUser as User };
    } catch (err) {
      console.error('[UserService] Approve exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '核准會員失敗' },
      };
    }
  },

  /**
   * 退件會員註冊（pending -> rejected）
   */
  async reject(
    userId: string,
    adminId: string,
    reason?: string
  ): Promise<ServiceResult<User>> {
    try {
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該會員' },
        };
      }

      if (existingUser.status !== 'pending') {
        return {
          success: false,
          error: { code: 'INVALID_STATUS', message: '僅能退件待審核會員' },
        };
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status: 'rejected' as UserStatus,
          suspended_at: new Date().toISOString(),
          suspended_reason: reason ?? '管理員退件',
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      await supabaseAdmin.from('audit_logs').insert({
        user_id: adminId,
        action: 'USER_SUSPENDED',
        target_type: 'user',
        target_id: userId,
        details: { from_status: 'pending', to_status: 'rejected', reason: reason ?? null },
      });

      return { success: true, data: updatedUser as User };
    } catch (err) {
      console.error('[UserService] Reject exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '退件會員失敗' },
      };
    }
  },

  /**
   * 停權會員（Admin）
   */
  async suspend(
    userId: string,
    adminId: string,
    input: SuspendUserInput
  ): Promise<ServiceResult<User>> {
    try {
      // 檢查會員是否存在
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該會員' },
        };
      }

      if (existingUser.status === 'suspended') {
        return {
          success: false,
          error: { code: 'ALREADY_SUSPENDED', message: '該會員已經是停權狀態' },
        };
      }

      // 更新會員狀態
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status: 'suspended' as UserStatus,
          suspended_at: new Date().toISOString(),
          suspended_reason: input.reason,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('[UserService] Suspend error:', updateError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      // 停權連帶處理：將會員的已核准車輛設為 archived
      await supabaseAdmin
        .from('vehicles')
        .update({
          status: 'archived',
          previous_status: 'approved', // 記錄先前狀態以便解除停權時恢復
        })
        .eq('owner_dealer_id', userId)
        .eq('status', 'approved');

      // 停用該會員的所有調做
      await supabaseAdmin
        .from('trade_requests')
        .update({ is_active: false })
        .eq('dealer_id', userId)
        .eq('is_active', true);

      // 發送停權通知
      await notificationService.send({
        user_id: userId,
        type: 'account_suspended',
        title: '帳號已被停權',
        message: `您的帳號已被停權，原因：${input.reason}`,
        data: {
          admin_id: adminId,
          reason: input.reason,
          suspended_at: new Date().toISOString(),
        },
      });

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'USER_SUSPENDED',
          target_type: 'user',
          target_id: userId,
          details: {
            reason: input.reason,
            target_email: existingUser.email,
            target_company: existingUser.company_name,
          },
        });

      return { success: true, data: updatedUser as User };
    } catch (err) {
      console.error('[UserService] Suspend exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '停權會員失敗' },
      };
    }
  },

  /**
   * 解除停權（Admin）
   */
  async reactivate(
    userId: string,
    adminId: string
  ): Promise<ServiceResult<User>> {
    try {
      // 檢查會員是否存在
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該會員' },
        };
      }

      if (existingUser.status !== 'suspended') {
        return {
          success: false,
          error: { code: 'NOT_SUSPENDED', message: '該會員目前不是停權狀態' },
        };
      }

      // 更新會員狀態
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status: 'active' as UserStatus,
          suspended_at: null,
          suspended_reason: null,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('[UserService] Reactivate error:', updateError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      // 解除停權連帶處理：恢復被停權時下架的車輛
      // 只恢復 previous_status 為 approved 的車輛
      await supabaseAdmin
        .from('vehicles')
        .update({
          status: 'approved',
          previous_status: null,
        })
        .eq('owner_dealer_id', userId)
        .eq('status', 'archived')
        .eq('previous_status', 'approved');

      // 發送解除停權通知
      await notificationService.send({
        user_id: userId,
        type: 'account_reactivated',
        title: '帳號已恢復正常',
        message: '您的帳號停權已解除，現在可以正常使用所有功能。',
        data: {
          admin_id: adminId,
          reactivated_at: new Date().toISOString(),
        },
      });

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'USER_REACTIVATED',
          target_type: 'user',
          target_id: userId,
          details: {
            target_email: existingUser.email,
            target_company: existingUser.company_name,
            previous_reason: existingUser.suspended_reason,
          },
        });

      return { success: true, data: updatedUser as User };
    } catch (err) {
      console.error('[UserService] Reactivate exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '解除停權失敗' },
      };
    }
  },

  /**
   * 取得多位會員的車輛數
   */
  async getVehicleCounts(
    userIds: string[]
  ): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('owner_dealer_id')
        .in('owner_dealer_id', userIds);

      if (error) {
        console.error('[UserService] GetVehicleCounts error:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.owner_dealer_id] = (counts[row.owner_dealer_id] || 0) + 1;
      }

      return counts;
    } catch (err) {
      console.error('[UserService] GetVehicleCounts exception:', err);
      return {};
    }
  },

  /**
   * 取得多位會員的調做數
   */
  async getTradeCounts(
    userIds: string[]
  ): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    try {
      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .select('dealer_id')
        .in('dealer_id', userIds)
        .eq('is_active', true);

      if (error) {
        console.error('[UserService] GetTradeCounts error:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.dealer_id] = (counts[row.dealer_id] || 0) + 1;
      }

      return counts;
    } catch (err) {
      console.error('[UserService] GetTradeCounts exception:', err);
      return {};
    }
  },

  /**
   * 取得會員的車輛列表
   */
  async getUserVehicles(
    userId: string,
    limit: number = 10
  ): Promise<ServiceResult<unknown[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select(`
          id, 
          status, 
          listing_price, 
          year,
          brand:brands!vehicles_brand_id_fkey(name),
          spec:specs!vehicles_spec_id_fkey(name),
          model:models!vehicles_model_id_fkey(name)
        `)
        .eq('owner_dealer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[UserService] GetUserVehicles error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[UserService] GetUserVehicles exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得會員車輛失敗' },
      };
    }
  },

  /**
   * 取得會員的調做列表
   */
  async getUserTrades(
    userId: string,
    limit: number = 10
  ): Promise<ServiceResult<unknown[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .select(`
          id,
          is_active,
          expires_at,
          target_brand:brands!trade_requests_target_brand_id_fkey(name),
          target_spec:specs!trade_requests_target_spec_id_fkey(name),
          target_model:models!trade_requests_target_model_id_fkey(name)
        `)
        .eq('dealer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[UserService] GetUserTrades error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[UserService] GetUserTrades exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得會員調做失敗' },
      };
    }
  },
};

export default userService;
