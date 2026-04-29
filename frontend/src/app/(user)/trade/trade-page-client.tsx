'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Filter, ChevronRight, Calendar, Gauge, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TradeRequestList } from '@/components/trade/TradeRequestList';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMyTradeRequests, useTradeActions, type TradeRequest } from '@/hooks/useTradeRequests';
import { useVehicles, type Vehicle } from '@/hooks/useVehicles';
import { useCascadingSelect } from '@/hooks/useCascadingSelect';
import { cn, formatDealerName } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * 盤車頁面 - 金紙風格
 *
 * [v12 變更]
 *   - 「全部需求」分頁改為「可盤車輛」列表（顯示 is_tradable === true 的車輛）
 *   - 顯示樣式與「看所有車」一致：無圖片，僅顯示車名/規格/年份/里程/車行/聯絡
 *   - 「可盤」綠色標籤顯示在車名旁邊（與看所有車一致）
 *   - 保留所有原有結構：分頁切換、發布調做按鈕、品牌篩選、續期/編輯/刪除等
 *   - 「我的調做」分頁維持顯示我發布的調做需求
 */

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
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>(undefined);
  const [showFilter, setShowFilter] = useState(false);

  // 品牌列表
  const { brands, selectBrand } = useCascadingSelect();

  // 可盤車輛篩選條件（已上架且依品牌篩選）
  const tradableVehicleFilters = useMemo(
    () => ({
      brand_id: selectedBrandId,
      status: 'approved' as const,
    }),
    [selectedBrandId]
  );

  // 可盤車輛列表（後端取已上架車輛，前端再篩出 is_tradable=true 的）
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

  // 我的調做（仍維持調做需求列表）
  const myTrades = useMyTradeRequests();

  // tab 切換時主動刷新，確保資料即時
  useEffect(() => {
    if (activeTab === 'all') {
      refreshVehicles();
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

  // 處理品牌篩選
  const handleBrandFilter = useCallback(
    (brandId: string | undefined) => {
      setSelectedBrandId(brandId);
      selectBrand(brandId || null);
      setShowFilter(false);
    },
    [selectBrand]
  );

  // 全部需求分頁的重新載入按鈕
  const handleRefreshAll = useCallback(() => {
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

      {/* 品牌篩選（全部需求模式） */}
      {activeTab === 'all' && (
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className={selectedBrandId ? 'border-primary-500 text-primary-700' : ''}
            >
              <Filter className="mr-1 h-4 w-4" />
              {selectedBrandId
                ? brands.find((b) => b.id === selectedBrandId)?.name || '已篩選'
                : '篩選品牌'}
            </Button>
            {selectedBrandId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBrandFilter(undefined)}
              >
                清除篩選
              </Button>
            )}
          </div>

          {/* 品牌列表 */}
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="stamp-frame mt-2 rounded-lg border border-amber-800/35 bg-white/85 p-3 backdrop-blur-sm"
            >
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Button
                    key={brand.id}
                    variant={selectedBrandId === brand.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleBrandFilter(brand.id)}
                  >
                    {brand.name}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 主內容區 */}
      <div className="relative z-10">
        {activeTab === 'all' ? (
          // ====== 全部需求：可盤車輛列表（樣式對齊 /all-cars） ======
          <>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {isVehiclesLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">載入中...</div>
              ) : tradableVehicles.length === 0 ? (
                <EmptyState
                  icon={RefreshCw}
                  title="目前沒有可盤的車輛"
                  description={
                    selectedBrandId
                      ? '此品牌目前沒有可盤的車輛，請嘗試其他品牌或清除篩選。'
                      : '同業們還沒有上架可盤的車輛，您可以先發布調做需求。'
                  }
                  actionLabel="發布調做"
                  onAction={() => router.push('/trade/new')}
                />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {tradableVehicles.map((v) => (
                    <TradableVehicleRow key={v.id} vehicle={v} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* 載入更多 */}
            {vehiclesHasMore && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  className={cn('w-full')}
                  onClick={loadMoreVehicles}
                  disabled={isVehiclesLoadingMore}
                >
                  {isVehiclesLoadingMore ? '載入中...' : '載入更多'}
                </Button>
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
