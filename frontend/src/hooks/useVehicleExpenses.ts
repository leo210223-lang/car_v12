'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  owner_dealer_id: string;
  item_name: string;
  amount: number;
  note: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  item_name: string;
  amount: number;
  note?: string;
  expense_date?: string;
}

export interface UpdateExpenseInput {
  item_name?: string;
  amount?: number;
  note?: string;
  expense_date?: string;
}

// ============================================================================
// Fetcher
// ============================================================================

const fetcher = async (
  url: string
): Promise<ApiResponse<{ expenses: VehicleExpense[]; total: number }>> => {
  return api.get<{ expenses: VehicleExpense[]; total: number }>(url);
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * 取得某台車輛的整備費細項（僅車主可用）
 */
export function useVehicleExpenses(vehicleId: string | null) {
  const { data, error, mutate, isValidating } = useSWR<
    ApiResponse<{ expenses: VehicleExpense[]; total: number }>
  >(vehicleId ? `/vehicles/${vehicleId}/expenses` : null, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    expenses: data?.data?.expenses ?? [],
    total: data?.data?.total ?? 0,
    isLoading: !data && !error && !!vehicleId,
    isError: !!error,
    error,
    refresh: mutate,
    isValidating,
  };
}

/**
 * 整備費細項操作（新增 / 更新 / 刪除）
 */
export function useVehicleExpenseActions(vehicleId: string | null) {
  const createExpense = useCallback(
    async (input: CreateExpenseInput) => {
      if (!vehicleId) {
        return { success: false, message: '車輛 ID 缺失' } as ApiResponse<VehicleExpense>;
      }
      return api.post<VehicleExpense>(`/vehicles/${vehicleId}/expenses`, input);
    },
    [vehicleId]
  );

  const updateExpense = useCallback(
    async (expenseId: string, input: UpdateExpenseInput) => {
      if (!vehicleId) {
        return { success: false, message: '車輛 ID 缺失' } as ApiResponse<VehicleExpense>;
      }
      return api.put<VehicleExpense>(
        `/vehicles/${vehicleId}/expenses/${expenseId}`,
        input
      );
    },
    [vehicleId]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      if (!vehicleId) {
        return { success: false, message: '車輛 ID 缺失' } as ApiResponse<void>;
      }
      return api.delete<void>(`/vehicles/${vehicleId}/expenses/${expenseId}`);
    },
    [vehicleId]
  );

  return { createExpense, updateExpense, deleteExpense };
}
