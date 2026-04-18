/**
 * FaCai-B Platform - Admin Audit Routes
 * File: backend/src/routes/admin/audit.ts
 * 
 * 車輛審核 API 端點（Admin 專用）
 */

import { Router, Request, Response } from 'express';
import { auditService } from '../../services/audit.service';
import { asyncHandler } from '../../middleware';
import { 
  validate,
  validateUuidParam,
  auditListQuerySchema,
  rejectVehicleSchema,
  AuditListQuery,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/admin/audit - 待審核車輛列表
// ============================================================================

router.get(
  '/',
  validate(auditListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as Request & { validatedQuery: AuditListQuery }).validatedQuery || req.query;

    const result = await auditService.listPending(query as AuditListQuery);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得待審核列表失敗');
    }

    return success(res, {
      data: result.data!.vehicles,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
        total: result.data!.total,
      },
    });
  })
);

// ============================================================================
// GET /api/admin/audit/:id - 審核詳情
// ============================================================================

router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;

    const result = await auditService.getDetail(vehicleId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      return errors.internal(res, result.error?.message || '取得車輛詳情失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/admin/audit/:id/approve - 核准車輛
// ============================================================================

router.post(
  '/:id/approve',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const adminId = req.user!.id;

    const result = await auditService.approve(vehicleId, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '核准失敗');
    }

    return success(res, {
      data: result.data,
      message: '車輛已核准',
    });
  })
);

// ============================================================================
// POST /api/admin/audit/:id/reject - 拒絕車輛
// ============================================================================

router.post(
  '/:id/reject',
  validateUuidParam('id'),
  validate(rejectVehicleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const adminId = req.user!.id;
    const { rejection_reason } = req.body as { rejection_reason: string };

    const result = await auditService.reject(vehicleId, adminId, rejection_reason);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '拒絕失敗');
    }

    return success(res, {
      data: result.data,
      message: '車輛已拒絕',
    });
  })
);

export default router;
