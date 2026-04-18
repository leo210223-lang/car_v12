/**
 * FaCai-B Platform - Audit Hook
 * File: frontend/src/hooks/useAudit.ts
 * 
 * 提供 Admin 審核功能的資料管理：待審核列表、核准、拒絕、代客建檔
 */

'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import apiClient from '@/lib/api';
import type { Vehicle } from './useVehicles';

// ============================================================================
// 型別定義
// ============================================================================

export interface Dealer {
  id: string;
  shop_name: string;
  contact_name: string;
  phone: string;
  status: string;
}

export interface AuditFilters {
  status?: 'pending' | 'rejected';
}

export interface ProxyVehicleInput {
  owner_dealer_id: string;
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  listing_price: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
}

export interface DashboardStats {
  pendingCount: number;
  totalVehicles: number;
  totalTrades: number;
  totalUsers: number;
}

// ============================================================================
// 待審核列表 Hook
// ============================================================================

/**
 * 取得待審核車輛列表
 */
export function usePendingVehicles(filters: AuditFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    `/admin/vehicles/pending?status=${filters.status || 'pending'}`,
    async (): Promise<{ data: Vehicle[]; meta: { total: number } }> => {
      try {
        const response = await apiClient.get<Vehicle[]>('/admin/vehicles/pending', {
          status: filters.status || 'pending',
        });
        if (response.success && response.data) {
          return { data: response.data, meta: { total: response.meta?.total || response.data.length } };
        }
        throw new Error(response.message || 'API 回應失敗');
      } catch (err) {
        console.error('[usePendingVehicles] API 失敗:', err);
        return { data: [], meta: { total: 0 } };
      }
    },
    { revalidateOnFocus: false }
  );

  return {
    vehicles: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 單一待審核車輛詳情 Hook
// ============================================================================

/**
 * 取得單一待審核車輛詳情
 */
export function usePendingVehicle(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/admin/vehicles/${id}/detail` : null,
    async (): Promise<Vehicle> => {
      try {
        const response = await apiClient.get<Vehicle>(`/admin/vehicles/${id}/detail`);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('API 回應失敗');
      } catch (err) {
        console.error('[usePendingVehicle] API 失敗:', err);
        throw err instanceof Error ? err : new Error('載入失敗');
      }
    },
    { revalidateOnFocus: false }
  );

  return {
    vehicle: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 審核操作 Hook
// ============================================================================

/**
 * 審核操作（核准、拒絕）
 */
export function useAuditActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 核准車輛
   */
  const approveVehicle = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<{ message: string }>(`/admin/vehicles/${id}/approve`);
      if (response.success) {
        await globalMutate(
          (key) => typeof key === 'string' && key.includes('/admin/vehicles/pending')
        );
        await globalMutate(`/admin/vehicles/${id}/detail`);
        return { success: true, message: response.message || '車輛已核准' };
      }
      const msg = response.message || '核准失敗';
      setError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const message = err instanceof Error ? err.message : '核准失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * 拒絕車輛
   */
  const rejectVehicle = useCallback(async (id: string, reason: string) => {
    setIsSubmitting(true);
    setError(null);

    if (!reason.trim()) {
      setError('請填寫拒絕理由');
      setIsSubmitting(false);
      return { success: false, message: '請填寫拒絕理由' };
    }

    try {
      const response = await apiClient.post<{ message: string }>(`/admin/vehicles/${id}/reject`, {
        rejection_reason: reason,
      });
      if (response.success) {
        await globalMutate(
          (key) => typeof key === 'string' && key.includes('/admin/vehicles/pending')
        );
        await globalMutate(`/admin/vehicles/${id}/detail`);
        return { success: true, message: response.message || '車輛已退件' };
      }
      const msg = response.message || '退件失敗';
      setError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const message = err instanceof Error ? err.message : '退件失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    approveVehicle,
    rejectVehicle,
  };
}

// ============================================================================
// 車行列表 Hook
// ============================================================================

/**
 * 取得車行列表（用於代客建檔）
 */
export function useDealers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/dealers',
    async (): Promise<Dealer[]> => {
      try {
        const response = await apiClient.get<Dealer[]>('/admin/users', { role: 'user', status: 'active' });
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('API 回應失敗');
      } catch (err) {
        console.error('[useDealers] API 失敗:', err);
        return [];
      }
    },
    { revalidateOnFocus: false }
  );

  return {
    dealers: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 代客建檔 Hook
// ============================================================================

/**
 * 代客建檔操作
 */
export function useProxyVehicle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProxyVehicle = useCallback(async (input: ProxyVehicleInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<Vehicle>('/admin/vehicles/proxy', input);
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message || '車輛已建立',
        };
      }
      const msg = response.message || '建立失敗';
      setError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    createProxyVehicle,
  };
}

// ============================================================================
// Dashboard 統計 Hook
// ============================================================================

/**
 * 取得 Dashboard 統計資料
 */
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/dashboard/stats',
    async (): Promise<DashboardStats> => {
      try {
        const response = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('API 回應失敗');
      } catch (err) {
        console.error('[useDashboardStats] API 失敗:', err);
        return {
          pendingCount: 0,
          totalVehicles: 0,
          totalTrades: 0,
          totalUsers: 0,
        } as DashboardStats;
      }
    },
    { revalidateOnFocus: false, refreshInterval: 60000 } // 每分鐘刷新
  );

  return {
    stats: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
