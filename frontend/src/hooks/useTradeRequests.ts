/**
 * FaCai-B Platform - Trade Requests Hook
 * File: frontend/src/hooks/useTradeRequests.ts
 * 
 * 提供調做需求的資料管理：列表、搜尋、新增、編輯、刪除、續期
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

// ============================================================================
// 型別定義
// ============================================================================

export interface TradeRequest {
  id: string;
  dealer_id: string;
  target_brand_id: string;
  target_spec_id: string | null;
  target_model_id: string | null;
  brand_name: string;
  spec_name: string | null;
  model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  conditions: string;
  contact_info: string;
  expires_at: string;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  brand?: { id?: string; name: string } | null;
  model?: { id?: string; name: string } | null;
  target_brand?: { id?: string; name: string } | null;
  target_spec?: { id?: string; name: string } | null;
  target_model?: { id?: string; name: string } | null;
  dealer: {
    id: string;
    name: string;
    company_name: string;
    phone: string;
  };
}

export interface TradeRequestFilters {
  brand_id?: string;
  is_active?: boolean;
  my_only?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface CreateTradeRequestInput {
  target_brand_id: string;
  target_spec_id?: string;
  target_model_id?: string;
  year_from?: number;
  year_to?: number;
  price_range_min?: number;
  price_range_max?: number;
  conditions?: string;
  contact_info: string;
  expires_days?: number; // 7, 14, 30
}

// ============================================================================
// 調做列表 Hook（無限滾動）
// ============================================================================

const PAGE_SIZE = 10;
const MY_TRADES_FILTERS: TradeRequestFilters = { my_only: true };

function normalizeTradeRequest(raw: any): TradeRequest {
  const brand =
    raw?.brand ??
    raw?.target_brand ??
    (raw?.brand_name ? { name: raw.brand_name } : null);
  const model =
    raw?.model ??
    raw?.target_model ??
    (raw?.model_name ? { name: raw.model_name } : null);
  const brandName =
    (typeof raw?.brand_name === 'string' && raw.brand_name.trim()) ||
    (typeof brand?.name === 'string' && brand.name.trim()) ||
    '';
  const specName =
    (typeof raw?.spec_name === 'string' && raw.spec_name.trim()) ||
    (typeof raw?.target_spec?.name === 'string' && raw.target_spec.name.trim()) ||
    null;
  const modelName =
    (typeof raw?.model_name === 'string' && raw.model_name.trim()) ||
    (typeof model?.name === 'string' && model.name.trim()) ||
    null;

  return {
    ...raw,
    brand_name: brandName,
    spec_name: specName,
    model_name: modelName,
    brand,
    model,
    target_brand: raw?.target_brand ?? null,
    target_spec: raw?.target_spec ?? null,
    target_model: raw?.target_model ?? null,
    dealer: {
      id: raw?.dealer?.id ?? raw?.dealer_id ?? '',
      name: raw?.dealer?.name ?? '',
      company_name:
        raw?.dealer?.company_name ??
        raw?.dealer?.shop_name ??
        '',
      phone: raw?.dealer?.phone ?? '',
    },
  } as TradeRequest;
}

/**
 * 取得調做列表（支援無限滾動與篩選）
 */
export function useTradeRequests(filters: TradeRequestFilters = {}) {
  const endpoint = filters.my_only ? '/trades/my' : '/trades';
  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.append('limit', PAGE_SIZE.toString());
    if (filters.brand_id) params.append('brand_id', filters.brand_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.status) params.append('status', filters.status);
    return params.toString();
  }, [filters.brand_id, filters.is_active, filters.status]);

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: { data: TradeRequest[]; meta: { nextCursor: string | null } } | null
    ) => {
      // 如果前一頁沒有更多資料，停止請求
      if (previousPageData && !previousPageData.meta?.nextCursor) return null;

      if (pageIndex === 0) {
        return `${endpoint}?${filterQuery}`;
      }

      const cursor = previousPageData?.meta?.nextCursor;
      if (!cursor) return null;
      return `${endpoint}?${filterQuery}&cursor=${encodeURIComponent(cursor)}`;
    },
    [endpoint, filterQuery]
  );

  const fetcher = async (url: string): Promise<{ data: TradeRequest[]; meta: { total: number; hasMore: boolean; nextCursor: string | null } }> => {
    try {
      const response = await apiClient.get<TradeRequest[]>(url);
      if (response.success) {
        const normalized = (Array.isArray(response.data) ? response.data : []).map(normalizeTradeRequest);
        return {
          data: normalized,
          meta: {
            total: response.meta?.total ?? normalized.length,
            hasMore: response.meta?.hasMore ?? false,
            nextCursor: response.meta?.nextCursor ?? null,
          },
        };
      }
      throw new Error(response.message || 'API 請求失敗');
    } catch (error) {
      console.error('[useTradeRequests] API 請求失敗:', error);
      return {
        data: [],
        meta: { total: 0, hasMore: false, nextCursor: null },
      };
    }
  };

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: true,
    revalidateOnFocus: true,
    revalidateIfStale: true,
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  // 合併所有頁面的資料（確保 page.data 是陣列，避免 undefined 元素）
  const trades = data?.flatMap(page => page.data || []) ?? [];
  const hasMore = data?.[data.length - 1]?.meta?.hasMore ?? false;
  const total = data?.[0]?.meta?.total ?? 0;

  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) {
      setSize(size + 1);
    }
  }, [setSize, size, isValidating, hasMore]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    trades,
    total,
    isLoading,
    isLoadingMore: isValidating && size > 1,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}

