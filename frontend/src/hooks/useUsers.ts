/**
 * FaCai-B Platform - Users Hook
 * File: frontend/src/hooks/useUsers.ts
 * 
 * 提供 Admin 會員管理功能的資料管理
 */

'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';
import type { User, UserStatus } from '@/types/user';
import type { Vehicle } from './useVehicles';
import type { TradeRequest } from './useTradeRequests';

// ============================================================================
// 型別定義
// ============================================================================

export interface UserListItem extends User {
  vehicle_count: number;
  trade_count: number;
}

export interface UserDetail extends UserListItem {
  vehicles?: Vehicle[];
  trades?: TradeRequest[];
}

export interface UserFilters {
  status?: UserStatus;
  status_group?: 'suspended_rejected';
  search?: string;
  page?: number;
  limit?: number;
}

export interface SuspendInput {
  reason: string;
}

// ============================================================================
// 會員列表 Hook
// ============================================================================

/**
 * 取得會員列表
 */
export function useUsers(filters: UserFilters = {}) {
  const limit = filters.limit || 20;
  const queryKey = `/admin/users?status=${filters.status || ''}&status_group=${filters.status_group || ''}&search=${filters.search || ''}&page=${filters.page || 1}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    queryKey,
    async (): Promise<{ data: UserListItem[]; meta: { total: number; page: number; totalPages: number } }> => {
      const response = await apiClient.request<UserListItem[]>('/admin/users', {
        method: 'GET',
        cache: 'no-store',
        params: {
          status: filters.status,
          status_group: filters.status_group,
          search: filters.search,
          page: filters.page,
          limit,
        },
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || '取得會員列表失敗');
      }

      const meta = response.meta as { total?: number; page?: number; totalPages?: number } | undefined;
      const total = meta?.total || response.data.length;
      const totalPages = meta?.totalPages || Math.max(1, Math.ceil(total / limit));
      return {
        data: response.data,
        meta: {
          total,
          page: filters.page || 1,
          totalPages,
        },
      };
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  return {
    users: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    page: data?.meta?.page ?? 1,
    totalPages: data?.meta?.totalPages ?? 1,
    isLoading,
    error,
    refresh: mutate,
  };
}


export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  rejectedUsers: number;
  totalVehicles: number;
}

export function useUserStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/users/stats',
    async (): Promise<UserStats> => {
      const response = await apiClient.request<UserStats>('/admin/users/stats', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || '取得會員統計失敗');
      }

      return response.data;
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 單一會員詳情 Hook
// ============================================================================

/**
 * 取得單一會員詳情
 */
export function useUserDetail(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/admin/users/${id}` : null,
    async (): Promise<UserDetail> => {
      const response = await apiClient.request<UserDetail & {
        recent_vehicles?: Vehicle[];
        recent_trades?: TradeRequest[];
      }>(`/admin/users/${id}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || '取得會員詳情失敗');
      }

      return {
        ...response.data,
        vehicles: response.data.vehicles || response.data.recent_vehicles || [],
        trades: response.data.trades || response.data.recent_trades || [],
      };
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  return {
    user: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 會員操作 Hook
// ============================================================================

/**
 * 會員操作（核准、退件、停權、解除停權、刪除）
 */
export function useUserActions() {
  const approveUser = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put<{ message: string }>(`/admin/users/${id}/approve`);
      if (response.success) {
        return { success: true, message: response.message || '會員已核准' };
      }
      throw new Error(response.message || '核准失敗');
    } catch (err) {
      const message = err instanceof Error ? err.message : '核准失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const rejectUser = useCallback(async (id: string, reason?: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put<{ message: string }>(`/admin/users/${id}/reject`, { reason });
      if (response.success) {
        return { success: true, message: response.message || '會員已退件' };
      }
      throw new Error(response.message || '退件失敗');
    } catch (err) {
      const message = err instanceof Error ? err.message : '退件失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 停權用戶
   */
  const suspendUser = useCallback(async (id: string, reason: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put<{ message: string }>(`/admin/users/${id}/suspend`, { reason });
      if (response.success) {
        return { success: true, message: response.message || '會員已停權' };
      }
      throw new Error(response.message || '停權失敗');
    } catch (err) {
      const message = err instanceof Error ? err.message : '停權失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * 解除停權
   */
  const reactivateUser = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put<{ message: string }>(`/admin/users/${id}/reactivate`);
      if (response.success) {
        return { success: true, message: response.message || '會員已解除停權' };
      }
      throw new Error(response.message || '解除停權失敗');
    } catch (err) {
      const message = err instanceof Error ? err.message : '解除停權失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.delete<{ id: string }>(`/admin/users/${id}`);
      if (response.success) {
        return { success: true, message: response.message || '會員已永久刪除' };
      }
      throw new Error(response.message || '刪除會員失敗');
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除會員失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    approveUser,
    rejectUser,
    suspendUser,
    reactivateUser,
    deleteUser,
    isSubmitting,
    error,
  };
}
