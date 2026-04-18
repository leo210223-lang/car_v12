import useSWR, { mutate as globalMutate } from 'swr';
import api from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company_name: string | null;
  status: 'active' | 'suspended' | 'pending' | 'rejected';
  credits?: number; // [v12]
  business_card_url?: string | null; // [v12]
  created_at: string;
  updated_at: string;
}

export const USER_PROFILE_CACHE_KEY = '/users/me';

async function fetchUserProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/users/me');
  if (!response.success || !response.data) {
    throw new Error(response.message || '取得個人資料失敗');
  }
  return response.data;
}

export function useUserProfile(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    userId ? USER_PROFILE_CACHE_KEY : null,
    fetchUserProfile
  );

  return {
    profile: data || null,
    loading: isLoading,
    error: error ? String(error.message || error) : null,
    refetch: mutate,
  };
}

export async function mutateUserProfileCache() {
  await globalMutate(USER_PROFILE_CACHE_KEY);
}
