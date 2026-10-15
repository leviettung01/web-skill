import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'
import type { Bindings, Variables, SessionUser } from './lib/types'
import { getSession, setSession, clearSession, hashPassword, verifyPassword, genCode, genLicenseKey } from './lib/auth'
import { slugify, formatVND } from './lib/utils'
import {
  verifyWebhookAuth, extractTransactions, extractOrderCodes,
  normalizeDate, type NormalizedTx
} from './lib/webhook'

import { HomePage } from './pages/home'
import { ProductListPage } from './pages/products'
import { ProductDetailPage } from './pages/product-detail'
import { LoginPage, RegisterPage, ForgotPage } from './pages/auth'
import { CartPage, CheckoutPage, OrderPage } from './pages/cart'
import { AccountDashboard, MyProductsPage, MyOrdersPage, WishlistPage, AffiliateDashboard, ProfilePage } from './pages/account'
import {
  BlogListPage, BlogDetailPage, PricingPage, AboutPage, ContactPage,
  AffiliateLandingPage, DocPage, NotFoundPage
} from './pages/static'
import {
  AdminDashboard, AdminProducts, AdminProductForm, AdminOrders, AdminOrderDetail,
  AdminUsers, AdminCategories, AdminCoupons, AdminPosts, AdminReviews, AdminTickets, AdminSettings,
  AdminBankTx
} from './pages/admin'
import { POLICY_DOCS } from './lib/docs'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('/api/*', cors())

/* ============ GLOBAL MIDDLEWARE ============ */
app.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  if (url.pathname.startsWith('/static/')) return next()

  const user = await getSession(c)
  c.set('user', user)

  // settings
  let settings: Record<string, string> = {}
  try {
    const rs = await c.env.DB.prepare('SELECT key, value FROM settings').all()
    for (const r of rs.results as any[]) settings[r.key] = r.value
  } catch { }
  c.set('settings', settings)

  // cart count
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

