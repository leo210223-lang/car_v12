'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, ShoppingBag, Droplet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { ShopProduct, ShopProductCategory } from '@/types';

const categoryInfo: Record<ShopProductCategory, { label: string; icon: typeof ShoppingBag; color: string }> = {
  car_wash: {
    label: '洗車用具',
    icon: Droplet,
    color: 'text-blue-600',
  },
  android_device: {
    label: '安卓機',
    icon: Smartphone,
    color: 'text-purple-600',
  },
  other: {
    label: '其他',
    icon: ShoppingBag,
    color: 'text-gray-600',
  },
};

/**
 * Admin 線上商城管理頁面
 */
export default function AdminShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<ShopProduct>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ShopProductCategory | 'all'>('all');

  const loadProducts = async () => {
    try {
      const result = await api.request<ShopProduct[]>('/admin/shop', {
        method: 'GET',
        cache: 'no-store',
      });
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        throw new Error(result.message || '載入商品失敗');
      }
    } catch (error) {
      console.error('載入商品失敗:', error);
      toast.error('載入商品失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入商品
  useEffect(() => {
    loadProducts();
  }, []);

  // 篩選商品
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // 編輯商品
  const handleEditProduct = (product: ShopProduct) => {
    setEditingId(product.id);
    setEditingData({ ...product });
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // 保存商品
  const handleSaveProduct = async () => {
    if (!editingData.name || !editingData.purchase_url) {
      toast.error('請填寫必要欄位');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const result = await api.put<ShopProduct>(`/admin/shop/${editingId}`, {
          category: editingData.category,
          name: editingData.name,
          image_url: editingData.image_url,
          purchase_url: editingData.purchase_url,
          sort_order: editingData.sort_order,
          is_active: editingData.is_active,
        });
        if (result.success) {
          await loadProducts();
          setEditingId(null);
          setEditingData({});
          toast.success('商品已更新');
        } else {
          toast.error('更新失敗');
        }
      }
    } catch (error) {
      console.error('更新失敗:', error);
      toast.error('更新失敗');
    } finally {
      setSaving(false);
    }
  };

  // 切換商品狀態
  const handleToggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await api.put<ShopProduct>(`/admin/shop/${id}`, {
        is_active: !currentStatus,
      });
      if (result.success) {
        setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
        toast.success(!currentStatus ? '商品已啟用' : '商品已停用');
      } else {
        toast.error(result.message || '操作失敗');
      }
    } catch (error) {
      console.error('操作失敗:', error);
      toast.error('操作失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">線上商城管理</h1>
        <p className="mt-2 text-muted-foreground">管理商城商品、分類和購買連結</p>
      </div>

      {/* 操作欄 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-muted text-foreground hover:bg-muted-foreground/20'
            )}
          >
            全部 ({products.length})
          </button>
          {(Object.keys(categoryInfo) as ShopProductCategory[]).map(cat => {
            const count = products.filter(p => p.category === cat).length;
            const info = categoryInfo[cat];
            const Icon = info.icon;
            
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-muted text-foreground hover:bg-muted-foreground/20'
                )}
              >
                <Icon className="h-4 w-4" />
                {info.label} ({count})
              </button>
            );
          })}
        </div>

        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          新增商品
        </Button>
      </div>

      {/* 商品列表 */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">暫無商品</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => {
            const categoryInfo_ = categoryInfo[product.category];
            const isEditing = editingId === product.id;
            const IconComponent = categoryInfo_.icon;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'rounded-lg border transition-all',
                  product.is_active
                    ? 'border-border bg-card'
                    : 'border-muted bg-muted/30 opacity-60'
                )}
              >
                <div className="flex items-start gap-4 p-6">
                  {/* 圖片縮圖 */}
                  {product.image_url && (
                    <div className="h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* 內容 */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className={cn('h-4 w-4', categoryInfo_.color)} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {categoryInfo_.label}
                        </span>
                      </div>
                      {isEditing ? (
                        <Input
                          value={editingData.name || ''}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          placeholder="商品名稱"
                          className="mb-2"
                        />
                      ) : (
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editingData.purchase_url || ''}
                          onChange={(e) => setEditingData({ ...editingData, purchase_url: e.target.value })}
                          placeholder="購買連結"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <a
                          href={product.purchase_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {product.purchase_url}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        product.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {product.is_active ? '已上架' : '已下架'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        排序：{product.sort_order}
                      </span>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-2 pt-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleSaveProduct}
                          disabled={saving}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          編輯
                        </Button>
                        <Button
                          size="sm"
                          variant={product.is_active ? 'outline' : 'default'}
                          onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                          className="gap-2"
                        >
                          {product.is_active ? '下架' : '上架'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 提示信息 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-sm text-blue-900">
          <strong>提示：</strong> 支援分類為「洗車用具」和「安卓機」，可編輯商品名稱、購買連結和上下架狀態。
        </p>
      </div>
    </div>
  );
}
