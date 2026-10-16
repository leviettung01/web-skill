/**
 * pgDb — D1-compatible database adapter backed by PostgreSQL (pg Pool).
 *
 * The app was written against Cloudflare D1 (`db.prepare(sql).bind(...).all()/.first()/.run()`).
 * This adapter exposes the same call pattern on top of node-postgres so the exact same
 * route code runs on Vercel with Vercel Postgres / any Postgres connection string.
 *
 * Differences handled here:
 *  - `?` placeholders  ->  `$1, $2, ...` (quote-aware rewrite)
 *  - `.run()` on INSERT -> appends `RETURNING id` so `meta.last_row_id` keeps working
 *  - `.all()` -> `{ results }`, `.first()` -> row | null, `.run()` -> `{ success, meta: { changes, last_row_id } }`
 */
import { Pool, types } from 'pg'

// Trả về đúng kiểu dữ liệu như D1/SQLite để app code không phải sửa:
//  - TIMESTAMP/TIMESTAMPTZ -> string "YYYY-MM-DD HH:MM:SS" (thay vì Date object)
//  - INT8 (COUNT/SUM) -> number (thay vì string)
types.setTypeParser(types.builtins.TIMESTAMP, (v) => v)
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => v)
types.setTypeParser(types.builtins.DATE, (v) => v)
types.setTypeParser(types.builtins.INT8, (v) => parseInt(v, 10))

let _pool: Pool | null = null

export function pgConnectionString(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING
    )
  }
  return undefined
}

export function pgConfigured(): boolean {
  return !!pgConnectionString()
}

function pool(): Pool {
  if (!_pool) {
    const cs = pgConnectionString()
    if (!cs) throw new Error('Missing POSTGRES_URL / DATABASE_URL env var')
    _pool = new Pool({ connectionString: cs, max: 5, ssl: { rejectUnauthorized: false } })
  }
  return _pool
}

type QueryResult = { rows: any[]; rowCount: number | null }
type QueryFn = (sql: string, params: any[]) => Promise<QueryResult>
let _override: QueryFn | null = null
/** Test hook: override the query executor (e.g. point at PGlite in tests). */
export function _setQueryFn(fn: QueryFn | null) {
  _override = fn
}
function getExecutor(): QueryFn {
  if (_override) return _override
  const p = pool()
  return (sql, params) => p.query(sql, params) as Promise<QueryResult>
}

/** Rewrite `?` placeholders to `$1, $2, ...`, skipping quoted string literals. */
function rewritePlaceholders(sql: string): string {
  let out = ''
  let n = 0
  let quote: string | null = null
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (quote) {
      out += ch
      if (ch === quote) {
        // handle escaped '' inside single-quoted strings
        if (quote === "'" && sql[i + 1] === "'") { out += sql[i + 1]; i++ }
        else quote = null
      }
    } else if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      out += ch
    } else if (ch === '?' && /[0-9]/.test(sql[i + 1] || '')) {
      // D1-style ?NNN (numbered placeholder, reuse param N) -> $N
      let num = ''
      while (/[0-9]/.test(sql[i + 1] || '')) { num += sql[i + 1]; i++ }
      out += '$' + num
      if (parseInt(num, 10) > n) n = parseInt(num, 10)
    } else if (ch === '?') {
      n++
      out += '$' + n
    } else {
      out += ch
    }
  }
  return out
}

class PgStmt {
  constructor(private sql: string, private params: any[] = []) {}
  bind(...params: any[]): PgStmt {
    return new PgStmt(this.sql, params)
  }
  private async execQuery() {
    let s = rewritePlaceholders(this.sql)
    if (/^\s*insert\s/i.test(s) && !/\sreturning\s/i.test(s)) {
      s += ' RETURNING id'
    }
    return getExecutor()(s, this.params)
  }
  async all<T = any>(): Promise<{ results: T[] }> {
    const r = await this.execQuery()
    return { results: r.rows as T[] }
  }
  async first<T = any>(): Promise<T | null> {
    const r = await this.execQuery()
    return ((r.rows[0] as T) ?? null)
  }
  async run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }> {
    const r = await this.execQuery()
    const lastId = r.rows && r.rows[0] && (r.rows[0] as any).id != null ? Number((r.rows[0] as any).id) : 0
    return { success: true, meta: { changes: r.rowCount ?? 0, last_row_id: lastId } }
  }
}

export const pgDb = {
  prepare: (sql: string) => new PgStmt(sql),
}
