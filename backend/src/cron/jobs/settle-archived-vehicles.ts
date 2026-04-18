/**
 * FaCai-B Platform - Settle Archived Vehicles Job
 * File: backend/src/cron/jobs/settle-archived-vehicles.ts
 *
 * 每日凌晨執行 - 針對「下架超過 30 天」的車輛：
 *  1) 計算成本、結算利潤
 *  2) 寫入 revenue_records
 *  3) 刪除該車輛（以及 vehicle_expenses 細項）
 */

import { supabaseAdmin } from '../../config/supabase';
import { revenueService } from '../../services/revenue.service';

const ARCHIVED_RETENTION_DAYS = 30;

export async function settleArchivedVehiclesJob(): Promise<void> {
  console.log('[SettleArchivedVehicles] Starting...');

  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - ARCHIVED_RETENTION_DAYS);
    const thresholdIso = threshold.toISOString();

    // 查找所有 status=archived 且 archived_at < 30 天前的車輛
    const { data: targets, error: queryError } = await supabaseAdmin
      .from('vehicles')
      .select('id, owner_dealer_id, archived_at')
      .eq('status', 'archived')
      .not('archived_at', 'is', null)
      .lt('archived_at', thresholdIso);

    if (queryError) {
      console.error('[SettleArchivedVehicles] Query error:', queryError);
      throw queryError;
    }

    if (!targets || targets.length === 0) {
      console.log('[SettleArchivedVehicles] No vehicles eligible for settlement.');
      return;
    }

    console.log(`[SettleArchivedVehicles] Found ${targets.length} vehicle(s) to settle.`);

    let successCount = 0;
    let failCount = 0;

    for (const v of targets) {
      try {
        const result = await revenueService.settle(v.id);
        if (result.success) {
          successCount++;
          console.log(`[SettleArchivedVehicles] ✅ Settled vehicle ${v.id} (owner=${v.owner_dealer_id})`);
        } else {
          failCount++;
          console.error(
            `[SettleArchivedVehicles] ❌ Settle failed for ${v.id}:`,
            result.error
          );
        }
      } catch (err) {
        failCount++;
        console.error(`[SettleArchivedVehicles] ❌ Exception on ${v.id}:`, err);
      }
    }

    console.log(
      `[SettleArchivedVehicles] Done. success=${successCount}, failed=${failCount}`
    );
  } catch (error) {
    console.error('[SettleArchivedVehicles] Job failed:', error);
    throw error;
  }
}

export default settleArchivedVehiclesJob;
