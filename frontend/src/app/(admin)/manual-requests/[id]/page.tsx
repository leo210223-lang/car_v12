'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
  User,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CascadingSelect } from '@/components/vehicle';
import {
  useAdminManualRequestDetail,
  useAdminManualRequestActions,
} from '@/hooks/useAdminManualRequests';
import { cn, formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: '待處理', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已核准', cls: 'bg-green-100 text-green-800' },
  rejected: { label: '已退回', cls: 'bg-red-100 text-red-800' },
};

export default function AdminManualRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { request, isLoading, refresh } = useAdminManualRequestDetail(id);
  const { approve, reject } = useAdminManualRequestActions();

  const [brandId, setBrandId] = useState<string>('');
  const [specId, setSpecId] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [approveYear, setApproveYear] = useState<string>('');
  const [approveListingPrice, setApproveListingPrice] = useState<string>('');

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleSelectionChange = useCallback(
    (sel: { brandId: string | null; specId: string | null; modelId: string | null }) => {
      setBrandId(sel.brandId ?? '');
      setSpecId(sel.specId ?? '');
      setModelId(sel.modelId ?? '');
    },
    []
  );

  const handleApprove = useCallback(async () => {
    if (!request) return;
    if (!brandId || !specId || !modelId) {
      toast.error('請先選擇品牌、規格、車型');
      return;
    }
    const year = Number(approveYear || request.year || 0);
    if (!year || year < 1900) {
      toast.error('請輸入年份');
      return;
    }

    if (!window.confirm('確認核准此申請？將根據填寫內容建立一筆實際車輛（直接 approved）。')) {
      return;
    }

    setApproving(true);
    try {
      const res = await approve(id, {
        brand_id: brandId,
        spec_id: specId,
        model_id: modelId,
        year,
        listing_price: approveListingPrice ? Number(approveListingPrice) : undefined,
      });
      if (res.success) {
        toast.success('已核准並代建車輛');
        setTimeout(() => router.push('/manual-requests'), 1200);
      } else {
        toast.error(res.message || '核准失敗');
      }
    } catch {
      toast.error('核准失敗');
    } finally {
      setApproving(false);
    }
  }, [request, brandId, specId, modelId, approveYear, approveListingPrice, approve, id, router]);

  const handleReject = useCallback(async () => {
    if (!request) return;
    if (!rejectReason.trim()) {
      toast.error('請填寫拒絕原因');
      return;
    }
    if (!window.confirm('確認退回此申請？')) return;

    setRejecting(true);
    try {
      const res = await reject(id, rejectReason.trim());
      if (res.success) {
        toast.success('已退回申請');
        setShowRejectForm(false);
        setRejectReason('');
        refresh();
      } else {
        toast.error(res.message || '退回失敗');
      }
    } catch {
      toast.error('退回失敗');
    } finally {
      setRejecting(false);
    }
  }, [request, rejectReason, reject, id, refresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-muted-foreground">找不到此申請</p>
        <Button variant="outline" onClick={() => router.push('/manual-requests')}>
          返回列表
        </Button>
      </div>
    );
  }

  const badge = STATUS_LABEL[request.status] ?? STATUS_LABEL.pending;
  const isPending = request.status === 'pending';

  return (
    <div className="space-y-6">
      {/* 返回 */}
      <Link
        href="/manual-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回申請列表
      </Link>

      {/* 申請資訊 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/90 text-white shadow-md">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {request.brand_text} {request.spec_text ?? ''} {request.model_text ?? ''}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', badge.cls)}>
                  {badge.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(request.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 申請人 */}
        {request.requester && (
          <div className="mb-4 rounded-lg bg-white/70 p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">申請人</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <User className="h-3.5 w-3.5" />
                {request.requester.company_name || request.requester.name}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {request.requester.phone}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {request.requester.email}
              </span>
            </div>
          </div>
        )}

        {/* 詳細資訊 */}
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {request.year && (
            <InfoItem label="年份" value={`${request.year} 年`} />
          )}
          {request.color && <InfoItem label="顏色" value={request.color} />}
          {request.mileage != null && (
            <InfoItem label="里程" value={`${request.mileage.toLocaleString()} km`} />
          )}
          {request.transmission && (
            <InfoItem label="變速箱" value={request.transmission} />
          )}
          {request.fuel_type && <InfoItem label="燃油" value={request.fuel_type} />}
          {request.listing_price != null && (
            <InfoItem label="售價" value={`$${request.listing_price.toLocaleString()}`} />
          )}
          {request.acquisition_cost != null && (
            <InfoItem label="收購成本" value={`$${request.acquisition_cost.toLocaleString()}`} />
          )}
          {request.repair_cost != null && (
            <InfoItem label="整備費" value={`$${request.repair_cost.toLocaleString()}`} />
          )}
        </div>

        {request.description && (
          <div className="mt-4 rounded-lg bg-white/70 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">車輛描述</p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{request.description}</p>
          </div>
        )}

        {request.contact_note && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3">
            <p className="mb-1 text-xs font-medium text-blue-700">申請人給管理員的備註</p>
            <p className="whitespace-pre-wrap text-sm text-blue-900">{request.contact_note}</p>
          </div>
        )}

        {request.rejection_reason && (
          <div className="mt-3 rounded-lg bg-red-50 p-3">
            <p className="mb-1 text-xs font-medium text-red-700">退回原因</p>
            <p className="text-sm text-red-900">{request.rejection_reason}</p>
          </div>
        )}

        {request.status === 'approved' && request.created_vehicle_id && (
          <div className="mt-3 rounded-lg bg-green-50 p-3">
            <p className="mb-1 text-xs font-medium text-green-700">已核准並建立車輛</p>
            <Link
              href={`/vehicles/${request.created_vehicle_id}`}
              className="text-sm font-medium text-green-900 underline"
            >
              查看建立的車輛 →
            </Link>
          </div>
        )}
      </motion.div>

      {/* 審核操作（僅 pending） */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">核准：選擇字典對應</h2>
          <p className="text-xs text-muted-foreground">
            請先從字典中選擇對應的品牌/規格/車型。若字典沒有該項目，請先到「字典管理」新增後再回來處理。
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <CascadingSelect onSelectionChange={handleSelectionChange} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                年份 *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={approveYear}
                onChange={(e) => setApproveYear(e.target.value)}
                placeholder={request.year ? String(request.year) : '例：2023'}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              {request.year && (
                <p className="mt-1 text-xs text-muted-foreground">
                  申請人填寫：{request.year}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                售價（選填、覆寫）
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={approveListingPrice}
                onChange={(e) => setApproveListingPrice(e.target.value)}
                placeholder={
                  request.listing_price != null ? String(request.listing_price) : '不覆寫'
                }
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <Button
            onClick={handleApprove}
            disabled={approving || !brandId || !specId || !modelId}
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            核准並代建車輛
          </Button>

          <div className="border-t border-border pt-4">
            <Button
              onClick={() => setShowRejectForm((v) => !v)}
              variant="outline"
              className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
              {showRejectForm ? '取消' : '退回申請'}
            </Button>

            {showRejectForm && (
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  退回原因 *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="請說明退回原因，將通知申請人"
                  className="h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <Button
                  onClick={handleReject}
                  disabled={rejecting || !rejectReason.trim()}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {rejecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  確認退回
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/70 px-2.5 py-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
