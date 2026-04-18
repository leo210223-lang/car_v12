'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleDetail } from '@/components/vehicle/VehicleDetail';
import { ImageGallery } from '@/components/vehicle/ImageGallery';
import { api } from '@/lib/api';
import { parseVehicleImages } from '@/lib/utils';
import { toast } from 'sonner';
import { useAdminVehicleTradableActions } from '@/hooks/useAdminVehicleTradable';
import type { Vehicle } from '@/hooks/useVehicles';

/**
 * Admin 車輛審核詳情頁面
 *
 * [v12 變更] 若車輛目前為可盤（is_tradable），新增「取消可盤」按鈕
 */
export default function VehicleAuditPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [cancellingTradable, setCancellingTradable] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { cancelTradable } = useAdminVehicleTradableActions();

  // 載入車輛詳情
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get<Vehicle>(`/admin/vehicles/${vehicleId}/detail`);
        if (response.success && response.data) {
          setVehicle(response.data);
        } else {
          toast.error(response.message || '載入失敗，請重試');
          router.back();
        }
      } catch (error) {
        console.error('載入詳情失敗:', error);
        toast.error('載入失敗，請檢查網路連線');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchDetail();
    }
  }, [vehicleId, router]);

  // 核准車輛
  const handleApprove = useCallback(async () => {
    if (!vehicle) return;

    if (!window.confirm('確認要核准此車輛嗎？')) {
      return;
    }

    try {
      setApproving(true);
      const response = await api.post<Vehicle>(`/admin/vehicles/${vehicle.id}/approve`);

      if (response.success) {
        toast.success('車輛已核准！');
        setVehicle({ ...vehicle, status: 'approved' as const });
        setTimeout(() => {
          router.push('/vehicles');
        }, 1500);
      } else {
        toast.error(response.message || '核准失敗，請重試');
      }
    } catch (error) {
      console.error('核准失敗:', error);
      toast.error('核准失敗，請檢查網路連線');
    } finally {
      setApproving(false);
    }
  }, [vehicle, router]);

  // 拒絕車輛
  const handleReject = useCallback(async () => {
    if (!vehicle) return;

    if (!rejectionReason.trim()) {
      toast.error('請填寫拒絕原因');
      return;
    }

    if (!window.confirm('確認要拒絕此車輛嗎？')) {
      return;
    }

    try {
      setRejecting(true);
      const response = await api.post<Vehicle>(`/admin/vehicles/${vehicle.id}/reject`, {
        rejection_reason: rejectionReason.trim(),
      });

      if (response.success) {
        toast.success('車輛已拒絕！');
        setVehicle({
          ...vehicle,
          status: 'rejected' as const,
          rejection_reason: rejectionReason.trim(),
        });
        setTimeout(() => {
          router.push('/vehicles');
        }, 1500);
      } else {
        toast.error(response.message || '拒絕失敗，請重試');
      }
    } catch (error) {
      console.error('拒絕失敗:', error);
      toast.error('拒絕失敗，請檢查網路連線');
    } finally {
      setRejecting(false);
    }
  }, [vehicle, rejectionReason, router]);

  // [v12] 取消可盤
  const handleCancelTradable = useCallback(async () => {
    if (!vehicle) return;
    if (!window.confirm('確認要取消此車的可盤狀態嗎？車主仍可之後自行重新開啟。')) return;

    try {
      setCancellingTradable(true);
      const res = await cancelTradable(vehicle.id);
      if (res.success) {
        toast.success('已取消該車的可盤狀態');
        setVehicle({
          ...vehicle,
          is_tradable: false,
          trade_price: null,
        });
      } else {
        toast.error(res.message || '操作失敗');
      }
    } catch (error) {
      console.error('取消可盤失敗:', error);
      toast.error('操作失敗');
    } finally {
      setCancellingTradable(false);
    }
  }, [vehicle, cancelTradable]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary-500" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Car className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">找不到該車輛</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            返回
          </Button>
        </div>
      </div>
    );
  }

  const galleryImages = parseVehicleImages(vehicle.images);

  return (
    <div className="space-y-6 pb-24">
      {/* 頂部導航 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">車輛審核</h1>
          <p className="text-sm text-muted-foreground">
            {vehicle.year} {vehicle.brand_name} {vehicle.spec_name} {vehicle.model_name}
          </p>
        </div>
      </motion.div>

      {/* [v12] 可盤狀態顯示 + 取消按鈕 */}
      {vehicle.is_tradable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
              可盤
            </span>
            <div>
              <p className="text-sm font-medium text-green-900">
                此車目前為「可盤」狀態
              </p>
              {vehicle.trade_price && vehicle.trade_price > 0 && (
                <p className="text-xs text-green-800/80">
                  盤價：${vehicle.trade_price.toLocaleString('zh-TW')}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelTradable}
            disabled={cancellingTradable}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {cancellingTradable ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            取消可盤
          </Button>
        </motion.div>
      )}

      {/* 狀態提示 */}
      {vehicle.status !== 'pending' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            vehicle.status === 'approved'
              ? 'border border-green-200 bg-green-50 text-green-700'
              : vehicle.status === 'rejected'
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {vehicle.status === 'approved' && '✅ 此車輛已核准'}
          {vehicle.status === 'rejected' && `❌ 此車輛已拒絕：${vehicle.rejection_reason}`}
          {vehicle.status === 'archived' && '🗑️ 此車輛已下架'}
        </motion.div>
      )}

      {/* 圖片庫 */}
      {galleryImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ImageGallery images={galleryImages} />
        </motion.div>
      )}

      {/* 車輛詳情 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <VehicleDetail vehicle={vehicle} showCost={true} />
      </motion.div>

      {/* 審核操作區 */}
      {vehicle.status === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-bold text-foreground">審核操作</h2>

          {/* 核准按鈕 */}
          <Button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                核准中...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                核准車輛
              </>
            )}
          </Button>

          {/* 拒絕按鈕 */}
          <Button
            onClick={() => setShowRejectForm(!showRejectForm)}
            disabled={approving || rejecting}
            variant="outline"
            className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <XCircle className="h-4 w-4" />
            {showRejectForm ? '取消拒絕' : '拒絕車輛'}
          </Button>

          {/* 拒絕表單 */}
          {showRejectForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 border-t border-border pt-4"
            >
              <label className="block text-sm font-medium text-foreground">
                拒絕原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="請說明拒絕的原因，該原因將會通知車主..."
                className="h-24 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <Button
                onClick={handleReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    拒絕中...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    確認拒絕
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* 返回按鈕 */}
      {vehicle.status !== 'pending' && (
        <Button onClick={() => router.push('/vehicles')} className="w-full">
          返回列表
        </Button>
      )}
    </div>
  );
}
