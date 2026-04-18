/**
 * FaCai-B Platform - Admin Vehicle Routes
 * File: backend/src/routes/admin/vehicles.ts
 * 
 * Admin 車輛管理 API 端點（審核、代客建檔等）
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { auditService } from '../../services/audit.service';
import { imageService } from '../../services/image.service';
import { supabaseAdmin } from '../../config/supabase';
import { asyncHandler, authenticate, suspendedCheck } from '../../middleware';
import { 
  validate,
  proxyCreateVehicleSchema,
  validateUuidParam,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';
import { triggerNextRevalidation } from '../../utils/revalidateNext';

// ============================================================================
// Multer Configuration
// ============================================================================

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支援的檔案格式: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // 最多 10 張
  },
});

// ============================================================================
// Router
// ============================================================================

const router = Router();

// ============================================================================
// GET /api/admin/vehicles/pending - 待審核車輛列表
// ============================================================================

router.get(
  '/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor as string | undefined;
    const sortOrder = req.query.sort_order === 'desc' ? 'desc' : 'asc';

    const result = await auditService.listPending({
      cursor,
      limit,
      status: 'pending',
      sort_order: sortOrder,
    });

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
// GET /api/admin/vehicles/:id/detail - 車輛審核詳情
// ============================================================================

router.get(
  '/:id/detail',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;

    const result = await auditService.getDetail(vehicleId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      return errors.internal(res, result.error?.message || '取得詳情失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/admin/vehicles/:id/approve - 核准車輛
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
// POST /api/admin/vehicles/:id/reject - 拒絕車輛
// ============================================================================

router.post(
  '/:id/reject',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const adminId = req.user!.id;
    const { rejection_reason } = req.body;

    if (!rejection_reason || typeof rejection_reason !== 'string' || !rejection_reason.trim()) {
      return errors.badRequest(res, '拒絕原因不能為空');
    }

    const result = await auditService.reject(vehicleId, adminId, rejection_reason.trim());

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
      message: '已拒絕車輛',
    });
  })
);

// ============================================================================
// POST /api/admin/vehicles/proxy - 代客建檔
// ============================================================================

router.post(
  '/proxy',
  validate(proxyCreateVehicleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const input = req.body;

    const result = await auditService.proxyCreate(input, adminId);

    if (!result.success) {
      if (result.error?.code === 'OWNER_NOT_FOUND') {
        return errors.badRequest(res, result.error.message, 'OWNER_NOT_FOUND');
      }
      if (result.error?.code === 'OWNER_SUSPENDED') {
        return errors.badRequest(res, result.error.message, 'OWNER_SUSPENDED');
      }
      if (result.error?.code === 'HIERARCHY_VIOLATION') {
        return errors.badRequest(res, result.error.message, 'HIERARCHY_VIOLATION');
      }
      return errors.internal(res, result.error?.message || '代客建檔失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '代客建檔成功，車輛已直接核准',
    });
  })
);

// ============================================================================
// POST /api/admin/vehicles/:id/images - 為已建立的車輛上傳圖片（代客建檔後上傳）
// ============================================================================

router.post(
  '/:id/images',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return errors.badRequest(res, '請選擇至少一張圖片', 'NO_FILES');
    }

    // 驗證車輛存在
    const vehicleResult = await auditService.getDetail(vehicleId);
    if (!vehicleResult.success) {
      return errors.notFound(res, '找不到該車輛');
    }

    // 處理每張圖片
    const uploadResults: Array<{
      success: boolean;
      url?: string;
      error?: string;
    }> = [];

    for (const file of files) {
      // 驗證檔案
      const validateResult = imageService.validateFile(file.mimetype, file.size);
      if (!validateResult.success) {
        uploadResults.push({
          success: false,
          error: validateResult.error?.message || '檔案驗證失敗',
        });
        continue;
      }

      // 上傳
      const uploadResult = await imageService.upload(
        vehicleId,
        file.buffer,
        file.originalname
      );

      if (!uploadResult.success) {
        uploadResults.push({
          success: false,
          error: uploadResult.error?.message || '上傳失敗',
        });
        continue;
      }

      uploadResults.push({
        success: true,
        url: uploadResult.data!.url,
      });
    }

    // 同步更新車輛的圖片列表
    await imageService.syncVehicleImages(vehicleId);

    const successCount = uploadResults.filter((r) => r.success).length;
    const failCount = uploadResults.filter((r) => !r.success).length;

    return success(res, {
      statusCode: 201,
      data: {
        results: uploadResults,
        summary: {
          total: files.length,
          success: successCount,
          failed: failCount,
        },
      },
      message: `成功上傳 ${successCount} 張圖片${failCount > 0 ? `，${failCount} 張失敗` : ''}`,
    });
  })
);

// ============================================================================
// DELETE /api/admin/vehicles/:id - 安全刪除（軟刪除：status -> archived）
// ============================================================================

router.delete(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('vehicles')
      .select('id, status')
      .eq('id', vehicleId)
      .single();

    if (fetchError || !existing) {
      console.error('[AdminVehicleRoute] Fetch vehicle for soft delete error:', fetchError);
      return errors.notFound(res, '找不到該車輛');
    }

    // 已經是 archived 視為冪等成功，避免重複操作造成前端異常
    if (existing.status === 'archived') {
      return success(res, {
        data: existing,
        message: '車輛已封存',
      });
    }

    const { data: archivedVehicle, error: updateError } = await supabaseAdmin
      .from('vehicles')
      .update({ status: 'archived' })
      .eq('id', vehicleId)
      .select()
      .single();

    if (updateError) {
      console.error('[AdminVehicleRoute] Soft delete error:', updateError);
      return errors.internal(res, '刪除車輛失敗');
    }
    await triggerNextRevalidation({
      path: ['/find-car', '/vehicles', '/dashboard', '/audit'],
      tag: ['vehicles'],
    });

    return success(res, {
      data: archivedVehicle,
      message: '車輛已成功刪除',
    });
  })
);

export default router;
