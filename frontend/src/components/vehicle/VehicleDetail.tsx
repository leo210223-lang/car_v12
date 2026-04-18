'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Palette,
  Building2,
  Phone,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { ImageGallery, VehicleStatusBadge } from '@/components/vehicle';
import { cn, formatDealerName, parseVehicleImages } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';

// ============================================================================
// Helpers
// ============================================================================

const FUEL_TYPE_MAP: Record<string, string> = {
  gasoline: '汽油',
  diesel: '柴油',
  hybrid: '油電混合',
  electric: '純電',
};

const TRANSMISSION_MAP: Record<string, string> = {
  auto: '自排',
  manual: '手排',
  semi_auto: '手自排',
  cvt: 'CVT',
};

function formatListingPrice(price?: number | null): string {
  if (price != null && price > 0) {
    return `$ ${price.toLocaleString('zh-TW')}`;
  }
  return '洽詢價格';
}

function formatAmount(price?: number | null): string {
  if (price != null && price > 0) {
    return `$ ${price.toLocaleString('zh-TW')}`;
  }
  return '未填寫';
}

function formatMileage(mileage?: number): string {
  if (mileage == null || mileage < 0) return '未提供';
  return `${mileage.toLocaleString()} km`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// Sub-components
// ============================================================================

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

function InfoItem({ icon, label, value, className }: InfoItemProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

interface VehicleDetailProps {
  vehicle: Vehicle;
  /** 是否顯示成本（僅擁有者） */
  showCost?: boolean;
  /** 額外樣式 */
  className?: string;
}

/**
 * 車輛詳情元件 - 完整資訊展示
 */
export function VehicleDetail({ vehicle, showCost = false, className }: VehicleDetailProps) {
  const galleryImages = parseVehicleImages(vehicle.images);
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
  const hasDealerContact = dealerCompanyName.length > 0 || dealerPhone.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 圖片輪播 */}
      <ImageGallery images={galleryImages} />

      {/* 基本資訊 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {vehicle.brand_name} {vehicle.spec_name}
            </h2>
            <p className="text-sm text-muted-foreground">{vehicle.model_name}</p>
          </div>
          <VehicleStatusBadge status={vehicle.status} rejectionReason={vehicle.rejection_reason} />
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary-600">{formatListingPrice(vehicle.listing_price)}</span>
        </div>
      </motion.div>

      {/* 車輛規格 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-3 text-sm font-semibold text-foreground">車輛規格</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon={<Calendar className="h-4 w-4" />} label="年份" value={`${vehicle.year} 年`} />
          <InfoItem icon={<Palette className="h-4 w-4" />} label="顏色" value={vehicle.color || '未提供'} />
          <InfoItem icon={<Gauge className="h-4 w-4" />} label="里程" value={formatMileage(vehicle.mileage)} />
          <InfoItem icon={<Settings2 className="h-4 w-4" />} label="變速箱" value={vehicle.transmission ? (TRANSMISSION_MAP[vehicle.transmission] || vehicle.transmission) : '未提供'} />
          <InfoItem icon={<Fuel className="h-4 w-4" />} label="燃油" value={vehicle.fuel_type ? (FUEL_TYPE_MAP[vehicle.fuel_type] || vehicle.fuel_type) : '未提供'} />
          <InfoItem icon={<Clock className="h-4 w-4" />} label="上架日期" value={formatDate(vehicle.created_at)} />
        </div>
      </motion.div>

      {/* 車行資訊 */}
      {hasDealerContact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-foreground">車行資訊</h3>
          <div className="space-y-3">
            <InfoItem
              icon={<Building2 className="h-4 w-4" />}
              label="車行名稱"
              value={dealerDisplayName}
            />
            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="聯絡電話"
              value={dealerPhone || '聯絡資訊未公開'}
            />
          </div>
        </motion.div>
      )}

      {/* 描述 */}
      {vehicle.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary-500" />
            車況說明
          </h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{vehicle.description}</p>
        </motion.div>
      )}

      {/* 成本資訊（僅擁有者） */}
      {showCost && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-dashed border-primary-300 bg-primary-50/50 p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-foreground">🔒 私人成本紀錄</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">收購成本</p>
              <p className="text-lg font-bold text-foreground">
                {formatAmount(vehicle.acquisition_cost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">整備費</p>
              <p className="text-lg font-bold text-foreground">
                {formatAmount(vehicle.repair_cost)}
              </p>
            </div>
          </div>
          {vehicle.acquisition_cost && vehicle.listing_price && vehicle.listing_price > 0 && (
            <div className="mt-3 rounded-lg bg-white/60 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">預估利潤</span>
                <span className={cn(
                  'text-sm font-bold',
                  (vehicle.listing_price - vehicle.acquisition_cost - (vehicle.repair_cost ?? 0)) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                )}>
                  {formatListingPrice(vehicle.listing_price - vehicle.acquisition_cost - (vehicle.repair_cost ?? 0))}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
