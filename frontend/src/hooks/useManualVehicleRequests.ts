'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export type ManualVehicleRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ManualVehicleRequest {
  id: string;
  requester_id: string;
  brand_text: string;
  spec_text: string | null;
  model_text: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  transmission: string | null;
  fuel_type: string | null;
  listing_price: number | null;
  acquisition_cost: number | null;
  repair_cost: number | null;
  description: string | null;
  images: string[];
  contact_note: string | null;
  status: ManualVehicleRequestStatus;
  rejection_reason: string | null;
  created_vehicle_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateManualVehicleRequestInput {
  brand_text: string;
  spec_text?: string;
  model_text?: string;
  year?: number;
  color?: string;
  mileage?: number;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt';
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  listing_price?: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
  images?: string[];
  contact_note?: string;
}

// ============================================================================
// Hooks — 使用者端
// ============================================================================

export function useMyManualVehicleRequests() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<ManualVehicleRequest[]>
  >(
    '/manual-vehicle-requests/mine',
    async (url: string) => api.get<ManualVehicleRequest[]>(url),
    { revalidateOnFocus: false }
  );

  return {
    requests: data?.data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useManualVehicleRequestActions() {
  const create = useCallback(async (input: CreateManualVehicleRequestInput) => {
    return api.post<{ id: string }>('/manual-vehicle-requests', input);
  }, []);

  return { create };
}
