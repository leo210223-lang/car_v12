/**
 * FaCai-B Platform - Type Definitions
 * File: backend/src/types/index.ts
 */

// User Types
export type UserStatus = 'active' | 'suspended' | 'pending' | 'rejected';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  company_name: string;
  status: UserStatus;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
}

export interface AuthenticatedUser extends JwtUser {
  profile?: User;
}

// Vehicle Types
export type VehicleStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface Vehicle {
  id: string;
  owner_dealer_id: string;
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  listing_price: number;
  acquisition_cost: number | null;
  repair_cost: number | null;
  status: VehicleStatus;
  rejection_reason: string | null;
  description: string;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface VehicleDetail extends Vehicle {
  brand: Brand;
  spec: Spec;
  model: Model;
  owner: {
    id: string;
    company_name: string;
    phone: string;
  };
}

export interface CreateVehicleRequest {
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  listing_price: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
}

export interface UpdateVehicleRequest {
  listing_price?: number;
  acquisition_cost?: number;
  repair_cost?: number;
  description?: string;
}

// Dictionary Types
export interface Brand {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Spec {
  id: string;
  brand_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  spec_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Trade Request Types
export interface TradeRequest {
  id: string;
  dealer_id: string;
  target_brand_id: string;
  target_spec_id: string | null;
  target_model_id: string | null;
  year_from: number | null;
  year_to: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  conditions: string;
  contact_info: string;
  expires_at: string | null;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface TradeRequestDetail extends TradeRequest {
  dealer: {
    id: string;
    company_name: string;
    phone: string;
  };
  target_brand: Brand;
  target_spec: Spec | null;
  target_model: Model | null;
}

export interface CreateTradeRequestRequest {
  target_brand_id: string;
  target_spec_id?: string;
  target_model_id?: string;
  year_from?: number;
  year_to?: number;
  price_range_min?: number;
  price_range_max?: number;
  conditions?: string;
  contact_info: string;
  expires_at?: string;
}

// Dictionary Request Types
export type DictionaryRequestType = 'brand' | 'spec' | 'model';
export type DictionaryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DictionaryRequest {
  id: string;
  requester_id: string;
  request_type: DictionaryRequestType;
  parent_id: string | null;
  suggested_name: string;
  status: DictionaryRequestStatus;
  created_at: string;
  updated_at: string;
}

// Notification Types
export type NotificationType = 
  | 'vehicle_approved'
  | 'vehicle_rejected'
  | 'trade_match'
  | 'system'
  | 'account_suspended'
  | 'account_reactivated';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// Audit Log Types
export type AuditAction = 
  | 'VEHICLE_APPROVED'
  | 'VEHICLE_REJECTED'
  | 'USER_PROMOTED_TO_ADMIN'
  | 'USER_DEMOTED_TO_USER'
  | 'USER_SUSPENDED'
  | 'USER_REACTIVATED'
  | 'DICTIONARY_ADDED'
  | 'DICTIONARY_UPDATED'
  | 'DICTIONARY_DELETED';

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

// App Settings Types
export interface ExternalService {
  name: string;
  url: string | null;
  is_active: boolean;
}

export interface ExternalServices {
  entertainment: ExternalService;
  relaxation: ExternalService;
  comfort: ExternalService;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

// Shop Types
export type ShopProductCategory = 'car_wash' | 'android_device' | 'other';

export interface ShopProduct {
  id: string;
  category: ShopProductCategory;
  name: string;
  image_url: string;
  purchase_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Common Types
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  q?: string;
  brand_id?: string;
  spec_id?: string;
  model_id?: string;
  year_from?: number;
  year_to?: number;
  price_min?: number;
  price_max?: number;
  status?: VehicleStatus;
}

// Express Extensions
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export {};
