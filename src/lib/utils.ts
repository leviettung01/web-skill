export function formatVND(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}

export function discountPercent(price: number, original?: number | null): number {
  if (!original || original <= price) return 0
  return Math.round(((original - price) / original) * 100)
}

export function parseSafeDate(s?: string | null): Date | null {
  if (!s) return null
  const trimmed = String(s).trim()
  if (!trimmed) return null
  const iso = trimmed.includes('T')
    ? trimmed
    : trimmed.replace(' ', 'T') + (/[zZ]$|[+-]\d{2}(:?\d{2})?$/.test(trimmed) ? '' : 'Z')
  const normalized = iso.replace(/([+-]\d{2})$/, '$1:00')
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(s?: string | null): string {
  if (!s) return '—'
  const d = parseSafeDate(s)
  if (!d) return s
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh'
  })
}

export function formatDateTime(s?: string | null): string {
  if (!s) return '—'
  const d = parseSafeDate(s)
  if (!d) return s
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
}

export function parseJSON<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try { return JSON.parse(s) as T } catch { return fallback }
}

export function slugify(str: string): string {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

export function stripHtml(html: string, max = 160): string {
  const t = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > max ? t.slice(0, max) + '…' : t
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

/** Ảnh thumbnail gradient tự sinh khi sản phẩm chưa có ảnh */
const GRADIENTS = [
  ['#6366f1', '#a855f7'], ['#8b5cf6', '#ec4899'], ['#06b6d4', '#3b82f6'],
  ['#f59e0b', '#ef4444'], ['#10b981', '#06b6d4'], ['#ec4899', '#f43f5e'],
  ['#3b82f6', '#8b5cf6'], ['#14b8a6', '#22c55e']
]
export function gradientFor(id: number): string {
  const [a, b] = GRADIENTS[id % GRADIENTS.length]
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
}

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  skill: 'Skill AI',
  mcp_skill: 'Skill AI Agent (MCP)',
  course: 'Khóa học',
  chatbot: 'Chatbot',
  app: 'App Video AI',
  prompt: 'Bộ Prompt',
  tool: 'Phần Mềm',
  source: 'Source Code',
  combo: 'Combo'
}

/** Icon FontAwesome cho từng loại sản phẩm (dùng ở card & trang chi tiết) */
export const PRODUCT_TYPE_ICON: Record<string, string> = {
  skill: 'fa-wand-magic-sparkles',
  mcp_skill: 'fa-plug-circle-bolt',
  course: 'fa-graduation-cap',
  chatbot: 'fa-robot',
  app: 'fa-mobile-screen-button',
  prompt: 'fa-layer-group',
  tool: 'fa-gears',
  source: 'fa-code',
  combo: 'fa-box-open'
}

export function isMcpSkill(type?: string | null): boolean {
  return type === 'mcp_skill'
}

export function parseMcpClients(raw?: string | null): string[] {
  const arr = parseJSON<any>(raw, null)
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.map(x => String(x || '').trim()).filter(Boolean)
  }
  return ['Claude', 'Codex', 'Antigravity']
}

export interface McpToolDef {
  name: string
  description: string
}

export const DEFAULT_MCP_TOOLS: McpToolDef[] = [
  { name: 'list_licensed_skills', description: 'Liệt kê toàn bộ Skill AI Agent (MCP) đang kích hoạt theo License Key' },
  { name: 'get_skill_blueprint', description: 'Nạp quy trình, luật khóa nhân vật, Hook-Body-CTA và template prompt chuẩn của Skill' },
  { name: 'generate_video_storyboard', description: 'Tự động tách chủ đề thành storyboard 30s kèm prompt từng cảnh cho Seedance 2.5 / Muse AI / Veo 3' },
  { name: 'create_video_from_skill', description: 'Chạy pipeline tạo video theo Skill (xuất gói render + SRT phụ đề hoặc đẩy qua render webhook)' }
]

export function parseMcpTools(raw?: string | null): McpToolDef[] {
  const parsed = parseJSON<any>(raw, null)
  if (Array.isArray(parsed) && parsed.length > 0) {
    const out: McpToolDef[] = []
    for (const item of parsed) {
      if (typeof item === 'string' && item.trim()) {
        const [name, ...rest] = item.split('|')
        out.push({ name: name.trim(), description: rest.join('|').trim() || 'MCP Skill Tool' })
      } else if (item && typeof item === 'object' && item.name) {
        out.push({ name: String(item.name).trim(), description: String(item.description || '').trim() })
      }
    }
    if (out.length > 0) return out
  }
  return DEFAULT_MCP_TOOLS
}

/** URL ảnh QR VietQR cho thanh toán chuyển khoản */
export function vietQrUrl(bankCode: string, account: string, amount: number, content: string, owner: string) {
  const p = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName: owner
  })
  return `https://img.vietqr.io/image/${bankCode}-${account}-compact2.png?${p.toString()}`
}

/** Kiểm tra URL video trực tiếp (.mp4/.webm/.mov) từ R2/CDN */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url.trim())
}

/** Chuẩn hóa link YouTube (/watch?v=, youtu.be/, /shorts/) sang URL embed */
export function toEmbedVideoUrl(url?: string | null): string {
  const raw = (url || '').trim()
  if (!raw) return ''
  if (raw.includes('/embed/')) return raw
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    let id = ''
    if (host === 'youtu.be') {
      id = u.pathname.split('/').filter(Boolean)[0] || ''
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2] || ''
      else if (u.pathname.startsWith('/live/')) id = u.pathname.split('/')[2] || ''
      else id = u.searchParams.get('v') || ''
    }
    if (id) return `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`
  } catch {}
  return raw
}
