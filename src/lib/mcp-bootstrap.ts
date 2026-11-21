/**
 * Safe, one-time, idempotent runtime bootstrap for:
 *  - Migration 0004: Skill AI Agent (MCP) schema columns & category
 *  - Migration 0005: Replace 2 legacy placeholder MCP products with the 6 REAL
 *    AI Agent Video Editing Skills (leaving all existing downloadable `skill`
 *    products and admin-created products completely untouched).
 *
 * Works identically on both PostgreSQL (Vercel/Neon) and SQLite (Cloudflare D1).
 */

import { invalidateCache } from './cache'
import { LEGACY_PLACEHOLDER_MCP_SLUGS, REAL_MCP_VIDEO_SKILLS } from './real-mcp-skills'
import { DEFAULT_MEMBERSHIP_PLANS, DEFAULT_USD_VND_RATE } from './tiers'

let _done = false
let _inflight: Promise<void> | null = null

function readEnvVar(env: any, key: string): string {
  const fromBinding = env && typeof env[key] === 'string' ? env[key] : ''
  const fromProcess = typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string'
    ? process.env[key]!
    : ''
  return (fromBinding || fromProcess || '').trim()
}

async function runOptionalAdminBootstrap(db: D1Database, env?: any): Promise<void> {
  const email = readEnvVar(env, 'ADMIN_SEED_EMAIL').toLowerCase()
  const hash = readEnvVar(env, 'ADMIN_SEED_HASH')
  const nonce = readEnvVar(env, 'ADMIN_SEED_NONCE') || '1'
  if (!email || !hash || !hash.startsWith('pbkdf2$')) return

  const applied = await db.prepare(`SELECT value FROM settings WHERE key='admin_seed_nonce'`).first<any>().catch(() => null)
  if (applied?.value === nonce) return

  await db.prepare(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), (SELECT COUNT(*) > 0 FROM users))`
  ).first().catch(() => null)

  const existing = await db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).bind(email).first<any>().catch(() => null)
  if (existing?.id) {
    await db.prepare(
      `UPDATE users SET password_hash=?, role='admin', status='active', email_verified=1 WHERE id=?`
    ).bind(hash, existing.id).run()
  } else {
    const taken = await db.prepare(`SELECT id FROM users WHERE affiliate_code='ADMIN01'`).first<any>().catch(() => null)
    const affCode = taken ? `ADM${Date.now().toString(36).toUpperCase().slice(-5)}` : 'ADMIN01'
    await db.prepare(
      `INSERT INTO users (email, password_hash, full_name, phone, role, balance, affiliate_code, status, email_verified)
       VALUES (?, ?, 'Quản Trị Viên', '', 'admin', 0, ?, 'active', 1)`
    ).bind(email, hash, affCode).run()
  }

  await db.prepare(
    `INSERT INTO settings (key, value) VALUES ('admin_seed_nonce', ?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`
  ).bind(nonce).run().catch(async () => {
    await db.prepare(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_seed_nonce', ?)`
    ).bind(nonce).run().catch(() => null)
  })
}

async function runOptionalDemoUserBootstrap(db: D1Database, env?: any): Promise<void> {
  const email = readEnvVar(env, 'DEMO_USER_EMAIL').toLowerCase()
  const hash = readEnvVar(env, 'DEMO_USER_HASH')
  const nonce = readEnvVar(env, 'DEMO_USER_NONCE') || '1'
  const fullName = readEnvVar(env, 'DEMO_USER_NAME') || 'Khách Demo Test'
  if (!email || !hash || !hash.startsWith('pbkdf2$')) return

  const applied = await db.prepare(`SELECT value FROM settings WHERE key='demo_user_seed_nonce'`).first<any>().catch(() => null)
  if (applied?.value === nonce) return

  await db.prepare(
    `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), (SELECT COUNT(*) > 0 FROM users))`
  ).first().catch(() => null)

  const existing = await db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).bind(email).first<any>().catch(() => null)
  if (existing?.id) {
    await db.prepare(
      `UPDATE users SET password_hash=?, full_name=?, role='user', status='active', email_verified=1 WHERE id=?`
    ).bind(hash, fullName, existing.id).run()
  } else {
    const affCode = `DM${Date.now().toString(36).toUpperCase().slice(-6)}`
    await db.prepare(
      `INSERT INTO users (email, password_hash, full_name, phone, role, balance, affiliate_code, status, email_verified)
       VALUES (?, ?, ?, '', 'user', 0, ?, 'active', 1)`
    ).bind(email, hash, fullName, affCode).run()
  }

  await db.prepare(
    `INSERT INTO settings (key, value) VALUES ('demo_user_seed_nonce', ?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`
  ).bind(nonce).run().catch(async () => {
    await db.prepare(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_user_seed_nonce', ?)`
    ).bind(nonce).run().catch(() => null)
  })
}

