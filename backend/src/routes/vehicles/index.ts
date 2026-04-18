/**
 * FaCai-B Platform - Vehicle Routes
 * File: backend/src/routes/vehicles/index.ts
 *
 * 車輛 CRUD API 端點
 *
 * [v12 變更]
 *   - 新增掛載：/vehicles/:vehicleId/expenses
 *   - 新增掛載：/vehicles/:vehicleId/tradable
 *   - /vehicles 列表支援 tradable_only 篩選（提供 "盤車頁面看所有可盤車" 使用）
 */

import { Router, Request, Response } from 'express';
import { vehicleService } from '../../services/vehicle.service';
import {
  authenticate,
  optionalAuthenticate,
  suspendedCheck,
  asyncHandler,
} from '../../middleware';
import {
  validate,
  validateUuidParam,
  createVehicleSchema,
  updateVehicleSchema,
  vehicleListQuerySchema,
  vehicleSearchQuerySchema,
  VehicleListQuery,
} from '../../utils/validation';
import { success, errors, vehicleErrors } from '../../utils/response';
import { triggerNextRevalidation } from '../../utils/revalidateNext';
import uploadRoutes from './upload';
import expensesRoutes from './expenses';
import tradableRoutes from './tradable';

const router = Router();

// 圖片上傳
router.use('/', uploadRoutes);

// [v12] 子路由：整備費細項 + 可盤切換
router.use('/:vehicleId/expenses', expensesRoutes);
router.use('/:vehicleId/tradable', tradableRoutes);

// ============================================================================
// GET /api/vehicles - 車輛列表
// ============================================================================

router.get(
  '/',
  optionalAuthenticate,
  validate(vehicleListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as Request & { validatedQuery: VehicleListQuery }).validatedQuery || req.query;
    const userId = req.user?.id;

    const result = await vehicleService.list(query as VehicleListQuery, userId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得車輛列表失敗');
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
// GET /api/vehicles/search - 模糊搜尋
// ============================================================================

router.get(
  '/search',
  validate(vehicleSearchQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor as string | undefined;

    const result = await vehicleService.search(q, limit, cursor);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '搜尋失敗');
    }

    return success(res, {
      data: result.data!.vehicles,
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
      },
    });
  })
);

// ============================================================================
// GET /api/vehicles/my - 我的車輛
// ============================================================================

router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query: VehicleListQuery = {
      limit: Number(req.query.limit) || 20,
      cursor: req.query.cursor as string | undefined,
      status: req.query.status as VehicleListQuery['status'],
      owner_only: true,
    };

    const result = await vehicleService.list(query, userId);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得我的車輛失敗');
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
// GET /api/vehicles/:id - 車輛詳情
// ============================================================================

router.get(
  '/:id',
  optionalAuthenticate,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const userId = req.user?.id;

    const result = await vehicleService.getById(id, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return vehicleErrors.notFound(res);
      }
      return errors.internal(res, result.error?.message || '取得車輛詳情失敗');
    }

    return success(res, { data: result.data });
  })
);

// ============================================================================
// POST /api/vehicles - 新增車輛
// ============================================================================

router.post(
  '/',
  authenticate,
  suspendedCheck,
  validate(createVehicleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const input = req.body;

    const result = await vehicleService.create(input, userId);

    if (!result.success) {
      if (result.error?.code === 'HIERARCHY_VIOLATION') {
        return errors.badRequest(res, result.error.message, 'HIERARCHY_VIOLATION');
      }
      return errors.internal(res, result.error?.message || '新增車輛失敗');
    }

    await triggerNextRevalidation({
      path: ['/find-car', '/my-cars', '/vehicles'],
      tag: ['vehicles'],
    });

    return success(res, {
      statusCode: 201,
      data: result.data,
      message: '車輛已建立，等待審核',
    });
  })
);

// ============================================================================
// PUT /api/vehicles/:id - 更新車輛
// ============================================================================

router.put(
  '/:id',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  validate(updateVehicleSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const userId = req.user!.id;
    const input = req.body;

    const result = await vehicleService.update(id, input, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return vehicleErrors.notFound(res);
      }
      if (result.error?.code === 'FORBIDDEN') {
        return vehicleErrors.notOwner(res);
      }
      return errors.internal(res, result.error?.message || '更新車輛失敗');
    }
    await triggerNextRevalidation({
      path: ['/find-car', '/my-cars', '/vehicles', `/find-car/${id}`, `/my-cars/${id}`, `/vehicles/${id}`],
      tag: ['vehicles'],
    });

    return success(res, {
      data: result.data,
      message: '車輛已更新',
    });
  })
);

// ============================================================================
// PUT /api/vehicles/:id/archive - 下架車輛
// ============================================================================

router.put(
  '/:id/archive',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const userId = req.user!.id;

    const result = await vehicleService.archive(id, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return vehicleErrors.notFound(res);
      }
      if (result.error?.code === 'FORBIDDEN') {
        return vehicleErrors.notOwner(res);
      }
      if (result.error?.code === 'ALREADY_ARCHIVED') {
        return errors.badRequest(res, result.error.message, 'ALREADY_ARCHIVED');
      }
      return errors.internal(res, result.error?.message || '下架失敗');
    }
    await triggerNextRevalidation({
      path: ['/find-car', '/my-cars', '/vehicles', `/find-car/${id}`, `/my-cars/${id}`, `/vehicles/${id}`],
      tag: ['vehicles'],
    });

    return success(res, {
      data: result.data,
      message: '車輛已下架',
    });
  })
);

// ============================================================================
// PUT /api/vehicles/:id/resubmit - 重新送審
// ============================================================================

router.put(
  '/:id/resubmit',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const userId = req.user!.id;

    const result = await vehicleService.resubmit(id, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return vehicleErrors.notFound(res);
      }
      if (result.error?.code === 'FORBIDDEN') {
        return vehicleErrors.notOwner(res);
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '重新送審失敗');
    }
    await triggerNextRevalidation({
      path: ['/find-car', '/my-cars', '/vehicles', `/find-car/${id}`, `/my-cars/${id}`, `/vehicles/${id}`],
      tag: ['vehicles'],
    });

    return success(res, {
      data: result.data,
      message: '已重新送審，等待審核',
    });
  })
);

// ============================================================================
// DELETE /api/vehicles/:id - 永久刪除
// ============================================================================

router.delete(
  '/:id',
  authenticate,
  suspendedCheck,
  validateUuidParam('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id!;
    const userId = req.user!.id;

    const result = await vehicleService.delete(id, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return vehicleErrors.notFound(res);
      }
      if (result.error?.code === 'FORBIDDEN') {
        return vehicleErrors.notOwner(res);
      }
      if (result.error?.code === 'INVALID_STATUS') {
        return errors.badRequest(res, result.error.message, 'INVALID_STATUS');
      }
      return errors.internal(res, result.error?.message || '刪除失敗');
    }
    await triggerNextRevalidation({
      path: ['/find-car', '/my-cars', '/vehicles', `/find-car/${id}`, `/my-cars/${id}`, `/vehicles/${id}`],
      tag: ['vehicles'],
    });

    return success(res, {
      statusCode: 200,
      message: '車輛已永久刪除',
    });
  })
);

export default router;
