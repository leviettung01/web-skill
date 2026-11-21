/**
 * KhoSkill AI — Skill Tier Levels (VIP I – VIP IV & SKILL PRO),
 * Dual Currency (VND primary + USD parallel), and Membership Plan Engine.
 */

import { genCode } from './auth'

export const DEFAULT_USD_VND_RATE = 27000
export const DEFAULT_DAILY_DOWNLOAD_LIMIT = 50

export function getVietnamDayKey(now = new Date()): string {
  const vn = new Date(now.getTime() + 7 * 3600_000)
  return vn.toISOString().slice(0, 10)
}

export type SkillTierKey = 'vip1' | 'vip2' | 'vip3' | 'vip4' | 'pro'

export interface SkillTierMeta {
  key: SkillTierKey
  code: string           // 'VIP I', 'VIP II', 'VIP III', 'VIP IV', 'SKILL PRO'
  shortLabel: string     // 'VIP I'
  subtitle: string       // 'Skill Phổ thông'
  priceRangeVnd: string  // '~135.000đ'
  priceRangeUsd: string  // '~$5'
  suggestedPriceVnd: number
  isRetailOnly: boolean
  icon: string
  // Visual styles for light/dark badges & tier banner pills
  bannerGrad: string
  badgeCls: string
  adminBadgeCls: string
  accentText: string
}

export const SKILL_TIER_ORDER: SkillTierKey[] = ['vip1', 'vip2', 'vip3', 'vip4', 'pro']

export const SKILL_TIERS: Record<SkillTierKey, SkillTierMeta> = {
  vip1: {
    key: 'vip1',
    code: 'VIP I',
    shortLabel: 'VIP I',
    subtitle: 'Skill Phổ thông',
    priceRangeVnd: '135.000đ',
    priceRangeUsd: '~$5',
    suggestedPriceVnd: 135000,
    isRetailOnly: false,
    icon: 'fa-book-open',
    bannerGrad: 'from-blue-600 to-sky-500',
    badgeCls: 'bg-blue-500/20 border-blue-400/45 text-blue-200',
    adminBadgeCls: 'bg-blue-100 text-blue-800 border-blue-200',
    accentText: 'text-blue-400'
  },
  vip2: {
    key: 'vip2',
    code: 'VIP II',
    shortLabel: 'VIP II',
    subtitle: 'Skill Nâng cao',
    priceRangeVnd: '270.000đ',
    priceRangeUsd: '~$10',
    suggestedPriceVnd: 270000,
    isRetailOnly: false,
    icon: 'fa-layer-group',
    bannerGrad: 'from-emerald-600 to-teal-500',
    badgeCls: 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200',
    adminBadgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accentText: 'text-emerald-400'
  },
  vip3: {
    key: 'vip3',
    code: 'VIP III',
    shortLabel: 'VIP III',
    subtitle: 'Skill Cao cấp',
    priceRangeVnd: '399K – 599K',
    priceRangeUsd: '~$15 – $22',
    suggestedPriceVnd: 499000,
    isRetailOnly: false,
    icon: 'fa-crown',
    bannerGrad: 'from-amber-500 to-orange-500',
    badgeCls: 'bg-amber-500/20 border-amber-400/45 text-amber-200',
    adminBadgeCls: 'bg-amber-100 text-amber-800 border-amber-200',
    accentText: 'text-amber-400'
  },
  vip4: {
    key: 'vip4',
    code: 'VIP IV',
    shortLabel: 'VIP IV',
    subtitle: 'Skill Chuyên sâu',
    priceRangeVnd: '999.000đ',
    priceRangeUsd: '~$37',
    suggestedPriceVnd: 999000,
    isRetailOnly: false,
    icon: 'fa-gem',
    bannerGrad: 'from-violet-600 to-purple-600',
    badgeCls: 'bg-violet-500/20 border-violet-400/45 text-violet-200',
    adminBadgeCls: 'bg-violet-100 text-violet-800 border-violet-200',
    accentText: 'text-violet-400'
  },
  pro: {
    key: 'pro',
    code: 'SKILL PRO',
    shortLabel: 'PRO',
    subtitle: 'Chỉ bán lẻ riêng',
    priceRangeVnd: 'Tuỳ định giá',
    priceRangeUsd: 'Retail Only',
    suggestedPriceVnd: 1500000,
    isRetailOnly: true,
    icon: 'fa-star',
    bannerGrad: 'from-rose-600 via-fuchsia-600 to-amber-500',
    badgeCls: 'bg-gradient-to-r from-rose-500/25 to-amber-500/25 border-rose-400/50 text-amber-200',
    adminBadgeCls: 'bg-rose-100 text-rose-800 border-rose-200',
    accentText: 'text-rose-400'
  }
}

