'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Loader2,
  Receipt,
  RefreshCcw,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useMyRevenue } from '@/hooks/useMyRevenue';
import { cn, formatDate } from '@/lib/utils';

/**
 * [v12.1] 車行自己的營收紀錄頁
 *   路徑：/revenue (car dealer)
 */

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '-';
  return `$${n.toLocaleString('zh-TW')}`;
}

export default function MyRevenuePage() {
  const router = useRouter();
  const { records, summary, isLoading, refresh } = useMyRevenue();

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
              <p className="text-xs text-muted-foreground">下架 30 天自動結算</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refresh()}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
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
          <p className="mt-3 text-sm text-muted-foreground">尚無營收紀錄</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            車輛下架超過 30 天後會自動結算
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
