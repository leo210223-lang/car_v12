/**
 * Admin 商品管理表格
 */
'use client';
import { useShopProducts, useShopProductActions } from '@/hooks/useShop';
import Link from 'next/link';

export function ShopProductTable() {
  const { products, isLoading, refresh } = useShopProducts(undefined, { includeInactive: true });
  const { toggleStatus } = useShopProductActions();

  const handleToggle = async (id: string, is_active: boolean) => {
    const result = await toggleStatus(id, !is_active);
    if (result.success) {
      refresh();
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900/80">
      <table className="min-w-full text-sm">
        <thead className="bg-amber-50 dark:bg-amber-900/20">
          <tr>
            <th className="px-4 py-2 text-left">圖片</th>
            <th className="px-4 py-2 text-left">名稱</th>
            <th className="px-4 py-2 text-left">分類</th>
            <th className="px-4 py-2 text-left">狀態</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="text-center py-8 text-amber-500">載入中...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-8 text-gray-400">目前沒有商品</td></tr>
          ) : (
            products.map((p) => (
              <tr key={p.id} className={p.is_active ? '' : 'opacity-60'}>
                <td className="px-4 py-2">
                  <img src={p.image_url} alt={p.name} className="h-12 w-20 object-cover rounded" />
                </td>
                <td className="px-4 py-2 font-semibold">
                  <Link href={`/shop/${p.id}`} className="text-amber-700 hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-2">
                  {p.category === 'car_wash' ? '洗車服務' : p.category === 'android_device' ? '車用主機' : '其他'}
                </td>
                <td className="px-4 py-2">
                  {p.is_active ? <span className="text-green-600 font-bold">啟用</span> : <span className="text-red-500 font-bold">停用</span>}
                </td>
                <td className="px-4 py-2">
                  <button
                    className={`px-3 py-1 rounded-lg font-semibold ${p.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    onClick={() => handleToggle(p.id, p.is_active)}
                  >
                    {p.is_active ? '下架' : '啟用'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ShopProductTable;
