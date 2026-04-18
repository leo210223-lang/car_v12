'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDealerName } from '@/lib/utils';

type TradeStatus = 'pending' | 'approved' | 'rejected';

interface AdminTrade {
  id: string;
  conditions: string;
  contact_info: string;
  status: TradeStatus;
  expires_at: string;
  is_active: boolean;
  dealer?: {
    name?: string;
    company_name?: string;
    phone?: string;
  };
  target_brand?: { name?: string };
  target_spec?: { name?: string };
  target_model?: { name?: string };
}

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TradeStatus>('pending');

  const loadTrades = async () => {
    setLoading(true);
    try {
      const result = await api.get<AdminTrade[]>('/admin/trades', {
        limit: 50,
        status: statusFilter,
      });
      if (result.success && result.data) {
        setTrades(result.data);
      } else {
        setTrades([]);
      }
    } catch {
      toast.error('載入調做審核列表失敗');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrades();
  }, [statusFilter]);

  const reviewTrade = async (id: string, status: 'approved' | 'rejected') => {
    setReviewingId(id);
    try {
      const result = await api.put(`/admin/trades/${id}/review`, { status });
      if (!result.success) {
        toast.error(result.message || '審核失敗');
        return;
      }
      toast.success(status === 'approved' ? '已核准調做需求' : '已拒絕調做需求');
      await loadTrades();
    } catch {
      toast.error('審核失敗');
    } finally {
      setReviewingId(null);
    }
  };

  const statusLabel = useMemo(
    () => ({ pending: '待審核', approved: '已核准', rejected: '已拒絕' }),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">調做審核管理</h1>
        <div className="flex items-center gap-2">
          {(['pending', 'approved', 'rejected'] as TradeStatus[]).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {statusLabel[s]}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">載入中...</div>
      ) : trades.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">目前沒有資料</div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => {
            const title = [trade.target_brand?.name, trade.target_spec?.name, trade.target_model?.name]
              .filter(Boolean)
              .join(' / ');
            const dealerDisplayName = formatDealerName({
              company_name: trade.dealer?.company_name,
              name: trade.dealer?.name,
            });
            return (
              <div key={trade.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{title || '未指定車款'}</p>
                    <p className="text-sm text-muted-foreground">
                      車行：{dealerDisplayName} / {trade.dealer?.phone || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">聯絡資訊：{trade.contact_info || '-'}</p>
                    <p className="text-sm text-muted-foreground">條件：{trade.conditions || '無'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2 py-1 text-xs">{statusLabel[trade.status]}</span>
                    <Button
                      size="sm"
                      onClick={() => reviewTrade(trade.id, 'approved')}
                      disabled={reviewingId === trade.id}
                    >
                      核准
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reviewTrade(trade.id, 'rejected')}
                      disabled={reviewingId === trade.id}
                    >
                      拒絕
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
