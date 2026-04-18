'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
  vehicleTitle?: string;
}

/**
 * 拒絕對話框元件
 * 審核時需填寫拒絕理由
 */
export function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  vehicleTitle,
}: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('請填寫退件理由');
      return;
    }
    if (reason.trim().length < 5) {
      setError('退件理由至少需要 5 個字');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError('');
      onClose();
    }
  };

  // 預設退件理由選項
  const quickReasons = [
    '圖片模糊，請重新拍攝',
    '車輛資訊不完整',
    '價格資訊有誤',
    '圖片與車輛資訊不符',
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
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleClose}
          />

          {/* 對話框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary-200 bg-card p-6 shadow-lg"
          >
            {/* 標題區 */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">退件車輛</h2>
                  {vehicleTitle && (
                    <p className="text-sm text-muted-foreground">{vehicleTitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 快速選擇理由 */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-foreground">快速選擇</p>
              <div className="flex flex-wrap gap-2">
                {quickReasons.map((quickReason) => (
                  <button
                    key={quickReason}
                    onClick={() => setReason(quickReason)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      reason === quickReason
                        ? 'border-primary-500 bg-primary-100 text-primary-700'
                        : 'border-primary-200 bg-white text-muted-foreground hover:border-primary-300 hover:bg-primary-50'
                    )}
                  >
                    {quickReason}
                  </button>
                ))}
              </div>
            </div>

            {/* 退件理由輸入 */}
            <div className="mb-4">
              <label
                htmlFor="reject-reason"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                退件理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="請詳細說明退件原因，以便車行修正..."
                rows={4}
                className={cn(
                  'w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2',
                  error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
                )}
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {reason.length}/200 字
              </p>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-primary-300 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || !reason.trim()}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting ? '處理中...' : '確認退件'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
