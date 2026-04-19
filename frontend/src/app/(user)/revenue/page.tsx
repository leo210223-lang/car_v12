'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Loader2,
  Receipt,
  RefreshCcw,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useMyRevenue } from '@/hooks/useMyRevenue';
import { cn, formatDate } from '@/lib/utils';

/**
 * [v12.1] 車行自己的營收紀錄頁
 * [v12.2] 加入年月篩選（以 archived_at 為準）
 *   路徑：/revenue (car dealer)
 */

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '-';
  return `$${n.toLocaleString('zh-TW')}`;
}

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * 產出可選的「年」清單：當下年份往前 5 年
 */
function getYearOptions(nowYear: number): number[] {
  return [0, 1, 2, 3, 4].map((i) => nowYear - i);
}

const MONTH_LABELS = [
  '1 月', '2 月', '3 月', '4 月', '5 月', '6 月',
  '7 月', '8 月', '9 月', '10 月', '11 月', '12 月',
];

export default function MyRevenuePage() {
  const router = useRouter();

  // [v12.2] 篩選狀態：預設選當月
  const [{ year, month }, setYm] = useState(currentYearMonth());
  /** all = 不套日期 / month = 當前 year+month */
  const [mode, setMode] = useState<'month' | 'all'>('month');

  const filter = mode === 'month' ? { year, month } : {};
  const { records, summary, isLoading, refresh } = useMyRevenue(filter);

  const yearOptions = useMemo(() => {
    const nowY = new Date().getFullYear();
    return getYearOptions(nowY);
  }, []);

  const goPrevMonth = () => {
    if (month === 1) {
      setYm({ year: year - 1, month: 12 });
    } else {
      setYm({ year, month: month - 1 });
    }
  };

  const goNextMonth = () => {
    if (month === 12) {
      setYm({ year: year + 1, month: 1 });
    } else {
      setYm({ year, month: month + 1 });
    }
  };

  const isCurrentMonth = (() => {
    const c = currentYearMonth();
    return year === c.year && month === c.month;
  })();

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-24">
      {/* 頂部導航 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-700 shadow">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">營收紀錄</h1>
              <p className="text-xs text-muted-foreground">下架 30 天後自動結算</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refresh()}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* [v12.2] 月份篩選器 */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-xl border border-border bg-card p-3"
      >
        {/* mode 切換：查當月 / 全部 */}
        <div className="mb-3 flex gap-1">
          <button
            type="button"
            onClick={() => setMode('month')}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            <Calendar className="mr-1 inline h-3 w-3" />
            依月份
          </button>
          <button
            type="button"
            onClick={() => setMode('all')}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            全部
          </button>
        </div>

        {/* 月份選擇 */}
        {mode === 'month' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-md border border-border bg-white p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="上個月"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex-1 flex items-center gap-1">
              <select
                value={year}
                onChange={(e) => setYm({ year: Number(e.target.value), month })}
                className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => setYm({ year, month: Number(e.target.value) })}
                className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
              >
                {MONTH_LABELS.map((label, i) => (
                  <option key={i} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-md border border-border bg-white p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="下個月"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {mode === 'month' && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {isCurrentMonth
              ? '⏳ 當月資料會隨下架→結算（下架 30 天後）陸續補齊'
              : '✅ 此區間顯示所有已結算的營收紀錄'}
          </p>
        )}
      </motion.div>

      {/* 摘要卡片 */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-green-200 bg-linear-to-br from-green-50 to-white p-3">
          <p className="text-[11px] font-medium text-green-800/70">總獲利</p>
          <p className="mt-0.5 text-lg font-bold text-green-900">
            {formatAmount(summary.total_profit)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-white p-3">
          <p className="text-[11px] font-medium text-blue-800/70">總售價</p>
          <p className="mt-0.5 text-lg font-bold text-blue-900">
            {formatAmount(summary.total_sales)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-3">
          <p className="text-[11px] font-medium text-amber-800/70">筆數</p>
          <p className="mt-0.5 text-lg font-bold text-amber-900">{summary.count}</p>
        </div>
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 py-16">
          <Receipt className="h-12 w-12 text-primary-200" />
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === 'month'
              ? `${year} 年 ${month} 月尚無營收紀錄`
              : '尚無營收紀錄'}
          </p>
          <p className="mt-1 px-8 text-center text-[11px] text-muted-foreground">
            車輛下架超過 30 天自動結算並計入營收
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, idx) => {
            const snap = r.vehicle_snapshot || {};
            const positive = r.profit >= 0;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {snap.brand_name ?? '?'} {snap.spec_name ?? ''}
                      {snap.model_name ? ` · ${snap.model_name}` : ''}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {snap.year && <span>{snap.year} 年</span>}
                      {snap.color && <span>{snap.color}</span>}
                      {snap.mileage != null && (
                        <span>{Number(snap.mileage).toLocaleString()} km</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-muted-foreground">獲利</p>
                    <p
                      className={cn(
                        'text-lg font-bold',
                        positive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {positive ? '+' : ''}
                      {formatAmount(r.profit)}
                    </p>
                  </div>
                </div>

                {/* 明細 */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2 text-[11px] sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">售價</p>
                    <p className="font-semibold text-foreground">
                      {formatAmount(r.listing_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">收購成本</p>
                    <p className="font-semibold text-foreground">
                      {formatAmount(r.acquisition_cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">基礎整備</p>
                    <p className="font-semibold text-foreground">
                      {formatAmount(r.repair_cost_base)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">細項加總</p>
                    <p className="font-semibold text-foreground">
                      {formatAmount(r.expenses_total)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    下架：{formatDate(r.archived_at)}
                  </span>
                  <span>結算：{formatDate(r.settled_at)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