export function normalizeSkillTier(tier?: string | null, fallbackPrice?: number): SkillTierKey {
  const t = String(tier || '').trim().toLowerCase()
  if (t === 'vip1' || t === 'vip2' || t === 'vip3' || t === 'vip4' || t === 'pro') return t
  if (typeof fallbackPrice === 'number' && Number.isFinite(fallbackPrice)) {
    return inferSkillTierFromPrice(fallbackPrice)
  }
  return 'vip3'
}

export function inferSkillTierFromPrice(price: number): SkillTierKey {
  const p = Number(price) || 0
  if (p <= 199000) return 'vip1'
  if (p <= 349000) return 'vip2'
  if (p <= 799000) return 'vip3'
  if (p <= 1099000) return 'vip4'
  return 'pro'
}

export function getSkillTierMeta(tier?: string | null, fallbackPrice?: number): SkillTierMeta {
  return SKILL_TIERS[normalizeSkillTier(tier, fallbackPrice)]
}

export function getUsdRate(settings?: Record<string, string> | null): number {
  const raw = Number(settings?.usd_vnd_rate || DEFAULT_USD_VND_RATE)
  return Number.isFinite(raw) && raw >= 1000 ? raw : DEFAULT_USD_VND_RATE
}

/** Format VNĐ amount as parallel USD string (e.g., 135000 -> "~$5", 270000 -> "~$10") */
export function formatUSD(vnd: number | null | undefined, rate = DEFAULT_USD_VND_RATE, withTilde = true): string {
  const amt = Number(vnd || 0)
  const r = Number.isFinite(rate) && rate >= 1000 ? rate : DEFAULT_USD_VND_RATE
  if (amt <= 0) return '$0'
  const usd = amt / r
  const prefix = withTilde ? '~$' : '$'
  if (usd < 1) return `${prefix}${usd.toFixed(2)}`
  if (usd < 10 && Math.abs(usd - Math.round(usd)) >= 0.25) {
    return `${prefix}${usd.toFixed(1)}`
  }
  return `${prefix}${Math.round(usd).toLocaleString('en-US')}`
}

export interface MembershipPlan {
  id: number
  slug: string
  name: string
  group_type: 'premium' | 'starter' | string
  badge: string | null
  theme_color: string
  price_vnd: number
  duration_days: number
  vip1_quota: number   // -1 = Full (update liên tục), 0 = Không, >0 = số lượng
  vip2_quota: number   // -1 = Full (update liên tục), 0 = Không, >0 = số lượng
  vip3_quota: number   // -1 = Full, 0 = Không, >0 = số lượng
  vip4_quota: number   // -1 = Full, 0 = Không, >0 = số lượng
  daily_download_limit: number // Giới hạn tải Skill / ngày (mặc định 50)
  retail_discount_percent: number // % ưu đãi khi mua Skill lẻ (Black Diamond = 40)
  auto_update_note: string | null
  ideal_for: string | null
  est_value_vnd: number
  is_popular: number
  status: string
  sort_order: number
}

