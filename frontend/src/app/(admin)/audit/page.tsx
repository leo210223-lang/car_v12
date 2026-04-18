'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { usePendingVehicles, useAuditActions } from '@/hooks/useAudit';
import { AuditCard, RejectDialog } from '@/components/admin';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StatusFilter = 'pending' | 'rejected';

/**
 * 待審核列表頁面
 */
export default function AuditPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const { vehicles, total, isLoading, refresh } = usePendingVehicles({ status: statusFilter });
  const { approveVehicle, rejectVehicle, isSubmitting } = useAuditActions();

  // 找到要退件的車輛標題
  const rejectTargetVehicle = vehicles.find((v) => v.id === rejectTargetId);
  const rejectTargetTitle = rejectTargetVehicle
    ? `${rejectTargetVehicle.year} ${rejectTargetVehicle.brand_name} ${rejectTargetVehicle.spec_name}`
    : undefined;

  // 快速核准
  const handleQuickApprove = async (id: string) => {
    const result = await approveVehicle(id);
    if (result.success) {
      toast.success(result.message || '車輛已核准上架');
      refresh();
    } else {
      toast.error(result.message || '核准失敗');
    }
  };

  // 確認退件
  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTargetId) return;
    const result = await rejectVehicle(rejectTargetId, reason);
    if (result.success) {
      toast.success(result.message || '車輛已退件');
      setRejectTargetId(null);
      refresh();
    } else {
      toast.error(result.message || '退件失敗');
    }
  };

  const filters: { value: StatusFilter; label: string; icon: typeof ClipboardCheck }[] = [
    { value: 'pending', label: '待審核', icon: ClipboardCheck },
    { value: 'rejected', label: '已退件', icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* 標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">車輛審核</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            審核車行送出的車輛上架申請
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          重新整理
        </button>
      </div>

      {/* 篩選標籤 */}
      <div className="flex gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-muted-foreground hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {filter.label}
              {filter.value === 'pending' && total > 0 && (
                <span className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-xs font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                )}>
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 車輛列表 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
            <span className="text-sm text-muted-foreground">載入中...</span>
          </div>
        </div>
      ) : vehicles.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AuditCard
                vehicle={vehicle}
                onApprove={handleQuickApprove}
                onReject={setRejectTargetId}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-card"
        >
          <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">
            {statusFilter === 'pending' ? '沒有待審核的車輛' : '沒有已退件的車輛'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter === 'pending' ? '所有車輛都已審核完畢' : '目前沒有被退件的車輛記錄'}
          </p>
        </motion.div>
      )}

      {/* 退件對話框 */}
      <RejectDialog
        isOpen={rejectTargetId !== null}
        onClose={() => setRejectTargetId(null)}
        onConfirm={handleRejectConfirm}
        isSubmitting={isSubmitting}
        vehicleTitle={rejectTargetTitle}
      />
    </div>
  );
}
