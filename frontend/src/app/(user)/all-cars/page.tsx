'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { List, RotateCcw, Search, ChevronRight, Calendar, Gauge, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVehicles, type Vehicle } from '@/hooks/useVehicles';
import { cn, formatDealerName } from '@/lib/utils';

/**
 * [v12] 看所有車 — 簡單列表頁（無照片）
 * 只顯示必要欄位：品牌/規格/車型、年份、里程、價格、車行、聯絡
 */

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

function SimpleVehicleRow({ vehicle }: { vehicle: Vehicle }) {
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

export default function AllCarsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filters = useMemo(
    () => ({
      search: searchQuery.trim() || undefined,
      status: 'approved' as const,
    }),
    [searchQuery]
  );

  const { data: vehicles, isLoading, isLoadingMore, hasMore, loadMore, refresh } =
    useVehicles(filters);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="gold-texture cloud-pattern relative mx-auto max-w-lg rounded-2xl border border-amber-800/30 px-4 py-4 shadow-[0_10px_24px_rgba(120,76,12,0.2)]">
      <span className="font-calligraphy pointer-events-none absolute right-2 top-2 z-0 text-[7rem] leading-none text-black/5">
        順
      </span>

      {/* 標題列 */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-700 to-amber-900 shadow-lg">
            <List className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-calligraphy text-2xl text-amber-950">看所有車</h1>
            <p className="text-xs text-amber-900/80">精簡清單 · 一目了然</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 搜尋列 */}
      <div className="relative z-10 mb-3 flex items-center gap-2 rounded-lg border border-amber-800/30 bg-white/85 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋品牌、規格、車型..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* 清單 */}
      <div className="relative z-10 overflow-hidden rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">載入中...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">目前沒有符合條件的車輛</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {vehicles.map((v) => (
              <SimpleVehicleRow key={v.id} vehicle={v} />
            ))}
          </motion.div>
        )}
      </div>

      {/* 載入更多 */}
      {hasMore && (
        <div className="relative z-10 mt-3 flex justify-center">
          <Button
            variant="outline"
            className={cn('w-full')}
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? '載入中...' : '載入更多'}
          </Button>
        </div>
      )}
    </div>
  );
}