export interface UserMembership {
  id: number
  user_id: number
  plan_id: number
  order_id: number | null
  plan_name: string
  plan_slug: string
  vip1_quota: number
  vip2_quota: number
  vip3_quota: number
  vip4_quota: number
  vip1_used: number
  vip2_used: number
  vip3_used: number
  vip4_used: number
  daily_download_limit?: number
  retail_discount_percent?: number
  starts_at: string
  expires_at: string
  status: string
  created_at?: string
}

export const DEFAULT_MEMBERSHIP_PLANS: Omit<MembershipPlan, 'id'>[] = [
  // ---- GÓI CAO CẤP (PREMIUM PLANS) ----
  {
    slug: 'premium',
    name: 'PREMIUM',
    group_type: 'premium',
    badge: null,
    theme_color: 'violet',
    price_vnd: 699000,
    duration_days: 90,
    vip1_quota: -1,
    vip2_quota: -1,
    vip3_quota: 10,
    vip4_quota: 0,
    daily_download_limit: 50,
    retail_discount_percent: 0,
    auto_update_note: 'Full VIP I & VIP II (update liên tục)',
    ideal_for: 'Dùng thử 3 tháng · Full VIP I & II',
    est_value_vnd: 25000000,
    is_popular: 0,
    status: 'active',
    sort_order: 1
  },
  {
    slug: 'gold',
    name: 'GOLD',
    group_type: 'premium',
    badge: 'PHỔ BIẾN NHẤT',
    theme_color: 'orange',
    price_vnd: 999000,
    duration_days: 365,
    vip1_quota: -1,
    vip2_quota: -1,
    vip3_quota: 20,
    vip4_quota: 1,
    daily_download_limit: 50,
    retail_discount_percent: 0,
    auto_update_note: 'Full VIP I & VIP II (update liên tục)',
    ideal_for: 'Dùng cả năm, tối ưu chi phí nhất',
    est_value_vnd: 35000000,
    is_popular: 1,
    status: 'active',
    sort_order: 2
  },
  {
    slug: 'black-diamond',
    name: 'BLACK DIAMOND',
    group_type: 'premium',
    badge: 'CAO CẤP NHẤT',
    theme_color: 'obsidian',
    price_vnd: 1900000,
    duration_days: 365,
    vip1_quota: -1,
    vip2_quota: -1,
    vip3_quota: 20,
    vip4_quota: 5,
    daily_download_limit: 50,
    retail_discount_percent: 40,
    auto_update_note: 'Full VIP I & VIP II (update liên tục)',
    ideal_for: 'Agency / Team · Giảm 40% mua Skill lẻ',
    est_value_vnd: 50000000,
    is_popular: 0,
    status: 'active',
    sort_order: 3
  },
  // ---- GÓI CƠ BẢN (STARTER PLANS) ----
  {
    slug: 'basic',
    name: 'BASIC',
    group_type: 'starter',
    badge: null,
    theme_color: 'blue',
    price_vnd: 199000,
    duration_days: 10,
    vip1_quota: 10,
    vip2_quota: 0,
    vip3_quota: 0,
    vip4_quota: 0,
    daily_download_limit: 50,
    retail_discount_percent: 0,
    auto_update_note: null,
    ideal_for: 'Trải nghiệm ngắn hạn',
    est_value_vnd: 1350000,
    is_popular: 0,
    status: 'active',
    sort_order: 4
  },
  {
    slug: 'standard',
    name: 'STANDARD',
    group_type: 'starter',
    badge: null,
    theme_color: 'emerald',
    price_vnd: 299000,
    duration_days: 30,
    vip1_quota: 30,
    vip2_quota: 10,
    vip3_quota: 0,
    vip4_quota: 0,
    daily_download_limit: 50,
    retail_discount_percent: 0,
    auto_update_note: null,
    ideal_for: 'Dùng đều 1 tháng',
    est_value_vnd: 6750000,
    is_popular: 0,
    status: 'active',
    sort_order: 5
  },
  {
    slug: 'silver',
    name: 'SILVER',
    group_type: 'starter',
    badge: null,
    theme_color: 'purple',
    price_vnd: 499000,
    duration_days: 90,
    vip1_quota: 50,
    vip2_quota: 20,
    vip3_quota: 10,
    vip4_quota: 0,
    daily_download_limit: 50,
    retail_discount_percent: 0,
    auto_update_note: null,
    ideal_for: 'Làm nhiều dự án 3 tháng',
    est_value_vnd: 17140000,
    is_popular: 0,
    status: 'active',
    sort_order: 6
  }
]

