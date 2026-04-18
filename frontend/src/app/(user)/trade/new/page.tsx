'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TradeRequestForm } from '@/components/trade/TradeRequestForm';
import { useTradeActions, type CreateTradeRequestInput } from '@/hooks/useTradeRequests';
import { toast } from 'sonner';

/**
 * 發布調做頁面 - 金紙風格
 */
export default function NewTradePage() {
  const router = useRouter();
  const { createTrade, isSubmitting } = useTradeActions();

  // 處理提交
  const handleSubmit = async (data: CreateTradeRequestInput) => {
    const result = await createTrade(data);
    
    if (result.success) {
      toast.success('調做需求已發布！');
      router.push('/trade');
    }
    
    return result;
  };

  // 處理取消
  const handleCancel = () => {
    router.back();
  };

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
        <h1 className="text-2xl font-bold text-foreground">發布調做</h1>
      </motion.div>

      {/* 說明文字 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-lg bg-primary-50 p-4"
      >
        <p className="text-sm text-primary-800">
          💡 發布您的調做需求，讓同業幫您找車！品牌為必填，其他條件可依需求填寫。
        </p>
      </motion.div>

      {/* 表單 */}
      <TradeRequestForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
