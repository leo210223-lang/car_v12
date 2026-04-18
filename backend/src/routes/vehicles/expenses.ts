/**
 * FaCai-B Platform - Vehicle Expenses Route
 * File: backend/src/routes/vehicles/expenses.ts
 *
 * 掛載於 /api/v1/vehicles/:vehicleId/expenses
 * 全部需要登入 + 僅車輛擁有者能操作（在 service 內檢查）
 */

import { Router, Request, Response } from 'express';
import { vehicleExpenseService } from '../../services/vehicle-expense.service';
import {
  authenticate,
  suspendedCheck,
  asyncHandler,
} from '../../middleware';
import { validate, validateUuidParam } from '../../utils/validation';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from '../../utils/validation.v12';
import { success, errors } from '../../utils/response';

// mergeParams: true 才能抓到父層的 :vehicleId
const router = Router({ mergeParams: true });

/**
 * GET /api/v1/vehicles/:vehicleId/expenses
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId!;
    const userId = req.user!.id;

    const result = await vehicleExpenseService.listByVehicle(vehicleId, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'FORBIDDEN') return errors.forbidden(res, result.error.message);
      return errors.internal(res, result.error?.message || '取得整備費細項失敗');
    }

    return success(res, { data: result.data });
  })
);

/**
 * POST /api/v1/vehicles/:vehicleId/expenses
 */
router.post(
  '/',
  authenticate,
  suspendedCheck,
  validate(createExpenseSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId!;
    const userId = req.user!.id;

    const result = await vehicleExpenseService.create(vehicleId, userId, req.body);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'FORBIDDEN') return errors.forbidden(res, result.error.message);
      return errors.internal(res, result.error?.message || '新增整備費細項失敗');
    }

    return success(res, { statusCode: 201, data: result.data, message: '細項已新增' });
  })
);

/**
 * PUT /api/v1/vehicles/:vehicleId/expenses/:expenseId
 */
router.put(
  '/:expenseId',
  authenticate,
  suspendedCheck,
  validateUuidParam('expenseId'),
  validate(updateExpenseSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const expenseId = req.params.expenseId!;

    const result = await vehicleExpenseService.update(expenseId, userId, req.body);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'FORBIDDEN') return errors.forbidden(res, result.error.message);
      if (result.error?.code === 'EMPTY_PAYLOAD')
        return errors.badRequest(res, result.error.message, 'EMPTY_PAYLOAD');
      return errors.internal(res, result.error?.message || '更新細項失敗');
    }

    return success(res, { data: result.data, message: '細項已更新' });
  })
);

/**
 * DELETE /api/v1/vehicles/:vehicleId/expenses/:expenseId
 */
router.delete(
  '/:expenseId',
  authenticate,
  suspendedCheck,
  validateUuidParam('expenseId'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const expenseId = req.params.expenseId!;

    const result = await vehicleExpenseService.delete(expenseId, userId);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') return errors.notFound(res, result.error.message);
      if (result.error?.code === 'FORBIDDEN') return errors.forbidden(res, result.error.message);
      return errors.internal(res, result.error?.message || '刪除細項失敗');
    }

    return success(res, { message: '細項已刪除' });
  })
);

export default router;
