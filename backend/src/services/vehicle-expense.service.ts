/**
 * FaCai-B Platform - Vehicle Expense Service
 * File: backend/src/services/vehicle-expense.service.ts
 *
 * 整備費細項（做帳）CRUD
 * 僅車輛擁有者可以存取。
 */

import { supabaseAdmin } from '../config/supabase';
import type {
  VehicleExpense,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../types/v12';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/**
 * 檢查車輛所有權
 */
async function assertVehicleOwnership(
  vehicleId: string,
  userId: string
): Promise<ServiceResult<{ id: string; owner_dealer_id: string }>> {
  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('id, owner_dealer_id')
    .eq('id', vehicleId)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '找不到該車輛' },
    };
  }

  if (data.owner_dealer_id !== userId) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: '您不是該車輛的擁有者' },
    };
  }

  return { success: true, data };
}

export const vehicleExpenseService = {
  /**
   * 取得某台車的所有整備費細項（含加總）
   */
  async listByVehicle(
    vehicleId: string,
    userId: string
  ): Promise<
    ServiceResult<{ expenses: VehicleExpense[]; total: number }>
  > {
    try {
      const ownershipResult = await assertVehicleOwnership(vehicleId, userId);
      if (!ownershipResult.success) return ownershipResult as ServiceResult<any>;

      const { data, error } = await supabaseAdmin
        .from('vehicle_expenses')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VehicleExpenseService] List error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      const expenses = (data || []) as VehicleExpense[];
      const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      return { success: true, data: { expenses, total } };
    } catch (err) {
      console.error('[VehicleExpenseService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得整備費細項失敗' },
      };
    }
  },

  /**
   * 新增整備費細項
   */
  async create(
    vehicleId: string,
    userId: string,
    input: CreateExpenseInput
  ): Promise<ServiceResult<VehicleExpense>> {
    try {
      const ownershipResult = await assertVehicleOwnership(vehicleId, userId);
      if (!ownershipResult.success) return ownershipResult as ServiceResult<any>;

      const payload: Record<string, unknown> = {
        vehicle_id: vehicleId,
        owner_dealer_id: userId,
        item_name: input.item_name,
        amount: input.amount,
        note: input.note ?? null,
      };

      if (input.expense_date) {
        payload.expense_date = input.expense_date;
      }

      const { data, error } = await supabaseAdmin
        .from('vehicle_expenses')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[VehicleExpenseService] Create error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      return { success: true, data: data as VehicleExpense };
    } catch (err) {
      console.error('[VehicleExpenseService] Create exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '新增整備費細項失敗' },
      };
    }
  },

  /**
   * 更新整備費細項
   */
  async update(
    expenseId: string,
    userId: string,
    input: UpdateExpenseInput
  ): Promise<ServiceResult<VehicleExpense>> {
    try {
      // 先抓既有細項確認擁有者
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicle_expenses')
        .select('id, owner_dealer_id')
        .eq('id', expenseId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該細項' },
        };
      }

      if (existing.owner_dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該細項的擁有者' },
        };
      }

      const updatePayload: Record<string, unknown> = {};
      if (input.item_name !== undefined) updatePayload.item_name = input.item_name;
      if (input.amount !== undefined) updatePayload.amount = input.amount;
      if (input.note !== undefined) updatePayload.note = input.note;
      if (input.expense_date !== undefined) updatePayload.expense_date = input.expense_date;

      if (Object.keys(updatePayload).length === 0) {
        return {
          success: false,
          error: { code: 'EMPTY_PAYLOAD', message: '沒有可更新的欄位' },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('vehicle_expenses')
        .update(updatePayload)
        .eq('id', expenseId)
        .select()
        .single();

      if (error) {
        console.error('[VehicleExpenseService] Update error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      return { success: true, data: data as VehicleExpense };
    } catch (err) {
      console.error('[VehicleExpenseService] Update exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新整備費細項失敗' },
      };
    }
  },

  /**
   * 刪除整備費細項
   */
  async delete(
    expenseId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicle_expenses')
        .select('id, owner_dealer_id')
        .eq('id', expenseId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該細項' },
        };
      }

      if (existing.owner_dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該細項的擁有者' },
        };
      }

      const { error } = await supabaseAdmin
        .from('vehicle_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('[VehicleExpenseService] Delete error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      return { success: true };
    } catch (err) {
      console.error('[VehicleExpenseService] Delete exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除整備費細項失敗' },
      };
    }
  },

  /**
   * 計算某台車的整備費細項加總（給結算用，無權限檢查）
   */
  async sumByVehicle(vehicleId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('vehicle_expenses')
      .select('amount')
      .eq('vehicle_id', vehicleId);

    if (error || !data) return 0;
    return data.reduce((sum, e) => sum + (e.amount || 0), 0);
  },
};

export default vehicleExpenseService;
