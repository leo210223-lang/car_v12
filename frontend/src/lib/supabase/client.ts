/**
 * FaCai-B Platform - Supabase Browser Client
 * File: frontend/src/lib/supabase/client.ts
 * 
 * 用於瀏覽器端的 Supabase 客戶端
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 檢查 Supabase 是否已正確設定
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key_here' &&
    supabaseUrl !== 'http://localhost:54321'
  );
}

export function createClient() {
  return createBrowserClient(
    supabaseUrl || 'http://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
  );
}

// 單例模式 - 避免重複建立客戶端
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

export default createClient;
