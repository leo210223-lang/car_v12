'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HelpCircle, Loader2, ChevronRight, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminManualRequests } from '@/hooks/useAdminManualRequests';
import { cn, formatDate } from '@/lib/utils';

const TABS: { label: string; value: 'pending' | 'approved' | 'rejected' }[] = [
  { label: '待處理', value: 'pending' },
  { label: '已核准', value: 'approved' },
  { label: '已退回', value: 'rejected' },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: '待處理', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已核准', cls: 'bg-green-100 text-green-800' },
  rejected: { label: '已退回', cls: 'bg-red-100 text-red-800' },
};

export default function AdminManualRequestsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { requests, isLoading, refresh } = useAdminManualRequests(activeTab);

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-600 to-amber-800 shadow">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">代上傳申請</h1>
            <p className="text-sm text-muted-foreground">
              車行找不到字典時送來的手動申請
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          重新整理
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-primary-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === t.value
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 py-16">
          <HelpCircle className="h-12 w-12 text-primary-200" />
          <p className="mt-3 text-muted-foreground">
            目前沒有「{STATUS_LABEL[activeTab].label}」的申請
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r, idx) => {
            const badge = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link
                  href={`/manual-requests/${r.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm transition-all hover:border-primary-400 hover:shadow-md"
                >
                  {/* 圖示 */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <HelpCircle className="h-6 w-6" />
                  </div>

                  {/* 資訊 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-foreground">
                        {r.brand_text} {r.spec_text ?? ''} {r.model_text ?? ''}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                          badge.cls
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <User className="h-3 w-3" />
                        {r.requester?.company_name || r.requester?.name || '未知車行'}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(r.created_at)}
                      </span>
                      {r.year && (
                        <>
                          <span>·</span>
                          <span>{r.year} 年</span>
                        </>
                      )}
                    </div>
                    {r.rejection_reason && (
                      <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700 line-clamp-1">
                        退回原因：{r.rejection_reason}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
