'use client';

import useSWR from 'swr';
import { api, ApiResponse } from '@/lib/api';

/**
 * [v12.1] 車行自己的營收紀錄 Hook
 */

export interface MyRevenueRecord {
  id: string;
  vehicle_id: string | null;
  owner_dealer_id: string | null;
  vehicle_snapshot: {
    brand_name?: string | null;
    spec_name?: string | null;
    model_name?: string | null;
    year?: number | null;
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
}

export interface MyRevenueSummary {
  total_profit: number;
  total_sales: number;
  count: number;
}

interface MyRevenueResponse {
  records: MyRevenueRecord[];
  summary: MyRevenueSummary;
}

export function useMyRevenue() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<MyRevenueResponse>>(
    '/revenue/mine',
    async (url: string) => api.get<MyRevenueResponse>(url),
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
