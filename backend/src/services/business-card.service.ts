/**
 * FaCai-B Platform - Business Card Service
 * File: backend/src/services/business-card.service.ts
 *
 * 管理員為會員上傳名片：
 *  - 圖片存到 Supabase Storage（business-cards bucket）
 *  - URL 回寫到 users.business_card_url
 *
 * 注意：建議預先在 Supabase 建立 bucket「business-cards」並設為 public。
 */

import { supabaseAdmin } from '../config/supabase';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BUSINESS_CARD_BUCKET = 'business-cards';

export const businessCardService = {
  /**
   * 上傳名片圖片
   */
  async upload(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType?: string
  ): Promise<ServiceResult<{ url: string }>> {
    try {
      // 檢查會員存在
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, business_card_url')
        .eq('id', userId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該會員' } };
      }

      // 產生檔名
      const ext = (originalName.split('.').pop() || 'jpg').toLowerCase();
      const timestamp = Date.now();
      const fileName = `${userId}/card_${timestamp}.${ext}`;

      // 上傳
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUSINESS_CARD_BUCKET)
        .upload(fileName, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[BusinessCardService] Upload error:', uploadError);
        return {
          success: false,
          error: { code: 'UPLOAD_ERROR', message: uploadError.message },
        };
      }

      // 取得 publicUrl
      const { data: publicData } = supabaseAdmin.storage
        .from(BUSINESS_CARD_BUCKET)
        .getPublicUrl(fileName);

      if (!publicData?.publicUrl) {
        return {
          success: false,
          error: { code: 'URL_ERROR', message: '無法取得名片公開網址' },
        };
      }

      // 嘗試刪舊名片（若有）
      if (existing.business_card_url) {
        try {
          const oldPath = existing.business_card_url
            .split(`${BUSINESS_CARD_BUCKET}/`)
            .pop();
          if (oldPath) {
            await supabaseAdmin.storage.from(BUSINESS_CARD_BUCKET).remove([oldPath]);
          }
        } catch (err) {
          console.warn('[BusinessCardService] Remove old card failed:', err);
        }
      }

      // 更新 users.business_card_url
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ business_card_url: publicData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('[BusinessCardService] Update user error:', updateError);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: updateError.message },
        };
      }

      return { success: true, data: { url: publicData.publicUrl } };
    } catch (err) {
      console.error('[BusinessCardService] Upload exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '上傳名片失敗' } };
    }
  },

  /**
   * 刪除會員名片
   */
  async remove(userId: string): Promise<ServiceResult<void>> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('business_card_url')
        .eq('id', userId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該會員' } };
      }

      // 刪掉 storage
      if (existing.business_card_url) {
        try {
          const oldPath = existing.business_card_url
            .split(`${BUSINESS_CARD_BUCKET}/`)
            .pop();
          if (oldPath) {
            await supabaseAdmin.storage.from(BUSINESS_CARD_BUCKET).remove([oldPath]);
          }
        } catch (err) {
          console.warn('[BusinessCardService] Remove storage file failed:', err);
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ business_card_url: null })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: { code: 'DB_ERROR', message: updateError.message } };
      }

      return { success: true };
    } catch (err) {
      console.error('[BusinessCardService] Remove exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '刪除名片失敗' } };
    }
  },
};

export default businessCardService;
