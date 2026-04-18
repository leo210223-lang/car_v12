/**
 * FaCai-B Platform - Trade Request Types
 * File: frontend/src/types/trade.ts
 */

import { Brand, Spec, Model } from './vehicle';

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
  reminded_at: string | null;
  created_at: string;
  updated_at: string;
  dealer?: {
    id: string;
    name: string;
    company_name: string;
    phone: string;
  } | null;
  brand?: { id?: string; name: string } | null;
  model?: { id?: string; name: string } | null;
  target_brand?: { name: string } | null;
  target_spec?: { name: string } | null;
  target_model?: { name: string } | null;
}

export interface TradeRequestDetail extends TradeRequest {
  dealer: {
    id: string;
    name: string;
    company_name: string;
    phone: string;
  };
  target_brand: Brand;
  target_spec: Spec | null;
  target_model: Model | null;
}

export interface TradeRequestListItem {
  id: string;
  brand_name: string;
  spec_name: string | null;
  model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  dealer_company_name: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateTradeRequestInput {
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

export interface TradeSearchParams {
  brand_id?: string;
  is_active?: boolean;
  my_only?: boolean;
  cursor?: string;
  limit?: number;
}
