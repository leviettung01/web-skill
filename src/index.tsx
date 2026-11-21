import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Bindings, Variables, SessionUser } from './lib/types'
import { getSession, setSession, clearSession, getSecret, hashPassword, verifyPassword, genCode, genLicenseKey } from './lib/auth'
import { slugify, formatVND, parseSafeDate } from './lib/utils'
import {
  genTokenHex, sha256Hex, isEmailConfigured, getEmailConfig, sendEmail, sendBatchEmails,
  buildVerificationEmail, buildPasswordResetEmail, buildOrderPaidEmail, buildProductUpdateEmail, buildAdminDirectEmail
} from './lib/email'
import {
  getGoogleConfig, getRequestOrigin, safeRedirectPath, signOAuthState, verifyOAuthState,
  buildGoogleAuthUrl, exchangeGoogleCode
} from './lib/oauth'
import {
  verifyWebhookAuth, extractTransactions, extractOrderCodes,
  normalizeDate, type NormalizedTx
} from './lib/webhook'

import { HomePage } from './pages/home'
import { ProductListPage } from './pages/products'
import { ProductDetailPage } from './pages/product-detail'
import { LoginPage, RegisterPage, ForgotPage, ResetPasswordPage, VerifyEmailResultPage } from './pages/auth'
import { CartPage, CheckoutPage, OrderPage } from './pages/cart'
import { AccountDashboard, MyProductsPage, OAuthConsentPage, MyOrdersPage, WishlistPage, AffiliateDashboard, ProfilePage, NotificationsPage } from './pages/account'
import {
  BlogListPage, BlogDetailPage, PricingPage, AboutPage, ContactPage,
  AffiliateLandingPage, DocPage, NotFoundPage
} from './pages/static'
import {
  AdminDashboard, AdminProducts, AdminProductForm, AdminOrders, AdminOrderDetail,
  AdminUsers, AdminUserDetail, AdminCategories, AdminCoupons, AdminPosts, AdminReviews, AdminTickets, AdminSettings,
  AdminBankTx
} from './pages/admin'
import { POLICY_DOCS } from './lib/docs'
import { pgDb, pgConnectionString } from './lib/pg'
import { cached, invalidateCache } from './lib/cache'
import {
  extractLicenseKey, authenticateMcpLicense, handleMcpJsonRpc,
  resolveMcpEndpoint, resolveMcpServerName,
  ensureUserMcpToken, rotateUserMcpToken, sha256Base64Url,
  extractVerifiedDomain, inferClientNameFromDomain
} from './lib/mcp'
import { ensureMcpMigration } from './lib/mcp-bootstrap'
import {
  COUPON_HOLD_MINUTES,
  releaseExpiredCouponHolds,
  releaseUserDraftHolds,
  validateAndHoldCoupon,
  attachHoldToOrder,
  consumeOrderCoupon,
  releaseOrderCoupon,
  getOrderActiveHold,
  generateUniqueCouponCodes
} from './lib/coupons'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Vercel/Node: khi không có D1 binding (c.env.DB) nhưng có POSTGRES_URL,
// dùng pgDb (Postgres) thay thế để cùng 1 codebase chạy được cả 2 nền tảng.
app.use('*', async (c, next) => {
  if (!c.env.DB) {
    const cs = (c.env as any).POSTGRES_URL || pgConnectionString()
    if (cs) (c.env as any).DB = pgDb
  }
  const pathname = new URL(c.req.url).pathname
  if (c.env.DB && !pathname.startsWith('/static/') && pathname !== '/favicon.ico' && !pathname.startsWith('/videos/')) {
    await ensureMcpMigration(c.env.DB, c.env)
  }
  await next()
})

const mcpCors = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'Accept', 'Mcp-Session-Id', 'Mcp-Protocol-Version', 'X-License-Key', 'X-Api-Key'],
  exposeHeaders: ['Mcp-Session-Id', 'WWW-Authenticate']
})
app.use('/api/mcp', mcpCors)
app.use('/api/mcp/*', mcpCors)
app.use('/.well-known/*', mcpCors)
app.use('/oauth/*', mcpCors)
app.use('/api/*', cors())

async function fetchSettings(db: D1Database): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  const rs = await db.prepare('SELECT key, value FROM settings').all()
  for (const r of rs.results as any[]) map[r.key] = r.value
  return map
}

/* ============ GLOBAL MIDDLEWARE ============ */
app.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  if (url.pathname.startsWith('/static/') || url.pathname === '/favicon.ico' || url.pathname === '/robots.txt' || url.pathname.startsWith('/videos/') || url.pathname === '/api/mcp' || url.pathname.startsWith('/api/mcp/')) {
    return next()
  }

  const [user, settings] = await Promise.all([
    getSession(c),
    cached('settings:all', 30000, async () => {
      try {
        return await fetchSettings(c.env.DB)
      } catch {
        return {}
      }
    })
  ])
  c.set('user', user)
  c.set('settings', settings)

  let cartCount = 0
  if (user) {
    try {
      const r = await c.env.DB.prepare('SELECT COUNT(*) c FROM cart_items WHERE user_id=?').bind(user.id).first<any>()
      cartCount = r?.c || 0
    } catch { }
  }
  c.set('cartCount', cartCount)

  await next()
})

app.use('*', async (c, next) => {
  if (c.req.method === 'GET' && !c.req.path.startsWith('/api/') && !c.req.path.startsWith('/static/')) {
    const refParam = (c.req.query('ref') || '').trim()
    if (refParam && /^[A-Za-z0-9_-]{3,20}$/.test(refParam)) {
      setCookie(c, 'khoskill_ref', refParam.toUpperCase(), {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 30 * 86400
      })
    }
    const u = c.get('user')
    if (u) {
      const cnt = await c.env.DB.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0')
        .bind(u.id).first<any>().catch(() => ({ n: 0 }))
      c.set('unreadNotifs', +(cnt?.n || 0))
    } else {
      c.set('unreadNotifs', 0)
    }
  } else {
    c.set('unreadNotifs', 0)
  }
  await next()
})

function base(c: any) {
  const u = new URL(c.req.url)
  return {
    user: c.get('user'),
    settings: c.get('settings'),
    cartCount: c.get('cartCount'),
    unreadNotifs: c.get('unreadNotifs') || 0,
    currentPath: u.pathname,
    currentQueryType: u.searchParams.get('type') || '',
    currentQuerySort: u.searchParams.get('sort') || ''
  }
}

async function requireAuth(c: any, next: any) {
  const u = c.get('user')
  if (!u) {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Vui lòng đăng nhập' }, 401)
    return c.redirect('/dang-nhap?next=' + encodeURIComponent(c.req.path))
  }
  await next()
}

async function requireAdmin(c: any, next: any) {
  const u = c.get('user')
  if (!u || u.role !== 'admin') {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Không có quyền truy cập' }, 403)
    return c.redirect('/dang-nhap?next=' + encodeURIComponent(c.req.path))
  }
  await next()
}

/* ============================================================
   PUBLIC PAGES
   ============================================================ */

app.get('/', async (c) => {
  const db = c.env.DB
  const data = await cached('home:bundle', 30000, async () => {
    const [cats, featured, mcpSkills, manualSkills, hot, newest, comingSoon, posts, reviews, stats] = await Promise.all([
      db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.status='published') product_count
                  FROM categories c ORDER BY c.sort_order`).all(),
      db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                  WHERE p.status='published' AND p.is_featured=1 ORDER BY (CASE WHEN p.product_type='mcp_skill' THEN 0 ELSE 1 END), p.sold_count DESC LIMIT 12`).all(),
      db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                  WHERE p.status='published' AND p.product_type='mcp_skill' ORDER BY p.id ASC LIMIT 12`).all(),
      db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                  WHERE p.status='published' AND p.product_type='skill' ORDER BY p.sold_count DESC LIMIT 8`).all(),
      db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                  WHERE p.status='published' ORDER BY p.sold_count DESC LIMIT 8`).all(),
      db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                  WHERE p.status='published' ORDER BY p.id DESC LIMIT 8`).all(),
      db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                  WHERE p.status='coming_soon' ORDER BY p.id ASC LIMIT 6`).all(),
      db.prepare(`SELECT * FROM posts WHERE status='published' ORDER BY id DESC LIMIT 4`).all(),
      db.prepare(`SELECT r.*, u.full_name, p.name product_name, p.slug product_slug
                  FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id
                  WHERE r.rating>=4 ORDER BY r.id DESC LIMIT 6`).all(),
      db.prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') products,
                         (SELECT COUNT(*) FROM products WHERE status='published' AND product_type='skill') manualSkills,
                         (SELECT COUNT(*) FROM products WHERE status='published' AND product_type='mcp_skill') mcpSkills,
                         (SELECT COUNT(*) FROM users) users,
                         (SELECT COALESCE(SUM(sold_count),0) FROM products) sold`).first<any>()
    ])
    return { cats, featured, mcpSkills, manualSkills, hot, newest, comingSoon, posts, reviews, stats }
  })
  return c.html(<HomePage {...base(c)}
    categories={data.cats.results as any} featured={data.featured.results as any}
    mcpSkills={data.mcpSkills.results as any} manualSkills={data.manualSkills.results as any}
    hot={data.hot.results as any}
    newest={data.newest.results as any} comingSoon={data.comingSoon.results as any} posts={data.posts.results as any}
    reviews={data.reviews.results as any} stats={data.stats as any} />)
})

/* -------- Product list / category / combo -------- */
async function renderProductList(c: any, opts: { catSlug?: string; comboOnly?: boolean }) {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  const cat = opts.catSlug || c.req.query('cat') || ''
  const sort = c.req.query('sort') || 'newest'
  const type = opts.comboOnly ? 'combo' : (c.req.query('type') || '')
  const minPrice = c.req.query('min') || ''
  const maxPrice = c.req.query('max') || ''
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 12

  const includeComingSoon = opts.comboOnly || ['course', 'chatbot', 'app', 'combo'].includes(type) || (!!cat && cat !== 'skill-video-ai' && cat !== 'skill-ai-agent-mcp')
  const where: string[] = [includeComingSoon ? `p.status IN ('published','coming_soon')` : `p.status='published'`]
  const binds: any[] = []
  if (q) { where.push(`(p.name LIKE ? OR p.short_desc LIKE ?)`); binds.push(`%${q}%`, `%${q}%`) }
  if (cat) { where.push(`c.slug = ?`); binds.push(cat) }
  if (type) { where.push(`p.product_type = ?`); binds.push(type) }
  if (minPrice) { where.push(`p.price >= ?`); binds.push(+minPrice) }
  if (maxPrice) { where.push(`p.price <= ?`); binds.push(+maxPrice) }

  const orderMap: Record<string, string> = {
    newest: 'p.id DESC', bestseller: 'p.sold_count DESC', hot: 'p.sold_count DESC', price_asc: 'p.price ASC',
    price_desc: 'p.price DESC', rating: 'p.rating DESC, p.rating_count DESC', featured: 'p.is_featured DESC, p.sold_count DESC'
  }
  const orderBy = orderMap[sort] || orderMap.newest
  const w = where.join(' AND ')

  const fetchList = () => Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${w}`).bind(...binds).first<any>(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE ${w} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all(),
    cached('categories:list', 30000, () => db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.status='published') product_count
                FROM categories c ORDER BY c.sort_order`).all()),
    opts.catSlug ? cached(`cat:slug:${opts.catSlug}`, 30000, () => db.prepare('SELECT * FROM categories WHERE slug=?').bind(opts.catSlug).first<any>()) : Promise.resolve(null)
  ])

  const cacheKey = q ? '' : `plist:${opts.comboOnly ? '1' : '0'}:${cat}:${type}:${sort}:${minPrice}:${maxPrice}:${page}`
  const [cntRow, rows, cats, currentCat] = cacheKey
    ? await cached(cacheKey, 20000, fetchList)
    : await fetchList()

  const total = cntRow?.n || 0
  const heading = opts.comboOnly ? 'Combo Trọn Bộ'
    : currentCat ? currentCat.name
      : q ? `Kết quả cho "${q}"`
        : type === 'mcp_skill' ? 'Skill AI Agent (MCP)'
          : type === 'skill' ? 'Skill AI (Tự tải & làm theo)'
            : 'Tất cả sản phẩm'
  const headingDesc = opts.comboOnly ? 'Gói combo tiết kiệm tới 60% so với mua lẻ từng sản phẩm — Hiện đang tạm thời chưa mở bán'
    : currentCat ? currentCat.description
      : type === 'mcp_skill' ? 'Skill kết nối trực tiếp dạng MCP cho Claude, Codex, Antigravity — AI Agent tự gọi tool và tạo video theo Skill'
        : type === 'skill' ? 'Bộ Skill đóng gói theo ngách & công cụ: tự tải tài liệu, prompt chuẩn và làm theo từng bước'
          : 'Khám phá kho Skill AI tự tải và dòng mới Skill AI Agent (MCP) kết nối trực tiếp Claude, Codex, Antigravity'
  const baseUrl = opts.comboOnly ? '/combo' : opts.catSlug ? `/danh-muc/${opts.catSlug}` : '/san-pham'

  return c.html(<ProductListPage {...base(c)}
    products={rows.results as any} categories={cats.results as any} total={total} page={page}
    totalPages={Math.ceil(total / perPage)} q={q} cat={opts.catSlug ? '' : cat} sort={sort}
    minPrice={minPrice} maxPrice={maxPrice} type={opts.comboOnly ? '' : type}
    heading={heading} headingDesc={headingDesc} baseUrl={baseUrl} currentCategory={currentCat} />)
}

app.get('/san-pham', (c) => renderProductList(c, {}))
app.get('/combo', (c) => renderProductList(c, { comboOnly: true }))
app.get('/danh-muc/:slug', (c) => renderProductList(c, { catSlug: c.req.param('slug') }))

/* -------- Product detail -------- */
app.get('/san-pham/:slug', async (c) => {
  const db = c.env.DB
  const slug = c.req.param('slug')
  const user = c.get('user')

  const p = await cached(`product:row:${slug}`, 20000, () =>
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug
      FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.status IN ('published','coming_soon')`).bind(slug).first<any>()
  )
  if (!p) return c.html(<NotFoundPage {...base(c)} />, 404)

  const [bundle, ownedRow, wishRow] = await Promise.all([
    cached(`product:extra:${p.id}`, 20000, async () => {
      const [related, comboItems, reviews, breakdown] = await Promise.all([
        db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                    WHERE p.status='published' AND p.id!=? ORDER BY (CASE WHEN p.category_id=? THEN 0 ELSE 1 END), p.sold_count DESC LIMIT 4`).bind(p.id, p.category_id).all(),
        p.product_type === 'combo'
          ? db.prepare(`SELECT p.* FROM combo_items ci JOIN products p ON p.id=ci.product_id WHERE ci.combo_id=?`).bind(p.id).all()
          : Promise.resolve({ results: [] }),
        db.prepare(`SELECT r.*, u.full_name FROM reviews r JOIN users u ON u.id=r.user_id
                    WHERE r.product_id=? AND r.status='approved' ORDER BY r.id DESC LIMIT 20`).bind(p.id).all(),
        db.prepare('SELECT rating, COUNT(*) n FROM reviews WHERE product_id=? GROUP BY rating').bind(p.id).all()
      ])
      return { related, comboItems, reviews, breakdown }
    }),
    user ? db.prepare('SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?').bind(user.id, p.id).first<any>() : Promise.resolve(null),
    user ? db.prepare('SELECT 1 x FROM wishlists WHERE user_id=? AND product_id=?').bind(user.id, p.id).first<any>() : Promise.resolve(null),
    db.prepare('UPDATE products SET view_count=view_count+1 WHERE id=?').bind(p.id).run().catch(() => null)
  ])

  const rb: Record<number, number> = {}
  for (const r of bundle.breakdown.results as any[]) rb[r.rating] = r.n

  const owned = !!ownedRow
  let canReview = false
  if (owned && user) {
    const has = await db.prepare('SELECT 1 x FROM reviews WHERE user_id=? AND product_id=?').bind(user.id, p.id).first<any>()
    canReview = !has
  }

  return c.html(<ProductDetailPage {...base(c)} product={p} related={bundle.related.results as any}
    comboItems={bundle.comboItems.results as any} reviews={bundle.reviews.results as any}
    owned={owned} inWishlist={!!wishRow} canReview={canReview} ratingBreakdown={rb}
    origin={getRequestOrigin(c)} />)
})

/* -------- Blog -------- */
app.get('/blog', async (c) => {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 9
  const where = q ? `status='published' AND (title LIKE ? OR excerpt LIKE ?)` : `status='published'`
  const binds = q ? [`%${q}%`, `%${q}%`] : []
  const runQuery = () => Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM posts WHERE ${where}`).bind(...binds).first<any>(),
    db.prepare(`SELECT * FROM posts WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .bind(...binds, perPage, (page - 1) * perPage).all()
  ])
  const [cnt, rows] = q ? await runQuery() : await cached(`blog:list:${page}`, 30000, runQuery)
  return c.html(<BlogListPage {...base(c)} posts={rows.results as any} page={page}
    totalPages={Math.ceil((cnt?.n || 0) / perPage)} q={q} />)
})

