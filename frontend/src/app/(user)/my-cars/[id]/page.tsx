'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit3,
  Archive,
  Trash2,
  RotateCcw,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { VehicleDetail } from '@/components/vehicle/VehicleDetail';
import { useVehicle, useVehicleActions } from '@/hooks/useVehicles';
import { toast } from 'sonner';

/**
 * 我的車 - 車輛詳情頁
 */
export default function MyVehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const { vehicle, isLoading, isError, refresh } = useVehicle(vehicleId);
  const { archiveVehicle, resubmitVehicle, deleteVehicle } = useVehicleActions();

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // 下架
  const handleArchive = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await archiveVehicle(vehicleId);
      if (result.success) {
        toast.success('車輛已下架');
        setShowArchiveDialog(false);
        refresh();
      } else {
        toast.error(result.message || '下架失敗');
      }
    } catch {
      toast.error('操作失敗');
    } finally {
      setIsProcessing(false);
    }
  }, [archiveVehicle, vehicleId, refresh]);

  // 重新送審
  const handleResubmit = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await resubmitVehicle(vehicleId);
      if (result.success) {
        toast.success('已重新送審');
        refresh();
      } else {
        toast.error(result.message || '送審失敗');
      }
    } catch {
      toast.error('操作失敗');
    } finally {
      setIsProcessing(false);
    }
  }, [resubmitVehicle, vehicleId, refresh]);

  // 永久刪除
  const handleDelete = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await deleteVehicle(vehicleId);
      if (result.success) {
        toast.success('車輛已永久刪除');
        router.push('/my-cars');
      } else {
        toast.error(result.message || '刪除失敗');
      }
    } catch {
      toast.error('操作失敗');
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  }, [deleteVehicle, vehicleId, router]);

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 錯誤
  if (isError || !vehicle) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-4 text-6xl">🚗</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">找不到車輛</h2>
        <p className="mb-6 text-center text-muted-foreground">此車輛可能已被刪除</p>
        <Button onClick={() => router.push('/my-cars')}>回到我的車</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-[calc(8rem+env(safe-area-inset-bottom))]">
      {/* 頂部導航 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">車輛詳情</h1>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
          {/* 操作選單 */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-border bg-card py-1 shadow-lg"
            >
              {/* 編輯 - 待審核和已退件可編輯 */}
              {(vehicle.status === 'pending' || vehicle.status === 'rejected') && (
                <button
                  onClick={() => {
                    setShowActions(false);
                    router.push(`/my-cars/${vehicleId}/edit`);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-primary-50"
                >
                  <Edit3 className="h-4 w-4" />
                  編輯車輛
                </button>
              )}
              {/* 重新送審 - 僅已退件 */}
              {vehicle.status === 'rejected' && (
                <button
                  onClick={() => {
                    setShowActions(false);
                    handleResubmit();
                  }}
                  disabled={isProcessing}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  重新送審
                </button>
              )}
              {/* 下架 - 僅已上架 */}
              {vehicle.status === 'approved' && (
                <button
                  onClick={() => {
                    setShowActions(false);
                    setShowArchiveDialog(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                >
                  <Archive className="h-4 w-4" />
                  下架車輛
                </button>
              )}
              {/* 永久刪除 - 僅已下架 */}
              {vehicle.status === 'archived' && (
                <button
                  onClick={() => {
                    setShowActions(false);
                    setShowDeleteDialog(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  永久刪除
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* 退件理由提示 */}
      {vehicle.status === 'rejected' && vehicle.rejection_reason && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg bg-red-50 px-4 py-3"
        >
          <p className="text-sm font-medium text-red-700">❌ 退件理由</p>
          <p className="mt-1 text-sm text-red-600">{vehicle.rejection_reason}</p>
        </motion.div>
      )}

      {/* 車輛詳情 */}
      <VehicleDetail vehicle={vehicle} showCost />

      {/* 底部操作列 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-lg gap-2">
          {vehicle.status === 'approved' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/my-cars/${vehicleId}/edit`)}
              >
                <Edit3 className="mr-1.5 h-4 w-4" />
                編輯
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-amber-600 hover:bg-amber-50"
                onClick={() => setShowArchiveDialog(true)}
              >
                <Archive className="mr-1.5 h-4 w-4" />
                下架
              </Button>
            </>
          )}
          {vehicle.status === 'rejected' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/my-cars/${vehicleId}/edit`)}
              >
                <Edit3 className="mr-1.5 h-4 w-4" />
                修改後重送
              </Button>
              <Button
                className="flex-1"
                onClick={handleResubmit}
                disabled={isProcessing}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                重新送審
              </Button>
            </>
          )}
          {vehicle.status === 'archived' && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              永久刪除
            </Button>
          )}
          {vehicle.status === 'pending' && (
            <div className="flex h-11 flex-1 items-center justify-center rounded-lg bg-yellow-50 px-3 text-sm text-yellow-700">
              ⏳ 審核中，請耐心等待
            </div>
          )}
        </div>
      </motion.div>

      {/* 下架確認對話框 */}
      <ConfirmDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        title="確定下架此車輛？"
        description="下架後車輛將不會出現在尋車列表中，您之後可以選擇永久刪除。"
        confirmLabel="確定下架"
        onConfirm={handleArchive}
        loading={isProcessing}
      />

      {/* 永久刪除確認對話框 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="確定永久刪除此車輛？"
        description="刪除後將無法復原，包括所有車輛圖片及成本記錄。"
        confirmLabel="永久刪除"
        onConfirm={handleDelete}
        destructive
        loading={isProcessing}
      />
    </div>
  );
}