export function formatDurationLabel(days: number): string {
  const d = Math.max(1, Number(days) || 30)
  if (d === 365) return '365 ngày (1 năm)'
  if (d === 90) return '90 ngày (3 tháng)'
  if (d === 180) return '180 ngày (6 tháng)'
  if (d === 30) return '30 ngày (1 tháng)'
  return `${d} ngày`
}

export function calcAvgCostPerSkill(plan: Pick<MembershipPlan, 'price_vnd' | 'vip1_quota' | 'vip2_quota' | 'vip3_quota' | 'vip4_quota'>): string {
  const hasFull = plan.vip1_quota < 0 || plan.vip2_quota < 0 || plan.vip3_quota < 0 || plan.vip4_quota < 0
  if (hasFull) {
    // Estimate over ~150+ skills in rolling library + fixed high-tier slots
    const estCount =
      (plan.vip1_quota < 0 ? 100 : Math.max(0, plan.vip1_quota)) +
      (plan.vip2_quota < 0 ? 60 : Math.max(0, plan.vip2_quota)) +
      (plan.vip3_quota < 0 ? 30 : Math.max(0, plan.vip3_quota)) +
      (plan.vip4_quota < 0 ? 10 : Math.max(0, plan.vip4_quota))
    const per = Math.max(1000, Math.round((plan.price_vnd / Math.max(1, estCount)) / 100) * 100)
    return `~${new Intl.NumberFormat('vi-VN').format(per)}đ/Skill`
  }
  const total = Math.max(1, plan.vip1_quota + plan.vip2_quota + plan.vip3_quota + plan.vip4_quota)
  const per = Math.round((plan.price_vnd / total) / 100) * 100
  return `${new Intl.NumberFormat('vi-VN').format(per)}đ/Skill`
}

/* ============================================================
   DATABASE HELPERS (SQLite D1 & Neon PostgreSQL Compatible)
   ============================================================ */

export async function getMembershipPlans(db: D1Database, includeInactive = false): Promise<MembershipPlan[]> {
  try {
    const sql = includeInactive
      ? 'SELECT * FROM membership_plans ORDER BY sort_order ASC, id ASC'
      : `SELECT * FROM membership_plans WHERE status='active' ORDER BY sort_order ASC, id ASC`
    const res = await db.prepare(sql).all()
    return (res.results || []) as unknown as MembershipPlan[]
  } catch {
    return DEFAULT_MEMBERSHIP_PLANS.map((p, i) => ({ ...p, id: i + 1 }))
  }
}

export async function getMembershipPlanBySlug(db: D1Database, slug: string): Promise<MembershipPlan | null> {
  try {
    const row = await db.prepare('SELECT * FROM membership_plans WHERE slug=?').bind(slug).first<any>()
    return row || null
  } catch {
    return null
  }
}

export async function getActiveUserMembership(db: D1Database, userId: number): Promise<UserMembership | null> {
  try {
    const nowIso = new Date().toISOString()
    // Expire outdated active records automatically
    await db.prepare(
      `UPDATE user_memberships SET status='expired' WHERE user_id=? AND status='active' AND expires_at <= ?`
    ).bind(userId, nowIso).run().catch(() => null)

    const row = await db.prepare(
      `SELECT * FROM user_memberships
       WHERE user_id=? AND status='active' AND expires_at > ?
       ORDER BY id DESC LIMIT 1`
    ).bind(userId, nowIso).first<any>()
    return row || null
  } catch {
    return null
  }
}

