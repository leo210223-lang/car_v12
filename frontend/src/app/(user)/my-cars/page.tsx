'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Car, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyVehicles } from '@/components/shared/EmptyState';
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicle';
import { useMyVehicles, VehicleStatus } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';

const STATUS_TABS: { label: string; value: VehicleStatus | undefined; emoji: string }[] = [
  { label: '全部', value: undefined, emoji: '📋' },
  { label: '待審核', value: 'pending', emoji: '⏳' },
  { label: '已上架', value: 'approved', emoji: '✅' },
  { label: '已退件', value: 'rejected', emoji: '❌' },
  { label: '已下架', value: 'archived', emoji: '📦' },
];

/**
 * 我的車頁面 - 含狀態篩選、車輛列表
 */
export default function MyCarsPage() {
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | undefined>(undefined);

  const {
    data: vehicles,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useMyVehicles(statusFilter);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* 標題列 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-600 shadow-lg">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">我的車</h1>
            <p className="text-xs text-muted-foreground">管理您的車輛資訊</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Link href="/my-cars/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              上架車
            </Button>
          </Link>
        </div>
      </div>

      {/* 狀態篩選 */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-card text-muted-foreground hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              <span className="text-xs">{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 車輛列表 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : vehicles.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <VehicleCard
                  vehicle={vehicle}
                  showDealer={false}
                  showStatus
                  showCost
                  href={`/my-cars/${vehicle.id}`}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 載入更多 */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? '載入中...' : '載入更多'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyVehicles onAdd={() => (window.location.href = '/my-cars/new')} />
      )}
    </div>
  );
}
