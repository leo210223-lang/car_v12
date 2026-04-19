/**
 * FaCai-B Platform - Revenue Route (dealer-facing)
 * File: backend/src/routes/revenue.ts
 *
 * 車行用的營收路由
 * 掛載於 /api/v1/revenue
 *   - GET /mine        查自己的營收（分頁 + 摘要）
 *
 * [v12.1] 新增
 */

import { Router, Request, Response } from 'express';
import { revenueService } from '../services/revenue.service';
import { authenticate, asyncHandler } from '../middleware';
import { success, errors } from '../utils/response';

const router = Router();

/**
 * GET /api/v1/revenue/mine
 *   ?limit=20&cursor=xxx
 */
router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 20;
    const cursor = (req.query.cursor as string) || undefined;

    const result = await revenueService.listByOwner(userId, limit, cursor);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得營收紀錄失敗');
    }

    return success(res, {
      data: {
        records: result.data!.records,
        summary: result.data!.summary,
      },
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
      },
    });
  })
);

export default router;
