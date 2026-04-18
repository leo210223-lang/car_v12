'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CascadingSelect } from './CascadingSelect';
import { ImageUploader } from './ImageUploader';
import { CostInput } from './CostInput';
import { cn, parseVehicleImages } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';

// ============================================================================
// Types
// ============================================================================

export interface VehicleFormData {
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  color: string;
  mileage?: number;
  transmission: 'auto' | 'manual' | 'semi_auto' | 'cvt';
  fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  images: string[];
  image_files?: File[];
  acquisition_cost?: number;
  repair_cost?: number;
  listing_price?: number;
  description?: string;
}

interface VehicleFormProps {
  /** 編輯模式時的初始資料 */
  initialData?: Partial<Vehicle>;
  /** 提交回調 */
  onSubmit: (data: VehicleFormData) => Promise<void>;
  /** 是否送出中 */
  isSubmitting?: boolean;
  /** 提交按鈕文字 */
  submitLabel?: string;
  /** 是否顯示成本欄位 */
  showCostFields?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => currentYear - i);

const TRANSMISSION_OPTIONS = [
  { value: 'auto', label: '自排' },
  { value: 'manual', label: '手排' },
  { value: 'semi_auto', label: '手自排' },
  { value: 'cvt', label: 'CVT' },
];

const FUEL_OPTIONS = [
  { value: 'gasoline', label: '汽油' },
  { value: 'diesel', label: '柴油' },
  { value: 'hybrid', label: '油電混合' },
  { value: 'electric', label: '純電' },
];

const COLOR_OPTIONS = [
  '白色', '黑色', '銀色', '灰色', '紅色', '藍色',
  '綠色', '黃色', '橘色', '棕色', '金色', '其他',
];

// ============================================================================
// Component
// ============================================================================

/**
 * 車輛表單元件 - 用於新增與編輯車輛
 */
export function VehicleForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = '送出審核',
  showCostFields = true,
}: VehicleFormProps) {
  // 表單狀態
  const [brandId, setBrandId] = useState<string>(initialData?.brand_id ?? '');
  const [specId, setSpecId] = useState<string>(initialData?.spec_id ?? '');
  const [modelId, setModelId] = useState<string>(initialData?.model_id ?? '');
  const [year, setYear] = useState<number>(initialData?.year ?? currentYear);
  const [color, setColor] = useState<string>(initialData?.color ?? '');
  const [mileage, setMileage] = useState<string>(initialData?.mileage?.toString() ?? '');
  const [transmission, setTransmission] = useState<string>(initialData?.transmission ?? 'auto');
  const [fuelType, setFuelType] = useState<string>(initialData?.fuel_type ?? 'gasoline');
  const [images, setImages] = useState<string[]>(parseVehicleImages(initialData?.images));
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [acquisitionCost, setAcquisitionCost] = useState<number | undefined>(initialData?.acquisition_cost ?? undefined);
  const [repairCost, setRepairCost] = useState<number | undefined>(initialData?.repair_cost ?? undefined);
  const [listingPrice, setListingPrice] = useState<string>(initialData?.listing_price?.toString() ?? '');
  const [description, setDescription] = useState<string>(initialData?.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 階梯式選單變更
  const handleSelectionChange = useCallback((selection: {
    brandId: string | null;
    specId: string | null;
    modelId: string | null;
  }) => {
    setBrandId(selection.brandId ?? '');
    setSpecId(selection.specId ?? '');
    setModelId(selection.modelId ?? '');
  }, []);

  // 驗證
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!brandId) newErrors.brand = '請選擇品牌';
    if (!specId) newErrors.spec = '請選擇規格';
    if (!modelId) newErrors.model = '請選擇車型';
    if (!year) newErrors.year = '請選擇年份';
    if (!color) newErrors.color = '請選擇顏色';
    if (images.length === 0) newErrors.images = '請至少上傳一張圖片';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [brandId, specId, modelId, year, color, images]);

  // 送出
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const data: VehicleFormData = {
        brand_id: brandId,
        spec_id: specId,
        model_id: modelId,
        year,
        color,
        mileage: mileage ? Number(mileage) : undefined,
        transmission: transmission as 'auto' | 'manual' | 'semi_auto' | 'cvt',
        fuel_type: fuelType as 'gasoline' | 'diesel' | 'hybrid' | 'electric',
        images,
        image_files: imageFiles,
        acquisition_cost: acquisitionCost,
        repair_cost: repairCost,
        listing_price: listingPrice ? Number(listingPrice) : undefined,
        description: description || undefined,
      };

      await onSubmit(data);
    },
    [brandId, specId, modelId, year, color, mileage, transmission, fuelType, images, imageFiles, acquisitionCost, repairCost, listingPrice, description, validate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 車輛資訊區 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="mb-4 text-base font-semibold text-foreground">🚗 車輛資訊</h3>

        {/* 階梯式選單 */}
        <div className="mb-4">
          <CascadingSelect
            onSelectionChange={handleSelectionChange}
            initialBrandId={initialData?.brand_id}
            initialSpecId={initialData?.spec_id}
            initialModelId={initialData?.model_id}
          />
          {(errors.brand || errors.spec || errors.model) && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.brand || errors.spec || errors.model}
            </p>
          )}
        </div>

        {/* 年份 + 顏色 */}
        <div className="mb-4 grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">年份 *</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">顏色 *</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">請選擇</option>
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color}</p>}
          </div>
        </div>

        {/* 里程 + 變速箱 + 燃油 */}
        <div className="mb-4 grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">里程 (km)</label>
            <input
              type="number"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="選填"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">變速箱</label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {TRANSMISSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">燃油</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {FUEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 售價 */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-foreground">售價 (元)</label>
          <input
            type="number"
            inputMode="numeric"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
            placeholder="請輸入售價"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          {listingPrice && (
            <p className="mt-1 text-xs text-muted-foreground">
              約 {(Number(listingPrice) / 10000).toFixed(1)} 萬元
            </p>
          )}
        </div>

        {/* 描述 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">車輛描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="輸入車況、配備等說明（選填）"
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </motion.section>

      {/* 圖片上傳區 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <ImageUploader
          images={images}
          onChange={setImages}
          onFilesChange={setImageFiles}
        />
        {errors.images && (
          <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.images}
          </p>
        )}
      </motion.section>

      {/* 成本區（僅擁有者可見） */}
      {showCostFields && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="mb-4 text-base font-semibold text-foreground">🔒 私人成本紀錄</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            以下欄位僅您自己可以看到，不會顯示給其他車行
          </p>
          <div className="grid grid-cols-1 gap-4">
            <CostInput
              label="收購成本"
              value={acquisitionCost}
              onChange={setAcquisitionCost}
              placeholder="收購金額"
            />
            <CostInput
              label="整備費"
              value={repairCost}
              onChange={setRepairCost}
              placeholder="整備金額"
            />
          </div>
        </motion.section>
      )}

      {/* 送出按鈕 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pb-8"
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 text-base font-semibold"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              送出中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              {submitLabel}
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
