/**
 * FaCai-B Platform - Trade Request Card Component
 * File: frontend/src/components/trade/TradeRequestCard.tsx
 * 
 * 調做需求卡片元件
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Calendar, 
  Phone, 
  MapPin, 
  DollarSign, 
  MessageSquare,
  Edit,
  Trash2,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { ExpiryBadge } from './ExpiryBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDealerName } from '@/lib/utils';
import { formatYearRange, type TradeRequest } from '@/hooks/useTradeRequests';

interface TradeRequestCardProps {
  trade: TradeRequest;
  /** 是否為我的調做（顯示操作按鈕） */
  isOwner?: boolean;
  /** 編輯回調 */
  onEdit?: (trade: TradeRequest) => void;
  /** 刪除回調 */
  onDelete?: (trade: TradeRequest) => void;
  /** 續期回調 */
  onExtend?: (trade: TradeRequest) => void;
  /** 額外樣式 */
  className?: string;
}

function getTradeStatusLabel(status: TradeRequest['status']): string {
  switch (status) {
    case 'pending':
      return '審核中';
    case 'approved':
      return '已上架';
    case 'rejected':
      return '已退件';
    default:
      return status;
  }
}

function getTradeStatusClassName(status: TradeRequest['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * 調做需求卡片 - 金紙風格
 */
export function TradeRequestCard({
  trade,
  isOwner = false,
  onEdit,
  onDelete,
  onExtend,
  className,
}: TradeRequestCardProps) {
  const dealerCompanyName = trade.dealer?.company_name || '';
  const dealerContactName = trade.dealer?.name || '';
  const dealerDisplayName = formatDealerName({
    company_name: dealerCompanyName,
    name: dealerContactName,
  });
  const dealerPhone = (trade.dealer?.phone || '').trim();
  const hasDealerContact = dealerDisplayName !== '未提供車商資訊' || dealerPhone.length > 0;
  const isSameCompanyAndContact =
    dealerCompanyName.trim().length > 0 &&
    dealerContactName.trim().length > 0 &&
    dealerCompanyName.trim() === dealerContactName.trim();

  const normalizedBrandName =
    trade.brand?.name ||
    trade.target_brand?.name ||
    (typeof trade.brand_name === 'string' ? trade.brand_name.trim() : '');
  const normalizedSpecName =
    trade.target_spec?.name ||
    (typeof trade.spec_name === 'string' ? trade.spec_name.trim() : '');
  const normalizedModelName =
    trade.model?.name ||
    trade.target_model?.name ||
    (typeof trade.model_name === 'string' ? trade.model_name.trim() : '');

  const hasBrandName = normalizedBrandName.length > 0;
  const hasModelName = normalizedModelName.length > 0;
  const fallbackTitle = !hasBrandName || !hasModelName;
  const titleText = fallbackTitle
    ? '未指定車型'
    : `${normalizedBrandName}${normalizedSpecName ? ` ${normalizedSpecName}` : ''}`;
  const modelText = fallbackTitle ? '' : normalizedModelName;
  const displayTitle = titleText;

  const hasZeroPriceRange =
    typeof trade.price_range_min === 'number' &&
    typeof trade.price_range_max === 'number' &&
    trade.price_range_min <= 0 &&
    trade.price_range_max <= 0;
  const displayPrice = hasZeroPriceRange
    ? '洽詢價格'
    : (() => {
        const hasMin = typeof trade.price_range_min === 'number' && trade.price_range_min > 0;
        const hasMax = typeof trade.price_range_max === 'number' && trade.price_range_max > 0;
        if (!hasMin && !hasMax) return '洽詢價格';
        if (hasMin && !hasMax) {
          const minWan = Math.floor((trade.price_range_min as number) / 10000);
          return minWan > 0 ? `$ ${minWan.toLocaleString('zh-TW')} 萬 - 無上限` : '洽詢價格';
        }
        if (!hasMin && hasMax) {
          const maxWan = Math.floor((trade.price_range_max as number) / 10000);
          return maxWan > 0 ? `$ 0 - ${maxWan.toLocaleString('zh-TW')} 萬` : '洽詢價格';
        }
        const minWan = Math.floor((trade.price_range_min as number) / 10000);
        const maxWan = Math.floor((trade.price_range_max as number) / 10000);
        if (minWan <= 0 && maxWan <= 0) return '洽詢價格';
        return `$ ${minWan.toLocaleString('zh-TW')} - ${maxWan.toLocaleString('zh-TW')} 萬`;
      })();

  // 格式化電話號碼
  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white/40 backdrop-blur-md border border-amber-200/50 shadow-sm transition-all',
        'hover:border-amber-700/45 hover:bg-white/55',
        className
      )}
    >
      {/* 卡片內容 */}
      <div className="p-4">
        {/* 標題列：品牌/規格/車型 + 到期標籤 */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {displayTitle}
            </h3>
            {modelText && (
              <p className="text-sm text-muted-foreground truncate">
                {modelText}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                  getTradeStatusClassName(trade.status)
                )}
              >
                {getTradeStatusLabel(trade.status)}
              </span>
            )}
            <ExpiryBadge expiresAt={trade.expires_at} />
            {/* 擁有者操作選單 */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">操作選單</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEdit?.(trade)}>
                    <Edit className="mr-2 h-4 w-4" />
                    編輯
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExtend?.(trade)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    續期
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(trade)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    刪除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* 規格資訊 */}
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {/* 年份 */}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatYearRange(trade.year_from, trade.year_to)}
          </span>
          {/* 預算 */}
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {displayPrice}
          </span>
        </div>

        {/* 條件說明 */}
        {trade.conditions && (
          <div className="mb-3 rounded-lg bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-sm text-foreground line-clamp-2">
                {trade.conditions}
              </p>
            </div>
          </div>
        )}

        {/* 分隔線 */}
        <div className="my-3 border-t border-border" />

        {/* 車行聯絡資訊 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{dealerDisplayName}</span>
          </div>
          {dealerPhone ? (
            <a
              href={`tel:${dealerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-200"
            >
              <Phone className="h-3.5 w-3.5" />
              {formatPhone(dealerPhone)}
            </a>
          ) : (
            hasDealerContact && <span className="text-xs text-muted-foreground">聯絡資訊未公開</span>
          )}
        </div>

        {/* 聯絡方式詳情（如有額外說明） */}
        {dealerContactName && !isSameCompanyAndContact && (
          <p className="mt-2 text-xs text-muted-foreground">
            👤 {dealerContactName}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 調做卡片骨架載入
 */
export function TradeRequestCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white/40 backdrop-blur-md border border-amber-200/50 shadow-sm p-4">
      <div className="space-y-3">
        {/* 標題 */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        {/* 規格 */}
        <div className="flex gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        {/* 條件 */}
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        {/* 車行 */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
