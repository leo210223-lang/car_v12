/**
 * FaCai-B Platform - Type Exports
 * File: frontend/src/types/index.ts
 */

export * from './user';
export * from './vehicle';
export * from './trade';

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

// Shop Types
export type ShopProductCategory = 'car_wash' | 'android_device' | 'other';

export interface ShopProduct {
  id: string;
  category: ShopProductCategory;
  name: string;
  image_url?: string;
  purchase_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// External Services Types
export type ServiceType = 'entertainment' | 'relaxation' | 'comfort' | 'shop';

export interface ExternalService {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  url: string | null;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppSettings {
  id: string;
  key: string;
  value: string | null;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalServices {
  entertainment: ExternalService;
  relaxation: ExternalService;
  comfort: ExternalService;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}
