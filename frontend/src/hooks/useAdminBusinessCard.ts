'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';

export function useAdminBusinessCard() {
  /**
   * 上傳名片（multipart/form-data）
   */
  const uploadCard = useCallback(async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('card', file);
    return api.upload<{ url: string }>(
      `/admin/business-cards/${userId}`,
      formData
    );
  }, []);

  /**
   * 刪除名片
   */
  const removeCard = useCallback(async (userId: string) => {
    return api.delete<void>(`/admin/business-cards/${userId}`);
  }, []);

  return { uploadCard, removeCard };
}
