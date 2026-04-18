/**
 * FaCai-B Platform - API Routes
 * File: backend/src/routes/index.ts
 *
 * 匯出所有 API 路由
 *
 * [v12 新增] /api/v1/manual-vehicle-requests
 */

import { Router, Request, Response } from 'express';
import healthRoutes from './health';
import vehicleRoutes from './vehicles';
import tradeRoutes from './trades';
import notificationRoutes from './notifications';
import dictionaryRoutes from './dictionary';
import servicesRoutes from './services';
import shopRoutes from './shop';
import adminRoutes from './admin';
import userRoutes from './users';
// v12 新增
import manualVehicleRequestRoutes from './manual-vehicle-requests';
import {
  authenticate,
  requireAdmin,
  apiRateLimit,
  globalErrorHandler,
  notFoundHandler,
} from '../middleware';

export function createRoutes(): Router {
  const router = Router();

  router.use(apiRateLimit);

  // Health check routes (公開)
  router.use('/health', healthRoutes);

  // API v1 路由
  const v1Router = Router();

  v1Router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        api: 'FaCai-B Platform API',
        version: 'v1',
        status: 'operational',
      },
    });
  });

  v1Router.use('/vehicles', vehicleRoutes);
  v1Router.use('/trades', tradeRoutes);
  v1Router.use('/notifications', notificationRoutes);
  v1Router.use('/dictionary', dictionaryRoutes);
  v1Router.use('/services', authenticate, servicesRoutes);
  v1Router.use('/shop', authenticate, shopRoutes);
  v1Router.use('/users', authenticate, userRoutes);

  // [v12 新增] 找不到車輛→代上傳（需認證，認證在 router 內做）
  v1Router.use('/manual-vehicle-requests', manualVehicleRequestRoutes);

  // Admin 路由 (需要認證 + Admin 權限)
  const adminRouter = Router();
  adminRouter.use(authenticate);
  adminRouter.use(requireAdmin);
  adminRouter.use('/', adminRoutes);

  v1Router.use('/admin', adminRouter);
  router.use('/v1', v1Router);

  router.use(notFoundHandler);
  router.use(globalErrorHandler);

  return router;
}

export default createRoutes;