export function getTierQuotaInfo(m: UserMembership | null, tier: SkillTierKey): {
  eligible: boolean
  isFull: boolean
  quota: number
  used: number
  remaining: number
} {
  if (!m || tier === 'pro') {
    return { eligible: false, isFull: false, quota: 0, used: 0, remaining: 0 }
  }
  const quota = tier === 'vip1' ? Number(m.vip1_quota)
    : tier === 'vip2' ? Number(m.vip2_quota)
    : tier === 'vip3' ? Number(m.vip3_quota)
    : Number(m.vip4_quota)
  const used = tier === 'vip1' ? Number(m.vip1_used || 0)
    : tier === 'vip2' ? Number(m.vip2_used || 0)
    : tier === 'vip3' ? Number(m.vip3_used || 0)
    : Number(m.vip4_used || 0)
  if (quota < 0) {
    return { eligible: true, isFull: true, quota: -1, used, remaining: 999999 }
  }
  const remaining = Math.max(0, quota - used)
  return { eligible: remaining > 0, isFull: false, quota, used, remaining }
}

/**
 * Automatically grants licenses for all published skills in any tier where
 * the user's active membership has FULL (-1) unlimited rolling access
 * (e.g., PREMIUM / GOLD / BLACK DIAMOND -> Full VIP I & VIP II update liên tục).
 */
export async function syncUnlimitedMembershipSkills(db: D1Database, userId: number): Promise<number> {
  const m = await getActiveUserMembership(db, userId)
  if (!m) return 0

  const fullTiers: SkillTierKey[] = []
  if (Number(m.vip1_quota) < 0) fullTiers.push('vip1')
  if (Number(m.vip2_quota) < 0) fullTiers.push('vip2')
  if (Number(m.vip3_quota) < 0) fullTiers.push('vip3')
  if (Number(m.vip4_quota) < 0) fullTiers.push('vip4')
  if (fullTiers.length === 0) return 0

  let granted = 0
  try {
    const placeholders = fullTiers.map(() => '?').join(',')
    const missing = await db.prepare(
      `SELECT p.id, p.skill_tier
       FROM products p
       WHERE p.status='published' AND p.skill_tier IN (${placeholders})
         AND NOT EXISTS (SELECT 1 FROM licenses l WHERE l.user_id=? AND l.product_id=p.id)`
    ).bind(...fullTiers, userId).all()

    for (const prod of (missing.results || []) as any[]) {
      const key = `${genCode('', 4)}-${genCode('', 4)}-${genCode('', 4)}-${genCode('', 4)}`
      await db.prepare(
        `INSERT INTO licenses (user_id, product_id, order_id, license_key, source, membership_id)
         VALUES (?,?,?,?,?,?)`
      ).bind(userId, prod.id, m.order_id ?? null, key, 'membership', m.id).run().catch(() => null)
      await db.prepare(
        `INSERT INTO membership_claims (membership_id, user_id, product_id, skill_tier)
         VALUES (?,?,?,?)`
      ).bind(m.id, userId, prod.id, prod.skill_tier).run().catch(() => null)
      granted++
    }
  } catch {
    return granted
  }
  return granted
}

/**
 * Activates a membership plan for a user (from a paid order or manual admin grant).
 * If user already has an active membership, the new one becomes active and previous is marked 'upgraded'.
 */
