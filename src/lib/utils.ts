export function formatVND(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}

export function discountPercent(price: number, original?: number | null): number {
  if (!original || original <= price) return 0
  return Math.round(((original - price) / original) * 100)
}

export function formatDate(s?: string | null): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(s?: string | null): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return s
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
  course: 'Khóa học',
  skill: 'Skill AI',
  chatbot: 'Chatbot',
  app: 'App Video AI',
  prompt: 'Bộ Prompt',
  tool: 'Phần Mềm',
  source: 'Source Code',
  combo: 'Combo'
}

/** Icon FontAwesome cho từng loại sản phẩm (dùng ở card & trang chi tiết) */
export const PRODUCT_TYPE_ICON: Record<string, string> = {
  course: 'fa-graduation-cap',
  skill: 'fa-wand-magic-sparkles',
  chatbot: 'fa-robot',
  app: 'fa-mobile-screen-button',
  prompt: 'fa-layer-group',
  tool: 'fa-gears',
  source: 'fa-code',
  combo: 'fa-box-open'
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
