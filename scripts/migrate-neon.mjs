#!/usr/bin/env node
// Run Postgres migrations + seed via Neon's WebSocket driver.
// Usage: PGURL=postgresql://... node scripts/migrate-neon.mjs
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations-pg')
const cs = process.env.PGURL || process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!cs) { console.error('PGURL required'); process.exit(1) }

const sql = neon(cs)
const q = async (s) => {
  const r = await sql.query(s)
  return Array.isArray(r) ? r : (r.rows || [])
}

// Quote-aware: strip -- comments, then split on semicolons
function splitStmts(text) {
  let out = '', quote = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1]
    if (quote) {
      out += ch
      if (ch === quote) {
        if (quote === "'" && nx === "'") { out += nx; i++ }
        else quote = null
      }
    } else if (ch === "'" || ch === '"' || ch === '`') { quote = ch; out += ch }
    else if (ch === '-' && nx === '-') { while (i < text.length && text[i] !== '\n') i++ }
    else out += ch
  }
  // split on semicolons (quote-aware)
  const stmts = []
  let cur = '', qq = null
  for (let i = 0; i < out.length; i++) {
    const ch = out[i]
    if (qq) { cur += ch; if (ch === qq) qq = null }
    else if (ch === "'" || ch === '"' || ch === '`') { qq = ch; cur += ch }
    else if (ch === ';') { if (cur.trim()) stmts.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim()) stmts.push(cur.trim())
  return stmts
}

console.log('== reset schema')
await q('DROP SCHEMA public CASCADE')
await q('CREATE SCHEMA public')

for (const f of ['0001_initial_schema.sql', '0002_bank_webhook.sql', 'seed.sql']) {
  const stmts = splitStmts(readFileSync(join(dir, f), 'utf8'))
  console.log('==', f, `(${stmts.length} statements)`)
  for (const s of stmts) await q(s)
  console.log('   ok')
}

const counts = await q(
  `SELECT (SELECT COUNT(*) FROM products) products,
          (SELECT COUNT(*) FROM categories) categories,
          (SELECT COUNT(*) FROM users) users,
          (SELECT COUNT(*) FROM settings) settings`)
console.log('counts:', counts[0])
const prods = await q(`SELECT slug, price FROM products ORDER BY id`)
console.log('products:', prods.map(r => `${r.slug}:${r.price}`).join(' | '))
console.log('DONE')
