/**
 * FaCai-B Platform - Suspended Account Check Middleware
 * File: backend/src/middleware/suspendedCheck.ts
 * 
 * 🔒 ANALYZE-01 安全性修補
 * 檢查用戶帳號是否被停權，停權帳號的 POST/PUT/DELETE 操作會被拒絕
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { errors, accountErrors } from '../utils/response';

/**
 * 擴展 Request 介面以包含帳號狀態
 */
declare global {
  namespace Express {
    interface Request {
      userStatus?: 'active' | 'suspended';
      isSuspended?: boolean;
    }
  }
}

/**
 * 檢查用戶帳號狀態並設定到 request
 * 此中間件僅檢查狀態，不阻止請求
 */
export async function checkAccountStatus(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // 未認證用戶跳過檢查
  if (!req.user) {
    next();
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('status')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('[SuspendedCheck] Failed to check user status:', error.message);
      // 查詢失敗時，為安全起見假設帳號正常
      req.userStatus = 'active';
      req.isSuspended = false;
      next();
      return;
    }

    req.userStatus = data.status;
    req.isSuspended = data.status === 'suspended';
    
    next();
  } catch (err) {
    console.error('[SuspendedCheck] Error:', err);
    req.userStatus = 'active';
    req.isSuspended = false;
    next();
  }
}

/**
 * 🔒 停權帳號阻擋中間件
 * 
 * 停權帳號 (status = 'suspended') 的以下操作會被拒絕：
 * - POST 請求（新增資料）
 * - PUT/PATCH 請求（更新資料）
 * - DELETE 請求（刪除資料）
 * 
 * GET 請求（讀取資料）仍然允許
 */
export async function blockSuspendedAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 未認證用戶跳過檢查
  if (!req.user) {
    next();
    return;
  }

  // 僅檢查修改性操作
  const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!writeOperations.includes(req.method)) {
    next();
    return;
  }

  try {
    // 如果已經有狀態資訊，直接使用
    let isSuspended = req.isSuspended;

    // 如果沒有，重新查詢
    if (typeof isSuspended === 'undefined') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('status, suspended_reason')
        .eq('id', req.user.id)
        .single();

      if (error) {
        console.error('[SuspendedCheck] Query error:', error.message);
        // 為安全起見，查詢失敗時允許請求通過
        next();
        return;
      }

      isSuspended = data.status === 'suspended';
      req.userStatus = data.status;
      req.isSuspended = isSuspended;

      // 如果被停權，記錄原因用於日誌
      if (isSuspended && data.suspended_reason) {
        console.warn(
          `[SuspendedCheck] Blocked ${req.method} ${req.originalUrl} ` +
          `from suspended user ${req.user.id}. Reason: ${data.suspended_reason}`
        );
      }
    }

    if (isSuspended) {
      console.warn(
        `[SuspendedCheck] Blocked request from suspended account: ` +
        `${req.user.email} (${req.user.id}) - ${req.method} ${req.originalUrl}`
      );

      accountErrors.suspended(res);
      return;
    }

    next();
  } catch (err) {
    console.error('[SuspendedCheck] Middleware error:', err);
    // 發生錯誤時為安全起見允許請求通過
    next();
  }
}

/**
 * 合併中間件：檢查狀態並阻擋停權帳號
 */
export const suspendedCheck = blockSuspendedAccount;

/**
 * 需要 active 帳號的中間件
 * 類似 blockSuspendedAccount 但更嚴格，任何請求都會被阻擋
 */
export async function requireActiveAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    errors.unauthorized(res, '請先登入', 'NOT_AUTHENTICATED');
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('status, suspended_reason')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('[SuspendedCheck] Query error:', error.message);
      errors.internal(res, '無法驗證帳號狀態', 'STATUS_CHECK_ERROR');
      return;
    }

    if (data.status === 'suspended') {
      console.warn(
        `[SuspendedCheck] Rejected suspended account: ${req.user.email} (${req.user.id})`
      );
      accountErrors.suspended(res);
      return;
    }

    req.userStatus = data.status;
    req.isSuspended = false;
    next();
  } catch (err) {
    console.error('[SuspendedCheck] Error:', err);
    errors.internal(res, '帳號狀態驗證失敗', 'STATUS_CHECK_ERROR');
  }
}

export default suspendedCheck;
