/* ============================================================
 *  TRANSACTIONAL EMAIL HELPER (Resend REST API, zero-dependency)
 *  Works identically on Vercel Node Serverless & Cloudflare Workers
 * ========================================================== */

export function genTokenHex(bytes = 32): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export function escHtml(str: string | null | undefined): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function readEnv(env: any, key: string): string {
  const fromBinding = env && typeof env[key] === 'string' ? env[key] : ''
  const fromProcess = typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string'
    ? process.env[key]!
    : ''
  return (fromBinding || fromProcess || '').trim()
}

export function getEmailConfig(env: any) {
  const apiKey = readEnv(env, 'RESEND_API_KEY')
  const from = readEnv(env, 'EMAIL_FROM') || 'KhoSkill AI <noreply@khoskill.site>'
  return { apiKey, from, configured: Boolean(apiKey) }
}

export function isEmailConfigured(env: any): boolean {
  return getEmailConfig(env).configured
}

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(
  env: any,
  msg: EmailMessage
): Promise<{ ok: boolean; skipped?: boolean; id?: string; error?: string }> {
  const cfg = getEmailConfig(env)
  if (!cfg.configured) {
    return { ok: false, skipped: true, error: 'RESEND_API_KEY chưa được cấu hình trên máy chủ' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: cfg.from,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        ...(msg.text ? { text: msg.text } : {})
      })
    })
    const data: any = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data?.message || data?.error || `HTTP ${res.status}` }
    }
    return { ok: true, id: data?.id }
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) }
  }
}

export async function sendBatchEmails(
  env: any,
  messages: EmailMessage[]
): Promise<{ sent: number; failed: number; skipped?: boolean; error?: string }> {
  if (messages.length === 0) return { sent: 0, failed: 0 }
  const cfg = getEmailConfig(env)
  if (!cfg.configured) {
    return { sent: 0, failed: messages.length, skipped: true, error: 'RESEND_API_KEY chưa được cấu hình' }
  }

  let sent = 0
  let failed = 0
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map(m => ({
      from: cfg.from,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      ...(m.text ? { text: m.text } : {})
    }))
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chunk)
      })
      if (res.ok) {
        sent += chunk.length
      } else {
        failed += chunk.length
      }
    } catch {
      failed += chunk.length
    }
  }
  return { sent, failed }
}

function renderEmailShell(opts: {
  siteName?: string
  origin: string
  heading: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}) {
  const siteName = escHtml(opts.siteName || 'KhoSkill AI')
  const origin = escHtml(opts.origin)
  const heading = escHtml(opts.heading)
  const ctaBlock = opts.ctaLabel && opts.ctaUrl
    ? `<div style="margin:26px 0 8px;">
         <a href="${escHtml(opts.ctaUrl)}" style="display:inline-block;padding:13px 24px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#c026d3);color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;">
           ${escHtml(opts.ctaLabel)}
         </a>
       </div>`
    : ''
  const footerNote = opts.footerNote
    ? `<p style="margin:18px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">${opts.footerNote}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:24px 12px;background:#070614;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:0 auto;background:#0f0e24;border:1px solid #221e54;border-radius:20px;overflow:hidden;">
    <div style="padding:22px 26px;background:linear-gradient(135deg,#1b1846,#2a1459);border-bottom:1px solid #221e54;">
      <a href="${origin}" style="color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;letter-spacing:-0.3px;">${siteName}</a>
    </div>
    <div style="padding:28px 26px;font-size:14px;line-height:1.65;color:#cbd5e1;">
      <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#ffffff;">${heading}</h1>
      ${opts.bodyHtml}
      ${ctaBlock}
      ${footerNote}
    </div>
    <div style="padding:16px 26px;background:#090818;border-top:1px solid #1b1846;font-size:12px;color:#64748b;">
      © 2026 ${siteName} · <a href="${origin}/tai-khoan" style="color:#818cf8;text-decoration:none;">Trang tài khoản</a>
    </div>
  </div>
</body>
</html>`
}

export function buildVerificationEmail(opts: {
  to: string
  fullName: string
  verifyUrl: string
  siteName?: string
  origin: string
}): EmailMessage {
  const site = opts.siteName || 'KhoSkill AI'
  return {
    to: opts.to,
    subject: `[${site}] Xác minh địa chỉ email của bạn`,
    html: renderEmailShell({
      siteName: site,
      origin: opts.origin,
      heading: 'Xác minh email tài khoản',
      bodyHtml: `<p>Xin chào <b>${escHtml(opts.fullName)}</b>,</p>
        <p>Bạn vừa yêu cầu xác minh địa chỉ Gmail/Email trên <b>${escHtml(site)}</b> để nhận thông báo cập nhật Skill AI và kích hoạt chương trình Affiliate.</p>
        <p>Bấm nút bên dưới để hoàn tất xác minh (link có hiệu lực trong <b>30 phút</b>):</p>`,
      ctaLabel: 'Xác minh Email ngay',
      ctaUrl: opts.verifyUrl,
      footerNote: `Nếu nút không bấm được, hãy copy đường dẫn sau vào trình duyệt:<br><span style="color:#a5b4fc;word-break:break-all;">${escHtml(opts.verifyUrl)}</span>`
    }),
    text: `Xin chao ${opts.fullName},\n\nBam vao link sau de xac minh email tai ${site} (hieu luc 30 phut):\n${opts.verifyUrl}`
  }
}