app.get('/blog/:slug', async (c) => {
  const db = c.env.DB
  const slug = c.req.param('slug')
  const post = await cached(`post:row:${slug}`, 30000, () =>
    db.prepare(`SELECT * FROM posts WHERE slug=? AND status='published'`).bind(slug).first<any>()
  )
  if (!post) return c.html(<NotFoundPage {...base(c)} />, 404)
  const [related] = await Promise.all([
    cached(`post:rel:${post.id}`, 30000, () =>
      db.prepare(`SELECT * FROM posts WHERE status='published' AND id!=? ORDER BY id DESC LIMIT 3`).bind(post.id).all()
    ),
    db.prepare('UPDATE posts SET view_count=view_count+1 WHERE id=?').bind(post.id).run().catch(() => null)
  ])
  return c.html(<BlogDetailPage {...base(c)} post={post} related={related.results as any} />)
})

/* -------- Static pages -------- */
app.get('/bang-gia', (c) => c.html(<PricingPage {...base(c)} />))
app.get('/lien-he', (c) => c.html(<ContactPage {...base(c)} />))
app.get('/affiliate', (c) => c.html(<AffiliateLandingPage {...base(c)}
  percent={+(c.get('settings').affiliate_percent || 20)} />))

app.get('/gioi-thieu', async (c) => {
  const stats = await cached('about:stats', 60000, () =>
    c.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') products,
      (SELECT COUNT(*) FROM users) users, (SELECT COALESCE(SUM(sold_count),0) FROM products) sold`).first<any>()
  )
  return c.html(<AboutPage {...base(c)} stats={stats} />)
})

for (const [path, doc] of Object.entries(POLICY_DOCS)) {
  app.get(path, (c) => c.html(<DocPage {...base(c)} heading={doc.heading} html={doc.html} />))
}

/* ============================================================
   NOTIFICATIONS & EMAIL TOKEN HELPERS
   ============================================================ */
async function createUserNotification(
  db: D1Database,
  opts: { userId: number; productId?: number | null; type?: string; title: string; message: string; linkUrl?: string | null }
) {
  await db.prepare(
    `INSERT INTO notifications (user_id, product_id, type, title, message, link_url) VALUES (?,?,?,?,?,?)`
  ).bind(opts.userId, opts.productId ?? null, opts.type || 'system', opts.title, opts.message, opts.linkUrl ?? null)
    .run().catch(() => null)
}

async function issueEmailToken(
  db: D1Database,
  opts: { userId: number; email: string; purpose: 'verify' | 'reset'; ttlMinutes?: number }
): Promise<{ rawToken?: string; waitSeconds?: number }> {
  const recent = await db.prepare(
    `SELECT created_at FROM email_tokens WHERE user_id=? AND purpose=? ORDER BY id DESC LIMIT 1`
  ).bind(opts.userId, opts.purpose).first<any>()
  if (recent?.created_at) {
    const createdMs = parseSafeDate(recent.created_at)?.getTime() ?? NaN
    if (Number.isFinite(createdMs)) {
      const diffMs = Date.now() - createdMs
      if (diffMs > -30_000 && diffMs < 60_000) {
        return { waitSeconds: Math.min(60, Math.max(1, Math.ceil((60_000 - Math.max(0, diffMs)) / 1000))) }
      }
    }
  }
  const rawToken = genTokenHex(32)
  const tokenHash = await sha256Hex(rawToken)
  const nowIso = new Date().toISOString()
  const expiresAt = new Date(Date.now() + (opts.ttlMinutes || 30) * 60_000).toISOString()
  await db.prepare(
    `INSERT INTO email_tokens (user_id, email, purpose, token_hash, expires_at, created_at) VALUES (?,?,?,?,?,?)`
  ).bind(opts.userId, opts.email, opts.purpose, tokenHash, expiresAt, nowIso).run()
  return { rawToken }
}

async function consumeEmailToken(
  db: D1Database,
  rawToken: string,
  purpose: 'verify' | 'reset'
): Promise<{ ok: true; tok: any } | { ok: false; reason: string }> {
  if (!rawToken || rawToken.length < 32) return { ok: false, reason: 'Liên kết không hợp lệ.' }
  const tokenHash = await sha256Hex(rawToken)
  const tok = await db.prepare(
    `SELECT * FROM email_tokens WHERE token_hash=? AND purpose=?`
  ).bind(tokenHash, purpose).first<any>()
  if (!tok) return { ok: false, reason: 'Liên kết không tồn tại hoặc không hợp lệ.' }
  if (tok.used_at) return { ok: false, reason: 'Liên kết này đã được sử dụng trước đó.' }
  if ((parseSafeDate(tok.expires_at)?.getTime() ?? 0) < Date.now()) {
    return { ok: false, reason: 'Liên kết đã hết hạn (30 phút). Vui lòng yêu cầu gửi lại link mới.' }
  }
  await db.prepare(`UPDATE email_tokens SET used_at=? WHERE id=? AND used_at IS NULL`)
    .bind(new Date().toISOString(), tok.id).run()
  return { ok: true, tok }
}

/* ============================================================
   AUTH
   ============================================================ */
app.get('/dang-nhap', (c) => {
  if (c.get('user')) return c.redirect('/tai-khoan')
  return c.html(<LoginPage {...base(c)}
    next={c.req.query('next')}
    registered={c.req.query('registered') === '1'}
    resetSuccess={c.req.query('reset') === '1'}
    oauthError={c.req.query('oauth_error')}
    googleEnabled={getGoogleConfig(c.env).enabled} />)
})
app.get('/dang-ky', (c) => {
  if (c.get('user')) return c.redirect('/tai-khoan')
  const ref = c.req.query('ref') || getCookie(c, 'khoskill_ref') || ''
  return c.html(<RegisterPage {...base(c)}
    ref={ref}
    oauthError={c.req.query('oauth_error')}
    googleEnabled={getGoogleConfig(c.env).enabled} />)
})
app.get('/quen-mat-khau', (c) => c.html(<ForgotPage {...base(c)} emailEnabled={isEmailConfigured(c.env)} />))
app.get('/dang-xuat', (c) => { clearSession(c); return c.redirect('/') })

app.get('/api/auth/google', async (c) => {
  const cfg = getGoogleConfig(c.env)
  if (!cfg.enabled) return c.redirect('/dang-nhap?oauth_error=not_configured')
  const origin = getRequestOrigin(c)
  const next = safeRedirectPath(c.req.query('next'), '/tai-khoan')
  const ref = (c.req.query('ref') || getCookie(c, 'khoskill_ref') || '').trim().toUpperCase()
  const nonce = genTokenHex(16)
  const signedState = await signOAuthState(
    { nonce, next, ...(ref ? { ref } : {}), exp: Date.now() + 600_000 },
    getSecret(c)
  )
  setCookie(c, 'oauth_state', signedState, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 600,
    secure: origin.startsWith('https://')
  })
  return c.redirect(buildGoogleAuthUrl({
    clientId: cfg.clientId,
    redirectUri: `${origin}/api/auth/google/callback`,
    state: nonce
  }))
})

app.get('/api/auth/google/callback', async (c) => {
  const errParam = c.req.query('error')
  if (errParam) {
    deleteCookie(c, 'oauth_state', { path: '/' })
    return c.redirect('/dang-nhap?oauth_error=cancelled')
  }
  const cfg = getGoogleConfig(c.env)
  if (!cfg.enabled) return c.redirect('/dang-nhap?oauth_error=not_configured')

  const code = c.req.query('code') || ''
  const state = c.req.query('state') || ''
  const stateCookie = getCookie(c, 'oauth_state') || ''
  deleteCookie(c, 'oauth_state', { path: '/' })

  const verified = await verifyOAuthState(stateCookie, getSecret(c))
  if (!code || !state || !verified || verified.nonce !== state) {
    return c.redirect('/dang-nhap?oauth_error=state_invalid')
  }

  try {
    const db = c.env.DB
    const origin = getRequestOrigin(c)
    const profile = await exchangeGoogleCode({
      code,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      redirectUri: `${origin}/api/auth/google/callback`
    })
    if (profile.email_verified === false) {
      return c.redirect('/dang-nhap?oauth_error=unverified')
    }
    const email = profile.email.trim().toLowerCase()
    const fullName = (profile.name || email.split('@')[0]).trim()
    const avatarUrl = profile.picture || null

    let u = await db.prepare('SELECT * FROM users WHERE google_id=? OR email=?')
      .bind(profile.sub, email).first<any>()

    if (u) {
      if (u.status === 'banned') return c.redirect('/dang-nhap?oauth_error=banned')
      await db.prepare(
        `UPDATE users SET google_id=?,
          avatar_url=COALESCE(NULLIF(avatar_url,''), ?),
          email_verified=1,
          email_verified_at=COALESCE(email_verified_at, CURRENT_TIMESTAMP),
          updated_at=CURRENT_TIMESTAMP
         WHERE id=?`
      ).bind(profile.sub, avatarUrl, u.id).run()
      await setSession(c, {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        avatar_url: u.avatar_url || avatarUrl,
        email_verified: 1
      })
      const defaultDest = u.role === 'admin' ? '/admin' : '/tai-khoan'
      const dest = verified.next && verified.next !== '/tai-khoan' ? verified.next : defaultDest
      return c.redirect(safeRedirectPath(dest, defaultDest))
    }

    let referred_by: number | null = null
    const refCode = (verified.ref || getCookie(c, 'khoskill_ref') || '').trim().toUpperCase()
    if (refCode) {
      const r = await db.prepare('SELECT id FROM users WHERE affiliate_code=?').bind(refCode).first<any>()
      if (r) referred_by = r.id
    }

    const oauthHash = 'OAUTH$' + genTokenHex(16)
    const affCode = genCode('AF', 6)
    const res = await db.prepare(
      `INSERT INTO users (email, password_hash, full_name, avatar_url, affiliate_code, referred_by, google_id, email_verified, email_verified_at)
       VALUES (?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP)`
    ).bind(email, oauthHash, fullName, avatarUrl, affCode, referred_by, profile.sub).run()

    const userId = res.meta.last_row_id as number
    await createUserNotification(db, {
      userId,
      type: 'system',
      title: 'Chào mừng đến với KhoSkill AI!',
      message: 'Tài khoản Google của bạn đã được xác minh tự động. Bạn có thể mua Skill AI hoặc kích hoạt Affiliate ngay.',
      linkUrl: '/san-pham'
    })
    await setSession(c, { id: userId, email, full_name: fullName, role: 'user', avatar_url: avatarUrl, email_verified: 1 })
    return c.redirect(safeRedirectPath(verified.next, '/tai-khoan'))
  } catch (err) {
    console.error('[GOOGLE_OAUTH]', err)
    return c.redirect('/dang-nhap?oauth_error=failed')
  }
})

app.post('/api/auth/register', async (c) => {
  const db = c.env.DB
  const b = await c.req.json<any>()
  const email = (b.email || '').trim().toLowerCase()
  const password = b.password || ''
  const full_name = (b.full_name || '').trim()

  if (!email || !password || !full_name) return c.json({ error: 'Vui lòng điền đầy đủ thông tin' }, 400)
  if (password.length < 6) return c.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'Email không hợp lệ' }, 400)

  const exists = await db.prepare('SELECT 1 x FROM users WHERE email=?').bind(email).first<any>()
  if (exists) return c.json({ error: 'Email này đã được đăng ký' }, 400)

  let referred_by: number | null = null
  const refInput = (b.ref || getCookie(c, 'khoskill_ref') || '').trim().toUpperCase()
  if (refInput) {
    const r = await db.prepare('SELECT id FROM users WHERE affiliate_code=?').bind(refInput).first<any>()
    if (r) referred_by = r.id
  }

  const hash = await hashPassword(password)
  const affCode = genCode('AF', 6)
  const res = await db.prepare(
    `INSERT INTO users (email, password_hash, full_name, phone, affiliate_code, referred_by) VALUES (?,?,?,?,?,?)`
  ).bind(email, hash, full_name, b.phone || null, affCode, referred_by).run()

  const userId = res.meta.last_row_id as number
  await createUserNotification(db, {
    userId,
    type: 'system',
    title: 'Tạo tài khoản thành công',
    message: 'Bạn có thể mua Skill ngay lập tức. Khi cần tham gia Affiliate hoặc nhận mail cập nhật phiên bản, hãy xác minh Gmail trong Hồ sơ.',
    linkUrl: '/tai-khoan/ho-so'
  })
  const user: SessionUser = { id: userId, email, full_name, role: 'user', email_verified: 0 }
  await setSession(c, user)
  return c.json({ ok: true, redirect: safeRedirectPath(b.next, '/tai-khoan') })
})

app.post('/api/auth/login', async (c) => {
  const db = c.env.DB
  const b = await c.req.json<any>()
  const email = (b.email || '').trim().toLowerCase()
  const u = await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first<any>()
  if (!u) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 400)
  if (u.status === 'banned') return c.json({ error: 'Tài khoản của bạn đã bị khoá' }, 403)
  if (String(u.password_hash || '').startsWith('OAUTH$')) {
    return c.json({ error: 'Tài khoản này đăng ký bằng Google. Hãy bấm "Tiếp tục với Google" hoặc đặt mật khẩu trong Hồ sơ.' }, 400)
  }
  const ok = await verifyPassword(b.password || '', u.password_hash)
  if (!ok) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 400)

  await setSession(c, {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    avatar_url: u.avatar_url,
    email_verified: u.email_verified || 0
  })
  const next = b.next && String(b.next).startsWith('/') && !String(b.next).startsWith('//')
    ? b.next : (u.role === 'admin' ? '/admin' : '/tai-khoan')
  return c.json({ ok: true, redirect: next })
})

app.get('/xac-minh-email', async (c) => {
  const db = c.env.DB
  const token = (c.req.query('token') || '').trim()
  const res = await consumeEmailToken(db, token, 'verify')
  if (!res.ok) {
    return c.html(<VerifyEmailResultPage {...base(c)} ok={false} message={res.reason} />, 400)
  }
  const tok = res.tok
  await db.prepare(
    `UPDATE users SET email_verified=1, email_verified_at=COALESCE(email_verified_at, CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(tok.user_id).run()
  await createUserNotification(db, {
    userId: tok.user_id,
    type: 'system',
    title: 'Email đã được xác minh',
    message: 'Địa chỉ email của bạn đã xác minh thành công. Chương trình Affiliate và thông báo cập nhật qua email đã sẵn sàng!',
    linkUrl: '/tai-khoan/affiliate'
  })
  const cur = c.get('user')
  if (cur && cur.id === tok.user_id) {
    await setSession(c, { ...cur, email_verified: 1 })
  }
  return c.html(<VerifyEmailResultPage {...base(c)} ok={true} email={tok.email}
    message="Email của bạn đã được xác minh thành công! Từ giờ bạn có thể kích hoạt Affiliate và nhận thông báo cập nhật Skill AI qua email." />)
})

app.post('/api/auth/forgot-password', async (c) => {
  if (!isEmailConfigured(c.env)) {
    return c.json({ error: 'Chức năng gửi email tự động chưa được kích hoạt. Vui lòng liên hệ Zalo hỗ trợ bên dưới.' }, 400)
  }
  const b = await c.req.json<any>()
  const email = (b.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Vui lòng nhập email hợp lệ' }, 400)
  }
  const u = await c.env.DB.prepare('SELECT id, email, full_name, status FROM users WHERE email=?').bind(email).first<any>()
  if (u && u.status === 'active') {
    const issued = await issueEmailToken(c.env.DB, { userId: u.id, email: u.email, purpose: 'reset', ttlMinutes: 30 })
    if (issued.waitSeconds) {
      return c.json({ error: `Bạn vừa gửi yêu cầu. Vui lòng đợi ${issued.waitSeconds} giây rồi thử lại.` }, 429)
    }
    if (issued.rawToken) {
      const origin = getRequestOrigin(c)
      const siteName = c.get('settings')?.site_name || 'KhoSkill AI'
      const resetUrl = `${origin}/dat-lai-mat-khau?token=${issued.rawToken}`
      await sendEmail(c.env, buildPasswordResetEmail({
        to: u.email,
        fullName: u.full_name,
        resetUrl,
        siteName,
        origin
      }))
    }
  }
  return c.json({ ok: true, message: 'Nếu email đã đăng ký, link đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra Hộp thư đến và mục Spam.' })
})

app.get('/dat-lai-mat-khau', async (c) => {
  const rawToken = (c.req.query('token') || '').trim()
  let invalidReason = ''
  if (!rawToken || rawToken.length < 32) {
    invalidReason = 'Liên kết đặt lại mật khẩu không hợp lệ.'
  } else {
    const tok = await c.env.DB.prepare('SELECT * FROM email_tokens WHERE token_hash=? AND purpose=?')
      .bind(await sha256Hex(rawToken), 'reset').first<any>()
    if (!tok) invalidReason = 'Liên kết đặt lại mật khẩu không tồn tại.'
    else if (tok.used_at) invalidReason = 'Liên kết này đã được sử dụng.'
    else if (new Date(tok.expires_at).getTime() < Date.now()) invalidReason = 'Liên kết đã hết hạn (30 phút). Hãy gửi yêu cầu mới.'
  }
  return c.html(<ResetPasswordPage {...base(c)} token={rawToken} invalidReason={invalidReason || undefined} />)
})

app.post('/api/auth/reset-password', async (c) => {
  const b = await c.req.json<any>()
  const token = (b.token || '').trim()
  const newPassword = String(b.new_password || '')
  const confirmPassword = String(b.confirm_password || '')
  if (newPassword.length < 6) return c.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400)
  if (newPassword !== confirmPassword) return c.json({ error: 'Mật khẩu nhập lại không khớp' }, 400)

  const res = await consumeEmailToken(c.env.DB, token, 'reset')
  if (!res.ok) return c.json({ error: res.reason }, 400)

  const newHash = await hashPassword(newPassword)
  await c.env.DB.prepare('UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(newHash, res.tok.user_id).run()
  return c.json({ ok: true, redirect: '/dang-nhap?reset=1' })
})

/* ============================================================
   CART / WISHLIST API
   ============================================================ */
app.post('/api/cart/add', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const { product_id } = await c.req.json<any>()
  const p = await db.prepare(`SELECT id, status FROM products WHERE id=?`).bind(product_id).first<any>()
  if (!p || p.status === 'draft') return c.json({ error: 'Sản phẩm không tồn tại' }, 404)
  if (p.status !== 'published') return c.json({ error: 'Sản phẩm này tạm thời chưa mở bán' }, 400)

  const owned = await db.prepare('SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?').bind(u.id, product_id).first<any>()
  if (owned) {
    const cnt = await db.prepare('SELECT COUNT(*) c FROM cart_items WHERE user_id=?').bind(u.id).first<any>()
    return c.json({ ok: true, owned: true, count: cnt?.c || 0 })
  }
  const exist = await db.prepare('SELECT 1 x FROM cart_items WHERE user_id=? AND product_id=?').bind(u.id, product_id).first<any>()
  if (!exist) await db.prepare('INSERT INTO cart_items (user_id, product_id) VALUES (?,?)').bind(u.id, product_id).run()
  const cnt = await db.prepare('SELECT COUNT(*) c FROM cart_items WHERE user_id=?').bind(u.id).first<any>()
  return c.json({ ok: true, exists: !!exist, count: cnt?.c || 0 })
})

app.post('/api/cart/remove', requireAuth, async (c) => {
  const u = c.get('user')!
  const { product_id } = await c.req.json<any>()
  await c.env.DB.prepare('DELETE FROM cart_items WHERE user_id=? AND product_id=?').bind(u.id, product_id).run()
  const cnt = await c.env.DB.prepare('SELECT COUNT(*) c FROM cart_items WHERE user_id=?').bind(u.id).first<any>()
  return c.json({ ok: true, count: cnt?.c || 0 })
})

app.post('/api/wishlist/toggle', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const { product_id } = await c.req.json<any>()
  const ex = await db.prepare('SELECT id FROM wishlists WHERE user_id=? AND product_id=?').bind(u.id, product_id).first<any>()
  if (ex) { await db.prepare('DELETE FROM wishlists WHERE id=?').bind(ex.id).run(); return c.json({ ok: true, added: false }) }
  await db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?,?)').bind(u.id, product_id).run()
  return c.json({ ok: true, added: true })
})

