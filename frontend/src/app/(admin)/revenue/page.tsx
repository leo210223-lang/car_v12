'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Loader2,
  Receipt,
  RefreshCcw,
  Clock,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminRevenue } from '@/hooks/useAdminRevenue';
import { cn, formatDate } from '@/lib/utils';

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '-';
  return `$${n.toLocaleString('zh-TW')}`;
}

export default function AdminRevenuePage() {
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const { records, summary, isLoading, refresh } = useAdminRevenue(
    ownerFilter || undefined
  );

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-600 to-emerald-700 shadow">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">營收紀錄</h1>
            <p className="text-sm text-muted-foreground">
              下架超過 30 天的車輛會自動結算並於此列表呈現
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <RefreshCcw className="mr-1.5 h-4 w-4" />
          重新整理
        </Button>
      </motion.div>

      {/* 摘要卡片 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-linear-to-br from-green-50 to-white p-4">
          <p className="text-xs font-medium text-green-800/70">總獲利</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {formatAmount(summary.total_profit)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-white p-4">
          <p className="text-xs font-medium text-blue-800/70">總售價</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {formatAmount(summary.total_sales)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-4">
          <p className="text-xs font-medium text-amber-800/70">結算筆數</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{summary.count}</p>
        </div>
      </div>

      {/* 篩選 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          placeholder="依 owner_id 過濾（UUID）"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        {ownerFilter && (
          <Button variant="outline" size="sm" onClick={() => setOwnerFilter('')}>
            清除
          </Button>
        )}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 py-16">
          <Receipt className="h-12 w-12 text-primary-200" />
          <p className="mt-3 text-muted-foreground">尚無營收紀錄</p>
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
                      {snap.brand_name ?? '?'} {snap.spec_name ?? ''}{' '}
                      {snap.model_name ? `· ${snap.model_name}` : ''}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {snap.year && <span>{snap.year} 年</span>}
                      {snap.color && <span>{snap.color}</span>}
                      {snap.mileage != null && (
                        <span>{Number(snap.mileage).toLocaleString()} km</span>
                      )}
                    </div>
                    {r.owner && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {r.owner.company_name || r.owner.name}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">獲利</p>
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
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2 text-xs sm:grid-cols-4">
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

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
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
