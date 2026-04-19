/**
 * FaCai-B Platform - Admin Dashboard Routes
 * File: backend/src/routes/admin/dashboard.ts
 *
 * Admin 儀表板統計 API 端點
 *
 * [v12.1]
 *   - 上架中車輛 = status='approved'
 *   - 會員總數 = status='active'
 *
 * [v12.2]
 *   - 每個 count 查詢獨立 try/catch，單一查詢失敗時回退為 0，不會拖垮整個 API
 *   - 避免 Promise.all 因任一 query error 就整包 reject
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { asyncHandler } from '../../middleware';
import { success, errors } from '../../utils/response';

const router = Router();

/**
 * 安全地執行一個 count 查詢，任何錯誤都回傳 0（並記 log）
 */
async function safeCount(
  label: string,
  runner: () => Promise<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const { count, error } = await runner();
    if (error) {
      console.error(`[Dashboard] ${label} count error:`, error);
      return 0;
    }
    return typeof count === 'number' ? count : 0;
  } catch (err) {
    console.error(`[Dashboard] ${label} count exception:`, err);
    return 0;
  }
}

// ============================================================================
// GET /api/admin/dashboard/stats - 儀表板統計數據
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // 各查詢獨立容錯：不用 Promise.all (怕 one fail all fail)
      // 用 Promise.allSettled 後再逐一抽值也可以，這裡用獨立 safeCount 更清楚
      const nowIso = new Date().toISOString();

      const [pendingVehicles, totalVehicles, activeTradeRequests, totalUsers] =
        await Promise.all([
          // 待審核車輛
          safeCount('pendingVehicles', async () => {
            const result = await supabaseAdmin
              .from('vehicles')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending');
            return { count: result.count, error: result.error };
          }),

          // 上架中車輛 = approved
          safeCount('totalVehicles(approved)', async () => {
            const result = await supabaseAdmin
              .from('vehicles')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'approved');
            return { count: result.count, error: result.error };
          }),

          // 活躍調做需求
          safeCount('activeTradeRequests', async () => {
            const result = await supabaseAdmin
              .from('trade_requests')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'approved')
              .eq('is_active', true)
              .gt('expires_at', nowIso);
            return { count: result.count, error: result.error };
          }),

          // 會員總數 = active
          safeCount('totalUsers(active)', async () => {
            const result = await supabaseAdmin
              .from('users')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'active');
            return { count: result.count, error: result.error };
          }),
        ]);

      return success(res, {
        data: {
          pendingAuditCount: pendingVehicles,
          totalVehicles,
          activeTradeRequests,
          totalUsers,
        },
      });
    } catch (error) {
      console.error('[Dashboard] Stats error:', error);
      return errors.internal(res, '取得統計數據失敗');
    }
  })
);

export default router;
