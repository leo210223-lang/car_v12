/**
 * FaCai-B Platform - Rate Limiting Middleware
 * File: backend/src/middleware/rateLimit.ts
 * 
 * 基於 IP 的請求限流，支援 Redis 和 In-Memory 後備方案
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { rateLimitOps, isRedisAvailable } from '../config/redis';
import { errors } from '../utils/response';

/**
 * 限流設定選項
 */
export interface RateLimitOptions {
  /** 時間視窗（毫秒），預設 60000 (1分鐘) */
  windowMs?: number;
  /** 視窗內最大請求數，預設從環境變數讀取 */
  max?: number;
  /** 用於識別客戶端的函數，預設使用 IP */
  keyGenerator?: (req: Request) => string;
  /** 跳過限流的條件函數 */
  skip?: (req: Request) => boolean;
  /** 是否在回應標頭中包含限流資訊 */
  headers?: boolean;
  /** 自訂超過限制時的訊息 */
  message?: string;
}

/**
 * 預設 key 生成器：使用客戶端 IP
 */
function defaultKeyGenerator(req: Request): string {
  // 支援 proxy 環境（如 Render）
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0]?.trim() 
    : req.socket.remoteAddress || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * 建立限流中間件
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000, // 1 分鐘
    max = env.RATE_LIMIT_MAX,
    keyGenerator = defaultKeyGenerator,
    skip,
    headers = true,
    message = '請求過於頻繁，請稍後再試',
  } = options;

  return async function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 跳過條件
      if (skip && skip(req)) {
        next();
        return;
      }

      const key = keyGenerator(req);
      const result = await rateLimitOps.increment(key, windowMs);

      // 設定回應標頭
      if (headers) {
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - result.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
        
        // 指示是否使用 Redis
        if (process.env['NODE_ENV'] === 'development') {
          res.setHeader('X-RateLimit-Backend', isRedisAvailable() ? 'redis' : 'memory');
        }
      }

      // 檢查是否超過限制
      if (result.count > max) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);

        console.warn(
          `[RateLimit] Blocked ${key}: ${result.count}/${max} requests in window`
        );

        errors.tooManyRequests(res, message, 'RATE_LIMIT_EXCEEDED');
        return;
      }

      next();
    } catch (err) {
      console.error('[RateLimit] Error:', err);
      // 限流錯誤時允許請求通過
      next();
    }
  };
}

/**
 * 預設 API 限流：100 req/min/IP
 */
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_MAX,
});

/**
 * 嚴格限流：用於敏感操作（登入、註冊等）
 * 10 req/min/IP
 */
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: '嘗試次數過多，請稍後再試',
});

/**
 * 寬鬆限流：用於公開資料讀取
 * 200 req/min/IP
 */
export const relaxedRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
});

/**
 * 上傳限流：限制圖片上傳頻率
 * 30 req/min/IP
 */
export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: '上傳過於頻繁，請稍後再試',
});

/**
 * 基於用戶 ID 的限流（適用於認證 API）
 */
export function createUserRateLimiter(options: Omit<RateLimitOptions, 'keyGenerator'> = {}) {
  return createRateLimiter({
    ...options,
    keyGenerator: (req: Request) => {
      // 如果有認證用戶，使用 user ID；否則使用 IP
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }
      return defaultKeyGenerator(req);
    },
  });
}

/**
 * 複合限流：同時限制 IP 和用戶
 */
export function createCompositeRateLimiter(
  ipOptions: RateLimitOptions = {},
  userOptions: RateLimitOptions = {}
) {
  const ipLimiter = createRateLimiter(ipOptions);
  const userLimiter = createUserRateLimiter(userOptions);

  return async function compositeLimiter(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 先檢查 IP 限流
    await new Promise<void>((resolve, reject) => {
      ipLimiter(req, res, (err?: unknown) => {
        if (err) reject(err);
        else if (res.headersSent) reject(new Error('Rate limited'));
        else resolve();
      });
    }).catch(() => {
      // IP 被限流，不繼續
      return;
    });

    if (res.headersSent) return;

    // 再檢查用戶限流（如果已認證）
    if (req.user) {
      userLimiter(req, res, next);
    } else {
      next();
    }
  };
}

export default apiRateLimit;
