'use client';

import useSWR from 'swr';
import { api, ApiResponse } from '@/lib/api';

/**
 * [v12.1] 車行自己的營收紀錄 Hook
 * [v12.2] 支援月份篩選（year + month），以 archived_at 為基準
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

export interface MyRevenueFilter {
  /** 西元年，例如 2026 */
  year?: number;
  /** 月份 1..12 */
  month?: number;
}

export function useMyRevenue(filter: MyRevenueFilter = {}) {
  const { year, month } = filter;
  const hasMonth =
    year != null &&
    month != null &&
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12;

  // SWR key：加入篩選條件，切換時會自動重取
  const key = hasMonth
    ? `/revenue/mine?year=${year}&month=${month}`
    : '/revenue/mine';

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<MyRevenueResponse>>(
    key,
    async () => {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (hasMonth) {
        params.year = year;
        params.month = month;
      }
      return api.get<MyRevenueResponse>('/revenue/mine', params);
    },
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
