/**
 * FaCai-B Platform - Admin User Detail Page
 * File: frontend/src/app/(admin)/users/[id]/page.tsx
 *
 * 會員詳情頁面
 *
 * [v12 變更]
 *  - 新增右側欄：點數調整（CreditsPanel）+ 名片上傳（BusinessCardPanel）
 */

'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Car,
  FileText,
  Ban,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserDetail, useUserActions } from '@/hooks/useUsers';
import { SuspendDialog, CreditsPanel, BusinessCardPanel } from '@/components/admin';
import { VehicleStatusBadge } from '@/components/vehicle';
import { ExpiryBadge } from '@/components/trade';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // 取得會員詳情
  const { user, isLoading, error, refresh } = useUserDetail(userId);

  // 會員操作
  const { suspendUser, reactivateUser, isSubmitting } = useUserActions();

  // 停權對話框
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);

  // Tab 狀態
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trades'>('vehicles');

  // 確認停權
  const handleConfirmSuspend = useCallback(async (reason: string) => {
    const result = await suspendUser(userId, reason);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [userId, suspendUser, refresh]);

  // 解除停權
  const handleReactivate = useCallback(async () => {
    const result = await reactivateUser(userId);
    if (result.success) {
      toast.success(result.message);
      refresh();
    } else {
      toast.error(result.message);
    }
  }, [userId, reactivateUser, refresh]);

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-muted-foreground">載入會員資料中...</p>
        </div>
      </div>
    );
  }

  // 錯誤或找不到
  if (error || !user) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium">找不到會員資料</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
      </div>
    );
  }

  const isSuspended = user.status === 'suspended';
  // [v12] 由 user 取 credits/business_card_url（需 backend API 有帶回）
  const userCredits = (user as { credits?: number }).credits ?? 0;
  const userBusinessCardUrl = (user as { business_card_url?: string | null }).business_card_url ?? null;

  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <Link href="/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        返回會員列表
      </Link>

      {/* 會員資訊卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isSuspended
            ? 'border-red-200 bg-linear-to-br from-red-50 to-white'
            : 'border-primary-200 bg-linear-to-br from-primary-50 to-white'
        )}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* 左側：基本資訊 */}
          <div className="flex items-start gap-4">
            {/* 頭像 */}
            <div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-2xl',
                isSuspended ? 'bg-red-100' : 'bg-primary-100'
              )}
            >
              <User className={cn('h-10 w-10', isSuspended ? 'text-red-600' : 'text-primary-600')} />
            </div>

            {/* 資訊 */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{user.company_name || '未提供'}</h1>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
                    isSuspended
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  )}
                >
                  {isSuspended ? (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      已停權
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      正常
                    </>
                  )}
                </span>
              </div>
              <p className="text-muted-foreground">{user.name || '未提供'}</p>

              {/* 聯絡資訊 */}
              <div className="flex flex-wrap gap-4 pt-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {user.phone || '未提供'}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email || '未提供'}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  加入於 {formatDate(user.created_at)}
                </span>
              </div>

              {/* TODO: users schema 未含 address/line_id/tax_id/member_plan，DB 擴充後再改為真實欄位 */}
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                <span>地址：未提供</span>
                <span>統編：未提供</span>
                <span>Line ID：未提供</span>
                <span>加入方案：未提供</span>
              </div>
            </div>
          </div>

          {/* 右側：統計 & 操作 */}
          <div className="flex flex-col items-end gap-4">
            {/* 統計 */}
            <div className="flex gap-4">
              <div className="rounded-xl border border-primary-200 bg-white px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-primary-500">
                  <Car className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">{user.vehicle_count}</p>
                <p className="text-xs text-muted-foreground">車輛數</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-500">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">{user.trade_count}</p>
                <p className="text-xs text-muted-foreground">調做數</p>
              </div>
            </div>

            {/* 操作按鈕 */}
            {isSuspended ? (
              <Button
                onClick={handleReactivate}
                disabled={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                解除停權
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsSuspendDialogOpen(true)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Ban className="mr-2 h-4 w-4" />
                停權會員
              </Button>
            )}
          </div>
        </div>

        {/* 停權資訊 */}
        {isSuspended && user.suspended_reason && (
          <div className="mt-6 rounded-xl bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700">停權原因</p>
                <p className="mt-1 text-sm text-red-600">{user.suspended_reason}</p>
                {user.suspended_at && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
                    <Clock className="h-3 w-3" />
                    停權時間：{formatDate(user.suspended_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* [v12] 右側欄：點數 + 名片（雙欄，寬螢幕並列） */}
      <div className="grid gap-4 md:grid-cols-2">
        <CreditsPanel
          userId={userId}
          initialCredits={userCredits}
          onChanged={() => refresh()}
        />
        <BusinessCardPanel
          userId={userId}
          businessCardUrl={userBusinessCardUrl}
          onChanged={() => refresh()}
        />
      </div>

      {/* Tab 切換 */}
      <div className="flex gap-2 border-b border-primary-200">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'vehicles'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Car className="h-4 w-4" />
          車輛列表 ({user.vehicles?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'trades'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4" />
          調做需求 ({user.trades?.length || 0})
        </button>
      </div>

      {/* Tab 內容 */}
      {activeTab === 'vehicles' ? (
        <div className="space-y-4">
          {user.vehicles && user.vehicles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {user.vehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 rounded-xl border border-primary-200 bg-white p-4 shadow-sm"
                >
                  {/* 圖片 */}
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-primary-100">
                    {vehicle.images?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand_name} ${vehicle.spec_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-8 w-8 text-primary-300" />
                      </div>
                    )}
                  </div>

                  {/* 資訊 */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {vehicle.brand_name} {vehicle.spec_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year}年 · {vehicle.color}
                        </p>
                      </div>
                      <VehicleStatusBadge status={vehicle.status} />
                    </div>
                    <p className="text-lg font-bold text-primary-600">
                      {vehicle.listing_price != null && vehicle.listing_price > 0
                        ? formatPrice(vehicle.listing_price)
                        : '洽詢價格'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 py-12">
              <Car className="h-12 w-12 text-primary-200" />
              <p className="mt-3 text-muted-foreground">尚無車輛資料</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {user.trades && user.trades.length > 0 ? (
            <div className="space-y-3">
              {user.trades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-primary-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{trade.brand_name}</p>
                      {trade.spec_name && (
                        <p className="text-sm text-muted-foreground">{trade.spec_name}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {trade.year_from && trade.year_to && (
                          <span>{trade.year_from} - {trade.year_to}年</span>
                        )}
                        {trade.price_range_min !== null && trade.price_range_max !== null && (
                          <span>
                            {formatPrice(trade.price_range_min)} - {formatPrice(trade.price_range_max)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExpiryBadge expiresAt={trade.expires_at} />
                  </div>
                  {trade.conditions && (
                    <p className="mt-3 rounded-lg bg-primary-50 p-2 text-sm text-muted-foreground">
                      {trade.conditions}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 py-12">
              <FileText className="h-12 w-12 text-primary-200" />
              <p className="mt-3 text-muted-foreground">尚無調做需求</p>
            </div>
          )}
        </div>
      )}

      {/* 停權對話框 */}
      <SuspendDialog
        isOpen={isSuspendDialogOpen}
        onClose={() => setIsSuspendDialogOpen(false)}
        onConfirm={handleConfirmSuspend}
        userName={user.name}
        shopName={user.company_name}
      />
    </div>
  );
}
