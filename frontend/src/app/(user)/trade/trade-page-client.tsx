'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronRight, ChevronLeft, Calendar, Gauge, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { useVehicles, type Vehicle } from '@/hooks/useVehicles';
import { cn, formatDealerName } from '@/lib/utils';

/**
 * 盤車頁面 - 金紙風格
 *
 * [v12 變更]
 *   - 整頁僅顯示「可盤車輛列表」（is_tradable === true 的車輛）
 *   - 顯示樣式與「看所有車」一致：無圖片，僅顯示車名/規格/年份/里程/車行/聯絡
 *   - 「可盤」綠色標籤顯示在車名旁邊（與看所有車一致）
 *   - 移除：發布調做按鈕、全部需求/我的調做分頁切換、品牌篩選
 *   - 採用「上一頁／下一頁」分頁，每頁固定 6 台
 *
 *   注意：發布調做、編輯調做、我的調做等功能仍保留於：
 *     - /trade/new （發布調做頁）
 *     - /trade/[id]/edit （編輯調做頁）
 *   只是不再從盤車頁面進入。
 */

// ============================================================================
// 常數
// ============================================================================

const PAGE_SIZE = 6;

// ============================================================================
// 工具函數（對齊 /all-cars 樣式）
// ============================================================================

function formatPrice(price?: number | null): string {
  if (price != null && price > 0) {
    return `$ ${price.toLocaleString('zh-TW')}`;
  }
  return '洽詢';
}

function formatMileage(mileage?: number | null): string {
  if (!mileage) return '-';
  if (mileage >= 10000) return `${(mileage / 10000).toFixed(1)} 萬 km`;
  return `${mileage.toLocaleString()} km`;
}

// ============================================================================
// 可盤車輛列項（對齊 /all-cars 的 SimpleVehicleRow）
// ============================================================================

