'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { VehicleForm, VehicleFormData } from '@/components/vehicle/VehicleForm';
import { TradableSection } from '@/components/vehicle';
import { useVehicle, useVehicleActions } from '@/hooks/useVehicles';
import { toast } from 'sonner';

/**
 * 編輯車輛頁面
 *
 * [v12 變更]
 *  - 加入可盤切換區塊（TradableSection）
 *  - 僅在非 rejected 狀態顯示（rejected 要先重新送審）
 *
 * [v12.1 變更]
 *  - 移除 ExpensesSection（已整合進詳情頁的 CostEditSection）
 */
export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const { vehicle, isLoading, isError, refresh } = useVehicle(vehicleId);
  const { updateVehicle } = useVehicleActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: VehicleFormData) => {
      setIsSubmitting(true);
      try {
        const result = await updateVehicle(vehicleId, data);
        if (result.success) {
          toast.success('車輛資料已更新！');
          router.push(`/my-cars/${vehicleId}`);
        } else {
          toast.error(result.message || '更新失敗，請重試');
        }
      } catch {
        toast.error('更新失敗，請檢查網路連線');
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateVehicle, vehicleId, router]
  );

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

  // 只有已上架（approved）車輛可以設定可盤
  const canSetTradable = vehicle.status === 'approved';

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-24">
      {/* 頂部導航 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-600 shadow-lg">
            <Edit3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">編輯車輛</h1>
            <p className="text-xs text-muted-foreground">
              {vehicle.brand_name} {vehicle.spec_name} {vehicle.model_name}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 退件理由提示 */}
      {vehicle.status === 'rejected' && vehicle.rejection_reason && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg bg-red-50 px-4 py-3"
        >
          <p className="text-sm font-medium text-red-700">❌ 退件理由</p>
          <p className="mt-1 text-sm text-red-600">{vehicle.rejection_reason}</p>
          <p className="mt-2 text-xs text-red-500">
            請根據退件理由修改後重新送出
          </p>
        </motion.div>
      )}

      {/* 表單 */}
      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={vehicle.status === 'rejected' ? '修改後重新送審' : '儲存變更'}
        showCostFields
      />

      {/* [v12] 可盤設定（僅已上架可設定） */}
      {canSetTradable ? (
        <div className="mt-4">
          <TradableSection
            vehicleId={vehicleId}
            initialIsTradable={vehicle.is_tradable ?? false}
            initialTradePrice={vehicle.trade_price ?? null}
            onChanged={() => refresh()}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
          車輛需為「已上架」狀態才能設定可盤
        </div>
      )}
    </div>
  );
}
