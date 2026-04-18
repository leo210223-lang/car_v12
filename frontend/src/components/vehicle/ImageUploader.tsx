'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, GripVertical, ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  /** 已上傳的圖片 URL 陣列 */
  images: string[];
  /** 圖片變更回調 */
  onChange: (images: string[]) => void;
  /** 新增選取檔案回調（給建立車輛流程使用） */
  onFilesChange?: (files: File[]) => void;
  /** 最大圖片數量 */
  maxImages?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 額外樣式 */
  className?: string;
}

/**
 * 圖片上傳元件 - 支援拖放、預覽、刪除、排序
 */
export function ImageUploader({
  images,
  onChange,
  onFilesChange,
  maxImages = 10,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = images.length < maxImages && !disabled;

  // 處理檔案選擇
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      setUploadError(null);

      const remaining = maxImages - images.length;
      const newFiles = Array.from(files).slice(0, remaining);

      // 驗證檔案類型與大小
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      const invalidFile = newFiles.find(
        (f) => !validTypes.includes(f.type) || f.size > maxSize
      );
      if (invalidFile) {
        if (!validTypes.includes(invalidFile.type)) {
          setUploadError('僅支援 JPG、PNG、WebP、HEIC 格式');
        } else {
          setUploadError('單張圖片不可超過 10MB');
        }
        return;
      }

      // 建立預覽 URL (在實際專案中會先上傳到 Storage)
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      onChange([...images, ...newUrls]);
      if (onFilesChange) {
        onFilesChange(newFiles);
      }
    },
    [images, maxImages, onChange, onFilesChange]
  );

  // 拖放事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // 刪除圖片
  const handleRemove = useCallback(
    (index: number) => {
      const newImages = [...images];
      newImages.splice(index, 1);
      onChange(newImages);
    },
    [images, onChange]
  );

  // 移動圖片 (調整排序)
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      onChange(newImages);
    },
    [images, onChange]
  );

  return (
    <div className={cn('space-y-3', className)}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <ImageIcon className="h-3.5 w-3.5 text-primary-500" />
        車輛照片
        <span className="text-xs text-muted-foreground">
          ({images.length}/{maxImages})
        </span>
      </label>

      {/* 已上傳圖片預覽 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <AnimatePresence>
            {images.map((url, index) => (
              <motion.div
                key={`${url}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                <Image
                  src={url}
                  alt={`車輛圖片 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 25vw"
                />
                {/* 圖片序號 */}
                {index === 0 && (
                  <div className="absolute left-1 top-1 rounded bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    封面
                  </div>
                )}
                {/* 操作按鈕 */}
                {!disabled && (
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        className="rounded-full bg-white/90 p-1.5 text-gray-700 hover:bg-white"
                        title="往前移"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="rounded-full bg-red-500/90 p-1.5 text-white hover:bg-red-500"
                      title="刪除"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 上傳區域 */}
      {canUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors',
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-border hover:border-primary-300 hover:bg-primary-50/50'
          )}
        >
          <Upload
            className={cn(
              'mb-2 h-8 w-8',
              isDragging ? 'text-primary-500' : 'text-muted-foreground'
            )}
          />
          <p className="text-sm font-medium text-foreground">
            {isDragging ? '放開以上傳' : '點擊或拖放圖片'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            支援 JPG、PNG、WebP、HEIC，單張最大 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* 錯誤提示 */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* 提示 */}
      {images.length > 0 && images.length < maxImages && (
        <p className="text-xs text-muted-foreground">
          💡 第一張圖片將作為封面，建議至少上傳 3 張不同角度的照片
        </p>
      )}
    </div>
  );
}
