/**
 * FaCai-B Platform - Admin Vehicle Tradable Route
 * File: backend/src/routes/admin/vehicles-tradable.ts
 *
 * 掛載於 /api/v1/admin/vehicles-tradable
 *  - POST /:vehicleId/cancel  管理員取消某台車的可盤狀態
 */

import { Router, Request, Response } from 'express';
import { vehicleTradableService } from '../../services/vehicle-tradable.service';
import { asyncHandler } from '../../middleware';
import { validateUuidParam } from '../../utils/validation';
import { success, errors } from '../../utils/response';
import { triggerNextRevalidation } from '../../utils/revalidateNext';

const router = Router();

/**
 * POST /api/v1/admin/vehicles-tradable/:vehicleId/cancel
 */
router.post(
  '/:vehicleId/cancel',
  validateUuidParam('vehicleId'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId!;
    const adminId = req.user!.id;

    const result = await vehicleTradableService.cancelByAdmin(vehicleId, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'NOT_TRADABLE')
        return errors.badRequest(res, result.error.message, 'NOT_TRADABLE');
      return errors.internal(res, result.error?.message || '取消可盤失敗');
    }

    await triggerNextRevalidation({
      path: ['/trade', '/find-car', `/find-car/${vehicleId}`, `/my-cars/${vehicleId}`],
      tag: ['vehicles', 'trades'],
    });

    return success(res, { data: result.data, message: '已取消該車可盤狀態' });
  })
);

export default router;
