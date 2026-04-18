/**
 * FaCai-B Platform - Vehicle Tradable Service
 * File: backend/src/services/vehicle-tradable.service.ts
 *
 * 可盤車相關邏輯：
 *  - 車主切換自己的車是否可盤並設定盤價
 *  - 管理員取消某台車的可盤狀態
 */

import { supabaseAdmin } from '../config/supabase';
import type { UpdateTradableInput } from '../utils/validation.v12';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const vehicleTradableService = {
  /**
   * 車主切換可盤狀態
   */
  async updateByOwner(
    vehicleId: string,
    userId: string,
    input: UpdateTradableInput
  ): Promise<ServiceResult<{ id: string; is_tradable: boolean; trade_price: number | null }>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('id, owner_dealer_id, status')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該車輛' } };
      }

      if (existing.owner_dealer_id !== userId) {
        return { success: false, error: { code: 'FORBIDDEN', message: '您不是該車輛的擁有者' } };
      }

      const updatePayload: Record<string, unknown> = {
        is_tradable: input.is_tradable,
        // 若取消可盤，清空盤價；若設定可盤，寫入 trade_price
        trade_price: input.is_tradable ? (input.trade_price ?? null) : null,
      };

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .update(updatePayload)
        .eq('id', vehicleId)
        .select('id, is_tradable, trade_price')
        .single();

      if (error) {
        console.error('[VehicleTradableService] Update error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      return { success: true, data: data as any };
    } catch (err) {
      console.error('[VehicleTradableService] Update exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '更新可盤狀態失敗' } };
    }
  },

  /**
   * 管理員取消某台車的可盤狀態
   */
  async cancelByAdmin(
    vehicleId: string,
    adminId: string
  ): Promise<ServiceResult<{ id: string; is_tradable: boolean }>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('id, owner_dealer_id, is_tradable')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該車輛' } };
      }

      if (!existing.is_tradable) {
        return {
          success: false,
          error: { code: 'NOT_TRADABLE', message: '該車輛目前不是可盤狀態' },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .update({ is_tradable: false, trade_price: null })
        .eq('id', vehicleId)
        .select('id, is_tradable')
        .single();

      if (error) {
        console.error('[VehicleTradableService] CancelByAdmin error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      // 稽核日誌
      await supabaseAdmin.from('audit_logs').insert({
        user_id: adminId,
        action: 'VEHICLE_APPROVED', // 用現有 enum 中最接近的；若需新增請擴充 audit enum
        target_type: 'vehicle',
        target_id: vehicleId,
        details: {
          change: 'TRADABLE_CANCELLED_BY_ADMIN',
          owner_dealer_id: existing.owner_dealer_id,
        },
      });

      return { success: true, data: data as any };
    } catch (err) {
      console.error('[VehicleTradableService] CancelByAdmin exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '取消可盤失敗' } };
    }
  },
};

export default vehicleTradableService;
