/**
 * FaCai-B Platform - Admin Revenue Route
 * File: backend/src/routes/admin/revenue.ts
 *
 * 掛載於 /api/v1/admin/revenue
 *  - GET / 查詢所有營收紀錄（可傳 owner_id 過濾）
 *  - POST /settle/:vehicleId 手動觸發結算某一台 archived 車（非必要，僅供偵錯/補救）
 */

import { Router, Request, Response } from 'express';
import { revenueService } from '../../services/revenue.service';
import { asyncHandler } from '../../middleware';
import { validateUuidParam } from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

/**
 * GET /api/v1/admin/revenue
 *   query: limit, cursor, owner_id
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = req.query.cursor as string | undefined;
    const ownerId = req.query.owner_id as string | undefined;

    const result = await revenueService.listAll(limit, cursor, ownerId);

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

/**
 * POST /api/v1/admin/revenue/settle/:vehicleId
 *  手動觸發結算（僅針對已是 archived 的車）
 */
router.post(
  '/settle/:vehicleId',
  validateUuidParam('vehicleId'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId!;
    const result = await revenueService.settle(vehicleId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'INVALID_STATUS')
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      return errors.internal(res, result.error?.message || '結算失敗');
    }

    return success(res, { data: result.data, message: '已結算並刪除車輛' });
  })
);

export default router;
