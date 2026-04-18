import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
    timestamp?: string;
  };
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
}

export interface SuccessOptions<T> {
  statusCode?: number;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ErrorOptions {
  statusCode?: number;
  message: string;
  code?: string;
  details?: unknown;
}

export function success<T>(res: Response, options: SuccessOptions<T> = {}): Response {
  const { statusCode = 200, data, message, pagination } = options;
  
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(pagination && {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
      }),
    },
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
}

export function error(res: Response, options: ErrorOptions): Response {
  const { statusCode = 500, message, code, details } = options;
  
  const response: ApiResponse = {
    success: false,
    message,
    code,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  
  if (details && process.env['NODE_ENV'] === 'development') {
    (response as ApiResponse & { _debug: unknown })._debug = details;
  }
  
  return res.status(statusCode).json(response);
}

export const errors = {
  badRequest: (res: Response, message = 'Bad request', code = 'BAD_REQUEST') => 
    error(res, { statusCode: 400, message, code }),
  
  unauthorized: (res: Response, message = 'Please login first', code = 'UNAUTHORIZED') => 
    error(res, { statusCode: 401, message, code }),
  
  forbidden: (res: Response, message = 'Permission denied', code = 'FORBIDDEN') => 
    error(res, { statusCode: 403, message, code }),
  
  notFound: (res: Response, message = 'Resource not found', code = 'NOT_FOUND') => 
    error(res, { statusCode: 404, message, code }),
  
  conflict: (res: Response, message = 'Resource already exists', code = 'CONFLICT') => 
    error(res, { statusCode: 409, message, code }),
  
  validation: (res: Response, message = 'Validation failed', code = 'VALIDATION_ERROR') => 
    error(res, { statusCode: 422, message, code }),
  
  tooManyRequests: (res: Response, message = 'Too many requests', code = 'RATE_LIMITED') => 
    error(res, { statusCode: 429, message, code }),
  
  internal: (res: Response, message = 'Internal server error', code = 'INTERNAL_ERROR') => 
    error(res, { statusCode: 500, message, code }),
  
  serviceUnavailable: (res: Response, message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') => 
    error(res, { statusCode: 503, message, code }),
};

export const accountErrors = {
  suspended: (res: Response) => 
    error(res, {
      statusCode: 403,
      message: 'Your account has been suspended',
      code: 'ACCOUNT_SUSPENDED',
    }),
  
  notFound: (res: Response) => 
    error(res, {
      statusCode: 404,
      message: 'Account not found',
      code: 'ACCOUNT_NOT_FOUND',
    }),
};

export const vehicleErrors = {
  notFound: (res: Response) => 
    error(res, {
      statusCode: 404,
      message: 'Vehicle not found',
      code: 'VEHICLE_NOT_FOUND',
    }),
  
  notOwner: (res: Response) => 
    error(res, {
      statusCode: 403,
      message: 'You are not the owner of this vehicle',
      code: 'NOT_VEHICLE_OWNER',
    }),
  
  invalidStatus: (res: Response, currentStatus: string, allowedStatuses: string[]) => 
    error(res, {
      statusCode: 400,
      message: `Vehicle status is "${currentStatus}", allowed: ${allowedStatuses.join(', ')}`,
      code: 'INVALID_VEHICLE_STATUS',
    }),
};

export const tradeErrors = {
  notFound: (res: Response) => 
    error(res, {
      statusCode: 404,
      message: 'Trade request not found',
      code: 'TRADE_NOT_FOUND',
    }),
  
  notOwner: (res: Response) => 
    error(res, {
      statusCode: 403,
      message: 'You are not the owner of this trade request',
      code: 'NOT_TRADE_OWNER',
    }),
  
  expired: (res: Response) => 
    error(res, {
      statusCode: 400,
      message: 'This trade request has expired',
      code: 'TRADE_EXPIRED',
    }),
};