app.get('/gio-hang', requireAuth, async (c) => {
  const u = c.get('user')!
  const rows = await c.env.DB.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=? AND p.status='published' ORDER BY ci.id DESC`
  ).bind(u.id).all()
  const items = rows.results as any[]
  return c.html(<CartPage {...base(c)} items={items} subtotal={items.reduce((s, i) => s + i.price, 0)} />)
})

/* ============================================================
   CHECKOUT & ORDERS
   ============================================================ */
function isDemoFreeUser(env: any, email?: string | null): boolean {
  if (!email) return false
  const raw = (
    (env && typeof env.DEMO_FREE_EMAILS === 'string' ? env.DEMO_FREE_EMAILS : '') ||
    (typeof process !== 'undefined' && process.env && typeof process.env.DEMO_FREE_EMAILS === 'string' ? process.env.DEMO_FREE_EMAILS : '')
  ).trim()
  if (!raw) return false
  const target = email.trim().toLowerCase()
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).includes(target)
}

app.get('/thanh-toan', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const rows = await db.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=? AND p.status='published'`
  ).bind(u.id).all()
  const items = rows.results as any[]
  if (items.length === 0) return c.redirect('/gio-hang')
  const me = await db.prepare('SELECT balance FROM users WHERE id=?').bind(u.id).first<any>()
  return c.html(<CheckoutPage {...base(c)} items={items} subtotal={items.reduce((s, i) => s + i.price, 0)} balance={me?.balance || 0} isDemoFree={isDemoFreeUser(c.env, u.email)} />)
})

app.post('/api/coupons/check', requireAuth, async (c) => {
  const u = c.get('user')!
  const { code, subtotal } = await c.req.json<any>()
  const res = await validateAndHoldCoupon({
    db: c.env.DB,
    code: String(code || ''),
    userId: u.id,
    subtotal: Number(subtotal) || 0
  })
  if (!res.ok) return c.json({ error: res.error }, (res.status || 400) as any)
  return c.json({
    ok: true,
    discount: res.discount,
    code: res.coupon.code,
    hold_expires_at: res.expiresAt,
    hold_minutes: COUPON_HOLD_MINUTES,
    remaining_after_hold: res.remainingAfterHold
  })
})

app.post('/api/coupons/release', requireAuth, async (c) => {
  const u = c.get('user')!
  await releaseUserDraftHolds(c.env.DB, u.id)
  return c.json({ ok: true })
})

async function grantLicenses(db: D1Database, userId: number, orderId: number) {
  const items = await db.prepare('SELECT product_id FROM order_items WHERE order_id=?').bind(orderId).all()
  for (const it of items.results as any[]) {
    // combo → cấp cả sản phẩm con
    const p = await db.prepare('SELECT product_type FROM products WHERE id=?').bind(it.product_id).first<any>()
    const ids = [it.product_id]
    if (p?.product_type === 'combo') {
      const ci = await db.prepare('SELECT product_id FROM combo_items WHERE combo_id=?').bind(it.product_id).all()
      for (const x of ci.results as any[]) ids.push(x.product_id)
    }
    for (const pid of ids) {
      const ex = await db.prepare('SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?').bind(userId, pid).first<any>()
      if (!ex) {
        await db.prepare('INSERT INTO licenses (user_id, product_id, order_id, license_key) VALUES (?,?,?,?)')
          .bind(userId, pid, orderId, genLicenseKey()).run()
      }
      await db.prepare('UPDATE products SET sold_count=sold_count+1 WHERE id=?').bind(pid).run()
    }
  }
}

app.post('/api/orders/create', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const b = await c.req.json<any>()
  const rows = await db.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=?`
  ).bind(u.id).all()
  const items = rows.results as any[]
  if (items.length === 0) return c.json({ error: 'Giỏ hàng trống' }, 400)
  if (items.some(i => i.status !== 'published')) {
    return c.json({ error: 'Giỏ hàng có sản phẩm chưa mở bán. Vui lòng xóa khỏi giỏ hàng trước khi thanh toán.' }, 400)
  }

  const demoFree = isDemoFreeUser(c.env, u.email)
  const subtotal = items.reduce((s, i) => s + i.price, 0)
  let discount = 0, couponCode: string | null = null, heldCouponId: number | null = null
  if (demoFree) {
    discount = subtotal
    couponCode = 'DEMO_FREE'
  } else if (b.coupon_code) {
    const holdRes = await validateAndHoldCoupon({
      db,
      code: String(b.coupon_code),
      userId: u.id,
      subtotal
    })
    if (!holdRes.ok) {
      return c.json({ error: holdRes.error }, (holdRes.status || 400) as any)
    }
    discount = holdRes.discount
    couponCode = holdRes.coupon.code
    heldCouponId = holdRes.holdId
  } else {
    // User placed order without coupon -> release any draft hold they held during checkout
    await releaseUserDraftHolds(db, u.id)
  }
  const total = demoFree ? 0 : Math.max(0, subtotal - discount)
  const pm = demoFree ? 'demo_free' : (['bank', 'momo', 'balance'].includes(b.payment_method) ? b.payment_method : 'bank')

  // Thanh toán bằng ví hoặc tài khoản Demo Test miễn phí 0đ
  let status = demoFree ? 'paid' : 'pending'
  if (!demoFree && pm === 'balance') {
    const me = await db.prepare('SELECT balance FROM users WHERE id=?').bind(u.id).first<any>()
    if ((me?.balance || 0) < total) return c.json({ error: 'Số dư ví không đủ' }, 400)
    await db.prepare('UPDATE users SET balance=balance-? WHERE id=?').bind(total, u.id).run()
    status = 'paid'
  }

  const code = genCode('DH', 8)
  const ord = await db.prepare(
    `INSERT INTO orders (order_code, user_id, subtotal, discount, total, coupon_code, payment_method, status, note, paid_at, paid_amount, paid_via)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(code, u.id, subtotal, discount, total, couponCode, pm, status, b.note || (demoFree ? 'Đơn test miễn phí (Demo Account)' : null),
    status === 'paid' ? new Date().toISOString() : null,
    status === 'paid' ? total : null,
    demoFree ? 'demo_free' : (status === 'paid' ? 'balance' : null)).run()
  const orderId = ord.meta.last_row_id as number

  if (heldCouponId) {
    await attachHoldToOrder(db, heldCouponId, orderId)
  }

  for (const it of items) {
    await db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price) VALUES (?,?,?,?)')
      .bind(orderId, it.id, it.name, it.price).run()
  }
  await db.prepare('DELETE FROM cart_items WHERE user_id=?').bind(u.id).run()

  if (status === 'paid') {
    if (!demoFree && couponCode) {
      await consumeOrderCoupon(db, orderId, couponCode, u.id)
    }
    await grantLicenses(db, u.id, orderId)
    if (!demoFree) await creditAffiliate(db, u.id, total)
    await notifyOrderPaid(c.env, db, { id: orderId, order_code: code, user_id: u.id, total }, getRequestOrigin(c))
  }
  return c.json({ ok: true, order_code: code })
})

async function creditAffiliate(db: D1Database, userId: number, total: number) {
  const me = await db.prepare('SELECT referred_by, full_name FROM users WHERE id=?').bind(userId).first<any>()
  if (!me?.referred_by) return
  const refUser = await db.prepare('SELECT id, email_verified, status FROM users WHERE id=?').bind(me.referred_by).first<any>()
  if (!refUser || refUser.status !== 'active' || refUser.email_verified !== 1) return

  const st = await db.prepare(`SELECT value FROM settings WHERE key='affiliate_percent'`).first<any>()
  const pct = +(st?.value || 20)
  const commission = Math.floor(total * pct / 100)
  if (commission <= 0) return
  await db.prepare('UPDATE users SET affiliate_earned=affiliate_earned+?, balance=balance+? WHERE id=?')
    .bind(commission, commission, me.referred_by).run()
  await createUserNotification(db, {
    userId: me.referred_by,
    type: 'order',
    title: `Nhận hoa hồng Affiliate +${formatVND(commission)}`,
    message: `Thành viên ${me.full_name || 'bạn giới thiệu'} vừa thanh toán đơn hàng. Hoa hồng ${pct}% đã được cộng vào ví của bạn.`,
    linkUrl: '/tai-khoan/affiliate'
  })
}

async function notifyOrderPaid(env: any, db: D1Database, order: any, origin = 'https://khoskill.site') {
  try {
    const [buyer, licenses] = await Promise.all([
      db.prepare('SELECT id, email, full_name, status FROM users WHERE id=?').bind(order.user_id).first<any>(),
      db.prepare(
        `SELECT l.license_key, p.name product_name, p.download_url, p.doc_url,
                p.product_type, p.slug, p.mcp_endpoint, p.mcp_server_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         LEFT JOIN licenses l ON l.user_id = ? AND l.product_id = oi.product_id
         WHERE oi.order_id = ? ORDER BY oi.id`
      ).bind(order.user_id, order.id).all()
    ])
    if (!buyer) return
    const licList = licenses.results as any[]
    const names = licList.map(x => x.product_name).join(', ')
    await createUserNotification(db, {
      userId: buyer.id,
      type: 'order',
      title: `Đơn hàng ${order.order_code} đã kích hoạt thành công`,
      message: names
        ? `Hệ thống đã cấp ${licList.length} License Key cho: ${names}. Truy cập "Sản phẩm của tôi" để lấy key và tải tài liệu.`
        : `Đơn hàng ${order.order_code} đã thanh toán thành công.`,
      linkUrl: '/tai-khoan/san-pham'
    })
    if (isEmailConfigured(env) && buyer.email && buyer.status === 'active') {
      const siteSet = await db.prepare(`SELECT value FROM settings WHERE key='site_name'`).first<any>().catch(() => null)
      await sendEmail(env, buildOrderPaidEmail({
        to: buyer.email,
        fullName: buyer.full_name,
        orderCode: order.order_code,
        totalFormatted: formatVND(order.total || 0),
        items: licList,
        accountUrl: `${origin}/tai-khoan/san-pham`,
        siteName: siteSet?.value || 'KhoSkill AI',
        origin
      }))
    }
  } catch (err) {
    console.error('[NOTIFY_ORDER_PAID]', err)
  }
}

/* ============================================================
 *  THANH TOÁN ĐƠN HÀNG (settleOrder)
 *  Dùng chung cho: webhook ngân hàng, admin xác nhận, đối soát thủ công
 * ========================================================== */
async function settleOrder(
  db: D1Database,
  order: any,
  opts: { paidVia: string; paidAmount: number; bankTxId?: number | null; env?: any; origin?: string }
) {
  await db.prepare(
    `UPDATE orders SET status='paid', paid_at=?, paid_amount=?, paid_via=?, bank_tx_id=? WHERE id=?`
  ).bind(new Date().toISOString(), opts.paidAmount, opts.paidVia, opts.bankTxId ?? null, order.id).run()

  if (order.coupon_code && order.coupon_code !== 'DEMO_FREE') {
    await consumeOrderCoupon(db, order.id, order.coupon_code, order.user_id)
  }
  await grantLicenses(db, order.user_id, order.id)
  await creditAffiliate(db, order.user_id, order.total)
  await notifyOrderPaid(opts.env, db, order, opts.origin)
}

/* ============================================================
 *  WEBHOOK NGÂN HÀNG — SePay / Casso
 *  Endpoint: POST /api/webhook/bank
 *  Header:   Authorization: Apikey <webhook_api_key>
 * ========================================================== */

/** Xử lý 1 giao dịch đã chuẩn hoá -> lưu DB -> đối soát -> cấp hàng */
async function processTransaction(
  db: D1Database,
  tx: NormalizedTx,
  rawPayload: string,
  tolerance: number,
  env?: any,
  origin?: string
): Promise<{ tx_id: string; status: string; order?: string; message: string }> {
  // --- Chống xử lý trùng (idempotency) ---
  const dup = await db.prepare(
    `SELECT id, match_status, matched_order_code FROM bank_transactions WHERE provider=? AND provider_tx_id=?`
  ).bind(tx.provider, tx.providerTxId).first<any>()
  if (dup) {
    return {
      tx_id: tx.providerTxId, status: dup.match_status, order: dup.matched_order_code,
      message: 'Giao dịch đã được xử lý trước đó (bỏ qua)'
    }
  }

  // --- Bỏ qua giao dịch tiền ra ---
  if (tx.amountIn <= 0) {
    await insertTx(db, tx, rawPayload, {
      matchStatus: 'ignored', note: 'Giao dịch tiền ra hoặc số tiền = 0'
    })
    return { tx_id: tx.providerTxId, status: 'ignored', message: 'Giao dịch tiền ra, bỏ qua' }
  }

  // --- Tách mã đơn từ nội dung CK ---
  const codes = extractOrderCodes(tx.content)
  if (codes.length === 0) {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: 'unmatched', note: 'Không tìm thấy mã đơn trong nội dung chuyển khoản'
    })
    return {
      tx_id: tx.providerTxId, status: 'unmatched',
      message: `Không tìm thấy mã đơn (bank_tx #${id}) — cần đối soát thủ công`
    }
  }

  // --- Tìm đơn hàng khớp (dọn các mã giữ tạm hết hạn 10 phút trước khi đối soát) ---
  await releaseExpiredCouponHolds(db)
  let order: any = null
  let matchedCode = ''
  for (const code of codes) {
    const o = await db.prepare('SELECT * FROM orders WHERE order_code=?').bind(code).first<any>()
    if (o) { order = o; matchedCode = code; break }
  }

  if (!order) {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: 'unmatched', matchedOrderCode: codes[0],
      note: `Mã ${codes.join(', ')} không tồn tại trong hệ thống`
    })
    return {
      tx_id: tx.providerTxId, status: 'unmatched', order: codes[0],
      message: `Mã đơn ${codes[0]} không tồn tại (bank_tx #${id})`
    }
  }

  // --- Đơn đã thanh toán trước đó ---
  if (order.status === 'paid') {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: 'duplicate', matchedOrderId: order.id, matchedOrderCode: matchedCode,
      note: 'Đơn hàng đã ở trạng thái paid — có thể khách chuyển khoản 2 lần'
    })
    return {
      tx_id: tx.providerTxId, status: 'duplicate', order: matchedCode,
      message: `Đơn ${matchedCode} đã thanh toán trước đó (bank_tx #${id}) — kiểm tra hoàn tiền`
    }
  }

  // --- Đơn đã huỷ/hoàn ---
  if (order.status !== 'pending') {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: 'amount_mismatch', matchedOrderId: order.id, matchedOrderCode: matchedCode,
      note: `Đơn đang ở trạng thái '${order.status}', không thể tự động cấp hàng`
    })
    return {
      tx_id: tx.providerTxId, status: 'order_not_pending', order: matchedCode,
      message: `Đơn ${matchedCode} đang ở trạng thái ${order.status} (bank_tx #${id})`
    }
  }

  // --- Kiểm tra số tiền ---
  if (tx.amountIn + tolerance < order.total) {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: 'amount_mismatch', matchedOrderId: order.id, matchedOrderCode: matchedCode,
      note: `Thiếu tiền: nhận ${tx.amountIn}đ / cần ${order.total}đ`
    })
    return {
      tx_id: tx.providerTxId, status: 'amount_mismatch', order: matchedCode,
      message: `Đơn ${matchedCode}: nhận ${tx.amountIn}đ nhưng cần ${order.total}đ (bank_tx #${id})`
    }
  }

  // --- ✅ KHỚP: lưu giao dịch + cấp hàng ---
  const txId = await insertTx(db, tx, rawPayload, {
    matchStatus: 'matched', matchedOrderId: order.id, matchedOrderCode: matchedCode,
    note: tx.amountIn > order.total
      ? `Khách chuyển thừa ${tx.amountIn - order.total}đ` : 'Khớp chính xác'
  })

  await settleOrder(db, order, { paidVia: 'webhook', paidAmount: tx.amountIn, bankTxId: txId, env, origin })

  // Chuyển tiền thừa vào ví khách (nếu có)
  const excess = tx.amountIn - order.total
  if (excess > 0) {
    await db.prepare('UPDATE users SET balance=balance+? WHERE id=?').bind(excess, order.user_id).run()
  }

  return {
    tx_id: tx.providerTxId, status: 'matched', order: matchedCode,
    message: `✅ Đã xác nhận đơn ${matchedCode} (${tx.amountIn}đ) và cấp quyền tải`
  }
}

