/**
 * FaCai-B Platform - Clean Expired Trades Job
 * File: backend/src/cron/jobs/clean-expired-trades.ts
 * 
 * 每日 03:00 執行 - 停用已過期的調做需求
 * 將 expires_at < NOW() 且 is_active = true 的調做設為 is_active = false
 */

import { supabaseAdmin } from '../../config/supabase';

/**
 * 清理過期調做任務
 * - 查找已過期但仍為 active 的調做需求
 * - 批次更新為 is_active = false
 */
export async function cleanExpiredTradesJob(): Promise<void> {
  console.log('[CleanExpiredTrades] Starting...');

  const now = new Date().toISOString();

  try {
    // 查找已過期但仍為 active 的調做
    const { data: expiredTrades, error: queryError } = await supabaseAdmin
      .from('trade_requests')
      .select('id')
      .eq('is_active', true)
      .lt('expires_at', now)
      .not('expires_at', 'is', null);

    if (queryError) {
      console.error('[CleanExpiredTrades] Query error:', queryError);
      throw queryError;
    }

    if (!expiredTrades || expiredTrades.length === 0) {
      console.log('[CleanExpiredTrades] No expired trades found');
      return;
    }

    console.log(`[CleanExpiredTrades] Found ${expiredTrades.length} expired trades`);

    // 批次更新（單一 UPDATE 語句）
    const expiredIds = expiredTrades.map((t) => t.id);
    
    const { error: updateError, count } = await supabaseAdmin
      .from('trade_requests')
      .update({ 
        is_active: false,
        updated_at: now,
      })
      .in('id', expiredIds);

    if (updateError) {
      console.error('[CleanExpiredTrades] Update error:', updateError);
      throw updateError;
    }

    console.log(`[CleanExpiredTrades] Deactivated ${count ?? expiredIds.length} expired trades`);
  } catch (error) {
    console.error('[CleanExpiredTrades] Job failed:', error);
    throw error;
  }
}

export default cleanExpiredTradesJob;
