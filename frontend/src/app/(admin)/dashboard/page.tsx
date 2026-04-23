'use client';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ClipboardCheck,
  Car,
  RefreshCw,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Bell,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatDealerName, parseVehicleImages } from '@/lib/utils';

/**
 * [v12.2] stats 與 pending 兩個查詢互不影響；
 *   - stats 抓不到 → 數字顯示 0 並提示「統計載入中」
 *   - pending 抓不到 → 待審核列表顯示空 + 錯誤提示
 *   - 不會整頁因為其中之一失敗而變紅
 */

export interface DashboardStats {
  pendingAuditCount: number;
  totalVehicles: number;
  activeTradeRequests: number;
  totalUsers: number;
  todayNewVehicles?: number;
  todayNewTrades?: number;
}

interface StatCardProps {
  title: string;
  value?: number | null;
  icon: typeof ClipboardCheck;
  href?: string;
  loading?: boolean;
}

interface PendingVehicle {
  id: string;
  year: number;
  created_at: string;
  images: string[] | string;
  brand_name?: string;
  spec_name?: string;
  model_name?: string;
  brand?: { name?: string };
  model?: { name?: string };
  owner?: { company_name?: string; name?: string };
}

function formatSafeNumber(value?: number | null): string {
  return Number(value || 0).toLocaleString('zh-TW');
}

function formatSafeDate(dateValue?: string | null): string {
  if (!dateValue) return '未知日期';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '未知日期';
  return date.toLocaleDateString('zh-TW');
}

/**
 * 統計卡片
 */
function StatCard({ title, value, icon: Icon,  href, loading }: StatCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'gold-texture stamp-frame cloud-pattern relative overflow-hidden rounded-2xl border border-amber-800/45 p-6 text-amber-950 shadow-[0_12px_24px_rgba(120,76,12,0.22)] transition-shadow',
        href && 'cursor-pointer hover:shadow-[0_16px_28px_rgba(120,76,12,0.28)]'
      )}
    >
      <span className="font-calligraphy pointer-events-none absolute -right-2 top-1 text-5xl text-black/10">順</span>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-calligraphy text-lg tracking-[0.15em] text-amber-950">{title}</p>
          <p className="mt-2 text-4xl font-bold tracking-wide text-[#684310]">
            {loading ? (
              <span className="inline-block h-9 w-16 animate-pulse rounded bg-amber-900/10" />
            ) : (
              formatSafeNumber(value)
            )}
          </p>
        </div>
        <div className="rounded-xl border border-amber-800/40 bg-amber-100/65 p-3 text-amber-900">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {href && (
        <div className="font-calligraphy mt-4 flex items-center text-base text-amber-900">
          <span>查看詳情</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      )}
    </motion.div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/**
 * Admin Dashboard 頁面
 */
