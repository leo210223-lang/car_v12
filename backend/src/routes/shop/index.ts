/**
 * FaCai-B Platform - Shop Routes
 * File: backend/src/routes/shop/index.ts
 * 
 * 商城商品 API 端點（公開）
 */

import { Router, Request, Response } from 'express';
import { shopService } from '../../services/shop.service';
import { asyncHandler } from '../../middleware';
import {
  validate,
  validateUuidParam,
  shopListQuerySchema,
} from '../../utils/validation';
import { success, errors } from '../../utils/response';

const router = Router();

// ============================================================================
// GET /api/shop - 商品列表（公開）
// ============================================================================

router.get(
  '/',
  validate(shopListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await shopService.list({
      cursor: query.cursor as string | undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      category: query.category as 'car_wash' | 'android_device' | 'other' | undefined,
      includeInactive: false, // 公開 API 只顯示啟用的商品
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
// GET /api/shop/:id - 商品詳情（公開）
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

    // 確保只能查看啟用的商品
    if (!result.data!.is_active) {
      return errors.notFound(res, '找不到該商品');
    }

    return success(res, { data: result.data });
  })
);

export default router;
