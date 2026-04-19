/**
 * FaCai-B Platform - Admin Dashboard Routes
 * File: backend/src/routes/admin/dashboard.ts
 *
 * Admin 儀表板統計 API 端點
 *
 * [v12.2]
 *   - 儀表板總數改為抓取所有資料，避免只顯示 active / approved 造成數量偏少
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { asyncHandler } from '../../middleware';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/admin/dashboard/stats - 儀表板統計數據
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // 並行查詢所有統計數據
      const [
        { count: pendingVehicles },
        { count: totalVehicles },
        { count: activeTradeRequests },
        { count: totalUsers },
      ] = await Promise.all([
        // 待審核車輛
        supabaseAdmin
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // [v12.2] 車輛總數 = 所有車輛
        supabaseAdmin
          .from('vehicles')
          .select('id', { count: 'exact', head: true }),

        // 活躍調做需求
        supabaseAdmin
          .from('trade_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString()),

        // [v12.2] 會員總數 = 所有會員
        supabaseAdmin
          .from('users')
          .select('id', { count: 'exact', head: true }),
      ]);

      return success(res, {
        data: {
          pendingAuditCount: pendingVehicles ?? 0,
          totalVehicles: totalVehicles ?? 0,
          activeTradeRequests: activeTradeRequests ?? 0,
          totalUsers: totalUsers ?? 0,
        },
      });
    } catch (error) {
      console.error('[Dashboard] Stats error:', error);
      return errors.internal(res, '取得統計數據失敗');
    }
  })
);

export default router;
