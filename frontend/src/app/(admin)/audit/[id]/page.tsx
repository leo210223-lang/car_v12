'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Palette,
  DollarSign,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePendingVehicle, useAuditActions } from '@/hooks/useAudit';
import { RejectDialog } from '@/components/admin';
import { ImageGallery } from '@/components/vehicle';
import { cn, formatDealerName, parseVehicleImages } from '@/lib/utils';
import { toast } from 'sonner';

function formatListingPrice(price?: number | null): string {
  if (price != null && price > 0) {
    return `$${price.toLocaleString()}`;
  }
  return '洽詢價格';
}

/**
 * 審核詳情頁面
 */
export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { vehicle, isLoading, error } = usePendingVehicle(id);
  const { approveVehicle, rejectVehicle, isSubmitting } = useAuditActions();
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // 核准
  const handleApprove = async () => {
    const result = await approveVehicle(id);
    if (result.success) {
      toast.success(result.message || '車輛已核准上架');
      router.push('/audit');
    } else {
      toast.error(result.message || '核准失敗');
    }
  };

  // 退件
  const handleReject = async (reason: string) => {
    const result = await rejectVehicle(id, reason);
    if (result.success) {
      toast.success(result.message || '車輛已退件');
      setShowRejectDialog(false);
      router.push('/audit');
    } else {
      toast.error(result.message || '退件失敗');
    }
  };

  // 載入中
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
          <span className="text-sm text-muted-foreground">載入中...</span>
        </div>
      </div>
    );
  }

  // 錯誤或找不到
  if (error || !vehicle) {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center">
        <Car className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">找不到車輛</h2>
        <p className="mt-2 text-muted-foreground">{error || '此車輛可能已被審核或刪除'}</p>
        <Link
          href="/audit"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          返回審核列表
        </Link>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: '待審核', className: 'bg-amber-100 text-amber-700' },
    rejected: { label: '已退件', className: 'bg-red-100 text-red-700' },
    approved: { label: '已核准', className: 'bg-green-100 text-green-700' },
    archived: { label: '已下架', className: 'bg-gray-100 text-gray-700' },
    draft: { label: '草稿', className: 'bg-blue-100 text-blue-700' },
  };

  const config = statusConfig[vehicle.status] || statusConfig.pending;

  const galleryImages = parseVehicleImages(vehicle.images);
  const dealerCompanyName = vehicle.owner?.company_name || vehicle.dealer?.company_name || '';
  const dealerContactName = vehicle.owner?.name || vehicle.dealer?.name || '';
  const dealerDisplayName = formatDealerName({
    company_name: dealerCompanyName,
    name: dealerContactName,
  });
  const isSameCompanyAndContact =
    dealerCompanyName.trim().length > 0 &&
    dealerContactName.trim().length > 0 &&
    dealerCompanyName.trim() === dealerContactName.trim();
  const dealerPhone = vehicle.owner?.phone || vehicle.dealer?.phone || '未提供';

  const specs = [
    { icon: Calendar, label: '年份', value: `${vehicle.year} 年` },
    { icon: Palette, label: '顏色', value: vehicle.color || '未提供' },
    { icon: Gauge, label: '里程', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} 公里` : '未提供' },
    {
      icon: Settings2,
      label: '變速',
      value: vehicle.transmission
        ? ({
            auto: '自排',
            manual: '手排',
            semi_auto: '手自排',
            cvt: 'CVT',
          }[vehicle.transmission] || vehicle.transmission)
        : '未提供',
    },
    {
      icon: Fuel,
      label: '燃料',
      value: vehicle.fuel_type
        ? ({
            gasoline: '汽油',
            diesel: '柴油',
            hybrid: '油電混合',
            electric: '純電動',
          }[vehicle.fuel_type] || vehicle.fuel_type)
        : '未提供',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/audit"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回審核列表
        </Link>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', config.className)}>
          {config.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側：圖片 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {galleryImages.length > 0 ? (
            <ImageGallery images={galleryImages} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-primary-200 bg-muted">
              <div className="text-center">
                <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">尚未上傳圖片</p>
              </div>
            </div>
          )}

          {/* 圖片數量資訊 */}
          <div className="mt-3 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
            <ImageIcon className="mr-2 inline-block h-4 w-4" />
            共 {galleryImages.length} 張圖片
          </div>
        </motion.div>

        {/* 右側：車輛資訊 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* 標題 */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {vehicle.year} {vehicle.brand_name} {vehicle.spec_name}
            </h1>
            {vehicle.model_name && (
              <p className="mt-1 text-lg text-muted-foreground">{vehicle.model_name}</p>
            )}
          </div>

          {/* 價格 */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary-500" />
            <span className="text-3xl font-bold text-primary-600">
              {formatListingPrice(vehicle.listing_price)}
            </span>
          </div>

          {/* 規格 */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary-200 bg-card p-4">
            {specs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div key={spec.label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary-500" />
                  <span className="text-sm text-muted-foreground">{spec.label}:</span>
                  <span className="text-sm font-medium text-foreground">{spec.value}</span>
                </div>
              );
            })}
          </div>

          {/* 描述 */}
          {vehicle.description && (
            <div className="rounded-xl border border-primary-200 bg-card p-4">
              <h3 className="mb-2 font-medium text-foreground">車輛說明</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{vehicle.description}</p>
            </div>
          )}

          {/* 車行資訊 */}
          <div className="rounded-xl border border-primary-200 bg-card p-4">
            <h3 className="mb-3 font-medium text-foreground">車行資訊</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-500" />
                <span className="text-muted-foreground">車行:</span>
                <span className="font-medium text-foreground">{dealerDisplayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary-500" />
                <span className="text-muted-foreground">聯絡人:</span>
                <span className="font-medium text-foreground">
                  {isSameCompanyAndContact ? '同車行名稱' : (dealerContactName || '未提供聯絡人')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-500" />
                <span className="text-muted-foreground">電話:</span>
                <span className="font-medium text-foreground">{dealerPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" />
                <span className="text-muted-foreground">送審時間:</span>
                <span className="font-medium text-foreground">
                  {new Date(vehicle.created_at).toLocaleString('zh-TW')}
                </span>
              </div>
            </div>
          </div>

          {/* 審核操作按鈕 */}
          {vehicle.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-5 w-5" />
                退件
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
                {isSubmitting ? '處理中...' : '核准上架'}
              </button>
            </div>
          )}

          {/* 已退件顯示理由 */}
          {vehicle.status === 'rejected' && (vehicle as { rejection_reason?: string }).rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-medium text-red-700">
                <XCircle className="h-4 w-4" />
                退件理由
              </h3>
              <p className="text-sm text-red-600">
                {(vehicle as { rejection_reason?: string }).rejection_reason}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* 退件對話框 */}
      <RejectDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        isSubmitting={isSubmitting}
        vehicleTitle={`${vehicle.year} ${vehicle.brand_name} ${vehicle.spec_name}`}
      />
    </div>
  );
}