export async function grantUserMembership(
  db: D1Database,
  opts: { userId: number; plan: MembershipPlan; orderId?: number | null }
): Promise<UserMembership | null> {
  const { userId, plan, orderId = null } = opts
  const now = new Date()
  const startsAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + Math.max(1, Number(plan.duration_days || 30)) * 86400_000).toISOString()

  // Mark any previously active membership as superseded
  await db.prepare(
    `UPDATE user_memberships SET status='upgraded' WHERE user_id=? AND status='active'`
  ).bind(userId).run().catch(() => null)

  const ins = await db.prepare(
    `INSERT INTO user_memberships
     (user_id, plan_id, order_id, plan_name, plan_slug,
      vip1_quota, vip2_quota, vip3_quota, vip4_quota,
      vip1_used, vip2_used, vip3_used, vip4_used,
      daily_download_limit, retail_discount_percent,
      starts_at, expires_at, status)
     VALUES (?,?,?,?,?,?,?,?,?,0,0,0,0,?,?,?,?,?)`
  ).bind(
    userId, plan.id, orderId, plan.name, plan.slug,
    Number(plan.vip1_quota || 0),
    Number(plan.vip2_quota || 0),
    Number(plan.vip3_quota || 0),
    Number(plan.vip4_quota || 0),
    Math.max(1, Number(plan.daily_download_limit || DEFAULT_DAILY_DOWNLOAD_LIMIT)),
    Math.min(100, Math.max(0, Number(plan.retail_discount_percent || 0))),
    startsAt, expiresAt, 'active'
  ).run()

  const newId = Number(ins.meta?.last_row_id || 0)
  // Auto-unlock all Full (-1) skills immediately
  await syncUnlimitedMembershipSkills(db, userId)

  if (newId) {
    const row = await db.prepare('SELECT * FROM user_memberships WHERE id=?').bind(newId).first<any>()
    return row || null
  }
  return getActiveUserMembership(db, userId)
}

export async function activateMembershipFromOrder(db: D1Database, order: any): Promise<UserMembership | null> {
  if (!order?.membership_plan_id) return null
  // Idempotency: if already created for this order_id, skip
  const exists = await db.prepare(
    `SELECT * FROM user_memberships WHERE order_id=? LIMIT 1`
  ).bind(order.id).first<any>().catch(() => null)
  if (exists) {
    await syncUnlimitedMembershipSkills(db, order.user_id)
    return exists
  }
  const plan = await db.prepare('SELECT * FROM membership_plans WHERE id=?').bind(order.membership_plan_id).first<any>()
  if (!plan) return null
  return grantUserMembership(db, { userId: order.user_id, plan, orderId: order.id })
}

/**
 * Claim a single Skill using the user's active membership quota.
 * Strictly blocks SKILL PRO ('pro') retail-only products.
 */
