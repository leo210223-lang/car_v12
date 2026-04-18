'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVehicleActions } from '@/hooks/useVehicles';

interface TradableSectionProps {
  vehicleId: string;
  initialIsTradable: boolean;
  initialTradePrice: number | null | undefined;
  onChanged?: () => void;
  className?: string;
}

/**
 * 可盤切換 Section — 供「我的車編輯」使用
 *  - toggle 可盤
 *  - 可盤時要求輸入盤價
 */
export function TradableSection({
  vehicleId,
  initialIsTradable,
  initialTradePrice,
  onChanged,
  className,
}: TradableSectionProps) {
  const { updateTradable } = useVehicleActions();
  const [isTradable, setIsTradable] = useState<boolean>(initialIsTradable);
  const [tradePrice, setTradePrice] = useState<string>(
    initialTradePrice != null ? String(initialTradePrice) : ''
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsTradable(initialIsTradable);
    setTradePrice(initialTradePrice != null ? String(initialTradePrice) : '');
  }, [initialIsTradable, initialTradePrice]);

  const handleSave = useCallback(async () => {
    if (isTradable) {
      const n = Number(tradePrice);
      if (!Number.isFinite(n) || n <= 0) {
        toast.error('設定為可盤時，盤價必須大於 0');
        return;
      }
    }
    setSaving(true);
    try {
      const res = await updateTradable(vehicleId, {
        is_tradable: isTradable,
        trade_price: isTradable ? Number(tradePrice) : null,
      });
      if (res.success) {
        toast.success(isTradable ? '已設為可盤' : '已取消可盤');
        onChanged?.();
      } else {
        toast.error(res.message || '更新失敗');
      }
    } catch {
      toast.error('更新失敗');
    } finally {
      setSaving(false);
    }
  }, [isTradable, tradePrice, updateTradable, vehicleId, onChanged]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          <RefreshCw className="h-4 w-4 text-green-600" />
          盤車設定
        </h3>
        {isTradable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            可盤
          </span>
        )}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        開啟後，此車輛會出現在盤車列表中；同業可看到車況與盤價。
      </p>

      {/* 可盤 toggle */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <span className="text-sm font-medium text-foreground">開放此車可盤</span>
        <button
          type="button"
          onClick={() => setIsTradable((v) => !v)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isTradable ? 'bg-green-500' : 'bg-gray-300'
          )}
          aria-pressed={isTradable}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
              isTradable ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* 盤價輸入 */}
      {isTradable && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3"
        >
          <label className="mb-1 block text-sm font-medium text-foreground">
            盤價 *
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={tradePrice}
            onChange={(e) => setTradePrice(e.target.value)}
            placeholder="請輸入盤價"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          {tradePrice && Number(tradePrice) > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              約 {(Number(tradePrice) / 10000).toFixed(1)} 萬元
            </p>
          )}
        </motion.div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50',
          isTradable ? 'bg-green-600 hover:bg-green-700' : 'bg-muted-foreground hover:opacity-90'
        )}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin" />
            儲存中...
          </span>
        ) : (
          isTradable ? '儲存可盤設定' : '儲存（取消可盤）'
        )}
      </button>
    </motion.section>
  );
}
