/**
 * KhoSkill AI — Coupon & 10-Minute Temporary Hold Engine
 *
 * Guarantees fair first-come-first-served flash-sale coupons:
 *  - When a user applies a coupon at checkout or creates a pending order, a 10-minute
 *    temporary hold is recorded in `coupon_holds` (`status='held'`).
 *  - While held, the slot counts as temporarily used so other buyers cannot exceed `max_uses`.
 *  - If payment completes within 10 minutes -> hold becomes `'consumed'` & `coupons.used_count` increments.
 *  - If 10 minutes pass without payment (or order is cancelled) -> hold automatically expires/releases,
 *    the unpaid coupon order is cancelled, and the coupon slot immediately becomes available again!
 */

import { formatVND } from './utils'
import { genCode } from './auth'

export const COUPON_HOLD_MINUTES = 10
export const COUPON_HOLD_MS = COUPON_HOLD_MINUTES * 60 * 1000

export function calcCouponDiscount(cp: { type: string; value: number }, subtotal: number): number {
  if (!cp || subtotal <= 0) return 0
  if (cp.type === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(cp.value) || 0))
    return Math.floor((subtotal * pct) / 100)
  }
  return Math.min(Math.max(0, Number(cp.value) || 0), subtotal)
}

function isCouponExpiredDate(expiresAt?: string | null): boolean {
  if (!expiresAt) return false
  const raw = String(expiresAt).trim()
  if (!raw) return false
  // Date-only YYYY-MM-DD stays valid through end of that day (VN UTC+7)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const endOfDay = new Date(`${raw}T23:59:59+07:00`)
    return !Number.isNaN(endOfDay.getTime()) && endOfDay.getTime() < Date.now()
  }
  const d = new Date(raw)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

/**
 * Automatically release all expired 10-minute coupon holds and cancel
 * their unpaid pending orders so the coupon becomes immediately reusable.
 */
export async function releaseExpiredCouponHolds(db: D1Database): Promise<number> {
  const nowIso = new Date().toISOString()
  try {
    const expiredRes = await db.prepare(
      `SELECT id, order_id FROM coupon_holds WHERE status = 'held' AND expires_at <= ?`
    ).bind(nowIso).all()
    const rows = (expiredRes.results || []) as { id: number; order_id: number | null }[]
    if (rows.length === 0) return 0

    for (const row of rows) {
      await db.prepare(
        `UPDATE coupon_holds SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'held'`
      ).bind(nowIso, row.id).run().catch(() => null)

      if (row.order_id) {
        await db.prepare(
          `UPDATE orders
           SET status = 'cancelled',
               note = CASE
                 WHEN note IS NULL OR note = '' THEN 'Tự động huỷ do quá 10 phút giữ mã giảm giá chưa thanh toán'
                 ELSE note || ' | Tự động huỷ do quá 10 phút giữ mã giảm giá'
               END
           WHERE id = ? AND status = 'pending'`
        ).bind(row.order_id).run().catch(() => null)
      }
    }
    return rows.length
  } catch {
    return 0
  }
}

/** Release any unattached checkout draft holds (order_id IS NULL) for a user */
export async function releaseUserDraftHolds(db: D1Database, userId: number, exceptCouponId?: number): Promise<void> {
  const nowIso = new Date().toISOString()
  if (exceptCouponId) {
    await db.prepare(
      `UPDATE coupon_holds SET status = 'released', updated_at = ?
       WHERE user_id = ? AND order_id IS NULL AND status = 'held' AND coupon_id != ?`
    ).bind(nowIso, userId, exceptCouponId).run().catch(() => null)
  } else {
    await db.prepare(
      `UPDATE coupon_holds SET status = 'released', updated_at = ?
       WHERE user_id = ? AND order_id IS NULL AND status = 'held'`
    ).bind(nowIso, userId).run().catch(() => null)
  }
}

export async function getActiveHoldCount(db: D1Database, couponId: number, excludeHoldId?: number): Promise<number> {
  const nowIso = new Date().toISOString()
  const row = excludeHoldId
    ? await db.prepare(
        `SELECT COUNT(*) AS n FROM coupon_holds
         WHERE coupon_id = ? AND status = 'held' AND expires_at > ? AND id != ?`
      ).bind(couponId, nowIso, excludeHoldId).first<any>().catch(() => ({ n: 0 }))
    : await db.prepare(
        `SELECT COUNT(*) AS n FROM coupon_holds
         WHERE coupon_id = ? AND status = 'held' AND expires_at > ?`
      ).bind(couponId, nowIso).first<any>().catch(() => ({ n: 0 }))
  return Number(row?.n || 0)
}

export type HoldCouponResult =
  | {
      ok: true
      coupon: any
      holdId: number
      discount: number
      expiresAt: string
      remainingAfterHold: number | null
    }
  | { ok: false; error: string; status?: number }

/**
 * Validate a coupon code and place (or refresh) a 10-minute temporary hold
 * for `userId` so no other user can steal the same slot during checkout/payment.
 */
