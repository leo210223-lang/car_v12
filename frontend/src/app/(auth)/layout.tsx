import { ReactNode } from 'react';

/**
 * 認證頁面佈局 - 發財B 書法背景
 *  - 登入 / 註冊 / 待審核 三個頁面共用
 *  - 背景圖：public/login-bg.jpg (970×1688 直式)
 *  - 手機：圖片完美填滿
 *  - 桌機：圖片置中 cover，多出的邊用同色金底延伸
 *  - 卡片浮在背景上並有半透明蒙層讓字清楚
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{
        // 以金底色當 fallback，避免圖片載入前或被 cover 裁切邊緣露出白色
        backgroundColor: '#d4a84b',
      }}
    >
      {/* 背景圖層 — 絕對定位，cover 填滿，不影響內容佈局 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
        }}
        aria-hidden="true"
      />

      {/* 半透明蒙層 — 讓卡片/文字更清楚，同時保留背景質感 */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        aria-hidden="true"
      />

      {/* 內容（登入卡片）浮在蒙層之上 */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo 區塊 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-gradient drop-shadow-lg">
            發財B
          </h1>
        </div>

        {/* 認證表單區塊 */}
        {children}
      </div>
    </div>
  );
}