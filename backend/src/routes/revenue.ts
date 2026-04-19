/**
 * FaCai-B Platform - Revenue Route (dealer-facing)
 * File: backend/src/routes/revenue.ts
 *
 * 車行用的營收路由
 * 掛載於 /api/v1/revenue
 *   - GET /mine        查自己的營收（分頁 + 摘要）
 *
 * [v12.1] 新增
 * [v12.2] 新增日期區間篩選 (以 archived_at 為基準)
 *   Query params:
 *     limit       (預設 20)
 *     cursor      游標分頁
 *     from        起始日期 ISO (含)
 *     to          結束日期 ISO (不含)
 *     year, month (便利參數；若帶此兩者，自動算出 from/to — 以該月第一天到下月第一天)
 */

import { Router, Request, Response } from 'express';
import { revenueService } from '../services/revenue.service';
import { authenticate, asyncHandler } from '../middleware';
import { success, errors } from '../utils/response';

const router = Router();

/**
 * 把 year+month 轉成 from / to (UTC)
 * year=2026, month=10  =>  from=2026-10-01T00:00:00.000Z, to=2026-11-01T00:00:00.000Z
 */
function monthRange(year: number, month: number): { from: string; to: string } | null {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)); // 下個月第一天
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * GET /api/v1/revenue/mine
 */
router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 20;
    const cursor = (req.query.cursor as string) || undefined;

    // [v12.2] 解析日期區間
    let from: string | undefined;
    let to: string | undefined;

    // 優先使用 year+month（最常見）
    if (req.query.year && req.query.month) {
      const y = Number(req.query.year);
      const m = Number(req.query.month);
      const range = monthRange(y, m);
      if (!range) {
        return errors.badRequest(res, 'year 或 month 參數格式錯誤', 'INVALID_DATE_RANGE');
      }
      from = range.from;
      to = range.to;
    } else {
      // 也接受自由的 from / to (ISO 日期字串)
      if (req.query.from) {
        const f = new Date(String(req.query.from));
        if (!Number.isNaN(f.getTime())) from = f.toISOString();
      }
      if (req.query.to) {
        const t = new Date(String(req.query.to));
        if (!Number.isNaN(t.getTime())) to = t.toISOString();
      }
    }

    const result = await revenueService.listByOwner(userId, limit, cursor, from, to);

    if (!result.success) {
      return errors.internal(res, result.error?.message || '取得營收紀錄失敗');
    }

    return success(res, {
      data: {
        records: result.data!.records,
        summary: result.data!.summary,
      },
      pagination: {
        nextCursor: result.data!.nextCursor,
        hasMore: result.data!.hasMore,
      },
    });
  })
);

export default router;
