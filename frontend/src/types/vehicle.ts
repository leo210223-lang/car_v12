/**
 * FaCai-B Platform - Vehicle Types
 * File: frontend/src/types/vehicle.ts
 */

export type VehicleStatus = 'pending' | 'approved' | 'rejected' | 'archived';

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

export interface Vehicle {
  id: string;
  owner_dealer_id: string;
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  mileage?: number | null;
  color?: string | null;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt' | null;
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | null;
  listing_price?: number | null;
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
    name: string;
    company_name: string;
    phone: string;
  };
}

export interface VehicleListItem {
  id: string;
  brand_name: string;
  spec_name: string;
  model_name: string;
  year: number;
  mileage?: number | null;
  color?: string | null;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt' | null;
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | null;
  listing_price?: number | null;
  status: VehicleStatus;
  images: string[];
  owner_company_name: string;
  created_at: string;
}

export interface CreateVehicleInput {
  brand_id: string;
  spec_id: string;
  model_id: string;
  year: number;
  mileage?: number;
  color?: string;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt';
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  listing_price: number | null;
  acquisition_cost?: number | null;
  repair_cost?: number | null;
  description?: string;
}

export interface UpdateVehicleInput {
  mileage?: number;
  color?: string;
  transmission?: 'auto' | 'manual' | 'semi_auto' | 'cvt';
  fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  listing_price?: number | null;
  acquisition_cost?: number | null;
  repair_cost?: number | null;
  description?: string;
}

export interface VehicleSearchParams {
  q?: string;
  brand_id?: string;
  spec_id?: string;
  model_id?: string;
  year_from?: number;
  year_to?: number;
  price_min?: number;
  price_max?: number;
  status?: VehicleStatus;
  cursor?: string;
  limit?: number;
}
