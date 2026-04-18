'use client';

import { useCallback, useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { api, ApiResponse } from '@/lib/api';

interface UseInfiniteScrollOptions<T> {
  /** API 端點路徑 */
  endpoint: string;
  /** 每頁筆數，預設 20 */
  limit?: number;
  /** 額外的查詢參數 */
  params?: Record<string, string | number | boolean | undefined>;
  /** 資料轉換函數 */
  transform?: (data: T[]) => T[];
}

/**
 * 無限滾動 Hook
 */
export function useInfiniteScroll<T>({
  endpoint,
  limit = 20,
  params = {},
  transform,
}: UseInfiniteScrollOptions<T>) {
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 建立查詢參數字串
  const buildQueryString = (cursor?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    
    if (cursor) {
      queryParams.set('cursor', cursor);
    }
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.set(key, String(value));
      }
    });
    
    return queryParams.toString();
  };

  // SWR fetcher（僅使用真實 API）
  const fetcher = async (url: string): Promise<ApiResponse<T[]>> => {
    try {
      const res = await api.get<T[]>(url);
      if (res.success) {
        return res;
      }
      console.error('[useInfiniteScroll] API request failed:', res.message || res.code || 'UNKNOWN_ERROR');
    } catch (error) {
      console.error('[useInfiniteScroll] Request exception:', error);
    }
    return {
      success: true,
      data: [],
      meta: {
        hasMore: false,
        nextCursor: null,
        total: 0,
      },
    } as ApiResponse<T[]>;
  };

  // SWR Infinite 的 key 函數
  const getKey = (pageIndex: number, previousPageData: ApiResponse<T[]> | null) => {
    // 已到達最後一頁
    if (previousPageData && !previousPageData.meta?.nextCursor) {
      setHasMore(false);
      return null;
    }
    
    // 第一頁
    if (pageIndex === 0) {
      return `${endpoint}?${buildQueryString()}`;
    }
    
    // 後續頁面
    return `${endpoint}?${buildQueryString(previousPageData?.meta?.nextCursor ?? undefined)}`;
  };

  const {
    data: pages,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<ApiResponse<T[]>>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateFirstPage: true,
      dedupingInterval: 0,
    }
  );

  // 合併所有頁面的資料
  const data = pages
    ? pages.flatMap((page) => {
        const items = page.data || [];
        return transform ? transform(items) : items;
      })
    : [];

  // 載入更多
  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) {
      setSize(size + 1);
    }
  }, [isValidating, hasMore, size, setSize]);

  // Intersection Observer 回調
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isValidating) return;
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      
      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isValidating, hasMore, loadMore]
  );

  // 重置並重新載入
  const reset = useCallback(() => {
    setHasMore(true);
    setSize(1);
    mutate();
  }, [setSize, mutate]);

  return {
    data,
    isLoading: !pages && !error,
    isLoadingMore: isValidating && pages && pages.length > 0,
    isError: !!error,
    error,
    hasMore,
    loadMore,
    lastElementRef,
    reset,
    refresh: mutate,
  };
}
