import Link from 'next/link';
import { Car, Search, Wrench, ShoppingBag, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12">
        <div className="mb-6 rounded-2xl border border-border bg-card px-4 py-6 text-center shadow-sm sm:px-6 md:mb-8 md:px-8 md:py-8">
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-4xl">發財B平台</h1>
          <p className="text-sm text-muted-foreground md:text-lg">車行管理、調做與盤車整合平台</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-8 md:gap-4">
          <Link
            href="/login"
            className="flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-base font-medium text-white hover:bg-primary-700"
          >
            立即登入
          </Link>
          <Link
            href="/register"
            className="flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-3 text-base font-medium text-foreground hover:bg-muted"
          >
            註冊帳號
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <Link
            href="/find-car"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-4 shadow-sm md:px-5 md:py-5"
          >
            <span className="flex items-center gap-3 text-base font-medium text-foreground">
              <Search className="h-5 w-5 text-primary-600" />
              瀏覽車輛
            </span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/my-cars"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-4 shadow-sm md:px-5 md:py-5"
          >
            <span className="flex items-center gap-3 text-base font-medium text-foreground">
              <Car className="h-5 w-5 text-primary-600" />
              我的車輛
            </span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/trade"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-4 shadow-sm md:px-5 md:py-5"
          >
            <span className="flex items-center gap-3 text-base font-medium text-foreground">
              <Wrench className="h-5 w-5 text-primary-600" />
              盤車需求
            </span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/services"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-4 shadow-sm md:px-5 md:py-5"
          >
            <span className="flex items-center gap-3 text-base font-medium text-foreground">
              <ShoppingBag className="h-5 w-5 text-primary-600" />
              服務與商城
            </span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </main>
  );
}