function base(c: any) {
  return { user: c.get('user'), settings: c.get('settings'), cartCount: c.get('cartCount') }
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
  const [cats, featured, hot, newest, combos, posts, reviews, stats] = await Promise.all([
    db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.status='published') product_count
                FROM categories c ORDER BY c.sort_order`).all(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' AND p.is_featured=1 ORDER BY p.sold_count DESC LIMIT 8`).all(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' ORDER BY p.sold_count DESC LIMIT 8`).all(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' ORDER BY p.id DESC LIMIT 8`).all(),
    db.prepare(`SELECT * FROM products WHERE status='published' AND product_type='combo' ORDER BY sold_count DESC LIMIT 3`).all(),
    db.prepare(`SELECT * FROM posts WHERE status='published' ORDER BY id DESC LIMIT 4`).all(),
    db.prepare(`SELECT r.*, u.full_name, p.name product_name, p.slug product_slug
                FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id
                WHERE r.rating>=4 ORDER BY r.id DESC LIMIT 6`).all(),
    db.prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') products,
                       (SELECT COUNT(*) FROM users) users,
                       (SELECT COALESCE(SUM(sold_count),0) FROM products) sold`).first<any>()
  ])
  return c.html(<HomePage {...base(c)}
    categories={cats.results as any} featured={featured.results as any} hot={hot.results as any}
    newest={newest.results as any} combos={combos.results as any} posts={posts.results as any}
    reviews={reviews.results as any} stats={stats as any} />)
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

  const where: string[] = [`p.status='published'`]
  const binds: any[] = []
  if (q) { where.push(`(p.name LIKE ? OR p.short_desc LIKE ?)`); binds.push(`%${q}%`, `%${q}%`) }
  if (cat) { where.push(`c.slug = ?`); binds.push(cat) }
  if (type) { where.push(`p.product_type = ?`); binds.push(type) }
  if (minPrice) { where.push(`p.price >= ?`); binds.push(+minPrice) }
  if (maxPrice) { where.push(`p.price <= ?`); binds.push(+maxPrice) }

  const orderMap: Record<string, string> = {
    newest: 'p.id DESC', bestseller: 'p.sold_count DESC', price_asc: 'p.price ASC',
    price_desc: 'p.price DESC', rating: 'p.rating DESC, p.rating_count DESC', featured: 'p.is_featured DESC, p.sold_count DESC'
  }
  const orderBy = orderMap[sort] || orderMap.newest
  const w = where.join(' AND ')

  const [cntRow, rows, cats, currentCat] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${w}`).bind(...binds).first<any>(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE ${w} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all(),
    db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.status='published') product_count
                FROM categories c ORDER BY c.sort_order`).all(),
    opts.catSlug ? db.prepare('SELECT * FROM categories WHERE slug=?').bind(opts.catSlug).first<any>() : Promise.resolve(null)
  ])

  const total = cntRow?.n || 0
  const heading = opts.comboOnly ? 'Combo Trọn Bộ' : currentCat ? currentCat.name : q ? `Kết quả cho "${q}"` : 'Tất cả sản phẩm'
  const headingDesc = opts.comboOnly ? 'Gói combo tiết kiệm tới 60% so với mua lẻ từng sản phẩm'
    : currentCat ? currentCat.description
      : 'Khám phá toàn bộ source code, chatbot, prompt và tool AI tạo video của chúng tôi'
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

  const p = await db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.status='published'`).bind(slug).first<any>()
  if (!p) return c.html(<NotFoundPage {...base(c)} />, 404)

  await db.prepare('UPDATE products SET view_count=view_count+1 WHERE id=?').bind(p.id).run()

  const [related, comboItems, reviews, ownedRow, wishRow, breakdown] = await Promise.all([
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' AND p.id!=? AND p.category_id=? ORDER BY p.sold_count DESC LIMIT 4`).bind(p.id, p.category_id).all(),
    p.product_type === 'combo'
      ? db.prepare(`SELECT p.* FROM combo_items ci JOIN products p ON p.id=ci.product_id WHERE ci.combo_id=?`).bind(p.id).all()
      : Promise.resolve({ results: [] }),
    db.prepare(`SELECT r.*, u.full_name FROM reviews r JOIN users u ON u.id=r.user_id
                WHERE r.product_id=? AND r.status='approved' ORDER BY r.id DESC LIMIT 20`).bind(p.id).all(),
    user ? db.prepare('SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?').bind(user.id, p.id).first<any>() : Promise.resolve(null),
    user ? db.prepare('SELECT 1 x FROM wishlists WHERE user_id=? AND product_id=?').bind(user.id, p.id).first<any>() : Promise.resolve(null),
    db.prepare('SELECT rating, COUNT(*) n FROM reviews WHERE product_id=? GROUP BY rating').bind(p.id).all()
  ])

  const rb: Record<number, number> = {}
  for (const r of breakdown.results as any[]) rb[r.rating] = r.n

  const owned = !!ownedRow
  let canReview = false
  if (owned && user) {
    const has = await db.prepare('SELECT 1 x FROM reviews WHERE user_id=? AND product_id=?').bind(user.id, p.id).first<any>()
    canReview = !has
  }

  return c.html(<ProductDetailPage {...base(c)} product={p} related={related.results as any}
    comboItems={comboItems.results as any} reviews={reviews.results as any}
    owned={owned} inWishlist={!!wishRow} canReview={canReview} ratingBreakdown={rb} />)
})

/* -------- Blog -------- */
app.get('/blog', async (c) => {
  const db = c.env.DB
  const q = (c.req.query('q') || '').trim()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = 9
  const where = q ? `status='published' AND (title LIKE ? OR excerpt LIKE ?)` : `status='published'`
  const binds = q ? [`%${q}%`, `%${q}%`] : []
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM posts WHERE ${where}`).bind(...binds).first<any>()
  const rows = await db.prepare(`SELECT * FROM posts WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .bind(...binds, perPage, (page - 1) * perPage).all()
  return c.html(<BlogListPage {...base(c)} posts={rows.results as any} page={page}
    totalPages={Math.ceil((cnt?.n || 0) / perPage)} q={q} />)
})