export async function claimSkillWithMembership(
  db: D1Database,
  userId: number,
  productId: number
): Promise<{ ok: true; message: string; licenseKey: string } | { ok: false; error: string; status?: number }> {
  const m = await getActiveUserMembership(db, userId)
  if (!m) {
    return { ok: false, error: 'Bạn chưa có gói Hội viên đang hoạt động. Hãy đăng ký tại Bảng giá.', status: 400 }
  }

  const product = await db.prepare(
    `SELECT id, name, slug, price, status, skill_tier, product_type FROM products WHERE id=?`
  ).bind(productId).first<any>()
  if (!product || product.status !== 'published') {
    return { ok: false, error: 'Sản phẩm không tồn tại hoặc chưa mở bán.', status: 404 }
  }

  const tier = normalizeSkillTier(product.skill_tier, product.price)
  if (tier === 'pro') {
    return { ok: false, error: 'SKILL PRO chỉ áp dụng bán lẻ trực tiếp — không nằm trong hạn mức gói Hội viên.', status: 400 }
  }

  // Already owned?
  const owned = await db.prepare(
    `SELECT id, license_key FROM licenses WHERE user_id=? AND product_id=?`
  ).bind(userId, productId).first<any>()
  if (owned) {
    return { ok: false, error: 'Bạn đã sở hữu Skill này rồi — mở mục "Sản phẩm của tôi" để sử dụng ngay.', status: 400 }
  }

  const info = getTierQuotaInfo(m, tier)
  const tierMeta = SKILL_TIERS[tier]
  if (!info.eligible) {
    const msg = info.quota === 0
      ? `Gói ${m.plan_name} không bao gồm lượt nhận ${tierMeta.code}. Bạn có thể mua lẻ hoặc nâng cấp gói cao hơn.`
      : `Bạn đã dùng hết ${info.quota}/${info.quota} lượt ${tierMeta.code} của gói ${m.plan_name}.`
    return { ok: false, error: msg, status: 400 }
  }

  // Enforce daily membership skill claim/download cap (default 50 skills/day, VN UTC+7)
  const dailyLimit = Math.max(1, Number(m.daily_download_limit || DEFAULT_DAILY_DOWNLOAD_LIMIT))
  const dayKey = getVietnamDayKey()
  const claimedTodayRow = await db.prepare(
    `SELECT COUNT(*) AS n FROM membership_claims WHERE user_id=? AND day_key=?`
  ).bind(userId, dayKey).first<any>().catch(() => ({ n: 0 }))
  if (Number(claimedTodayRow?.n || 0) >= dailyLimit) {
    return {
      ok: false,
      error: `Bạn đã đạt giới hạn nhận/tải tối đa ${dailyLimit} Skill/ngày của gói ${m.plan_name}. Hạn mức sẽ tự làm mới lúc 00:00 ngày mai.`,
      status: 429
    }
  }

  // Atomic quota increment for bounded tiers (prevents race condition)
  if (!info.isFull) {
    const colUsed = tier === 'vip1' ? 'vip1_used'
      : tier === 'vip2' ? 'vip2_used'
      : tier === 'vip3' ? 'vip3_used'
      : 'vip4_used'
    const colQuota = tier === 'vip1' ? 'vip1_quota'
      : tier === 'vip2' ? 'vip2_quota'
      : tier === 'vip3' ? 'vip3_quota'
      : 'vip4_quota'
    const upd = await db.prepare(
      `UPDATE user_memberships
       SET ${colUsed} = ${colUsed} + 1
       WHERE id = ? AND status = 'active' AND ${colUsed} < ${colQuota}`
    ).bind(m.id).run()
    if (!upd.meta || upd.meta.changes === 0) {
      return { ok: false, error: `Lượt ${tierMeta.code} của gói ${m.plan_name} vừa hết.`, status: 409 }
    }
  }

  const licenseKey = `${genCode('', 4)}-${genCode('', 4)}-${genCode('', 4)}-${genCode('', 4)}`
  await db.prepare(
    `INSERT INTO licenses (user_id, product_id, order_id, license_key, source, membership_id)
     VALUES (?,?,?,?,?,?)`
  ).bind(userId, productId, m.order_id ?? null, licenseKey, 'membership', m.id).run()

  await db.prepare(
    `INSERT INTO membership_claims (membership_id, user_id, product_id, skill_tier, day_key)
     VALUES (?,?,?,?,?)`
  ).bind(m.id, userId, productId, tier, dayKey).run().catch(() => null)

  await db.prepare('UPDATE products SET sold_count = sold_count + 1 WHERE id = ?').bind(productId).run().catch(() => null)

  return {
    ok: true,
    licenseKey,
    message: info.isFull
      ? `Đã mở khoá "${product.name}" (Miễn phí · Full ${tierMeta.code} gói ${m.plan_name})!`
      : `Đã mở khoá "${product.name}" bằng 1 lượt ${tierMeta.code} (còn ${Math.max(0, info.remaining - 1)}/${info.quota} lượt)!`
  }
}

/**
 * Computes automatic retail discount for active member (e.g., BLACK DIAMOND = 40% off retail skills).
 */
