/**
 * FaCai-B Platform - Error Handler Middleware
 * File: backend/src/middleware/errorHandler.ts
 * 
 * 統一錯誤格式，確保不洩漏內部細節
 */

import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';
import { isProduction, isDevelopment } from '../config/env';

/**
 * 自訂 API 錯誤類別
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'API_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // 維持正確的 stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // 常用錯誤工廠方法
  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): ApiError {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = '請先登入', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = '權限不足', code = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = '找不到資源', code = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT'): ApiError {
    return new ApiError(409, message, code);
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static tooManyRequests(message = '請求過於頻繁', code = 'RATE_LIMITED'): ApiError {
    return new ApiError(429, message, code);
  }

  static internal(message = '內部伺服器錯誤', code = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, code);
  }

  static serviceUnavailable(message = '服務暫時無法使用', code = 'SERVICE_UNAVAILABLE'): ApiError {
    return new ApiError(503, message, code);
  }
}

/**
 * 驗證錯誤（Zod 等）
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * 資料庫錯誤
 */
export class DatabaseError extends ApiError {
  constructor(message: string, originalError?: Error) {
    super(500, message, 'DATABASE_ERROR', isDevelopment ? originalError?.message : undefined);
  }
}

/**
 * Supabase 錯誤代碼對應
 */
const SUPABASE_ERROR_MAP: Record<string, { status: number; message: string; code: string }> = {
  'PGRST116': { status: 404, message: '找不到資料', code: 'NOT_FOUND' },
  '23505': { status: 409, message: '資料已存在', code: 'DUPLICATE_ENTRY' },
  '23503': { status: 400, message: '關聯資料不存在', code: 'FOREIGN_KEY_VIOLATION' },
  '22P02': { status: 400, message: '無效的資料格式', code: 'INVALID_FORMAT' },
  '42501': { status: 403, message: '權限不足', code: 'INSUFFICIENT_PRIVILEGE' },
  'JWT_EXPIRED': { status: 401, message: '登入已過期', code: 'TOKEN_EXPIRED' },
  'INVALID_JWT': { status: 401, message: '無效的認證憑證', code: 'INVALID_TOKEN' },
};

/**
 * 解析 Supabase 錯誤
 */
function parseSupabaseError(err: unknown): ApiError | null {
  if (!err || typeof err !== 'object') return null;
  
  const error = err as { code?: string; message?: string };
  
  if (error.code && SUPABASE_ERROR_MAP[error.code]) {
    const mapped = SUPABASE_ERROR_MAP[error.code]!;
    return new ApiError(mapped.status, mapped.message, mapped.code);
  }
  
  return null;
}

/**
 * 處理未知錯誤
 */
function sanitizeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: isDevelopment ? err.stack : undefined,
    };
  }
  
  if (typeof err === 'string') {
    return { message: err };
  }
  
  return { message: 'Unknown error occurred' };
}

/**
 * 全域錯誤處理中間件
 * 
 * 注意：Express 需要 4 個參數才能辨識為錯誤處理中間件
 */
export function globalErrorHandler(
  err: Error | ApiError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 記錄錯誤
  const requestInfo = `${req.method} ${req.originalUrl}`;
  const requestId = req.requestId || 'unknown';

  // 如果是我們自訂的 ApiError
  if (err instanceof ApiError) {
    console.error(
      `[Error] ${requestInfo} [${requestId}]: ${err.code} - ${err.message}`
    );

    error(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  // 嘗試解析 Supabase 錯誤
  const supabaseError = parseSupabaseError(err);
  if (supabaseError) {
    console.error(
      `[Supabase Error] ${requestInfo} [${requestId}]: ${supabaseError.code}`
    );

    error(res, {
      statusCode: supabaseError.statusCode,
      message: supabaseError.message,
      code: supabaseError.code,
    });
    return;
  }

  // JSON 解析錯誤
  if (err instanceof SyntaxError && 'body' in err) {
    console.error(`[JSON Error] ${requestInfo} [${requestId}]: Invalid JSON`);
    
    error(res, {
      statusCode: 400,
      message: 'Invalid JSON format',
      code: 'INVALID_JSON',
    });
    return;
  }

  // 未知錯誤：記錄完整資訊但對外隱藏
  const sanitized = sanitizeError(err);
  console.error(`[Unhandled Error] ${requestInfo} [${requestId}]:`, sanitized.message);
  
  if (sanitized.stack) {
    console.error(sanitized.stack);
  }

  // 生產環境隱藏錯誤細節
  error(res, {
    statusCode: 500,
    message: isProduction ? '內部伺服器錯誤' : sanitized.message,
    code: 'INTERNAL_ERROR',
  });
}

/**
 * 404 Not Found 處理器
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  
  error(res, {
    statusCode: 404,
    message: `找不到路徑: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

/**
 * 非同步錯誤包裝器
 * 自動捕捉 async 函數中的錯誤並傳遞給 error handler
 */
export function asyncHandler<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 建立錯誤邊界中間件
 * 用於包裝可能出錯的路由群組
 */
export function errorBoundary(routerName: string) {
  return (err: unknown, _req: Request, _res: Response, next: NextFunction): void => {
    console.error(`[${routerName}] Error in route handler:`, err);
    next(err);
  };
}

export default globalErrorHandler;