app.get('/blog/:slug', async (c) => {
  const db = c.env.DB
  const post = await db.prepare(`SELECT * FROM posts WHERE slug=? AND status='published'`).bind(c.req.param('slug')).first<any>()
  if (!post) return c.html(<NotFoundPage {...base(c)} />, 404)
  await db.prepare('UPDATE posts SET view_count=view_count+1 WHERE id=?').bind(post.id).run()
  const related = await db.prepare(`SELECT * FROM posts WHERE status='published' AND id!=? ORDER BY id DESC LIMIT 3`).bind(post.id).all()
  return c.html(<BlogDetailPage {...base(c)} post={post} related={related.results as any} />)
})

/* -------- Static pages -------- */
app.get('/bang-gia', (c) => c.html(<PricingPage {...base(c)} />))
app.get('/lien-he', (c) => c.html(<ContactPage {...base(c)} />))
app.get('/affiliate', (c) => c.html(<AffiliateLandingPage {...base(c)}
  percent={+(c.get('settings').affiliate_percent || 20)} />))

app.get('/gioi-thieu', async (c) => {
  const stats = await c.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') products,
    (SELECT COUNT(*) FROM users) users, (SELECT COALESCE(SUM(sold_count),0) FROM products) sold`).first<any>()
  return c.html(<AboutPage {...base(c)} stats={stats} />)
})

for (const [path, doc] of Object.entries(POLICY_DOCS)) {
  app.get(path, (c) => c.html(<DocPage {...base(c)} heading={doc.heading} html={doc.html} />))
}

/* ============================================================
   AUTH
   ============================================================ */
app.get('/dang-nhap', (c) => {
  if (c.get('user')) return c.redirect('/tai-khoan')
  return c.html(<LoginPage {...base(c)} next={c.req.query('next')} registered={c.req.query('registered') === '1'} />)
})
app.get('/dang-ky', (c) => {
  if (c.get('user')) return c.redirect('/tai-khoan')
  return c.html(<RegisterPage {...base(c)} ref={c.req.query('ref')} />)
})
app.get('/quen-mat-khau', (c) => c.html(<ForgotPage {...base(c)} />))
app.get('/dang-xuat', (c) => { clearSession(c); return c.redirect('/') })

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
  if (b.ref) {
    const r = await db.prepare('SELECT id FROM users WHERE affiliate_code=?').bind(String(b.ref).toUpperCase()).first<any>()
    if (r) referred_by = r.id
  }

  const hash = await hashPassword(password)
  const affCode = genCode('AF', 6)
  const res = await db.prepare(
    `INSERT INTO users (email, password_hash, full_name, phone, affiliate_code, referred_by) VALUES (?,?,?,?,?,?)`
  ).bind(email, hash, full_name, b.phone || null, affCode, referred_by).run()

  const user: SessionUser = { id: res.meta.last_row_id as number, email, full_name, role: 'user' }
  await setSession(c, user)
  return c.json({ ok: true, redirect: '/tai-khoan' })
})

app.post('/api/auth/login', async (c) => {
  const db = c.env.DB
  const b = await c.req.json<any>()
  const email = (b.email || '').trim().toLowerCase()
  const u = await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first<any>()
  if (!u) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 400)
  if (u.status === 'banned') return c.json({ error: 'Tài khoản của bạn đã bị khoá' }, 403)
  const ok = await verifyPassword(b.password || '', u.password_hash)
  if (!ok) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 400)

  await setSession(c, { id: u.id, email: u.email, full_name: u.full_name, role: u.role, avatar_url: u.avatar_url })
  const next = b.next && String(b.next).startsWith('/') ? b.next : (u.role === 'admin' ? '/admin' : '/tai-khoan')
  return c.json({ ok: true, redirect: next })
})

/* ============================================================
   CART / WISHLIST API
   ============================================================ */
app.post('/api/cart/add', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const { product_id } = await c.req.json<any>()
  const p = await db.prepare(`SELECT id FROM products WHERE id=? AND status='published'`).bind(product_id).first<any>()
  if (!p) return c.json({ error: 'Sản phẩm không tồn tại' }, 404)

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
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=? ORDER BY ci.id DESC`
  ).bind(u.id).all()
  const items = rows.results as any[]
  return c.html(<CartPage {...base(c)} items={items} subtotal={items.reduce((s, i) => s + i.price, 0)} />)
})

