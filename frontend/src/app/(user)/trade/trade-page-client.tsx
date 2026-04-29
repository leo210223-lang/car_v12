'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, ChevronRight, ChevronLeft, Calendar, Gauge, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TradeRequestList } from '@/components/trade/TradeRequestList';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMyTradeRequests, useTradeActions, type TradeRequest } from '@/hooks/useTradeRequests';
import { useVehicles, type Vehicle } from '@/hooks/useVehicles';
import { cn, formatDealerName } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * 盤車頁面 - 金紙風格
 *
 * [v12 變更]
 *   - 「全部需求」分頁改為「可盤車輛」列表（顯示 is_tradable === true 的車輛）
 *   - 顯示樣式與「看所有車」一致：無圖片，僅顯示車名/規格/年份/里程/車行/聯絡
 *   - 「可盤」綠色標籤顯示在車名旁邊（與看所有車一致）
 *   - 移除品牌篩選功能
 *   - 採用「上一頁／下一頁」分頁，每頁固定 6 台
 *   - 「我的調做」分頁維持原有的調做需求列表功能
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
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
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
    if (activeTab !== 'all') return;
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
    activeTab,
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

  // 我的調做（仍維持調做需求列表）
  const myTrades = useMyTradeRequests();

  // tab 切換時主動刷新
  useEffect(() => {
    if (activeTab === 'all') {
      refreshVehicles();
      setCurrentPage(1); // 切回全部需求時重置頁碼
      return;
    }
    myTrades.refresh();
  }, [activeTab, refreshVehicles, myTrades.refresh]);

  // 調做操作（用於「我的調做」分頁）
  const { deleteTrade, extendTrade } = useTradeActions();

  // 處理編輯
  const handleEdit = useCallback(
    (trade: TradeRequest) => {
      router.push(`/trade/${trade.id}/edit`);
    },
    [router]
  );

  // 處理刪除
  const handleDelete = useCallback(
    async (trade: TradeRequest) => {
      if (
        !confirm(
          `確定要刪除「${trade.brand_name} ${trade.spec_name || ''}」的調做需求嗎？\n\n此操作無法復原！`
        )
      ) {
        return;
      }

      const result = await deleteTrade(trade.id);
      if (result.success) {
        toast.success('調做已刪除');
        myTrades.refresh();
      } else {
        toast.error(result.message || '刪除失敗');
      }
    },
    [deleteTrade, myTrades]
  );

  // 處理續期
  const handleExtend = useCallback(
    async (trade: TradeRequest) => {
      const result = await extendTrade(trade.id, 7);
      if (result.success) {
        toast.success('已續期 7 天');
        myTrades.refresh();
      } else {
        toast.error(result.message || '續期失敗');
      }
    },
    [extendTrade, myTrades]
  );

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
        <Link href="/trade/new">
          <Button size="sm" className="bg-amber-900 text-amber-50 hover:bg-amber-950">
            <Plus className="mr-1 h-4 w-4" />
            發布調做
          </Button>
        </Link>
      </div>

      {/* 分頁切換 */}
      <div className="relative z-10 mb-4 flex gap-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 border-amber-800/30"
          onClick={() => setActiveTab('all')}
        >
          全部需求
        </Button>
        <Button
          variant={activeTab === 'my' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 border-amber-800/30"
          onClick={() => setActiveTab('my')}
        >
          我的調做
        </Button>
      </div>

      {/* 主內容區 */}
      <div className="relative z-10">
        {activeTab === 'all' ? (
          // ====== 全部需求：可盤車輛列表（樣式對齊 /all-cars） ======
          <>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {(isVehiclesLoading || isVehiclesLoadingMore) && currentPageVehicles.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">載入中...</div>
              ) : currentPageVehicles.length === 0 ? (
                <EmptyState
                  icon={RefreshCw}
                  title="目前沒有可盤的車輛"
                  description="同業們還沒有上架可盤的車輛，您可以先發布調做需求。"
                  actionLabel="發布調做"
                  onAction={() => router.push('/trade/new')}
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
          </>
        ) : (
          // ====== 我的調做：保留原有的調做需求列表 ======
          <>
            <TradeRequestList
              trades={myTrades.trades}
              isLoading={myTrades.isLoading}
              isLoadingMore={myTrades.isLoadingMore}
              hasMore={myTrades.hasMore}
              onLoadMore={myTrades.loadMore}
              isMyTrades={true}
              emptyActionLabel="發布調做"
              onEmptyAction={() => router.push('/trade/new')}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExtend={handleExtend}
            />

            {/* 重新載入 */}
            {myTrades.trades.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => myTrades.refresh()}
                  disabled={myTrades.isLoading}
                >
                  <RefreshCw
                    className={`mr-1 h-4 w-4 ${myTrades.isLoading ? 'animate-spin' : ''}`}
                  />
                  重新載入
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
