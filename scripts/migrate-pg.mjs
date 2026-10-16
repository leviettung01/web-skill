#!/usr/bin/env node
// Run Postgres migrations + seed. Usage: POSTGRES_URL=... node scripts/migrate-pg.mjs
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Client } from 'pg'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations-pg')
const cs = process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!cs) { console.error('POSTGRES_URL required'); process.exit(1) }

const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } })
await client.connect()

for (const f of ['0001_initial_schema.sql', '0002_bank_webhook.sql', 'seed.sql']) {
  const sql = readFileSync(join(dir, f), 'utf8')
  console.log('==', f)
  await client.query(sql)
  console.log('   ok')
}

const checks = await client.query(
  `SELECT (SELECT COUNT(*) FROM products) products,
          (SELECT COUNT(*) FROM categories) categories,
          (SELECT COUNT(*) FROM users) users,
          (SELECT COUNT(*) FROM settings) settings`)
console.log('counts:', checks.rows[0])
await client.end()
console.log('DONE')