export async function validateAndHoldCoupon(opts: {
  db: D1Database
  code: string
  userId: number
  subtotal: number
  orderId?: number | null
}): Promise<HoldCouponResult> {
  const { db, userId, subtotal, orderId = null } = opts
  const cleanCode = String(opts.code || '').trim().toUpperCase()
  if (!cleanCode) return { ok: false, error: 'Vui lòng nhập mã giảm giá', status: 400 }

  await releaseExpiredCouponHolds(db)

  const cp = await db.prepare(`SELECT * FROM coupons WHERE code = ?`).bind(cleanCode).first<any>()
  if (!cp) return { ok: false, error: 'Mã giảm giá không tồn tại', status: 400 }
  if (cp.status !== 'active') {
    return { ok: false, error: 'Mã giảm giá hiện đang tạm tắt hoặc chưa mở đợt khuyến mãi', status: 400 }
  }
  if (isCouponExpiredDate(cp.expires_at)) {
    return { ok: false, error: 'Mã giảm giá đã hết hạn sử dụng', status: 400 }
  }
  if (subtotal < Number(cp.min_order || 0)) {
    return { ok: false, error: `Đơn hàng tối thiểu ${formatVND(cp.min_order)} mới dùng được mã này`, status: 400 }
  }

  const maxUses = Number(cp.max_uses || 0)
  const usedCount = Number(cp.used_count || 0)

  if (maxUses > 0 && usedCount >= maxUses) {
    return { ok: false, error: 'Mã giảm giá đã hết lượt thanh toán', status: 400 }
  }

  // Release user's draft holds on any OTHER coupon codes
  await releaseUserDraftHolds(db, userId, cp.id)

  const nowIso = new Date().toISOString()
  const newExpiresAt = new Date(Date.now() + COUPON_HOLD_MS).toISOString()

  // Check if this user ALREADY holds an active unattached draft hold on this exact coupon
  const myHold = await db.prepare(
    `SELECT id FROM coupon_holds
     WHERE coupon_id = ? AND user_id = ? AND order_id IS NULL AND status = 'held' AND expires_at > ?
     ORDER BY id DESC LIMIT 1`
  ).bind(cp.id, userId, nowIso).first<any>().catch(() => null)

  let holdId: number
  if (myHold?.id) {
    holdId = Number(myHold.id)
    const otherHeld = await getActiveHoldCount(db, cp.id, holdId)
    if (maxUses > 0 && usedCount + otherHeld >= maxUses) {
      await db.prepare(`UPDATE coupon_holds SET status = 'released', updated_at = ? WHERE id = ?`)
        .bind(nowIso, holdId).run().catch(() => null)
      return {
        ok: false,
        error: 'Mã giảm giá đã được khách khác sử dụng hết lượt. Vui lòng thử mã khác!',
        status: 400
      }
    }
    await db.prepare(
      `UPDATE coupon_holds SET expires_at = ?, order_id = COALESCE(?, order_id), updated_at = ? WHERE id = ?`
    ).bind(newExpiresAt, orderId, nowIso, holdId).run()
  } else {
    const activeHeld = await getActiveHoldCount(db, cp.id)
    if (maxUses > 0 && usedCount + activeHeld >= maxUses) {
      const msg = activeHeld > 0
        ? `Mã ${cp.code} hiện đang có người giữ tạm chờ thanh toán. Nếu họ không thanh toán sau tối đa ${COUPON_HOLD_MINUTES} phút, mã sẽ tự mở lại!`
        : `Mã ${cp.code} đã hết lượt sử dụng.`
      return { ok: false, error: msg, status: 400 }
    }

    const ins = await db.prepare(
      `INSERT INTO coupon_holds (coupon_id, coupon_code, user_id, order_id, status, expires_at, updated_at)
       VALUES (?, ?, ?, ?, 'held', ?, ?)`
    ).bind(cp.id, cp.code, userId, orderId, newExpiresAt, nowIso).run()
    holdId = Number(ins.meta.last_row_id)

    // Concurrency rank guard: ensure simultaneous requests cannot exceed max_uses
    if (maxUses > 0) {
      const rankRow = await db.prepare(
        `SELECT COUNT(*) AS rank FROM coupon_holds
         WHERE coupon_id = ? AND status = 'held' AND expires_at > ? AND id <= ?`
      ).bind(cp.id, nowIso, holdId).first<any>().catch(() => ({ rank: 1 }))
      const rank = Number(rankRow?.rank || 1)
      if (usedCount + rank > maxUses) {
        await db.prepare(`UPDATE coupon_holds SET status = 'released', updated_at = ? WHERE id = ?`)
          .bind(nowIso, holdId).run().catch(() => null)
        return {
          ok: false,
          error: `Mã ${cp.code} vừa có khách khác giữ lượt cuối cùng! Nếu họ không thanh toán sau ${COUPON_HOLD_MINUTES} phút, mã sẽ tự mở lại.`,
          status: 400
        }
      }
    }
  }

  const totalHeldNow = await getActiveHoldCount(db, cp.id)
  const remainingAfterHold = maxUses > 0 ? Math.max(0, maxUses - usedCount - totalHeldNow) : null
  const discount = calcCouponDiscount(cp, subtotal)

  return {
    ok: true,
    coupon: cp,
    holdId,
    discount,
    expiresAt: newExpiresAt,
    remainingAfterHold
  }
}