/** Ghi giao dịch vào bảng bank_transactions, trả về id */
async function insertTx(
  db: D1Database, tx: NormalizedTx, rawPayload: string,
  o: { matchStatus: string; matchedOrderId?: number | null; matchedOrderCode?: string | null; note?: string }
): Promise<number> {
  const r = await db.prepare(
    `INSERT INTO bank_transactions
      (provider, provider_tx_id, gateway, account_number, transaction_date,
       amount_in, amount_out, accumulated, content, reference_code,
       matched_order_id, matched_order_code, match_status, note, raw_payload)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    tx.provider, tx.providerTxId, tx.gateway, tx.accountNumber, normalizeDate(tx.transactionDate),
    tx.amountIn, tx.amountOut, tx.accumulated, tx.content, tx.referenceCode,
    o.matchedOrderId ?? null, o.matchedOrderCode ?? null, o.matchStatus, o.note ?? null,
    rawPayload.slice(0, 4000)
  ).run()
  return r.meta.last_row_id as number
}

// Endpoint chính — cấu hình URL này trong dashboard SePay/Casso
app.post('/api/webhook/bank', async (c) => {
  const db = c.env.DB

  // Đọc cấu hình
  const st = await db.prepare(
    `SELECT key, value FROM settings WHERE key IN ('webhook_api_key','payment_provider','amount_tolerance')`
  ).all()
  const cfg: Record<string, string> = {}
  for (const r of st.results as any[]) cfg[r.key] = r.value

  // 1. Xác thực
  if (!verifyWebhookAuth(c.req.raw.headers, cfg.webhook_api_key || '')) {
    return c.json({ success: false, error: 'Unauthorized: sai hoặc thiếu API key' }, 401)
  }

  // 2. Parse payload
  let body: any
  const rawText = await c.req.text()
  try { body = JSON.parse(rawText) } catch {
    return c.json({ success: false, error: 'Payload không phải JSON hợp lệ' }, 400)
  }

  const provider = cfg.payment_provider === 'casso' ? 'casso' : 'sepay'
  const txs = extractTransactions(provider, body)
  if (txs.length === 0) return c.json({ success: true, message: 'Không có giao dịch nào', results: [] })

  // 3. Xử lý từng giao dịch
  const tolerance = +(cfg.amount_tolerance || 0)
  const origin = getRequestOrigin(c)
  const results: any[] = []
  for (const tx of txs) {
    try {
      results.push(await processTransaction(db, tx, rawText, tolerance, c.env, origin))
    } catch (err: any) {
      results.push({ tx_id: tx.providerTxId, status: 'error', message: String(err?.message || err) })
    }
  }

  // SePay & Casso đều chỉ cần HTTP 200 + { success: true }
  return c.json({ success: true, processed: results.length, results })
})

/* --- Khách bấm "Tôi đã chuyển khoản": KHÔNG tự cấp hàng nữa --- */
app.post('/api/orders/confirm', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  await releaseExpiredCouponHolds(db)
  const { order_code } = await c.req.json<any>()
  const o = await db.prepare('SELECT * FROM orders WHERE order_code=? AND user_id=?')
    .bind(order_code, u.id).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)
  if (o.status === 'paid') return c.json({ ok: true, status: 'paid', message: 'Đơn đã được thanh toán' })
  if (o.status !== 'pending') return c.json({ error: 'Đơn hàng đã huỷ hoặc hết thời gian giữ mã giảm giá' }, 400)

  const st = await db.prepare(`SELECT value FROM settings WHERE key='auto_confirm_manual'`).first<any>()
  const autoConfirm = st?.value === '1'

  if (autoConfirm) {
    // Chế độ DEMO (chỉ bật khi chưa gắn webhook thật)
    await settleOrder(db, o, { paidVia: 'manual', paidAmount: o.total, env: c.env, origin: getRequestOrigin(c) })
    return c.json({ ok: true, status: 'paid', message: 'Đã xác nhận (chế độ demo)' })
  }

  // Chế độ THẬT: chỉ ghi nhận, chờ webhook ngân hàng đối soát
  return c.json({
    ok: true, status: 'pending',
    message: 'Đã ghi nhận. Hệ thống đang kiểm tra giao dịch, thường mất 10–60 giây. Trang sẽ tự cập nhật.'
  })
})

/* --- Khách tự huỷ đơn chờ thanh toán (trả lại mã giảm giá ngay lập tức) --- */
app.post('/api/orders/:code/cancel', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  await releaseExpiredCouponHolds(db)
  const o = await db.prepare('SELECT * FROM orders WHERE order_code=? AND user_id=?')
    .bind(c.req.param('code'), u.id).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)
  if (o.status !== 'pending') return c.json({ error: 'Chỉ có thể huỷ đơn hàng đang chờ thanh toán' }, 400)

  await db.prepare(`UPDATE orders SET status='cancelled' WHERE id=? AND status='pending'`).bind(o.id).run()
  await releaseOrderCoupon(db, o.id)
  return c.json({ ok: true, message: 'Đã huỷ đơn hàng và trả lại mã giảm giá!' })
})

/* --- Frontend polling trạng thái đơn --- */
app.get('/api/orders/:code/status', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  await releaseExpiredCouponHolds(db)
  const o = await db.prepare(
    'SELECT id, order_code, status, total, paid_amount, paid_at, paid_via, coupon_code FROM orders WHERE order_code=? AND user_id=?'
  ).bind(c.req.param('code'), u.id).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)
  const hold = o.status === 'pending' ? await getOrderActiveHold(db, o.id) : null
  return c.json({ ok: true, ...o, hold_expires_at: hold?.expires_at || null })
})

app.get('/don-hang/:code', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  await releaseExpiredCouponHolds(db)
  const o = await db.prepare('SELECT * FROM orders WHERE order_code=? AND user_id=?').bind(c.req.param('code'), u.id).first<any>()
  if (!o) return c.html(<NotFoundPage {...base(c)} />, 404)
  const [items, s, activeHold] = await Promise.all([
    db.prepare(
      `SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`
    ).bind(o.id).all(),
    fetchSettings(db).catch(() => c.get('settings')),
    o.status === 'pending' ? getOrderActiveHold(db, o.id) : Promise.resolve(null)
  ])
  return c.html(<OrderPage {...base(c)} order={o} items={items.results as any}
    holdExpiresAt={activeHold?.expires_at || null}
    bank={{ bank_name: s.bank_name, bank_code: s.bank_code, bank_account: s.bank_account, bank_owner: s.bank_owner }} />)
})

/* ============================================================
   ACCOUNT
   ============================================================ */
app.get('/tai-khoan', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const [st, orders, prods] = await Promise.all([
    db.prepare(`SELECT (SELECT COUNT(*) FROM orders WHERE user_id=?1) orders,
      (SELECT COUNT(*) FROM licenses WHERE user_id=?1) products,
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=?1 AND status='paid') spent,
      (SELECT balance FROM users WHERE id=?1) balance`).bind(u.id).first<any>(),
    db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 5').bind(u.id).all(),
    db.prepare(`SELECT l.*, p.name, p.slug FROM licenses l JOIN products p ON p.id=l.product_id
                WHERE l.user_id=? ORDER BY l.id DESC LIMIT 5`).bind(u.id).all()
  ])
  return c.html(<AccountDashboard {...base(c)} stats={st} recentOrders={orders.results as any} recentProducts={prods.results as any} />)
})

app.get('/tai-khoan/san-pham', requireAuth, async (c) => {
  const db = c.env.DB
  const u = c.get('user')!
  const [rows, mcpToken, connRows] = await Promise.all([
    db.prepare(
      `SELECT l.*, p.name, p.slug, p.thumbnail, p.product_type, p.version, p.download_url, p.doc_url, p.file_size,
         p.mcp_endpoint, p.mcp_server_name, p.mcp_clients, p.mcp_tools,
         (SELECT r.changelog FROM product_releases r WHERE r.product_id=p.id ORDER BY r.id DESC LIMIT 1) latest_changelog,
         (SELECT r.version FROM product_releases r WHERE r.product_id=p.id ORDER BY r.id DESC LIMIT 1) latest_version,
         (SELECT r.created_at FROM product_releases r WHERE r.product_id=p.id ORDER BY r.id DESC LIMIT 1) latest_release_at
       FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.user_id=? ORDER BY l.id DESC`
    ).bind(u.id).all().catch(() =>
      db.prepare(
        `SELECT l.*, p.name, p.slug, p.thumbnail, p.product_type, p.version, p.download_url, p.doc_url, p.file_size
         FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.user_id=? ORDER BY l.id DESC`
      ).bind(u.id).all()
    ),
    ensureUserMcpToken(db, u.id),
    db.prepare(
      `SELECT id, client_name, client_domain, created_at, last_used_at
       FROM mcp_connections
       WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY id DESC`
    ).bind(u.id).all().catch(() => ({ results: [] }))
  ])
  return c.html(
    <MyProductsPage
      {...base(c)}
      licenses={rows.results as any}
      origin={getRequestOrigin(c)}
      mcpToken={mcpToken}
      mcpConnections={(connRows.results || []) as any}
    />
  )
})

/* ============================================================
 *  MCP OAUTH 2.1 + PKCE + DYNAMIC CLIENT REGISTRATION (RFC 9728 / 8414 / 7591)
 *  Cho phép Claude.ai và ChatGPT kết nối 1 lần không cần copy key
 * ========================================================== */
function buildProtectedResourceMetadata(origin: string, resourcePath = '/api/mcp') {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const cleanPath = resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath
  return {
    resource: `${cleanOrigin}${cleanPath}`,
    authorization_servers: [cleanOrigin],
    scopes_supported: ['mcp'],
    bearer_methods_supported: ['header'],
    resource_name: 'KhoSkill AI',
    resource_documentation: `${cleanOrigin}/tai-khoan/san-pham`
  }
}

app.get('/.well-known/oauth-protected-resource', (c) => {
  return c.json(buildProtectedResourceMetadata(getRequestOrigin(c), '/api/mcp'))
})
app.get('/.well-known/oauth-protected-resource/*', (c) => {
  const pathname = new URL(c.req.url).pathname
  const suffix = pathname.slice('/.well-known/oauth-protected-resource'.length) || '/api/mcp'
  const safePath = suffix.startsWith('/api/mcp') ? suffix : '/api/mcp'
  return c.json(buildProtectedResourceMetadata(getRequestOrigin(c), safePath))
})

function buildAuthServerMetadata(origin: string) {
  const cleanOrigin = origin.replace(/\/+$/, '')
  return {
    issuer: cleanOrigin,
    authorization_endpoint: `${cleanOrigin}/oauth/authorize`,
    token_endpoint: `${cleanOrigin}/oauth/token`,
    registration_endpoint: `${cleanOrigin}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['mcp']
  }
}

app.get('/.well-known/oauth-authorization-server', (c) => {
  return c.json(buildAuthServerMetadata(getRequestOrigin(c)))
})
app.get('/.well-known/openid-configuration', (c) => {
  return c.json(buildAuthServerMetadata(getRequestOrigin(c)))
})

app.post('/oauth/register', async (c) => {
  const db = c.env.DB
  const body = await c.req.json<any>().catch(() => null)
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'invalid_client_metadata', error_description: 'Body JSON không hợp lệ' }, 400)
  }

  const rawUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : []
  const validUris: string[] = []
  let primaryDomain: string | null = null

  for (const item of rawUris) {
    if (typeof item !== 'string') continue
    const uri = item.trim()
    const domain = extractVerifiedDomain(uri)
    if (!domain) continue
    if (!primaryDomain) primaryDomain = domain
    if (!validUris.includes(uri)) validUris.push(uri)
  }

  if (validUris.length === 0) {
    return c.json({
      error: 'invalid_redirect_uri',
      error_description: 'Cần ít nhất 1 redirect_uri HTTPS hợp lệ (hoặc http://localhost)'
    }, 400)
  }

  const rawName = String(body.client_name || '').trim().slice(0, 80)
  const clientName = rawName || inferClientNameFromDomain(primaryDomain || '')
  const clientId = 'ks_cl_' + genTokenHex(16)

  await db.prepare(
    `INSERT INTO mcp_oauth_clients (client_id, client_name, redirect_uris, client_domain)
     VALUES (?, ?, ?, ?)`
  ).bind(clientId, clientName, JSON.stringify(validUris), primaryDomain).run()

  return c.json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: clientName,
    redirect_uris: validUris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none'
  }, 201)
})

async function resolveOAuthClient(db: D1Database, clientId: string, redirectUri: string) {
  const domain = extractVerifiedDomain(redirectUri)
  if (!domain) {
    return { ok: false as const, error: 'Địa chỉ chuyển hướng (redirect_uri) không hợp lệ.' }
  }
  if (!clientId) {
    return { ok: false as const, error: 'Thiếu mã ứng dụng (client_id).' }
  }

  const row = await db.prepare(
    'SELECT client_id, client_name, redirect_uris, client_domain FROM mcp_oauth_clients WHERE client_id = ?'
  ).bind(clientId).first<any>().catch(() => null)

  if (row) {
    let uris: string[] = []
    try { uris = JSON.parse(row.redirect_uris || '[]') } catch { uris = [] }
    if (!uris.includes(redirectUri)) {
      return { ok: false as const, error: 'Địa chỉ chuyển hướng không khớp với ứng dụng đã đăng ký.' }
    }
    return {
      ok: true as const,
      clientId: String(row.client_id),
      clientName: String(row.client_name || inferClientNameFromDomain(domain)),
      clientDomain: domain
    }
  }

  // Hỗ trợ Client ID Metadata URL (https://...) hoặc tên miền AI phổ biến (Claude / ChatGPT / localhost)
  const trustedDomain =
    domain === 'claude.ai' || domain.endsWith('.claude.ai') ||
    domain === 'chatgpt.com' || domain.endsWith('.chatgpt.com') ||
    domain === 'chat.openai.com' || domain.endsWith('.openai.com') ||
    domain === 'localhost' || domain === '127.0.0.1'
  const cidDomain = clientId.startsWith('https://') ? extractVerifiedDomain(clientId) : null

  if (trustedDomain || (cidDomain && cidDomain === domain)) {
    return {
      ok: true as const,
      clientId,
      clientName: inferClientNameFromDomain(domain),
      clientDomain: domain
    }
  }

  return { ok: false as const, error: 'Ứng dụng AI này chưa được đăng ký hợp lệ với KhoSkill AI.' }
}

app.get('/oauth/authorize', async (c) => {
  const u = c.get('user')
  const parsedUrl = new URL(c.req.url)
  const fullPath = parsedUrl.pathname + parsedUrl.search

  if (!u) {
    return c.redirect('/dang-nhap?next=' + encodeURIComponent(fullPath))
  }

  const responseType = (c.req.query('response_type') || 'code').trim()
  const clientId = (c.req.query('client_id') || '').trim()
  const redirectUri = (c.req.query('redirect_uri') || '').trim()
  const state = (c.req.query('state') || '').trim()
  const scope = (c.req.query('scope') || 'mcp').trim() || 'mcp'
  const codeChallenge = (c.req.query('code_challenge') || '').trim()
  const codeChallengeMethod = (c.req.query('code_challenge_method') || 'S256').trim()

  if (responseType !== 'code') {
    return c.html(<OAuthConsentPage {...base(c)} errorMsg="Yêu cầu OAuth không hỗ trợ response_type này (chỉ hỗ trợ code)." />, 400)
  }
  if (codeChallenge && codeChallengeMethod !== 'S256') {
    return c.html(<OAuthConsentPage {...base(c)} errorMsg="Chỉ hỗ trợ mã hoá PKCE S256." />, 400)
  }

  const client = await resolveOAuthClient(c.env.DB, clientId, redirectUri)
  if (!client.ok) {
    return c.html(<OAuthConsentPage {...base(c)} errorMsg={client.error} />, 400)
  }

  const skillsRes = await c.env.DB.prepare(
    `SELECT p.name, p.slug
     FROM licenses l JOIN products p ON p.id = l.product_id
     WHERE l.user_id = ? AND p.product_type = 'mcp_skill'
     ORDER BY l.id DESC`
  ).bind(u.id).all().catch(() => ({ results: [] }))

  return c.html(
    <OAuthConsentPage
      {...base(c)}
      clientName={client.clientName}
      clientDomain={client.clientDomain}
      clientId={client.clientId}
      redirectUri={redirectUri}
      state={state}
      scope={scope}
      codeChallenge={codeChallenge}
      codeChallengeMethod={codeChallengeMethod}
      ownedSkills={(skillsRes.results || []) as any}
      reloginUrl={'/dang-nhap?next=' + encodeURIComponent(fullPath)}
    />
  )
})