/* ============================================================
   CHECKOUT & ORDERS
   ============================================================ */
app.get('/thanh-toan', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const rows = await db.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=?`
  ).bind(u.id).all()
  const items = rows.results as any[]
  if (items.length === 0) return c.redirect('/gio-hang')
  const me = await db.prepare('SELECT balance FROM users WHERE id=?').bind(u.id).first<any>()
  return c.html(<CheckoutPage {...base(c)} items={items} subtotal={items.reduce((s, i) => s + i.price, 0)} balance={me?.balance || 0} />)
})

app.post('/api/coupons/check', async (c) => {
  const { code, subtotal } = await c.req.json<any>()
  const cp = await c.env.DB.prepare(`SELECT * FROM coupons WHERE code=? AND status='active'`)
    .bind(String(code).toUpperCase()).first<any>()
  if (!cp) return c.json({ error: 'Mã giảm giá không tồn tại' }, 400)
  if (cp.expires_at && new Date(cp.expires_at) < new Date()) return c.json({ error: 'Mã giảm giá đã hết hạn' }, 400)
  if (cp.max_uses > 0 && cp.used_count >= cp.max_uses) return c.json({ error: 'Mã giảm giá đã hết lượt sử dụng' }, 400)
  if (subtotal < cp.min_order) return c.json({ error: `Đơn hàng tối thiểu ${formatVND(cp.min_order)}` }, 400)
  const discount = cp.type === 'percent' ? Math.floor(subtotal * cp.value / 100) : Math.min(cp.value, subtotal)
  return c.json({ ok: true, discount, code: cp.code })
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

  const subtotal = items.reduce((s, i) => s + i.price, 0)
  let discount = 0, couponCode: string | null = null
  if (b.coupon_code) {
    const cp = await db.prepare(`SELECT * FROM coupons WHERE code=? AND status='active'`).bind(String(b.coupon_code).toUpperCase()).first<any>()
    if (cp && subtotal >= cp.min_order && (cp.max_uses === 0 || cp.used_count < cp.max_uses)) {
      discount = cp.type === 'percent' ? Math.floor(subtotal * cp.value / 100) : Math.min(cp.value, subtotal)
      couponCode = cp.code
      await db.prepare('UPDATE coupons SET used_count=used_count+1 WHERE id=?').bind(cp.id).run()
    }
  }
  const total = Math.max(0, subtotal - discount)
  const pm = ['bank', 'momo', 'balance'].includes(b.payment_method) ? b.payment_method : 'bank'

  // Thanh toán bằng ví
  let status = 'pending'
  if (pm === 'balance') {
    const me = await db.prepare('SELECT balance FROM users WHERE id=?').bind(u.id).first<any>()
    if ((me?.balance || 0) < total) return c.json({ error: 'Số dư ví không đủ' }, 400)
    await db.prepare('UPDATE users SET balance=balance-? WHERE id=?').bind(total, u.id).run()
    status = 'paid'
  }

  const code = genCode('DH', 8)
  const ord = await db.prepare(
    `INSERT INTO orders (order_code, user_id, subtotal, discount, total, coupon_code, payment_method, status, note, paid_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(code, u.id, subtotal, discount, total, couponCode, pm, status, b.note || null,
    status === 'paid' ? new Date().toISOString() : null).run()
  const orderId = ord.meta.last_row_id as number

  for (const it of items) {
    await db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price) VALUES (?,?,?,?)')
      .bind(orderId, it.id, it.name, it.price).run()
  }
  await db.prepare('DELETE FROM cart_items WHERE user_id=?').bind(u.id).run()

  if (status === 'paid') {
    await grantLicenses(db, u.id, orderId)
    await creditAffiliate(db, u.id, total)
  }
  return c.json({ ok: true, order_code: code })
})

async function creditAffiliate(db: D1Database, userId: number, total: number) {
  const me = await db.prepare('SELECT referred_by FROM users WHERE id=?').bind(userId).first<any>()
  if (!me?.referred_by) return
  const st = await db.prepare(`SELECT value FROM settings WHERE key='affiliate_percent'`).first<any>()
  const pct = +(st?.value || 20)
  const commission = Math.floor(total * pct / 100)
  await db.prepare('UPDATE users SET affiliate_earned=affiliate_earned+?, balance=balance+? WHERE id=?')
    .bind(commission, commission, me.referred_by).run()
}

