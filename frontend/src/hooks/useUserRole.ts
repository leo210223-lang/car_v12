'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user' | null;

/**
 * useUserRole Hook
 * 從 JWT 或 user metadata 解析使用者角色
 */
export function useUserRole() {
  const { user, loading, session } = useAuth();

  const role = useMemo((): UserRole => {
    if (!user || !session) return null;

    // 嘗試從 user metadata 取得角色
    const metadataRole = user.user_metadata?.role;
    if (metadataRole === 'admin' || metadataRole === 'user') {
      return metadataRole;
    }

    // 嘗試從 app_metadata 取得角色（由 Supabase Auth Hooks 設定）
    const appMetadataRole = user.app_metadata?.role;
    if (appMetadataRole === 'admin' || appMetadataRole === 'user') {
      return appMetadataRole;
    }

    // 預設為 user 角色
    return 'user';
  }, [user, session]);

  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return {
    role,
    isAdmin,
    isUser,
    loading,
    user,
  };
}
