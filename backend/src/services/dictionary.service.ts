/**
 * FaCai-B Platform - Dictionary Service
 * File: backend/src/services/dictionary.service.ts
 * 
 * 字典檔（品牌/規格/車型）管理業務邏輯
 */

import { supabaseAdmin } from '../config/supabase';
import { 
  Brand, 
  Spec, 
  Model,
  DictionaryRequest,
  DictionaryRequestType,
  DictionaryRequestStatus,
} from '../types';
import { notificationService } from './notification.service';

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface DictionaryRequestDetail extends DictionaryRequest {
  requester: {
    id: string;
    company_name: string;
    email: string;
  };
  parent_brand?: Brand;
  parent_spec?: Spec;
}

export interface CreateDictionaryRequestInput {
  request_type: DictionaryRequestType;
  parent_id?: string;
  suggested_name: string;
}

export interface CreateBrandInput {
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateSpecInput {
  brand_id: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateModelInput {
  spec_id: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================================
// Dictionary Service
// ============================================================================

export const dictionaryService = {
  // ==========================================================================
  // Public API - 查詢字典
  // ==========================================================================

  /**
   * 取得品牌列表
   */
  async getBrands(
    includeInactive: boolean = false
  ): Promise<ServiceResult<Brand[]>> {
    try {
      let queryBuilder = supabaseAdmin
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (!includeInactive) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[DictionaryService] GetBrands error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Brand[] };
    } catch (err) {
      console.error('[DictionaryService] GetBrands exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得品牌列表失敗' },
      };
    }
  },

  /**
   * 取得規格列表（依品牌篩選）
   */
  async getSpecs(
    brandId: string,
    includeInactive: boolean = false
  ): Promise<ServiceResult<Spec[]>> {
    try {
      let queryBuilder = supabaseAdmin
        .from('specs')
        .select('*')
        .eq('brand_id', brandId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (!includeInactive) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[DictionaryService] GetSpecs error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Spec[] };
    } catch (err) {
      console.error('[DictionaryService] GetSpecs exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得規格列表失敗' },
      };
    }
  },

