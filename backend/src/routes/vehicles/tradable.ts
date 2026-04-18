/**
 * FaCai-B Platform - Vehicle Tradable Route
 * File: backend/src/routes/vehicles/tradable.ts
 *
 * 掛載於 /api/v1/vehicles/:vehicleId/tradable
 * 車主可切換自己車輛是否可盤 + 設定盤價
 */

import { Router, Request, Response } from 'express';
import { vehicleTradableService } from '../../services/vehicle-tradable.service';
import {
  authenticate,
  suspendedCheck,
  asyncHandler,
} from '../../middleware';
import { validate } from '../../utils/validation';
import { updateTradableSchema } from '../../utils/validation.v12';
import { success, errors } from '../../utils/response';
import { triggerNextRevalidation } from '../../utils/revalidateNext';

const router = Router({ mergeParams: true });

/**
 * PUT /api/v1/vehicles/:vehicleId/tradable
 */
router.put(
  '/',
  authenticate,
  suspendedCheck,
  validate(updateTradableSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId!;
    const userId = req.user!.id;

    const result = await vehicleTradableService.updateByOwner(
      vehicleId,
      userId,
      req.body
    );

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND')
        return errors.notFound(res, result.error.message);
      if (result.error?.code === 'FORBIDDEN')
        return errors.forbidden(res, result.error.message);
      return errors.internal(res, result.error?.message || '更新可盤狀態失敗');
    }

    // 盤車列表會因此變動
    await triggerNextRevalidation({
      path: ['/trade', `/find-car/${vehicleId}`, `/my-cars/${vehicleId}`],
      tag: ['vehicles', 'trades'],
    });

    return success(res, { data: result.data, message: '可盤狀態已更新' });
  })
);

export default router;