app.post('/oauth/authorize', async (c) => {
  const u = c.get('user')
  if (!u) {
    return c.redirect('/dang-nhap')
  }

  const body = await c.req.parseBody().catch(() => ({} as Record<string, any>))
  const clientId = String(body.client_id || '').trim()
  const redirectUri = String(body.redirect_uri || '').trim()
  const state = String(body.state || '').trim()
  const scope = String(body.scope || 'mcp').trim() || 'mcp'
  const codeChallenge = String(body.code_challenge || '').trim()
  const codeChallengeMethod = String(body.code_challenge_method || 'S256').trim()
  const decision = String(body.decision || '').trim()

  const client = await resolveOAuthClient(c.env.DB, clientId, redirectUri)
  if (!client.ok) {
    return c.html(<OAuthConsentPage {...base(c)} errorMsg={client.error} />, 400)
  }

  const dest = new URL(redirectUri)
  if (decision !== 'allow') {
    dest.searchParams.set('error', 'access_denied')
    dest.searchParams.set('error_description', 'Người dùng đã huỷ kết nối')
    if (state) dest.searchParams.set('state', state)
    return c.redirect(dest.toString(), 302)
  }

  const code = 'ks_oc_' + genTokenHex(24)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await c.env.DB.prepare(
    `INSERT INTO mcp_oauth_codes (code, client_id, client_name, client_domain, user_id, redirect_uri, code_challenge, code_challenge_method, scope, expires_at, used)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  ).bind(
    code,
    client.clientId,
    client.clientName,
    client.clientDomain,
    u.id,
    redirectUri,
    codeChallenge || null,
    codeChallenge ? (codeChallengeMethod || 'S256') : null,
    scope,
    expiresAt
  ).run()

  dest.searchParams.set('code', code)
  if (state) dest.searchParams.set('state', state)
  return c.redirect(dest.toString(), 302)
})

app.post('/oauth/token', async (c) => {
  const db = c.env.DB
  const ct = (c.req.header('content-type') || '').toLowerCase()
  let params: Record<string, any> = {}
  if (ct.includes('application/json')) {
    params = await c.req.json<any>().catch(() => ({}))
  } else {
    params = await c.req.parseBody().catch(() => ({}))
  }

  let clientId = String(params.client_id || '').trim()
  if (!clientId) {
    const authHeader = c.req.header('authorization') || ''
    if (/^Basic\s+/i.test(authHeader)) {
      try {
        const decoded = atob(authHeader.replace(/^Basic\s+/i, '').trim())
        const colon = decoded.indexOf(':')
        clientId = colon >= 0 ? decoded.slice(0, colon) : decoded
      } catch { /* ignore */ }
    }
  }

  const grantType = String(params.grant_type || '').trim()
  const code = String(params.code || '').trim()
  const redirectUri = String(params.redirect_uri || '').trim()
  const codeVerifier = String(params.code_verifier || '').trim()

  if (grantType !== 'authorization_code') {
    return c.json({ error: 'unsupported_grant_type', error_description: 'Chỉ hỗ trợ grant_type=authorization_code' }, 400)
  }
  if (!code) {
    return c.json({ error: 'invalid_request', error_description: 'Thiếu authorization code' }, 400)
  }

  const row = await db.prepare('SELECT * FROM mcp_oauth_codes WHERE code = ?').bind(code).first<any>()
  if (!row || Number(row.used) !== 0) {
    return c.json({ error: 'invalid_grant', error_description: 'Mã xác thực không hợp lệ hoặc đã được sử dụng' }, 400)
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return c.json({ error: 'invalid_grant', error_description: 'Mã xác thực đã hết hạn' }, 400)
  }
  if (clientId && row.client_id && clientId !== row.client_id) {
    return c.json({ error: 'invalid_grant', error_description: 'client_id không khớp' }, 400)
  }
  if (redirectUri && row.redirect_uri && redirectUri !== row.redirect_uri) {
    return c.json({ error: 'invalid_grant', error_description: 'redirect_uri không khớp' }, 400)
  }

  if (row.code_challenge) {
    if (!codeVerifier) {
      return c.json({ error: 'invalid_grant', error_description: 'Thiếu PKCE code_verifier' }, 400)
    }
    const computed = await sha256Base64Url(codeVerifier)
    if (computed !== row.code_challenge) {
      return c.json({ error: 'invalid_grant', error_description: 'PKCE code_verifier không hợp lệ' }, 400)
    }
  }

  const mark = await db.prepare('UPDATE mcp_oauth_codes SET used = 1 WHERE id = ? AND used = 0').bind(row.id).run()
  if (!mark.meta || mark.meta.changes === 0) {
    return c.json({ error: 'invalid_grant', error_description: 'Mã xác thực đã được sử dụng' }, 400)
  }

  const accessToken = 'ks_oa_' + genTokenHex(24)
  const tokenHash = await sha256Hex(accessToken)

  await db.prepare(
    `INSERT INTO mcp_connections (user_id, token_hash, client_id, client_name, client_domain, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    row.user_id,
    tokenHash,
    row.client_id,
    row.client_name || inferClientNameFromDomain(row.client_domain || ''),
    row.client_domain || extractVerifiedDomain(row.redirect_uri) || null,
    new Date().toISOString()
  ).run()

  c.header('Cache-Control', 'no-store')
  c.header('Pragma', 'no-cache')
  return c.json({
    access_token: accessToken,
    token_type: 'Bearer',
    scope: row.scope || 'mcp'
  })
})

/* Quản lý kết nối AI trên trang Sản phẩm của tôi */
app.post('/api/account/mcp/connections/:id/revoke', requireAuth, async (c) => {
  const u = c.get('user')!
  const connId = Number(c.req.param('id'))
  if (!connId) return c.json({ error: 'ID kết nối không hợp lệ' }, 400)

  const res = await c.env.DB.prepare(
    `UPDATE mcp_connections SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL`
  ).bind(new Date().toISOString(), connId, u.id).run()

  if (!res.meta || res.meta.changes === 0) {
    return c.json({ error: 'Không tìm thấy kết nối AI đang hoạt động' }, 404)
  }
  return c.json({ ok: true, message: 'Đã ngắt kết nối AI!' })
})

app.post('/api/account/mcp/revoke-all', requireAuth, async (c) => {
  const db = c.env.DB
  const u = c.get('user')!
  await db.prepare(
    `UPDATE mcp_connections SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`
  ).bind(new Date().toISOString(), u.id).run().catch(() => null)
  await rotateUserMcpToken(db, u.id)
  return c.json({ ok: true, message: 'Đã ngắt mọi kết nối AI và tạo mã bảo mật mới!' })
})

/* Bật / tắt từng Skill AI Agent cụ thể cho AI đã kết nối */
app.post('/api/account/mcp/skills/:id/toggle', requireAuth, async (c) => {
  const db = c.env.DB
  const u = c.get('user')!
  const licId = Number(c.req.param('id'))
  if (!licId) return c.json({ error: 'ID bản quyền không hợp lệ' }, 400)

  const row = await db.prepare(
    `SELECT l.id, COALESCE(l.mcp_enabled, 1) AS mcp_enabled, p.name, p.product_type
     FROM licenses l JOIN products p ON p.id = l.product_id
     WHERE l.id = ? AND l.user_id = ?`
  ).bind(licId, u.id).first<any>()

  if (!row) return c.json({ error: 'Không tìm thấy Skill này trong tài khoản của bạn' }, 404)
  if (row.product_type !== 'mcp_skill') return c.json({ error: 'Sản phẩm này không phải Skill AI Agent' }, 400)

  const body = await c.req.json<any>().catch(() => ({}))
  const nextEnabled = typeof body.enabled === 'boolean'
    ? (body.enabled ? 1 : 0)
    : (Number(row.mcp_enabled) === 0 ? 1 : 0)

  await db.prepare('UPDATE licenses SET mcp_enabled = ? WHERE id = ? AND user_id = ?')
    .bind(nextEnabled, licId, u.id).run()

  const counts = await db.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN COALESCE(l.mcp_enabled, 1) = 1 THEN 1 ELSE 0 END) AS enabled_count
     FROM licenses l JOIN products p ON p.id = l.product_id
     WHERE l.user_id = ? AND p.product_type = 'mcp_skill'`
  ).bind(u.id).first<any>()

  return c.json({
    ok: true,
    license_id: licId,
    enabled: nextEnabled,
    enabled_count: Number(counts?.enabled_count || 0),
    total_mcp_count: Number(counts?.total || 0),
    message: nextEnabled ? `Đã bật "${row.name}" cho AI` : `Đã tạm tắt "${row.name}" khỏi AI`
  })
})

app.post('/api/account/mcp/skills/enable-all', requireAuth, async (c) => {
  const db = c.env.DB
  const u = c.get('user')!
  await db.prepare(
    `UPDATE licenses SET mcp_enabled = 1
     WHERE user_id = ? AND product_id IN (SELECT id FROM products WHERE product_type = 'mcp_skill')`
  ).bind(u.id).run()
  return c.json({ ok: true, message: 'Đã bật lại toàn bộ Skill AI Agent!' })
})

/* ============================================================
 *  BUILT-IN MCP SERVER (Streamable HTTP JSON-RPC 2.0)
 *  Hỗ trợ OAuth 2.1 (Claude / ChatGPT), Personal Token & License Key
 * ========================================================== */
async function handleMcpEndpoint(c: any, targetSlug?: string) {
  const db = c.env.DB
  const origin = getRequestOrigin(c)
  const licenseKey = extractLicenseKey(c.req.raw, c.req.query('key'))
  const resourceMetaUrl = targetSlug
    ? `${origin}/.well-known/oauth-protected-resource/api/mcp/${encodeURIComponent(targetSlug)}`
    : `${origin}/.well-known/oauth-protected-resource`

  c.header('Cache-Control', 'no-store')

  if (c.req.method === 'GET') {
    const accept = (c.req.header('accept') || '').toLowerCase()
    if (licenseKey) {
      const auth = await authenticateMcpLicense(db, licenseKey, targetSlug)
      if (!auth.ok) {
        if (auth.status === 401) {
          c.header('WWW-Authenticate', `Bearer realm="KhoSkill AI", resource_metadata="${resourceMetaUrl}"`)
        }
        return c.json({ ok: false, error: auth.error }, auth.status as any)
      }
      // Streamable HTTP spec (2025-03-26): GET with Accept: text/event-stream MUST return SSE or 405
      if (accept.includes('text/event-stream')) {
        c.header('Allow', 'POST, DELETE, OPTIONS')
        return c.body(null, 405)
      }
      return c.json({
        ok: true,
        protocol: 'MCP Streamable HTTP (JSON-RPC 2.0)',
        server: auth.authMode === 'license_key' && auth.primary ? resolveMcpServerName(auth.primary) : 'khoskill',
        endpoint: targetSlug ? `${origin}/api/mcp/${targetSlug}` : `${origin}/api/mcp`,
        active_skills: auth.skills.map(s => ({ slug: s.slug, name: s.name, version: s.version }))
      })
    }
    if (accept.includes('text/event-stream')) {
      c.header('WWW-Authenticate', `Bearer realm="KhoSkill AI", resource_metadata="${resourceMetaUrl}"`)
      return c.json({ ok: false, error: 'Cần xác thực OAuth hoặc Bearer token để kết nối KhoSkill AI MCP.' }, 401)
    }
    return c.json({
      ok: true,
      name: 'KhoSkill AI MCP Server',
      protocol: 'Model Context Protocol (Streamable HTTP / JSON-RPC 2.0 + OAuth 2.1)',
      oauth_protected_resource: resourceMetaUrl,
      supported_clients: ['Claude', 'ChatGPT', 'Claude Code', 'OpenAI Codex', 'Antigravity']
    })
  }

  if (c.req.method === 'DELETE') {
    return c.json({ ok: true })
  }

  const auth = await authenticateMcpLicense(db, licenseKey, targetSlug)
  if (!auth.ok) {
    if (auth.status === 401) {
      c.header('WWW-Authenticate', `Bearer realm="KhoSkill AI", resource_metadata="${resourceMetaUrl}"`)
    }
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32001, message: auth.error }
    }, auth.status as any)
  }

  let body: any
  try {
    body = await c.req.json()
  } catch {
    return c.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: body không phải JSON hợp lệ' } }, 400)
  }

  if (Array.isArray(body)) {
    const responses: any[] = []
    for (const item of body) {
      const r = await handleMcpJsonRpc({ db, auth, payload: item, origin })
      if (r.body !== null) responses.push(r.body)
    }
    if (responses.length === 0) return c.body(null, 202)
    return c.json(responses, 200)
  }

  const res = await handleMcpJsonRpc({ db, auth, payload: body, origin })
  if (res.body === null) return c.body(null, res.status as any)
  return c.json(res.body, res.status as any)
}

app.all('/api/mcp', (c) => handleMcpEndpoint(c))
app.all('/api/mcp/:slug', (c) => handleMcpEndpoint(c, c.req.param('slug')))

/* Kiểm tra kết nối MCP trực tiếp từ trang "Sản phẩm của tôi" */
app.post('/api/account/mcp/test', requireAuth, async (c) => {
  const db = c.env.DB
  const u = c.get('user')!
  const b = await c.req.json<any>().catch(() => ({}))
  const licenseId = Number(b.license_id)
  if (!licenseId) return c.json({ error: 'Thiếu license_id' }, 400)

  const lic = await db.prepare(
    `SELECT l.id, l.license_key, p.slug, p.product_type, p.mcp_endpoint, p.mcp_server_name
     FROM licenses l JOIN products p ON p.id = l.product_id
     WHERE l.id = ? AND l.user_id = ?`
  ).bind(licenseId, u.id).first<any>()

  if (!lic) return c.json({ error: 'Không tìm thấy bản quyền sản phẩm này trong tài khoản của bạn' }, 404)
  if (lic.product_type !== 'mcp_skill') return c.json({ error: 'Sản phẩm này không phải dạng Skill AI Agent (MCP)' }, 400)

  const origin = getRequestOrigin(c)
  const endpoint = resolveMcpEndpoint(origin, lic)
  const customEndpoint = (lic.mcp_endpoint || '').trim()

  if (customEndpoint && (customEndpoint.startsWith('https://') || customEndpoint.startsWith('http://'))) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const initRes = await fetch(customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${lic.license_key}`,
          'X-License-Key': lic.license_key
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'khoskill-web-tester', version: '1.0.0' } }
        }),
        signal: ctrl.signal
      })
      clearTimeout(timer)
      if (!initRes.ok) {
        return c.json({ error: `MCP Server trả về mã lỗi HTTP ${initRes.status}` }, 502)
      }
      const initJson: any = await initRes.json().catch(() => ({}))
      return c.json({
        ok: true,
        mode: 'external',
        endpoint: customEndpoint,
        protocolVersion: initJson?.result?.protocolVersion || '2025-03-26',
        serverInfo: initJson?.result?.serverInfo || { name: resolveMcpServerName(lic), version: '1.0' },
        tools: []
      })
    } catch (err: any) {
      return c.json({ error: `Không kết nối được tới MCP Server (${String(err?.message || err)})` }, 502)
    }
  }

  const auth = await authenticateMcpLicense(db, lic.license_key, lic.slug)
  if (!auth.ok) return c.json({ error: auth.error }, auth.status as any)

  const initResp = await handleMcpJsonRpc({
    db,
    auth,
    origin,
    payload: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'khoskill-web-tester', version: '1.0.0' } }
    }
  })
  const toolsResp = await handleMcpJsonRpc({
    db,
    auth,
    origin,
    payload: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }
  })

  return c.json({
    ok: true,
    mode: 'builtin',
    endpoint,
    protocolVersion: initResp.body?.result?.protocolVersion || '2025-03-26',
    serverInfo: initResp.body?.result?.serverInfo || { name: resolveMcpServerName(lic), version: '1.0' },
    tools: toolsResp.body?.result?.tools || []
  })
})

app.get('/tai-khoan/thong-bao', requireAuth, async (c) => {
  const u = c.get('user')!
  const rows = await c.env.DB.prepare(
    `SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50`
  ).bind(u.id).all()
  return c.html(<NotificationsPage {...base(c)} notifications={rows.results as any} />)
})

app.get('/tai-khoan/thong-bao/:id/doc', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const row = await db.prepare('SELECT id, link_url FROM notifications WHERE id=? AND user_id=?')
    .bind(c.req.param('id'), u.id).first<any>()
  if (row) {
    await db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').bind(row.id, u.id).run()
  }
  const rawLink = String(row?.link_url || '').trim()
  const safeDest = rawLink && ((rawLink.startsWith('/') && !rawLink.startsWith('//')) || rawLink.startsWith('https://') || rawLink.startsWith('http://'))
    ? rawLink
    : '/tai-khoan/thong-bao'
  return c.redirect(safeDest)
})