// ============================================================================
// 我的調做 Hook
// ============================================================================

/**
 * 取得我的調做列表
 */
export function useMyTradeRequests() {
  return useTradeRequests(MY_TRADES_FILTERS);
}

// ============================================================================
// 單一調做詳情 Hook
// ============================================================================

/**
 * 取得單一調做詳情
 */
export function useTradeRequest(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/trades/${id}` : null,
    async (url): Promise<TradeRequest> => {
      const response = await apiClient.get<TradeRequest>(url);
      if (response.success && response.data) {
        return normalizeTradeRequest(response.data);
      }
      throw new Error(response.message || '找不到資料');
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    trade: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 調做操作 Hook
// ============================================================================

/**
 * 調做操作（新增、編輯、刪除、續期）
 */
export function useTradeActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 新增調做
   */
  const createTrade = useCallback(async (input: CreateTradeRequestInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 計算到期日
      const expiresDays = input.expires_days || 7;
      const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        target_brand_id: input.target_brand_id,
        target_spec_id: input.target_spec_id,
        target_model_id: input.target_model_id,
        year_from: input.year_from,
        year_to: input.year_to,
        price_range_min: input.price_range_min,
        price_range_max: input.price_range_max,
        conditions: input.conditions,
        contact_info: input.contact_info,
        expires_at: expiresAt,
      };

      const response = await apiClient.post<{ data: TradeRequest; message: string }>('/trades', payload);
      if (!response.success) {
        const message = response.message || '新增失敗';
        setError(message);
        return { success: false, message };
      }
      return { success: true, data: response.data, message: response.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * 更新調做
   */
  const updateTrade = useCallback(async (id: string, input: Partial<CreateTradeRequestInput>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put<{ data: TradeRequest; message: string }>(`/trades/${id}`, input);
      if (!response.success) {
        const message = response.message || '更新失敗';
        setError(message);
        return { success: false, message };
      }
      return { success: true, data: response.data, message: response.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * 刪除調做（Hard Delete）
   */
  const deleteTrade = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.delete(`/trades/${id}`);
      if (!response.success) {
        const message = response.message || '刪除失敗';
        setError(message);
        return { success: false, message };
      }
      return { success: true, message: response.message || '調做已刪除' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * 續期調做
   */
  const extendTrade = useCallback(async (id: string, days: number = 7) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put<{ data: TradeRequest; message: string }>(`/trades/${id}/extend`, { days });
      if (!response.success) {
        const message = response.message || '續期失敗';
        setError(message);
        return { success: false, message };
      }
      return { success: true, data: response.data, message: response.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : '續期失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    createTrade,
    updateTrade,
    deleteTrade,
    extendTrade,
  };
}

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 計算剩餘天數
 */
export function getRemainingDays(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 判斷是否即將到期（3天內）
 */
export function isExpiringSoon(expiresAt: string): boolean {
  return getRemainingDays(expiresAt) <= 3;
}

/**
 * 判斷是否已過期
 */
export function isExpired(expiresAt: string): boolean {
  return getRemainingDays(expiresAt) < 0;
}

/**
 * 格式化價格範圍
 */
export function formatPriceRange(min?: number | null, max?: number | null): string {
  const hasMin = typeof min === 'number' && Number.isFinite(min) && min > 0;
  const hasMax = typeof max === 'number' && Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) return '不限';

  if (hasMin && !hasMax) {
    const minWan = Math.floor((min as number) / 10000);
    return minWan > 0 ? `${minWan} 萬以上` : '洽詢價格';
  }

  if (!hasMin && hasMax) {
    const maxWan = Math.floor((max as number) / 10000);
    return maxWan > 0 ? `${maxWan} 萬以下` : '洽詢價格';
  }

  const minWan = Math.floor((min as number) / 10000);
  const maxWan = Math.floor((max as number) / 10000);
  if (minWan <= 0 && maxWan <= 0) return '洽詢價格';
  return `${minWan} - ${maxWan} 萬`;
}

/**
 * 格式化年份範圍
 */
export function formatYearRange(from?: number | null, to?: number | null): string {
  if (!from && !to) return '不限年份';
  if (from && !to) return `${from} 年以後`;
  if (!from && to) return `${to} 年以前`;
  if (from === to) return `${from} 年`;
  return `${from} - ${to} 年`;
}
