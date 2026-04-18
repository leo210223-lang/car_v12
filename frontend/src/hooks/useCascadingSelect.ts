'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { api, type ApiResponse } from '@/lib/api';

function unwrapDictionaryList<T>(
  res: ApiResponse<T[]>,
  label: string
): T[] {
  if (!res.success) {
    console.error(
      `[CascadingSelect] ${label} API failed:`,
      res.message ?? res.code,
      res.code
    );
    return [];
  }
  const d = res.data;
  if (Array.isArray(d)) return d;
  console.error(
    `[CascadingSelect] ${label} unexpected payload (expected array):`,
    d
  );
  return [];
}

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Spec {
  id: string;
  brand_id: string;
  name: string;
  is_active: boolean;
}

export interface Model {
  id: string;
  spec_id: string;
  name: string;
  is_active: boolean;
}

interface UseCascadingSelectOptions {
  initialBrandId?: string;
  initialSpecId?: string;
  initialModelId?: string;
  onChange?: (selection: CascadingSelection) => void;
}

export interface CascadingSelection {
  brandId: string | null;
  specId: string | null;
  modelId: string | null;
  brandName: string | null;
  specName: string | null;
  modelName: string | null;
}

async function fetchBrands(): Promise<Brand[]> {
  const requestPath = '/api/v1/dictionary/brands';
  try {
    const res = await api.request<Brand[]>(requestPath, {
      method: 'GET',
      cache: 'no-store',
    });
    const list = unwrapDictionaryList(res, 'brands');
    if (list.length === 0 && res.success) {
      console.warn('[CascadingSelect] brands: empty list from API');
    }
    return list;
  } catch (e) {
    console.error(
      `[字典 API 錯誤] 請求路徑: ${requestPath}, 錯誤訊息: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
    return [];
  }
}

async function fetchSpecs([, brandId]: readonly [string, string, string]): Promise<Spec[]> {
  const requestPath = '/api/v1/dictionary/specs';
  try {
    const res = await api.request<Spec[]>(requestPath, {
      method: 'GET',
      cache: 'no-store',
      params: {
        brand_id: brandId,
      },
    });
    return unwrapDictionaryList(res, 'specs');
  } catch (e) {
    console.error(
      `[字典 API 錯誤] 請求路徑: ${requestPath}?brand_id=${brandId}, 錯誤訊息: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
    return [];
  }
}

async function fetchModels([, specId]: readonly [string, string, string]): Promise<Model[]> {
  const requestPath = '/api/v1/dictionary/models';
  try {
    const res = await api.request<Model[]>(requestPath, {
      method: 'GET',
      cache: 'no-store',
      params: {
        spec_id: specId,
      },
    });
    return unwrapDictionaryList(res, 'models');
  } catch (e) {
    console.error(
      `[字典 API 錯誤] 請求路徑: ${requestPath}?spec_id=${specId}, 錯誤訊息: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
    return [];
  }
}

/**
 * 階梯式選單 Hook - 品牌 → 規格 → 車型連動
 */
export function useCascadingSelect(options: UseCascadingSelectOptions = {}) {
  const { initialBrandId, initialSpecId, initialModelId, onChange } = options;
  const [requestScope] = useState(() => Date.now().toString());

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    initialBrandId ?? null
  );
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(
    initialSpecId ?? null
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    initialModelId ?? null
  );

  useEffect(() => {
    setSelectedBrandId(initialBrandId ?? null);
    setSelectedSpecId(initialSpecId ?? null);
    setSelectedModelId(initialModelId ?? null);
  }, [initialBrandId, initialSpecId, initialModelId]);

  const { data: brands = [], isLoading: isLoadingBrands } = useSWR<Brand[]>(
    ['dictionary-brands', requestScope],
    fetchBrands,
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: true,
      dedupingInterval: 0,
      keepPreviousData: false,
      onError: (error) => {
        console.error(
          `[字典 API 錯誤] 請求路徑: /api/v1/dictionary/brands, 錯誤訊息: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      },
    }
  );

  const specsKey = selectedBrandId
    ? (['dictionary-specs', selectedBrandId, requestScope] as const)
    : null;

  const { data: specs = [], isLoading: isLoadingSpecs } = useSWR<Spec[]>(
    specsKey,
    fetchSpecs,
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: true,
      dedupingInterval: 0,
      keepPreviousData: false,
      onError: (error) => {
        const path = selectedBrandId
          ? `/api/v1/dictionary/specs?brand_id=${selectedBrandId}`
          : '/api/v1/dictionary/specs';
        console.error(
          `[字典 API 錯誤] 請求路徑: ${path}, 錯誤訊息: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      },
    }
  );

  const modelsKey = selectedSpecId
    ? (['dictionary-models', selectedSpecId, requestScope] as const)
    : null;

  const { data: models = [], isLoading: isLoadingModels } = useSWR<Model[]>(
    modelsKey,
    fetchModels,
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnFocus: true,
      dedupingInterval: 0,
      keepPreviousData: false,
      onError: (error) => {
        const path = selectedSpecId
          ? `/api/v1/dictionary/models?spec_id=${selectedSpecId}`
          : '/api/v1/dictionary/models';
        console.error(
          `[字典 API 錯誤] 請求路徑: ${path}, 錯誤訊息: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      },
    }
  );

  const selectBrand = useCallback((brandId: string | null) => {
    setSelectedBrandId(brandId);
    setSelectedSpecId(null);
    setSelectedModelId(null);
  }, []);

  const selectSpec = useCallback((specId: string | null) => {
    setSelectedSpecId(specId);
    setSelectedModelId(null);
  }, []);

  const selectModel = useCallback((modelId: string | null) => {
    setSelectedModelId(modelId);
  }, []);

  const reset = useCallback(() => {
    setSelectedBrandId(null);
    setSelectedSpecId(null);
    setSelectedModelId(null);
  }, []);

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const selectedSpec = specs.find((s) => s.id === selectedSpecId);
  const selectedModel = models.find((m) => m.id === selectedModelId);

  useEffect(() => {
    onChange?.({
      brandId: selectedBrandId,
      specId: selectedSpecId,
      modelId: selectedModelId,
      brandName: selectedBrand?.name ?? null,
      specName: selectedSpec?.name ?? null,
      modelName: selectedModel?.name ?? null,
    });
  }, [
    selectedBrandId,
    selectedSpecId,
    selectedModelId,
    selectedBrand,
    selectedSpec,
    selectedModel,
    onChange,
  ]);

  return {
    brands,
    specs,
    models,

    selectedBrandId,
    selectedSpecId,
    selectedModelId,
    selectedBrand,
    selectedSpec,
    selectedModel,

    selectBrand,
    selectSpec,
    selectModel,
    reset,

    isLoadingBrands,
    isLoadingSpecs,
    isLoadingModels,
    isLoading: isLoadingBrands || isLoadingSpecs || isLoadingModels,

    selection: {
      brandId: selectedBrandId,
      specId: selectedSpecId,
      modelId: selectedModelId,
      brandName: selectedBrand?.name ?? null,
      specName: selectedSpec?.name ?? null,
      modelName: selectedModel?.name ?? null,
    } as CascadingSelection,
  };
}
