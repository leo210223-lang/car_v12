/**
 * FaCai-B Platform - Server Entry Point
 * File: backend/src/index.ts
 */

import { createApp } from './app';
import { env } from './config/env';
import { verifySupabaseConnection } from './config/supabase';
import { initializeRedis, closeRedis } from './config/redis';
import { initCronJobs, stopCronJobs } from './cron';

async function bootstrap(): Promise<void> {
  console.log('='.repeat(50));
  console.log('🚗 FaCai-B Platform - Starting Server');
  console.log('='.repeat(50));
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`Supabase URL: ${env.SUPABASE_URL?.substring(0, 30)}...`);
  console.log(`CORS Origins: ${env.CORS_ORIGINS.join(', ')}`);
  console.log('');

  // 驗證 Supabase 連線
  console.log('[Startup] Verifying Supabase connection...');
  const supabaseOk = await verifySupabaseConnection();
  if (!supabaseOk) {
    if (env.NODE_ENV === 'production') {
      console.error('[Startup] ❌ Supabase connection failed');
      process.exit(1);
    } else {
      console.warn('[Startup] ⚠️  Supabase connection failed (continuing in dev mode)');
    }
  } else {
    console.log('[Startup] ✅ Supabase connected');
  }

  // 初始化 Redis（可選）
  console.log('[Startup] Initializing Redis...');
  const redisOk = await initializeRedis();
  if (redisOk) {
    console.log('[Startup] ✅ Redis connected');
  } else {
    console.log('[Startup] ⚠️  Redis unavailable, using in-memory rate limiting');
  }

  // 建立 Express 應用
  const app = createApp();

  // 啟動伺服器
  const server = app.listen(env.PORT, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log(`✅ Server running at http://localhost:${env.PORT}`);
    console.log(`📋 Health check: http://localhost:${env.PORT}/health`);
    console.log(`🔌 API endpoint: http://localhost:${env.PORT}/api`);
    console.log('='.repeat(50));

    // 初始化定時任務
    console.log('');
    initCronJobs();
  });

  // 優雅關閉處理
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}, starting graceful shutdown...`);

    // 停止接受新連線
    server.close(async () => {
      console.log('[Shutdown] HTTP server closed');

      // 停止定時任務
      stopCronJobs();

      // 關閉 Redis
      await closeRedis();

      console.log('[Shutdown] All connections closed');
      console.log('[Shutdown] ✅ Graceful shutdown complete');
      process.exit(0);
    });

    // 強制關閉超時
    setTimeout(() => {
      console.error('[Shutdown] ⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // 註冊關閉信號
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 未捕獲的錯誤處理
  process.on('uncaughtException', (err) => {
    console.error('[Fatal] Uncaught Exception:', err);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// 啟動應用
bootstrap().catch((err) => {
  console.error('[Startup] Bootstrap failed:', err);
  process.exit(1);
});
