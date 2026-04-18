/**
 * FaCai-B Platform - Trade Request List Component
 * File: frontend/src/components/trade/TradeRequestList.tsx
 * 
 * 調做需求列表元件（支援無限滾動）
 */

'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradeRequestCard, TradeRequestCardSkeleton } from './TradeRequestCard';
import { InfiniteScroll } from '@/components/shared/InfiniteScroll';
import { EmptyState } from '@/components/shared/EmptyState';
import { RefreshCw } from 'lucide-react';
import type { TradeRequest } from '@/hooks/useTradeRequests';

interface TradeRequestListProps {
  trades: TradeRequest[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  /** 當滾動到底部時觸發 */
  onLoadMore?: () => void;
  /** 是否為「我的調做」模式 */
  isMyTrades?: boolean;
  /** 空狀態時的操作按鈕文字 */
  emptyActionLabel?: string;
  /** 空狀態時的操作回調 */
  onEmptyAction?: () => void;
  /** 編輯回調 */
  onEdit?: (trade: TradeRequest) => void;
  /** 刪除回調 */
  onDelete?: (trade: TradeRequest) => void;
  /** 續期回調 */
  onExtend?: (trade: TradeRequest) => void;
  /** 額外樣式 */
  className?: string;
}

/**
 * 調做需求列表 - 支援無限滾動
 */
export function TradeRequestList({
  trades,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  isMyTrades = false,
  emptyActionLabel = '發布調做',
  onEmptyAction,
  onEdit,
  onDelete,
  onExtend,
  className,
}: TradeRequestListProps) {
  const handleLoadMore = useCallback(() => {
    if (onLoadMore) {
      onLoadMore();
    }
  }, [onLoadMore]);

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <TradeRequestCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 空狀態
  if (trades.length === 0) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={isMyTrades ? '您還沒有發布調做需求' : '目前沒有調做需求'}
        description={
          isMyTrades
            ? '發布您的調做需求，讓同業們幫您找車！'
            : '同業們還沒發布任何調做需求，您可以先發布自己的需求。'
        }
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <InfiniteScroll
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
      className={className}
    >
      <AnimatePresence mode="popLayout">
        <motion.div className="space-y-4">
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <TradeRequestCard
                trade={trade}
                isOwner={isMyTrades}
                onEdit={onEdit}
                onDelete={onDelete}
                onExtend={onExtend}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </InfiniteScroll>
  );
}
