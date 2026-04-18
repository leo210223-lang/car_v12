/**
 * FaCai-B Platform - Shop/Service Hook
 * File: frontend/src/hooks/useShop.ts
 *
 * 商城商品與服務管理 Hook（Real API）
 */

'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { ShopProduct, ShopProductCategory } from '@/types';

interface UseShopProductsOptions {
  includeInactive?: boolean;
}

export function useShopProducts(
  category?: ShopProductCategory,
  options: UseShopProductsOptions = {}
) {
  const includeInactive = options.includeInactive ?? false;
  const endpoint = includeInactive ? '/admin/shop' : '/shop';
  const { data, error, isLoading, mutate } = useSWR(
    `${endpoint}?category=${category || 'all'}&includeInactive=${includeInactive ? '1' : '0'}`,
    async () => {
      const result = await api.request<ShopProduct[]>(endpoint, {
        method: 'GET',
        cache: 'no-store',
        params: {
          category,
        },
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || '取得商城商品失敗');
      }

      return result.data;
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );
  return {
    products: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useShopProduct(id: string, includeInactive = false) {
  const endpoint = includeInactive ? '/admin/shop' : '/shop';
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${endpoint}/${id}` : null,
    async () => {
      const result = await api.request<ShopProduct>(`${endpoint}/${id}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!result.success || !result.data) {
        return null;
      }

      return result.data;
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );
  return {
    product: data ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useShopProductActions() {
  // 切換啟用/停用
  const toggleStatus = async (id: string, is_active: boolean) => {
    return api.put<ShopProduct>(`/admin/shop/${id}`, { is_active });
  };
  return { toggleStatus };
}