app.post('/api/account/notifications/read-all', requireAuth, async (c) => {
  const u = c.get('user')!
  await c.env.DB.prepare('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0').bind(u.id).run()
  return c.json({ ok: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc!' })
})

/* Download redirect - đếm lượt tải và bảo vệ link */
app.get('/tai-xuong/:licenseId', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const l = await db.prepare(
    `SELECT l.id, p.download_url FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.id=? AND l.user_id=?`
  ).bind(c.req.param('licenseId'), u.id).first<any>()
  if (!l?.download_url) return c.html(<NotFoundPage {...base(c)} />, 404)
  await db.prepare('UPDATE licenses SET download_count=download_count+1, last_download_at=? WHERE id=?')
    .bind(new Date().toISOString(), l.id).run()
  return c.redirect(l.download_url)
})

app.get('/tai-khoan/don-hang', requireAuth, async (c) => {
  const u = c.get('user')!
  const rows = await c.env.DB.prepare(
    `SELECT o.*, (SELECT STRING_AGG(product_name, ', ') FROM order_items WHERE order_id=o.id) product_names
     FROM orders o WHERE o.user_id=? ORDER BY o.id DESC`
  ).bind(u.id).all()
  return c.html(<MyOrdersPage {...base(c)} orders={rows.results as any} />)
})

app.get('/tai-khoan/yeu-thich', requireAuth, async (c) => {
  const u = c.get('user')!
  const rows = await c.env.DB.prepare(
    `SELECT p.* FROM wishlists w JOIN products p ON p.id=w.product_id WHERE w.user_id=? ORDER BY w.id DESC`
  ).bind(u.id).all()
  return c.html(<WishlistPage {...base(c)} items={rows.results as any} />)
})

app.get('/tai-khoan/affiliate', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const me = await db.prepare('SELECT affiliate_code, affiliate_earned, email_verified, email FROM users WHERE id=?').bind(u.id).first<any>()
  const refs = await db.prepare(
    `SELECT u.id, u.full_name, u.email, u.created_at,
     (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
     FROM users u WHERE u.referred_by=? ORDER BY u.id DESC`
  ).bind(u.id).all()
  const origin = getRequestOrigin(c)
  return c.html(<AffiliateDashboard {...base(c)} affCode={me?.affiliate_code || ''}
    earned={me?.affiliate_earned || 0} refCount={(refs.results as any[]).length}
    percent={+(c.get('settings').affiliate_percent || 20)} referrals={refs.results as any} siteUrl={origin}
    emailVerified={me?.email_verified === 1} userEmail={me?.email || u.email}
    googleEnabled={getGoogleConfig(c.env).enabled} />)
})

app.get('/tai-khoan/ho-so', requireAuth, async (c) => {
  const u = c.get('user')!
  const profile = await c.env.DB.prepare('SELECT * FROM users WHERE id=?').bind(u.id).first<any>()
  return c.html(<ProfilePage {...base(c)} profile={profile}
    googleEnabled={getGoogleConfig(c.env).enabled}
    verifiedBanner={c.req.query('verified') === '1'} />)
})

app.post('/api/account/send-verify-email', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const row = await db.prepare('SELECT id, email, full_name, email_verified, status FROM users WHERE id=?').bind(u.id).first<any>()
  if (!row || row.status === 'banned') return c.json({ error: 'Tài khoản không khả dụng' }, 403)
  if (row.email_verified === 1) return c.json({ ok: true, message: 'Email của bạn đã được xác minh trước đó!' })

  if (!isEmailConfigured(c.env)) {
    return c.json({
      error: 'Hệ thống gửi email tự động chưa được cấu hình. Vui lòng dùng nút "Xác minh với Google" hoặc liên hệ hỗ trợ.'
    }, 400)
  }

  const issued = await issueEmailToken(db, { userId: row.id, email: row.email, purpose: 'verify', ttlMinutes: 30 })
  if (issued.waitSeconds) {
    return c.json({ error: `Bạn vừa yêu cầu gửi mail. Vui lòng đợi ${issued.waitSeconds} giây rồi thử lại.` }, 429)
  }
  const origin = getRequestOrigin(c)
  const siteName = c.get('settings')?.site_name || 'KhoSkill AI'
  const verifyUrl = `${origin}/xac-minh-email?token=${issued.rawToken}`
  const sent = await sendEmail(c.env, buildVerificationEmail({
    to: row.email,
    fullName: row.full_name,
    verifyUrl,
    siteName,
    origin
  }))
  if (!sent.ok) {
    return c.json({ error: `Không thể gửi email lúc này (${sent.error || 'Lỗi SMTP/Resend'}). Vui lòng thử lại sau.` }, 500)
  }
  return c.json({ ok: true, message: `Đã gửi link xác minh tới ${row.email}. Vui lòng kiểm tra Hộp thư đến (và mục Spam)!` })
})

app.post('/api/account/profile', requireAuth, async (c) => {
  const u = c.get('user')!
  const b = await c.req.json<any>()
  const full_name = (b.full_name || '').trim()
  if (!full_name) return c.json({ error: 'Họ tên không được để trống' }, 400)
  await c.env.DB.prepare('UPDATE users SET full_name=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(full_name, b.phone || null, u.id).run()
  await setSession(c, { ...u, full_name })
  return c.json({ ok: true, message: 'Cập nhật hồ sơ thành công!' })
})

app.post('/api/account/password', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const b = await c.req.json<any>()
  if (!b.new_password || b.new_password.length < 6) return c.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400)
  const row = await db.prepare('SELECT password_hash FROM users WHERE id=?').bind(u.id).first<any>()
  const isOAuthOnly = String(row?.password_hash || '').startsWith('OAUTH$')
  if (!isOAuthOnly) {
    const ok = await verifyPassword(b.current_password || '', row.password_hash)
    if (!ok) return c.json({ error: 'Mật khẩu hiện tại không đúng' }, 400)
  }
  await db.prepare('UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(await hashPassword(b.new_password), u.id).run()
  return c.json({ ok: true, message: isOAuthOnly ? 'Đã đặt mật khẩu đăng nhập thành công!' : 'Đổi mật khẩu thành công!' })
})

/* ============================================================
   REVIEWS & TICKETS
   ============================================================ */
app.post('/api/reviews', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const b = await c.req.json<any>()
  const pid = +b.product_id
  const owned = await db.prepare('SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?').bind(u.id, pid).first<any>()
  if (!owned) return c.json({ error: 'Bạn cần mua sản phẩm trước khi đánh giá' }, 403)
  const dup = await db.prepare('SELECT 1 x FROM reviews WHERE user_id=? AND product_id=?').bind(u.id, pid).first<any>()
  if (dup) return c.json({ error: 'Bạn đã đánh giá sản phẩm này rồi' }, 400)
  const rating = Math.min(5, Math.max(1, +b.rating || 5))
  if (!b.comment?.trim()) return c.json({ error: 'Vui lòng nhập nội dung đánh giá' }, 400)

  await db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)')
    .bind(pid, u.id, rating, b.comment.trim()).run()
  const agg = await db.prepare(`SELECT AVG(rating) a, COUNT(*) n FROM reviews WHERE product_id=? AND status='approved'`).bind(pid).first<any>()
  await db.prepare('UPDATE products SET rating=?, rating_count=? WHERE id=?')
    .bind(Math.round((agg?.a || 5) * 10) / 10, agg?.n || 0, pid).run()
  invalidateCache()
  return c.json({ ok: true, message: 'Cảm ơn bạn đã đánh giá!' })
})

app.post('/api/tickets', async (c) => {
  const b = await c.req.json<any>()
  if (!b.name?.trim() || !b.email?.trim() || !b.subject?.trim() || !b.message?.trim())
    return c.json({ error: 'Vui lòng điền đầy đủ thông tin' }, 400)
  const u = c.get('user')
  await c.env.DB.prepare('INSERT INTO tickets (user_id, name, email, subject, message) VALUES (?,?,?,?,?)')
    .bind(u?.id || null, b.name.trim(), b.email.trim(), b.subject.trim(), b.message.trim()).run()
  return c.json({ ok: true, message: 'Đã gửi yêu cầu! Chúng tôi sẽ phản hồi trong 24 giờ.' })
})

/* ============================================================
   ADMIN
   ============================================================ */
app.get('/admin', requireAdmin, async (c) => {
  const db = c.env.DB
  const u = c.get('user')!
  const [s, stats, recentOrders, topProducts, chartRows, adminRow] = await Promise.all([
    fetchSettings(db).catch(() => c.get('settings') || {}),
    db.prepare(`SELECT
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE status='paid') revenue,
      (SELECT COUNT(*) FROM orders) orders,
      (SELECT COUNT(*) FROM orders WHERE status='paid') paidOrders,
      (SELECT COUNT(*) FROM orders WHERE status='pending') pendingOrders,
      (SELECT COUNT(*) FROM users) users,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') newUsers,
      (SELECT COUNT(*) FROM products WHERE status='published') products,
      (SELECT COALESCE(SUM(sold_count),0) FROM products) totalSold`).first<any>(),
    db.prepare(`SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 8`).all(),
    db.prepare(`SELECT name, price, sold_count FROM products ORDER BY sold_count DESC LIMIT 6`).all(),
    db.prepare(`SELECT created_at::date d, COALESCE(SUM(total),0) v FROM orders
                WHERE status='paid' AND created_at >= NOW() - INTERVAL '7 days' GROUP BY created_at::date`).all(),
    db.prepare(`SELECT password_hash FROM users WHERE id=?`).bind(u.id).first<any>()
  ])
  const setupWarnings: { text: string; href: string; action: string }[] = []
  if (!s.bank_account || s.bank_account === '0987654321' || !s.bank_owner || s.bank_owner === 'NGUYEN VAN A') {
    setupWarnings.push({ text: 'Số tài khoản / Chủ tài khoản VietQR vẫn đang để mẫu (0987654321 / NGUYEN VAN A).', href: '/admin/cai-dat', action: 'Cập nhật ngân hàng' })
  }
  if (s.auto_confirm_manual === '1') {
    setupWarnings.push({ text: 'Chế độ DEMO thanh toán đang BẬT (khách tự bấm xác nhận không cần tiền vào).', href: '/admin/cai-dat', action: 'Tắt chế độ DEMO' })
  }
  if (!s.webhook_api_key || s.webhook_api_key === 'CHANGE_ME_SECRET') {
    setupWarnings.push({ text: 'Chưa thiết lập Webhook API Key để SePay/Casso đối soát tự động.', href: '/admin/giao-dich#webhook-config', action: 'Xem cấu hình Webhook' })
  }
  if (adminRow?.password_hash === 'SEED$123456') {
    setupWarnings.push({ text: 'Tài khoản Admin vẫn đang dùng mật khẩu mặc định ban đầu. Hãy đổi mật khẩu ngay.', href: '/tai-khoan/ho-so', action: 'Đổi mật khẩu' })
  }
  const map: Record<string, number> = {}
  for (const r of chartRows.results as any[]) map[r.d] = r.v
  const chart: { label: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5)
    const key = d.toISOString().slice(0, 10)
    chart.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: map[key] || 0 })
  }
  return c.html(<AdminDashboard user={u} activeKey="dash" heading="Dashboard"
    stats={stats} recentOrders={recentOrders.results as any} topProducts={topProducts.results as any} chart={chart} setupWarnings={setupWarnings} />)
})

app.get('/admin/san-pham', requireAdmin, async (c) => {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 20
  const where = q ? 'p.name LIKE ?' : '1=1'
  const binds = q ? [`%${q}%`] : []
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM products p WHERE ${where}`).bind(...binds).first<any>()
  const rows = await db.prepare(`SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all()
  const cats = await db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  return c.html(<AdminProducts user={c.get('user')!} activeKey="products" heading="Quản lý sản phẩm"
    products={rows.results as any} categories={cats.results as any} page={page}
    totalPages={Math.ceil((cnt?.n || 0) / perPage)} q={q} />)
})

app.get('/admin/san-pham/moi', requireAdmin, async (c) => {
  const cats = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  return c.html(<AdminProductForm user={c.get('user')!} activeKey="products" heading="Thêm sản phẩm"
    product={{}} categories={cats.results as any} isNew={true} />)
})

app.get('/admin/san-pham/:id', requireAdmin, async (c) => {
  const db = c.env.DB
  const p = await db.prepare('SELECT * FROM products WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!p) return c.redirect('/admin/san-pham')
  const [cats, rels] = await Promise.all([
    db.prepare('SELECT * FROM categories ORDER BY sort_order').all(),
    db.prepare('SELECT * FROM product_releases WHERE product_id=? ORDER BY id DESC LIMIT 10').bind(p.id).all()
      .catch(() => ({ results: [] }))
  ])
  return c.html(<AdminProductForm user={c.get('user')!} activeKey="products" heading="Sửa sản phẩm"
    product={p} categories={cats.results as any} isNew={false} releases={rels.results as any} />)
})

function productFields(b: any) {
  const toArr = (s: string) => JSON.stringify(String(s || '').split('\n').map(x => x.trim()).filter(Boolean))
  const toClients = (s: string) => {
    const arr = String(s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean)
    return arr.length ? JSON.stringify(arr) : null
  }
  const toMcpTools = (s: string) => {
    const lines = String(s || '').split('\n').map(x => x.trim()).filter(Boolean)
    if (!lines.length) return null
    const tools = lines.map(line => {
      const [name, ...rest] = line.split('|')
      return { name: name.trim(), description: rest.join('|').trim() || 'MCP Skill Tool' }
    }).filter(t => t.name)
    return tools.length ? JSON.stringify(tools) : null
  }
  const ptype = ['course', 'skill', 'mcp_skill', 'chatbot', 'app', 'combo', 'source'].includes(b.product_type) ? b.product_type : 'skill'
  return {
    name: (b.name || '').trim(),
    slug: (b.slug || slugify(b.name || '')).trim(),
    category_id: +b.category_id || null,
    short_desc: b.short_desc || '',
    description: b.description || '',
    features: toArr(b.features_text),
    tech_stack: toArr(b.tech_text),
    version: b.version || 'v1.0',
    price: +b.price || 0,
    original_price: b.original_price ? +b.original_price : null,
    thumbnail: b.thumbnail || null,
    demo_video_url: b.demo_video_url || null,
    raw_video_url: b.raw_video_url || null,
    demo_url: b.demo_url || null,
    download_url: b.download_url || null,
    doc_url: b.doc_url || null,
    file_size: b.file_size || (ptype === 'mcp_skill' ? 'MCP Live API' : null),
    product_type: ptype,
    mcp_endpoint: (b.mcp_endpoint || '').trim() || null,
    mcp_server_name: (b.mcp_server_name || '').trim() || null,
    mcp_clients: ptype === 'mcp_skill' ? (toClients(b.mcp_clients_text) || JSON.stringify(['Claude', 'Codex', 'Antigravity'])) : toClients(b.mcp_clients_text),
    mcp_tools: toMcpTools(b.mcp_tools_text),
    mcp_skill_prompt: (b.mcp_skill_prompt || '').trim() || null,
    mcp_render_webhook: (b.mcp_render_webhook || '').trim() || null,
    is_featured: b.is_featured ? 1 : 0,
    is_hot: b.is_hot ? 1 : 0,
    is_new: b.is_new ? 1 : 0,
    status: ['published', 'coming_soon', 'draft'].includes(b.status) ? b.status : 'published'
  }
}

app.post('/api/admin/products', requireAdmin, async (c) => {
  const f = productFields(await c.req.json<any>())
  if (!f.name || !f.slug) return c.json({ error: 'Thiếu tên hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM products WHERE slug=?').bind(f.slug).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare(`INSERT INTO products
    (name,slug,category_id,short_desc,description,features,tech_stack,version,price,original_price,thumbnail,
     demo_video_url,raw_video_url,demo_url,download_url,doc_url,file_size,product_type,
     mcp_endpoint,mcp_server_name,mcp_clients,mcp_tools,mcp_skill_prompt,mcp_render_webhook,
     is_featured,is_hot,is_new,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(f.name, f.slug, f.category_id, f.short_desc, f.description, f.features, f.tech_stack, f.version,
      f.price, f.original_price, f.thumbnail, f.demo_video_url, f.raw_video_url, f.demo_url, f.download_url, f.doc_url,
      f.file_size, f.product_type,
      f.mcp_endpoint, f.mcp_server_name, f.mcp_clients, f.mcp_tools, f.mcp_skill_prompt, f.mcp_render_webhook,
      f.is_featured, f.is_hot, f.is_new, f.status).run()
  invalidateCache()
  return c.json({ ok: true, redirect: '/admin/san-pham' })
})

app.post('/api/admin/products/:id/update', requireAdmin, async (c) => {
  const db = c.env.DB
  const id = +c.req.param('id')
  const b = await c.req.json<any>()
  const f = productFields(b)
  if (!f.name || !f.slug) return c.json({ error: 'Thiếu tên hoặc slug' }, 400)
  const dup = await db.prepare('SELECT 1 x FROM products WHERE slug=? AND id!=?').bind(f.slug, id).first<any>()
  if (dup) return c.json({ error: 'Slug đã được dùng cho sản phẩm khác' }, 400)
  await db.prepare(`UPDATE products SET name=?,slug=?,category_id=?,short_desc=?,description=?,features=?,
    tech_stack=?,version=?,price=?,original_price=?,thumbnail=?,demo_video_url=?,raw_video_url=?,demo_url=?,download_url=?,
    doc_url=?,file_size=?,product_type=?,
    mcp_endpoint=?,mcp_server_name=?,mcp_clients=?,mcp_tools=?,mcp_skill_prompt=?,mcp_render_webhook=?,
    is_featured=?,is_hot=?,is_new=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(f.name, f.slug, f.category_id, f.short_desc, f.description, f.features, f.tech_stack, f.version,
      f.price, f.original_price, f.thumbnail, f.demo_video_url, f.raw_video_url, f.demo_url, f.download_url, f.doc_url,
      f.file_size, f.product_type,
      f.mcp_endpoint, f.mcp_server_name, f.mcp_clients, f.mcp_tools, f.mcp_skill_prompt, f.mcp_render_webhook,
      f.is_featured, f.is_hot, f.is_new, f.status, id).run()
  invalidateCache()

  if (b.notify_buyers === '1') {
    const changelog = String(b.release_notes || '').trim() || `Phiên bản ${f.version} đã được cập nhật link tải và tài liệu mới nhất.`
    const buyersRes = await db.prepare(
      `SELECT DISTINCT u.id, u.email, u.full_name
       FROM licenses l JOIN users u ON u.id=l.user_id
       WHERE l.product_id=? AND u.status='active'`
    ).bind(id).all()
    const buyers = buyersRes.results as any[]
    const origin = getRequestOrigin(c)
    const siteName = c.get('settings')?.site_name || 'KhoSkill AI'

    for (const buyer of buyers) {
      await createUserNotification(db, {
        userId: buyer.id,
        productId: id,
        type: 'product_update',
        title: `Cập nhật ${f.name} (${f.version})`,
        message: changelog,
        linkUrl: '/tai-khoan/san-pham'
      })
    }

    let emailSuffix = ''
    if (buyers.length > 0 && isEmailConfigured(c.env)) {
      const messages = buyers
        .filter(u => u.email)
        .map(u => buildProductUpdateEmail({
          to: u.email,
          fullName: u.full_name,
          productName: f.name,
          version: f.version,
          changelog,
          accountUrl: `${origin}/tai-khoan/san-pham`,
          siteName,
          origin
        }))
      const batchRes = await sendBatchEmails(c.env, messages)
      emailSuffix = ` (đã gửi ${batchRes.sent} email)`
    } else if (buyers.length > 0) {
      emailSuffix = ' (lưu trong hộp thư web, chưa bật email)'
    }

    await db.prepare(
      `INSERT INTO product_releases (product_id, version, changelog, download_url, notified_count) VALUES (?,?,?,?,?)`
    ).bind(id, f.version, changelog, f.download_url, buyers.length).run().catch(() => null)

    return c.json({ ok: true, message: `Đã lưu & gửi thông báo cho ${buyers.length} khách đã mua${emailSuffix}!` })
  }

  return c.json({ ok: true, message: 'Đã lưu thay đổi!', redirect: '/admin/san-pham' })
})

app.delete('/api/admin/products/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const [usedOrder, usedLic] = await Promise.all([
    db.prepare('SELECT COUNT(*) n FROM order_items WHERE product_id=?').bind(id).first<any>(),
    db.prepare('SELECT COUNT(*) n FROM licenses WHERE product_id=?').bind(id).first<any>()
  ])
  if ((usedOrder?.n || 0) > 0 || (usedLic?.n || 0) > 0) {
    return c.json({ error: 'Sản phẩm đã phát sinh đơn hàng/license. Hãy chuyển trạng thái sang "Nháp" hoặc "Chưa mở bán" thay vì xoá.' }, 400)
  }
  await db.prepare('DELETE FROM reviews WHERE product_id=?').bind(id).run()
  await db.prepare('DELETE FROM cart_items WHERE product_id=?').bind(id).run()
  await db.prepare('DELETE FROM wishlists WHERE product_id=?').bind(id).run()
  await db.prepare('DELETE FROM combo_items WHERE combo_id=? OR product_id=?').bind(id, id).run()
  await db.prepare('DELETE FROM products WHERE id=?').bind(id).run()
  invalidateCache()
  return c.json({ ok: true })
})

