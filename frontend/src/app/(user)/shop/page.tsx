/**
 * 商城前台主頁
 */
'use client';
import { useShopProducts } from '@/hooks/useShop';
import ShopProductList from '@/components/shop/ShopProductList';

export default function ShopPage() {
  const { products, isLoading } = useShopProducts();
  return (
    <div className="mx-auto max-w-lg px-4 py-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <span className="text-2xl font-bold text-amber-600">🛒</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">商城</h1>
          <p className="text-sm text-muted-foreground">汽車服務、配件、精品一站購足</p>
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-amber-500 font-bold animate-pulse">載入中...</div>
      ) : (
        <ShopProductList products={products} />
      )}
    </div>
  );
}
