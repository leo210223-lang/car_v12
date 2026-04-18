'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  /** 是否開啟 */
  open: boolean;
  /** 關閉事件 */
  onOpenChange: (open: boolean) => void;
  /** 標題 */
  title: string;
  /** 描述文字 */
  description?: string | ReactNode;
  /** 確認按鈕文字 */
  confirmLabel?: string;
  /** 取消按鈕文字 */
  cancelLabel?: string;
  /** 確認事件 */
  onConfirm: () => void;
  /** 是否為危險操作（紅色按鈕） */
  destructive?: boolean;
  /** 是否載入中 */
  loading?: boolean;
}

/**
 * 確認對話框元件
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '確認',
  cancelLabel = '取消',
  onConfirm,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  // ESC 關閉
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, loading, onOpenChange]);

  // 防止背景滾動
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          
          {/* 對話框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
              {/* 關閉按鈕 */}
              <button
                onClick={() => !loading && onOpenChange(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* 標題 */}
              <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
              
              {/* 描述 */}
              {description && (
                <div className="text-sm text-muted-foreground mb-6">
                  {description}
                </div>
              )}
              
              {/* 按鈕 */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={destructive ? 'destructive' : 'default'}
                  onClick={onConfirm}
                  disabled={loading}
                  className={cn(
                    destructive && 'bg-destructive text-white hover:bg-destructive/90'
                  )}
                >
                  {loading ? '處理中...' : confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// 預設樣式的確認對話框
// ============================================================================

/**
 * 刪除確認對話框
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="確認刪除"
      description={`確定要刪除「${itemName}」嗎？此操作無法復原。`}
      confirmLabel="刪除"
      cancelLabel="取消"
      onConfirm={onConfirm}
      destructive
      loading={loading}
    />
  );
}

/**
 * 下架確認對話框
 */
export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="確認下架"
      description="下架後車輛將不會出現在公開列表中，但您仍可在「我的車」中查看和管理。"
      confirmLabel="確認下架"
      cancelLabel="取消"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}
