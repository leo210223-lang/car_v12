/**
 * FaCai-B Platform - Trade Request Form Component
 * File: frontend/src/components/trade/TradeRequestForm.tsx
 * 
 * 調做需求表單元件（新增/編輯共用）
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Car, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Phone, 
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CascadingSelect } from '@/components/vehicle/CascadingSelect';
import { cn } from '@/lib/utils';
import type { TradeRequest, CreateTradeRequestInput } from '@/hooks/useTradeRequests';

// ============================================================================
// 表單驗證 Schema
// ============================================================================

const tradeFormSchema = z.object({
  target_brand_id: z.string().min(1, '請選擇品牌'),
  target_spec_id: z.string().optional(),
  target_model_id: z.string().optional(),
  year_from: z.number().min(1990).max(new Date().getFullYear() + 2).optional().nullable(),
  year_to: z.number().min(1990).max(new Date().getFullYear() + 2).optional().nullable(),
  price_range_min: z.number().min(0).optional().nullable(),
  price_range_max: z.number().min(0).optional().nullable(),
  conditions: z.string().max(500, '條件說明最多 500 字').optional(),
  contact_info: z.string().min(1, '請填寫聯絡方式').max(200, '聯絡方式最多 200 字'),
  expires_days: z.number().min(1).max(30),
}).refine(
  (data) => {
    if (data.year_from && data.year_to) {
      return data.year_from <= data.year_to;
    }
    return true;
  },
  { message: '起始年份不可大於結束年份', path: ['year_to'] }
).refine(
  (data) => {
    if (data.price_range_min && data.price_range_max) {
      return data.price_range_min <= data.price_range_max;
    }
    return true;
  },
  { message: '最低價格不可大於最高價格', path: ['price_range_max'] }
);

type TradeFormData = z.infer<typeof tradeFormSchema>;

// ============================================================================
// Props
// ============================================================================

interface TradeRequestFormProps {
  /** 編輯模式時傳入現有資料 */
  initialData?: TradeRequest;
  /** 表單提交回調 */
  onSubmit: (data: CreateTradeRequestInput) => Promise<{ success: boolean; message?: string }>;
  /** 取消回調 */
  onCancel?: () => void;
  /** 是否正在提交 */
  isSubmitting?: boolean;
  /** 額外樣式 */
  className?: string;
}

// ============================================================================
// 有效期選項
// ============================================================================

const EXPIRY_OPTIONS = [
  { value: 7, label: '7 天' },
  { value: 14, label: '14 天' },
  { value: 30, label: '30 天' },
];

// ============================================================================
// Component
// ============================================================================

/**
 * 調做需求表單 - 金紙風格
 */
