'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Car, Clock, MapPin, ArrowRight } from 'lucide-react';
import { cn, formatDealerName } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';

interface AuditCardProps {
  vehicle: Vehicle;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isSubmitting?: boolean;
}

/**
 * 審核卡片元件
 */
export function AuditCard({ vehicle, onApprove, onReject, isSubmitting }: AuditCardProps) {
  const statusConfig = {
    pending: {
      label: '待審核',
      className: 'bg-amber-100 text-amber-700',
    },
    rejected: {
      label: '已退件',
      className: 'bg-red-100 text-red-700',
    },
    approved: {
      label: '已核准',
      className: 'bg-green-100 text-green-700',
    },
    archived: {
      label: '已下架',
      className: 'bg-gray-100 text-gray-700',
    },
    draft: {
      label: '草稿',
      className: 'bg-blue-100 text-blue-700',
    },
  };

  const config = statusConfig[vehicle.status] || statusConfig.pending;

  const listingPriceText =
    vehicle.listing_price != null && vehicle.listing_price > 0
      ? `$${vehicle.listing_price.toLocaleString()}`
      : '洽詢價格';
  const dealerCompanyName = vehicle.owner?.company_name || vehicle.dealer?.company_name || '';
  const dealerContactName = vehicle.owner?.name || vehicle.dealer?.name || '';
  const dealerDisplayName = formatDealerName({
    company_name: dealerCompanyName,
    name: dealerContactName,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-primary-200 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 圖片區 */}
      <div className="relative aspect-video bg-muted">
        {vehicle.images && vehicle.images.length > 0 ? (
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.brand_name} ${vehicle.spec_name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Car className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {/* 狀態標籤 */}
        <div className="absolute right-2 top-2">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', config.className)}>
            {config.label}
          </span>
        </div>
        {/* 圖片數量 */}
        {vehicle.images && vehicle.images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            <span>{vehicle.images.length} 張</span>
          </div>
        )}
      </div>

      {/* 內容區 */}
      <div className="p-4">
        {/* 車輛資訊 */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground">
            {vehicle.year} {vehicle.brand_name} {vehicle.spec_name}
          </h3>
          {vehicle.model_name && (
            <p className="text-sm text-muted-foreground">{vehicle.model_name}</p>
          )}
        </div>

        {/* 詳細資訊 */}
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-muted px-2 py-0.5">{vehicle.color || '未提供'}</span>
          {vehicle.mileage !== undefined && (
            <span className="rounded bg-muted px-2 py-0.5">
              {vehicle.mileage.toLocaleString()} 公里
            </span>
          )}
          <span className="rounded bg-muted px-2 py-0.5">
            {vehicle.transmission
              ? ({
                  auto: '自排',
                  manual: '手排',
                  semi_auto: '手自排',
                  cvt: 'CVT',
                }[vehicle.transmission] || vehicle.transmission)
              : '未提供'}
          </span>
          <span className="rounded bg-muted px-2 py-0.5">
            {vehicle.fuel_type
              ? ({
                  gasoline: '汽油',
                  diesel: '柴油',
                  hybrid: '油電',
                  electric: '純電',
                }[vehicle.fuel_type] || vehicle.fuel_type)
              : '未提供'}
          </span>
        </div>

        {/* 價格 */}
        <p className="mb-3 text-xl font-bold text-primary-600">
          {listingPriceText}
        </p>

        {/* 車行資訊 */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{dealerDisplayName}</span>
          <span className="mx-1">·</span>
          <Clock className="h-4 w-4" />
          <span>{new Date(vehicle.created_at).toLocaleDateString('zh-TW')}</span>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <Link
            href={`/audit/${vehicle.id}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            查看詳情
            <ArrowRight className="h-4 w-4" />
          </Link>
          
          {vehicle.status === 'pending' && onApprove && (
            <button
              onClick={() => onApprove(vehicle.id)}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              快速核准
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
