/**
 * FaCai-B Platform - Suspend Dialog Component
 * File: frontend/src/components/admin/SuspendDialog.tsx
 * 
 * 停權會員對話框
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SuspendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  userName?: string;
  shopName?: string;
}

/**
 * 停權會員對話框
 */
export function SuspendDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
  shopName,
}: SuspendDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  // 快速選項
  const quickReasons = [
    '發布不實車輛資訊',
    '違反平台使用規範',
    '多次被檢舉且經查屬實',
    '帳戶異常活動，需調查',
    '未經授權使用他人資料',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* 對話框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
          >
            {/* 關閉按鈕 */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 標題 */}
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">停權會員</h2>
                {shopName && (
                  <p className="text-sm text-muted-foreground">{shopName}</p>
                )}
              </div>
            </div>

            {/* 警告訊息 */}
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <p>停權後，該會員將無法：</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>發布新車輛或調做需求</li>
                <li>編輯現有車輛或調做</li>
                <li>其所有車輛將自動下架</li>
              </ul>
            </div>

            {/* 停權原因 */}
            <div className="mt-4 space-y-2">
              <Label htmlFor="suspendReason" className="font-medium">
                停權原因 <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="suspendReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="請輸入停權原因..."
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
              />
            </div>

            {/* 快速選項 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {quickReasons.map((quickReason) => (
                <button
                  key={quickReason}
                  type="button"
                  onClick={() => setReason(quickReason)}
                  disabled={isSubmitting}
                  className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                >
                  {quickReason}
                </button>
              ))}
            </div>

            {/* 按鈕 */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason.trim() || isSubmitting}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    確認停權
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
