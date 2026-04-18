'use client';

import { useState, useEffect } from 'react';
import { useCascadingSelect } from '@/hooks/useCascadingSelect';
import { cn } from '@/lib/utils';

interface CascadingSelectProps {
  /** 初始品牌 ID */
  initialBrandId?: string;
  /** 初始規格 ID */
  initialSpecId?: string;
  /** 初始車型 ID */
  initialModelId?: string;
  /** 選擇改變時的回調 */
  onSelectionChange?: (selection: {
    brandId: string | null;
    specId: string | null;
    modelId: string | null;
  }) => void;
  /** 是否顯示年份選擇 */
  showYearRange?: boolean;
  /** 年份範圍改變時的回調 */
  onYearRangeChange?: (yearFrom: number | null, yearTo: number | null) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 額外的樣式類別 */
  className?: string;
}

const selectClassName =
  'w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base font-medium text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * 階梯式選單元件 - 品牌 → 規格 → 車型連動（原生 select，避免自訂下拉被遮擋或點擊外層關閉造成無法選取）
 */
export function CascadingSelect({
  initialBrandId,
  initialSpecId,
  initialModelId,
  onSelectionChange,
  showYearRange = false,
  onYearRangeChange,
  disabled = false,
  className,
}: CascadingSelectProps) {
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);

  const {
    brands,
    specs,
    models,
    selectedBrandId,
    selectedSpecId,
    selectedModelId,
    selectBrand,
    selectSpec,
    selectModel,
    isLoadingBrands,
    isLoadingSpecs,
    isLoadingModels,
  } = useCascadingSelect({
    initialBrandId,
    initialSpecId,
    initialModelId,
  });

  useEffect(() => {
    onSelectionChange?.({
      brandId: selectedBrandId,
      specId: selectedSpecId,
      modelId: selectedModelId,
    });
  }, [selectedBrandId, selectedSpecId, selectedModelId, onSelectionChange]);

  useEffect(() => {
    onYearRangeChange?.(yearFrom, yearTo);
  }, [yearFrom, yearTo, onYearRangeChange]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">品牌</label>
          <select
            value={selectedBrandId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              selectBrand(v || null);
            }}
            disabled={disabled || isLoadingBrands}
            className={selectClassName}
          >
            <option value="">
              {isLoadingBrands ? '載入中…' : '請選擇品牌'}
            </option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">規格</label>
          <select
            value={selectedSpecId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              selectSpec(v || null);
            }}
            disabled={disabled || !selectedBrandId || isLoadingSpecs}
            className={selectClassName}
          >
            <option value="">
              {!selectedBrandId
                ? '請先選擇品牌'
                : isLoadingSpecs
                  ? '載入中…'
                  : '請選擇規格'}
            </option>
            {specs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">車型</label>
          <select
            value={selectedModelId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              selectModel(v || null);
            }}
            disabled={disabled || !selectedSpecId || isLoadingModels}
            className={selectClassName}
          >
            <option value="">
              {!selectedSpecId
                ? '請先選擇規格'
                : isLoadingModels
                  ? '載入中…'
                  : '請選擇車型'}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showYearRange && (
        <div className="flex items-center gap-3">
          <select
            value={yearFrom || ''}
            onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : null)}
            disabled={disabled}
            className={selectClassName}
          >
            <option value="">年份起</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground font-medium">~</span>
          <select
            value={yearTo || ''}
            onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : null)}
            disabled={disabled}
            className={selectClassName}
          >
            <option value="">年份迄</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
