/**
 * FaCai-B Platform - Revenue Service
 * File: backend/src/services/revenue.service.ts
 *
 * 營收紀錄：
 *  - settle(): 針對一台已下架車輛做結算、寫入 revenue_records、刪除車輛
 *  - listByOwner(): 車行看自己的營收
 *  - listAll(): 管理員看全部
 */

import { supabaseAdmin } from '../config/supabase';
import { vehicleExpenseService } from './vehicle-expense.service';
import type { RevenueRecord } from '../types/v12';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const revenueService = {
  /**
   * 結算一台已下架的車輛：
   *  1) 取得車輛完整資訊（含 brand/spec/model）
   *  2) 計算 expenses_total、total_cost、profit
   *  3) 寫入 revenue_records（包含 vehicle_snapshot）
   *  4) 刪除 vehicle_expenses（細項不保留）
   *  5) 刪除 vehicles 本身
   *
   * 注意：此方法會真的刪除 vehicles，請確保呼叫前已確認該車為 archived。
   */
  async settle(
    vehicleId: string
  ): Promise<ServiceResult<{ revenue_id: string }>> {
    try {
      // 1) 取得完整車輛資訊
      const { data: vehicle, error: fetchError } = await supabaseAdmin
        .from('vehicles')
        .select(
          `*,
           brand:brands!vehicles_brand_id_fkey(id, name),
           spec:specs!vehicles_spec_id_fkey(id, name),
           model:models!vehicles_model_id_fkey(id, name)
          `
        )
        .eq('id', vehicleId)
        .single();

      if (fetchError || !vehicle) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該車輛' } };
      }

      if (vehicle.status !== 'archived') {
        return {
          success: false,
          error: { code: 'INVALID_STATUS', message: '只有 archived 狀態的車輛可以結算' },
        };
      }

      // 2) 計算成本
      const expensesTotal = await vehicleExpenseService.sumByVehicle(vehicleId);
      const listingPrice = vehicle.listing_price ?? 0;
      const acquisitionCost = vehicle.acquisition_cost ?? 0;
      const repairCostBase = vehicle.repair_cost ?? 0;
      const totalCost = acquisitionCost + repairCostBase + expensesTotal;
      const profit = listingPrice - totalCost;

      // 3) 寫入 revenue_records
      const snapshot = {
        brand_name: vehicle.brand?.name ?? null,
        spec_name: vehicle.spec?.name ?? null,
        model_name: vehicle.model?.name ?? null,
        year: vehicle.year,
        color: vehicle.color,
        mileage: vehicle.mileage,
        images: vehicle.images,
        description: vehicle.description,
      };

      const { data: revenue, error: insertError } = await supabaseAdmin
        .from('revenue_records')
        .insert({
          vehicle_id: vehicleId,
          owner_dealer_id: vehicle.owner_dealer_id,
          vehicle_snapshot: snapshot,
          listing_price: listingPrice,
          acquisition_cost: acquisitionCost,
          repair_cost_base: repairCostBase,
          expenses_total: expensesTotal,
          total_cost: totalCost,
          profit,
          archived_at:
            vehicle.archived_at ??
            vehicle.updated_at ??
            new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError || !revenue) {
        console.error('[RevenueService] Insert revenue error:', insertError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: insertError?.message || '寫入營收紀錄失敗' },
        };
      }

      // 4) 刪除 vehicle_expenses（ON DELETE CASCADE 會跟著刪，但為了明確所以顯式刪）
      //    其實因 vehicles 的 CASCADE 設定，下一步刪 vehicle 時會自動連帶刪 expenses
      //    保留這行是「先刪細項、再刪車」的安全順序。
      await supabaseAdmin.from('vehicle_expenses').delete().eq('vehicle_id', vehicleId);

      // 5) 刪除車輛本身
      const { error: deleteError } = await supabaseAdmin
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) {
        console.error('[RevenueService] Delete vehicle error:', deleteError);
        // 已經寫入 revenue_records，不回滾；記 log 供人工處理
      }

      return { success: true, data: { revenue_id: revenue.id } };
    } catch (err) {
      console.error('[RevenueService] Settle exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '結算失敗' } };
    }
  },

  /**
   * 車行讀取自己的營收
   * [v12.2] 加入日期區間篩選（以 archived_at 為基準 — 實際下架月份）
   */
  async listByOwner(
    ownerId: string,
    limit = 20,
    cursor?: string,
    dateFrom?: string, // ISO 日期 (含) 例如 '2026-10-01T00:00:00.000Z'
    dateTo?: string    // ISO 日期 (不含) 例如 '2026-11-01T00:00:00.000Z'
  ): Promise<
    ServiceResult<{
      records: RevenueRecord[];
      nextCursor: string | null;
      hasMore: boolean;
      summary: { total_profit: number; total_sales: number; count: number };
    }>
  > {
    try {
      let queryBuilder = supabaseAdmin
        .from('revenue_records')
        .select('*')
        .eq('owner_dealer_id', ownerId)
        .order('archived_at', { ascending: false })
        .limit(limit + 1);

      // [v12.2] 日期區間（archived_at 為準）
      if (dateFrom) {
        queryBuilder = queryBuilder.gte('archived_at', dateFrom);
      }
      if (dateTo) {
        queryBuilder = queryBuilder.lt('archived_at', dateTo);
      }

      if (cursor) {
        const { data: cursorRow } = await supabaseAdmin
          .from('revenue_records')
          .select('archived_at')
          .eq('id', cursor)
          .single();
        if (cursorRow) {
          queryBuilder = queryBuilder.lt('archived_at', cursorRow.archived_at);
        }
      }

      const { data, error } = await queryBuilder;
      if (error) {
        console.error('[RevenueService] ListByOwner error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      const rows = (data || []) as RevenueRecord[];
      const hasMore = rows.length > limit;
      const records = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? records[records.length - 1]?.id : null;

      // [v12.2] 摘要也依相同日期區間計算
      let summaryQuery = supabaseAdmin
        .from('revenue_records')
        .select('profit, listing_price')
        .eq('owner_dealer_id', ownerId);
      if (dateFrom) summaryQuery = summaryQuery.gte('archived_at', dateFrom);
      if (dateTo) summaryQuery = summaryQuery.lt('archived_at', dateTo);

      const { data: allForOwner, error: sumErr } = await summaryQuery;

      let summary = { total_profit: 0, total_sales: 0, count: 0 };
      if (!sumErr && allForOwner) {
        summary = (allForOwner as Array<{ profit: number | null; listing_price: number | null }>).reduce(
          (acc, r) => ({
            total_profit: acc.total_profit + (r.profit ?? 0),
            total_sales: acc.total_sales + (r.listing_price ?? 0),
            count: acc.count + 1,
          }),
          { total_profit: 0, total_sales: 0, count: 0 }
        );
      }

      return {
        success: true,
        data: { records, nextCursor: nextCursor ?? null, hasMore, summary },
      };
    } catch (err) {
      console.error('[RevenueService] ListByOwner exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '取得營收紀錄失敗' } };
    }
  },

  /**
   * 管理員讀取全部營收
   */
  async listAll(
    limit = 20,
    cursor?: string,
    ownerId?: string
  ): Promise<
    ServiceResult<{
      records: (RevenueRecord & { owner?: { id: string; name: string; company_name: string } })[];
      nextCursor: string | null;
      hasMore: boolean;
      summary: { total_profit: number; total_sales: number; count: number };
    }>
  > {
    try {
      let queryBuilder = supabaseAdmin
        .from('revenue_records')
        .select(
          `*,
           owner:users!revenue_records_owner_dealer_id_fkey(id, name, company_name)
          `
        )
        .order('settled_at', { ascending: false })
        .limit(limit + 1);

      if (ownerId) {
        queryBuilder = queryBuilder.eq('owner_dealer_id', ownerId);
      }

      if (cursor) {
        const { data: cursorRow } = await supabaseAdmin
          .from('revenue_records')
          .select('settled_at')
          .eq('id', cursor)
          .single();
        if (cursorRow) {
          queryBuilder = queryBuilder.lt('settled_at', cursorRow.settled_at);
        }
      }

      const { data, error } = await queryBuilder;
      if (error) {
        console.error('[RevenueService] ListAll error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      const rows = (data || []) as any[];
      const hasMore = rows.length > limit;
      const records = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? records[records.length - 1]?.id : null;

      // 加總
      const { data: allRows } = await supabaseAdmin
        .from('revenue_records')
        .select('profit, listing_price');

      let summary = { total_profit: 0, total_sales: 0, count: 0 };
      if (allRows) {
        summary = allRows.reduce(
          (acc, r: any) => ({
            total_profit: acc.total_profit + (r.profit ?? 0),
            total_sales: acc.total_sales + (r.listing_price ?? 0),
            count: acc.count + 1,
          }),
          { total_profit: 0, total_sales: 0, count: 0 }
        );
      }

      return {
        success: true,
        data: { records, nextCursor: nextCursor ?? null, hasMore, summary },
      };
    } catch (err) {
      console.error('[RevenueService] ListAll exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '取得營收紀錄失敗' } };
    }
  },
};

export default revenueService;
