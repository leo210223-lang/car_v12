/**
 * FaCai-B Platform - Vehicle Service
 * File: backend/src/services/vehicle.service.ts
 * 
 * 車輛 CRUD 業務邏輯
 */

import { supabaseAdmin } from '../config/supabase';
import { 
  Vehicle, 
  VehicleDetail, 
  VehicleStatus 
} from '../types';
import { 
  CreateVehicleInput, 
  UpdateVehicleInput, 
  VehicleListQuery 
} from '../utils/validation';

// ============================================================================
// Types
// ============================================================================

export interface VehicleListResult {
  vehicles: VehicleDetail[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 將 VehicleDetail 轉換為前端期望的扁平格式
 * 將嵌套的 brand、spec、model 對象轉換為 brand_name、spec_name、model_name
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
    // 保留原始嵌套對象以便向後兼容
    brand: vehicle.brand,
    spec: vehicle.spec,
    model: vehicle.model,
    owner,
  };
}

// ============================================================================
// Vehicle Service
// ============================================================================

export const vehicleService = {
  /**
   * 取得車輛列表（支援游標分頁）
   */
  async list(
    query: VehicleListQuery,
    userId?: string
  ): Promise<ServiceResult<VehicleListResult>> {
    try {
      const { 
        cursor, 
        limit = 20, 
        status, 
        search,
        brand_id, 
        spec_id, 
        model_id,
        year_from,
        year_to,
        price_min,
        price_max,
        owner_only 
      } = query;

      let queryBuilder = supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          brand:brands!vehicles_brand_id_fkey(id, name),
          spec:specs!vehicles_spec_id_fkey(id, name),
          model:models!vehicles_model_id_fkey(id, name),
          owner:users!vehicles_owner_dealer_id_fkey(id, name, company_name, phone)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      // 游標分頁
      if (cursor) {
        const { data: cursorVehicle } = await supabaseAdmin
          .from('vehicles')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorVehicle) {
          queryBuilder = queryBuilder.lt('created_at', cursorVehicle.created_at);
        }
      }

      // 篩選條件
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      } else {
        // 預設只顯示已核准的車輛（除非指定 owner_only）
        if (!owner_only) {
          queryBuilder = queryBuilder.eq('status', 'approved');
        }
      }

      if (brand_id) {
        queryBuilder = queryBuilder.eq('brand_id', brand_id);
      }

      if (spec_id) {
        queryBuilder = queryBuilder.eq('spec_id', spec_id);
      }

      if (model_id) {
        queryBuilder = queryBuilder.eq('model_id', model_id);
      }

      if (year_from) {
        queryBuilder = queryBuilder.gte('year', year_from);
      }

      if (year_to) {
        queryBuilder = queryBuilder.lte('year', year_to);
      }

      if (price_min) {
        queryBuilder = queryBuilder.gte('listing_price', price_min);
      }

      if (price_max) {
        queryBuilder = queryBuilder.lte('listing_price', price_max);
      }

      // 關鍵字搜尋（整合在主列表 API，支援與其他篩選條件複合）
      const normalizedSearch = search?.trim();
      if (normalizedSearch) {
        const [brandRes, specRes, modelRes] = await Promise.all([
          supabaseAdmin
            .from('brands')
            .select('id')
            .ilike('name', `%${normalizedSearch}%`),
          supabaseAdmin
            .from('specs')
            .select('id')
            .ilike('name', `%${normalizedSearch}%`),
          supabaseAdmin
            .from('models')
            .select('id')
            .ilike('name', `%${normalizedSearch}%`),
        ]);

        if (brandRes.error || specRes.error || modelRes.error) {
          const dbError = brandRes.error || specRes.error || modelRes.error;
          console.error('[VehicleService] Keyword lookup error:', dbError);
          return {
            success: false,
            error: { code: 'DB_ERROR', message: dbError?.message || '關鍵字搜尋失敗' },
          };
        }

        const matchedBrandIds = brandRes.data?.map((b) => b.id) || [];
        const matchedSpecIds = specRes.data?.map((s) => s.id) || [];
        const matchedModelIds = modelRes.data?.map((m) => m.id) || [];

        const escapedSearch = normalizedSearch.replace(/,/g, ' ');
        const orConditions: string[] = [
          `description.ilike.%${escapedSearch}%`,
        ];

        if (matchedBrandIds.length > 0) {
          orConditions.push(`brand_id.in.(${matchedBrandIds.join(',')})`);
        }
        if (matchedSpecIds.length > 0) {
          orConditions.push(`spec_id.in.(${matchedSpecIds.join(',')})`);
        }
        if (matchedModelIds.length > 0) {
          orConditions.push(`model_id.in.(${matchedModelIds.join(',')})`);
        }

        queryBuilder = queryBuilder.or(orConditions.join(','));
      }

      // 只顯示自己的車輛
      if (owner_only) {
        if (!userId) {
          return {
            success: false,
            error: { code: 'FORBIDDEN', message: '需登入後才能查詢我的車輛' },
          };
        }
        queryBuilder = queryBuilder.eq('owner_dealer_id', userId);
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[VehicleService] List error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 處理分頁
      const hasMore = data.length > limit;
      const vehicles = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? vehicles[vehicles.length - 1]?.id : null;

      // 隱藏非擁有者的成本資訊並轉換為扁平格式
      const processedVehicles = vehicles.map((v) => {
        const vehicle: any = {
          ...v,
        };
        
        // 隱藏非擁有者的成本資訊
        if (!userId || v.owner_dealer_id !== userId) {
          vehicle.acquisition_cost = null;
          vehicle.repair_cost = null;
        }
        
        // 轉換為扁平格式
        return flattenVehicleDetail(vehicle);
      });

      return {
        success: true,
        data: {
          vehicles: processedVehicles,
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[VehicleService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得車輛列表失敗' },
      };
    }
  },

  /**
   * 模糊搜尋車輛
   */
  async search(
    keyword: string,
    limit: number = 20,
    cursor?: string
  ): Promise<ServiceResult<VehicleListResult>> {
    try {
      // 使用 Supabase 的全文搜尋或 ILIKE
      let queryBuilder = supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          brand:brands!vehicles_brand_id_fkey(id, name),
          spec:specs!vehicles_spec_id_fkey(id, name),
          model:models!vehicles_model_id_fkey(id, name),
          owner:users!vehicles_owner_dealer_id_fkey(id, name, company_name, phone)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      // 呼叫自訂搜尋函數或使用關聯搜尋
      const { data: brandMatches } = await supabaseAdmin
        .from('brands')
        .select('id')
        .ilike('name', `%${keyword}%`);

      const { data: specMatches } = await supabaseAdmin
        .from('specs')
        .select('id')
        .ilike('name', `%${keyword}%`);

      const { data: modelMatches } = await supabaseAdmin
        .from('models')
        .select('id')
        .ilike('name', `%${keyword}%`);

      const brandIds = brandMatches?.map((b) => b.id) || [];
      const specIds = specMatches?.map((s) => s.id) || [];
      const modelIds = modelMatches?.map((m) => m.id) || [];

      // 組合 OR 條件
      const orConditions: string[] = [];
      if (brandIds.length > 0) {
        orConditions.push(`brand_id.in.(${brandIds.join(',')})`);
      }
      if (specIds.length > 0) {
        orConditions.push(`spec_id.in.(${specIds.join(',')})`);
      }
      if (modelIds.length > 0) {
        orConditions.push(`model_id.in.(${modelIds.join(',')})`);
      }

      if (orConditions.length === 0) {
        return {
          success: true,
          data: { vehicles: [], nextCursor: null, hasMore: false },
        };
      }

      queryBuilder = queryBuilder.or(orConditions.join(','));

      if (cursor) {
        const { data: cursorVehicle } = await supabaseAdmin
          .from('vehicles')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorVehicle) {
          queryBuilder = queryBuilder.lt('created_at', cursorVehicle.created_at);
        }
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[VehicleService] Search error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      const hasMore = data.length > limit;
      const vehicles = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? vehicles[vehicles.length - 1]?.id : null;

      // 隱藏成本資訊並轉換為扁平格式（搜尋結果一律隱藏成本）
      const processedVehicles = vehicles.map((v) => {
        const vehicle: any = {
          ...v,
          acquisition_cost: null,
          repair_cost: null,
        };
        return flattenVehicleDetail(vehicle);
      });

      return {
        success: true,
        data: { vehicles: processedVehicles, nextCursor, hasMore },
      };
    } catch (err) {
      console.error('[VehicleService] Search exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '搜尋車輛失敗' },
      };
    }
  },

  /**
   * 取得單一車輛詳情
   */
  async getById(
    vehicleId: string,
    userId?: string
  ): Promise<ServiceResult<VehicleDetail>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          brand:brands!vehicles_brand_id_fkey(id, name),
          spec:specs!vehicles_spec_id_fkey(id, name),
          model:models!vehicles_model_id_fkey(id, name),
          owner:users!vehicles_owner_dealer_id_fkey(id, name, company_name, phone)
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
        console.error('[VehicleService] GetById error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 隱藏非擁有者的成本資訊並轉換為扁平格式
      const vehicle: any = { ...data };
      if (!userId || data.owner_dealer_id !== userId) {
        vehicle.acquisition_cost = null;
        vehicle.repair_cost = null;
      }

      return { success: true, data: flattenVehicleDetail(vehicle) };
    } catch (err) {
      console.error('[VehicleService] GetById exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得車輛詳情失敗' },
      };
    }
  },

  /**
   * 新增車輛
   */
  async create(
    input: CreateVehicleInput,
    ownerId: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .insert({
          owner_dealer_id: ownerId,
          brand_id: input.brand_id,
          spec_id: input.spec_id,
          model_id: input.model_id,
          year: input.year,
          mileage: input.mileage ?? null,
          color: input.color ?? null,
          transmission: input.transmission ?? null,
          fuel_type: input.fuel_type ?? null,
          listing_price: input.listing_price ?? null,
          acquisition_cost: input.acquisition_cost ?? null,
          repair_cost: input.repair_cost ?? null,
          description: input.description ?? '',
          status: 'pending' as VehicleStatus,
          images: [],
        })
        .select()
        .single();

      if (error) {
        console.error('[VehicleService] Create error:', error);
        
        // 處理階層驗證錯誤
        if (error.message.includes('HIERARCHY_VIOLATION')) {
          return {
            success: false,
            error: { code: 'HIERARCHY_VIOLATION', message: '品牌/規格/車型階層不一致' },
          };
        }

        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Vehicle };
    } catch (err) {
      console.error('[VehicleService] Create exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '新增車輛失敗' },
      };
    }
  },

  /**
   * 更新車輛
   */
  async update(
    vehicleId: string,
    input: UpdateVehicleInput,
    userId: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      // 先檢查擁有權
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('owner_dealer_id, status')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該車輛' },
        };
      }

      if (existing.owner_dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該車輛的擁有者' },
        };
      }

      // 執行更新
      const updateData: Partial<Vehicle> = {};
      if (input.mileage !== undefined) {
        updateData.mileage = input.mileage;
      }
      if (input.color !== undefined) {
        updateData.color = input.color;
      }
      if (input.transmission !== undefined) {
        updateData.transmission = input.transmission;
      }
      if (input.fuel_type !== undefined) {
        updateData.fuel_type = input.fuel_type;
      }
      if (input.listing_price !== undefined) {
        updateData.listing_price = input.listing_price;
      }
      if (input.acquisition_cost !== undefined) {
        updateData.acquisition_cost = input.acquisition_cost;
      }
      if (input.repair_cost !== undefined) {
        updateData.repair_cost = input.repair_cost;
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
      }
      if (input.images !== undefined) {
        updateData.images = input.images;
      }

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('[VehicleService] Update error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Vehicle };
    } catch (err) {
      console.error('[VehicleService] Update exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新車輛失敗' },
      };
    }
  },

  /**
   * 下架車輛（設為 archived）
   */
  async archive(
    vehicleId: string,
    userId: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('owner_dealer_id, status')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該車輛' },
        };
      }

      if (existing.owner_dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該車輛的擁有者' },
        };
      }

      if (existing.status === 'archived') {
        return {
          success: false,
          error: { code: 'ALREADY_ARCHIVED', message: '該車輛已經下架' },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .update({ status: 'archived' as VehicleStatus })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('[VehicleService] Archive error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Vehicle };
    } catch (err) {
      console.error('[VehicleService] Archive exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '下架車輛失敗' },
      };
    }
  },

  /**
   * 重新送審（rejected → pending）
   */
  async resubmit(
    vehicleId: string,
    userId: string
  ): Promise<ServiceResult<Vehicle>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('owner_dealer_id, status')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該車輛' },
        };
      }

      if (existing.owner_dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該車輛的擁有者' },
        };
      }

      if (existing.status !== 'rejected') {
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: `只有被拒絕的車輛可以重新送審，目前狀態: ${existing.status}` 
          },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .update({ 
          status: 'pending' as VehicleStatus,
          rejection_reason: null,
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('[VehicleService] Resubmit error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as Vehicle };
    } catch (err) {
      console.error('[VehicleService] Resubmit exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '重新送審失敗' },
      };
    }
  },

  /**
   * 永久刪除車輛（僅 archived 狀態可刪除）
   */
  async delete(
    vehicleId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select('owner_dealer_id, status')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該車輛' },
        };
      }

      if (existing.owner_dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該車輛的擁有者' },
        };
      }

      if (existing.status !== 'archived') {
        return {
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: '只有已下架的車輛可以永久刪除，請先下架' 
          },
        };
      }

      const { error } = await supabaseAdmin
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        console.error('[VehicleService] Delete error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true };
    } catch (err) {
      console.error('[VehicleService] Delete exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除車輛失敗' },
      };
    }
  },
};

export default vehicleService;
