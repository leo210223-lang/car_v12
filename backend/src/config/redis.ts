/**
 * FaCai-B Platform - Redis Client Configuration
 * File: backend/src/config/redis.ts
 * 
 * Redis 客戶端設定，用於限流和快取
 * 支援 graceful fallback 當連線失敗時
 */

import Redis from 'ioredis';
import { env, isDevelopment } from './env';

let redisClient: Redis | null = null;
let isConnected = false;
let connectionAttempted = false;

/**
 * Redis 連線選項
 */
interface RedisConnectionOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * 初始化 Redis 連線
 */
export async function initializeRedis(
  options: RedisConnectionOptions = {}
): Promise<boolean> {
  const { maxRetries = 3, retryDelayMs = 1000 } = options;

  if (!env.REDIS_URL) {
    console.log('[Redis] No REDIS_URL configured, running without Redis (in-memory fallback)');
    connectionAttempted = true;
    return false;
  }

  if (isConnected && redisClient) {
    return true;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      redisClient = new Redis(env.REDIS_URL, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // 停止重試
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] Client error:', err.message);
        isConnected = false;
      });

      redisClient.on('reconnecting', () => {
        console.log('[Redis] Reconnecting...');
      });

      redisClient.on('ready', () => {
        console.log('[Redis] Connection ready');
        isConnected = true;
      });

      await redisClient.connect();
      
      // Ping test
      await redisClient.ping();
      
      isConnected = true;
      connectionAttempted = true;
      console.log('[Redis] Connected successfully');
      return true;

    } catch (err) {
      lastError = err as Error;
      console.warn(
        `[Redis] Connection attempt ${attempt}/${maxRetries} failed:`,
        lastError.message
      );

      if (redisClient) {
        try {
          await redisClient.quit();
        } catch {
          // Ignore quit errors
        }
        redisClient = null;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  connectionAttempted = true;
  console.error(
    '[Redis] All connection attempts failed. Running with in-memory fallback.'
  );
  
  if (isDevelopment) {
    console.log('[Redis] Last error:', lastError?.message);
  }

  return false;
}

/**
 * 取得 Redis 客戶端
 */
export function getRedisClient(): Redis | null {
  return isConnected ? redisClient : null;
}

/**
 * 檢查 Redis 是否可用
 */
export function isRedisAvailable(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * 檢查是否已嘗試連線
 */
export function hasAttemptedConnection(): boolean {
  return connectionAttempted;
}

/**
 * 優雅關閉 Redis 連線
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[Redis] Connection closed gracefully');
    } catch (err) {
      console.error('[Redis] Error closing connection:', err);
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
}

/**
 * In-Memory Rate Limit Store (Fallback)
 * 當 Redis 不可用時使用的記憶體限流存儲
 */
class InMemoryRateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每分鐘清理過期的記錄
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now >= record.resetAt) {
      const newRecord = { count: 1, resetAt: now + windowMs };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.count += 1;
    return record;
  }

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const record = this.store.get(key);
    if (!record) return null;

    const now = Date.now();
    if (now >= record.resetAt) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// 單例 in-memory store
let inMemoryStore: InMemoryRateLimitStore | null = null;

export function getInMemoryStore(): InMemoryRateLimitStore {
  if (!inMemoryStore) {
    inMemoryStore = new InMemoryRateLimitStore();
  }
  return inMemoryStore;
}

/**
 * Redis Rate Limit Operations
 */
export const rateLimitOps = {
  /**
   * 增加計數並取得當前狀態
   */
  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetAt: number }> {
    const redis = getRedisClient();

    if (!redis) {
      return getInMemoryStore().increment(key, windowMs);
    }

    const fullKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      const pipeline = redis.pipeline();
      pipeline.incr(fullKey);
      pipeline.pttl(fullKey);
      
      const results = await pipeline.exec();
      if (!results) {
        return getInMemoryStore().increment(key, windowMs);
      }

      const count = (results[0]?.[1] as number) || 1;
      let ttl = (results[1]?.[1] as number) || -1;

      // 如果是新的 key，設定過期時間
      if (ttl === -1) {
        await redis.expire(fullKey, windowSec);
        ttl = windowMs;
      }

      const resetAt = ttl > 0 ? now + ttl : now + windowMs;
      return { count, resetAt };

    } catch (err) {
      console.error('[Redis] Rate limit increment error:', err);
      return getInMemoryStore().increment(key, windowMs);
    }
  },

  /**
   * 取得當前計數
   */
  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const redis = getRedisClient();

    if (!redis) {
      return getInMemoryStore().get(key);
    }

    const fullKey = `ratelimit:${key}`;

    try {
      const [countStr, ttl] = await Promise.all([
        redis.get(fullKey),
        redis.pttl(fullKey),
      ]);

      if (!countStr) return null;

      const count = parseInt(countStr, 10);
      const resetAt = ttl > 0 ? Date.now() + ttl : Date.now();

      return { count, resetAt };

    } catch (err) {
      console.error('[Redis] Rate limit get error:', err);
      return getInMemoryStore().get(key);
    }
  },
};

export default {
  initializeRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedis,
  rateLimitOps,
};
