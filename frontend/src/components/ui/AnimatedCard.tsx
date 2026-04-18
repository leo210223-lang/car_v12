'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
  /** 是否啟用 hover 放大效果 */
  hoverScale?: boolean;
  /** 是否啟用進場動畫 */
  fadeIn?: boolean;
  /** 進場延遲（秒） */
  delay?: number;
  /** 是否使用金色邊框風格 */
  goldBorder?: boolean;
}

/**
 * AnimatedCard - 金紙風格動態卡片元件
 * 
 * 使用 framer-motion 實作：
 * - Hover 時微放大 (scale: 1.02)
 * - Opacity 漸進進場效果
 * - 可選金色邊框風格
 */
export function AnimatedCard({
  children,
  className,
  hoverScale = true,
  fadeIn = true,
  delay = 0,
  goldBorder = false,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      // 進場動畫
      initial={fadeIn ? { opacity: 0, y: 20 } : undefined}
      animate={fadeIn ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      // Hover 效果
      whileHover={hoverScale ? { 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={hoverScale ? { scale: 0.98 } : undefined}
      className={cn(
        // 基礎樣式
        'rounded-xl bg-card text-card-foreground',
        'shadow-sm transition-shadow duration-300',
        // Hover 陰影效果
        'hover:shadow-lg',
        // 金色邊框風格
        goldBorder && 'card-gold-border',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedCardHeader - 卡片標題區
 */
export function AnimatedCardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)}>
      {children}
    </div>
  );
}

/**
 * AnimatedCardTitle - 卡片標題
 */
export function AnimatedCardTitle({
  children,
  className,
  gold = false,
}: {
  children: ReactNode;
  className?: string;
  /** 是否使用金色漸層文字 */
  gold?: boolean;
}) {
  return (
    <h3 
      className={cn(
        'text-xl font-semibold leading-none tracking-tight',
        gold && 'text-gold-gradient',
        className
      )}
    >
      {children}
    </h3>
  );
}

/**
 * AnimatedCardDescription - 卡片描述
 */
export function AnimatedCardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}

/**
 * AnimatedCardContent - 卡片內容區
 */
export function AnimatedCardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  );
}

/**
 * AnimatedCardFooter - 卡片底部區
 */
export function AnimatedCardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  );
}

export default AnimatedCard;