/* ============================================================
 *  THANH TOÁN ĐƠN HÀNG (settleOrder)
 *  Dùng chung cho: webhook ngân hàng, admin xác nhận, đối soát thủ công
 * ========================================================== */
async function settleOrder(
  db: D1Database,
  order: any,
  opts: { paidVia: string; paidAmount: number; bankTxId?: number | null }
) {
  await db.prepare(
    `UPDATE orders SET status='paid', paid_at=?, paid_amount=?, paid_via=?, bank_tx_id=? WHERE id=?`
  ).bind(new Date().toISOString(), opts.paidAmount, opts.paidVia, opts.bankTxId ?? null, order.id).run()

  await grantLicenses(db, order.user_id, order.id)
  await creditAffiliate(db, order.user_id, order.total)
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
  tolerance: number
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

  // --- Tìm đơn hàng khớp ---
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

  await settleOrder(db, order, { paidVia: 'webhook', paidAmount: tx.amountIn, bankTxId: txId })

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
  const results: any[] = []
  for (const tx of txs) {
    try {
      results.push(await processTransaction(db, tx, rawText, tolerance))
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
  const { order_code } = await c.req.json<any>()
  const o = await db.prepare('SELECT * FROM orders WHERE order_code=? AND user_id=?')
    .bind(order_code, u.id).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)
  if (o.status === 'paid') return c.json({ ok: true, status: 'paid', message: 'Đơn đã được thanh toán' })
  if (o.status !== 'pending') return c.json({ error: 'Đơn hàng đã được xử lý' }, 400)

  const st = await db.prepare(`SELECT value FROM settings WHERE key='auto_confirm_manual'`).first<any>()
  const autoConfirm = st?.value === '1'

  if (autoConfirm) {
    // Chế độ DEMO (chỉ bật khi chưa gắn webhook thật)
    await settleOrder(db, o, { paidVia: 'manual', paidAmount: o.total })
    return c.json({ ok: true, status: 'paid', message: 'Đã xác nhận (chế độ demo)' })
  }

  // Chế độ THẬT: chỉ ghi nhận, chờ webhook ngân hàng đối soát
  return c.json({
    ok: true, status: 'pending',
    message: 'Đã ghi nhận. Hệ thống đang kiểm tra giao dịch, thường mất 10–60 giây. Trang sẽ tự cập nhật.'
  })
})

/* --- Frontend polling trạng thái đơn --- */
app.get('/api/orders/:code/status', requireAuth, async (c) => {
  const u = c.get('user')!
  const o = await c.env.DB.prepare(
    'SELECT order_code, status, total, paid_amount, paid_at, paid_via FROM orders WHERE order_code=? AND user_id=?'
  ).bind(c.req.param('code'), u.id).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)
  return c.json({ ok: true, ...o })
})

