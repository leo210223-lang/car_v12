/**
 * FaCai-B Platform - Trade Expiry Reminder Job
 * File: backend/src/cron/jobs/trade-expiry-reminder.ts
 * 
 * 每日 09:00 執行 - 發送調做需求到期提醒通知
 * 提醒邏輯：到期前 1 天發送，且僅發送一次（檢查 reminded_at）
 */

import { supabaseAdmin } from '../../config/supabase';
import { notificationService } from '../../services/notification.service';

/**
 * 調做到期提醒任務
 * - 查找明天到期且尚未提醒的調做需求
 * - 發送 trade_expiring 類型通知
 * - 標記已提醒（更新 reminded_at）
 */
export async function tradeExpiryReminderJob(): Promise<void> {
  console.log('[TradeExpiryReminder] Starting...');

  // 計算明天的日期範圍
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const tomorrowISO = tomorrow.toISOString();
  const dayAfterTomorrowISO = dayAfterTomorrow.toISOString();

  try {
    // 查找明天到期且尚未提醒的調做需求
    const { data: expiringTrades, error } = await supabaseAdmin
      .from('trade_requests')
      .select(`
        id,
        dealer_id,
        expires_at,
        target_brand:brands!target_brand_id(name),
        target_spec:specs!target_spec_id(name),
        reminded_at
      `)
      .eq('is_active', true)
      .gte('expires_at', tomorrowISO)
      .lt('expires_at', dayAfterTomorrowISO)
      .is('reminded_at', null);

    if (error) {
      console.error('[TradeExpiryReminder] Query error:', error);
      throw error;
    }

    if (!expiringTrades || expiringTrades.length === 0) {
      console.log('[TradeExpiryReminder] No expiring trades found');
      return;
    }

    console.log(`[TradeExpiryReminder] Found ${expiringTrades.length} expiring trades`);

    // 逐一發送通知
    let successCount = 0;
    let failCount = 0;

    for (const trade of expiringTrades) {
      try {
        // 取得品牌和規格名稱（Supabase 返回的是陣列）
        const brandData = trade.target_brand as Array<{ name: string }> | null;
        const specData = trade.target_spec as Array<{ name: string }> | null;
        const brandName = brandData?.[0]?.name || '未知品牌';
        const specName = specData?.[0]?.name || '';
        const vehicleDesc = specName ? `${brandName} ${specName}` : brandName;

        // 發送通知
        await notificationService.send({
          user_id: trade.dealer_id,
          type: 'system', // 使用 system 類型，因為目前沒有 trade_expiring 類型
          title: '盤車需求即將到期',
          message: `您的「${vehicleDesc}」盤車需求將於明天到期，如需繼續徵求，請記得續期！`,
          data: {
            trade_request_id: trade.id,
            expires_at: trade.expires_at,
          },
        });

        // 標記已提醒
        await supabaseAdmin
          .from('trade_requests')
          .update({ reminded_at: new Date().toISOString() })
          .eq('id', trade.id);

        successCount++;
      } catch (notifyError) {
        console.error(`[TradeExpiryReminder] Failed to notify trade ${trade.id}:`, notifyError);
        failCount++;
        // 繼續處理下一個，不中斷整個任務
      }
    }

    console.log(`[TradeExpiryReminder] Completed: ${successCount} sent, ${failCount} failed`);
  } catch (error) {
    console.error('[TradeExpiryReminder] Job failed:', error);
    throw error; // 讓外層的 safeExecute 記錄錯誤
  }
}

export default tradeExpiryReminderJob;
