/**
 * FaCai-B Platform - Notification Routes
 * File: backend/src/routes/notifications/index.ts
 * 
 * 通知系統 API 端點
 */

import { Router, Request, Response } from 'express';
import { notificationService } from '../../services/notification.service';
import { 
  authenticate,
  asyncHandler,
} from '../../middleware';
import { 
  validate,
  validateUuidParam,
  notificationListQuerySchema,
  NotificationListQuery,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// 所有通知路由都需要認證
router.use(authenticate);

// ============================================================================
// GET /api/notifications - 通知列表
// ============================================================================

router.get(
  '/',
  validate(notificationListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = (req as Request & { validatedQuery: NotificationListQuery }).validatedQuery || req.query;

    const result = await notificationService.list(userId, query as NotificationListQuery);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得通知列表失敗');
    }

    return success(res, {
      data: result.data!.notifications,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
        total: result.data!.total,
      },
    });
  })
);

// ============================================================================
// GET /api/notifications/unread-count - 未讀數量
// ============================================================================

router.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await notificationService.getUnreadCount(userId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得未讀數量失敗');
    }

    return success(res, {
      data: result.data,
    });
  })
);

// ============================================================================
// PUT /api/notifications/read-all - 全部標記已讀
// ============================================================================

router.put(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await notificationService.markAllAsRead(userId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '批次標記已讀失敗');
    }

    return success(res, {
      data: result.data,
      message: `已將 ${result.data!.updated} 則通知標記為已讀`,
    });
  })
);

// ============================================================================
// GET /api/notifications/:id - 通知詳情（可選）
// ============================================================================

router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notificationId = req.params.id!;

    // 使用 list 查詢單一通知
    const { data, error } = await (await import('../../config/supabase')).supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return errors.notFound(res, '找不到該通知');
    }

    return success(res, { data });
  })
);

// ============================================================================
// PUT /api/notifications/:id/read - 標記單則已讀
// ============================================================================

router.put(
  '/:id/read',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notificationId = req.params.id!;

    const result = await notificationService.markAsRead(notificationId, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該通知');
      }
      if (result.error?.code === 'FORBIDDEN') {
        return errors.forbidden(res, result.error.message);
      }
      return errors.internal(res, result.error?.message || '標記已讀失敗');
    }

    return success(res, {
      data: result.data,
      message: '已標記為已讀',
    });
  })
);

// ============================================================================
// DELETE /api/notifications/:id - 刪除通知
// ============================================================================

router.delete(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notificationId = req.params.id!;

    const result = await notificationService.delete(notificationId, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該通知');
      }
      if (result.error?.code === 'FORBIDDEN') {
        return errors.forbidden(res, result.error.message);
      }
      return errors.internal(res, result.error?.message || '刪除通知失敗');
    }

    return success(res, {
      message: '通知已刪除',
    });
  })
);

export default router;
