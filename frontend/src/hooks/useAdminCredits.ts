'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

export function useAdminUserCredits(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<{ credits: number }>>(
    userId ? `/admin/credits/${userId}` : null,
    async (url: string) => api.get<{ credits: number }>(url),
    { revalidateOnFocus: true }
  );

  return {
    credits: data?.data?.credits ?? 0,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useAdminCreditsActions() {
  const setCredits = useCallback(async (userId: string, credits: number) => {
    return api.put<{ id: string; credits: number }>(`/admin/credits/${userId}`, {
      credits,
    });
  }, []);

  return { setCredits };
}
