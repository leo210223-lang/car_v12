/**
 * FaCai-B Platform - Admin Trade Review Routes
 * File: backend/src/routes/admin/trades.ts
 */

import { Router, Request, Response } from 'express';
import { tradeService } from '../../services/trade.service';
import { asyncHandler } from '../../middleware';
import { validate, validateUuidParam, tradeListQuerySchema, reviewTradeSchema, TradeListQuery } from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// GET /api/admin/trades - 調做審核列表
router.get(
  '/',
  validate(tradeListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as Request & { validatedQuery: TradeListQuery }).validatedQuery || req.query;
    const result = await tradeService.list(query as TradeListQuery);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得調做列表失敗');
    }

    return success(res, {
      data: result.data!.trades,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
        total: result.data!.total,
      },
    });
  })
);

// PUT /api/admin/trades/:id/review - 審核調做
router.put(
  '/:id/review',
  validateUuidParam('id'),
  validate(reviewTradeSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const tradeId = req.params.id!;
    const { status } = req.body as { status: 'approved' | 'rejected' };

    const result = await tradeService.review(tradeId, status);
    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該調做需求');
      }
      return errors.internal(res, result.error?.message || '審核調做失敗');
    }

    return success(res, {
      data: result.data,
      message: `調做需求已${status === 'approved' ? '核准' : '拒絕'}`,
    });
  })
);

export default router;
