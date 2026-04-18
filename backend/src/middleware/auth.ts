/**
 * FaCai-B Platform - JWT Authentication Middleware
 * File: backend/src/middleware/auth.ts
 * 
 * 解析 Supabase JWT 並設定 req.user
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { errors } from '../utils/response';
import { JwtUser, AuthenticatedUser, User, UserRole } from '../types';

/**
 * 擴展 Express Request 介面
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      accessToken?: string;
    }
  }
}

/**
 * 從 Authorization header 提取 Bearer token
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1] ?? null;
}

/**
 * JWT 驗證中間件
 * 驗證 Supabase JWT token 並解析用戶資訊
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      errors.unauthorized(res, '請先登入', 'NO_TOKEN');
      return;
    }

    // 使用 Supabase Admin Client 驗證 JWT
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('[Auth] JWT verification failed:', error?.message);
      errors.unauthorized(res, '登入已過期，請重新登入', 'INVALID_TOKEN');
      return;
    }

    // 從 user metadata 取得角色
    const role = (user.app_metadata?.role as UserRole) || 'user';

    // 組裝 JWT 用戶資料
    const jwtUser: JwtUser = {
      id: user.id,
      email: user.email || '',
      role,
      aud: 'authenticated',
      exp: 0, // 由 Supabase 管理
      iat: 0,
      sub: user.id,
    };

    // 設定到 request 物件
    req.user = jwtUser;
    req.accessToken = token;

    next();
  } catch (err) {
    console.error('[Auth] Middleware error:', err);
    errors.unauthorized(res, '認證失敗', 'AUTH_ERROR');
  }
}

/**
 * 可選認證中間件
 * 如果有 token 就驗證，沒有也讓請求通過
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      // 沒有 token 也允許通過
      next();
      return;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const role = (user.app_metadata?.role as UserRole) || 'user';

      const jwtUser: JwtUser = {
        id: user.id,
        email: user.email || '',
        role,
        aud: 'authenticated',
        exp: 0,
        iat: 0,
        sub: user.id,
      };

      req.user = jwtUser;
      req.accessToken = token;
    }

    next();
  } catch {
    // 可選認證：錯誤時也讓請求通過
    next();
  }
}

/**
 * 載入用戶完整資料中間件
 * 需在 authenticate 之後使用
 */
export async function loadUserProfile(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('[Auth] Failed to load user profile:', error.message);
      // 不阻止請求，只是沒有 profile
      next();
      return;
    }

    req.user.profile = data as User;
    next();
  } catch (err) {
    console.error('[Auth] Load profile error:', err);
    next();
  }
}

/**
 * 建立認證中間件鏈
 * 包含 JWT 驗證和載入用戶資料
 */
export const authWithProfile = [authenticate, loadUserProfile];

export default authenticate;
