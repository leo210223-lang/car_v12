'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleForm, VehicleFormData } from '@/components/vehicle/VehicleForm';
import { useVehicleActions } from '@/hooks/useVehicles';
import { api } from '@/lib/api';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toast } from 'sonner';

const VEHICLE_IMAGE_BUCKET = 'vehicle-images';

function createStorageFileName(file: File, index: number): string {
  const extFromType = file.type.split('/')[1] || 'jpg';
  const extFromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  const ext = (extFromName || extFromType).toLowerCase();
  const baseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 48) || `image_${index + 1}`;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${baseName}_${timestamp}_${random}.${ext}`;
}

async function uploadVehicleImagesToSupabase(vehicleId: string, files: File[]) {
  const supabase = getSupabaseClient();
  const uploadedPaths: string[] = [];
  const uploadedUrls: string[] = [];

  try {
    for (const [index, file] of files.entries()) {
      const fileName = createStorageFileName(file, index);
      const storagePath = `${vehicleId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(VEHICLE_IMAGE_BUCKET)
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(`圖片上傳失敗: ${uploadError.message}`);
      }

      uploadedPaths.push(storagePath);
      const { data } = supabase.storage.from(VEHICLE_IMAGE_BUCKET).getPublicUrl(storagePath);
      if (!data.publicUrl) {
        throw new Error('無法取得圖片公開網址');
      }
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  } catch (error) {
    // 避免半成功狀態：若中途失敗，回收已上傳檔案
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(VEHICLE_IMAGE_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }
}

/**
 * 新增車輛頁面
 *
 * [v12 變更] 加入「找不到車輛？」入口 → 導向代上傳申請頁
 */
export default function NewVehiclePage() {
  const router = useRouter();
  const { createVehicle } = useVehicleActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: VehicleFormData) => {
      setIsSubmitting(true);
      try {
        const imageFiles = data.image_files ?? [];

        const createPayload = {
          brand_id: data.brand_id,
          spec_id: data.spec_id,
          model_id: data.model_id,
          year: data.year,
          color: data.color,
          mileage: data.mileage,
          transmission: data.transmission,
          fuel_type: data.fuel_type,
          listing_price: data.listing_price,
          acquisition_cost: data.acquisition_cost,
          repair_cost: data.repair_cost,
          description: data.description,
          images: [],
        };
        const result = await createVehicle(createPayload);
        if (!result.success || !result.data?.id) {
          toast.error(result.message || '送出失敗，請重試');
          return;
        }

        const vehicleId = result.data.id;

        if (imageFiles.length > 0) {
          if (!isSupabaseConfigured()) {
            toast.warning('車輛已建立，但 Supabase 未正確設定，圖片尚未上傳');
            router.push('/my-cars');
            return;
          }

          let uploadedUrls: string[] = [];
          try {
            uploadedUrls = await uploadVehicleImagesToSupabase(vehicleId, imageFiles);
          } catch (error) {
            console.error('[NewVehiclePage] Supabase upload failed:', error);
            toast.warning('車輛已建立，但圖片上傳失敗，請稍後到編輯頁重試');
            router.push('/my-cars');
            return;
          }

          const updateResult = await api.put(`/vehicles/${vehicleId}`, {
            images: uploadedUrls,
          });
          if (!updateResult.success) {
            toast.warning('車輛與圖片已上傳，但圖片索引更新失敗，請稍後重新整理');
          }
        }

        toast.success('車輛已送出審核！');
        router.push('/my-cars');
      } catch {
        toast.error('送出失敗，請檢查網路連線');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createVehicle, router]
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-24">
      {/* 頂部導航 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-600 shadow-lg">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">新增車輛</h1>
            <p className="text-xs text-muted-foreground">填寫車輛資訊並送出審核</p>
          </div>
        </div>
      </motion.div>

      {/* 提醒 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-lg bg-primary-50 px-4 py-3"
      >
        <p className="text-sm text-primary-700">
          💡 車輛送出後將進入「待審核」狀態，管理員審核通過後才會顯示於尋車列表。
        </p>
      </motion.div>

      {/* [v12] 找不到車輛入口 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        <Link
          href="/my-cars/new/manual-request"
          className="group flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100"
        >
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                找不到您的車輛？
              </p>
              <p className="text-xs text-amber-800/80">
                選項中沒有您的品牌/規格/車型？請申請管理員手動上傳 →
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* 表單 */}
      <VehicleForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="送出審核"
        showCostFields
      />
    </div>
  );
}
