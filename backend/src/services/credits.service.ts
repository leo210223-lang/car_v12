/**
 * FaCai-B Platform - Credits Service
 * File: backend/src/services/credits.service.ts
 *
 * 點數管理：
 *  - 管理員直接設定某會員的點數
 *  - 會員讀取自己的點數
 */

import { supabaseAdmin } from '../config/supabase';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const creditsService = {
  /**
   * 取得某會員點數
   */
  async get(userId: string): Promise<ServiceResult<{ credits: number }>> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { success: false, error: { code: 'NOT_FOUND', message: '找不到該會員' } };
    }

    return { success: true, data: { credits: data.credits ?? 0 } };
  },

  /**
   * 管理員直接設定某會員的點數
   */
  async setByAdmin(
    userId: string,
    adminId: string,
    credits: number
  ): Promise<ServiceResult<{ id: string; credits: number }>> {
    try {
      if (credits < 0 || !Number.isInteger(credits)) {
        return {
          success: false,
          error: { code: 'INVALID_VALUE', message: '點數必須是 ≥ 0 的整數' },
        };
      }

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, credits, email, company_name')
        .eq('id', userId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: '找不到該會員' } };
      }

      const before = existing.credits ?? 0;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ credits })
        .eq('id', userId)
        .select('id, credits')
        .single();

      if (error) {
        console.error('[CreditsService] Set error:', error);
        return { success: false, error: { code: 'DB_ERROR', message: error.message } };
      }

      // 稽核紀錄
      await supabaseAdmin.from('audit_logs').insert({
        user_id: adminId,
        action: 'USER_REACTIVATED', // 用現有 enum 中最接近；正式版建議擴充 USER_CREDITS_ADJUSTED
        target_type: 'user',
        target_id: userId,
        details: {
          change: 'CREDITS_ADJUSTED',
          before,
          after: credits,
          target_email: existing.email,
          target_company: existing.company_name,
        },
      });

      return { success: true, data: data as { id: string; credits: number } };
    } catch (err) {
      console.error('[CreditsService] Set exception:', err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: '調整點數失敗' } };
    }
  },
};

export default creditsService;
