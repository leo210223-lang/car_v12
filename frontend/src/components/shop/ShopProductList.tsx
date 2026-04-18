/**
 * 商品列表元件
 */
'use client';
import { ShopProductCard } from './ShopProductCard';
import type { ShopProduct } from '@/types';

export function ShopProductList({ products }: { products: ShopProduct[] }) {
  if (!products.length) {
    return (
      <div className="text-center text-gray-400 py-12">目前沒有商品</div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      {products.map((p) => (
        <ShopProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default ShopProductList;
