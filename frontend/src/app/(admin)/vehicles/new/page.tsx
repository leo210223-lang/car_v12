'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Car, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useDealers, useProxyVehicle } from '@/hooks/useAudit';
import { DealerSelector } from '@/components/admin';
import { CascadingSelect } from '@/components/vehicle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';

/**
 * 代客建檔頁面
 */
export default function ProxyVehiclePage() {
  const router = useRouter();
  const { dealers, isLoading: dealersLoading } = useDealers();
  const { createProxyVehicle, isSubmitting } = useProxyVehicle();

  // 車型選擇狀態
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // 表單狀態
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [year, setYear] = useState<string>('');
  const [listingPrice, setListingPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 驗證錯誤
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 處理車型選擇變更
  const handleSelectionChange = useCallback((selection: {
    brandId: string | null;
    specId: string | null;
    modelId: string | null;
  }) => {
    setSelectedBrandId(selection.brandId);
    setSelectedSpecId(selection.specId);
    setSelectedModelId(selection.modelId);
  }, []);

  // 驗證表單
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!dealerId) {
      newErrors.dealer = '請選擇車行';
    }
    if (!selectedBrandId) {
      newErrors.brand = '請選擇品牌';
    }
    if (!selectedSpecId) {
      newErrors.spec = '請選擇規格';
    }
    if (!selectedModelId) {
      newErrors.model = '請選擇車型';
    }
    if (!year || isNaN(Number(year)) || Number(year) < 1990 || Number(year) > 2030) {
      newErrors.year = '請輸入有效年份 (1990-2030)';
    }
    if (!listingPrice || isNaN(Number(listingPrice)) || Number(listingPrice) <= 0) {
      newErrors.listingPrice = '請輸入有效售價';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('請檢查表單填寫是否正確');
      return;
    }

    try {
      setErrors({});
      const result = await createProxyVehicle({
        owner_dealer_id: dealerId!,
        brand_id: selectedBrandId!,
        spec_id: selectedSpecId!,
        model_id: selectedModelId!,
        year: Number(year),
        listing_price: Number(listingPrice),
        acquisition_cost: undefined,
        repair_cost: undefined,
        description: description.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.message || '建立失敗');
        return;
      }

      if (!('data' in result) || !result.data) {
        toast.error('建立失敗');
        return;
      }

      const vehicleId = result.data.id;

      // 如果有圖片，上傳它們
      if (images.length > 0 && vehicleId) {
        setUploadingImages(true);
        const formData = new FormData();
        images.forEach((file) => {
          formData.append('images', file);
        });

        try {
          const uploadResponse = await api.post(
            `/admin/vehicles/${vehicleId}/images`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          if ((uploadResponse.data as any)?.success) {
            toast.success(`車輛已建立，並上傳了 ${images.length} 張圖片`);
          } else {
            toast.warning('車輛已建立，但部分圖片上傳失敗');
          }
        } catch (uploadError) {
          console.error('圖片上傳失敗:', uploadError);
          toast.warning('車輛已建立，但圖片上傳失敗');
        } finally {
          setUploadingImages(false);
        }
      } else {
        toast.success(result.message || '車輛已建立並上架');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('提交失敗:', error);
      toast.error('提交失敗，請重試');
    }
  };

  // 處理檔案選擇
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      const newFiles = Array.from(e.target.files);
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

      const invalidFile = newFiles.find(
        (f) => !validTypes.includes(f.type) || f.size > maxSize
      );

      if (invalidFile) {
        if (!validTypes.includes(invalidFile.type)) {
          toast.error('僅支援 JPG、PNG、WebP 格式');
        } else {
          toast.error('單張圖片不可超過 10MB');
        }
        return;
      }

      setImages([...images, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images]
  );

  // 移除圖片
  const handleRemoveImage = useCallback(
    (index: number) => {
      setImages(images.filter((_, i) => i !== index));
    },
    [images]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 頂部導航 */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-xl font-bold text-foreground">代客建檔</h1>
      </div>

      {/* 說明 */}
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
        <div className="flex items-start gap-3">
          <Car className="mt-0.5 h-5 w-5 text-primary-600" />
          <div>
            <p className="font-medium text-primary-700">為車行代為建立車輛</p>
            <p className="mt-1 text-sm text-primary-600">
              代客建檔的車輛將會直接核准上架，無需經過審核流程
            </p>
          </div>
        </div>
      </div>

      {/* 表單 */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-primary-200 bg-card p-6"
      >
        {/* 選擇車行 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            選擇車行 <span className="text-red-500">*</span>
          </label>
          {dealersLoading ? (
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
          ) : (
            <DealerSelector
              dealers={dealers}
              value={dealerId}
              onChange={setDealerId}
              placeholder="請選擇要建檔的車行"
              error={errors.dealer}
            />
          )}
        </div>

        <div className="h-px bg-border" />

        {/* 品牌/規格/車型 選擇 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            車輛型號 <span className="text-red-500">*</span>
          </label>
          <CascadingSelect
            onSelectionChange={handleSelectionChange}
            disabled={false}
          />
          {errors.brand && (
            <p className="mt-1 text-xs text-red-500">{errors.brand}</p>
          )}
        </div>

        {/* 年份 & 售價 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              年份 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="例如：2024"
              min="1990"
              max="2030"
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2',
                errors.year
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
              )}
            />
            {errors.year && (
              <p className="mt-1 text-xs text-red-500">{errors.year}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              售價 (元) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              placeholder="例如：1280000"
              min="0"
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2',
                errors.listingPrice
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-primary-200 focus:border-primary-500 focus:ring-primary-200'
              )}
            />
            {errors.listingPrice && (
              <p className="mt-1 text-xs text-red-500">{errors.listingPrice}</p>
            )}
          </div>
        </div>

        {/* 車輛描述 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">車輛描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細描述車輛狀況、配備、特色..."
            rows={4}
            className="w-full resize-none rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        {/* 圖片上傳 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            車輛圖片 (選填)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploadingImages}
            className="hidden"
          />

          {/* 上傳區域 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              uploadingImages
                ? 'border-primary-300 bg-primary-50 cursor-not-allowed'
                : 'border-primary-200 bg-primary-50 hover:border-primary-400 cursor-pointer'
            )}
          >
            <Upload className="h-6 w-6 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {uploadingImages ? '上傳中...' : '點擊或拖放圖片到此'}
              </p>
              <p className="text-xs text-muted-foreground">
                支援 JPG、PNG、WebP，最多 10 張，每張不超過 10MB
              </p>
            </div>
          </div>

          {/* 已選圖片預覽 */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    disabled={uploadingImages}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            已選 {images.length} 張圖片，最多可上傳 10 張
          </p>
        </div>

        {/* 提交按鈕 */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 rounded-lg border border-primary-300 bg-white px-4 py-3 text-center text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || uploadingImages}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? '建立中...' : uploadingImages ? '上傳中...' : '建立並上架'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
