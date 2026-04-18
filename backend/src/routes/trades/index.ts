/**
 * FaCai-B Platform - Trade Routes
 * File: backend/src/routes/trades/index.ts
 * 
 * 盤車需求（調做）API 端點
 */

import { Router, Request, Response } from 'express';
import { tradeService } from '../../services/trade.service';
import { 
  authenticate, 
  optionalAuthenticate,
  suspendedCheck,
  asyncHandler,
} from '../../middleware';
import { 
  validate,
  validateUuidParam,
  createTradeRequestSchema,
  updateTradeRequestSchema,
  tradeListQuerySchema,
  extendTradeSchema,
  TradeListQuery,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/trades - 調做列表
// ============================================================================

router.get(
  '/',
  optionalAuthenticate,
  validate(tradeListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as Request & { validatedQuery: TradeListQuery }).validatedQuery || req.query;
    const userId = req.user?.id;

    const result = await tradeService.list(query as TradeListQuery, userId);

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

// ============================================================================
// GET /api/trades/my - 我的調做
// ============================================================================

router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query: TradeListQuery = {
      limit: Number(req.query.limit) || 20,
      cursor: req.query.cursor as string | undefined,
      my_only: true,
      is_active: req.query.is_active !== undefined 
        ? req.query.is_active === 'true' 
        : undefined,
    };

    const result = await tradeService.list(query, userId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得我的調做失敗');
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

// ============================================================================
// GET /api/trades/:id - 調做詳情
// ============================================================================

router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const tradeId = req.params.id!;

    const result = await tradeService.getById(tradeId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該調做需求');
      }
      return errors.internal(res, result.error?.message || '取得調做詳情失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/trades - 發布調做
// ============================================================================

router.post(
  '/',
  authenticate,
  suspendedCheck,
  validate(createTradeRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const input = req.body;

    const result = await tradeService.create(input, userId);

    if (!result.success) {
      if (result.error?.code === 'HIERARCHY_VIOLATION') {
        return errors.badRequest(res, result.error.message, 'HIERARCHY_VIOLATION');
      }
      return errors.internal(res, result.error?.message || '發布調做失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '調做需求已發布',
    });
  })
);

// ============================================================================
// PUT /api/trades/:id - 更新調做
// ============================================================================

router.put(
  '/:id',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  validate(updateTradeRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const tradeId = req.params.id!;
    const userId = req.user!.id;
    const input = req.body;

    const result = await tradeService.update(tradeId, input, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該調做需求');
      }
      if (result.error?.code === 'FORBIDDEN') {
        return errors.forbidden(res, result.error.message);
      }
      if (result.error?.code === 'HIERARCHY_VIOLATION') {
        return errors.badRequest(res, result.error.message, 'HIERARCHY_VIOLATION');
      }
      return errors.internal(res, result.error?.message || '更新調做失敗');
    }

    return success(res, {
      data: result.data,
      message: '調做需求已更新',
    });
  })
);

// ============================================================================
// PUT /api/trades/:id/extend - 續期調做
// ============================================================================

router.put(
  '/:id/extend',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  validate(extendTradeSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const tradeId = req.params.id!;
    const userId = req.user!.id;
    const { days } = req.body as { days: number };

    const result = await tradeService.extend(tradeId, userId, days);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該調做需求');
      }
      if (result.error?.code === 'FORBIDDEN') {
        return errors.forbidden(res, result.error.message);
      }
      return errors.internal(res, result.error?.message || '續期失敗');
    }

    return success(res, {
      data: result.data,
      message: `調做已續期 ${days} 天`,
    });
  })
);

// ============================================================================
// PUT /api/trades/:id/deactivate - 停用調做
// ============================================================================

router.put(
  '/:id/deactivate',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const tradeId = req.params.id!;
    const userId = req.user!.id;

    const result = await tradeService.deactivate(tradeId, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該調做需求');
      }
      if (result.error?.code === 'FORBIDDEN') {
        return errors.forbidden(res, result.error.message);
      }
      return errors.internal(res, result.error?.message || '停用失敗');
    }

    return success(res, {
      data: result.data,
      message: '調做已停用',
    });
  })
);

// ============================================================================
// DELETE /api/trades/:id - 永久刪除調做
// ============================================================================

router.delete(
  '/:id',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const tradeId = req.params.id!;
    const userId = req.user!.id;

    const result = await tradeService.delete(tradeId, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該調做需求');
      }
      if (result.error?.code === 'FORBIDDEN') {
        return errors.forbidden(res, result.error.message);
      }
      return errors.internal(res, result.error?.message || '刪除失敗');
    }

    return success(res, {
      message: '調做已永久刪除',
    });
  })
);

export default router;
