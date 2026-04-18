/**
 * FaCai-B Platform - Admin Authorization Middleware
 * File: backend/src/middleware/admin.ts
 * 
 * 檢查用戶是否具有 Admin 角色權限
 */

import { Request, Response, NextFunction } from 'express';
import { errors } from '../utils/response';

/**
 * Admin 權限檢查中間件
 * 非 Admin 回傳 403 Forbidden
 * 
 * 注意：此中間件必須在 authenticate 中間件之後使用
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 檢查是否已通過認證
  if (!req.user) {
    errors.unauthorized(res, '請先登入', 'NOT_AUTHENTICATED');
    return;
  }

  // 檢查角色
  if (req.user.role !== 'admin') {
    console.warn(
      `[Admin] Unauthorized access attempt by user ${req.user.id} (${req.user.email}) to ${req.method} ${req.originalUrl}`
    );
    errors.forbidden(res, '權限不足，需要管理員權限', 'ADMIN_REQUIRED');
    return;
  }

  next();
}

/**
 * 可選 Admin 權限檢查
 * 檢查是否為 Admin，但不阻止請求
 * 將結果設定到 req.isAdmin
 */
declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

export function checkAdminRole(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.isAdmin = req.user?.role === 'admin';
  next();
}

/**
 * 建立 Admin 路由保護中間件鏈
 */
export const adminOnly = requireAdmin;

export default requireAdmin;
