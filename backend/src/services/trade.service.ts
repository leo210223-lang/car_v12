/**
 * FaCai-B Platform - Trade Service
 * File: backend/src/services/trade.service.ts
 * 
 * 盤車需求（調做）CRUD 業務邏輯
 */

import { supabaseAdmin } from '../config/supabase';
import { 
  TradeRequest, 
  TradeRequestDetail,
} from '../types';
import { 
  CreateTradeRequestInput, 
  UpdateTradeRequestInput,
  TradeListQuery,
} from '../utils/validation';

// ============================================================================
// Types
// ============================================================================

export interface TradeListResult {
  trades: TradeRequestDetail[];
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
// Trade Service
// ============================================================================

export const tradeService = {
  /**
   * 取得調做列表（排除停權車行）
   */
  async list(
    query: TradeListQuery,
    userId?: string
  ): Promise<ServiceResult<TradeListResult>> {
    try {
      const { 
        cursor, 
        limit = 20, 
        brand_id,
        is_active,
        my_only,
        status,
      } = query;

      let queryBuilder = supabaseAdmin
        .from('trade_requests')
        .select(`
          *,
          dealer:users!trade_requests_dealer_id_fkey(
            id, 
            name,
            company_name, 
            phone, 
            status
          ),
          brand:brands!trade_requests_target_brand_id_fkey(id, name),
          model:models!trade_requests_target_model_id_fkey(id, name),
          target_brand:brands!trade_requests_target_brand_id_fkey(id, name),
          target_spec:specs!trade_requests_target_spec_id_fkey(id, name),
          target_model:models!trade_requests_target_model_id_fkey(id, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      // 游標分頁
      if (cursor) {
        const { data: cursorTrade } = await supabaseAdmin
          .from('trade_requests')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorTrade) {
          queryBuilder = queryBuilder.lt('created_at', cursorTrade.created_at);
        }
      }

      // 篩選條件
      if (brand_id) {
        queryBuilder = queryBuilder.eq('target_brand_id', brand_id);
      }

      // 是否只顯示有效的
      if (is_active !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', is_active);
      } else if (!my_only) {
        // 大廳預設只顯示有效需求；我的調做不預設過濾，需保留完整紀錄
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      // 審核狀態
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      // 只顯示自己的調做
      if (my_only && userId) {
        queryBuilder = queryBuilder.eq('dealer_id', userId);
      } else if (!status) {
        // 大廳可見性：僅顯示審核通過且未過期的需求
        queryBuilder = queryBuilder
          .eq('status', 'approved')
          .gt('expires_at', new Date().toISOString());
      } else if (status === 'approved') {
        // 前端帶 status=approved 時仍要過濾未過期（與大廳一致）
        queryBuilder = queryBuilder.gt('expires_at', new Date().toISOString());
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[TradeService] List error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 過濾掉停權車行的需求（除非是自己的）
      const filteredData = data.filter((trade) => {
        // 如果是自己的調做，永遠顯示
        if (userId && trade.dealer_id === userId) {
          return true;
        }
        // 否則只顯示車行狀態為 active 的
        return trade.dealer?.status === 'active';
      });

      // 處理分頁
      const hasMore = filteredData.length > limit;
      const trades = hasMore ? filteredData.slice(0, limit) : filteredData;
      const nextCursor = hasMore ? trades[trades.length - 1]?.id : null;

      return {
        success: true,
        data: {
          trades: trades as TradeRequestDetail[],
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[TradeService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得調做列表失敗' },
      };
    }
  },

  /**
   * 取得單一調做詳情
   */
  async getById(
    tradeId: string
  ): Promise<ServiceResult<TradeRequestDetail>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .select(`
          *,
          dealer:users!trade_requests_dealer_id_fkey(
            id, 
            name,
            company_name, 
            phone
          ),
          brand:brands!trade_requests_target_brand_id_fkey(id, name),
          model:models!trade_requests_target_model_id_fkey(id, name),
          target_brand:brands!trade_requests_target_brand_id_fkey(id, name),
          target_spec:specs!trade_requests_target_spec_id_fkey(id, name),
          target_model:models!trade_requests_target_model_id_fkey(id, name)
        `)
        .eq('id', tradeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該調做需求' },
          };
        }
        console.error('[TradeService] GetById error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as TradeRequestDetail };
    } catch (err) {
      console.error('[TradeService] GetById exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得調做詳情失敗' },
      };
    }
  },

  /**
   * 發布調做需求
   */
  async create(
    input: CreateTradeRequestInput,
    dealerId: string
  ): Promise<ServiceResult<TradeRequest>> {
    try {
      // 計算預設過期時間（若未提供則 30 天後）
      const expiresAt = input.expires_at 
        ? new Date(input.expires_at).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .insert({
          dealer_id: dealerId,
          target_brand_id: input.target_brand_id,
          target_spec_id: input.target_spec_id ?? null,
          target_model_id: input.target_model_id ?? null,
          year_from: input.year_from ?? null,
          year_to: input.year_to ?? null,
          price_range_min: input.price_range_min ?? null,
          price_range_max: input.price_range_max ?? null,
          conditions: input.conditions ?? '',
          contact_info: input.contact_info,
          expires_at: expiresAt,
          is_active: true,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[TradeService] Create error:', error);

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

      return { success: true, data: data as TradeRequest };
    } catch (err) {
      console.error('[TradeService] Create exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '發布調做失敗' },
      };
    }
  },

  /**
   * 更新調做需求
   */
  async update(
    tradeId: string,
    input: UpdateTradeRequestInput,
    userId: string
  ): Promise<ServiceResult<TradeRequest>> {
    try {
      // 先檢查擁有權
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('trade_requests')
        .select('dealer_id')
        .eq('id', tradeId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該調做需求' },
        };
      }

      if (existing.dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該調做的擁有者' },
        };
      }

      // 建立更新資料
      const updateData: Partial<TradeRequest> = {};
      
      if (input.target_brand_id !== undefined) {
        updateData.target_brand_id = input.target_brand_id;
      }
      if (input.target_spec_id !== undefined) {
        updateData.target_spec_id = input.target_spec_id;
      }
      if (input.target_model_id !== undefined) {
        updateData.target_model_id = input.target_model_id;
      }
      if (input.year_from !== undefined) {
        updateData.year_from = input.year_from;
      }
      if (input.year_to !== undefined) {
        updateData.year_to = input.year_to;
      }
      if (input.price_range_min !== undefined) {
        updateData.price_range_min = input.price_range_min;
      }
      if (input.price_range_max !== undefined) {
        updateData.price_range_max = input.price_range_max;
      }
      if (input.conditions !== undefined) {
        updateData.conditions = input.conditions;
      }
      if (input.contact_info !== undefined) {
        updateData.contact_info = input.contact_info;
      }
      if (input.expires_at !== undefined) {
        updateData.expires_at = input.expires_at;
      }

      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .update(updateData)
        .eq('id', tradeId)
        .select()
        .single();

      if (error) {
        console.error('[TradeService] Update error:', error);

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

      return { success: true, data: data as TradeRequest };
    } catch (err) {
      console.error('[TradeService] Update exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新調做失敗' },
      };
    }
  },

  /**
   * 續期調做（延長 expires_at）
   */
  async extend(
    tradeId: string,
    userId: string,
    days: number = 30
  ): Promise<ServiceResult<TradeRequest>> {
    try {
      // 先檢查擁有權
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('trade_requests')
        .select('dealer_id, expires_at, is_active')
        .eq('id', tradeId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該調做需求' },
        };
      }

      if (existing.dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該調做的擁有者' },
        };
      }

      // 計算新的過期時間（從現在或原過期時間中較晚的開始計算）
      const currentExpiry = existing.expires_at 
        ? new Date(existing.expires_at) 
        : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .update({ 
          expires_at: newExpiresAt.toISOString(),
          is_active: true, // 續期時重新啟用
        })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) {
        console.error('[TradeService] Extend error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as TradeRequest };
    } catch (err) {
      console.error('[TradeService] Extend exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '續期失敗' },
      };
    }
  },

  /**
   * 停用調做（軟刪除）
   */
  async deactivate(
    tradeId: string,
    userId: string
  ): Promise<ServiceResult<TradeRequest>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('trade_requests')
        .select('dealer_id')
        .eq('id', tradeId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該調做需求' },
        };
      }

      if (existing.dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該調做的擁有者' },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .update({ is_active: false })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) {
        console.error('[TradeService] Deactivate error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as TradeRequest };
    } catch (err) {
      console.error('[TradeService] Deactivate exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '停用調做失敗' },
      };
    }
  },

  /**
   * 永久刪除調做（Hard Delete）
   */
  async delete(
    tradeId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('trade_requests')
        .select('dealer_id')
        .eq('id', tradeId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該調做需求' },
        };
      }

      if (existing.dealer_id !== userId) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '您不是該調做的擁有者' },
        };
      }

      const { error } = await supabaseAdmin
        .from('trade_requests')
        .delete()
        .eq('id', tradeId);

      if (error) {
        console.error('[TradeService] Delete error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true };
    } catch (err) {
      console.error('[TradeService] Delete exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除調做失敗' },
      };
    }
  },

  /**
   * Admin 審核調做需求
   */
  async review(
    tradeId: string,
    reviewStatus: 'approved' | 'rejected'
  ): Promise<ServiceResult<TradeRequest>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('trade_requests')
        .update({ status: reviewStatus })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該調做需求' },
          };
        }
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as TradeRequest };
    } catch (err) {
      console.error('[TradeService] Review exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '審核調做失敗' },
      };
    }
  },
};

export default tradeService;
