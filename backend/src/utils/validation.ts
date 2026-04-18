/**
 * FaCai-B Platform - Validation Utilities
 * File: backend/src/utils/validation.ts
 * 
 * 使用 Zod 進行請求參數驗證
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errors } from './response';

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid('必須是有效的 UUID 格式');

export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Vehicle Schemas
// ============================================================================

export const createVehicleSchema = z.object({
  brand_id: uuidSchema,
  spec_id: uuidSchema,
  model_id: uuidSchema,
  year: z.coerce.number()
    .int('年份必須是整數')
    .min(1900, '年份不能早於 1900 年')
    .max(new Date().getFullYear() + 2, '年份不能超過後年'),
  mileage: z.coerce.number()
    .int('里程數必須是整數')
    .min(0, '里程數不能為負數')
    .optional(),
  color: z.string()
    .max(50, '車身顏色不能超過 50 字')
    .optional(),
  transmission: z.enum(['auto', 'manual', 'semi_auto', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'hybrid', 'electric']).optional(),
  listing_price: z.coerce.number()
    .int('售價必須是整數')
    .min(0, '售價不能為負數')
    .max(100000000, '售價不能超過 1 億')
    .optional(),
  acquisition_cost: z.coerce.number()
    .int('進車成本必須是整數')
    .min(0, '進車成本不能為負數')
    .max(100000000, '進車成本不能超過 1 億')
    .optional(),
  repair_cost: z.coerce.number()
    .int('整備費用必須是整數')
    .min(0, '整備費用不能為負數')
    .max(10000000, '整備費用不能超過 1000 萬')
    .optional(),
  description: z.string()
    .max(2000, '描述不能超過 2000 字')
    .optional()
    .default(''),
});

export const updateVehicleSchema = z.object({
  mileage: z.coerce.number()
    .int('里程數必須是整數')
    .min(0, '里程數不能為負數')
    .optional(),
  color: z.string()
    .max(50, '車身顏色不能超過 50 字')
    .optional(),
  transmission: z.enum(['auto', 'manual', 'semi_auto', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'hybrid', 'electric']).optional(),
  listing_price: z.coerce.number()
    .int('售價必須是整數')
    .min(0, '售價不能為負數')
    .max(100000000, '售價不能超過 1 億')
    .optional(),
  acquisition_cost: z.coerce.number()
    .int('進車成本必須是整數')
    .min(0, '進車成本不能為負數')
    .max(100000000, '進車成本不能超過 1 億')
    .optional(),
  repair_cost: z.coerce.number()
    .int('整備費用必須是整數')
    .min(0, '整備費用不能為負數')
    .max(10000000, '整備費用不能超過 1000 萬')
    .optional(),
  description: z.string()
    .max(2000, '描述不能超過 2000 字')
    .optional(),
  images: z.array(z.string().url('圖片網址格式錯誤')).optional(),
});

export const vehicleListQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
  search: z.string().trim().max(100).optional(),
  brand_id: uuidSchema.optional(),
  spec_id: uuidSchema.optional(),
  model_id: uuidSchema.optional(),
  year_from: z.coerce.number().int().min(1900).optional(),
  year_to: z.coerce.number().int().max(2100).optional(),
  price_min: z.coerce.number().int().min(0).optional(),
  price_max: z.coerce.number().int().optional(),
  owner_only: z.coerce.boolean().optional(),
});

export const vehicleSearchQuerySchema = paginationSchema.extend({
  q: z.string().min(1, '搜尋關鍵字不能為空').max(100),
});

export const rejectVehicleSchema = z.object({
  rejection_reason: z.string()
    .min(1, '拒絕原因不能為空')
    .max(500, '拒絕原因不能超過 500 字'),
});

// ============================================================================
// Admin Audit Schemas
// ============================================================================

export const auditListQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected', 'archived']).default('pending'),
});

export const proxyCreateVehicleSchema = z.object({
  owner_dealer_id: uuidSchema,
  brand_id: uuidSchema,
  spec_id: uuidSchema,
  model_id: uuidSchema,
  year: z.coerce.number()
    .int('年份必須是整數')
    .min(1900, '年份不能早於 1900 年')
    .max(new Date().getFullYear() + 2, '年份不能超過後年'),
  mileage: z.coerce.number()
    .int('里程數必須是整數')
    .min(0, '里程數不能為負數')
    .optional(),
  color: z.string()
    .max(50, '車身顏色不能超過 50 字')
    .optional(),
  transmission: z.enum(['auto', 'manual', 'semi_auto', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'hybrid', 'electric']).optional(),
  listing_price: z.coerce.number()
    .int('售價必須是整數')
    .min(0, '售價不能為負數')
    .max(100000000, '售價不能超過 1 億'),
  acquisition_cost: z.coerce.number()
    .int('進車成本必須是整數')
    .min(0, '進車成本不能為負數')
    .max(100000000, '進車成本不能超過 1 億')
    .optional(),
  repair_cost: z.coerce.number()
    .int('整備費用必須是整數')
    .min(0, '整備費用不能為負數')
    .max(10000000, '整備費用不能超過 1000 萬')
    .optional(),
  description: z.string()
    .max(2000, '描述不能超過 2000 字')
    .optional()
    .default(''),
});

// ============================================================================
// Trade Request Schemas
// ============================================================================

const tradeRequestBaseSchema = z.object({
  target_brand_id: uuidSchema,
  target_spec_id: uuidSchema,
  target_model_id: uuidSchema,
  year_from: z.coerce.number()
    .int('起始年份必須是整數')
    .min(1900, '起始年份不能早於 1900')
    .max(2100, '起始年份不能晚於 2100'),
  year_to: z.coerce.number()
    .int('結束年份必須是整數')
    .min(1900, '結束年份不能早於 1900')
    .max(2100, '結束年份不能晚於 2100'),
  price_range_min: z.coerce.number()
    .int('最低預算必須是整數')
    .min(1, '最低預算必須大於 0'),
  price_range_max: z.coerce.number()
    .int('最高預算必須是整數')
    .min(1, '最高預算必須大於 0'),
  conditions: z.string()
    .max(1000, '條件說明不能超過 1000 字')
    .optional()
    .default(''),
  contact_info: z.string()
    .min(1, '聯絡資訊不能為空')
    .max(500, '聯絡資訊不能超過 500 字'),
  expires_at: z.string().datetime().optional(),
});

export const createTradeRequestSchema = tradeRequestBaseSchema.superRefine((data, ctx) => {
  if (data.year_from > data.year_to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['year_to'],
      message: '結束年份必須大於或等於起始年份',
    });
  }

  if (data.price_range_min > data.price_range_max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_range_max'],
      message: '最高預算必須大於或等於最低預算',
    });
  }
});

export const updateTradeRequestSchema = tradeRequestBaseSchema.partial().superRefine((data, ctx) => {
  if (
    typeof data.year_from === 'number' &&
    typeof data.year_to === 'number' &&
    data.year_from > data.year_to
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['year_to'],
      message: '結束年份必須大於或等於起始年份',
    });
  }

  if (
    typeof data.price_range_min === 'number' &&
    typeof data.price_range_max === 'number' &&
    data.price_range_min > data.price_range_max
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_range_max'],
      message: '最高預算必須大於或等於最低預算',
    });
  }
});

export const tradeListQuerySchema = paginationSchema.extend({
  brand_id: uuidSchema.optional(),
  is_active: z.coerce.boolean().optional(),
  my_only: z.coerce.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const extendTradeSchema = z.object({
  days: z.coerce.number()
    .int('天數必須是整數')
    .min(1, '至少延長 1 天')
    .max(365, '最多延長 365 天')
    .default(30),
});

export const reviewTradeSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: '審核狀態必須是 approved 或 rejected' }),
  }),
});

// ============================================================================
// Notification Schemas
// ============================================================================

export const notificationListQuerySchema = paginationSchema.extend({
  is_read: z.coerce.boolean().optional(),
});

// ============================================================================
// Dictionary Schemas
// ============================================================================

export const specsQuerySchema = z.object({
  brand_id: uuidSchema,
});

export const modelsQuerySchema = z.object({
  spec_id: uuidSchema,
});

export type SpecsQuery = z.infer<typeof specsQuerySchema>;
export type ModelsQuery = z.infer<typeof modelsQuerySchema>;

export const dictionaryRequestSchema = z.object({
  request_type: z.enum(['brand', 'spec', 'model'], {
    errorMap: () => ({ message: '類型必須是 brand, spec 或 model' }),
  }),
  parent_id: uuidSchema.optional(),
  suggested_name: z.string()
    .min(1, '名稱不能為空')
    .max(100, '名稱不能超過 100 字'),
});

export const dictionaryRequestListQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const rejectDictionaryRequestSchema = z.object({
  reason: z.string()
    .min(1, '拒絕原因不能為空')
    .max(500, '拒絕原因不能超過 500 字'),
});

export const updateBrandSchema = z.object({
  name: z.string()
    .min(1, '品牌名稱不能為空')
    .max(100, '品牌名稱不能超過 100 字')
    .optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const updateSpecSchema = z.object({
  name: z.string()
    .min(1, '規格名稱不能為空')
    .max(100, '規格名稱不能超過 100 字')
    .optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const updateModelSchema = z.object({
  name: z.string()
    .min(1, '車型名稱不能為空')
    .max(100, '車型名稱不能超過 100 字')
    .optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const createBrandSchema = z.object({
  name: z.string()
    .min(1, '品牌名稱不能為空')
    .max(100, '品牌名稱不能超過 100 字'),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const createSpecSchema = z.object({
  brand_id: uuidSchema,
  name: z.string()
    .min(1, '規格名稱不能為空')
    .max(100, '規格名稱不能超過 100 字'),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const createModelSchema = z.object({
  spec_id: uuidSchema,
  name: z.string()
    .min(1, '車型名稱不能為空')
    .max(100, '車型名稱不能超過 100 字'),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

// ============================================================================
// User Management Schemas (Admin)
// ============================================================================

export const userListQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'suspended', 'pending', 'rejected']).optional(),
  status_group: z.enum(['suspended_rejected']).optional(),
  search: z.string().max(100).optional(),
});

export const suspendUserSchema = z.object({
  reason: z.string()
    .min(1, '停權原因不能為空')
    .max(500, '停權原因不能超過 500 字'),
});

export const rejectUserSchema = z.object({
  reason: z.string().max(500, '退件原因不能超過 500 字').optional(),
});

export const updateOwnProfileSchema = z.object({
  name: z.string().trim().min(1, '姓名不能為空').max(100, '姓名不能超過 100 字').optional(),
  phone: z.string().trim().max(30, '電話不能超過 30 字').optional(),
  company_name: z.string().trim().max(200, '公司名稱不能超過 200 字').optional(),
}).refine(
  (data) => data.name !== undefined || data.phone !== undefined || data.company_name !== undefined,
  { message: '至少提供一個可更新欄位' }
);

// ============================================================================
// Shop Schemas
// ============================================================================

export const shopProductCategorySchema = z.enum(['car_wash', 'android_device', 'other'], {
  errorMap: () => ({ message: '分類必須是 car_wash, android_device 或 other' }),
});

export const shopListQuerySchema = paginationSchema.extend({
  category: shopProductCategorySchema.optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export const createShopProductSchema = z.object({
  category: shopProductCategorySchema,
  name: z.string()
    .min(1, '商品名稱不能為空')
    .max(200, '商品名稱不能超過 200 字'),
  image_url: z.string()
    .url('圖片網址格式不正確')
    .max(500, '圖片網址不能超過 500 字'),
  purchase_url: z.string()
    .url('購買網址格式不正確')
    .max(500, '購買網址不能超過 500 字'),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const updateShopProductSchema = z.object({
  category: shopProductCategorySchema.optional(),
  name: z.string()
    .min(1, '商品名稱不能為空')
    .max(200, '商品名稱不能超過 200 字')
    .optional(),
  image_url: z.string()
    .url('圖片網址格式不正確')
    .max(500, '圖片網址不能超過 500 字')
    .optional(),
  purchase_url: z.string()
    .url('購買網址格式不正確')
    .max(500, '購買網址不能超過 500 字')
    .optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

// ============================================================================
// External Services Schemas (Admin)
// ============================================================================

export const externalServiceSchema = z.object({
  name: z.string()
    .min(1, '服務名稱不能為空')
    .max(100, '服務名稱不能超過 100 字')
    .optional(),
  url: z.string()
    .url('網址格式不正確')
    .max(500, '網址不能超過 500 字')
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

export const updateExternalServicesSchema = z.object({
  entertainment: externalServiceSchema.optional(),
  relaxation: externalServiceSchema.optional(),
  comfort: externalServiceSchema.optional(),
});

export const upsertAppSettingSchema = z.object({
  key: z.string()
    .min(1, 'key 不能為空')
    .max(100, 'key 長度不能超過 100'),
  value: z.unknown(),
});

// ============================================================================
// Validation Middleware Factory
// ============================================================================

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * 建立驗證中間件
 */