function TradableVehicleRow({ vehicle }: { vehicle: Vehicle }) {
  const dealer = formatDealerName({
    company_name: vehicle.owner?.company_name ?? vehicle.dealer?.company_name ?? '',
    name: vehicle.owner?.name ?? vehicle.dealer?.name ?? '',
  });
  const phone = vehicle.owner?.phone ?? vehicle.dealer?.phone ?? '';
  const price = vehicle.listing_price ?? vehicle.price ?? null;

  return (
    <Link
      href={`/find-car/${vehicle.id}`}
      className="group flex items-center justify-between gap-3 border-b border-border bg-card px-3 py-3 transition-colors hover:bg-primary-50/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-foreground">
            {vehicle.brand_name} {vehicle.spec_name}
          </span>
          {vehicle.is_tradable && (
            <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              可盤
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{vehicle.model_name}</p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            {vehicle.year}
          </span>
          {vehicle.color && (
            <>
              <span>·</span>
              <span>{vehicle.color}</span>
            </>
          )}
          {vehicle.mileage ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                <Gauge className="h-3 w-3" />
                {formatMileage(vehicle.mileage)}
              </span>
            </>
          ) : null}
          <span>·</span>
          <span className="truncate">{dealer}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold text-primary-600">{formatPrice(price)}</span>
        {phone ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `tel:${phone}`;
            }}
            className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700 hover:bg-primary-200"
          >
            <Phone className="h-2.5 w-2.5" />
            聯絡
          </button>
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// 主元件
// ============================================================================

export function TradePageClient() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // 可盤車輛篩選條件（已上架）
  const tradableVehicleFilters = useMemo(
    () => ({
      status: 'approved' as const,
    }),
    []
  );

  // 取得車輛列表（後端取已上架車輛，前端再篩出 is_tradable=true）
  // 由於後端不支援 tradable_only 篩選，使用無限滾動 hook 並在前端聚合
  const {
    data: allVehicles,
    isLoading: isVehiclesLoading,
    isLoadingMore: isVehiclesLoadingMore,
    hasMore: vehiclesHasMore,
    loadMore: loadMoreVehicles,
    refresh: refreshVehicles,
  } = useVehicles(tradableVehicleFilters);

  // 客戶端過濾出可盤的車輛
  const tradableVehicles = useMemo(
    () => allVehicles.filter((v) => v.is_tradable === true),
    [allVehicles]
  );

  // 自動拉取後續頁，直到「可盤車輛足以填滿目前頁」或「已沒有更多車輛」
  // 因為過濾是在前端做的，需確保能找到足夠資料給目前頁碼顯示
  useEffect(() => {
    const requiredCount = currentPage * PAGE_SIZE;
    if (
      tradableVehicles.length < requiredCount &&
      vehiclesHasMore &&
      !isVehiclesLoading &&
      !isVehiclesLoadingMore
    ) {
      loadMoreVehicles();
    }
  }, [
    currentPage,
    tradableVehicles.length,
    vehiclesHasMore,
    isVehiclesLoading,
    isVehiclesLoadingMore,
    loadMoreVehicles,
  ]);

  // 當前頁要顯示的車輛
  const currentPageVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return tradableVehicles.slice(start, start + PAGE_SIZE);
  }, [tradableVehicles, currentPage]);

  // 是否還能繼續往後翻：
  //   - 還有更多本地資料能切到下一頁
  //   - 或後端還有更多資料可載入
  const canGoNext = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return start < tradableVehicles.length || vehiclesHasMore;
  }, [currentPage, tradableVehicles.length, vehiclesHasMore]);

  const canGoPrev = currentPage > 1;

  // 已知的最後一頁（僅在後端沒有更多資料時才能確定）
  const finalPage = useMemo(() => {
    if (vehiclesHasMore) return null;
    return Math.max(1, Math.ceil(tradableVehicles.length / PAGE_SIZE));
  }, [vehiclesHasMore, tradableVehicles.length]);

  // 上一頁／下一頁
  const handlePrevPage = useCallback(() => {
    if (canGoPrev) setCurrentPage((p) => p - 1);
  }, [canGoPrev]);

  const handleNextPage = useCallback(() => {
    if (canGoNext) setCurrentPage((p) => p + 1);
  }, [canGoNext]);

  // 重新載入（重置到第 1 頁）
  const handleRefreshAll = useCallback(() => {
    setCurrentPage(1);
    refreshVehicles();
  }, [refreshVehicles]);

  return (
    <div className="gold-texture cloud-pattern relative mx-auto max-w-lg rounded-2xl border border-amber-800/30 px-4 py-4 shadow-[0_10px_24px_rgba(120,76,12,0.2)]">
      <span className="font-calligraphy pointer-events-none absolute right-2 top-2 z-0 text-[7rem] leading-none text-black/5">
        順
      </span>

      {/* 標題列 */}
      <div className="relative z-10 mb-6 flex items-center justify-between">
        <h1 className="font-calligraphy text-2xl text-amber-950">盤車需求</h1>
      </div>

      {/* 主內容區：可盤車輛列表（樣式對齊 /all-cars） */}
      <div className="relative z-10">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {(isVehiclesLoading || isVehiclesLoadingMore) && currentPageVehicles.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">載入中...</div>
          ) : currentPageVehicles.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="目前沒有可盤的車輛"
              description="同業們還沒有上架可盤的車輛，請稍後再來查看。"
            />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {currentPageVehicles.map((v) => (
                <TradableVehicleRow key={v.id} vehicle={v} />
              ))}
            </motion.div>
          )}
        </div>

        {/* 分頁控制（上一頁／下一頁） */}
        {(tradableVehicles.length > 0 || vehiclesHasMore) && (
          <div className={cn('mt-4 flex items-center justify-between gap-2')}>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!canGoPrev || isVehiclesLoadingMore}
              className="flex-1"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一頁
            </Button>
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              第 {currentPage} 頁
              {finalPage !== null && ` / 共 ${finalPage} 頁`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!canGoNext || isVehiclesLoadingMore}
              className="flex-1"
            >
              下一頁
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 載入更多資料中提示 */}
        {isVehiclesLoadingMore && currentPageVehicles.length > 0 && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            載入更多資料中…
          </div>
        )}

        {/* 重新載入 */}
        {tradableVehicles.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isVehiclesLoading}
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${isVehiclesLoading ? 'animate-spin' : ''}`}
              />
              重新載入
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
