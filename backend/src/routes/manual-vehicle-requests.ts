/**
 * FaCai-B Platform - Manual Vehicle Request Route
 * File: backend/src/routes/manual-vehicle-requests.ts
 *
 * 掛載於 /api/v1/manual-vehicle-requests
 *  - POST /            建立申請（會員）
 *  - GET  /mine        查詢自己的申請（會員）
 */

import { Router, Request, Response } from 'express';
import { manualVehicleRequestService } from '../services/manual-vehicle-request.service';
import { authenticate, suspendedCheck, asyncHandler } from '../middleware';
import { validate } from '../utils/validation';
import { createManualVehicleRequestSchema } from '../utils/validation.v12';
import { success, errors } from '../utils/response';

const router = Router();

/**
 * POST /api/v1/manual-vehicle-requests
 */
router.post(
  '/',
  authenticate,
  suspendedCheck,
  validate(createManualVehicleRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await manualVehicleRequestService.create(userId, req.body);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '送出申請失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '已送出申請，管理員審核後將通知您',
    });
  })
);

/**
 * GET /api/v1/manual-vehicle-requests/mine
 */
router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 20;
    const result = await manualVehicleRequestService.listMine(userId, limit);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得申請失敗');
    }

    return success(res, { data: result.data });
  })
);

export default router;