export function validate<T extends z.ZodSchema>(
  schema: T,
  target: ValidationTarget = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errorMessages = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      errors.validation(res, errorMessages || '請求參數驗證失敗', 'VALIDATION_ERROR');
      return;
    }

    // 將驗證後的資料放回 request
    if (target === 'body') {
      req.body = result.data;
    } else if (target === 'query') {
      (req as Request & { validatedQuery: z.infer<T> }).validatedQuery = result.data;
    } else if (target === 'params') {
      (req as Request & { validatedParams: z.infer<T> }).validatedParams = result.data;
    }

    next();
  };
}

/**
 * 驗證 UUID 參數
 */
export function validateUuidParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value) {
      errors.badRequest(res, `缺少必要參數: ${paramName}`, 'MISSING_PARAM');
      return;
    }

    const result = uuidSchema.safeParse(value);

    if (!result.success) {
      errors.badRequest(res, `無效的 ${paramName} 格式`, 'INVALID_UUID');
      return;
    }

    next();
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleListQuery = z.infer<typeof vehicleListQuerySchema>;
export type VehicleSearchQuery = z.infer<typeof vehicleSearchQuerySchema>;
export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
export type ProxyCreateVehicleInput = z.infer<typeof proxyCreateVehicleSchema>;
export type CreateTradeRequestInput = z.infer<typeof createTradeRequestSchema>;
export type UpdateTradeRequestInput = z.infer<typeof updateTradeRequestSchema>;
export type TradeListQuery = z.infer<typeof tradeListQuerySchema>;
export type ExtendTradeInput = z.infer<typeof extendTradeSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type CreateSpecInput = z.infer<typeof createSpecSchema>;
export type CreateModelInput = z.infer<typeof createModelSchema>;
export type DictionaryRequestInput = z.infer<typeof dictionaryRequestSchema>;
export type DictionaryRequestListQuery = z.infer<typeof dictionaryRequestListQuerySchema>;
export type RejectDictionaryRequestInput = z.infer<typeof rejectDictionaryRequestSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type UpdateSpecInput = z.infer<typeof updateSpecSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
export type ShopListQuery = z.infer<typeof shopListQuerySchema>;
export type CreateShopProductInput = z.infer<typeof createShopProductSchema>;
export type UpdateShopProductInput = z.infer<typeof updateShopProductSchema>;
export type ExternalServiceInput = z.infer<typeof externalServiceSchema>;
export type UpdateExternalServicesInput = z.infer<typeof updateExternalServicesSchema>;
export type UpsertAppSettingInput = z.infer<typeof upsertAppSettingSchema>;
