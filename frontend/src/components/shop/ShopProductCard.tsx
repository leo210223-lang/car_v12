/**
 * 商品卡片元件
 */
'use client';
import type { ShopProduct } from '@/types';
import Link from 'next/link';

export function ShopProductCard({ product }: { product: ShopProduct }) {
  return (
    <div className={`rounded-xl border shadow-sm bg-white dark:bg-gray-900/80 border-amber-200 dark:border-amber-800 transition hover:shadow-lg ${!product.is_active ? 'opacity-60 grayscale' : ''}`}>
      <Link href={`/shop/${product.id}`} className="block">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover rounded-t-xl"
        />
        <div className="p-4">
          <div className="text-xs text-amber-600 font-semibold mb-1">
            {product.category === 'car_wash' ? '洗車服務' : product.category === 'android_device' ? '車用主機' : '其他'}
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
        </div>
      </Link>
      <div className="px-4 pb-4 flex items-center gap-2">
        <a
          href={product.purchase_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-amber-500 text-base font-semibold text-white transition hover:bg-amber-600"
        >
          前往購買
        </a>
        {!product.is_active && (
          <span className="ml-2 text-xs text-red-500 font-bold">已下架</span>
        )}
      </div>
    </div>
  );
}

export default ShopProductCard;