app.get('/admin/don-hang', requireAdmin, async (c) => {
  const db = c.env.DB
  const status = c.req.query('status') || ''
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 20
  const w: string[] = ['1=1']; const binds: any[] = []
  if (status) { w.push('o.status=?'); binds.push(status) }
  if (q) { w.push('(o.order_code LIKE ? OR u.email LIKE ?)'); binds.push(`%${q}%`, `%${q}%`) }
  const where = w.join(' AND ')
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM orders o JOIN users u ON u.id=o.user_id WHERE ${where}`).bind(...binds).first<any>()
  const rows = await db.prepare(`SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.id=o.user_id
    WHERE ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all()
  return c.html(<AdminOrders user={c.get('user')!} activeKey="orders" heading="Quản lý đơn hàng"
    orders={rows.results as any} page={page} totalPages={Math.ceil((cnt?.n || 0) / perPage)} status={status} q={q} />)
})

app.get('/admin/don-hang/:id', requireAdmin, async (c) => {
  const db = c.env.DB
  const o = await db.prepare(`SELECT o.*, u.full_name, u.email, u.phone FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?`)
    .bind(c.req.param('id')).first<any>()
  if (!o) return c.redirect('/admin/don-hang')
  const [items, licenses, bankTx, customerStats] = await Promise.all([
    db.prepare(`SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`)
      .bind(o.id).all(),
    db.prepare(`SELECT l.*, p.name product_name, p.version, p.download_url, p.product_type FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.order_id=? ORDER BY l.id`)
      .bind(o.id).all(),
    o.bank_tx_id
      ? db.prepare('SELECT * FROM bank_transactions WHERE id=?').bind(o.bank_tx_id).first<any>()
      : db.prepare('SELECT * FROM bank_transactions WHERE matched_order_id=? ORDER BY id DESC LIMIT 1').bind(o.id).first<any>(),
    db.prepare(`SELECT u.email_verified, u.google_id,
        (SELECT COUNT(*) FROM orders WHERE user_id=u.id) order_count,
        (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
      FROM users u WHERE u.id=?`).bind(o.user_id).first<any>()
  ])
  return c.html(<AdminOrderDetail user={c.get('user')!} activeKey="orders" heading="Chi tiết đơn hàng"
    order={o} items={items.results as any} licenses={licenses.results as any}
    bankTx={bankTx} customerStats={customerStats} />)
})

app.post('/api/admin/orders/:id/status', requireAdmin, async (c) => {
  const db = c.env.DB
  const { status } = await c.req.json<any>()
  if (!['paid', 'cancelled', 'refunded'].includes(status)) return c.json({ error: 'Trạng thái không hợp lệ' }, 400)
  const o = await db.prepare('SELECT * FROM orders WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)

  if (status === 'paid' && o.status !== 'paid') {
    // Admin xác nhận thủ công -> dùng chung luồng settleOrder
    await settleOrder(db, o, { paidVia: 'admin', paidAmount: o.total, env: c.env, origin: getRequestOrigin(c) })
    return c.json({ ok: true })
  }

  await db.prepare('UPDATE orders SET status=?, paid_at=? WHERE id=?')
    .bind(status, status === 'paid' ? new Date().toISOString() : o.paid_at, o.id).run()

  if (status === 'cancelled' || status === 'refunded') {
    await releaseOrderCoupon(db, o.id)
  }

  if (status === 'refunded' && o.status === 'paid') {
    await db.prepare('DELETE FROM licenses WHERE order_id=?').bind(o.id).run()
    await db.prepare('UPDATE users SET balance=balance+? WHERE id=?').bind(o.total, o.user_id).run()
  }
  return c.json({ ok: true })
})

/* ============================================================
   ADMIN: GIAO DỊCH NGÂN HÀNG (đối soát webhook)
   ============================================================ */
app.get('/admin/giao-dich', requireAdmin, async (c) => {
  const db = c.env.DB
  const st = (c.req.query('status') || '').trim()
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 25
  const w: string[] = ['1=1']; const binds: any[] = []
  if (st) { w.push('match_status=?'); binds.push(st) }
  if (q) { w.push('(content LIKE ? OR matched_order_code LIKE ? OR reference_code LIKE ?)'); binds.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  const where = w.join(' AND ')

  const [cnt, rows, stats, freshSettings] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM bank_transactions WHERE ${where}`).bind(...binds).first<any>(),
    db.prepare(`SELECT * FROM bank_transactions WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .bind(...binds, perPage, (page - 1) * perPage).all(),
    db.prepare(`SELECT
        COUNT(*) total,
        COALESCE(SUM(CASE WHEN match_status='matched' THEN 1 ELSE 0 END),0) matched,
        COALESCE(SUM(CASE WHEN match_status='unmatched' THEN 1 ELSE 0 END),0) unmatched,
        COALESCE(SUM(CASE WHEN match_status='amount_mismatch' THEN 1 ELSE 0 END),0) mismatch,
        COALESCE(SUM(CASE WHEN match_status='matched' THEN amount_in ELSE 0 END),0) revenue
      FROM bank_transactions`).first<any>(),
    fetchSettings(db).catch(() => c.get('settings'))
  ])

  return c.html(<AdminBankTx user={c.get('user')!} activeKey="banktx" heading="Giao dịch ngân hàng"
    txs={rows.results as any} stats={stats} page={page}
    totalPages={Math.ceil((cnt?.n || 0) / perPage)} status={st} q={q}
    settings={freshSettings} origin={new URL(c.req.url).origin} />)
})

