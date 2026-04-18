/**
 * FaCai-B Platform - Middleware Index
 * File: backend/src/middleware/index.ts
 * 
 * 匯出所有中間件
 */

// Authentication
export {
  authenticate,
  optionalAuthenticate,
  loadUserProfile,
  authWithProfile,
} from './auth';

// Authorization
export {
  requireAdmin,
  checkAdminRole,
  adminOnly,
} from './admin';

// Suspended Account Check (ANALYZE-01 Security Fix)
export {
  checkAccountStatus,
  blockSuspendedAccount,
  suspendedCheck,
  requireActiveAccount,
} from './suspendedCheck';

// Rate Limiting
export {
  createRateLimiter,
  apiRateLimit,
  strictRateLimit,
  relaxedRateLimit,
  uploadRateLimit,
  createUserRateLimiter,
  createCompositeRateLimiter,
} from './rateLimit';
export type { RateLimitOptions } from './rateLimit';

// Error Handling
export {
  ApiError,
  ValidationError,
  DatabaseError,
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  errorBoundary,
} from './errorHandler';
