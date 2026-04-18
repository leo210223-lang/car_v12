import { ReactNode } from 'react';

/**
 * 認證頁面佈局 - 金紙風格
 * - 無導航列的簡潔佈局
 * - 置中顯示認證表單
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo 區塊 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25 mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-3xl font-bold text-gold-gradient">
            發財B
          </h1>
          <p className="text-muted-foreground mt-2">
            專業車行交易平台
          </p>
        </div>
        
        {/* 認證表單區塊 */}
        {children}
      </div>
    </div>
  );
}
