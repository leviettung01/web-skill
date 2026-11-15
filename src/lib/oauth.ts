/* ============================================================
 *  GOOGLE OAUTH 2.0 HELPER (Web standard fetch + Web Crypto)
 * ========================================================== */

function readEnv(env: any, key: string): string {
  const fromBinding = env && typeof env[key] === 'string' ? env[key] : ''
  const fromProcess = typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string'
    ? process.env[key]!
    : ''
  return (fromBinding || fromProcess || '').trim()
}

export function getGoogleConfig(env: any) {
  const clientId = readEnv(env, 'GOOGLE_CLIENT_ID')
  const clientSecret = readEnv(env, 'GOOGLE_CLIENT_SECRET')
  return {
    clientId,
    clientSecret,
    enabled: Boolean(clientId && clientSecret)
  }
}

export function getRequestOrigin(c: any): string {
  const explicit = readEnv(c.env, 'SITE_URL').replace(/\/+$/, '')
  if (explicit) return explicit
  const proto = c.req.header('x-forwarded-proto') || new URL(c.req.url).protocol.replace(':', '') || 'https'
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || new URL(c.req.url).host
  const cleanProto = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? proto.split(',')[0].trim() : 'https'
  return `${cleanProto}://${host.split(',')[0].trim()}`
}

export function safeRedirectPath(next?: string | null, fallback = '/tai-khoan'): string {
  if (!next) return fallback
  const s = String(next).trim()
  if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/api/auth/')) return fallback
  return s
}

function toB64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export interface OAuthStatePayload {
  nonce: string
  next: string
  ref?: string
  exp: number
}

export async function signOAuthState(payload: OAuthStatePayload, secret: string): Promise<string> {
  const body = toB64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await importHmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return `${body}.${toB64Url(new Uint8Array(sig))}`
}

export async function verifyOAuthState(token: string, secret: string): Promise<OAuthStatePayload | null> {
  const parts = String(token || '').split('.')
  if (parts.length !== 2) return null
  const [body, sigB64] = parts
  try {
    const key = await importHmacKey(secret)
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      fromB64Url(sigB64),
      new TextEncoder().encode(body)
    )
    if (!ok) return null
    const data = JSON.parse(new TextDecoder().decode(fromB64Url(body))) as OAuthStatePayload
    if (!data?.exp || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function buildGoogleAuthUrl(opts: { clientId: string; redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: opts.state,
    prompt: 'select_account'
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export interface GoogleUserProfile {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export async function exchangeGoogleCode(opts: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<GoogleUserProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  })
  const tokenData: any = await tokenRes.json().catch(() => ({}))
  if (!tokenRes.ok || !tokenData?.access_token) {
    throw new Error(tokenData?.error_description || tokenData?.error || 'Google token exchange failed')
  }

  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })
  const profile: any = await userRes.json().catch(() => ({}))
  if (!userRes.ok || !profile?.sub || !profile?.email) {
    throw new Error('Không lấy được thông tin tài khoản Google')
  }
  return profile as GoogleUserProfile
}
