/**
 * FaCai-B Platform - Vehicle Image Upload Routes
 * File: backend/src/routes/vehicles/upload.ts
 * 
 * 車輛圖片上傳 API 端點
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { imageService } from '../../services/image.service';
import { vehicleService } from '../../services/vehicle.service';
import {
  authenticate,
  suspendedCheck,
  asyncHandler,
} from '../../middleware';
import { validateUuidParam } from '../../utils/validation';
import { success, errors } from '../../utils/response';

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
// POST /api/vehicles/:id/images - 上傳圖片
// ============================================================================

router.post(
  '/:id/images',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return errors.badRequest(res, '請選擇至少一張圖片', 'NO_FILES');
    }

    // 檢查車輛擁有權
    const vehicleResult = await vehicleService.getById(vehicleId, userId);
    if (!vehicleResult.success) {
      if (vehicleResult.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      return errors.internal(res, vehicleResult.error?.message || '取得車輛失敗');
    }

    if (vehicleResult.data!.owner_dealer_id !== userId) {
      return errors.forbidden(res, '您不是該車輛的擁有者');
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
// DELETE /api/vehicles/:id/images - 刪除圖片
// ============================================================================

router.delete(
  '/:id/images',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const userId = req.user!.id;
    const { paths } = req.body as { paths?: string[] };

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return errors.badRequest(res, '請提供要刪除的圖片路徑', 'NO_PATHS');
    }

    // 檢查車輛擁有權
    const vehicleResult = await vehicleService.getById(vehicleId, userId);
    if (!vehicleResult.success) {
      if (vehicleResult.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      return errors.internal(res, vehicleResult.error?.message || '取得車輛失敗');
    }

    if (vehicleResult.data!.owner_dealer_id !== userId) {
      return errors.forbidden(res, '您不是該車輛的擁有者');
    }

    // 驗證路徑是否屬於該車輛
    const invalidPaths = paths.filter((p) => !p.startsWith(`${vehicleId}/`));
    if (invalidPaths.length > 0) {
      return errors.badRequest(res, '包含不屬於該車輛的圖片路徑', 'INVALID_PATHS');
    }

    // 批次刪除
    const deleteResult = await imageService.deleteMany(paths);
    if (!deleteResult.success) {
      return errors.internal(res, deleteResult.error?.message || '刪除圖片失敗');
    }

    // 同步更新車輛的圖片列表
    await imageService.syncVehicleImages(vehicleId);

    return success(res, {
      data: deleteResult.data,
      message: `成功刪除 ${deleteResult.data!.deleted.length} 張圖片`,
    });
  })
);

// ============================================================================
// PUT /api/vehicles/:id/images/reorder - 重新排序圖片
// ============================================================================

router.put(
  '/:id/images/reorder',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;
    const userId = req.user!.id;
    const { images } = req.body as { images?: string[] };

    if (!images || !Array.isArray(images)) {
      return errors.badRequest(res, '請提供新的圖片順序', 'NO_IMAGES');
    }

    // 檢查車輛擁有權
    const vehicleResult = await vehicleService.getById(vehicleId, userId);
    if (!vehicleResult.success) {
      if (vehicleResult.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車輛');
      }
      return errors.internal(res, vehicleResult.error?.message || '取得車輛失敗');
    }

    if (vehicleResult.data!.owner_dealer_id !== userId) {
      return errors.forbidden(res, '您不是該車輛的擁有者');
    }

    // 更新 DB 中的圖片順序
    const { error } = await (await import('../../config/supabase')).supabaseAdmin
      .from('vehicles')
      .update({ images })
      .eq('id', vehicleId);

    if (error) {
      console.error('[VehicleUpload] Reorder error:', error);
      return errors.internal(res, '更新圖片順序失敗');
    }

    return success(res, {
      data: { images },
      message: '圖片順序已更新',
    });
  })
);

// ============================================================================
// GET /api/vehicles/:id/images - 取得車輛圖片列表
// ============================================================================

router.get(
  '/:id/images',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id!;

    const listResult = await imageService.listByVehicle(vehicleId);
    if (!listResult.success) {
      return errors.internal(res, listResult.error?.message || '取得圖片列表失敗');
    }

    // 轉換為公開 URL
    const { supabaseAdmin } = await import('../../config/supabase');
    const images = listResult.data!.map((path) => {
      const { data } = supabaseAdmin.storage
        .from('vehicle-images')
        .getPublicUrl(path);
      return {
        path,
        url: data.publicUrl,
      };
    });

    return success(res, { data: images });
  })
);

export default router;
