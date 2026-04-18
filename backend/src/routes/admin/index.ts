/**
 * FaCai-B Platform - Admin Routes Index
 * File: backend/src/routes/admin/index.ts
 *
 * Admin 路由彙整
 *
 * [v12 新增]
 *   /admin/manual-vehicle-requests
 *   /admin/credits
 *   /admin/revenue
 *   /admin/vehicles-tradable
 *   /admin/business-cards
 */

import { Router } from 'express';
import auditRoutes from './audit';
import vehicleRoutes from './vehicles';
import dictionaryRoutes from './dictionary';
import userRoutes from './users';
import servicesRoutes from './services';
import shopRoutes from './shop';
import dashboardRoutes from './dashboard';
import tradesRoutes from './trades';
// v12 新增
import manualVehicleRequestRoutes from './manual-vehicle-requests';
import creditsRoutes from './credits';
import revenueRoutes from './revenue';
import vehiclesTradableRoutes from './vehicles-tradable';
import businessCardRoutes from './business-cards';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/audit', auditRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/dictionary', dictionaryRoutes);
router.use('/users', userRoutes);
router.use('/services', servicesRoutes);
router.use('/shop', shopRoutes);
router.use('/trades', tradesRoutes);

// [v12 新增] 代上傳申請、點數、營收、管理員取消可盤、名片
router.use('/manual-vehicle-requests', manualVehicleRequestRoutes);
router.use('/credits', creditsRoutes);
router.use('/revenue', revenueRoutes);
router.use('/vehicles-tradable', vehiclesTradableRoutes);
router.use('/business-cards', businessCardRoutes);

export default router;