export default function DashboardPage() {
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<DashboardStats>(
    '/admin/dashboard/stats',
    async () => {
      const result = await api.get<DashboardStats>('/admin/dashboard/stats');
      if (!result.success || !result.data) {
        throw new Error(result.message || '取得儀表板統計失敗');
      }
      return result.data;
    },
    { revalidateOnFocus: true, refreshInterval: 60000, shouldRetryOnError: true, errorRetryCount: 2 }
  );

  const {
    data: pendingVehicles = [],
    error: pendingError,
    isLoading: pendingLoading,
  } = useSWR<PendingVehicle[]>(
    '/admin/vehicles/pending?limit=5&sort_order=desc',
    async () => {
      const result = await api.get<PendingVehicle[]>('/admin/vehicles/pending', {
        limit: 5,
        sort_order: 'desc',
      });
      if (!result.success || !result.data) {
        throw new Error(result.message || '取得待審核列表失敗');
      }
      return result.data;
    },
    { revalidateOnFocus: true, refreshInterval: 60000, shouldRetryOnError: true, errorRetryCount: 2 }
  );

  // [v12.2] 不再因為某一支 API 失敗就整頁錯誤；每個區塊自己處理
  const safeStats: DashboardStats = {
    pendingAuditCount: Number(stats?.pendingAuditCount || 0),
    totalVehicles: Number(stats?.totalVehicles || 0),
    activeTradeRequests: Number(stats?.activeTradeRequests || 0),
    totalUsers: Number(stats?.totalUsers || 0),
    todayNewVehicles: Number(stats?.todayNewVehicles || 0),
    todayNewTrades: Number(stats?.todayNewTrades || 0),
  };

  return (
    <div className="cloud-pattern relative space-y-6 rounded-2xl border border-amber-800/25 bg-amber-50/70 p-5 shadow-[inset_0_0_0_1px_rgba(255,220,140,0.35)]">
      <span className="font-calligraphy pointer-events-none absolute left-10 top-10 text-[14rem] leading-none text-black/5">順</span>
      <span className="font-calligraphy pointer-events-none absolute bottom-10 right-10 text-[10rem] leading-none text-black/5">順</span>

      {/* 標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-calligraphy text-4xl text-amber-950">歡迎回來！</h1>
          <p className="font-calligraphy mt-1 text-lg text-amber-900/90">
            歡迎回來！以下為今日平台概況
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-800/40 bg-black/80 px-4 py-2 text-sm font-medium text-amber-100 shadow-sm transition-colors hover:bg-black"
          >
            <ClipboardCheck className="h-4 w-4" />
            開始審核
          </Link>
          <Link
            href="/vehicles/new"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-700/45 bg-amber-100/65 px-4 py-2 text-sm font-medium text-amber-950 shadow-sm transition-colors hover:bg-amber-200/70"
          >
            <Plus className="h-4 w-4" />
            代客建檔
          </Link>
        </div>
      </div>

      {/* [v12.2] stats 錯誤提示條（不擋畫面） */}
      {statsError && !statsLoading && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-100/60 px-4 py-2 text-sm text-amber-900">
          ⚠️ 統計數據暫時無法取得，稍後會自動重試（數字可能顯示為 0）
        </div>
      )}

      {/* 統計卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="待審核車輛"
          value={safeStats.pendingAuditCount}
          icon={ClipboardCheck}
          href="/audit"
          loading={statsLoading}
        />
        <StatCard
          title="上架車輛總數"
          value={safeStats.totalVehicles}
          icon={Car}
          loading={statsLoading}
        />
        <StatCard
          title="調做需求"
          value={safeStats.activeTradeRequests}
          icon={RefreshCw}
          loading={statsLoading}
        />
        <StatCard
          title="會員總數"
          value={safeStats.totalUsers}
          icon={Users}
          href="/users"
          loading={statsLoading}
        />
      </div>

      {/* 今日動態 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="gold-texture cloud-pattern rounded-2xl border border-amber-800/35 p-6 text-amber-950 shadow-[0_10px_20px_rgba(108,67,10,0.2)]"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-900" />
            <h2 className="font-calligraphy text-2xl tracking-[0.12em]">今日動態</h2>
          </div>
          <Link href="/vehicles" className="font-calligraphy text-amber-900 hover:text-amber-950">
            查看主部 &gt;
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-amber-800/30 bg-amber-100/55 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-amber-800/25 bg-amber-200/55 p-2">
                <Car className="h-5 w-5 text-amber-900" />
              </div>
              <div>
                <p className="font-calligraphy text-lg text-amber-950">新津車輛</p>
                <p className="text-sm text-amber-900/80">今日新增車輛數</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#684310]">{safeStats.todayNewVehicles ?? 0}</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-amber-800/30 bg-amber-100/55 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-amber-800/25 bg-amber-200/55 p-2">
                <RefreshCw className="h-5 w-5 text-amber-900" />
              </div>
              <div>
                <p className="font-calligraphy text-lg text-amber-950">新滑體驗</p>
                <p className="text-sm text-amber-900/80">今日新增調做數</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#684310]">{safeStats.todayNewTrades ?? 0}</p>
          </div>
        </div>
      </motion.div>

      {/* 待審核列表預覽 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="gold-texture cloud-pattern rounded-2xl border border-amber-800/35 p-6 shadow-[0_10px_20px_rgba(108,67,10,0.2)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-900" />
            <h2 className="font-calligraphy text-2xl tracking-[0.12em] text-amber-950">最新待審核</h2>
          </div>
          <Link
            href="/audit"
            className="font-calligraphy flex items-center text-base text-amber-900 hover:text-amber-950"
          >
            更新主部
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {pendingLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500/40 border-t-amber-700" />
          </div>
        ) : pendingError ? (
          <div className="rounded-lg border border-amber-700/40 bg-amber-100/60 px-4 py-3 text-sm text-amber-900">
            ⚠️ 待審核列表暫時無法取得，稍後會自動重試
          </div>
        ) : pendingVehicles.length > 0 ? (
          <div className="space-y-3">
            {pendingVehicles.map((vehicle) => {
              const image = parseVehicleImages(vehicle.images)[0];
              const brandName = vehicle.brand?.name || vehicle.brand_name || '未知品牌';
              const modelName = vehicle.model?.name || vehicle.model_name || '未知車型';
              const ownerDisplayName = formatDealerName({
                company_name: vehicle.owner?.company_name,
                name: vehicle.owner?.name,
              });

              return (
                <Link
                  key={vehicle.id}
                  href={`/audit/${vehicle.id}`}
                  className="stamp-frame relative flex items-center justify-between rounded-xl border border-amber-800/35 bg-amber-100/45 p-4 transition-colors hover:bg-amber-100/65"
                >
                  <div className="flex items-center gap-4">
                    {image && (
                      <img
                        src={image}
                        alt={`${brandName} ${modelName}`}
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-calligraphy text-xl text-amber-950">
                        {vehicle.year} {brandName} {modelName}
                      </p>
                      <p className="text-sm text-amber-900/80">
                        {ownerDisplayName} · {formatSafeDate(vehicle.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-amber-900/35 bg-amber-200/75 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                      待審核
                    </span>
                    <span className="font-calligraphy text-sm text-amber-900">查看詳情 &gt;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>目前沒有待審核的車輛</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
