'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Palette,
  Building2,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ImageGallery, VehicleStatusBadge } from '@/components/vehicle';
import { useVehicle, Vehicle } from '@/hooks/useVehicles';
import { cn, formatDealerName, parseVehicleImages } from '@/lib/utils';
import { useCallback, useState } from 'react';

/**
 * 燃油類型顯示
 */
const FUEL_TYPE_MAP: Record<string, string> = {
  gasoline: '汽油',
  diesel: '柴油',
  hybrid: '油電混合',
  electric: '純電',
};

/**
 * 變速箱類型顯示
 */
const TRANSMISSION_MAP: Record<string, string> = {
  auto: '自排',
  manual: '手排',
  semi_auto: '手自排',
  cvt: 'CVT',
};

/**
 * 格式化價格
 */
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
  if (mileage == null || mileage < 0) return '未提供';
  return `${mileage.toLocaleString()} km`;
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 資訊項目元件
 */
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

/**
 * 車輛詳情頁
 */
export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const [isFavorite, setIsFavorite] = useState(false);

  const { vehicle, isLoading, isError } = useVehicle(vehicleId);
  const dealerCompanyName = vehicle?.owner?.company_name || vehicle?.dealer?.company_name || '';
  const dealerContactName = vehicle?.owner?.name || vehicle?.dealer?.name || '';
  const dealerDisplayName = formatDealerName({
    company_name: dealerCompanyName,
    name: dealerContactName,
  });
  const isSameCompanyAndContact =
    dealerCompanyName.trim().length > 0 &&
    dealerContactName.trim().length > 0 &&
    dealerCompanyName.trim() === dealerContactName.trim();

  // 返回上一頁
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // 撥打電話
  const handleCall = useCallback((phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }, []);

  // 傳送訊息
  const handleMessage = useCallback((dealerId?: string) => {
    if (dealerId) {
      // TODO: 實作訊息功能，可導向聊天頁面或開啟訊息模態框
      console.log('Send message to dealer:', dealerId);
    }
  }, []);

  // 分享
  const handleShare = useCallback(async () => {
    if (navigator.share && vehicle) {
      try {
        await navigator.share({
          title: `${vehicle.brand_name} ${vehicle.spec_name} ${vehicle.model_name}`,
          text: `${vehicle.year} 年 ${vehicle.brand_name} ${vehicle.spec_name}`,
          url: window.location.href,
        });
      } catch {
        // 使用者取消分享
      }
    } else {
      // 複製連結
      await navigator.clipboard.writeText(window.location.href);
      // TODO: 顯示已複製提示
    }
  }, [vehicle]);

  // 收藏切換
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite((prev) => !prev);
    // TODO: 呼叫 API 更新收藏狀態
  }, []);

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 錯誤或找不到
  if (isError || !vehicle) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-4 text-6xl">🚗</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">找不到車輛</h2>
        <p className="mb-6 text-center text-muted-foreground">
          此車輛可能已下架或不存在
        </p>
        <Button onClick={handleBack}>返回尋車</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* 頂部導航 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-lg"
      >
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className={cn(isFavorite && 'text-red-500')}
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </motion.header>

      {/* 圖片輪播 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4"
      >
        <ImageGallery images={parseVehicleImages(vehicle.images)} alt={`${vehicle.brand_name} ${vehicle.spec_name}`} />
      </motion.div>

      {/* 車輛標題區 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 px-4"
      >
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          {/* 品牌/規格/車型 */}
          <div className="mb-3">
            <h1 className="text-xl font-bold text-foreground">
              {vehicle.brand_name} {vehicle.spec_name}
            </h1>
            <p className="text-muted-foreground">{vehicle.model_name}</p>
          </div>

          {/* 價格 */}
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary-600">
              {formatListingPrice(vehicle.listing_price)}
            </span>
          </div>

          {/* 快速資訊 */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {vehicle.year} 年
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Gauge className="h-4 w-4" />
              {formatMileage(vehicle.mileage)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Fuel className="h-4 w-4" />
              {vehicle.fuel_type
                ? (FUEL_TYPE_MAP[vehicle.fuel_type] || vehicle.fuel_type)
                : '未提供'}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              {vehicle.transmission
                ? (TRANSMISSION_MAP[vehicle.transmission] || vehicle.transmission)
                : '未提供'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 車輛詳細資訊 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 px-4"
      >
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">車輛資訊</h2>
          <div className="grid grid-cols-1 gap-4">
            <InfoItem
              icon={<Calendar className="h-5 w-5" />}
              label="出廠年份"
              value={`${vehicle.year} 年`}
            />
            <InfoItem
              icon={<Gauge className="h-5 w-5" />}
              label="里程數"
              value={formatMileage(vehicle.mileage)}
            />
            <InfoItem
              icon={<Palette className="h-5 w-5" />}
              label="車身顏色"
              value={vehicle.color || '未提供'}
            />
            <InfoItem
              icon={<Settings2 className="h-5 w-5" />}
              label="變速系統"
              value={vehicle.transmission
                ? (TRANSMISSION_MAP[vehicle.transmission] || vehicle.transmission)
                : '未提供'}
            />
            <InfoItem
              icon={<Fuel className="h-5 w-5" />}
              label="燃料類型"
              value={vehicle.fuel_type
                ? (FUEL_TYPE_MAP[vehicle.fuel_type] || vehicle.fuel_type)
                : '未提供'}
            />
            <InfoItem
              icon={<Clock className="h-5 w-5" />}
              label="上架日期"
              value={formatDate(vehicle.created_at)}
            />
          </div>
        </div>
      </motion.div>

      {/* 車輛說明 */}
      {vehicle.description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 px-4"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">車輛說明</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {vehicle.description}
            </p>
          </div>
        </motion.div>
      )}

      {/* 車行資訊 */}
      {vehicle.dealer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 px-4"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-4 font-semibold text-foreground">車行資訊</h2>
            <div className="space-y-3">
              <InfoItem
                icon={<Building2 className="h-5 w-5" />}
                label="車行名稱"
                value={dealerDisplayName}
              />
              <InfoItem
                icon={<User className="h-5 w-5" />}
                label="聯絡人"
                value={
                  isSameCompanyAndContact
                    ? '同車行名稱'
                    : (dealerContactName || '未提供聯絡人')
                }
              />
              <InfoItem
                icon={<Phone className="h-5 w-5" />}
                label="聯絡電話"
                value={vehicle.dealer.phone}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* 底部操作按鈕 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleMessage(vehicle.dealer?.id)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            傳送訊息
          </Button>
          <Button
            className="flex-1 bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:from-primary-600 hover:to-primary-700"
            onClick={() => handleCall(vehicle.dealer?.phone)}
          >
            <Phone className="mr-2 h-4 w-4" />
            立即撥打
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
