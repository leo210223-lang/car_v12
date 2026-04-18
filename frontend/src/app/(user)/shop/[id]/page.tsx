/**
 * 商品詳情頁
 */
'use client';
import { useParams } from 'next/navigation';
import { useShopProduct } from '@/hooks/useShop';
import Link from 'next/link';

export default function ShopProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading } = useShopProduct(id);

  if (isLoading) {
    return <div className="text-center py-12 text-amber-500 font-bold animate-pulse">載入中...</div>;
  }
  if (!product) {
    return <div className="text-center py-12 text-red-500 font-bold">找不到商品</div>;
  }
  return (
    <div className="mx-auto max-w-lg px-4 py-4 space-y-6">
      <Link href="/shop" className="text-amber-600 hover:underline">← 返回商城</Link>
      <div className="rounded-xl overflow-hidden border border-amber-200 bg-white shadow">
        <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover" />
        <div className="p-6">
          <div className="text-xs text-amber-600 font-semibold mb-1">
            {product.category === 'car_wash' ? '洗車服務' : product.category === 'android_device' ? '車用主機' : '其他'}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
          <a
            href={product.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center mt-4 rounded-lg bg-amber-500 px-6 text-base font-bold text-white shadow transition hover:bg-amber-600"
          >
            前往購買
          </a>
        </div>
      </div>
    </div>
  );
}
