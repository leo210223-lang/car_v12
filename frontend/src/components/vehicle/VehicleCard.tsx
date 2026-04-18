'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gauge, Phone, MapPin } from 'lucide-react';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { cn, formatDealerName, normalizeVehicleImageUrl } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';

interface VehicleCardProps {
  vehicle: Vehicle;
  /** 是否顯示車行資訊 */
  showDealer?: boolean;
  /** 是否顯示狀態標籤（我的車頁面用） */
  showStatus?: boolean;
  /** 是否顯示成本（僅擁有者可見） */
  showCost?: boolean;
  /** 點擊時的連結路徑 */
  href?: string;
  /** 額外的樣式類別 */
  className?: string;
}

function formatListingPrice(price?: number | null): string {
  if (price != null && price > 0) {
    return `$ ${price.toLocaleString('zh-TW')}`;
  }
  return '洽詢價格';
}

/**
 * 格式化里程
 */
function formatMileage(mileage?: number): string {
  if (!mileage) return '-';
  if (mileage >= 10000) {
    return `${(mileage / 10000).toFixed(1)} 萬 km`;
  }
  return `${mileage.toLocaleString()} km`;
}

/**
 * 車輛卡片元件 - 金紙風格
 *
 * [v12] 若 vehicle.is_tradable 為 true，圖片右上角顯示綠色「可盤」小徽章
 */
export function VehicleCard({
  vehicle,
  showDealer = true,
  showStatus = false,
  showCost = false,
  href,
  className,
}: VehicleCardProps) {
  const resolvedPrice =
    vehicle.listing_price ??
    vehicle.price ??
    vehicle.trade_price ??
    null;
  const dealerCompanyName =
    vehicle.owner?.company_name ??
    vehicle.dealer?.company_name ??
    '';
  const dealerContactName =
    vehicle.owner?.name ??
    vehicle.dealer?.name ??
    '';
  const dealerPhone =
    vehicle.owner?.phone ??
    vehicle.dealer?.phone ??
    '';
  const dealerDisplayName = formatDealerName({
    company_name: dealerCompanyName,
    name: dealerContactName,
  });
  const hasDealerContact = dealerDisplayName !== '未提供車商資訊' || dealerPhone.length > 0;

  const safeImages = useMemo(() => {
    if (Array.isArray(vehicle.images)) {
      return vehicle.images.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      );
    }
    if (typeof vehicle.images === 'string') {
      try {
        const parsed = JSON.parse(vehicle.images);
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [vehicle.images]);
  const placeholderImage = '/images/vehicle-placeholder.svg';
  const coverImageUrl = safeImages[0] ? normalizeVehicleImageUrl(safeImages[0]) : placeholderImage;
  const [imageSrc, setImageSrc] = useState(coverImageUrl);

  useEffect(() => {
    setImageSrc(coverImageUrl);
  }, [coverImageUrl]);

  const cardContent = (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all',
        'hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50',
        className
      )}
    >
      {/* 圖片區域 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${vehicle.brand_name} ${vehicle.spec_name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageSrc(placeholderImage)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-30">🚗</span>
          </div>
        )}

        {/* 圖片數量 */}
        {safeImages.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            1/{safeImages.length}
          </span>
        )}

        {/* [v12] 可盤徽章（右上角、綠色、小） */}
        {vehicle.is_tradable && (
          <span
            className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-md bg-green-600/95 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm ring-1 ring-green-700/30"
            title={
              vehicle.trade_price
                ? `可盤 · 盤價 ${vehicle.trade_price.toLocaleString('zh-TW')}`
                : '可盤'
            }
          >
            可盤
          </span>
        )}

        {/* 狀態標籤 */}
        {showStatus && (
          <div className="absolute left-2 top-2">
            <VehicleStatusBadge
              status={vehicle.status}
              rejectionReason={vehicle.rejection_reason}
            />
          </div>
        )}
      </div>

      {/* 資訊區域 */}
      <div className="p-4">
        {/* 品牌/規格/車型 */}
        <h3 className="mb-1 font-semibold text-foreground line-clamp-1">
          {vehicle.brand_name} {vehicle.spec_name}
        </h3>
        <p className="mb-2 text-sm text-muted-foreground">
          {vehicle.model_name}
        </p>

        {/* 規格資訊 */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {vehicle.year} 年
          </span>
          <span>|</span>
          <span>{vehicle.color}</span>
          {vehicle.mileage && (
            <>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {formatMileage(vehicle.mileage)}
              </span>
            </>
          )}
        </div>

        {/* 價格 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary-600">
              {formatListingPrice(resolvedPrice)}
            </p>
            {/* 成本（僅擁有者可見） */}
            {showCost && vehicle.acquisition_cost && (
              <p className="text-xs text-muted-foreground">
                成本：$ {vehicle.acquisition_cost.toLocaleString('zh-TW')}
              </p>
            )}
            {/* [v12] 若可盤且有盤價，顯示盤價 */}
            {vehicle.is_tradable && vehicle.trade_price && vehicle.trade_price > 0 && (
              <p className="text-xs font-medium text-green-700">
                盤價：$ {vehicle.trade_price.toLocaleString('zh-TW')}
              </p>
            )}
          </div>
        </div>

        {/* 車行資訊 */}
        {showDealer && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {dealerDisplayName}
              </span>
            </div>
            {dealerPhone ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `tel:${dealerPhone}`;
                }}
                className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-200"
              >
                <Phone className="h-3 w-3" />
                聯絡
              </button>
            ) : (
              hasDealerContact && (
                <span className="text-xs text-muted-foreground">聯絡資訊未公開</span>
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  // 如果有連結，包裝成 Link
  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

/**
 * 車輛卡片骨架載入
 */
export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* 圖片佔位 */}
      <div className="aspect-[4/3] animate-pulse bg-muted" />

      {/* 資訊佔位 */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
