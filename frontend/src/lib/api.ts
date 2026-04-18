/**
 * FaCai-B Platform - API Client
 * File: frontend/src/lib/api.ts
 * 
 * 封裝後端 API 請求
 */

import { getSupabaseClient } from './supabase/client';

/**
 * 確保請求基底為 .../api/v1（避免 Vercel 只填 Render 根網域而漏掉 /api/v1）
 */
function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:3001/api/v1';
  if (/\/api\/v\d+$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api/v1`;
}

/**
 * 解析 API 基底：
 * - 有設定 NEXT_PUBLIC_API_URL → 直接連後端（需 CORS 允許）
 * - 未設定且在瀏覽器 → 使用同源 `/api/v1`（由 next.config rewrites 轉到 Express）
 * - SSR / Node → 預設本機後端埠
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser 端固定走同源，由 Next rewrites 代理到後端，避免跨網域 CORS/preflight 問題
    return `${window.location.origin}/api/v1`;
  }
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (raw) {
    return normalizeApiBaseUrl(raw);
  }
  return 'http://localhost:3001/api/v1';
}

// 開發模式檢測
const isDev = process.env.NODE_ENV === 'development';
const isSupabaseConfigured = 
  typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here';

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  meta?: {
    total?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
    timestamp?: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 取得當前用戶的 JWT Token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * 建立完整的 URL（含 query params）
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  let url: URL;

  if (/^https?:\/\//i.test(endpoint)) {
    url = new URL(endpoint);
  } else if (endpoint.startsWith('/api/v1/')) {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    url = new URL(endpoint, origin);
  } else {
    url = new URL(`${getApiBaseUrl()}${endpoint}`);
  }
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

// ============================================================================
// API Client
// ============================================================================

export const api = {
  /**
   * 發送 API 請求
   */
  async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();
    
    // 取得 Token
    const token = await getAuthToken();
    
    // 建立 Headers
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // 僅在有 request body 時才帶 Content-Type，避免 GET 觸發不必要的 CORS preflight
    if (
      fetchOptions.body !== undefined &&
      fetchOptions.body !== null &&
      method !== 'GET' &&
      method !== 'HEAD' &&
      !(fetchOptions.body instanceof FormData) &&
      !('Content-Type' in (headers as Record<string, string>))
    ) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(buildUrl(endpoint, params), {
        ...fetchOptions,
        headers,
      });

      // 檢查 Content-Type，確保是 JSON 才解析
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // 非 JSON 回應（可能是 HTML 404 頁面）
        console.warn('[API] 非 JSON 回應:', response.status, response.statusText);
        return {
          success: false,
          message: `伺服器回應格式錯誤 (${response.status})`,
          code: 'INVALID_RESPONSE',
        } as ApiResponse<T>;
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || '請求失敗',
          code: data.code || 'REQUEST_FAILED',
        } as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.error('[API] Request error:', error);
      return {
        success: false,
        message: '網路連線錯誤，請稍後再試',
        code: 'NETWORK_ERROR',
      } as ApiResponse<T>;
    }
  },

  /**
   * GET 請求
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  },

  /**
   * POST 請求
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  /**
   * PUT 請求
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  /**
   * DELETE 請求
   */
  async delete<T>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  },

  /**
   * 上傳檔案（multipart/form-data）
   */
  async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const token = await getAuthToken();

    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // 不要設定 Content-Type，讓瀏覽器自動處理
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || '上傳失敗',
          code: data.code || 'UPLOAD_FAILED',
        } as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.error('[API] Upload error:', error);
      return {
        success: false,
        message: '上傳失敗，請稍後再試',
        code: 'UPLOAD_ERROR',
      } as ApiResponse<T>;
    }
  },
};

export default api;
