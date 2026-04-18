/**
 * FaCai-B Platform - Dictionary Hook
 * File: frontend/src/hooks/useDictionary.ts
 * 
 * 提供 Admin 字典管理功能的資料管理
 *
 * 僅使用真實 API 資料來源
 */

'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { api, type ApiResponse } from '@/lib/api';
import type { Brand, Spec, Model } from './useCascadingSelect';

// ============================================================================
// 型別定義
// ============================================================================

export type DictionaryType = 'brand' | 'spec' | 'model';

export interface DictionaryRequest {
  id: string;
  user_id: string;
  request_type: DictionaryType;
  parent_id: string | null;      // brand_id 或 spec_id
  parent_name: string | null;    // 父層名稱（用於顯示）
  suggested_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  user: {
    id: string;
    shop_name: string;
    name: string;
  };
}

export interface DictionaryItem {
  id: string;
  name: string;
  is_active: boolean;
  parent_id?: string;
  parent_name?: string;
}

export interface AddDictionaryInput {
  name: string;
  parent_id?: string;
}

type DictionaryRequestApiItem = {
  id: string;
  requester_id?: string;
  request_type: DictionaryType;
  parent_id: string | null;
  suggested_name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reason?: string | null;
  created_at: string;
  requester?: {
    id?: string;
    company_name?: string;
  } | null;
};

function unwrapArray<T>(res: ApiResponse<T[]>): T[] {
  if (!res.success) {
    throw new Error(res.message || '字典 API 請求失敗');
  }
  return Array.isArray(res.data) ? res.data : [];
}

function normalizeDictionaryRequest(raw: DictionaryRequestApiItem): DictionaryRequest {
  const shopName = raw.requester?.company_name || '未知車行';
  return {
    id: raw.id,
    user_id: raw.requester_id ?? raw.requester?.id ?? '',
    request_type: raw.request_type,
    parent_id: raw.parent_id,
    parent_name: null,
    suggested_name: raw.suggested_name,
    reason: raw.reason || '未提供',
    status: raw.status,
    rejection_reason: raw.rejection_reason ?? null,
    created_at: raw.created_at,
    user: {
      id: raw.requester?.id ?? raw.requester_id ?? '',
      shop_name: shopName,
      name: shopName,
    },
  };
}

// ============================================================================
// 品牌管理 Hook
// ============================================================================

export function useBrands() {
  const { data, error, isLoading, mutate } = useSWR(
    'admin-dictionary:brands',
    async (): Promise<Brand[]> => {
      const res = await api.request<Brand[]>('/api/v1/admin/dictionary/brands', {
        method: 'GET',
        cache: 'no-store',
      });
      return unwrapArray(res);
    },
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
    }
  );

  return {
    brands: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 規格管理 Hook
// ============================================================================

export function useSpecs(brandId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    brandId ? `admin-dictionary:specs:${brandId}` : null,
    async (): Promise<Spec[]> => {
      const res = await api.request<Spec[]>('/api/v1/admin/dictionary/specs', {
        method: 'GET',
        cache: 'no-store',
        params: { brand_id: brandId },
      });
      return unwrapArray(res);
    },
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
    }
  );

  return {
    specs: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 車型管理 Hook
// ============================================================================

export function useModels(specId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    specId ? `admin-dictionary:models:${specId}` : null,
    async (): Promise<Model[]> => {
      const res = await api.request<Model[]>('/api/v1/admin/dictionary/models', {
        method: 'GET',
        cache: 'no-store',
        params: { spec_id: specId },
      });
      return unwrapArray(res);
    },
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
    }
  );

  return {
    models: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 字典操作 Hook
// ============================================================================

export function useDictionaryActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新增品牌
  const addBrand = useCallback(async (name: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/api/v1/admin/dictionary/brands', { name });
      return { success: res.success, message: res.message || (res.success ? '品牌已新增' : '新增失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 新增規格
  const addSpec = useCallback(async (name: string, brandId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/api/v1/admin/dictionary/specs', {
        name,
        brand_id: brandId,
      });
      return { success: res.success, message: res.message || (res.success ? '規格已新增' : '新增失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 新增車型
  const addModel = useCallback(async (name: string, specId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/api/v1/admin/dictionary/models', {
        name,
        spec_id: specId,
      });
      return { success: res.success, message: res.message || (res.success ? '車型已新增' : '新增失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 更新品牌
  const updateBrand = useCallback(async (id: string, name: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/admin/dictionary/brands/${id}`, { name });
      return { success: res.success, message: res.message || (res.success ? '品牌已更新' : '更新失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 更新規格
  const updateSpec = useCallback(async (id: string, name: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/admin/dictionary/specs/${id}`, { name });
      return { success: res.success, message: res.message || (res.success ? '規格已更新' : '更新失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 更新車型
  const updateModel = useCallback(async (id: string, name: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/admin/dictionary/models/${id}`, { name });
      return { success: res.success, message: res.message || (res.success ? '車型已更新' : '更新失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 切換品牌啟用狀態
  const toggleBrandActive = useCallback(async (id: string, nextActive: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/admin/dictionary/brands/${id}`, { is_active: nextActive });
      return { success: res.success, message: res.message || (res.success ? '品牌狀態已更新' : '操作失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 切換規格啟用狀態
  const toggleSpecActive = useCallback(async (id: string, nextActive: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/admin/dictionary/specs/${id}`, { is_active: nextActive });
      return { success: res.success, message: res.message || (res.success ? '規格狀態已更新' : '操作失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 切換車型啟用狀態
  const toggleModelActive = useCallback(async (id: string, nextActive: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.put(`/api/v1/admin/dictionary/models/${id}`, { is_active: nextActive });
      return { success: res.success, message: res.message || (res.success ? '車型狀態已更新' : '操作失敗') };
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    addBrand,
    addSpec,
    addModel,
    updateBrand,
    updateSpec,
    updateModel,
    toggleBrandActive,
    toggleSpecActive,
    toggleModelActive,
    isSubmitting,
    error,
  };
}

// ============================================================================
// 字典申請 Hook
// ============================================================================

export function useDictionaryRequests(status: 'pending' | 'all' = 'pending') {
  const { data, error, isLoading, mutate } = useSWR(
    `admin-dictionary:requests:${status}`,
    async (): Promise<DictionaryRequest[]> => {
      const res = await api.request<DictionaryRequestApiItem[]>('/api/v1/admin/dictionary/requests', {
        method: 'GET',
        cache: 'no-store',
        params: status === 'pending' ? { status: 'pending' } : undefined,
      });
      return unwrapArray(res).map(normalizeDictionaryRequest);
    },
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
    }
  );

  return {
    requests: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================================================
// 字典申請操作 Hook
// ============================================================================

export function useDictionaryRequestActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 核准申請
  const approveRequest = useCallback(async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/admin/dictionary/requests/${id}/approve`);
      return {
        success: res.success,
        message: res.message || (res.success ? '申請已核准' : '核准失敗'),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '核准失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // 拒絕申請
  const rejectRequest = useCallback(async (id: string, reason: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/admin/dictionary/requests/${id}/reject`, { reason });
      return {
        success: res.success,
        message: res.message || (res.success ? '申請已拒絕' : '拒絕失敗'),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '拒絕失敗';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    approveRequest,
    rejectRequest,
    isSubmitting,
    error,
  };
}
