/**
 * FaCai-B Platform - Supabase Client Configuration
 * File: backend/src/config/supabase.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase Admin Client (Service Role Key)
 * 用於後端服務操作，繞過 RLS
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase Public Client (Anon Key)
 * 用於公開資料查詢，受 RLS 限制
 */
export const supabasePublic: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a user-scoped Supabase client with JWT token
 * 用於模擬用戶身份執行操作，受 RLS 限制
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify Supabase connection
 */
export async function verifySupabaseConnection(): Promise<boolean> {
  try {
    // 使用 Admin client 進行簡單查詢
    const { error } = await supabaseAdmin
      .from('brands')
      .select('count')
      .limit(1)
      .single();

    // PGRST116 表示沒有資料，但連線成功
    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Connection verification failed:', error.message);
      return false;
    }

    console.log('[Supabase] Connection verified successfully');
    return true;
  } catch (err) {
    console.error('[Supabase] Connection verification error:', err);
    return false;
  }
}

export default supabaseAdmin;
