/**
 * FaCai-B Platform - Expiry Badge Component
 * File: frontend/src/components/trade/ExpiryBadge.tsx
 * 
 * 顯示調做需求的到期狀態標籤
 */

'use client';

import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRemainingDays, isExpiringSoon, isExpired } from '@/hooks/useTradeRequests';

interface ExpiryBadgeProps {
  expiresAt: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * 到期標籤元件 - 金紙風格
 */
export function ExpiryBadge({ expiresAt, className, showIcon = true }: ExpiryBadgeProps) {
  const remainingDays = getRemainingDays(expiresAt);
  const expired = isExpired(expiresAt);
  const expiringSoon = isExpiringSoon(expiresAt);

  // 根據狀態決定樣式和文字
  const getStatusConfig = () => {
    if (expired) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: XCircle,
        label: '已過期',
      };
    }
    if (expiringSoon) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: AlertTriangle,
        label: remainingDays === 0 ? '今日到期' : `剩餘 ${remainingDays} 天`,
      };
    }
    if (remainingDays <= 7) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: Clock,
        label: `剩餘 ${remainingDays} 天`,
      };
    }
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle,
      label: `剩餘 ${remainingDays} 天`,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}

/**
 * 簡化版到期標籤（僅顯示天數）
 */
export function ExpiryText({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const remainingDays = getRemainingDays(expiresAt);
  const expired = isExpired(expiresAt);
  const expiringSoon = isExpiringSoon(expiresAt);

  const textColor = expired
    ? 'text-red-500'
    : expiringSoon
    ? 'text-orange-500'
    : 'text-muted-foreground';

  const text = expired
    ? '已過期'
    : remainingDays === 0
    ? '今日到期'
    : `${remainingDays} 天後到期`;

  return <span className={cn(textColor, className)}>{text}</span>;
}
