/**
 * FaCai-B Platform - Manual Vehicle Request Service
 * File: backend/src/services/manual-vehicle-request.service.ts
 *
 * 處理「找不到車輛 → 管理員代為手動建立」的申請。
 */

import { supabaseAdmin } from '../config/supabase';
import type {
  CreateManualVehicleRequestInput,
  ApproveManualVehicleRequestInput,
  ManualVehicleRequestListQuery,
} from '../utils/validation.v12';
import type { ManualVehicleRequest } from '../types/v12';
import { notificationService } from './notification.service';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface ManualRequestListResult {
  requests: ManualVehicleRequest[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export const manualVehicleRequestService = {
  /**
   * 會員提交「找不到車輛」申請
   */
  async create(
    requesterId: string,
    input: CreateManualVehicleRequestInput
  ): Promise<ServiceResult<ManualVehicleRequest>> {
    try {
      const payload: Record<string, unknown> = {
        requester_id: requesterId,
        brand_text: input.brand_text,
        spec_text: input.spec_text ?? null,
        model_text: input.model_text ?? null,
        year: input.year ?? null,
        color: input.color ?? null,
        mileage: input.mileage ?? null,
        transmission: input.transmission ?? null,
        fuel_type: input.fuel_type ?? null,
        listing_price: input.listing_price ?? null,
        acquisition_cost: input.acquisition_cost ?? null,
        repair_cost: input.repair_cost ?? null,
        description: input.description ?? null,
        images: input.images ?? [],
        contact_note: input.contact_note ?? null,
        status: 'pending',
      };

      const { data, error } = await supabaseAdmin
        .from('manual_vehicle_requests')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[ManualVehicleRequestService] Create error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      return { success: true, data: data as ManualVehicleRequest };
    } catch (err) {
      console.error('[ManualVehicleRequestService] Create exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '送出申請失敗' } };
    }
  },

  /**
   * 會員查自己送出的申請
   */
  async listMine(
    requesterId: string,
    limit = 20
  ): Promise<ServiceResult<ManualVehicleRequest[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('manual_vehicle_requests')
        .select('*')
        .eq('requester_id', requesterId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ManualVehicleRequestService] ListMine error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      return { success: true, data: (data || []) as ManualVehicleRequest[] };
    } catch (err) {
      console.error('[ManualVehicleRequestService] ListMine exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '取得申請失敗' } };
    }
  },

  /**
   * 管理員查所有申請
   */
  async listAll(
    query: ManualVehicleRequestListQuery
  ): Promise<ServiceResult<ManualRequestListResult>> {
    try {
      const { cursor, limit = 20, status } = query;

      let queryBuilder = supabaseAdmin
        .from('manual_vehicle_requests')
        .select(
          `*,
           requester:users!manual_vehicle_requests_requester_id_fkey(
             id, name, company_name, phone, email
           )
          `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      if (cursor) {
        const { data: cursorRow } = await supabaseAdmin
          .from('manual_vehicle_requests')
          .select('created_at')
          .eq('id', cursor)
          .single();
        if (cursorRow) {
          queryBuilder = queryBuilder.lt('created_at', cursorRow.created_at);
        }
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[ManualVehicleRequestService] ListAll error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      const hasMore = (data || []).length > limit;
      const requests = hasMore ? (data as any[]).slice(0, limit) : (data as any[]);
      const nextCursor = hasMore ? requests[requests.length - 1]?.id : null;

      return {
        success: true,
        data: {
          requests: requests as ManualVehicleRequest[],
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[ManualVehicleRequestService] ListAll exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '取得申請列表失敗' } };
    }
  },

  /**
   * 取得單筆申請
   */
  async getById(requestId: string): Promise<ServiceResult<ManualVehicleRequest>> {
    const { data, error } = await supabaseAdmin
      .from('manual_vehicle_requests')
      .select(
        `*,
         requester:users!manual_vehicle_requests_requester_id_fkey(
           id, name, company_name, phone, email
         )
        `
      )
      .eq('id', requestId)
      .single();

    if (error || !data) {
      return { success: false, error: { code: 'NOT_FOUND', message: '找不到該申請' } };
    }

    return { success: true, data: data as ManualVehicleRequest };
  },

  /**
   * 管理員核准：根據申請資料建立一筆實際 vehicles 記錄（直接 approved）
   */
  async approve(
    requestId: string,
    adminId: string,
    input: ApproveManualVehicleRequestInput
  ): Promise<ServiceResult<{ request_id: string; vehicle_id: string }>> {
    try {
      // 1) 抓申請資料
      const { data: reqData, error: fetchError } = await supabaseAdmin
        .from('manual_vehicle_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !reqData) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該申請' } };
      }

      if (reqData.status !== 'pending') {
        return {
          success: false,
          error: { code: 'INVALID_STATUS', message: '僅能核准 pending 狀態的申請' },
        };
      }

      // 2) 建立 vehicles 記錄（直接 approved，由管理員代建）
      const vehiclePayload: Record<string, unknown> = {
        owner_dealer_id: reqData.requester_id,
        created_by: adminId,
        brand_id: input.brand_id,
        spec_id: input.spec_id,
        model_id: input.model_id,
        year: input.year,
        color: reqData.color,
        mileage: reqData.mileage,
        transmission: reqData.transmission,
        fuel_type: reqData.fuel_type,
        listing_price: input.listing_price ?? reqData.listing_price,
        acquisition_cost: reqData.acquisition_cost,
        repair_cost: reqData.repair_cost,
        description: reqData.description ?? '',
        images: Array.isArray(reqData.images) ? reqData.images : [],
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      };

      const { data: newVehicle, error: insertError } = await supabaseAdmin
        .from('vehicles')
        .insert(vehiclePayload)
        .select('id')
        .single();

      if (insertError || !newVehicle) {
        console.error('[ManualVehicleRequestService] Insert vehicle error:', insertError);
        return {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: insertError?.message || '建立車輛失敗',
          },
        };
      }

      // 3) 更新申請狀態
      const { error: updateError } = await supabaseAdmin
        .from('manual_vehicle_requests')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          created_vehicle_id: newVehicle.id,
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('[ManualVehicleRequestService] Approve update error:', updateError);
        // 不回滾車輛記錄，已經成功建立就保留
      }

      // 4) 通知申請人
      await notificationService.send({
        user_id: reqData.requester_id,
        type: 'vehicle_approved',
        title: '代上傳申請已核准',
        message: `您申請代上傳的「${reqData.brand_text} ${reqData.spec_text ?? ''}」已建立完成。`,
        data: {
          manual_request_id: requestId,
          vehicle_id: newVehicle.id,
        },
      });

      return {
        success: true,
        data: { request_id: requestId, vehicle_id: newVehicle.id },
      };
    } catch (err) {
      console.error('[ManualVehicleRequestService] Approve exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '核准申請失敗' } };
    }
  },

  /**
   * 管理員拒絕申請
   */
  async reject(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<ServiceResult<ManualVehicleRequest>> {
    try {
      const { data: reqData, error: fetchError } = await supabaseAdmin
        .from('manual_vehicle_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !reqData) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該申請' } };
      }

      if (reqData.status !== 'pending') {
        return {
          success: false,
          error: { code: 'INVALID_STATUS', message: '僅能拒絕 pending 狀態的申請' },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('manual_vehicle_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('[ManualVehicleRequestService] Reject error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      // 通知
      await notificationService.send({
        user_id: reqData.requester_id,
        type: 'vehicle_rejected',
        title: '代上傳申請已退回',
        message: `您的申請「${reqData.brand_text} ${reqData.spec_text ?? ''}」已退回：${reason}`,
        data: { manual_request_id: requestId, reason },
      });

      return { success: true, data: data as ManualVehicleRequest };
    } catch (err) {
      console.error('[ManualVehicleRequestService] Reject exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '拒絕申請失敗' } };
    }
  },
};

export default manualVehicleRequestService;
