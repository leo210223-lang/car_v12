'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save, X, Gamepad2, Flower, Smile, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { ExternalServices } from '@/types';

const serviceIcons: Record<string, typeof Gamepad2> = {
  entertainment: Gamepad2,
  relaxation: Flower,
  comfort: Smile,
  shop: ShoppingBag,
};

interface ServiceFormData {
  name?: string;
  url?: string | null;
  is_active?: boolean;
}

/**
 * Admin 更多服務管理頁面
 */
export default function AdminServicesPage() {
  const [services, setServices] = useState<ExternalServices | null>(null);
  const [editingKey, setEditingKey] = useState<'entertainment' | 'relaxation' | 'comfort' | null>(null);
  const [editingData, setEditingData] = useState<ServiceFormData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await api.get<ExternalServices>('/admin/services');
        if (result.success && result.data) {
          setServices(result.data);
        }
      } catch (error) {
        console.error('載入資料失敗:', error);
        toast.error('載入資料失敗');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 編輯服務
  const handleEditService = (key: 'entertainment' | 'relaxation' | 'comfort') => {
    if (!services || !services[key]) return;
    setEditingKey(key);
    const service = services[key];
    setEditingData({ 
      name: service.name,
      url: service.url,
      is_active: service.is_active,
    });
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingData({});
  };

  // 保存服務
  const handleSaveService = async () => {
    if (!editingKey || !services) return;
    
    if (!editingData.name || editingData.url === undefined) {
      toast.error('請填寫必要欄位');
      return;
    }

    setSaving(true);
    try {
      const nextServices: ExternalServices = {
        ...services,
        [editingKey]: {
          ...services[editingKey],
          ...editingData,
        },
      };

      const result = await api.put<ExternalServices>('/admin/services', {
        key: 'more_services',
        value: nextServices,
      });

      if (result.success && result.data) {
        setServices(result.data);
        setEditingKey(null);
        setEditingData({});
        toast.success('服務已更新');
      } else {
        toast.error(result.message || '更新失敗，請稍後再試');
      }
    } catch (error) {
      console.error('更新失敗:', error);
      toast.error('更新失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  const serviceKeys: Array<'entertainment' | 'relaxation' | 'comfort'> = ['entertainment', 'relaxation', 'comfort'];

  return (
    <div className="space-y-8 p-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">更多服務管理</h1>
        <p className="mt-2 text-muted-foreground">管理娛樂城、紓壓專區和舒服專區</p>
      </div>

      {/* 服務列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">服務項目</h2>

        {serviceKeys.map((key, index) => {
          const service = services?.[key];
          if (!service) return null;

          const IconComponent = serviceIcons[key] || ShoppingBag;
          const isEditing = editingKey === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-start gap-4">
                {/* 圖示 */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                  <IconComponent className="h-6 w-6 text-primary-600" />
                </div>

                {/* 內容 */}
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          服務名稱
                        </label>
                        <Input
                          value={editingData.name || ''}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          placeholder="輸入服務名稱"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          網址
                        </label>
                        <Input
                          value={editingData.url || ''}
                          onChange={(e) => setEditingData({ ...editingData, url: e.target.value })}
                          placeholder="輸入完整網址或留空"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          輸入完整網址（包含 http:// 或 https://）或留空表示服務「準備中」
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingData.is_active || false}
                            onChange={(e) => setEditingData({ ...editingData, is_active: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-foreground">啟用此服務</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        {!service.is_active && (
                          <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                            已停用
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">網址：</span>
                        {service.url ? (
                          <a 
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline ml-1"
                          >
                            {service.url}
                          </a>
                        ) : (
                          <span className="ml-1 text-amber-600">準備中</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveService}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? '保存中...' : '保存'}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditService(key as 'entertainment' | 'relaxation' | 'comfort')}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      編輯
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 提示信息 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-sm text-blue-900">
          <strong>提示：</strong> 編輯後自動同步到用戶端。輸入完整的網址（包含 http:// 或 https://）或留空表示服務「準備中」。
        </p>
      </div>
    </div>
  );
}
