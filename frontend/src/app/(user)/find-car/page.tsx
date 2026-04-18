'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Car, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/shared/SearchBox';
import { CascadingSelect, VehicleList } from '@/components/vehicle';
import { useVehicles, VehicleFilters } from '@/hooks/useVehicles';

/**
 * 尋車頁面 - 含階梯式選單、搜尋與無限滾動
 */
export default function FindCarPage() {
  // 篩選狀態
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 年份狀態
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);

  // 組合篩選條件
  const combinedFilters = useMemo<VehicleFilters>(() => ({
    ...filters,
    search: searchQuery || undefined,
    year_from: yearFrom || undefined,
    year_to: yearTo || undefined,
    status: 'approved', // 只顯示已審核通過的車輛
  }), [filters, searchQuery, yearFrom, yearTo]);

  // 車輛列表 Hook
  const {
    data: vehicles,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useVehicles(combinedFilters);

  // 搜尋處理
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // 階梯式選單選擇回調
  const handleSelectionChange = useCallback((selection: {
    brandId: string | null;
    specId: string | null;
    modelId: string | null;
  }) => {
    setFilters((prev) => ({
      ...prev,
      brand_id: selection.brandId || undefined,
      spec_id: selection.specId || undefined,
      model_id: selection.modelId || undefined,
    }));
  }, []);

  // 年份範圍變更
  const handleYearRangeChange = useCallback((from: number | null, to: number | null) => {
    setYearFrom(from);
    setYearTo(to);
  }, []);

  // 清除所有篩選
  const handleClearAll = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setYearFrom(null);
    setYearTo(null);
    setShowFilters(false);
  }, []);

  // 判斷是否有任何篩選條件
  const hasFilters = useMemo(() => {
    return !!(
      filters.brand_id ||
      filters.spec_id ||
      filters.model_id ||
      searchQuery ||
      yearFrom ||
      yearTo
    );
  }, [filters, searchQuery, yearFrom, yearTo]);

  // 篩選條件摘要
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.brand_id) parts.push('品牌');
    if (filters.spec_id) parts.push('規格');
    if (filters.model_id) parts.push('車型');
    if (yearFrom || yearTo) parts.push('年份');
    if (searchQuery) parts.push('關鍵字');
    return parts.length > 0 ? `已篩選 ${parts.join('、')}` : null;
  }, [filters, searchQuery, yearFrom, yearTo]);

  // 車輛詳情頁連結
  const getVehicleHref = useCallback((vehicle: { id: string }) => {
    return `/find-car/${vehicle.id}`;
  }, []);

  return (
    <div className="gold-texture cloud-pattern relative mx-auto max-w-lg rounded-2xl border border-amber-800/30 px-4 py-4 shadow-[0_10px_24px_rgba(120,76,12,0.2)]">
      <span className="font-calligraphy pointer-events-none absolute right-2 top-2 text-[7rem] leading-none text-black/5">
        順
      </span>
      {/* 頁面標題 */}
      <div className="relative z-10 mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-700 to-amber-900 shadow-lg">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-calligraphy text-2xl text-amber-950 sm:text-3xl md:text-4xl">尋車</h1>
            <p className="text-xs text-amber-900/80 sm:text-sm">二月財氣順 · 尋找您需要的車款</p>
          </div>
        </div>
        
        {/* 重新整理按鈕 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refresh()}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 搜尋列 */}
      <div className="relative z-10 mb-4 flex gap-2 sm:mb-6">
        <div className="flex-1">
          <SearchBox
            placeholder="搜尋品牌、規格、車型..."
            onSearch={handleSearch}
            defaultValue={searchQuery}
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="relative shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasFilters && !showFilters && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-background" />
          )}
        </Button>
      </div>

      {/* 篩選面板 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 mb-4 overflow-hidden"
          >
            <div className="rounded-xl border border-amber-800/35 bg-white/85 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">篩選條件</span>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    清除全部
                  </Button>
                )}
              </div>
              
              <CascadingSelect
                onSelectionChange={handleSelectionChange}
                showYearRange
                onYearRangeChange={handleYearRangeChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 篩選摘要標籤 */}
      {filterSummary && !showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-4"
        >
          <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-sm">
            <span className="text-primary-700">{filterSummary}</span>
            <button
              onClick={handleClearAll}
              className="ml-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-primary-500 hover:bg-primary-100 hover:text-primary-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* 車輛列表 */}
      <div className="relative z-10">
        <VehicleList
          vehicles={vehicles}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          showDealer
          showStatus={false}
          showCost={false}
          getHref={getVehicleHref}
          isSearchResult={hasFilters}
          onClearSearch={handleClearAll}
        />
      </div>
    </div>
  );
}
