/**
 * FaCai-B Platform - Express Application
 * File: backend/src/app.ts
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, isDevelopment } from './config/env';
import { success } from './utils/response';
import { createRoutes } from './routes';
import { globalErrorHandler, notFoundHandler } from './middleware';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Security headers with Helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://*.supabase.co'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // 允許的來源
      if (env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      
      // 開發模式允許所有
      if (isDevelopment) {
        callback(null, true);
        return;
      }
      
      // 允許所有 Vercel 預覽 URL (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }
      
      // 允許 Render 預覽 URL (*.onrender.com)
      if (origin.endsWith('.onrender.com')) {
        callback(null, true);
        return;
      }
      
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
  }));

  // JSON and URL encoded parsing
  app.use(express.json({ limit: '10mb', strict: true }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // Development logging
  if (isDevelopment) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
        );
      });
      next();
    });
  }

  // Root health check (最簡單的健康檢查，用於負載均衡器)
  app.get('/health', (_req: Request, res: Response) => {
    success(res, {
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0',
        environment: env.NODE_ENV,
      },
    });
  });

  // Mount API routes
  app.use('/api', createRoutes());

  // 404 handler (for non-API routes)
  app.use(notFoundHandler);

  // Global error handler
  app.use(globalErrorHandler);

  return app;
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

export default createApp;
