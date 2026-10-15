import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { SessionUser } from './types'

const enc = new TextEncoder()
const SALT = 'srctool-ai-salt-v1'
const ITER = 100_000
export const COOKIE_NAME = 'stk_session'

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}
/** base64url encode chuỗi UTF-8 (hỗ trợ tiếng Việt có dấu) */
function b64url(str: string): string {
  const bytes = enc.encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlDecode(str: string): string {
  const p = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(p + '='.repeat((4 - (p.length % 4)) % 4))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** Băm mật khẩu bằng PBKDF2-SHA256 (Web Crypto - chạy được trên Workers) */
export async function hashPassword(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: ITER, hash: 'SHA-256' },
    key,
    256
  )
  return 'pbkdf2$' + b64(bits)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Hỗ trợ hash seed dạng SEED$plaintext để tiện demo
  if (stored.startsWith('SEED$')) return stored.slice(5) === password
  const h = await hashPassword(password)
  return h === stored
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return b64(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function signToken(payload: Record<string, any>, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }))
  const sig = await hmac(`${header}.${body}`, secret)
  return `${header}.${body}.${sig}`
}

export async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    const [h, b, s] = token.split('.')
    if (!h || !b || !s) return null
    const expected = await hmac(`${h}.${b}`, secret)
    if (expected !== s) return null
    const payload = JSON.parse(b64urlDecode(b))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getSecret(c: Context): string {
  return (c.env as any)?.JWT_SECRET || 'srctool-ai-dev-secret-change-in-production'
}

export async function setSession(c: Context, user: SessionUser) {
  const token = await signToken(
    { id: user.id, email: user.email, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url },
    getSecret(c)
  )
  setCookie(c, COOKIE_NAME, token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30
  })
}

export function clearSession(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}

export async function getSession(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) return null
  const payload = await verifyToken(token, getSecret(c))
  if (!payload) return null
  return {
    id: payload.id, email: payload.email, full_name: payload.full_name,
    role: payload.role, avatar_url: payload.avatar_url
  }
}

export function genCode(prefix: string, len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  const arr = crypto.getRandomValues(new Uint8Array(len))
  for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length]
  return prefix + s
}

export function genLicenseKey(): string {
  const seg = () => genCode('', 4)
  return `${seg()}-${seg()}-${seg()}-${seg()}`
}
