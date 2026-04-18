'use client';

import { ReactNode, useCallback, useRef, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps {
  /** 子元素 */
  children: ReactNode;
  /** 載入更多的回調 */
  onLoadMore: () => void;
  /** 是否還有更多資料 */
  hasMore: boolean;
  /** 是否載入中 */
  isLoading: boolean;
  /** 是否正在載入更多 */
  isLoadingMore?: boolean;
  /** 到達底部的閾值（像素） */
  threshold?: number;
  /** 載入中的文字 */
  loadingText?: string;
  /** 沒有更多資料的文字 */
  endText?: string;
  /** 額外的樣式類別 */
  className?: string;
}

/**
 * 無限滾動容器元件
 */
export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  isLoadingMore = false,
  threshold = 100,
  loadingText = '載入更多...',
  endText = '已經到底了',
  className,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 使用 Intersection Observer 監聽滾動
  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      // 清理舊的 observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // 不需要載入更多的情況
      if (!hasMore || isLoading || isLoadingMore) {
        return;
      }

      // 建立新的 observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore();
          }
        },
        {
          rootMargin: `${threshold}px`,
        }
      );

      // 觀察 sentinel
      if (node) {
        sentinelRef.current = node;
        observerRef.current.observe(node);
      }
    },
    [hasMore, isLoading, isLoadingMore, onLoadMore, threshold]
  );

  // 清理
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* 內容 */}
      {children}

      {/* 哨兵元素（觸發載入更多） */}
      <div ref={sentinelCallback} className="h-1" />

      {/* 載入中狀態 */}
      {(isLoading || isLoadingMore) && (
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" showText text={loadingText} />
        </div>
      )}

      {/* 沒有更多資料 */}
      {!hasMore && !isLoading && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {endText}
        </div>
      )}
    </div>
  );
}

/**
 * 無限滾動列表（帶 Grid 佈局）
 */
export function InfiniteScrollGrid({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  isLoadingMore,
  columns = 2,
  gap = 4,
  ...props
}: InfiniteScrollProps & {
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <InfiniteScroll
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      {...props}
    >
      <div className={cn('grid', gridClasses[columns], `gap-${gap}`)}>
        {children}
      </div>
    </InfiniteScroll>
  );
}
