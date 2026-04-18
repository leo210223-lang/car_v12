/**
 * FaCai-B Platform - Health Check Routes
 * File: backend/src/routes/health.ts
 */

import { Router, Request, Response } from 'express';
import { success } from '../utils/response';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { isRedisAvailable } from '../config/redis';

const router = Router();

/**
 * GET /health
 * 基本健康檢查
 */
router.get('/', (_req: Request, res: Response) => {
  success(res, {
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: env.NODE_ENV,
    },
  });
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (_req: Request, res: Response) => {
  success(res, {
    data: {
      status: 'live',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe - 檢查所有依賴服務
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let isReady = true;

  // 檢查 Supabase
  try {
    const start = Date.now();
    const { error } = await supabaseAdmin
      .from('brands')
      .select('count')
      .limit(1);
    
    const latency = Date.now() - start;
    
    if (error && error.code !== 'PGRST116') {
      checks['supabase'] = { status: 'unhealthy', latency, error: error.message };
      isReady = false;
    } else {
      checks['supabase'] = { status: 'healthy', latency };
    }
  } catch (err) {
    checks['supabase'] = { 
      status: 'unhealthy', 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
    isReady = false;
  }

  // 檢查 Redis
  checks['redis'] = {
    status: isRedisAvailable() ? 'healthy' : 'unavailable (using memory fallback)',
  };

  success(res, {
    statusCode: isReady ? 200 : 503,
    data: {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

/**
 * GET /health/detailed
 * 詳細系統資訊（僅開發環境）
 */
router.get('/detailed', (_req: Request, res: Response) => {
  if (env.NODE_ENV === 'production') {
    success(res, {
      statusCode: 403,
      data: { message: 'Not available in production' },
    });
    return;
  }

  success(res, {
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env['npm_package_version'] || '1.0.0',
      node: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      redis: isRedisAvailable() ? 'connected' : 'memory_fallback',
    },
  });
});

export default router;
