/**
 * FaCai-B Platform - User Profile Routes
 * File: backend/src/routes/users.ts
 *
 * 一般會員個人資料 API（需認證）
 *
 * [v12 變更]
 *  - fetchOwnProfile 多 select credits, business_card_url
 *  - 新增 GET /me/credits 回傳自己的點數
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware';
import { validate, updateOwnProfileSchema } from '../utils/validation';
import { success, errors } from '../utils/response';
import { triggerNextRevalidation } from '../utils/revalidateNext';

const router = Router();

const OWN_PROFILE_COLUMNS =
  'id, email, name, phone, company_name, status, credits, business_card_url, created_at, updated_at';

async function fetchOwnProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(OWN_PROFILE_COLUMNS)
    .eq('id', userId)
    .single();

  return { data, error };
}

router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { data, error } = await fetchOwnProfile(userId);

    if (error) {
      console.error('[UserProfileRoute] Get own profile error:', error);
      return errors.internal(res, '取得個人資料失敗');
    }

    return success(res, { data });
  })
);

/**
 * [v12] 單獨取得自己的點數
 */
router.get(
  '/me/credits',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return errors.internal(res, '取得點數失敗');
    }

    return success(res, { data: { credits: data.credits ?? 0 } });
  })
);

router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { data, error } = await fetchOwnProfile(userId);

    if (error) {
      console.error('[UserProfileRoute] Get profile error:', error);
      return errors.internal(res, '取得個人資料失敗');
    }

    return success(res, { data });
  })
);

router.put(
  '/profile',
  validate(updateOwnProfileSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, phone, company_name } = req.body as {
      name?: string;
      phone?: string;
      company_name?: string;
    };

    const updatePayload: Record<string, string | null> = {};

    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (company_name !== undefined) updatePayload.company_name = company_name;

    if (Object.keys(updatePayload).length === 0) {
      return errors.badRequest(res, '沒有可更新的欄位', 'EMPTY_UPDATE_PAYLOAD');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select(OWN_PROFILE_COLUMNS)
      .single();

    if (error) {
      console.error('[UserProfileRoute] Update profile error:', error);
      return errors.internal(res, '更新個人資料失敗');
    }

    await triggerNextRevalidation({
      path: ['/profile', '/(user)', '/'],
      tag: ['users', 'profile', 'layout'],
    });

    return success(res, {
      data,
      message: '個人資料已更新',
    });
  })
);

export default router;
