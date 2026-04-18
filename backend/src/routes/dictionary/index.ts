/**
 * FaCai-B Platform - Dictionary Routes
 * File: backend/src/routes/dictionary/index.ts
 * 
 * 字典檔（品牌/規格/車型）公開 API
 */

import { Router, Request, Response } from 'express';
import { dictionaryService } from '../../services/dictionary.service';
import { 
  authenticate, 
  suspendedCheck,
  asyncHandler,
} from '../../middleware';
import { 
  validate,
  dictionaryRequestSchema,
  specsQuerySchema,
  modelsQuerySchema,
  type SpecsQuery,
  type ModelsQuery,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/dictionary/brands - 品牌列表
// ============================================================================

router.get(
  '/brands',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await dictionaryService.getBrands();

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得品牌列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// GET /api/dictionary/specs - 規格列表（依品牌篩選）
// ============================================================================

router.get(
  '/specs',
  validate(specsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { brand_id: brandId } = (req as Request & { validatedQuery: SpecsQuery }).validatedQuery;

    const result = await dictionaryService.getSpecs(brandId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得規格列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// GET /api/dictionary/models - 車型列表（依規格篩選）
// ============================================================================

router.get(
  '/models',
  validate(modelsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { spec_id: specId } = (req as Request & { validatedQuery: ModelsQuery }).validatedQuery;

    const result = await dictionaryService.getModels(specId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得車型列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/dictionary/requests - 字典申請
// ============================================================================

router.post(
  '/requests',
  authenticate,
  suspendedCheck,
  validate(dictionaryRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.createRequest(input, userId);

    if (!result.success) {
      if (result.error?.code === 'PARENT_NOT_FOUND') {
        return errors.badRequest(res, result.error.message, 'PARENT_NOT_FOUND');
      }
      return errors.internal(res, result.error?.message || '建立字典申請失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '字典申請已提交，等待審核',
    });
  })
);

// ============================================================================
// GET /api/dictionary/requests/my - 我的字典申請
// ============================================================================

router.get(
  '/requests/my',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await dictionaryService.getMyRequests(userId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得字典申請失敗');
    }

    return success(res, { data: result.data });
  })
);

export default router;
