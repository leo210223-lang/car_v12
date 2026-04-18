/**
 * FaCai-B Platform - v12 Validation Schemas
 * File: backend/src/utils/validation.v12.ts
 *
 * 第 1 批新增功能相關的 Zod schema。放在獨立檔避免影響既有 validation.ts。
 */

import { z } from 'zod';
import { uuidSchema, paginationSchema } from './validation';

// ============================================================================
// Vehicle Expenses
// ============================================================================

export const createExpenseSchema = z.object({
  item_name: z
    .string()
    .trim()
    .min(1, '項目名稱不能為空')
    .max(100, '項目名稱不能超過 100 字'),
  amount: z.coerce
    .number()
    .int('金額必須是整數')
    .min(0, '金額不能為負數')
    .max(100000000, '金額不能超過 1 億'),
  note: z.string().trim().max(500, '備註不能超過 500 字').optional(),
  expense_date: z.string().optional(), // YYYY-MM-DD or ISO
});

export const updateExpenseSchema = z.object({
  item_name: z
    .string()
    .trim()
    .min(1, '項目名稱不能為空')
    .max(100, '項目名稱不能超過 100 字')
    .optional(),
  amount: z.coerce
    .number()
    .int('金額必須是整數')
    .min(0, '金額不能為負數')
    .max(100000000, '金額不能超過 1 億')
    .optional(),
  note: z.string().trim().max(500, '備註不能超過 500 字').optional(),
  expense_date: z.string().optional(),
});

// ============================================================================
// Tradable（可盤切換 + 盤價）
// ============================================================================

export const updateTradableSchema = z
  .object({
    is_tradable: z.boolean(),
    trade_price: z.coerce
      .number()
      .int('盤價必須是整數')
      .min(0, '盤價不能為負數')
      .max(100000000, '盤價不能超過 1 億')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.is_tradable &&
      (data.trade_price === undefined ||
        data.trade_price === null ||
        data.trade_price <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trade_price'],
        message: '設定為可盤時，盤價必須大於 0',
      });
    }
  });

// ============================================================================
// Manual Vehicle Request
// ============================================================================

export const createManualVehicleRequestSchema = z.object({
  brand_text: z
    .string()
    .trim()
    .min(1, '品牌名稱不能為空')
    .max(100, '品牌名稱不能超過 100 字'),
  spec_text: z.string().trim().max(100).optional().nullable(),
  model_text: z.string().trim().max(100).optional().nullable(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 2)
    .optional()
    .nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  transmission: z
    .enum(['auto', 'manual', 'semi_auto', 'cvt'])
    .optional()
    .nullable(),
  fuel_type: z
    .enum(['gasoline', 'diesel', 'hybrid', 'electric'])
    .optional()
    .nullable(),
  listing_price: z.coerce.number().int().min(0).max(100000000).optional().nullable(),
  acquisition_cost: z.coerce
    .number()
    .int()
    .min(0)
    .max(100000000)
    .optional()
    .nullable(),
  repair_cost: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(15).optional().default([]),
  contact_note: z.string().trim().max(500).optional().nullable(),
});

export const manualVehicleRequestListQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const approveManualVehicleRequestSchema = z.object({
  // 審核通過時，必須提供 brand/spec/model 的 UUID，以便建立實際車輛
  brand_id: uuidSchema,
  spec_id: uuidSchema,
  model_id: uuidSchema,
  // 其餘欄位可從申請表直接繼承，但也允許覆寫
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 2),
  listing_price: z.coerce.number().int().min(0).max(100000000).optional(),
});

export const rejectManualVehicleRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, '拒絕原因不能為空')
    .max(500, '拒絕原因不能超過 500 字'),
});

// ============================================================================
// Credits（管理員調整點數）
// ============================================================================

export const adjustCreditsSchema = z.object({
  credits: z.coerce
    .number()
    .int('點數必須是整數')
    .min(0, '點數不能為負數')
    .max(10000000, '點數不能超過 1000 萬'),
});

// ============================================================================
// Business Card（名片）
// ============================================================================

export const updateBusinessCardSchema = z.object({
  business_card_url: z
    .string()
    .url('名片圖片網址格式不正確')
    .max(1000)
    .nullable(), // 傳 null 代表刪除名片
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type UpdateTradableInput = z.infer<typeof updateTradableSchema>;
export type CreateManualVehicleRequestInput = z.infer<
  typeof createManualVehicleRequestSchema
>;
export type ManualVehicleRequestListQuery = z.infer<
  typeof manualVehicleRequestListQuerySchema
>;
export type ApproveManualVehicleRequestInput = z.infer<
  typeof approveManualVehicleRequestSchema
>;
export type RejectManualVehicleRequestInput = z.infer<
  typeof rejectManualVehicleRequestSchema
>;
export type AdjustCreditsInput = z.infer<typeof adjustCreditsSchema>;
export type UpdateBusinessCardInput = z.infer<typeof updateBusinessCardSchema>;
