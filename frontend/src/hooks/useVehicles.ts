'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';
import { useInfiniteScroll } from './useInfiniteScroll';

// ============================================================================
// Types
// ============================================================================

export type VehicleStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface Vehicle {
  id: string;
  dealer_id: string;
  brand_id: string;
  spec_id: string;
  model_id: string;
  brand_name: string;
  spec_name: string;
  model_name: string;
  year: number;
  color?: string | null;
  mileage?: number;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt' | null;
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | null;
  images: string[] | string;
  acquisition_cost?: number | null; // 僅擁有者可見
  repair_cost?: number | null; // 僅擁有者可見
  listing_price?: number | null;
  price?: number | null; // legacy fallback
  trade_price?: number | null; // [v12] 盤價
  is_tradable?: boolean; // [v12] 可盤
  archived_at?: string | null; // [v12] 下架時間
  description?: string;
  status: VehicleStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // 關聯資料（users）
  owner?: {
    id: string;
    name?: string;
    company_name?: string;
    phone?: string;
  };
  brand?: {
    id?: string;
    name?: string;
  };
  model?: {
    id?: string;
    name?: string;
  };
  dealer?: {
    id: string;
    name?: string;
    company_name?: string;
    phone?: string;
    // Legacy fallback fields (for old mock payloads)
    shop_name?: string;
    contact_name?: string;
  };
}

export interface VehicleFilters {
  brand_id?: string;
  spec_id?: string;
  model_id?: string;
  year_from?: number;
  year_to?: number;
  search?: string;
  status?: VehicleStatus;
}

type VehicleMutationPayload = Partial<Vehicle>;

// ============================================================================
// Fetchers
// ============================================================================

const vehicleFetcher = async (url: string): Promise<ApiResponse<Vehicle>> => {
  return api.get<Vehicle>(url);
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * 車輛列表 Hook（無限滾動）
 */
export function useVehicles(filters: VehicleFilters = {}) {
  // 建立篩選參數
  const params: Record<string, string | number | boolean | undefined> = {};

  if (filters.brand_id) params.brand_id = filters.brand_id;
  if (filters.spec_id) params.spec_id = filters.spec_id;
  if (filters.model_id) params.model_id = filters.model_id;
  if (filters.year_from) params.year_from = filters.year_from;
  if (filters.year_to) params.year_to = filters.year_to;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;

  return useInfiniteScroll<Vehicle>({
    endpoint: '/vehicles',
    limit: 20,
    params,
  });
}

/**
 * 我的車輛列表 Hook
 */
export function useMyVehicles(status?: VehicleStatus) {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (status) params.status = status;

  return useInfiniteScroll<Vehicle>({
    endpoint: '/vehicles/my',
    limit: 20,
    params,
  });
}

/**
 * 單一車輛詳情 Hook
 */
export function useVehicle(id: string | null) {
  const { data, error, mutate, isValidating } = useSWR<ApiResponse<Vehicle>>(
    id ? `/vehicles/${id}` : null,
    vehicleFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    vehicle: data?.data ?? null,
    isLoading: !data && !error && !!id,
    isError: !!error,
    error,
    refresh: mutate,
    isValidating,
  };
}

/**
 * 車輛操作 Hook
 */
export function useVehicleActions() {
  // 新增車輛
  const createVehicle = useCallback(async (data: VehicleMutationPayload) => {
    return api.post<Vehicle>('/vehicles', data);
  }, []);

  // 更新車輛
  const updateVehicle = useCallback(async (id: string, data: VehicleMutationPayload) => {
    return api.put<Vehicle>(`/vehicles/${id}`, data);
  }, []);

  // 下架車輛
  const archiveVehicle = useCallback(async (id: string) => {
    return api.put<Vehicle>(`/vehicles/${id}/archive`);
  }, []);

  // 重新送審
  const resubmitVehicle = useCallback(async (id: string) => {
    return api.put<Vehicle>(`/vehicles/${id}/resubmit`);
  }, []);

  // 永久刪除
  const deleteVehicle = useCallback(async (id: string) => {
    return api.delete(`/vehicles/${id}`);
  }, []);

  // [v12] 切換可盤狀態 + 盤價
  const updateTradable = useCallback(
    async (id: string, input: { is_tradable: boolean; trade_price?: number | null }) => {
      return api.put<{ id: string; is_tradable: boolean; trade_price: number | null }>(
        `/vehicles/${id}/tradable`,
        input
      );
    },
    []
  );

  return {
    createVehicle,
    updateVehicle,
    archiveVehicle,
    resubmitVehicle,
    deleteVehicle,
    updateTradable,
  };
}