/** Attach an existing hold to a newly created order & reset its 10-minute payment window */
export async function attachHoldToOrder(db: D1Database, holdId: number, orderId: number): Promise<string> {
  const nowIso = new Date().toISOString()
  const expiresAt = new Date(Date.now() + COUPON_HOLD_MS).toISOString()
  await db.prepare(
    `UPDATE coupon_holds SET order_id = ?, expires_at = ?, updated_at = ? WHERE id = ? AND status = 'held'`
  ).bind(orderId, expiresAt, nowIso, holdId).run()
  return expiresAt
}

/**
 * Mark an order's coupon hold as permanently consumed once payment succeeds.
 * Safe & idempotent: never double-increments `coupons.used_count`.
 */
export async function consumeOrderCoupon(db: D1Database, orderId: number, couponCode?: string | null, userId?: number): Promise<void> {
  if (!couponCode || couponCode === 'DEMO_FREE') return
  const nowIso = new Date().toISOString()

  // Already consumed? Do nothing!
  const already = await db.prepare(
    `SELECT id FROM coupon_holds WHERE order_id = ? AND status = 'consumed' LIMIT 1`
  ).bind(orderId).first<any>().catch(() => null)
  if (already?.id) return

  const held = await db.prepare(
    `SELECT id, coupon_id FROM coupon_holds WHERE order_id = ? AND status = 'held' ORDER BY id DESC LIMIT 1`
  ).bind(orderId).first<any>().catch(() => null)

  if (held?.id) {
    const upd = await db.prepare(
      `UPDATE coupon_holds SET status = 'consumed', updated_at = ? WHERE id = ? AND status = 'held'`
    ).bind(nowIso, held.id).run()
    if (upd.meta && upd.meta.changes > 0) {
      await db.prepare(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`).bind(held.coupon_id).run()
    }
    return
  }

  // Fallback (e.g. admin manually confirms an order whose hold already expired):
  const cp = await db.prepare(`SELECT id, code FROM coupons WHERE code = ?`).bind(String(couponCode).toUpperCase()).first<any>().catch(() => null)
  if (cp?.id && userId) {
    await db.prepare(
      `INSERT INTO coupon_holds (coupon_id, coupon_code, user_id, order_id, status, expires_at, updated_at)
       VALUES (?, ?, ?, ?, 'consumed', ?, ?)`
    ).bind(cp.id, cp.code, userId, orderId, nowIso, nowIso).run().catch(() => null)
    await db.prepare(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`).bind(cp.id).run().catch(() => null)
  }
}

/** Release any active hold when an order is cancelled before payment */
export async function releaseOrderCoupon(db: D1Database, orderId: number): Promise<void> {
  const nowIso = new Date().toISOString()
  await db.prepare(
    `UPDATE coupon_holds SET status = 'released', updated_at = ? WHERE order_id = ? AND status = 'held'`
  ).bind(nowIso, orderId).run().catch(() => null)
}

/** Get active hold info for a pending order (for live 10-min countdown UI) */
export async function getOrderActiveHold(db: D1Database, orderId: number): Promise<{ id: number; coupon_code: string; expires_at: string } | null> {
  const nowIso = new Date().toISOString()
  const row = await db.prepare(
    `SELECT id, coupon_code, expires_at FROM coupon_holds
     WHERE order_id = ? AND status = 'held' AND expires_at > ?
     ORDER BY id DESC LIMIT 1`
  ).bind(orderId, nowIso).first<any>().catch(() => null)
  return row ? { id: Number(row.id), coupon_code: String(row.coupon_code), expires_at: String(row.expires_at) } : null
}

/** Generate N unique random flash-sale codes (e.g. prefix "KS10-" -> "KS10-4K8M") */
export async function generateUniqueCouponCodes(db: D1Database, prefix: string, quantity: number): Promise<string[]> {
  const cleanPrefix = String(prefix || 'KS')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 12)
  const sep = cleanPrefix && !cleanPrefix.endsWith('-') && !cleanPrefix.endsWith('_') ? '-' : ''
  const targetCount = Math.min(100, Math.max(1, Math.floor(quantity)))

  const existingRes = await db.prepare('SELECT code FROM coupons').all()
  const taken = new Set<string>((existingRes.results || []).map((r: any) => String(r.code || '').toUpperCase()))
  const codes: string[] = []
  let guard = 0
  while (codes.length < targetCount && guard < targetCount * 20) {
    guard++
    const candidate = `${cleanPrefix}${sep}${genCode('', 5)}`
    if (!taken.has(candidate)) {
      taken.add(candidate)
      codes.push(candidate)
    }
  }
  return codes
}
