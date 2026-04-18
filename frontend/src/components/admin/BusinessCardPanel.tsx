'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IdCard, Upload, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAdminBusinessCard } from '@/hooks/useAdminBusinessCard';

interface BusinessCardPanelProps {
  userId: string;
  businessCardUrl: string | null | undefined;
  onChanged?: () => void;
  className?: string;
}

/**
 * [v12] 管理員用：為某會員上傳/刪除名片
 */
export function BusinessCardPanel({
  userId,
  businessCardUrl,
  onChanged,
  className,
}: BusinessCardPanelProps) {
  const { uploadCard, removeCard } = useAdminBusinessCard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 前端驗證
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('請上傳 JPG / PNG / WebP 圖片');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('圖片檔案不能超過 8MB');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await uploadCard(userId, file);
      if (res.success) {
        toast.success('名片已上傳');
        onChanged?.();
      } else {
        toast.error(res.message || '上傳失敗');
      }
    } catch {
      toast.error('上傳失敗');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('確定要刪除該會員的名片？')) return;
    setRemoving(true);
    try {
      const res = await removeCard(userId);
      if (res.success) {
        toast.success('名片已刪除');
        onChanged?.();
      } else {
        toast.error(res.message || '刪除失敗');
      }
    } catch {
      toast.error('刪除失敗');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border bg-card p-5',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IdCard className="h-5 w-5 text-primary-600" />
          <h3 className="text-base font-semibold text-foreground">名片</h3>
        </div>
        <span className="text-xs text-muted-foreground">車行不可見</span>
      </div>

      {/* 名片預覽 */}
      <div className="mb-3 overflow-hidden rounded-lg border border-border bg-muted/30">
        {businessCardUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={businessCardUrl}
            alt="名片"
            className="h-auto w-full object-contain"
            style={{ maxHeight: 360 }}
          />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-40" />
            <p className="text-sm">尚未上傳名片</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading || removing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {businessCardUrl ? '更換名片' : '上傳名片'}
        </button>

        {businessCardUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading || removing}
            className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            刪除
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        支援 JPG / PNG / WebP，單張不超過 8 MB
      </p>
    </motion.div>
  );
}
