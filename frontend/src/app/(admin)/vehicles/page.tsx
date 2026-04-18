'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, RefreshCw, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleCard, VehicleCardSkeleton, CascadingSelect } from '@/components/vehicle';
import { useVehicles, VehicleStatus, VehicleFilters } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const STATUS_TABS: { label: string; value: VehicleStatus | undefined; count?: boolean }[] = [
  { label: '全部', value: undefined },
  { label: '待審核', value: 'pending' },
  { label: '已上架', value: 'approved' },
  { label: '已退件', value: 'rejected' },
  { label: '已下架', value: 'archived' },
];

/**
 * Admin 所有車輛頁面 - 瀏覽與管理平台所有車輛
 */
export default function AdminVehiclesPage() {
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [removedVehicleIds, setRemovedVehicleIds] = useState<Set<string>>(new Set());
  const [cascadingFilters, setCascadingFilters] = useState<{
    brandId: string | null;
    specId: string | null;
    modelId: string | null;
  }>({ brandId: null, specId: null, modelId: null });

  const debouncedSearch = useDebounce(searchInput, 300);

  const filters: VehicleFilters = {
    status: statusFilter,
    search: debouncedSearch || undefined,
    brand_id: cascadingFilters.brandId || undefined,
    spec_id: cascadingFilters.specId || undefined,
    model_id: cascadingFilters.modelId || undefined,
  };

  const {
    data: vehicles,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useVehicles(filters);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const visibleVehicles = vehicles.filter((vehicle) => !removedVehicleIds.has(vehicle.id));

  const handleDeleteVehicle = useCallback(async (vehicleId: string) => {
    const confirmed = window.confirm('確定要刪除這台車輛嗎？此操作無法復原。');
    if (!confirmed) return;

    try {
      setDeletingVehicleId(vehicleId);
      const response = await api.delete(`/admin/vehicles/${vehicleId}`);
      if (!response.success) {
        toast.error(response.message || '刪除失敗，請稍後再試');
        return;
      }

      setRemovedVehicleIds((prev) => new Set(prev).add(vehicleId));
      await refresh();
      toast.success('車輛已成功刪除');
    } catch (error) {
      console.error('刪除車輛失敗:', error);
      toast.error('刪除失敗，請檢查網路後重試');
    } finally {
      setDeletingVehicleId(null);
    }
  }, [refresh]);

  return (
    <div className="space-y-6">
      {/* 標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">所有車輛</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            瀏覽與管理平台上所有車輛
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          重新整理
        </button>
      </div>

      {/* 搜尋列 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋品牌、規格、車型、車行..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* 進階篩選 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <CascadingSelect onSelectionChange={setCascadingFilters} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 狀態篩選標籤 */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-muted-foreground hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 車輛列表 */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleVehicles.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {visibleVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteVehicle(vehicle.id);
                    }}
                    disabled={deletingVehicleId === vehicle.id}
                    className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    title="刪除車輛"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <VehicleCard
                    vehicle={vehicle}
                    showDealer
                    showStatus
                    href={`/audit/${vehicle.id}`}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? '載入中...' : '載入更多'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-card"
        >
          <Car className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">沒有車輛</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            目前沒有符合篩選條件的車輛
          </p>
        </motion.div>
      )}
    </div>
  );
}
