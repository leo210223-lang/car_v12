'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, normalizeVehicleImageUrl } from '@/lib/utils';

interface ImageGalleryProps {
  /** 圖片 URL 列表 */
  images: string[];
  /** 圖片 alt 文字 */
  alt?: string;
  /** 額外的樣式類別 */
  className?: string;
}

/**
 * 圖片輪播元件
 */
export function ImageGallery({ images, alt = '車輛圖片', className }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [failedImageMap, setFailedImageMap] = useState<Record<number, boolean>>({});
  const placeholderImage = '/images/vehicle-placeholder.svg';

  // 切換到上一張
  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  // 切換到下一張
  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // 跳到指定位置
  const goToIndex = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // 滑動手勢處理
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x > threshold) {
        goToPrev();
      } else if (info.offset.x < -threshold) {
        goToNext();
      }
    },
    [goToPrev, goToNext]
  );

  // 鍵盤導航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'ArrowLeft') goToPrev();
        if (e.key === 'ArrowRight') goToNext();
        if (e.key === 'Escape') setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToPrev, goToNext]);

  useEffect(() => {
    setFailedImageMap({});
    setCurrentIndex(0);
  }, [images]);

  // 無圖片
  if (!images || images.length === 0) {
    return (
      <div className={cn('relative aspect-[4/3] rounded-xl bg-muted', className)}>
        <Image
          src={placeholderImage}
          alt={`${alt}（預設圖）`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }

  const normalizedImages = images.map(normalizeVehicleImageUrl);
  const getImageSrc = (index: number) => {
    const source = normalizedImages[index];
    if (!source || failedImageMap[index]) {
      return placeholderImage;
    }
    return source;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <>
      {/* 主圖片區 */}
      <div className={cn('relative overflow-hidden rounded-xl bg-muted', className)}>
        <div className="relative aspect-[4/3]">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute inset-0"
            >
              <Image
                src={getImageSrc(currentIndex)}
                alt={`${alt} - ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={currentIndex === 0}
                onError={() =>
                  setFailedImageMap((prev) => ({ ...prev, [currentIndex]: true }))
                }
              />
            </motion.div>
          </AnimatePresence>

          {/* 全螢幕按鈕 */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* 左右切換按鈕 */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* 圖片計數 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* 縮圖列表 */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'relative h-16 w-20 shrink-0 overflow-hidden rounded-lg transition-all',
                currentIndex === index
                  ? 'ring-2 ring-primary-500 ring-offset-2'
                  : 'opacity-70 hover:opacity-100'
              )}
            >
              <Image
                src={getImageSrc(index)}
                alt={`${alt} 縮圖 ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                onError={() =>
                  setFailedImageMap((prev) => ({ ...prev, [index]: true }))
                }
              />
            </button>
          ))}
        </div>
      )}

      {/* 全螢幕模式 */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={() => setIsFullscreen(false)}
          >
            {/* 關閉按鈕 */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
            >
              <X className="h-6 w-6" />
            </button>

            {/* 圖片 */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative h-full w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={getImageSrc(currentIndex)}
                alt={`${alt} - ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                onError={() =>
                  setFailedImageMap((prev) => ({ ...prev, [currentIndex]: true }))
                }
              />
            </motion.div>

            {/* 左右切換按鈕 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* 底部縮圖 */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToIndex(index);
                  }}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    currentIndex === index ? 'bg-white w-6' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
