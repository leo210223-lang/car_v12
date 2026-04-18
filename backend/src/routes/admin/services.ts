/**
 * FaCai-B Platform - Admin Services Routes
 * File: backend/src/routes/admin/services.ts
 * 
 * Admin 外部服務管理 API 端點
 */

import { Router, Request, Response } from 'express';
import { settingsService } from '../../services/settings.service';
import { asyncHandler } from '../../middleware';
import {
  validate,
  upsertAppSettingSchema,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';
import { triggerNextRevalidation } from '../../utils/revalidateNext';

const router = Router();
const ALLOWED_SETTINGS_KEYS = ['more_services', 'external_services'] as const;

// ============================================================================
// GET /api/admin/services - 取得所有外部服務設定
// ============================================================================

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');

    const result = await settingsService.getExternalServices();

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得服務設定失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// PUT /api/admin/services - 更新外部服務設定
// ============================================================================

router.put(
  '/',
  validate(upsertAppSettingSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { key, value } = req.body as { key: string; value: unknown };

    if (!ALLOWED_SETTINGS_KEYS.includes(key as (typeof ALLOWED_SETTINGS_KEYS)[number])) {
      return res.status(400).json({ error: 'Invalid setting key' });
    }

    const result = await settingsService.upsertAppSetting({ key, value });

    if (!result.success) {
      return errors.internal(res, result.error?.message || '更新服務設定失敗');
    }

    res.set('Cache-Control', 'no-store');
    await triggerNextRevalidation({
      path: ['/services', '/admin-services', '/settings/services'],
      tag: ['app_settings', 'more_services'],
    });

    return success(res, { 
      data: result.data?.value,
      message: '服務設定已更新',
    });
  })
);

export default router;
