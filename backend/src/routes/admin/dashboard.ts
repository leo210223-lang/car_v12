/**
 * FaCai-B Platform - Admin Dashboard Routes
 * File: backend/src/routes/admin/dashboard.ts
 *
 * Admin 儀表板統計 API 端點
 *
 * [v12.1]
 *   - 上架中車輛 = status='approved'
 *   - 會員總數 = status='active'
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

        // [v12.1] 上架中車輛 = approved
        supabaseAdmin
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),

        // 活躍調做需求
        supabaseAdmin
          .from('trade_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString()),

        // [v12.1] 會員總數 = 只算 active
        supabaseAdmin
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
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
