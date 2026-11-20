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

const onlyArg = process.argv.find(a => a.startsWith('--only='))
const files = onlyArg
  ? [onlyArg.slice('--only='.length)]
  : ['0001_initial_schema.sql', '0002_bank_webhook.sql', '0003_auth_notifications.sql', '0004_mcp_agent_skills.sql', '0005_real_mcp_video_skills.sql', '0006_before_after_raw_video.sql', '0008_mcp_oauth_and_unified_connect.sql', '0009_license_mcp_enabled.sql', 'seed.sql']

for (const f of files) {
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