export function TradeRequestForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: TradeRequestFormProps) {
  const isEditMode = !!initialData;
  const [submitError, setSubmitError] = useState<string | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      target_brand_id: initialData?.target_brand_id || '',
      target_spec_id: initialData?.target_spec_id || undefined,
      target_model_id: initialData?.target_model_id || undefined,
      year_from: initialData?.year_from || null,
      year_to: initialData?.year_to || null,
      price_range_min: initialData?.price_range_min || null,
      price_range_max: initialData?.price_range_max || null,
      conditions: initialData?.conditions || '',
      contact_info: initialData?.contact_info || '',
      expires_days: 7,
    },
  });

  // 監聽有效期
  const expiresDays = watch('expires_days');

  // 提交處理
  const handleFormSubmit = async (data: TradeFormData) => {
    setSubmitError(null);

    const result = await onSubmit({
      target_brand_id: data.target_brand_id,
      target_spec_id: data.target_spec_id,
      target_model_id: data.target_model_id,
      year_from: data.year_from ?? undefined,
      year_to: data.year_to ?? undefined,
      price_range_min: data.price_range_min ?? undefined,
      price_range_max: data.price_range_max ?? undefined,
      conditions: data.conditions,
      contact_info: data.contact_info,
      expires_days: data.expires_days,
    });

    if (!result.success) {
      setSubmitError(result.message || '提交失敗');
    }
  };

  // 生成年份選項
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1990 + 3 }, (_, i) => 1990 + i).reverse();

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* 車輛條件區塊 */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Car className="h-5 w-5 text-primary-500" />
          需求車輛
        </h3>

        {/* 階層式選單 */}
        <div className="mb-4">
          <CascadingSelect
            initialBrandId={initialData?.target_brand_id}
            initialSpecId={initialData?.target_spec_id || undefined}
            initialModelId={initialData?.target_model_id || undefined}
            onSelectionChange={(sel: { brandId: string | null; specId: string | null; modelId: string | null }) => {
              setValue('target_brand_id', sel.brandId || '');
              setValue('target_spec_id', sel.specId || undefined);
              setValue('target_model_id', sel.modelId || undefined);
            }}
            disabled={isSubmitting}
          />
          {errors.target_brand_id && (
            <p className="mt-1 text-sm text-destructive">{errors.target_brand_id.message}</p>
          )}
        </div>

        {/* 年份範圍 */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="flex items-center gap-1 mb-2">
              <Calendar className="h-4 w-4" />
              年份（從）
            </Label>
            <select
              {...register('year_from', { valueAsNumber: true })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">不限</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="flex items-center gap-1 mb-2">
              <Calendar className="h-4 w-4" />
              年份（至）
            </Label>
            <select
              {...register('year_to', { valueAsNumber: true })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">不限</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.year_to && (
              <p className="mt-1 text-sm text-destructive">{errors.year_to.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 預算區塊 */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <DollarSign className="h-5 w-5 text-primary-500" />
          預算範圍（萬元）
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="mb-2 block">最低</Label>
            <Input
              type="number"
              placeholder="例：80"
              {...register('price_range_min', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? null : Number(v) * 10000
              })}
            />
          </div>
          <div>
            <Label className="mb-2 block">最高</Label>
            <Input
              type="number"
              placeholder="例：150"
              {...register('price_range_max', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? null : Number(v) * 10000
              })}
            />
            {errors.price_range_max && (
              <p className="mt-1 text-sm text-destructive">{errors.price_range_max.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 條件說明區塊 */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <MessageSquare className="h-5 w-5 text-primary-500" />
          其他條件
        </h3>
        <textarea
          {...register('conditions')}
          placeholder="例：原廠保養、無事故、里程 5 萬內、黑白灰色優先..."
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {errors.conditions && (
          <p className="mt-1 text-sm text-destructive">{errors.conditions.message}</p>
        )}
      </div>

      {/* 聯絡方式區塊 */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Phone className="h-5 w-5 text-primary-500" />
          聯絡方式 <span className="text-destructive">*</span>
        </h3>
        <Input
          {...register('contact_info')}
          placeholder="例：王先生 0912-345-678，可 LINE 聯繫"
        />
        {errors.contact_info && (
          <p className="mt-1 text-sm text-destructive">{errors.contact_info.message}</p>
        )}
      </div>

      {/* 有效期區塊 */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
          <Clock className="h-5 w-5 text-primary-500" />
          有效期限
        </h3>
        <div className="flex flex-col gap-2">
          {EXPIRY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('expires_days', option.value)}
              className={cn(
                'flex-1 rounded-lg border py-3 text-base font-medium transition-colors',
                expiresDays === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-border bg-background text-muted-foreground hover:border-primary-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          到期後可隨時續期，不會自動刪除
        </p>
      </div>

      {/* 錯誤訊息 */}
      {submitError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
          {submitError}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-primary-500 hover:bg-primary-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              處理中...
            </>
          ) : isEditMode ? (
            '儲存變更'
          ) : (
            '發布調做'
          )}
        </Button>
      </div>
    </motion.form>
  );
}
