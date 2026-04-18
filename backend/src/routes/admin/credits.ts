/**
 * FaCai-B Platform - Admin Credits Route
 * File: backend/src/routes/admin/credits.ts
 *
 * 掛載於 /api/v1/admin/credits
 *  - GET  /:userId            查看某會員的點數
 *  - PUT  /:userId            管理員直接設定某會員的點數
 */

import { Router, Request, Response } from 'express';
import { creditsService } from '../../services/credits.service';
import { asyncHandler } from '../../middleware';
import { validate, validateUuidParam } from '../../utils/validation';
import { adjustCreditsSchema } from '../../utils/validation.v12';
import { success, errors } from '../../utils/response';

const router = Router();

/**
 * GET /api/v1/admin/credits/:userId
 */
router.get(
  '/:userId',
  validateUuidParam('userId'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId!;
    const result = await creditsService.get(userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      return errors.internal(res, result.error?.message || '取得點數失敗');
    }

    return success(res, { data: result.data });
  })
);

/**
 * PUT /api/v1/admin/credits/:userId
 *   body: { credits: number }
 */
router.put(
  '/:userId',
  validateUuidParam('userId'),
  validate(adjustCreditsSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId!;
    const adminId = req.user!.id;
    const { credits } = req.body;

    const result = await creditsService.setByAdmin(userId, adminId, credits);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'INVALID_VALUE')
        return errors.badRequest(res, result.error.message, 'INVALID_VALUE');
      return errors.internal(res, result.error?.message || '調整點數失敗');
    }

    return success(res, { data: result.data, message: '點數已更新' });
  })
);

export default router;