  /**
   * 取得車型列表（依規格篩選）
   */
  async getModels(
    specId: string,
    includeInactive: boolean = false
  ): Promise<ServiceResult<Model[]>> {
    try {
      let queryBuilder = supabaseAdmin
        .from('models')
        .select('*')
        .eq('spec_id', specId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (!includeInactive) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[DictionaryService] GetModels error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Model[] };
    } catch (err) {
      console.error('[DictionaryService] GetModels exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得車型列表失敗' },
      };
    }
  },

  // ==========================================================================
  // User API - 字典申請
  // ==========================================================================

  /**
   * 建立字典申請
   */
  async createRequest(
    input: CreateDictionaryRequestInput,
    requesterId: string
  ): Promise<ServiceResult<DictionaryRequest>> {
    try {
      // 驗證 parent_id（如果有的話）
      if (input.request_type === 'spec' && input.parent_id) {
        const { data: brand } = await supabaseAdmin
          .from('brands')
          .select('id')
          .eq('id', input.parent_id)
          .single();

        if (!brand) {
          return {
            success: false,
            error: { code: 'PARENT_NOT_FOUND', message: '找不到指定的品牌' },
          };
        }
      }

      if (input.request_type === 'model' && input.parent_id) {
        const { data: spec } = await supabaseAdmin
          .from('specs')
          .select('id')
          .eq('id', input.parent_id)
          .single();

        if (!spec) {
          return {
            success: false,
            error: { code: 'PARENT_NOT_FOUND', message: '找不到指定的規格' },
          };
        }
      }

      const { data, error } = await supabaseAdmin
        .from('dictionary_requests')
        .insert({
          requester_id: requesterId,
          request_type: input.request_type,
          parent_id: input.parent_id ?? null,
          suggested_name: input.suggested_name,
          status: 'pending' as DictionaryRequestStatus,
        })
        .select()
        .single();

      if (error) {
        console.error('[DictionaryService] CreateRequest error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as DictionaryRequest };
    } catch (err) {
      console.error('[DictionaryService] CreateRequest exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '建立字典申請失敗' },
      };
    }
  },

  /**
   * 取得我的字典申請
   */
  async getMyRequests(
    userId: string
  ): Promise<ServiceResult<DictionaryRequest[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('dictionary_requests')
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DictionaryService] GetMyRequests error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as DictionaryRequest[] };
    } catch (err) {
      console.error('[DictionaryService] GetMyRequests exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得字典申請失敗' },
      };
    }
  },

  // ==========================================================================
  // Admin API - 字典申請審核
  // ==========================================================================

  /**
   * 取得所有字典申請（Admin）
   */
  async getAllRequests(
    status?: DictionaryRequestStatus
  ): Promise<ServiceResult<DictionaryRequestDetail[]>> {
    try {
      let queryBuilder = supabaseAdmin
        .from('dictionary_requests')
        .select(`
          *,
          requester:users!dictionary_requests_requester_id_fkey(
            id, 
            company_name, 
            email
          )
        `)
        .order('created_at', { ascending: true });

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[DictionaryService] GetAllRequests error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as DictionaryRequestDetail[] };
    } catch (err) {
      console.error('[DictionaryService] GetAllRequests exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得字典申請失敗' },
      };
    }
  },

  /**
   * 核准字典申請（Admin）
   */
  async approveRequest(
    requestId: string,
    adminId: string
  ): Promise<ServiceResult<{ request: DictionaryRequest; created: Brand | Spec | Model }>> {
    try {
      // 取得申請詳情
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('dictionary_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該字典申請' },
        };
      }

      if (request.status !== 'pending') {
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `只能審核待審核狀態的申請，目前狀態: ${request.status}` 
          },
        };
      }

      // 建立字典項目
      let created: Brand | Spec | Model;

      if (request.request_type === 'brand') {
        const { data: brand, error: createError } = await supabaseAdmin
          .from('brands')
          .insert({
            name: request.suggested_name,
            sort_order: 0,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('[DictionaryService] Create brand error:', createError);
          return {
            success: false,
            error: { code: 'DB_ERROR', message: createError.message },
          };
        }
        created = brand as Brand;
      } else if (request.request_type === 'spec') {
        if (!request.parent_id) {
          return {
            success: false,
            error: { code: 'MISSING_PARENT', message: '規格申請必須指定品牌' },
          };
        }

        const { data: spec, error: createError } = await supabaseAdmin
          .from('specs')
          .insert({
            brand_id: request.parent_id,
            name: request.suggested_name,
            sort_order: 0,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('[DictionaryService] Create spec error:', createError);
          return {
            success: false,
            error: { code: 'DB_ERROR', message: createError.message },
          };
        }
        created = spec as Spec;
      } else {
        // model
        if (!request.parent_id) {
          return {
            success: false,
            error: { code: 'MISSING_PARENT', message: '車型申請必須指定規格' },
          };
        }

        const { data: model, error: createError } = await supabaseAdmin
          .from('models')
          .insert({
            spec_id: request.parent_id,
            name: request.suggested_name,
            sort_order: 0,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('[DictionaryService] Create model error:', createError);
          return {
            success: false,
            error: { code: 'DB_ERROR', message: createError.message },
          };
        }
        created = model as Model;
      }

      // 更新申請狀態
      const { data: updatedRequest, error: updateError } = await supabaseAdmin
        .from('dictionary_requests')
        .update({ status: 'approved' as DictionaryRequestStatus })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        console.error('[DictionaryService] Update request error:', updateError);
      }

      // 發送通知
      await notificationService.send({
        user_id: request.requester_id,
        type: 'system',
        title: '字典申請已核准',
        message: `您申請新增的「${request.suggested_name}」已核准，現在可以使用了。`,
        data: {
          request_id: requestId,
          request_type: request.request_type,
          created_id: created.id,
        },
      });

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_ADDED',
          target_type: request.request_type,
          target_id: created.id,
          details: {
            name: request.suggested_name,
            request_id: requestId,
            requester_id: request.requester_id,
          },
        });

      return { 
        success: true, 
        data: { 
          request: updatedRequest as DictionaryRequest, 
          created,
        } 
      };
    } catch (err) {
      console.error('[DictionaryService] ApproveRequest exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '核准字典申請失敗' },
      };
    }
  },

  /**
   * 拒絕字典申請（Admin）
   */
  async rejectRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<ServiceResult<DictionaryRequest>> {
    try {
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('dictionary_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該字典申請' },
        };
      }

      if (request.status !== 'pending') {
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `只能審核待審核狀態的申請，目前狀態: ${request.status}` 
          },
        };
      }

      // 更新申請狀態
      const { data: updatedRequest, error: updateError } = await supabaseAdmin
        .from('dictionary_requests')
        .update({ status: 'rejected' as DictionaryRequestStatus })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        console.error('[DictionaryService] Reject request error:', updateError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      // 發送通知
      await notificationService.send({
        user_id: request.requester_id,
        type: 'system',
        title: '字典申請未通過',
        message: `您申請新增的「${request.suggested_name}」未通過，原因：${reason}`,
        data: {
          request_id: requestId,
          request_type: request.request_type,
          rejection_reason: reason,
        },
      });

      // 寫入稽核日誌（拒絕不算 DICTIONARY_ADDED）
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_DELETED', // 用 DELETED 表示拒絕
          target_type: 'dictionary_request',
          target_id: requestId,
          details: {
            suggested_name: request.suggested_name,
            request_type: request.request_type,
            requester_id: request.requester_id,
            rejection_reason: reason,
          },
        });

      return { success: true, data: updatedRequest as DictionaryRequest };
    } catch (err) {
      console.error('[DictionaryService] RejectRequest exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '拒絕字典申請失敗' },
      };
    }
  },

  // ==========================================================================
  // Admin API - 字典管理 CRUD
  // ==========================================================================

  /**
   * 新增品牌（Admin）
   */
  async createBrand(
    input: CreateBrandInput,
    adminId: string
  ): Promise<ServiceResult<Brand>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('brands')
        .insert({
          name: input.name,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('[DictionaryService] CreateBrand error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_ADDED',
          target_type: 'brand',
          target_id: data.id,
          details: { name: input.name },
        });

      return { success: true, data: data as Brand };
    } catch (err) {
      console.error('[DictionaryService] CreateBrand exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '新增品牌失敗' },
      };
    }
  },

  /**
   * 更新品牌（Admin）
   */
  async updateBrand(
    brandId: string,
    input: Partial<CreateBrandInput>,
    adminId: string
  ): Promise<ServiceResult<Brand>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('brands')
        .update(input)
        .eq('id', brandId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該品牌' },
          };
        }
        console.error('[DictionaryService] UpdateBrand error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_UPDATED',
          target_type: 'brand',
          target_id: brandId,
          details: input,
        });

      return { success: true, data: data as Brand };
    } catch (err) {
      console.error('[DictionaryService] UpdateBrand exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新品牌失敗' },
      };
    }
  },

  /**
   * 新增規格（Admin）
   */
  async createSpec(
    input: CreateSpecInput,
    adminId: string
  ): Promise<ServiceResult<Spec>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('specs')
        .insert({
          brand_id: input.brand_id,
          name: input.name,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('[DictionaryService] CreateSpec error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_ADDED',
          target_type: 'spec',
          target_id: data.id,
          details: { name: input.name, brand_id: input.brand_id },
        });

      return { success: true, data: data as Spec };
    } catch (err) {
      console.error('[DictionaryService] CreateSpec exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '新增規格失敗' },
      };
    }
  },

  /**
   * 更新規格（Admin）
   */
  async updateSpec(
    specId: string,
    input: Partial<Omit<CreateSpecInput, 'brand_id'>>,
    adminId: string
  ): Promise<ServiceResult<Spec>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('specs')
        .update(input)
        .eq('id', specId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該規格' },
          };
        }
        console.error('[DictionaryService] UpdateSpec error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_UPDATED',
          target_type: 'spec',
          target_id: specId,
          details: input,
        });

      return { success: true, data: data as Spec };
    } catch (err) {
      console.error('[DictionaryService] UpdateSpec exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新規格失敗' },
      };
    }
  },

  /**
   * 新增車型（Admin）
   */
  async createModel(
    input: CreateModelInput,
    adminId: string
  ): Promise<ServiceResult<Model>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('models')
        .insert({
          spec_id: input.spec_id,
          name: input.name,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('[DictionaryService] CreateModel error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_ADDED',
          target_type: 'model',
          target_id: data.id,
          details: { name: input.name, spec_id: input.spec_id },
        });

      return { success: true, data: data as Model };
    } catch (err) {
      console.error('[DictionaryService] CreateModel exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '新增車型失敗' },
      };
    }
  },

  /**
   * 更新車型（Admin）
   */
  async updateModel(
    modelId: string,
    input: Partial<Omit<CreateModelInput, 'spec_id'>>,
    adminId: string
  ): Promise<ServiceResult<Model>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('models')
        .update(input)
        .eq('id', modelId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該車型' },
          };
        }
        console.error('[DictionaryService] UpdateModel error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_UPDATED',
          target_type: 'model',
          target_id: modelId,
          details: input,
        });

      return { success: true, data: data as Model };
    } catch (err) {
      console.error('[DictionaryService] UpdateModel exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新車型失敗' },
      };
    }
  },
};

export default dictionaryService;
