'use client';

import { VehicleCard, VehicleCardSkeleton } from './VehicleCard';
import { InfiniteScroll } from '@/components/shared/InfiniteScroll';
import { EmptySearchResult, EmptyVehicles } from '@/components/shared/EmptyState';
import type { Vehicle } from '@/hooks/useVehicles';

interface VehicleListProps {
  /** 車輛列表 */
  vehicles: Vehicle[];
  /** 是否載入中 */
  isLoading: boolean;
  /** 是否載入更多中 */
  isLoadingMore?: boolean;
  /** 是否還有更多 */
  hasMore: boolean;
  /** 載入更多回調 */
  onLoadMore: () => void;
  /** 是否顯示車行資訊 */
  showDealer?: boolean;
  /** 是否顯示狀態標籤 */
  showStatus?: boolean;
  /** 是否顯示成本 */
  showCost?: boolean;
  /** 連結生成函數 */
  getHref?: (vehicle: Vehicle) => string;
  /** 是否為搜尋結果（影響空狀態顯示） */
  isSearchResult?: boolean;
  /** 清除搜尋回調 */
  onClearSearch?: () => void;
  /** 新增車輛回調 */
  onAddVehicle?: () => void;
  /** 額外的樣式類別 */
  className?: string;
}

/**
 * 車輛列表元件 - 整合無限滾動
 */
export function VehicleList({
  vehicles,
  isLoading,
  isLoadingMore = false,
  hasMore,
  onLoadMore,
  showDealer = true,
  showStatus = false,
  showCost = false,
  getHref,
  isSearchResult = false,
  onClearSearch,
  onAddVehicle,
  className,
}: VehicleListProps) {
  // 初始載入中
  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 無資料
  if (vehicles.length === 0) {
    if (isSearchResult) {
      return <EmptySearchResult onClear={onClearSearch} />;
    }
    return <EmptyVehicles onAdd={onAddVehicle} />;
  }

  return (
    <InfiniteScroll
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      className={className}
      loadingText="載入更多車輛..."
      endText="已顯示全部車輛"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            showDealer={showDealer}
            showStatus={showStatus}
            showCost={showCost}
            href={getHref?.(vehicle)}
          />
        ))}
      </div>
    </InfiniteScroll>
  );
}
