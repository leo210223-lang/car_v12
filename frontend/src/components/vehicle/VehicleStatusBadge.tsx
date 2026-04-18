'use client';

import { cn } from '@/lib/utils';
import type { VehicleStatus } from '@/hooks/useVehicles';

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  rejectionReason?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<VehicleStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  emoji: string;
}> = {
  pending: {
    label: '待審核',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    emoji: '⏳',
  },
  approved: {
    label: '已上架',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    emoji: '✅',
  },
  rejected: {
    label: '已退件',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    emoji: '❌',
  },
  archived: {
    label: '已下架',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    emoji: '📦',
  },
};

/**
 * 車輛狀態標籤元件
 */
export function VehicleStatusBadge({
  status,
  rejectionReason,
  size = 'sm',
  className,
}: VehicleStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          config.bgColor,
          config.textColor,
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
      
      {/* 退件理由 */}
      {status === 'rejected' && rejectionReason && (
        <span className="mt-1 text-xs text-red-600 line-clamp-1">
          原因：{rejectionReason}
        </span>
      )}
    </div>
  );
}
