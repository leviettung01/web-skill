import app from '../src/index'

function readBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Vercel serverless handler: Node req/res <-> Web Request/Response.
// c.env = process.env (chứa POSTGRES_URL...), nên middleware pgDb trong
// src/index.tsx tự kích hoạt khi không có D1 binding.
export default async function handler(req: any, res: any) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const url = new URL(req.url || '/', `${proto}://${host}`)
    const method = (req.method || 'GET').toUpperCase()

    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers as Record<string, any>)) {
      if (v === undefined || k === 'content-length') continue
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, String(x)))
      else headers.set(k, String(v))
    }

    const rawBody = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)
    const request = new Request(url.toString(), {
      method,
      headers,
      body: rawBody && rawBody.length ? (rawBody as any) : undefined,
    })

    const env = { ...(process.env as any) }
    const response = await app.fetch(request, env)

    res.statusCode = response.status
    const setCookies: string[] | undefined = (response.headers as any).getSetCookie?.()
    response.headers.forEach((v, k) => {
      const lk = k.toLowerCase()
      if (lk === 'set-cookie' || lk === 'content-encoding' || lk === 'content-length') return
      res.setHeader(k, v)
    })
    if (setCookies && setCookies.length) res.setHeader('set-cookie', setCookies)

    const buf = Buffer.from(await response.arrayBuffer())
    res.end(buf)
  } catch (e) {
    console.error('[vercel-handler]', e)
    if (!res.headersSent) res.statusCode = 500
    res.end('Internal Server Error')
  }
}
