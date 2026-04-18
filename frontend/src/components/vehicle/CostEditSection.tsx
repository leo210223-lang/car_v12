'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, Loader2, Save, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVehicleActions } from '@/hooks/useVehicles';

interface CostEditSectionProps {
  vehicleId: string;
  initialAcquisitionCost: number | null | undefined;
  initialRepairCost: number | null | undefined;
  listingPrice: number | null | undefined;
  onChanged?: () => void;
  className?: string;
}

function formatAmount(n: number | null | undefined): string {
  if (n == null || n < 0) return '未填寫';
  if (n === 0) return '$ 0';
  return `$ ${n.toLocaleString('zh-TW')}`;
}

/**
 * [v12] 私人成本快速編輯 Section
 *  - 收購成本 + 基礎整備費（vehicles.acquisition_cost / vehicles.repair_cost）
 *  - 車行可直接在「我的車詳情頁」修改，不必進編輯頁
 *  - 整備費細項另外在 ExpensesSection 做逐筆紀錄
 */
export function CostEditSection({
  vehicleId,
  initialAcquisitionCost,
  initialRepairCost,
  listingPrice,
  onChanged,
  className,
}: CostEditSectionProps) {
  const { updateVehicle } = useVehicleActions();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acquisitionCost, setAcquisitionCost] = useState<string>(
    initialAcquisitionCost != null ? String(initialAcquisitionCost) : ''
  );
  const [repairCost, setRepairCost] = useState<string>(
    initialRepairCost != null ? String(initialRepairCost) : ''
  );

  // 當外部資料變化時同步
  useEffect(() => {
    if (!isEditing) {
      setAcquisitionCost(initialAcquisitionCost != null ? String(initialAcquisitionCost) : '');
      setRepairCost(initialRepairCost != null ? String(initialRepairCost) : '');
    }
  }, [initialAcquisitionCost, initialRepairCost, isEditing]);

  const handleCancel = useCallback(() => {
    setAcquisitionCost(initialAcquisitionCost != null ? String(initialAcquisitionCost) : '');
    setRepairCost(initialRepairCost != null ? String(initialRepairCost) : '');
    setIsEditing(false);
  }, [initialAcquisitionCost, initialRepairCost]);

  const handleSave = useCallback(async () => {
    const ac = acquisitionCost === '' ? null : Number(acquisitionCost);
    const rc = repairCost === '' ? null : Number(repairCost);
    if (ac !== null && (!Number.isFinite(ac) || ac < 0)) {
      toast.error('收購成本須為 ≥ 0 的整數');
      return;
    }
    if (rc !== null && (!Number.isFinite(rc) || rc < 0)) {
      toast.error('整備費須為 ≥ 0 的整數');
      return;
    }
    setSaving(true);
    try {
      const res = await updateVehicle(vehicleId, {
        acquisition_cost: ac,
        repair_cost: rc,
      });
      if (res.success) {
        toast.success('成本已更新');
        setIsEditing(false);
        onChanged?.();
      } else {
        toast.error(res.message || '更新失敗');
      }
    } catch {
      toast.error('更新失敗');
    } finally {
      setSaving(false);
    }
  }, [acquisitionCost, repairCost, updateVehicle, vehicleId, onChanged]);

  // 預估利潤（先用基礎成本估，整備費細項在另一個區塊）
  const acqForProfit = initialAcquisitionCost ?? 0;
  const repairForProfit = initialRepairCost ?? 0;
  const estimatedProfit =
    listingPrice != null && listingPrice > 0
      ? listingPrice - acqForProfit - repairForProfit
      : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-dashed border-primary-300 bg-primary-50/50 p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          <Coins className="h-4 w-4 text-primary-500" />
          🔒 私人成本紀錄
        </h3>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 rounded-md bg-primary-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            編輯
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-md bg-white border border-border p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-md bg-primary-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              儲存
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 收購成本 */}
        <div>
          <p className="mb-1 text-xs text-muted-foreground">收購成本</p>
          {isEditing ? (
            <input
              type="number"
              inputMode="numeric"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              placeholder="未填寫"
              className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-base font-semibold text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          ) : (
            <p className="text-lg font-bold text-foreground">
              {formatAmount(initialAcquisitionCost)}
            </p>
          )}
        </div>

        {/* 基礎整備費 */}
        <div>
          <p className="mb-1 text-xs text-muted-foreground">基礎整備費</p>
          {isEditing ? (
            <input
              type="number"
              inputMode="numeric"
              value={repairCost}
              onChange={(e) => setRepairCost(e.target.value)}
              placeholder="未填寫"
              className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-base font-semibold text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          ) : (
            <p className="text-lg font-bold text-foreground">
              {formatAmount(initialRepairCost)}
            </p>
          )}
        </div>
      </div>

      {/* 預估利潤 */}
      {estimatedProfit != null && (
        <div className="mt-3 rounded-lg bg-white/60 p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">預估利潤（未計細項）</span>
            <span
              className={cn(
                'text-sm font-bold',
                estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {estimatedProfit >= 0 ? '+' : ''}
              {formatAmount(estimatedProfit)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            精確利潤請參考下方「整備費細項做帳」總計後的結果
          </p>
        </div>
      )}

      {!isEditing && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          💡 整備費可以逐筆細項紀錄（例：洗車、鍍膜、鈑金...），請往下看「整備費細項做帳」
        </p>
      )}
    </motion.section>
  );
}
