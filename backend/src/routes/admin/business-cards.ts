/**
 * FaCai-B Platform - Admin Business Card Route
 * File: backend/src/routes/admin/business-cards.ts
 *
 * 掛載於 /api/v1/admin/business-cards
 *  - POST   /:userId  上傳（multipart/form-data，field=card）
 *  - DELETE /:userId  刪除
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { businessCardService } from '../../services/business-card.service';
import { asyncHandler } from '../../middleware';
import { validateUuidParam } from '../../utils/validation';
import { success, errors } from '../../utils/response';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`不支援的格式: ${file.mimetype}`));
  },
});

const router = Router();

/**
 * POST /api/v1/admin/business-cards/:userId
 */
router.post(
  '/:userId',
  validateUuidParam('userId'),
  upload.single('card'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId!;
    const file = req.file;

    if (!file) {
      return errors.badRequest(res, '請上傳一張名片圖片', 'NO_FILE');
    }

    const result = await businessCardService.upload(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      return errors.internal(res, result.error?.message || '上傳名片失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '名片已上傳',
    });
  })
);

/**
 * DELETE /api/v1/admin/business-cards/:userId
 */
router.delete(
  '/:userId',
  validateUuidParam('userId'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId!;
    const result = await businessCardService.remove(userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      return errors.internal(res, result.error?.message || '刪除名片失敗');
    }

    return success(res, { message: '名片已刪除' });
  })
);

export default router;
