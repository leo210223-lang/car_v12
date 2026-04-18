'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Loader2, Save, Plus, Minus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAdminCreditsActions } from '@/hooks/useAdminCredits';

interface CreditsPanelProps {
  userId: string;
  initialCredits: number;
  onChanged?: (credits: number) => void;
  className?: string;
}

/**
 * [v12] 管理員用：調整某會員的點數
 */
export function CreditsPanel({
  userId,
  initialCredits,
  onChanged,
  className,
}: CreditsPanelProps) {
  const { setCredits } = useAdminCreditsActions();
  const [value, setValue] = useState<string>(String(initialCredits));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(initialCredits));
  }, [initialCredits]);

  const parsed = Number(value);
  const isValid = Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed);
  const hasChange = isValid && parsed !== initialCredits;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('點數必須是 ≥ 0 的整數');
      return;
    }
    setSaving(true);
    try {
      const res = await setCredits(userId, parsed);
      if (res.success) {
        toast.success(`點數已更新為 ${parsed.toLocaleString('zh-TW')}`);
        onChanged?.(parsed);
      } else {
        toast.error(res.message || '更新失敗');
      }
    } catch {
      toast.error('更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const adjust = (delta: number) => {
    const next = Math.max(0, (parsed || 0) + delta);
    setValue(String(next));
  };

  const reset = () => setValue(String(initialCredits));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-amber-300 bg-linear-to-br from-amber-50 to-yellow-50 p-5',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-5 w-5 text-amber-700" />
        <h3 className="text-base font-semibold text-amber-900">點數管理</h3>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-md bg-white/60 px-3 py-2">
        <span className="text-sm text-amber-900/70">目前點數</span>
        <span className="text-xl font-bold text-amber-900">
          {initialCredits.toLocaleString('zh-TW')}
        </span>
      </div>

      {/* 數字輸入 + 快捷鍵 */}
      <div className="mb-3 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => adjust(-10)}
          className="flex w-9 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
          title="-10"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-md border border-amber-200 bg-white px-3 py-2 text-center text-base font-semibold text-amber-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          min={0}
          step={1}
        />
        <button
          type="button"
          onClick={() => adjust(10)}
          className="flex w-9 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
          title="+10"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 快捷鍵 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[100, 500, 1000].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => adjust(n)}
            className="rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            +{n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setValue('0')}
          className="rounded-full border border-red-300 bg-white px-2.5 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          歸零
        </button>
        <button
          type="button"
          onClick={reset}
          className="ml-auto flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          title="還原"
        >
          <RotateCcw className="h-3 w-3" />
          還原
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !hasChange}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {hasChange ? '儲存點數變更' : '無變更'}
      </button>
    </motion.div>
  );
}