async function runOnce(db: D1Database, env?: any): Promise<void> {
  try {
    await runOptionalAdminBootstrap(db, env).catch(err => console.error('[ADMIN_BOOTSTRAP]', err))
    await runOptionalDemoUserBootstrap(db, env).catch(err => console.error('[DEMO_USER_BOOTSTRAP]', err))

    const [flag04, flag05, flag06, flag07, flag08, flag09, flag10, flag11, flag12] = await Promise.all([
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0004_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0005_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0006_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0007_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0008_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0009_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0010_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0011_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0012_done'`).first<any>().catch(() => null)
    ])

    if (
      flag04?.value === '1' &&
      flag05?.value === '1' &&
      flag06?.value === '1' &&
      flag07?.value === '1' &&
      flag08?.value === '1' &&
      flag09?.value === '1' &&
      flag10?.value === '1' &&
      flag11?.value === '1' &&
      flag12?.value === '1'
    ) {
      _done = true
      return
    }

    let mutated = false

    // ---- Stage 1: Migration 0004 (columns + category) ----
    if (flag04?.value !== '1') {
      const alters = [
        'ALTER TABLE products ADD COLUMN mcp_endpoint TEXT',
        'ALTER TABLE products ADD COLUMN mcp_server_name TEXT',
        'ALTER TABLE products ADD COLUMN mcp_clients TEXT',
        'ALTER TABLE products ADD COLUMN mcp_tools TEXT',
        'ALTER TABLE products ADD COLUMN mcp_skill_prompt TEXT',
        'ALTER TABLE products ADD COLUMN mcp_render_webhook TEXT',
        'ALTER TABLE licenses ADD COLUMN mcp_call_count INTEGER NOT NULL DEFAULT 0',
        'ALTER TABLE licenses ADD COLUMN last_mcp_call_at TIMESTAMP'
      ]
      for (const sql of alters) {
        await db.prepare(sql).run().catch(() => null)
      }

      await db.prepare(
        `SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), (SELECT COUNT(*) > 0 FROM categories))`
      ).first().catch(() => null)
      await db.prepare(
        `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), (SELECT COUNT(*) > 0 FROM products))`
      ).first().catch(() => null)

      const orders: [string, number][] = [
        ['skill-video-ai', 1],
        ['khoa-hoc-video-ai', 3],
        ['chatbot-ai', 4],
        ['app-video-ai', 5],
        ['combo', 6]
      ]
      for (const [slug, ord] of orders) {
        await db.prepare('UPDATE categories SET sort_order=? WHERE slug=?').bind(ord, slug).run().catch(() => null)
      }

      const catExists = await db.prepare(`SELECT id FROM categories WHERE slug='skill-ai-agent-mcp'`).first<any>().catch(() => null)
      if (!catExists) {
        await db.prepare(
          `INSERT INTO categories (slug, name, description, icon, color, sort_order) VALUES (?,?,?,?,?,?)`
        ).bind(
          'skill-ai-agent-mcp',
          'Skill AI Agent (MCP)',
          'Skill dựng video bằng AI Agent (Claude, Codex, Antigravity) — kết nối trực tiếp MCP kèm link Google Drive tải trọn bộ Skill Kit',
          'fa-plug-circle-bolt',
          'cyan',
          2
        ).run().catch(() => null)
      }

      await db.prepare(
        `INSERT INTO settings (key, value) VALUES ('mcp_migration_0004_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
      ).run()
      mutated = true
    }

    // ---- Stage 2: Migration 0005 (6 REAL AI Agent Video Editing Skills) ----
    if (flag05?.value !== '1') {
      // Sync PostgreSQL sequences safely (no-op on SQLite)
      await db.prepare(
        `SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), (SELECT COUNT(*) > 0 FROM categories))`
      ).first().catch(() => null)
      await db.prepare(
        `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), (SELECT COUNT(*) > 0 FROM products))`
      ).first().catch(() => null)

      // Ensure MCP category exists & has up-to-date description
      let catRow = await db.prepare(`SELECT id FROM categories WHERE slug='skill-ai-agent-mcp'`).first<any>().catch(() => null)
      if (!catRow) {
        const ins = await db.prepare(
          `INSERT INTO categories (slug, name, description, icon, color, sort_order) VALUES (?,?,?,?,?,?)`
        ).bind(
          'skill-ai-agent-mcp',
          'Skill AI Agent (MCP)',
          'Skill dựng video bằng AI Agent (Claude, Codex, Antigravity) — kết nối trực tiếp MCP kèm link Google Drive tải trọn bộ Skill Kit',
          'fa-plug-circle-bolt',
          'cyan',
          2
        ).run()
        catRow = { id: ins.meta.last_row_id }
      } else {
        await db.prepare(
          `UPDATE categories SET description=? WHERE id=?`
        ).bind(
          'Skill dựng video bằng AI Agent (Claude, Codex, Antigravity) — kết nối trực tiếp MCP kèm link Google Drive tải trọn bộ Skill Kit',
          catRow.id
        ).run().catch(() => null)
      }
      if (!catRow?.id) {
        catRow = await db.prepare(`SELECT id FROM categories WHERE slug='skill-ai-agent-mcp'`).first<any>().catch(() => null)
      }
      const catId = catRow?.id || null

      // Safely retire the 2 legacy placeholder MCP products without touching any existing `skill` or admin products
      for (const oldSlug of LEGACY_PLACEHOLDER_MCP_SLUGS) {
        const oldProd = await db.prepare('SELECT id FROM products WHERE slug=?').bind(oldSlug).first<any>().catch(() => null)
        if (!oldProd?.id) continue
        await db.prepare('DELETE FROM combo_items WHERE product_id=?').bind(oldProd.id).run().catch(() => null)
        await db.prepare('DELETE FROM cart_items WHERE product_id=?').bind(oldProd.id).run().catch(() => null)
        await db.prepare('DELETE FROM wishlists WHERE product_id=?').bind(oldProd.id).run().catch(() => null)
        const refOrder = await db.prepare('SELECT id FROM order_items WHERE product_id=? LIMIT 1').bind(oldProd.id).first<any>().catch(() => null)
        const refLic = await db.prepare('SELECT id FROM licenses WHERE product_id=? LIMIT 1').bind(oldProd.id).first<any>().catch(() => null)
        if (!refOrder && !refLic) {
          await db.prepare('DELETE FROM products WHERE id=?').bind(oldProd.id).run().catch(() => null)
        } else {
          await db.prepare(`UPDATE products SET status='draft' WHERE id=?`).bind(oldProd.id).run().catch(() => null)
        }
      }

      // Insert the 6 real AI Agent Video Editing Skills (preserving any pre-existing custom row if slug already exists)
      for (const p of REAL_MCP_VIDEO_SKILLS) {
        const exists = await db.prepare('SELECT id FROM products WHERE slug=?').bind(p.slug).first<any>().catch(() => null)
        if (!exists) {
          await db.prepare(
            `INSERT INTO products (
              slug, name, category_id, short_desc, description, features, tech_stack, version,
              price, original_price, thumbnail, demo_video_url, demo_url, download_url, doc_url,
              file_size, product_type, is_featured, is_hot, is_new, status,
              sold_count, view_count, rating, rating_count,
              mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            p.slug, p.name, catId, p.short_desc, p.description, p.features, p.tech_stack, p.version,
            p.price, p.original_price, p.thumbnail, p.demo_video_url, '', p.download_url, p.doc_url,
            p.file_size, 'mcp_skill', p.is_featured, p.is_hot, p.is_new, 'published',
            p.sold_count, p.view_count, p.rating, p.rating_count,
            '', p.mcp_server_name, p.mcp_clients, p.mcp_tools, p.mcp_skill_prompt, ''
          ).run()
        }
      }

      await db.prepare(
        `INSERT INTO settings (key, value) VALUES ('mcp_migration_0005_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
      ).run()
      mutated = true
    }

    // ---- Stage 3: Migration 0006 (Before/After Raw vs Edited video URL for Talking Head skills) ----
    if (flag06?.value !== '1') {
      await db.prepare('ALTER TABLE products ADD COLUMN raw_video_url TEXT').run().catch(() => null)

      for (const p of REAL_MCP_VIDEO_SKILLS) {
        if (!p.raw_video_url) continue
        await db.prepare(
          `UPDATE products SET raw_video_url=?, file_size=?, mcp_skill_prompt=? WHERE slug=?`
        ).bind(p.raw_video_url, p.file_size, p.mcp_skill_prompt, p.slug).run().catch(() => null)
      }

      await db.prepare(
        `INSERT INTO settings (key, value) VALUES ('mcp_migration_0006_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
      ).run().catch(async () => {
        await db.prepare(
          `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0006_done', '1')`
        ).run().catch(() => null)
      })
      mutated = true
    }

    // ---- Stage 4: Migration 0007 (Sync field-motion-walking SKILL.md for Walking Talking Head) ----
    if (flag07?.value !== '1') {
      const fmw = REAL_MCP_VIDEO_SKILLS.find(x => x.slug === 'viral-talking-head-video-edit')
      if (fmw) {
        await db.prepare(
          `UPDATE products SET mcp_skill_prompt=? WHERE slug='viral-talking-head-video-edit'`
        ).bind(fmw.mcp_skill_prompt).run().catch(() => null)
      }
      await db.prepare(
        `INSERT INTO settings (key, value) VALUES ('mcp_migration_0007_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
      ).run().catch(async () => {
        await db.prepare(
          `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0007_done', '1')`
        ).run().catch(() => null)
      })
      mutated = true
    }

    // ---- Stage 5: Migration 0008 (Unified Account MCP Token + OAuth 2.1 Connections) ----
    if (flag08?.value !== '1') {
      await db.prepare('ALTER TABLE users ADD COLUMN mcp_token TEXT').run().catch(() => null)
      await db.prepare(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mcp_token ON users(mcp_token) WHERE mcp_token IS NOT NULL'
      ).run().catch(() => null)

      const tablePairs: [string, string][] = [
        [
          `CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
            id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            client_id TEXT NOT NULL UNIQUE,
            client_name TEXT NOT NULL,
            redirect_uris TEXT NOT NULL,
            client_domain TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id TEXT NOT NULL UNIQUE,
            client_name TEXT NOT NULL,
            redirect_uris TEXT NOT NULL,
            client_domain TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        ],
        [
          `CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
            id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            client_id TEXT NOT NULL,
            client_name TEXT NOT NULL,
            client_domain TEXT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            redirect_uri TEXT NOT NULL,
            code_challenge TEXT,
            code_challenge_method TEXT,
            scope TEXT DEFAULT 'mcp',
            expires_at TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            client_id TEXT NOT NULL,
            client_name TEXT NOT NULL,
            client_domain TEXT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            redirect_uri TEXT NOT NULL,
            code_challenge TEXT,
            code_challenge_method TEXT,
            scope TEXT DEFAULT 'mcp',
            expires_at TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        ],
        [
          `CREATE TABLE IF NOT EXISTS mcp_connections (
            id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            client_id TEXT,
            client_name TEXT NOT NULL,
            client_domain TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMPTZ,
            revoked_at TIMESTAMPTZ
          )`,
          `CREATE TABLE IF NOT EXISTS mcp_connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            client_id TEXT,
            client_name TEXT NOT NULL,
            client_domain TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used_at DATETIME,
            revoked_at DATETIME
          )`
        ]
      ]

      for (const [pgSql, sqliteSql] of tablePairs) {
        await db.prepare(pgSql).run().catch(async () => {
          await db.prepare(sqliteSql).run()
        })
      }

      await db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_mcp_oauth_codes_user ON mcp_oauth_codes(user_id, created_at DESC)'
      ).run().catch(() => null)
      await db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_mcp_connections_user_active ON mcp_connections(user_id, revoked_at, id DESC)'
      ).run().catch(() => null)

      const verified = await db.prepare('SELECT COUNT(*) c FROM mcp_connections').first<any>().catch(() => null)
      if (verified !== null) {
        await db.prepare(
          `INSERT INTO settings (key, value) VALUES ('mcp_migration_0008_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
        ).run().catch(async () => {
          await db.prepare(
            `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0008_done', '1')`
          ).run().catch(() => null)
        })
        mutated = true
      }
    }

    // ---- Stage 6: Migration 0009 (Per-skill enable/disable toggle for AI) ----
    if (flag09?.value !== '1') {
      await db.prepare('ALTER TABLE licenses ADD COLUMN mcp_enabled INTEGER NOT NULL DEFAULT 1').run().catch(() => null)
      const colOk = await db.prepare('SELECT mcp_enabled FROM licenses LIMIT 1').all().catch(() => null)
      if (colOk !== null) {
        await db.prepare(
          `INSERT INTO settings (key, value) VALUES ('mcp_migration_0009_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
        ).run().catch(async () => {
          await db.prepare(
            `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0009_done', '1')`
          ).run().catch(() => null)
        })
        mutated = true
      }
    }

    // ---- Stage 7: Migration 0010 (Add 7th Real AI Agent Skill: roblox-3d-animation, 499K) ----
    if (flag10?.value !== '1') {
      await db.prepare(
        `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), (SELECT COUNT(*) > 0 FROM products))`
      ).first().catch(() => null)

      const catRow = await db.prepare(`SELECT id FROM categories WHERE slug='skill-ai-agent-mcp'`).first<any>().catch(() => null)
      const catId = catRow?.id || null
      const p = REAL_MCP_VIDEO_SKILLS.find(x => x.slug === 'roblox-3d-animation')
      if (p) {
        const exists = await db.prepare('SELECT id FROM products WHERE slug=?').bind(p.slug).first<any>().catch(() => null)
        if (!exists) {
          await db.prepare(
            `INSERT INTO products (
              slug, name, category_id, short_desc, description, features, tech_stack, version,
              price, original_price, thumbnail, demo_video_url, raw_video_url, demo_url, download_url, doc_url,
              file_size, product_type, is_featured, is_hot, is_new, status,
              sold_count, view_count, rating, rating_count,
              mcp_endpoint, mcp_server_name, mcp_clients, mcp_tools, mcp_skill_prompt, mcp_render_webhook
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            p.slug, p.name, catId, p.short_desc, p.description, p.features, p.tech_stack, p.version,
            p.price, p.original_price, p.thumbnail, p.demo_video_url, p.raw_video_url || '', '', p.download_url, p.doc_url,
            p.file_size, 'mcp_skill', p.is_featured, p.is_hot, p.is_new, 'published',
            p.sold_count, p.view_count, p.rating, p.rating_count,
            '', p.mcp_server_name, p.mcp_clients, p.mcp_tools, p.mcp_skill_prompt, ''
          ).run()
        }
      }

      const verifiedRow = await db.prepare(`SELECT id FROM products WHERE slug='roblox-3d-animation'`).first<any>().catch(() => null)
      if (verifiedRow?.id) {
        await db.prepare(
          `INSERT INTO settings (key, value) VALUES ('mcp_migration_0010_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
        ).run().catch(async () => {
          await db.prepare(
            `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0010_done', '1')`
          ).run().catch(() => null)
        })
        mutated = true
      }
    }

    // ---- Stage 8: Migration 0011 (Coupon 10-min holds + batch_name + disable default coupons) ----
    if (flag11?.value !== '1') {
      await db.prepare('ALTER TABLE coupons ADD COLUMN batch_name TEXT').run().catch(() => null)
      await db.prepare(`UPDATE coupons SET status = 'inactive' WHERE status = 'active'`).run().catch(() => null)

      const pgHoldsSql = `CREATE TABLE IF NOT EXISTS coupon_holds (
        id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        coupon_code TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'held',
        expires_at TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`
      const sqliteHoldsSql = `CREATE TABLE IF NOT EXISTS coupon_holds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        coupon_code TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'held',
        expires_at TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
      await db.prepare(pgHoldsSql).run().catch(async () => {
        await db.prepare(sqliteHoldsSql).run()
      })

      await db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_coupon_holds_coupon_status ON coupon_holds(coupon_id, status, expires_at)'
      ).run().catch(() => null)
      await db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_coupon_holds_order ON coupon_holds(order_id)'
      ).run().catch(() => null)
      await db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_coupon_holds_user ON coupon_holds(user_id, coupon_id, status)'
      ).run().catch(() => null)

      const holdsOk = await db.prepare('SELECT COUNT(*) c FROM coupon_holds').first<any>().catch(() => null)
      if (holdsOk !== null) {
        await db.prepare(
          `INSERT INTO settings (key, value) VALUES ('mcp_migration_0011_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
        ).run().catch(async () => {
          await db.prepare(
            `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0011_done', '1')`
          ).run().catch(() => null)
        })
        mutated = true
      }
    }

    // ---- Stage 9: Migration 0012 (Skill Tiers VIP I-IV / SKILL PRO + Membership Plans) ----
    if (flag12?.value !== '1') {
      const alters12 = [
        `ALTER TABLE products ADD COLUMN skill_tier TEXT NOT NULL DEFAULT 'vip3'`,
        `ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'product'`,
        `ALTER TABLE orders ADD COLUMN membership_plan_id INTEGER`,
        `ALTER TABLE licenses ADD COLUMN source TEXT NOT NULL DEFAULT 'purchase'`,
        `ALTER TABLE licenses ADD COLUMN membership_id INTEGER`
      ]
      for (const sql of alters12) {
        await db.prepare(sql).run().catch(() => null)
      }

      // Backfill existing products with appropriate initial tier by price
      await db.prepare(
        `UPDATE products SET skill_tier = CASE
          WHEN price <= 199000 THEN 'vip1'
          WHEN price <= 349000 THEN 'vip2'
          WHEN price <= 799000 THEN 'vip3'
          WHEN price <= 1099000 THEN 'vip4'
          ELSE 'pro'
        END`
      ).run().catch(() => null)

      // Ensure default USD/VND rate setting exists
      const rateRow = await db.prepare(`SELECT value FROM settings WHERE key='usd_vnd_rate'`).first<any>().catch(() => null)
      if (!rateRow) {
        await db.prepare(`INSERT INTO settings (key, value) VALUES ('usd_vnd_rate', ?)`).bind(String(DEFAULT_USD_VND_RATE)).run().catch(() => null)
      }

      const pgPlansSql = `CREATE TABLE IF NOT EXISTS membership_plans (
        id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        group_type TEXT NOT NULL DEFAULT 'starter',
        badge TEXT,
        theme_color TEXT NOT NULL DEFAULT 'indigo',
        price_vnd INTEGER NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 30,
        vip1_quota INTEGER NOT NULL DEFAULT 0,
        vip2_quota INTEGER NOT NULL DEFAULT 0,
        vip3_quota INTEGER NOT NULL DEFAULT 0,
        vip4_quota INTEGER NOT NULL DEFAULT 0,
        auto_update_note TEXT,
        ideal_for TEXT,
        est_value_vnd INTEGER NOT NULL DEFAULT 0,
        is_popular INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`
      const sqlitePlansSql = `CREATE TABLE IF NOT EXISTS membership_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        group_type TEXT NOT NULL DEFAULT 'starter',
        badge TEXT,
        theme_color TEXT NOT NULL DEFAULT 'indigo',
        price_vnd INTEGER NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 30,
        vip1_quota INTEGER NOT NULL DEFAULT 0,
        vip2_quota INTEGER NOT NULL DEFAULT 0,
        vip3_quota INTEGER NOT NULL DEFAULT 0,
        vip4_quota INTEGER NOT NULL DEFAULT 0,
        auto_update_note TEXT,
        ideal_for TEXT,
        est_value_vnd INTEGER NOT NULL DEFAULT 0,
        is_popular INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
      await db.prepare(pgPlansSql).run().catch(async () => {
        await db.prepare(sqlitePlansSql).run()
      })

      const pgUserMemSql = `CREATE TABLE IF NOT EXISTS user_memberships (
        id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        plan_name TEXT NOT NULL,
        plan_slug TEXT NOT NULL,
        vip1_quota INTEGER NOT NULL DEFAULT 0,
        vip2_quota INTEGER NOT NULL DEFAULT 0,
        vip3_quota INTEGER NOT NULL DEFAULT 0,
        vip4_quota INTEGER NOT NULL DEFAULT 0,
        vip1_used INTEGER NOT NULL DEFAULT 0,
        vip2_used INTEGER NOT NULL DEFAULT 0,
        vip3_used INTEGER NOT NULL DEFAULT 0,
        vip4_used INTEGER NOT NULL DEFAULT 0,
        starts_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`
      const sqliteUserMemSql = `CREATE TABLE IF NOT EXISTS user_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        plan_name TEXT NOT NULL,
        plan_slug TEXT NOT NULL,
        vip1_quota INTEGER NOT NULL DEFAULT 0,
        vip2_quota INTEGER NOT NULL DEFAULT 0,
        vip3_quota INTEGER NOT NULL DEFAULT 0,
        vip4_quota INTEGER NOT NULL DEFAULT 0,
        vip1_used INTEGER NOT NULL DEFAULT 0,
        vip2_used INTEGER NOT NULL DEFAULT 0,
        vip3_used INTEGER NOT NULL DEFAULT 0,
        vip4_used INTEGER NOT NULL DEFAULT 0,
        starts_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
      await db.prepare(pgUserMemSql).run().catch(async () => {
        await db.prepare(sqliteUserMemSql).run()
      })

      const pgClaimsSql = `CREATE TABLE IF NOT EXISTS membership_claims (
        id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        membership_id INTEGER NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        skill_tier TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )`
      const sqliteClaimsSql = `CREATE TABLE IF NOT EXISTS membership_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        membership_id INTEGER NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        skill_tier TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )`
      await db.prepare(pgClaimsSql).run().catch(async () => {
        await db.prepare(sqliteClaimsSql).run()
      })

      await db.prepare('CREATE INDEX IF NOT EXISTS idx_products_skill_tier ON products(skill_tier)').run().catch(() => null)
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_user_memberships_user_status ON user_memberships(user_id, status, expires_at)').run().catch(() => null)
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_membership_claims_membership ON membership_claims(membership_id)').run().catch(() => null)

      for (const pl of DEFAULT_MEMBERSHIP_PLANS) {
        const exists = await db.prepare('SELECT id FROM membership_plans WHERE slug=?').bind(pl.slug).first<any>().catch(() => null)
        if (!exists) {
          await db.prepare(
            `INSERT INTO membership_plans
             (slug, name, group_type, badge, theme_color, price_vnd, duration_days,
              vip1_quota, vip2_quota, vip3_quota, vip4_quota,
              auto_update_note, ideal_for, est_value_vnd, is_popular, status, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          ).bind(
            pl.slug, pl.name, pl.group_type, pl.badge, pl.theme_color, pl.price_vnd, pl.duration_days,
            pl.vip1_quota, pl.vip2_quota, pl.vip3_quota, pl.vip4_quota,
            pl.auto_update_note, pl.ideal_for, pl.est_value_vnd, pl.is_popular, pl.status, pl.sort_order
          ).run().catch(() => null)
        }
      }

      const plansOk = await db.prepare('SELECT COUNT(*) c FROM membership_plans').first<any>().catch(() => null)
      if (plansOk && Number(plansOk.c || 0) >= 6) {
        await db.prepare(
          `INSERT INTO settings (key, value) VALUES ('mcp_migration_0012_done', '1') ON CONFLICT(key) DO UPDATE SET value='1'`
        ).run().catch(async () => {
          await db.prepare(
            `INSERT OR REPLACE INTO settings (key, value) VALUES ('mcp_migration_0012_done', '1')`
          ).run().catch(() => null)
        })
        mutated = true
      }
    }

    if (mutated) invalidateCache()
    _done = true
  } catch (err) {
    console.error('[MCP_BOOTSTRAP]', err)
  }
}

export async function ensureMcpMigration(db?: D1Database | null, env?: any): Promise<void> {
  if (_done || !db) return
  if (!_inflight) {
    _inflight = runOnce(db, env).finally(() => {
      _inflight = null
    })
  }
  await _inflight
}
