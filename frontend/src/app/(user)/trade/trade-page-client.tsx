'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TradeRequestList } from '@/components/trade/TradeRequestList';
import { useTradeRequests, useMyTradeRequests, useTradeActions, type TradeRequest } from '@/hooks/useTradeRequests';
import { useCascadingSelect } from '@/hooks/useCascadingSelect';
import { toast } from 'sonner';

/**
 * 盤車頁面 - 金紙風格
 * 功能：調做列表、我的調做、篩選品牌
 */
export function TradePageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>(undefined);
  const [showFilter, setShowFilter] = useState(false);

  // 品牌列表
  const { brands, selectBrand } = useCascadingSelect();

  // 取得調做列表
  const allTradeFilters = useMemo(
    () => ({
      brand_id: selectedBrandId,
      status: 'approved' as const,
    }),
    [selectedBrandId]
  );
  const allTrades = useTradeRequests(allTradeFilters);
  const myTrades = useMyTradeRequests();

  // tab 切換時主動刷新，確保核准後可立即看到最新資料
  useEffect(() => {
    if (activeTab === 'all') {
      allTrades.refresh();
      return;
    }
    myTrades.refresh();
  }, [activeTab, allTrades.refresh, myTrades.refresh]);

  // 目前顯示的資料
  const currentData = activeTab === 'all' ? allTrades : myTrades;

  // 調做操作
  const { deleteTrade, extendTrade } = useTradeActions();

  // 處理編輯
  const handleEdit = useCallback((trade: TradeRequest) => {
    router.push(`/trade/${trade.id}/edit`);
  }, [router]);

  // 處理刪除
  const handleDelete = useCallback(async (trade: TradeRequest) => {
    if (!confirm(`確定要刪除「${trade.brand_name} ${trade.spec_name || ''}」的調做需求嗎？\n\n此操作無法復原！`)) {
      return;
    }

    const result = await deleteTrade(trade.id);
    if (result.success) {
      toast.success('調做已刪除');
      currentData.refresh();
    } else {
      toast.error(result.message || '刪除失敗');
    }
  }, [deleteTrade, currentData]);

  // 處理續期
  const handleExtend = useCallback(async (trade: TradeRequest) => {
    const result = await extendTrade(trade.id, 7);
    if (result.success) {
      toast.success('已續期 7 天');
      currentData.refresh();
    } else {
      toast.error(result.message || '續期失敗');
    }
  }, [extendTrade, currentData]);

  // 處理品牌篩選
  const handleBrandFilter = useCallback((brandId: string | undefined) => {
    setSelectedBrandId(brandId);
    selectBrand(brandId || null);
    setShowFilter(false);
  }, [selectBrand]);

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
                : '篩選品牌'
              }
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

      {/* 調做列表 */}
      <div className="relative z-10">
        <TradeRequestList
          trades={currentData.trades}
          isLoading={currentData.isLoading}
          isLoadingMore={currentData.isLoadingMore}
          hasMore={currentData.hasMore}
          onLoadMore={currentData.loadMore}
          isMyTrades={activeTab === 'my'}
          emptyActionLabel="發布調做"
          onEmptyAction={() => router.push('/trade/new')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExtend={handleExtend}
        />
      </div>

      {/* 重新載入 */}
      {currentData.trades.length > 0 && (
        <div className="relative z-10 mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentData.refresh()}
            disabled={currentData.isLoading}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${currentData.isLoading ? 'animate-spin' : ''}`} />
            重新載入
          </Button>
        </div>
      )}
    </div>
  );
}
