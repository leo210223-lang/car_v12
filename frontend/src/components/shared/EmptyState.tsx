'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, Search, FileX, AlertCircle, Inbox, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** 圖示 */
  icon?: LucideIcon;
  /** 標題 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** CTA 按鈕文字 */
  actionLabel?: string;
  /** CTA 按鈕點擊事件 */
  onAction?: () => void;
  /** 額外的樣式類別 */
  className?: string;
}

/**
 * 空狀態元件 - 用於沒有資料時的提示
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-4">
        <Icon className="h-8 w-8 text-primary-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// 預設樣式的空狀態
// ============================================================================

/**
 * 搜尋無結果
 */
export function EmptySearchResult({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="找不到相關結果"
      description="請嘗試調整篩選條件或搜尋關鍵字"
      actionLabel={onClear ? "清除篩選" : undefined}
      onAction={onClear}
    />
  );
}

/**
 * 沒有車輛
 */
export function EmptyVehicles({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Car}
      title="尚無車輛"
      description="您還沒有上架任何車輛，立即新增您的第一輛車！"
      actionLabel={onAdd ? "新增車輛" : undefined}
      onAction={onAdd}
    />
  );
}

/**
 * 沒有資料
 */
export function EmptyData({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={FileX}
      title="暫無資料"
      description={message || "目前沒有相關資料"}
    />
  );
}

/**
 * 發生錯誤
 */
export function ErrorState({ 
  message, 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="發生錯誤"
      description={message || "無法載入資料，請稍後再試"}
      actionLabel={onRetry ? "重新載入" : undefined}
      onAction={onRetry}
    />
  );
}
