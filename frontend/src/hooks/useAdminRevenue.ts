'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

export interface RevenueRecord {
  id: string;
  vehicle_id: string | null;
  owner_dealer_id: string | null;
  vehicle_snapshot: {
    brand_name?: string;
    spec_name?: string;
    model_name?: string;
    year?: number;
    color?: string | null;
    mileage?: number | null;
    images?: unknown;
    description?: string | null;
  };
  listing_price: number | null;
  acquisition_cost: number | null;
  repair_cost_base: number | null;
  expenses_total: number;
  total_cost: number;
  profit: number;
  archived_at: string;
  settled_at: string;
  created_at: string;
  owner?: {
    id: string;
    name: string;
    company_name: string;
  };
}

export interface RevenueSummary {
  total_profit: number;
  total_sales: number;
  count: number;
}

export interface RevenueListResponse {
  records: RevenueRecord[];
  summary: RevenueSummary;
}

export function useAdminRevenue(ownerId?: string) {
  const queryKey = `/admin/revenue${ownerId ? `?owner_id=${ownerId}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<RevenueListResponse>>(
    queryKey,
    async () =>
      api.get<RevenueListResponse>('/admin/revenue', {
        ...(ownerId ? { owner_id: ownerId } : {}),
      }),
    { revalidateOnFocus: true }
  );

  return {
    records: data?.data?.records ?? [],
    summary: data?.data?.summary ?? { total_profit: 0, total_sales: 0, count: 0 },
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useAdminRevenueActions() {
  const manualSettle = useCallback(async (vehicleId: string) => {
    return api.post<{ revenue_id: string }>(`/admin/revenue/settle/${vehicleId}`);
  }, []);

  return { manualSettle };
}
