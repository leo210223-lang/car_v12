/**
 * FaCai-B Platform - Services Routes
 * File: backend/src/routes/services/index.ts
 * 
 * 外部服務 API 端點（公開）
 */

import { Router, Request, Response } from 'express';
import { settingsService } from '../../services/settings.service';
import { asyncHandler } from '../../middleware';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/services - 取得外部服務列表
// ============================================================================

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');

    const result = await settingsService.getExternalServices();

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得服務列表失敗');
    }

    return success(res, { data: result.data });
  })
);

export default router;
