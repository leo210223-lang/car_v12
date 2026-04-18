'use client';

import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TradeRequestForm } from '@/components/trade/TradeRequestForm';
import { useTradeRequest, useTradeActions, type CreateTradeRequestInput } from '@/hooks/useTradeRequests';
import { toast } from 'sonner';

/**
 * 編輯調做頁面 - 金紙風格
 */
export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const tradeId = params.id as string;
  
  // 取得調做詳情
  const { trade, isLoading, error } = useTradeRequest(tradeId);
  
  // 調做操作
  const { updateTrade, isSubmitting } = useTradeActions();

  // 處理提交
  const handleSubmit = async (data: CreateTradeRequestInput) => {
    const result = await updateTrade(tradeId, data);
    
    if (result.success) {
      toast.success('調做需求已更新！');
      router.push('/trade');
    }
    
    return result;
  };

  // 處理取消
  const handleCancel = () => {
    router.back();
  };

  // 載入中
  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error || !trade) {
    return (
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">找不到調做需求</p>
          <Link href="/trade" className="mt-4 inline-block">
            <Button variant="outline">返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* 標題列 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <Link href="/trade">
          <Button variant="ghost" size="icon" className="p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">編輯調做</h1>
      </motion.div>

      {/* 目前需求摘要 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-lg bg-muted/50 p-4"
      >
        <p className="text-sm text-muted-foreground">
          正在編輯：<span className="font-medium text-foreground">
            {trade.brand_name} {trade.spec_name || ''} {trade.model_name || ''}
          </span>
        </p>
      </motion.div>

      {/* 表單 */}
      <TradeRequestForm
        initialData={trade}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
