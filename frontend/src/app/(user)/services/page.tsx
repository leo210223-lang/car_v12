'use client';

import useSWR from 'swr';
import { ExternalLink, Gamepad2, Flower, Smile, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { ExternalServices } from '@/types';

const serviceIcons: Record<string, typeof Gamepad2> = {
  entertainment: Gamepad2,
  relaxation: Flower,
  comfort: Smile,
  shop: ShoppingBag,
};

/**
 * 更多服務頁面 - 動態載入服務資料
 */
export default function ServicesPage() {
  const { data: services, isLoading: loading } = useSWR<ExternalServices | null>(
    '/services',
    async () => {
      const result = await api.request<ExternalServices>('/services', {
        method: 'GET',
        cache: 'no-store',
      });
      return result.success && result.data ? result.data : null;
    },
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
    }
  );

  if (loading) {
    return (
      <div className="relative mx-auto flex w-full max-w-md items-center justify-center bg-transparent px-4 py-8 min-h-[calc(100vh-4rem)]">
        <span className="font-calligraphy pointer-events-none absolute right-2 top-2 z-0 text-[7rem] leading-none text-black/5">
          順
        </span>
        <p className="relative z-10 text-amber-900">載入中...</p>
      </div>
    );
  }

  const serviceKeys: Array<'entertainment' | 'relaxation' | 'comfort'> = ['entertainment', 'relaxation', 'comfort'];

  return (
    <div className="relative w-full max-w-md mx-auto px-4 py-4 bg-transparent">
      <span className="font-calligraphy pointer-events-none absolute right-2 top-2 z-0 text-[7rem] leading-none text-black/5">
        順
      </span>
      {/* 標題 */}
      <h1 className="font-calligraphy relative z-10 mb-6 text-2xl text-amber-950">更多服務</h1>

      {/* 服務列表 */}
      <div className="relative z-10 space-y-3">
        {serviceKeys.map((key) => {
          const service = services?.[key];
          if (!service) return null;

          const IconComponent = serviceIcons[key] || ShoppingBag;
          
          const content = (
            <div
              className={cn(
                'flex items-center gap-4 rounded-xl bg-white/40 backdrop-blur-md border border-amber-200/50 shadow-sm p-4 transition-colors',
                (!service.url || !service.is_active) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-amber-700/45 hover:bg-white/55'
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-800/25 bg-amber-100/85">
                <IconComponent className="h-6 w-6 text-amber-900" />
              </div>
              <div className="flex-1">
                <h3 className="font-calligraphy text-lg text-amber-950">{service.name}</h3>
              </div>
              {(!service.url || !service.is_active) ? (
                <span className="text-xs text-amber-900/70">準備中</span>
              ) : (
                <ExternalLink className="h-4 w-4 text-amber-900/75" />
              )}
            </div>
          );

          if (service.url && service.is_active) {
            return (
              <a
                key={key}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            );
          }

          return <div key={key}>{content}</div>;
        })}
      </div>

      {/* 聯繫客服 */}
      <div className="relative z-10 mt-8 rounded-xl bg-white/40 backdrop-blur-md border border-amber-200/50 shadow-sm p-4 text-center">
        <p className="text-sm text-amber-900/80">
          有任何問題嗎？請與我們聯繫
        </p>
        <p className="font-calligraphy mt-1 text-lg text-amber-900">
          客服專線：0800-123-456
        </p>
      </div>
    </div>
  );
}