app.get('/don-hang/:code', requireAuth, async (c) => {
  const db = c.env.DB, u = c.get('user')!
  const o = await db.prepare('SELECT * FROM orders WHERE order_code=? AND user_id=?').bind(c.req.param('code'), u.id).first<any>()
  if (!o) return c.html(<NotFoundPage {...base(c)} />, 404)
  const items = await db.prepare(
    `SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`
  ).bind(o.id).all()
  const s = c.get('settings')
  return c.html(<OrderPage {...base(c)} order={o} items={items.results as any}
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
  const u = c.get('user')!
  const rows = await c.env.DB.prepare(
    `SELECT l.*, p.name, p.slug, p.thumbnail, p.product_type, p.version, p.download_url, p.doc_url, p.file_size
     FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.user_id=? ORDER BY l.id DESC`
  ).bind(u.id).all()
  return c.html(<MyProductsPage {...base(c)} licenses={rows.results as any} />)
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
    `SELECT o.*, (SELECT GROUP_CONCAT(product_name, ', ') FROM order_items WHERE order_id=o.id) product_names
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
  const me = await db.prepare('SELECT affiliate_code, affiliate_earned FROM users WHERE id=?').bind(u.id).first<any>()
  const refs = await db.prepare(
    `SELECT u.id, u.full_name, u.email, u.created_at,
     (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
     FROM users u WHERE u.referred_by=? ORDER BY u.id DESC`
  ).bind(u.id).all()
  const origin = new URL(c.req.url).origin
  return c.html(<AffiliateDashboard {...base(c)} affCode={me?.affiliate_code || ''}
    earned={me?.affiliate_earned || 0} refCount={(refs.results as any[]).length}
    percent={+(c.get('settings').affiliate_percent || 20)} referrals={refs.results as any} siteUrl={origin} />)
})

app.get('/tai-khoan/ho-so', requireAuth, async (c) => {
  const u = c.get('user')!
  const profile = await c.env.DB.prepare('SELECT * FROM users WHERE id=?').bind(u.id).first<any>()
  return c.html(<ProfilePage {...base(c)} profile={profile} />)
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
  const ok = await verifyPassword(b.current_password || '', row.password_hash)
  if (!ok) return c.json({ error: 'Mật khẩu hiện tại không đúng' }, 400)
  await db.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await hashPassword(b.new_password), u.id).run()
  return c.json({ ok: true, message: 'Đổi mật khẩu thành công!' })
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
  const [stats, recentOrders, topProducts, chartRows] = await Promise.all([
    db.prepare(`SELECT
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE status='paid') revenue,
      (SELECT COUNT(*) FROM orders) orders,
      (SELECT COUNT(*) FROM orders WHERE status='paid') paidOrders,
      (SELECT COUNT(*) FROM orders WHERE status='pending') pendingOrders,
      (SELECT COUNT(*) FROM users) users,
      (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now','-30 days')) newUsers,
      (SELECT COUNT(*) FROM products) products,
      (SELECT COALESCE(SUM(sold_count),0) FROM products) totalSold`).first<any>(),
    db.prepare(`SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 8`).all(),
    db.prepare(`SELECT name, price, sold_count FROM products ORDER BY sold_count DESC LIMIT 6`).all(),
    db.prepare(`SELECT date(created_at) d, COALESCE(SUM(total),0) v FROM orders
                WHERE status='paid' AND created_at >= datetime('now','-7 days') GROUP BY date(created_at)`).all()
  ])
  const map: Record<string, number> = {}
  for (const r of chartRows.results as any[]) map[r.d] = r.v
  const chart: { label: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5)
    const key = d.toISOString().slice(0, 10)
    chart.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: map[key] || 0 })
  }
  return c.html(<AdminDashboard user={c.get('user')!} activeKey="dash" heading="Dashboard"
    stats={stats} recentOrders={recentOrders.results as any} topProducts={topProducts.results as any} chart={chart} />)
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
  const cats = await db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  return c.html(<AdminProductForm user={c.get('user')!} activeKey="products" heading="Sửa sản phẩm"
    product={p} categories={cats.results as any} isNew={false} />)
})

function productFields(b: any) {
  const toArr = (s: string) => JSON.stringify(String(s || '').split('\n').map(x => x.trim()).filter(Boolean))
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
    demo_url: b.demo_url || null,
    download_url: b.download_url || null,
    doc_url: b.doc_url || null,
    file_size: b.file_size || null,
    product_type: b.product_type || 'source',
    is_featured: b.is_featured ? 1 : 0,
    is_hot: b.is_hot ? 1 : 0,
    is_new: b.is_new ? 1 : 0,
    status: b.status || 'published'
  }
}

app.post('/api/admin/products', requireAdmin, async (c) => {
  const f = productFields(await c.req.json<any>())
  if (!f.name || !f.slug) return c.json({ error: 'Thiếu tên hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM products WHERE slug=?').bind(f.slug).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare(`INSERT INTO products
    (name,slug,category_id,short_desc,description,features,tech_stack,version,price,original_price,thumbnail,
     demo_video_url,demo_url,download_url,doc_url,file_size,product_type,is_featured,is_hot,is_new,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(f.name, f.slug, f.category_id, f.short_desc, f.description, f.features, f.tech_stack, f.version,
      f.price, f.original_price, f.thumbnail, f.demo_video_url, f.demo_url, f.download_url, f.doc_url,
      f.file_size, f.product_type, f.is_featured, f.is_hot, f.is_new, f.status).run()
  return c.json({ ok: true, redirect: '/admin/san-pham' })
})

app.post('/api/admin/products/:id/update', requireAdmin, async (c) => {
  const f = productFields(await c.req.json<any>())
  await c.env.DB.prepare(`UPDATE products SET name=?,slug=?,category_id=?,short_desc=?,description=?,features=?,
    tech_stack=?,version=?,price=?,original_price=?,thumbnail=?,demo_video_url=?,demo_url=?,download_url=?,
    doc_url=?,file_size=?,product_type=?,is_featured=?,is_hot=?,is_new=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(f.name, f.slug, f.category_id, f.short_desc, f.description, f.features, f.tech_stack, f.version,
      f.price, f.original_price, f.thumbnail, f.demo_video_url, f.demo_url, f.download_url, f.doc_url,
      f.file_size, f.product_type, f.is_featured, f.is_hot, f.is_new, f.status, c.req.param('id')).run()
  return c.json({ ok: true, message: 'Đã lưu thay đổi!', redirect: '/admin/san-pham' })
})

app.delete('/api/admin/products/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  await db.prepare('DELETE FROM cart_items WHERE product_id=?').bind(id).run()
  await db.prepare('DELETE FROM wishlists WHERE product_id=?').bind(id).run()
  await db.prepare('DELETE FROM combo_items WHERE combo_id=? OR product_id=?').bind(id, id).run()
  await db.prepare('DELETE FROM products WHERE id=?').bind(id).run()
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
  const items = await db.prepare(`SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`)
    .bind(o.id).all()
  return c.html(<AdminOrderDetail user={c.get('user')!} activeKey="orders" heading="Chi tiết đơn hàng"
    order={o} items={items.results as any} />)
})

app.post('/api/admin/orders/:id/status', requireAdmin, async (c) => {
  const db = c.env.DB
  const { status } = await c.req.json<any>()
  if (!['paid', 'cancelled', 'refunded'].includes(status)) return c.json({ error: 'Trạng thái không hợp lệ' }, 400)
  const o = await db.prepare('SELECT * FROM orders WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!o) return c.json({ error: 'Không tìm thấy đơn hàng' }, 404)

  if (status === 'paid' && o.status !== 'paid') {
    // Admin xác nhận thủ công -> dùng chung luồng settleOrder
    await settleOrder(db, o, { paidVia: 'admin', paidAmount: o.total })
    return c.json({ ok: true })
  }

  await db.prepare('UPDATE orders SET status=?, paid_at=? WHERE id=?')
    .bind(status, status === 'paid' ? new Date().toISOString() : o.paid_at, o.id).run()

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

  const [cnt, rows, stats] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM bank_transactions WHERE ${where}`).bind(...binds).first<any>(),
    db.prepare(`SELECT * FROM bank_transactions WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .bind(...binds, perPage, (page - 1) * perPage).all(),
    db.prepare(`SELECT
        COUNT(*) total,
        COALESCE(SUM(CASE WHEN match_status='matched' THEN 1 ELSE 0 END),0) matched,
        COALESCE(SUM(CASE WHEN match_status='unmatched' THEN 1 ELSE 0 END),0) unmatched,
        COALESCE(SUM(CASE WHEN match_status='amount_mismatch' THEN 1 ELSE 0 END),0) mismatch,
        COALESCE(SUM(CASE WHEN match_status='matched' THEN amount_in ELSE 0 END),0) revenue
      FROM bank_transactions`).first<any>()
  ])

  return c.html(<AdminBankTx user={c.get('user')!} activeKey="banktx" heading="Giao dịch ngân hàng"
    txs={rows.results as any} stats={stats} page={page}
    totalPages={Math.ceil((cnt?.n || 0) / perPage)} status={st} q={q}
    settings={c.get('settings')} origin={new URL(c.req.url).origin} />)
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

  await settleOrder(db, o, { paidVia: 'manual', paidAmount: tx.amount_in, bankTxId: tx.id })
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
  return c.html(<AdminCategories user={c.get('user')!} activeKey="categories" heading="Quản lý danh mục" categories={rows.results as any} />)
})

app.post('/api/admin/categories', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const slug = (b.slug || slugify(b.name || '')).trim()
  if (!b.name?.trim() || !slug) return c.json({ error: 'Thiếu tên hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM categories WHERE slug=?').bind(slug).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare('INSERT INTO categories (slug,name,description,icon) VALUES (?,?,?,?)')
    .bind(slug, b.name.trim(), b.description || '', b.icon || 'fa-cube').run()
  return c.json({ ok: true, message: 'Đã thêm danh mục!' })
})

app.delete('/api/admin/categories/:id', requireAdmin, async (c) => {
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM products WHERE category_id=?').bind(c.req.param('id')).first<any>()
  if (n?.n > 0) return c.json({ error: `Còn ${n.n} sản phẩm trong danh mục này` }, 400)
  await c.env.DB.prepare('DELETE FROM categories WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

app.get('/admin/ma-giam-gia', requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM coupons ORDER BY id DESC').all()
  return c.html(<AdminCoupons user={c.get('user')!} activeKey="coupons" heading="Mã giảm giá" coupons={rows.results as any} />)
})

app.post('/api/admin/coupons', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const code = (b.code || '').trim().toUpperCase()
  if (!code || !b.value) return c.json({ error: 'Thiếu mã hoặc giá trị' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM coupons WHERE code=?').bind(code).first<any>()
  if (dup) return c.json({ error: 'Mã này đã tồn tại' }, 400)
  await c.env.DB.prepare('INSERT INTO coupons (code,type,value,min_order,max_uses,expires_at) VALUES (?,?,?,?,?,?)')
    .bind(code, b.type || 'percent', +b.value, +b.min_order || 0, +b.max_uses || 0, b.expires_at || null).run()
  return c.json({ ok: true, message: 'Đã tạo mã giảm giá!' })
})

app.delete('/api/admin/coupons/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM coupons WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

app.get('/admin/bai-viet', requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM posts ORDER BY id DESC').all()
  return c.html(<AdminPosts user={c.get('user')!} activeKey="posts" heading="Quản lý bài viết" posts={rows.results as any} />)
})

app.post('/api/admin/posts', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  const slug = (b.slug || slugify(b.title || '')).trim()
  if (!b.title?.trim() || !slug) return c.json({ error: 'Thiếu tiêu đề hoặc slug' }, 400)
  const dup = await c.env.DB.prepare('SELECT 1 x FROM posts WHERE slug=?').bind(slug).first<any>()
  if (dup) return c.json({ error: 'Slug đã tồn tại' }, 400)
  await c.env.DB.prepare('INSERT INTO posts (slug,title,excerpt,content,tags) VALUES (?,?,?,?,?)')
    .bind(slug, b.title.trim(), b.excerpt || '', b.content || '', b.tags || '').run()
  return c.json({ ok: true, message: 'Đã đăng bài!' })
})

app.delete('/api/admin/posts/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM posts WHERE id=?').bind(c.req.param('id')).run()
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

app.get('/admin/cai-dat', requireAdmin, (c) =>
  c.html(<AdminSettings user={c.get('user')!} activeKey="settings" heading="Cài đặt hệ thống" settings={c.get('settings')} />))

app.post('/api/admin/settings', requireAdmin, async (c) => {
  const b = await c.req.json<any>()
  for (const [k, v] of Object.entries(b)) {
    await c.env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?')
      .bind(k, String(v), String(v)).run()
  }
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
  const [prods, cats, posts] = await Promise.all([
    db.prepare(`SELECT slug, updated_at FROM products WHERE status='published'`).all(),
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
  return c.body(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`,
    200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

app.notFound((c) => c.html(<NotFoundPage {...base(c)} />, 404))

app.onError((err, c) => {
  console.error('[ERROR]', err)
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'Lỗi hệ thống, vui lòng thử lại' }, 500)
  return c.html(<NotFoundPage {...base(c)} />, 500)
})

export default app
