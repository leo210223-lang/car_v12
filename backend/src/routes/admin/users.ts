/**
 * FaCai-B Platform - Admin Users Routes
 * File: backend/src/routes/admin/users.ts
 * 
 * 會員管理 API 端點（Admin 專用）
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../config/supabase';
import { userService } from '../../services/user.service';
import { asyncHandler } from '../../middleware';
import {
  validate,
  validateUuidParam,
  userListQuerySchema,
  rejectUserSchema,
  suspendUserSchema,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/admin/users - 會員列表
// ============================================================================

router.get(
  '/',
  validate(userListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const query = req.query;

    const result = await userService.list({
      cursor: query.cursor as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      status: query.status as 'active' | 'suspended' | 'pending' | 'rejected' | undefined,
      status_group: query.status_group as 'suspended_rejected' | undefined,
      search: query.search as string | undefined,
    });

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得會員列表失敗');
    }

    return success(res, {
      data: result.data!.users,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
        total: result.data!.total,
      },
    });
  })
);


// ============================================================================
// GET /api/admin/users/stats - 會員統計
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: pendingUsers },
      { count: suspendedUsers },
      { count: rejectedUsers },
      { count: totalVehicles },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabaseAdmin.from('vehicles').select('id', { count: 'exact', head: true }),
    ]);

    return success(res, {
      data: {
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        pendingUsers: pendingUsers ?? 0,
        suspendedUsers: suspendedUsers ?? 0,
        rejectedUsers: rejectedUsers ?? 0,
        totalVehicles: totalVehicles ?? 0,
      },
    });
  })
);

// ============================================================================
// GET /api/admin/users/:id - 會員詳情
// ============================================================================

router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const userId = req.params.id!;

    const result = await userService.getById(userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該會員');
      }
      return errors.internal(res, result.error?.message || '取得會員詳情失敗');
    }

    // 取得會員的車輛與調做列表
    const [vehiclesResult, tradesResult] = await Promise.all([
      userService.getUserVehicles(userId),
      userService.getUserTrades(userId),
    ]);

    return success(res, {
      data: {
        ...result.data,
        recent_vehicles: vehiclesResult.success ? vehiclesResult.data : [],
        recent_trades: tradesResult.success ? tradesResult.data : [],
      },
    });
  })
);

// ============================================================================
// PUT /api/admin/users/:id/approve - 核准待審核會員
// ============================================================================

router.put(
  '/:id/approve',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const adminId = req.user!.id;

    const result = await userService.approve(userId, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該會員');
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '核准會員失敗');
    }

    return success(res, {
      data: result.data,
      message: '會員已核准',
    });
  })
);

// ============================================================================
// PUT /api/admin/users/:id/reject - 退件待審核會員
// ============================================================================

router.put(
  '/:id/reject',
  validateUuidParam('id'),
  validate(rejectUserSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const adminId = req.user!.id;
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : undefined;

    const result = await userService.reject(userId, adminId, reason);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該會員');
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '退件會員失敗');
    }

    return success(res, {
      data: result.data,
      message: '會員已退件',
    });
  })
);

// ============================================================================
// PUT /api/admin/users/:id/suspend - 停權會員
// ============================================================================

router.put(
  '/:id/suspend',
  validateUuidParam('id'),
  validate(suspendUserSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const adminId = req.user!.id;
    const { reason } = req.body;

    // 不能停權自己
    if (userId === adminId) {
      return errors.badRequest(res, '不能停權自己', 'CANNOT_SUSPEND_SELF');
    }

    const result = await userService.suspend(userId, adminId, { reason });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該會員');
      }
      if (result.error?.code === 'ALREADY_SUSPENDED') {
        return errors.badRequest(res, result.error.message, 'ALREADY_SUSPENDED');
      }
      return errors.internal(res, result.error?.message || '停權會員失敗');
    }

    return success(res, {
      data: result.data,
      message: '會員已停權',
    });
  })
);

// ============================================================================
// PUT /api/admin/users/:id/reactivate - 解除停權
// ============================================================================

router.put(
  '/:id/reactivate',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const adminId = req.user!.id;

    const result = await userService.reactivate(userId, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該會員');
      }
      if (result.error?.code === 'NOT_SUSPENDED') {
        return errors.badRequest(res, result.error.message, 'NOT_SUSPENDED');
      }
      return errors.internal(res, result.error?.message || '解除停權失敗');
    }

    return success(res, {
      data: result.data,
      message: '會員已解除停權',
    });
  })
);

// ============================================================================
// DELETE /api/admin/users/:id - 永久刪除會員（Hard Delete）
// ============================================================================

router.delete(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const adminId = req.user!.id;

    if (userId === adminId) {
      return errors.badRequest(res, '不能刪除自己的帳號', 'CANNOT_DELETE_SELF');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return errors.internal(res, 'Supabase 管理端設定缺失');
    }

    const adminAuthClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      const { error } = await adminAuthClient.auth.admin.deleteUser(userId);
      if (error) {
        if (error.message?.toLowerCase().includes('not found')) {
          return errors.notFound(res, '找不到該會員');
        }
        console.error('[AdminUsersRoute] Hard delete user error:', error);
        return errors.internal(res, '刪除會員失敗');
      }
    } catch (err) {
      console.error('[AdminUsersRoute] Hard delete user exception:', err);
      return errors.internal(res, '刪除會員失敗');
    }

    return success(res, {
      message: '會員已永久刪除',
      data: { id: userId },
    });
  })
);

// ============================================================================
// GET /api/admin/users/:id/vehicles - 會員的車輛列表
// ============================================================================

router.get(
  '/:id/vehicles',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await userService.getUserVehicles(userId, limit);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得會員車輛失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// GET /api/admin/users/:id/trades - 會員的調做列表
// ============================================================================

router.get(
  '/:id/trades',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id!;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await userService.getUserTrades(userId, limit);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得會員調做失敗');
    }

    return success(res, { data: result.data });
  })
);

export default router;
