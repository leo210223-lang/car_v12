'use client';

import useSWR from 'swr';
import { api, ApiResponse } from '@/lib/api';

/**
 * 讀取登入會員的點數
 */
export function useMyCredits() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<{ credits: number }>>(
    '/users/me/credits',
    async (url: string) => api.get<{ credits: number }>(url),
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // 1 分鐘刷一次
    }
  );

  return {
    credits: data?.data?.credits ?? 0,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