/** Đối soát thủ công: gán 1 giao dịch lạc cho 1 đơn hàng */
app.post('/api/admin/banktx/:id/match', requireAdmin, async (c) => {
  const db = c.env.DB
  const { order_code } = await c.req.json<any>()
  const tx = await db.prepare('SELECT * FROM bank_transactions WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!tx) return c.json({ error: 'Không tìm thấy giao dịch' }, 404)
  if (tx.match_status === 'matched') return c.json({ error: 'Giao dịch này đã được đối soát' }, 400)

  const o = await db.prepare('SELECT * FROM orders WHERE order_code=?')
    .bind(String(order_code || '').trim().toUpperCase()).first<any>()
  if (!o) return c.json({ error: 'Mã đơn hàng không tồn tại' }, 404)
  if (o.status === 'paid') return c.json({ error: 'Đơn hàng này đã được thanh toán' }, 400)

  await settleOrder(db, o, { paidVia: 'manual', paidAmount: tx.amount_in, bankTxId: tx.id, env: c.env, origin: getRequestOrigin(c) })
  await db.prepare(
    `UPDATE bank_transactions SET match_status='matched', matched_order_id=?, matched_order_code=?,
     note=COALESCE(note,'') || ' | Đối soát thủ công bởi admin' WHERE id=?`
  ).bind(o.id, o.order_code, tx.id).run()

  return c.json({ ok: true, message: `Đã gán giao dịch cho đơn ${o.order_code} và cấp quyền tải` })
})

/** Sinh API key webhook mới */
app.post('/api/admin/webhook/regenerate-key', requireAdmin, async (c) => {
  const key = genCode('whk_', 32).toLowerCase()
  await c.env.DB.prepare(
    'INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?'
  ).bind('webhook_api_key', key, key).run()
  invalidateCache('settings')
  return c.json({ ok: true, key, message: 'Đã tạo API key mới. Hãy cập nhật lại trong dashboard SePay/Casso!' })
})

app.get('/admin/thanh-vien', requireAdmin, async (c) => {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 20
  const where = q ? '(full_name LIKE ? OR email LIKE ?)' : '1=1'
  const binds = q ? [`%${q}%`, `%${q}%`] : []
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM users WHERE ${where}`).bind(...binds).first<any>()
  const rows = await db.prepare(`SELECT u.*,
    (SELECT COUNT(*) FROM orders WHERE user_id=u.id) order_count,
    (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
    FROM users u WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`)
    .bind(...binds, perPage, (page - 1) * perPage).all()
  return c.html(<AdminUsers user={c.get('user')!} activeKey="users" heading="Quản lý thành viên"
    users={rows.results as any} page={page} totalPages={Math.ceil((cnt?.n || 0) / perPage)} q={q} />)
})

app.get('/admin/thanh-vien/:id', requireAdmin, async (c) => {
  const db = c.env.DB
  const id = +c.req.param('id')
  const member = await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first<any>()
  if (!member) return c.redirect('/admin/thanh-vien')

  const [stats, orders, licenses, referrals, notifications, referrer] = await Promise.all([
    db.prepare(`SELECT
        (SELECT COUNT(*) FROM orders WHERE user_id=?1) order_count,
        (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=?1 AND status='paid') spent,
        (SELECT COUNT(*) FROM licenses WHERE user_id=?1) license_count`).bind(id).first<any>(),
    db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').bind(id).all(),
    db.prepare(`SELECT l.*, p.name product_name, p.version FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.user_id=? ORDER BY l.id DESC`).bind(id).all(),
    db.prepare(`SELECT u.id, u.full_name, u.email, u.created_at,
        (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
      FROM users u WHERE u.referred_by=? ORDER BY u.id DESC`).bind(id).all(),
    db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 20').bind(id).all()
      .catch(() => ({ results: [] })),
    member.referred_by
      ? db.prepare('SELECT id, full_name FROM users WHERE id=?').bind(member.referred_by).first<any>()
      : Promise.resolve(null)
  ])

  return c.html(<AdminUserDetail user={c.get('user')!} activeKey="users" heading={`Thành viên: ${member.full_name}`}
    member={member} stats={stats || { order_count: 0, spent: 0, license_count: 0 }}
    orders={orders.results as any} licenses={licenses.results as any}
    referrals={referrals.results as any} notifications={notifications.results as any}
    referrer={referrer} emailEnabled={isEmailConfigured(c.env)} />)
})

app.post('/api/admin/users/:id/notify', requireAdmin, async (c) => {
  const db = c.env.DB
  const id = +c.req.param('id')
  const b = await c.req.json<any>()
  const title = String(b.title || '').trim()
  const message = String(b.message || '').trim()
  const linkUrl = String(b.link_url || '').trim()

  if (!title || !message) return c.json({ error: 'Vui lòng nhập đầy đủ tiêu đề và nội dung' }, 400)
  if (linkUrl && !(linkUrl.startsWith('/') && !linkUrl.startsWith('//')) && !linkUrl.startsWith('https://') && !linkUrl.startsWith('http://')) {
    return c.json({ error: 'Link đính kèm phải bắt đầu bằng / hoặc https://' }, 400)
  }

  const member = await db.prepare('SELECT id, email, full_name, status FROM users WHERE id=?').bind(id).first<any>()
  if (!member) return c.json({ error: 'Không tìm thấy thành viên' }, 404)

  await createUserNotification(db, {
    userId: member.id,
    type: 'admin',
    title,
    message,
    linkUrl: linkUrl || null
  })

  let emailNote = ''
  if (b.send_email === '1') {
    if (isEmailConfigured(c.env) && member.email) {
      const origin = getRequestOrigin(c)
      const siteName = c.get('settings')?.site_name || 'KhoSkill AI'
      const res = await sendEmail(c.env, buildAdminDirectEmail({
        to: member.email,
        fullName: member.full_name,
        title,
        message,
        linkUrl: linkUrl || undefined,
        siteName,
        origin
      }))
      emailNote = res.ok ? ' và đã gửi Email!' : ` (gửi Email lỗi: ${res.error})`
    } else {
      emailNote = ' (chưa gửi Email vì chưa cấu hình RESEND_API_KEY)'
    }
  }
  return c.json({ ok: true, message: `Đã gửi thông báo vào tài khoản khách${emailNote}` })
})

app.post('/api/admin/users/:id/action', requireAdmin, async (c) => {
  const db = c.env.DB
  const { action } = await c.req.json<any>()
  const id = +c.req.param('id')
  const me = c.get('user')!
  if (id === me.id) return c.json({ error: 'Không thể thao tác trên chính tài khoản của bạn' }, 400)
  const u = await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first<any>()
  if (!u) return c.json({ error: 'Không tìm thấy thành viên' }, 404)
  if (action === 'toggle-status') {
    await db.prepare('UPDATE users SET status=? WHERE id=?').bind(u.status === 'active' ? 'banned' : 'active', id).run()
  } else if (action === 'toggle-role') {
    await db.prepare('UPDATE users SET role=? WHERE id=?').bind(u.role === 'admin' ? 'user' : 'admin', id).run()
  } else return c.json({ error: 'Hành động không hợp lệ' }, 400)
  return c.json({ ok: true })
})

app.get('/admin/danh-muc', requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id=c.id) product_count
    FROM categories c ORDER BY c.sort_order`).all()
  const editId = c.req.query('edit')
  const editing = editId ? (rows.results as any[]).find(x => String(x.id) === editId) : null
  return c.html(<AdminCategories user={c.get('user')!} activeKey="categories" heading="Quản lý danh mục" categories={rows.results as any} editing={editing} />)
})

app.post('/api/admin/categories', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const slug = (b.slug || slugify(b.name || '')).trim()
  if (!b.name?.trim() || !slug) return c.json({ error: 'Thiếu tên hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM categories WHERE slug=?').bind(slug).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare('INSERT INTO categories (slug,name,description,icon) VALUES (?,?,?,?)')
    .bind(slug, b.name.trim(), b.description || '', b.icon || 'fa-cube').run()
  invalidateCache()
  return c.json({ ok: true, message: 'Đã thêm danh mục!' })
})

app.post('/api/admin/categories/:id/update', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json<any>()
  const slug = (b.slug || slugify(b.name || '')).trim()
  if (!b.name?.trim() || !slug) return c.json({ error: 'Thiếu tên hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM categories WHERE slug=? AND id!=?').bind(slug, id).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare('UPDATE categories SET slug=?,name=?,description=?,icon=? WHERE id=?')
    .bind(slug, b.name.trim(), b.description || '', b.icon || 'fa-cube', id).run()
  invalidateCache()
  return c.json({ ok: true, message: 'Đã cập nhật danh mục!', redirect: '/admin/danh-muc' })
})

app.delete('/api/admin/categories/:id', requireAdmin, async (c) => {
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM products WHERE category_id=?').bind(c.req.param('id')).first<any>()
  if (n?.n > 0) return c.json({ error: `Còn ${n.n} sản phẩm trong danh mục này` }, 400)
  await c.env.DB.prepare('DELETE FROM categories WHERE id=?').bind(c.req.param('id')).run()
  invalidateCache()
  return c.json({ ok: true })
})

app.get('/admin/ma-giam-gia', requireAdmin, async (c) => {
  const db = c.env.DB
  await releaseExpiredCouponHolds(db)
  const nowIso = new Date().toISOString()
  const filter = (c.req.query('filter') || 'all').trim()
  const selectedBatch = (c.req.query('batch') || '').trim()

  const [allCouponsRes, activeHoldsRes] = await Promise.all([
    db.prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM coupon_holds h WHERE h.coupon_id=c.id AND h.status='held' AND h.expires_at > ?) AS held_count
       FROM coupons c ORDER BY c.id DESC`
    ).bind(nowIso).all().catch(() =>
      db.prepare('SELECT *, 0 AS held_count FROM coupons ORDER BY id DESC').all()
    ),
    db.prepare(
      `SELECT h.*, u.email AS user_email, u.full_name AS user_name, o.order_code
       FROM coupon_holds h
       JOIN users u ON u.id = h.user_id
       LEFT JOIN orders o ON o.id = h.order_id
       WHERE h.status = 'held' AND h.expires_at > ?
       ORDER BY h.expires_at ASC`
    ).bind(nowIso).all().catch(() => ({ results: [] }))
  ])

  const allCoupons = (allCouponsRes.results || []) as any[]
  const activeHolds = (activeHoldsRes.results || []) as any[]

  const batches = Array.from(
    new Set(allCoupons.map(x => String(x.batch_name || '').trim()).filter(Boolean))
  )

  const stats = {
    total: allCoupons.length,
    active: allCoupons.filter(x => x.status === 'active' && (Number(x.max_uses || 0) === 0 || Number(x.used_count || 0) < Number(x.max_uses))).length,
    heldSlots: activeHolds.length,
    paidUses: allCoupons.reduce((s, x) => s + Number(x.used_count || 0), 0),
    inactiveOrDone: allCoupons.filter(x => x.status !== 'active' || (Number(x.max_uses || 0) > 0 && Number(x.used_count || 0) >= Number(x.max_uses))).length
  }

  let coupons = allCoupons
  if (selectedBatch) {
    coupons = coupons.filter(x => String(x.batch_name || '').trim() === selectedBatch)
  }
  if (filter === 'active') {
    coupons = coupons.filter(x => x.status === 'active' && (Number(x.max_uses || 0) === 0 || Number(x.used_count || 0) < Number(x.max_uses)))
  } else if (filter === 'held') {
    coupons = coupons.filter(x => Number(x.held_count || 0) > 0)
  } else if (filter === 'inactive') {
    coupons = coupons.filter(x => x.status !== 'active')
  } else if (filter === 'exhausted') {
    coupons = coupons.filter(x => Number(x.max_uses || 0) > 0 && Number(x.used_count || 0) >= Number(x.max_uses))
  }

  return c.html(
    <AdminCoupons
      user={c.get('user')!}
      activeKey="coupons"
      heading="Quản lý mã giảm giá"
      coupons={coupons}
      allCoupons={allCoupons}
      activeHolds={activeHolds}
      batches={batches}
      stats={stats}
      filter={filter}
      selectedBatch={selectedBatch}
    />
  )
})

app.post('/api/admin/coupons', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const code = (b.code || '').trim().toUpperCase().replace(/\s+/g, '')
  const val = Number(b.value)
  if (!code || !val || val <= 0) return c.json({ error: 'Thiếu mã hoặc giá trị giảm hợp lệ' }, 400)
  const type = b.type === 'fixed' ? 'fixed' : 'percent'
  if (type === 'percent' && val > 100) return c.json({ error: 'Giảm theo % tối đa 100%' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM coupons WHERE code=?').bind(code).first<any>()
  if (dup) return c.json({ error: 'Mã này đã tồn tại' }, 400)
  const status = b.status === 'inactive' ? 'inactive' : 'active'
  const batchName = String(b.batch_name || '').trim() || null
  await c.env.DB.prepare(
    'INSERT INTO coupons (code,type,value,min_order,max_uses,expires_at,status,batch_name) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(code, type, val, Math.max(0, Number(b.min_order) || 0), Math.max(0, Number(b.max_uses) || 0), b.expires_at || null, status, batchName).run()
  return c.json({ ok: true, code, message: `Đã tạo mã ${code} (${status === 'active' ? 'đang bật' : 'chưa bật'})!` })
})

app.post('/api/admin/coupons/batch', requireAdmin, async (c) => {
  const db = c.env.DB
  const b = await c.req.json<any>()
  const quantity = Math.min(100, Math.max(1, Math.floor(Number(b.quantity) || 10)))
  const val = Number(b.value)
  if (!val || val <= 0) return c.json({ error: 'Vui lòng nhập giá trị giảm hợp lệ' }, 400)
  const type = b.type === 'fixed' ? 'fixed' : 'percent'
  if (type === 'percent' && val > 100) return c.json({ error: 'Giảm theo % tối đa 100%' }, 400)

  const prefix = String(b.prefix || (type === 'percent' ? `KS${val}` : 'KSG')).trim().toUpperCase()
  const maxUses = Math.max(1, Math.floor(Number(b.max_uses) || 1))
  const minOrder = Math.max(0, Number(b.min_order) || 0)
  const expiresAt = String(b.expires_at || '').trim() || null
  const status = b.status === 'inactive' ? 'inactive' : 'active'
  const batchName = String(b.batch_name || '').trim() || `${prefix} (${quantity} mã -${type === 'percent' ? val + '%' : formatVND(val)})`

  const codes = await generateUniqueCouponCodes(db, prefix, quantity)
  for (const code of codes) {
    await db.prepare(
      'INSERT INTO coupons (code,type,value,min_order,max_uses,expires_at,status,batch_name) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(code, type, val, minOrder, maxUses, expiresAt, status, batchName).run()
  }

  return c.json({
    ok: true,
    count: codes.length,
    codes,
    batch_name: batchName,
    message: `Đã tạo thành công ${codes.length} mã giảm giá (${status === 'active' ? 'đang bật ngay' : 'tạo sẵn chưa bật'})!`
  })
})

app.post('/api/admin/coupons/:id/toggle', requireAdmin, async (c) => {
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const row = await db.prepare('SELECT id, code, status FROM coupons WHERE id=?').bind(id).first<any>()
  if (!row) return c.json({ error: 'Không tìm thấy mã giảm giá' }, 404)
  const nextStatus = row.status === 'active' ? 'inactive' : 'active'
  await db.prepare('UPDATE coupons SET status=? WHERE id=?').bind(nextStatus, id).run()
  return c.json({
    ok: true,
    status: nextStatus,
    message: nextStatus === 'active' ? `Đã BẬT mã ${row.code}` : `Đã TẮT mã ${row.code}`
  })
})

app.post('/api/admin/coupons/disable-all', requireAdmin, async (c) => {
  const res = await c.env.DB.prepare(`UPDATE coupons SET status='inactive' WHERE status='active'`).run()
  return c.json({ ok: true, changed: res.meta?.changes || 0, message: 'Đã tắt toàn bộ mã giảm giá đang bật!' })
})

app.post('/api/admin/coupons/batch-status', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const batchName = String(b.batch_name || '').trim()
  const status = b.status === 'active' ? 'active' : 'inactive'
  if (!batchName) return c.json({ error: 'Thiếu tên đợt mã' }, 400)
  await c.env.DB.prepare('UPDATE coupons SET status=? WHERE batch_name=?').bind(status, batchName).run()
  return c.json({ ok: true, message: status === 'active' ? `Đã BẬT cả đợt "${batchName}"` : `Đã TẮT cả đợt "${batchName}"` })
})

app.post('/api/admin/coupons/:id/release-holds', requireAdmin, async (c) => {
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const nowIso = new Date().toISOString()
  const holds = await db.prepare(`SELECT id, order_id FROM coupon_holds WHERE coupon_id=? AND status='held'`).bind(id).all()
  for (const h of (holds.results || []) as any[]) {
    await db.prepare(`UPDATE coupon_holds SET status='released', updated_at=? WHERE id=?`).bind(nowIso, h.id).run()
    if (h.order_id) {
      await db.prepare(`UPDATE orders SET status='cancelled' WHERE id=? AND status='pending'`).bind(h.order_id).run()
    }
  }
  return c.json({ ok: true, released: (holds.results || []).length, message: 'Đã giải phóng lượt giữ tạm của mã này!' })
})

app.post('/api/admin/coupon-holds/:id/release', requireAdmin, async (c) => {
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const nowIso = new Date().toISOString()
  const h = await db.prepare(`SELECT id, order_id, coupon_code FROM coupon_holds WHERE id=? AND status='held'`).bind(id).first<any>()
  if (!h) return c.json({ error: 'Lượt giữ tạm không còn tồn tại' }, 404)
  await db.prepare(`UPDATE coupon_holds SET status='released', updated_at=? WHERE id=?`).bind(nowIso, h.id).run()
  if (h.order_id) {
    await db.prepare(`UPDATE orders SET status='cancelled' WHERE id=? AND status='pending'`).bind(h.order_id).run()
  }
  return c.json({ ok: true, message: `Đã nhả mã ${h.coupon_code} ngay lập tức!` })
})

app.delete('/api/admin/coupons/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM coupon_holds WHERE coupon_id=?').bind(id).run().catch(() => null)
  await c.env.DB.prepare('DELETE FROM coupons WHERE id=?').bind(id).run()
  return c.json({ ok: true })
})

app.get('/admin/bai-viet', requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM posts ORDER BY id DESC').all()
  const editId = c.req.query('edit')
  const editing = editId ? (rows.results as any[]).find(x => String(x.id) === editId) : null
  return c.html(<AdminPosts user={c.get('user')!} activeKey="posts" heading="Quản lý bài viết" posts={rows.results as any} editing={editing} />)
})

app.post('/api/admin/posts', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const slug = (b.slug || slugify(b.title || '')).trim()
  if (!b.title?.trim() || !slug) return c.json({ error: 'Thiếu tiêu đề hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM posts WHERE slug=?').bind(slug).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare('INSERT INTO posts (slug,title,excerpt,content,tags) VALUES (?,?,?,?,?)')
    .bind(slug, b.title.trim(), b.excerpt || '', b.content || '', b.tags || '').run()
  invalidateCache()
  return c.json({ ok: true, message: 'Đã đăng bài!' })
})

app.post('/api/admin/posts/:id/update', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json<any>()
  const slug = (b.slug || slugify(b.title || '')).trim()
  if (!b.title?.trim() || !slug) return c.json({ error: 'Thiếu tiêu đề hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM posts WHERE slug=? AND id!=?').bind(slug, id).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare('UPDATE posts SET slug=?,title=?,excerpt=?,content=?,tags=? WHERE id=?')
    .bind(slug, b.title.trim(), b.excerpt || '', b.content || '', b.tags || '', id).run()
  invalidateCache()
  return c.json({ ok: true, message: 'Đã cập nhật bài viết!', redirect: '/admin/bai-viet' })
})

app.delete('/api/admin/posts/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM posts WHERE id=?').bind(c.req.param('id')).run()
  invalidateCache()
  return c.json({ ok: true })
})

app.get('/admin/danh-gia', requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare(`SELECT r.*, u.full_name, u.email, p.name product_name
    FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id ORDER BY r.id DESC LIMIT 100`).all()
  return c.html(<AdminReviews user={c.get('user')!} activeKey="reviews" heading="Quản lý đánh giá" reviews={rows.results as any} />)
})

app.delete('/api/admin/reviews/:id', requireAdmin, async (c) => {
  const db = c.env.DB
  const r = await db.prepare('SELECT product_id FROM reviews WHERE id=?').bind(c.req.param('id')).first<any>()
  await db.prepare('DELETE FROM reviews WHERE id=?').bind(c.req.param('id')).run()
  if (r) {
    const agg = await db.prepare(`SELECT AVG(rating) a, COUNT(*) n FROM reviews WHERE product_id=?`).bind(r.product_id).first<any>()
    await db.prepare('UPDATE products SET rating=?, rating_count=? WHERE id=?')
      .bind(Math.round((agg?.a || 5) * 10) / 10, agg?.n || 0, r.product_id).run()
  }
  invalidateCache()
  return c.json({ ok: true })
})

app.get('/admin/ho-tro', requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM tickets ORDER BY id DESC LIMIT 100').all()
  return c.html(<AdminTickets user={c.get('user')!} activeKey="tickets" heading="Yêu cầu hỗ trợ" tickets={rows.results as any} />)
})

app.post('/api/admin/tickets/:id/close', requireAdmin, async (c) => {
  await c.env.DB.prepare(`UPDATE tickets SET status='closed' WHERE id=?`).bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

app.get('/admin/cai-dat', requireAdmin, async (c) => {
  const fresh = await fetchSettings(c.env.DB).catch(() => c.get('settings'))
  return c.html(<AdminSettings user={c.get('user')!} activeKey="settings" heading="Cài đặt hệ thống" settings={fresh}
    integrationStatus={{
      emailConfigured: isEmailConfigured(c.env),
      emailFrom: getEmailConfig(c.env).from,
      googleConfigured: getGoogleConfig(c.env).enabled,
      origin: getRequestOrigin(c)
    }} />)
})

const SETTINGS_KEYS = new Set([
  'site_name', 'site_tagline', 'hotline', 'email', 'zalo', 'facebook', 'youtube', 'tiktok',
  'bank_name', 'bank_code', 'bank_account', 'bank_owner',
  'affiliate_percent', 'payment_provider', 'payment_timeout_minutes', 'amount_tolerance', 'auto_confirm_manual'
])

app.post('/api/admin/settings', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  for (const [k, v] of Object.entries(b)) {
    if (!SETTINGS_KEYS.has(k)) continue
    let val = v == null ? '' : String(v).trim()
    if (k === 'bank_account') val = val.replace(/\s+/g, '')
    else if (k === 'bank_code' || k === 'bank_owner') val = val.toUpperCase()
    await c.env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?')
      .bind(k, val, val).run()
  }
  invalidateCache('settings')
  return c.json({ ok: true, message: 'Đã lưu cài đặt!' })
})

/* ============================================================
   SEO
   ============================================================ */
app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin
  return c.text(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /tai-khoan\nDisallow: /api\n\nSitemap: ${origin}/sitemap.xml`)
})

app.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin
  const db = c.env.DB
  const xml = await cached(`sitemap:${origin}`, 300000, async () => {
    const [prods, cats, posts] = await Promise.all([
      db.prepare(`SELECT slug, updated_at FROM products WHERE status IN ('published','coming_soon')`).all(),
      db.prepare('SELECT slug FROM categories').all(),
      db.prepare(`SELECT slug, created_at FROM posts WHERE status='published'`).all()
    ])
    const urls = [
      ['', '1.0', 'daily'], ['/san-pham', '0.9', 'daily'], ['/combo', '0.8', 'weekly'],
      ['/bang-gia', '0.8', 'weekly'], ['/blog', '0.8', 'daily'], ['/affiliate', '0.6', 'monthly'],
      ['/gioi-thieu', '0.6', 'monthly'], ['/lien-he', '0.5', 'monthly']
    ].map(([p, pr, cf]) => `<url><loc>${origin}${p}/</loc><priority>${pr}</priority><changefreq>${cf}</changefreq></url>`)
    for (const x of cats.results as any[]) urls.push(`<url><loc>${origin}/danh-muc/${x.slug}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>`)
    for (const x of prods.results as any[]) urls.push(`<url><loc>${origin}/san-pham/${x.slug}</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>`)
    for (const x of posts.results as any[]) urls.push(`<url><loc>${origin}/blog/${x.slug}</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>`)
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
  })
  return c.body(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=300'
  })
})

app.get('/videos/*', (c) => {
  const pathname = new URL(c.req.url).pathname
  return c.redirect(`https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev${pathname}`, 301)
})

app.notFound((c) => c.html(<NotFoundPage {...base(c)} />, 404))

app.onError((err, c) => {
  console.error('[ERROR]', err)
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'Lỗi hệ thống, vui lòng thử lại' }, 500)
  return c.html(<NotFoundPage {...base(c)} />, 500)
})

export default app
