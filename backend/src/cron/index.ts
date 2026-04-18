/**
 * FaCai-B Platform - Cron Job Scheduler
 * File: backend/src/cron/index.ts
 *
 * 定時任務入口 - 初始化並啟動所有排程任務
 *
 * [v12] 新增：settleArchivedVehiclesJob — 每日 05:00 結算下架超過 30 天的車輛
 */

import * as cron from 'node-cron';
import { tradeExpiryReminderJob } from './jobs/trade-expiry-reminder';
import { cleanExpiredTradesJob } from './jobs/clean-expired-trades';
import { cleanOrphanImagesJob } from './jobs/clean-orphan-images';
import { settleArchivedVehiclesJob } from './jobs/settle-archived-vehicles';

// ============================================================================
// Cron Schedule Constants
// ============================================================================

const SCHEDULE = {
  // 每日 09:00 (UTC+8) - 發送到期提醒
  TRADE_EXPIRY_REMINDER: '0 9 * * *',
  // 每日 03:00 (UTC+8) - 清理過期調做
  CLEAN_EXPIRED_TRADES: '0 3 * * *',
  // 每日 04:00 (UTC+8) - 清理孤兒圖片
  CLEAN_ORPHAN_IMAGES: '0 4 * * *',
  // [v12] 每日 05:00 (UTC+8) - 結算下架 30 天的車輛
  SETTLE_ARCHIVED_VEHICLES: '0 5 * * *',
} as const;

// ============================================================================
// Scheduled Tasks Registry
// ============================================================================

const scheduledTasks: cron.ScheduledTask[] = [];

export function initCronJobs(): void {
  console.log('[Cron] Initializing scheduled tasks...');

  try {
    // 1. 調做到期提醒 (每日 09:00)
    const reminderTask = cron.schedule(
      SCHEDULE.TRADE_EXPIRY_REMINDER,
      async () => {
        console.log('[Cron] Running: Trade Expiry Reminder');
        await safeExecute('TradeExpiryReminder', tradeExpiryReminderJob);
      },
      { timezone: 'Asia/Taipei' }
    );
    scheduledTasks.push(reminderTask);
    console.log('[Cron] ✅ Trade Expiry Reminder scheduled at 09:00 daily');

    // 2. 清理過期調做 (每日 03:00)
    const cleanTradesTask = cron.schedule(
      SCHEDULE.CLEAN_EXPIRED_TRADES,
      async () => {
        console.log('[Cron] Running: Clean Expired Trades');
        await safeExecute('CleanExpiredTrades', cleanExpiredTradesJob);
      },
      { timezone: 'Asia/Taipei' }
    );
    scheduledTasks.push(cleanTradesTask);
    console.log('[Cron] ✅ Clean Expired Trades scheduled at 03:00 daily');

    // 3. 清理孤兒圖片 (每日 04:00)
    const cleanImagesTask = cron.schedule(
      SCHEDULE.CLEAN_ORPHAN_IMAGES,
      async () => {
        console.log('[Cron] Running: Clean Orphan Images');
        await safeExecute('CleanOrphanImages', cleanOrphanImagesJob);
      },
      { timezone: 'Asia/Taipei' }
    );
    scheduledTasks.push(cleanImagesTask);
    console.log('[Cron] ✅ Clean Orphan Images scheduled at 04:00 daily');

    // 4. [v12] 結算下架 30 天的車輛 (每日 05:00)
    const settleArchivedTask = cron.schedule(
      SCHEDULE.SETTLE_ARCHIVED_VEHICLES,
      async () => {
        console.log('[Cron] Running: Settle Archived Vehicles');
        await safeExecute('SettleArchivedVehicles', settleArchivedVehiclesJob);
      },
      { timezone: 'Asia/Taipei' }
    );
    scheduledTasks.push(settleArchivedTask);
    console.log('[Cron] ✅ Settle Archived Vehicles scheduled at 05:00 daily');

    console.log(`[Cron] All ${scheduledTasks.length} tasks initialized successfully`);
  } catch (error) {
    console.error('[Cron] Failed to initialize cron jobs:', error);
  }
}

export function stopCronJobs(): void {
  console.log('[Cron] Stopping all scheduled tasks...');

  scheduledTasks.forEach((task, index) => {
    try {
      task.stop();
      console.log(`[Cron] Task ${index + 1} stopped`);
    } catch (error) {
      console.error(`[Cron] Failed to stop task ${index + 1}:`, error);
    }
  });

  console.log('[Cron] All tasks stopped');
}

async function safeExecute(
  jobName: string,
  jobFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await jobFn();
    const duration = Date.now() - startTime;
    console.log(`[Cron] ✅ ${jobName} completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Cron] ❌ ${jobName} failed after ${duration}ms:`, error);
  }
}

export default { initCronJobs, stopCronJobs };
