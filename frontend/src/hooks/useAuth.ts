'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import api from '@/lib/api';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company_name: string | null;
  status: 'active' | 'suspended' | 'pending' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

interface SignInResult {
  data: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
}

interface SignUpResult {
  data: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
}

interface UserMetadata {
  name?: string;
  company_name?: string;
  shop_name?: string;
  phone?: string;
  [key: string]: unknown;
}

/**
 * useAuth Hook
 * 管理使用者認證狀態與操作
 */
export function useAuth() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const fetchOwnProfile = useCallback(async (): Promise<UserProfile | null> => {
    const response = await api.get<UserProfile>('/users/me');
    if (!response.success || !response.data) {
      return null;
    }
    return response.data;
  }, []);

  // 重新整理 Session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      const profile = session?.user ? await fetchOwnProfile() : null;
      setState({
        user: session?.user ?? null,
        session,
        profile,
        loading: false,
      });
      return session;
    } catch (error) {
      console.error('Refresh session error:', error);
      return null;
    }
  }, [supabase.auth]);

  // 取得初始 Session + 定時刷新
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const profile = session?.user ? await fetchOwnProfile() : null;
        setState({
          user: session?.user ?? null,
          session,
          profile,
          loading: false,
        });
      } catch (error) {
        console.error('Error getting session:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    getInitialSession();
    // 定時自動刷新 Session（每 10 分鐘）
    const interval = setInterval(() => {
      refreshSession();
    }, 10 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [supabase.auth, refreshSession, fetchOwnProfile]);

  /**
   * 登入
   */
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<SignInResult> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { data: null, error };
      }

      setState({
        user: data.user,
        session: data.session,
        profile: data.user ? await fetchOwnProfile() : null,
        loading: false,
      });

      return { data, error: null };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        data: null,
        error: error as AuthError,
      };
    }
  }, [supabase.auth, fetchOwnProfile]);

  /**
   * 註冊
   */
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: UserMetadata
  ): Promise<SignUpResult> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          email_confirm: false, // 直接啟用帳號
          data: metadata,
        },
      });

      setState(prev => ({ ...prev, loading: false }));

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        data: null,
        error: error as AuthError,
      };
    }
  }, [supabase.auth]);

  /**
   * 登出
   */
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
      });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase.auth, router]);

  return {
    user: state.user,
    session: state.session,
    profile: state.profile,
    loading: state.loading,
    isAuthenticated: !!state.session,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
}
