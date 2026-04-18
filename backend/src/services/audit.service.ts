/**
 * FaCai-B Platform - Audit Service
 * File: backend/src/services/audit.service.ts
 * 
 * 車輛審核與稽核日誌業務邏輯
 */

import { supabaseAdmin } from '../config/supabase';
import { 
  Vehicle, 
  VehicleDetail, 
  VehicleStatus,
  AuditLog,
  AuditAction,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AuditListResult {
  vehicles: VehicleDetail[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface AuditListQuery {
  cursor?: string;
  limit?: number;
  status?: VehicleStatus;
  sort_order?: 'asc' | 'desc';
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ProxyCreateInput {
  owner_dealer_id: string;
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  listing_price: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 將 VehicleDetail 轉換為前端期望的扁平格式
 */
function flattenVehicleDetail(vehicle: any): VehicleDetail & {
  brand_name?: string;
  spec_name?: string;
  model_name?: string;
} {
  const owner = vehicle.owner || null;

  return {
    ...vehicle,
    brand_name: vehicle.brand?.name || '',
    spec_name: vehicle.spec?.name || '',
    model_name: vehicle.model?.name || '',
    dealer: owner
      ? {
          id: owner.id,
          name: owner.name || '',
          company_name: owner.company_name || '',
          phone: owner.phone || '',
          // Legacy compatibility fields
          shop_name: owner.company_name || '',
          contact_name: owner.name || '',
        }
      : undefined,
    brand: vehicle.brand,
    spec: vehicle.spec,
    model: vehicle.model,
    owner,
  };
}

// ============================================================================
// Audit Service
// ============================================================================

export const auditService = {
  /**
   * 取得待審核車輛列表
   */
  async listPending(
    query: AuditListQuery
  ): Promise<ServiceResult<AuditListResult>> {
    try {
      const { 
        cursor, 
        limit = 20, 
        status = 'pending',
        sort_order = 'asc',
      } = query;

      let queryBuilder = supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          brand:brands!vehicles_brand_id_fkey(id, name),
          spec:specs!vehicles_spec_id_fkey(id, name),
          model:models!vehicles_model_id_fkey(id, name),
          owner:users!vehicles_owner_dealer_id_fkey(id, name, company_name, phone, email, status)
        `, { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: sort_order === 'asc' }) // 預設先進先審，允許最新優先
        .limit(limit + 1);

      // 游標分頁
      if (cursor) {
        const { data: cursorVehicle } = await supabaseAdmin
          .from('vehicles')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorVehicle) {
          queryBuilder =
            sort_order === 'asc'
              ? queryBuilder.gt('created_at', cursorVehicle.created_at)
              : queryBuilder.lt('created_at', cursorVehicle.created_at);
        }
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[AuditService] ListPending error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 處理分頁並轉換為扁平格式
      const hasMore = data.length > limit;
      const vehicles = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? vehicles[vehicles.length - 1]?.id : null;

      const flattenedVehicles = vehicles.map((v: any) => flattenVehicleDetail(v));

      return {
        success: true,
        data: {
          vehicles: flattenedVehicles as VehicleDetail[],
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[AuditService] ListPending exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得待審核列表失敗' },
      };
    }
  },

  /**
   * 取得車輛審核詳情（含完整資訊）
   */
  async getDetail(
    vehicleId: string
  ): Promise<ServiceResult<VehicleDetail>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          brand:brands!vehicles_brand_id_fkey(id, name),
          spec:specs!vehicles_spec_id_fkey(id, name),
          model:models!vehicles_model_id_fkey(id, name),
          owner:users!vehicles_owner_dealer_id_fkey(
            id, 
            name,
            company_name, 
            phone, 
            email, 
            status, 
            created_at
          )
        `)
        .eq('id', vehicleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該車輛' },
          };
        }
        console.error('[AuditService] GetDetail error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: flattenVehicleDetail(data) };
    } catch (err) {
      console.error('[AuditService] GetDetail exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得車輛詳情失敗' },
      };
    }
  },

  /**
   * 核准車輛
   */
  async approve(
    vehicleId: string,
    adminId: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      // 先檢查車輛狀態
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('id, status, owner_dealer_id')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該車輛' },
        };
      }

      if (existing.status !== 'pending') {
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `只能審核待審核狀態的車輛，目前狀態: ${existing.status}` 
          },
        };
      }

      // 更新車輛狀態
      const { data: vehicle, error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({ 
          status: 'approved' as VehicleStatus,
          rejection_reason: null,
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (updateError) {
        console.error('[AuditService] Approve update error:', updateError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      // 寫入稽核日誌
      await this.writeAuditLog({
        user_id: adminId,
        action: 'VEHICLE_APPROVED',
        target_type: 'vehicle',
        target_id: vehicleId,
        details: {
          owner_dealer_id: existing.owner_dealer_id,
        },
      });

      // 發送通知給車主
      await this.sendNotification({
        user_id: existing.owner_dealer_id,
        type: 'vehicle_approved',
        title: '車輛審核通過',
        message: '您的車輛已通過審核，現在可以在平台上公開展示。',
        data: { vehicle_id: vehicleId },
      });

      return { success: true, data: vehicle as Vehicle };
    } catch (err) {
      console.error('[AuditService] Approve exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '核准車輛失敗' },
      };
    }
  },

  /**
   * 拒絕車輛
   */
  async reject(
    vehicleId: string,
    adminId: string,
    rejectionReason: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      // 先檢查車輛狀態
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('id, status, owner_dealer_id')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該車輛' },
        };
      }

      if (existing.status !== 'pending') {
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `只能審核待審核狀態的車輛，目前狀態: ${existing.status}` 
          },
        };
      }

      // 更新車輛狀態
      const { data: vehicle, error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({ 
          status: 'rejected' as VehicleStatus,
          rejection_reason: rejectionReason,
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (updateError) {
        console.error('[AuditService] Reject update error:', updateError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      // 寫入稽核日誌
      await this.writeAuditLog({
        user_id: adminId,
        action: 'VEHICLE_REJECTED',
        target_type: 'vehicle',
        target_id: vehicleId,
        details: {
          owner_dealer_id: existing.owner_dealer_id,
          rejection_reason: rejectionReason,
        },
      });

      // 發送通知給車主
      await this.sendNotification({
        user_id: existing.owner_dealer_id,
        type: 'vehicle_rejected',
        title: '車輛審核未通過',
        message: `您的車輛審核未通過，原因：${rejectionReason}。您可以修改後重新送審。`,
        data: { 
          vehicle_id: vehicleId,
          rejection_reason: rejectionReason,
        },
      });

      return { success: true, data: vehicle as Vehicle };
    } catch (err) {
      console.error('[AuditService] Reject exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '拒絕車輛失敗' },
      };
    }
  },

  /**
   * 代客建檔（Admin 代替車行建立車輛，直接通過審核）
   */
  async proxyCreate(
    input: ProxyCreateInput,
    adminId: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      // 驗證目標車行是否存在且為 active
      const { data: owner, error: ownerError } = await supabaseAdmin
        .from('users')
        .select('id, status')
        .eq('id', input.owner_dealer_id)
        .single();

      if (ownerError || !owner) {
        return {
          success: false,
          error: { code: 'OWNER_NOT_FOUND', message: '找不到指定的車行' },
        };
      }

      if (owner.status === 'suspended') {
        return {
          success: false,
          error: { code: 'OWNER_SUSPENDED', message: '該車行已被停權，無法代客建檔' },
        };
      }

      // 建立車輛（直接 approved）
      const { data: vehicle, error: createError } = await supabaseAdmin
        .from('vehicles')
        .insert({
          owner_dealer_id: input.owner_dealer_id,
          brand_id: input.brand_id,
          spec_id: input.spec_id,
          model_id: input.model_id,
          year: input.year,
          listing_price: input.listing_price,
          acquisition_cost: input.acquisition_cost ?? null,
          repair_cost: input.repair_cost ?? null,
          description: input.description ?? '',
          status: 'approved' as VehicleStatus, // 直接通過
          images: [],
        })
        .select()
        .single();

      if (createError) {
        console.error('[AuditService] ProxyCreate error:', createError);

        // 處理階層驗證錯誤
        if (createError.message.includes('HIERARCHY_VIOLATION')) {
          return {
            success: false,
            error: { code: 'HIERARCHY_VIOLATION', message: '品牌/規格/車型階層不一致' },
          };
        }

        return {
          success: false,
          error: { code: 'DB_ERROR', message: createError.message },
        };
      }

      // 寫入稽核日誌
      await this.writeAuditLog({
        user_id: adminId,
        action: 'VEHICLE_APPROVED', // 代建等同核准
        target_type: 'vehicle',
        target_id: vehicle.id,
        details: {
          proxy_create: true,
          owner_dealer_id: input.owner_dealer_id,
          created_by_admin: adminId,
        },
      });

      return { success: true, data: vehicle as Vehicle };
    } catch (err) {
      console.error('[AuditService] ProxyCreate exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '代客建檔失敗' },
      };
    }
  },

  /**
   * 寫入稽核日誌
   */
  async writeAuditLog(
    log: Omit<AuditLog, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: log.user_id,
          action: log.action,
          target_type: log.target_type,
          target_id: log.target_id,
          details: log.details,
        });

      if (error) {
        console.error('[AuditService] WriteAuditLog error:', error);
        // 不拋錯，避免影響主流程
      }
    } catch (err) {
      console.error('[AuditService] WriteAuditLog exception:', err);
    }
  },

  /**
   * 發送通知（內部方法）
   */
  async sendNotification(params: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: params.user_id,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data ?? null,
          is_read: false,
        });

      if (error) {
        console.error('[AuditService] SendNotification error:', error);
        // 不拋錯，避免影響主流程
      }
    } catch (err) {
      console.error('[AuditService] SendNotification exception:', err);
    }
  },

  /**
   * 取得稽核日誌列表（Admin 專用）
   */
  async getAuditLogs(
    query: {
      cursor?: string;
      limit?: number;
      action?: AuditAction;
      target_type?: string;
      user_id?: string;
    }
  ): Promise<ServiceResult<{
    logs: AuditLog[];
    nextCursor: string | null;
    hasMore: boolean;
  }>> {
    try {
      const { cursor, limit = 50, action, target_type, user_id } = query;

      let queryBuilder = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (cursor) {
        const { data: cursorLog } = await supabaseAdmin
          .from('audit_logs')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorLog) {
          queryBuilder = queryBuilder.lt('created_at', cursorLog.created_at);
        }
      }

      if (action) {
        queryBuilder = queryBuilder.eq('action', action);
      }

      if (target_type) {
        queryBuilder = queryBuilder.eq('target_type', target_type);
      }

      if (user_id) {
        queryBuilder = queryBuilder.eq('user_id', user_id);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[AuditService] GetAuditLogs error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      const hasMore = data.length > limit;
      const logs = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? logs[logs.length - 1]?.id : null;

      return {
        success: true,
        data: {
          logs: logs as AuditLog[],
          nextCursor,
          hasMore,
        },
      };
    } catch (err) {
      console.error('[AuditService] GetAuditLogs exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得稽核日誌失敗' },
      };
    }
  },
};

export default auditService;
