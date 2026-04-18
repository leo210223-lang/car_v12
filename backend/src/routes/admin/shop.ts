/**
 * FaCai-B Platform - Admin Shop Routes
 * File: backend/src/routes/admin/shop.ts
 * 
 * Admin 商城商品管理 API 端點
 */

import { Router, Request, Response } from 'express';
import { shopService } from '../../services/shop.service';
import { asyncHandler } from '../../middleware';
import {
  validate,
  validateUuidParam,
  shopListQuerySchema,
  createShopProductSchema,
  updateShopProductSchema,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';
import { AuthenticatedUser, ShopProductCategory } from '../../types';

const router = Router();

// ============================================================================
// GET /api/admin/shop - 商品列表（Admin，含停用商品）
// ============================================================================

router.get(
  '/',
  validate(shopListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await shopService.list({
      cursor: query.cursor as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      category: query.category as ShopProductCategory | undefined,
      includeInactive: true, // Admin 可以看到所有商品
    });

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得商品列表失敗');
    }

    return success(res, {
      data: result.data!.products,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
        total: result.data!.total,
      },
    });
  })
);

// ============================================================================
// GET /api/admin/shop/:id - 商品詳情（Admin）
// ============================================================================

router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id!;

    const result = await shopService.getById(productId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該商品');
      }
      return errors.internal(res, result.error?.message || '取得商品失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/admin/shop - 新增商品
// ============================================================================

router.post(
  '/',
  validate(createShopProductSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthenticatedUser;
    const input = req.body;

    const result = await shopService.create(input, user.id);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '新增商品失敗');
    }

    return success(res, { 
      statusCode: 201,
      data: result.data,
      message: '商品已新增',
    });
  })
);

// ============================================================================
// PUT /api/admin/shop/:id - 更新商品
// ============================================================================

router.put(
  '/:id',
  validateUuidParam('id'),
  validate(updateShopProductSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthenticatedUser;
    const productId = req.params.id!;
    const input = req.body;

    const result = await shopService.update(productId, input, user.id);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該商品');
      }
      return errors.internal(res, result.error?.message || '更新商品失敗');
    }

    return success(res, { 
      data: result.data,
      message: '商品已更新',
    });
  })
);

// ============================================================================
// DELETE /api/admin/shop/:id - 刪除商品
// ============================================================================

router.delete(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthenticatedUser;
    const productId = req.params.id!;

    const result = await shopService.delete(productId, user.id);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return errors.notFound(res, '找不到該商品');
      }
      return errors.internal(res, result.error?.message || '刪除商品失敗');
    }

    return success(res, { message: '商品已刪除' });
  })
);

export default router;
