/**
 * FaCai-B Platform - Shop Service
 * File: backend/src/services/shop.service.ts
 * 
 * 商城商品管理服務
 */

import { supabaseAdmin } from '../config/supabase';
import { ShopProduct, ShopProductCategory } from '../types';

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

export interface ShopListResult {
  products: ShopProduct[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ShopListQuery {
  cursor?: string;
  limit?: number;
  category?: ShopProductCategory;
  includeInactive?: boolean;
}

export interface CreateShopProductInput {
  category: ShopProductCategory;
  name: string;
  image_url: string;
  purchase_url: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateShopProductInput {
  category?: ShopProductCategory;
  name?: string;
  image_url?: string;
  purchase_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================================
// Shop Service
// ============================================================================

export const shopService = {
  /**
   * 取得商品列表
   */
  async list(
    query: ShopListQuery
  ): Promise<ServiceResult<ShopListResult>> {
    try {
      const { cursor, limit = 20, category, includeInactive = false } = query;

      let queryBuilder = supabaseAdmin
        .from('shop_products')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      // 游標分頁
      if (cursor) {
        const { data: cursorProduct } = await supabaseAdmin
          .from('shop_products')
          .select('sort_order, created_at')
          .eq('id', cursor)
          .single();

        if (cursorProduct) {
          queryBuilder = queryBuilder.or(
            `sort_order.gt.${cursorProduct.sort_order},` +
            `and(sort_order.eq.${cursorProduct.sort_order},created_at.lt.${cursorProduct.created_at})`
          );
        }
      }

      // 分類篩選
      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      // 預設只顯示啟用的商品
      if (!includeInactive) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[ShopService] List error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 處理分頁
      const hasMore = data.length > limit;
      const products = hasMore ? data.slice(0, limit) : data;
      const nextCursor = hasMore ? products[products.length - 1]?.id : null;

      return {
        success: true,
        data: {
          products: products as ShopProduct[],
          nextCursor,
          hasMore,
          total: count ?? undefined,
        },
      };
    } catch (err) {
      console.error('[ShopService] List exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得商品列表失敗' },
      };
    }
  },

  /**
   * 取得單一商品
   */
  async getById(
    productId: string
  ): Promise<ServiceResult<ShopProduct>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('shop_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: '找不到該商品' },
          };
        }
        console.error('[ShopService] GetById error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return { success: true, data: data as ShopProduct };
    } catch (err) {
      console.error('[ShopService] GetById exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得商品失敗' },
      };
    }
  },

  /**
   * 新增商品（Admin）
   */
  async create(
    input: CreateShopProductInput,
    adminId: string
  ): Promise<ServiceResult<ShopProduct>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('shop_products')
        .insert({
          category: input.category,
          name: input.name,
          image_url: input.image_url,
          purchase_url: input.purchase_url,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('[ShopService] Create error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_ADDED',
          target_type: 'shop_product',
          target_id: data.id,
          details: {
            name: input.name,
            category: input.category,
          },
        });

      return { success: true, data: data as ShopProduct };
    } catch (err) {
      console.error('[ShopService] Create exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '新增商品失敗' },
      };
    }
  },

  /**
   * 更新商品（Admin）
   */
  async update(
    productId: string,
    input: UpdateShopProductInput,
    adminId: string
  ): Promise<ServiceResult<ShopProduct>> {
    try {
      // 先檢查商品是否存在
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('shop_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該商品' },
        };
      }

      // 執行更新
      const { data, error } = await supabaseAdmin
        .from('shop_products')
        .update(input)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('[ShopService] Update error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_UPDATED',
          target_type: 'shop_product',
          target_id: productId,
          details: {
            previous: existing,
            updated: input,
          },
        });

      return { success: true, data: data as ShopProduct };
    } catch (err) {
      console.error('[ShopService] Update exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新商品失敗' },
      };
    }
  },

  /**
   * 刪除商品（Admin）
   */
  async delete(
    productId: string,
    adminId: string
  ): Promise<ServiceResult<void>> {
    try {
      // 先檢查商品是否存在
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('shop_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到該商品' },
        };
      }

      // 執行刪除
      const { error } = await supabaseAdmin
        .from('shop_products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('[ShopService] Delete error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_DELETED',
          target_type: 'shop_product',
          target_id: productId,
          details: {
            name: existing.name,
            category: existing.category,
          },
        });

      return { success: true };
    } catch (err) {
      console.error('[ShopService] Delete exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '刪除商品失敗' },
      };
    }
  },
};

export default shopService;
