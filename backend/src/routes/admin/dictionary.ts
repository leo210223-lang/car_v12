/**
 * FaCai-B Platform - Admin Dictionary Routes
 * File: backend/src/routes/admin/dictionary.ts
 * 
 * 字典管理 API 端點（Admin 專用）
 */

import { Router, Request, Response } from 'express';
import { dictionaryService } from '../../services/dictionary.service';
import { asyncHandler } from '../../middleware';
import {
  validate,
  validateUuidParam,
  dictionaryRequestListQuerySchema,
  rejectDictionaryRequestSchema,
  createBrandSchema,
  createSpecSchema,
  createModelSchema,
  updateBrandSchema,
  updateSpecSchema,
  updateModelSchema,
  DictionaryRequestListQuery,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/admin/dictionary/requests - 所有字典申請
// ============================================================================

router.get(
  '/requests',
  validate(dictionaryRequestListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as Request & { validatedQuery: DictionaryRequestListQuery }).validatedQuery || req.query;

    const result = await dictionaryService.getAllRequests(query.status);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得字典申請列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/admin/dictionary/requests/:id/approve - 核准字典申請
// ============================================================================

router.post(
  '/requests/:id/approve',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = req.params.id!;
    const adminId = req.user!.id;

    const result = await dictionaryService.approveRequest(requestId, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該字典申請');
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      if (result.error?.code === 'MISSING_PARENT') {
        return errors.badRequest(res, result.error.message, 'MISSING_PARENT');
      }
      return errors.internal(res, result.error?.message || '核准字典申請失敗');
    }

    return success(res, {
      data: result.data,
      message: '字典申請已核准',
    });
  })
);

// ============================================================================
// POST /api/admin/dictionary/requests/:id/reject - 拒絕字典申請
// ============================================================================

router.post(
  '/requests/:id/reject',
  validateUuidParam('id'),
  validate(rejectDictionaryRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = req.params.id!;
    const adminId = req.user!.id;
    const { reason } = req.body;

    const result = await dictionaryService.rejectRequest(requestId, adminId, reason);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該字典申請');
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '拒絕字典申請失敗');
    }

    return success(res, {
      data: result.data,
      message: '字典申請已拒絕',
    });
  })
);

// ============================================================================
// Brands CRUD
// ============================================================================

// GET /api/admin/dictionary/brands - 品牌列表（含停用）
router.get(
  '/brands',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await dictionaryService.getBrands(true);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得品牌列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// POST /api/admin/dictionary/brands - 新增品牌
router.post(
  '/brands',
  validate(createBrandSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.createBrand(input, adminId);

    if (!result.success) {
      if (result.error?.code === 'DB_ERROR' && result.error.message.includes('duplicate')) {
        return errors.badRequest(res, '品牌名稱已存在', 'DUPLICATE_NAME');
      }
      return errors.internal(res, result.error?.message || '新增品牌失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '品牌已新增',
    });
  })
);

// PUT /api/admin/dictionary/brands/:id - 更新品牌
router.put(
  '/brands/:id',
  validateUuidParam('id'),
  validate(updateBrandSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.params.id!;
    const adminId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.updateBrand(brandId, input, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該品牌');
      }
      if (result.error?.code === 'DB_ERROR' && result.error.message.includes('duplicate')) {
        return errors.badRequest(res, '品牌名稱已存在', 'DUPLICATE_NAME');
      }
      return errors.internal(res, result.error?.message || '更新品牌失敗');
    }

    return success(res, {
      data: result.data,
      message: '品牌已更新',
    });
  })
);

// ============================================================================
// Specs CRUD
// ============================================================================

// GET /api/admin/dictionary/specs - 規格列表（含停用）
router.get(
  '/specs',
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.query.brand_id as string;

    if (!brandId) {
      return errors.badRequest(res, '必須提供 brand_id 參數', 'MISSING_BRAND_ID');
    }

    const result = await dictionaryService.getSpecs(brandId, true);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得規格列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// POST /api/admin/dictionary/specs - 新增規格
router.post(
  '/specs',
  validate(createSpecSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.createSpec(input, adminId);

    if (!result.success) {
      if (result.error?.code === 'DB_ERROR' && result.error.message.includes('duplicate')) {
        return errors.badRequest(res, '該品牌下已有同名規格', 'DUPLICATE_NAME');
      }
      return errors.internal(res, result.error?.message || '新增規格失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '規格已新增',
    });
  })
);

// PUT /api/admin/dictionary/specs/:id - 更新規格
router.put(
  '/specs/:id',
  validateUuidParam('id'),
  validate(updateSpecSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const specId = req.params.id!;
    const adminId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.updateSpec(specId, input, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該規格');
      }
      if (result.error?.code === 'DB_ERROR' && result.error.message.includes('duplicate')) {
        return errors.badRequest(res, '該品牌下已有同名規格', 'DUPLICATE_NAME');
      }
      return errors.internal(res, result.error?.message || '更新規格失敗');
    }

    return success(res, {
      data: result.data,
      message: '規格已更新',
    });
  })
);

// ============================================================================
// Models CRUD
// ============================================================================

// GET /api/admin/dictionary/models - 車型列表（含停用）
router.get(
  '/models',
  asyncHandler(async (req: Request, res: Response) => {
    const specId = req.query.spec_id as string;

    if (!specId) {
      return errors.badRequest(res, '必須提供 spec_id 參數', 'MISSING_SPEC_ID');
    }

    const result = await dictionaryService.getModels(specId, true);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得車型列表失敗');
    }

    return success(res, { data: result.data });
  })
);

// POST /api/admin/dictionary/models - 新增車型
router.post(
  '/models',
  validate(createModelSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.createModel(input, adminId);

    if (!result.success) {
      if (result.error?.code === 'DB_ERROR' && result.error.message.includes('duplicate')) {
        return errors.badRequest(res, '該規格下已有同名車型', 'DUPLICATE_NAME');
      }
      return errors.internal(res, result.error?.message || '新增車型失敗');
    }

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '車型已新增',
    });
  })
);

// PUT /api/admin/dictionary/models/:id - 更新車型
router.put(
  '/models/:id',
  validateUuidParam('id'),
  validate(updateModelSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const modelId = req.params.id!;
    const adminId = req.user!.id;
    const input = req.body;

    const result = await dictionaryService.updateModel(modelId, input, adminId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該車型');
      }
      if (result.error?.code === 'DB_ERROR' && result.error.message.includes('duplicate')) {
        return errors.badRequest(res, '該規格下已有同名車型', 'DUPLICATE_NAME');
      }
      return errors.internal(res, result.error?.message || '更新車型失敗');
    }

    return success(res, {
      data: result.data,
      message: '車型已更新',
    });
  })
);

export default router;
