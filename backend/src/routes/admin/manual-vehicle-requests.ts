/**
 * FaCai-B Platform - Admin Manual Vehicle Requests Route
 * File: backend/src/routes/admin/manual-vehicle-requests.ts
 *
 * 掛載於 /api/v1/admin/manual-vehicle-requests
 *  - GET  /            列出所有申請
 *  - GET  /:id         查看單筆
 *  - POST /:id/approve 核准：依管理員指定的 brand/spec/model 建立真正的車輛
 *  - POST /:id/reject  拒絕
 */

import { Router, Request, Response } from 'express';
import { manualVehicleRequestService } from '../../services/manual-vehicle-request.service';
import { asyncHandler } from '../../middleware';
import { validate, validateUuidParam } from '../../utils/validation';
import {
  manualVehicleRequestListQuerySchema,
  approveManualVehicleRequestSchema,
  rejectManualVehicleRequestSchema,
} from '../../utils/validation.v12';
import { success, errors } from '../../utils/response';
import { triggerNextRevalidation } from '../../utils/revalidateNext';

const router = Router();

/**
 * GET /api/v1/admin/manual-vehicle-requests
 */
router.get(
  '/',
  validate(manualVehicleRequestListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const limit = query.limit ? Number(query.limit) : 20;
    const result = await manualVehicleRequestService.listAll({
      cursor: query.cursor,
      limit,
      status: query.status,
    });

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得申請列表失敗');
    }

    return success(res, {
      data: result.data!.requests,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
        total: result.data!.total,
      },
    });
  })
);

/**
 * GET /api/v1/admin/manual-vehicle-requests/:id
 */
router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const result = await manualVehicleRequestService.getById(id);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      return errors.internal(res, result.error?.message || '取得申請失敗');
    }

    return success(res, { data: result.data });
  })
);

/**
 * POST /api/v1/admin/manual-vehicle-requests/:id/approve
 */
router.post(
  '/:id/approve',
  validateUuidParam('id'),
  validate(approveManualVehicleRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const adminId = req.user!.id;

    const result = await manualVehicleRequestService.approve(id, adminId, req.body);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'INVALID_STATUS')
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      return errors.internal(res, result.error?.message || '核准失敗');
    }

    await triggerNextRevalidation({
      path: ['/find-car', '/my-cars', '/vehicles', '/audit'],
      tag: ['vehicles'],
    });

    return success(res, { data: result.data, message: '已核准並代建車輛' });
  })
);

/**
 * POST /api/v1/admin/manual-vehicle-requests/:id/reject
 */
router.post(
  '/:id/reject',
  validateUuidParam('id'),
  validate(rejectManualVehicleRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const adminId = req.user!.id;
    const reason = req.body.reason as string;

    const result = await manualVehicleRequestService.reject(id, adminId, reason);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'INVALID_STATUS')
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      return errors.internal(res, result.error?.message || '拒絕失敗');
    }

    return success(res, { data: result.data, message: '已拒絕申請' });
  })
);

export default router;