export function buildPasswordResetEmail(opts: {
  to: string
  fullName: string
  resetUrl: string
  siteName?: string
  origin: string
}): EmailMessage {
  const site = opts.siteName || 'KhoSkill AI'
  return {
    to: opts.to,
    subject: `[${site}] Yêu cầu đặt lại mật khẩu`,
    html: renderEmailShell({
      siteName: site,
      origin: opts.origin,
      heading: 'Đặt lại mật khẩu đăng nhập',
      bodyHtml: `<p>Xin chào <b>${escHtml(opts.fullName)}</b>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <b>${escHtml(opts.to)}</b>.</p>
        <p>Link đặt lại mật khẩu có hiệu lực trong <b>30 phút</b>. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>`,
      ctaLabel: 'Đặt lại mật khẩu mới',
      ctaUrl: opts.resetUrl,
      footerNote: `Đường dẫn dự phòng:<br><span style="color:#a5b4fc;word-break:break-all;">${escHtml(opts.resetUrl)}</span>`
    }),
    text: `Dat lai mat khau tai ${site}: ${opts.resetUrl}`
  }
}

export function buildOrderPaidEmail(opts: {
  to: string
  fullName: string
  orderCode: string
  totalFormatted: string
  items: { product_name: string; license_key?: string }[]
  accountUrl: string
  siteName?: string
  origin: string
}): EmailMessage {
  const site = opts.siteName || 'KhoSkill AI'
  const itemsHtml = opts.items.map(it => `<li style="margin:8px 0;padding:10px 12px;border-radius:10px;background:#161436;border:1px solid #2a2559;">
      <div style="font-weight:700;color:#ffffff;">${escHtml(it.product_name)}</div>
      ${it.license_key ? `<div style="margin-top:4px;font-family:monospace;font-size:12px;color:#34d399;">License Key: ${escHtml(it.license_key)}</div>` : ''}
    </li>`).join('')

  return {
    to: opts.to,
    subject: `[${site}] Đơn hàng ${opts.orderCode} đã thanh toán thành công`,
    html: renderEmailShell({
      siteName: site,
      origin: opts.origin,
      heading: `Thanh toán thành công — ${opts.orderCode}`,
      bodyHtml: `<p>Xin chào <b>${escHtml(opts.fullName)}</b>,</p>
        <p>Đơn hàng <b>${escHtml(opts.orderCode)}</b> trị giá <b>${escHtml(opts.totalFormatted)}</b> đã được xác nhận và kích hoạt bản quyền trọn đời:</p>
        <ul style="list-style:none;padding:0;margin:14px 0;">${itemsHtml}</ul>
        <p>Truy cập mục <b>Sản phẩm của tôi</b> để tải bộ Skill hoặc lấy cấu hình kết nối <b>MCP (Claude / Codex / Antigravity)</b> cùng License Key của bạn. Khi có phiên bản mới, bạn cũng sẽ nhận được thông báo tự động.</p>`,
      ctaLabel: 'Mở Sản phẩm của tôi',
      ctaUrl: opts.accountUrl
    }),
    text: `Don hang ${opts.orderCode} (${opts.totalFormatted}) da duoc kich hoat. Truy cap ${opts.accountUrl} de tai san pham.`
  }
}

export function buildProductUpdateEmail(opts: {
  to: string
  fullName: string
  productName: string
  version: string
  changelog: string
  accountUrl: string
  siteName?: string
  origin: string
}): EmailMessage {
  const site = opts.siteName || 'KhoSkill AI'
  const notes = opts.changelog
    ? `<div style="margin:14px 0;padding:12px 14px;border-radius:12px;background:#161436;border:1px solid #2a2559;white-space:pre-line;color:#e2e8f0;">${escHtml(opts.changelog)}</div>`
    : ''
  return {
    to: opts.to,
    subject: `[${site}] Cập nhật mới ${opts.version}: ${opts.productName}`,
    html: renderEmailShell({
      siteName: site,
      origin: opts.origin,
      heading: `Bản cập nhật ${opts.version} đã sẵn sàng`,
      bodyHtml: `<p>Xin chào <b>${escHtml(opts.fullName)}</b>,</p>
        <p>Sản phẩm <b>${escHtml(opts.productName)}</b> bạn đã sở hữu vừa có bản cập nhật <b>${escHtml(opts.version)}</b>:</p>
        ${notes}
        <p>Hãy truy cập mục <b>Sản phẩm của tôi</b> để tải phiên bản mới nhất miễn phí.</p>`,
      ctaLabel: 'Tải phiên bản mới ngay',
      ctaUrl: opts.accountUrl
    }),
    text: `${opts.productName} co ban cap nhat ${opts.version}. Xem chi tiet & tai ve tai: ${opts.accountUrl}`
  }
}

export function buildAdminDirectEmail(opts: {
  to: string
  fullName: string
  title: string
  message: string
  linkUrl?: string
  siteName?: string
  origin: string
}): EmailMessage {
  const site = opts.siteName || 'KhoSkill AI'
  const absLink = opts.linkUrl
    ? (opts.linkUrl.startsWith('http://') || opts.linkUrl.startsWith('https://') ? opts.linkUrl : `${opts.origin}${opts.linkUrl.startsWith('/') ? '' : '/'}${opts.linkUrl}`)
    : undefined
  return {
    to: opts.to,
    subject: `[${site}] ${opts.title}`,
    html: renderEmailShell({
      siteName: site,
      origin: opts.origin,
      heading: opts.title,
      bodyHtml: `<p>Xin chào <b>${escHtml(opts.fullName)}</b>,</p>
        <div style="margin:14px 0;padding:14px;border-radius:12px;background:#161436;border:1px solid #2a2559;white-space:pre-line;color:#e2e8f0;">${escHtml(opts.message)}</div>`,
      ctaLabel: absLink ? 'Mở liên kết đính kèm' : undefined,
      ctaUrl: absLink
    }),
    text: `${opts.title}\n\n${opts.message}${absLink ? `\n\nLink: ${absLink}` : ''}`
  }
}
