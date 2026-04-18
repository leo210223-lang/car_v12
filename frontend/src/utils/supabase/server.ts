import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// TODO: [HealthCheck] 這個 legacy helper 缺少標準化 cookie setAll 管理；請統一改用 `src/lib/supabase/server.ts`，避免 SSR session 行為不一致。
export const createSupabaseServerClient = (cookies: any) =>
  createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
