/**
 * FaCai-B Platform - v12 Type Extensions
 * File: backend/src/types/v12.ts
 *
 * 第 1 批新增功能相關的型別。放在獨立檔避免影響既有 types/index.ts。
 */

// ============================================================================
// Vehicle Expenses（整備費細項）
// ============================================================================

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  owner_dealer_id: string;
  item_name: string;
  amount: number;
  note: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  item_name: string;
  amount: number;
  note?: string;
  expense_date?: string;
}

export interface UpdateExpenseInput {
  item_name?: string;
  amount?: number;
  note?: string;
  expense_date?: string;
}

// ============================================================================
// Revenue Record（營收紀錄）
// ============================================================================

export interface RevenueRecord {
  id: string;
  vehicle_id: string | null;
  owner_dealer_id: string | null;
  vehicle_snapshot: Record<string, unknown>;
  listing_price: number | null;
  acquisition_cost: number | null;
  repair_cost_base: number | null;
  expenses_total: number;
  total_cost: number;
  profit: number;
  archived_at: string;
  settled_at: string;
  created_at: string;
}

// ============================================================================
// Manual Vehicle Request（找不到車輛→代上傳）
// ============================================================================

export type ManualVehicleRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ManualVehicleRequest {
  id: string;
  requester_id: string;
  brand_text: string;
  spec_text: string | null;
  model_text: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  transmission: string | null;
  fuel_type: string | null;
  listing_price: number | null;
  acquisition_cost: number | null;
  repair_cost: number | null;
  description: string | null;
  images: string[];
  contact_note: string | null;
  status: ManualVehicleRequestStatus;
  rejection_reason: string | null;
  created_vehicle_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateManualVehicleRequestInput {
  brand_text: string;
  spec_text?: string;
  model_text?: string;
  year?: number;
  color?: string;
  mileage?: number;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt';
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  listing_price?: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
  images?: string[];
  contact_note?: string;
}

// ============================================================================
// Credits
// ============================================================================

export interface CreditsAdjustInput {
  credits: number; // 直接設為新的點數
}
