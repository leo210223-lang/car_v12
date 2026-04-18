'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 額外的樣式類別 */
  className?: string;
  /** 是否顯示文字 */
  showText?: boolean;
  /** 自訂文字 */
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

/**
 * 載入中動畫元件
 */
export function LoadingSpinner({ 
  size = 'md', 
  className,
  showText = false,
  text = '載入中...'
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-primary-200 border-t-primary-500 animate-spin',
          sizeClasses[size]
        )}
      />
      {showText && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * 全頁載入中覆蓋層
 */
export function LoadingOverlay({ text = '載入中...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="xl" showText text={text} />
    </div>
  );
}

/**
 * 骨架載入動畫
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}