export function getMemberRetailDiscount(m: UserMembership | null): {
  percent: number
  planName: string
  calcDiscount: (subtotal: number) => number
  discountedPrice: (price: number) => number
} {
  const pct = m ? Math.min(100, Math.max(0, Number(m.retail_discount_percent || 0))) : 0
  const planName = m?.plan_name || ''
  return {
    percent: pct,
    planName,
    calcDiscount: (subtotal: number) => (pct > 0 && subtotal > 0 ? Math.floor((subtotal * pct) / 100) : 0),
    discountedPrice: (price: number) => (pct > 0 && price > 0 ? Math.max(0, price - Math.floor((price * pct) / 100)) : price)
  }
}

/**
 * Returns today's membership download usage (distinct skills downloaded today in VN timezone UTC+7).
 */
export async function getDailyDownloadUsage(
  db: D1Database,
  userId: number,
  membership?: UserMembership | null
): Promise<{ used: number; limit: number; remaining: number; dayKey: string }> {
  const dayKey = getVietnamDayKey()
  const m = membership !== undefined ? membership : await getActiveUserMembership(db, userId)
  const limit = Math.max(1, Number(m?.daily_download_limit || DEFAULT_DAILY_DOWNLOAD_LIMIT))
  const row = await db.prepare(
    `SELECT COUNT(*) AS n FROM membership_daily_downloads WHERE user_id=? AND day_key=?`
  ).bind(userId, dayKey).first<any>().catch(() => ({ n: 0 }))
  const used = Number(row?.n || 0)
  return { used, limit, remaining: Math.max(0, limit - used), dayKey }
}

/**
 * Enforces the daily download cap (default 50 distinct skills/day per membership plan).
 * - Retail purchased licenses (`source !== 'membership'`) are NOT restricted by membership daily cap.
 * - Re-downloading the same skill on the same day does NOT consume an extra slot.
 */
export async function checkAndRecordDailyDownload(
  db: D1Database,
  opts: { userId: number; productId: number; licenseSource?: string | null }
): Promise<{ ok: true; used: number; limit: number } | { ok: false; used: number; limit: number; error: string }> {
  const { userId, productId, licenseSource } = opts
  if (licenseSource !== 'membership') {
    return { ok: true, used: 0, limit: 0 }
  }

  const m = await getActiveUserMembership(db, userId)
  const limit = Math.max(1, Number(m?.daily_download_limit || DEFAULT_DAILY_DOWNLOAD_LIMIT))
  const dayKey = getVietnamDayKey()
  const nowIso = new Date().toISOString()

  // Already downloaded this exact skill today? Allow freely without incrementing distinct skill count
  const existing = await db.prepare(
    `SELECT id FROM membership_daily_downloads WHERE user_id=? AND product_id=? AND day_key=?`
  ).bind(userId, productId, dayKey).first<any>().catch(() => null)

  if (existing?.id) {
    await db.prepare(
      `UPDATE membership_daily_downloads SET download_count = download_count + 1, last_at = ? WHERE id = ?`
    ).bind(nowIso, existing.id).run().catch(() => null)
    const usage = await getDailyDownloadUsage(db, userId, m)
    return { ok: true, used: usage.used, limit }
  }

  const cntRow = await db.prepare(
    `SELECT COUNT(*) AS n FROM membership_daily_downloads WHERE user_id=? AND day_key=?`
  ).bind(userId, dayKey).first<any>().catch(() => ({ n: 0 }))
  const used = Number(cntRow?.n || 0)
  if (used >= limit) {
    return {
      ok: false,
      used,
      limit,
      error: `Bạn đã đạt giới hạn tải tối đa ${limit} Skill/ngày của gói Hội viên (${used}/${limit} Skill hôm nay). Hạn mức sẽ tự động đặt lại lúc 00:00 ngày mai (giờ Việt Nam).`
    }
  }

  await db.prepare(
    `INSERT INTO membership_daily_downloads (user_id, product_id, day_key, download_count, last_at)
     VALUES (?,?,?,1,?)`
  ).bind(userId, productId, dayKey, nowIso).run().catch(() => null)

  return { ok: true, used: used + 1, limit }
}
