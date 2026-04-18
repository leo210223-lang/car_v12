'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';
import type { ManualVehicleRequest } from './useManualVehicleRequests';

export interface AdminManualVehicleRequest extends ManualVehicleRequest {
  requester?: {
    id: string;
    name: string;
    company_name: string;
    phone: string;
    email: string;
  };
}

export interface ApproveManualRequestInput {
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  listing_price?: number;
}

export function useAdminManualRequests(status?: 'pending' | 'approved' | 'rejected') {
  const queryKey = `/admin/manual-vehicle-requests${status ? `?status=${status}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<AdminManualVehicleRequest[]>>(
    queryKey,
    async () =>
      api.get<AdminManualVehicleRequest[]>('/admin/manual-vehicle-requests', {
        ...(status ? { status } : {}),
      }),
    { revalidateOnFocus: true }
  );

  return {
    requests: data?.data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useAdminManualRequestDetail(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<AdminManualVehicleRequest>>(
    id ? `/admin/manual-vehicle-requests/${id}` : null,
    async (url: string) => api.get<AdminManualVehicleRequest>(url),
    { revalidateOnFocus: false }
  );

  return {
    request: data?.data ?? null,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useAdminManualRequestActions() {
  const approve = useCallback(async (id: string, input: ApproveManualRequestInput) => {
    return api.post<{ request_id: string; vehicle_id: string }>(
      `/admin/manual-vehicle-requests/${id}/approve`,
      input
    );
  }, []);

  const reject = useCallback(async (id: string, reason: string) => {
    return api.post<ManualVehicleRequest>(
      `/admin/manual-vehicle-requests/${id}/reject`,
      { reason }
    );
  }, []);

  return { approve, reject };
}
