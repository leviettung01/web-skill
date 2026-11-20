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

    const [flag04, flag05, flag06, flag07, flag08, flag09] = await Promise.all([
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0004_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0005_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0006_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0007_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0008_done'`).first<any>().catch(() => null),
      db.prepare(`SELECT value FROM settings WHERE key='mcp_migration_0009_done'`).first<any>().catch(() => null)
    ])

    if (
      flag04?.value === '1' &&
      flag05?.value === '1' &&
      flag06?.value === '1' &&
      flag07?.value === '1' &&
      flag08?.value === '1' &&
      flag09?.value === '1'
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
