/**
 * ============================================================
 * Xử lý webhook biến động số dư ngân hàng
 * Hỗ trợ 2 nhà cung cấp: SePay (sepay.vn) & Casso (casso.vn)
 * ============================================================
 *
 * Luồng hoạt động:
 *  1. Khách chuyển khoản, nội dung CK chứa mã đơn (VD: "DHFT6A8R8X")
 *  2. Ngân hàng ghi nhận -> SePay/Casso đọc được -> POST về webhook của ta
 *  3. Ta xác thực token -> lưu giao dịch -> tách mã đơn từ nội dung
 *  4. Nếu khớp đơn + đủ tiền -> chuyển đơn sang 'paid' -> cấp license + hoa hồng
 */

/** Giao dịch đã chuẩn hoá từ mọi provider về 1 định dạng chung */
export interface NormalizedTx {
  provider: 'sepay' | 'casso'
  providerTxId: string
  gateway: string | null
  accountNumber: string | null
  transactionDate: string | null
  amountIn: number
  amountOut: number
  accumulated: number
  content: string
  referenceCode: string | null
}

/* ---------------------------------------------------------
 * 1. XÁC THỰC WEBHOOK
 * ------------------------------------------------------- */

/**
 * So sánh chuỗi chống timing-attack (constant time).
 * Không dùng === trực tiếp để tránh lộ thông tin qua thời gian phản hồi.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Xác thực request webhook.
 * SePay gửi:  Authorization: Apikey <token>
 * Casso gửi:  Authorization: Apikey <token>  (hoặc Secure-Token: <token>)
 * Ta chấp nhận cả 3 dạng để linh hoạt: Apikey, Bearer, Secure-Token.
 */
export function verifyWebhookAuth(headers: Headers, expectedKey: string): boolean {
  if (!expectedKey || expectedKey === 'CHANGE_ME_SECRET') return false

  const auth = headers.get('authorization') || ''
  const secureToken = headers.get('secure-token') || headers.get('x-secure-token') || ''

  // Dạng "Apikey xxx" hoặc "Bearer xxx"
  const m = auth.match(/^(?:Apikey|Bearer)\s+(.+)$/i)
  if (m && safeEqual(m[1].trim(), expectedKey)) return true

  // Dạng header riêng
  if (secureToken && safeEqual(secureToken.trim(), expectedKey)) return true

  return false
}

/* ---------------------------------------------------------
 * 2. CHUẨN HOÁ PAYLOAD THEO PROVIDER
 * ------------------------------------------------------- */

function toInt(v: any): number {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.abs(n) : 0
}

/**
 * SePay payload:
 * {
 *   "id": 92704,
 *   "gateway": "Vietcombank",
 *   "transactionDate": "2023-03-25 14:02:37",
 *   "accountNumber": "0123499999",
 *   "code": null,
 *   "content": "chuyen tien mua iphone DHFT6A8R8X",
 *   "transferType": "in",
 *   "transferAmount": 2277000,
 *   "accumulated": 19077000,
 *   "referenceCode": "MBVCB.3278907687",
 *   "description": "..."
 * }
 */
export function normalizeSePay(p: any): NormalizedTx {
  const isIn = String(p.transferType || '').toLowerCase() === 'in'
  const amt = toInt(p.transferAmount)
  return {
    provider: 'sepay',
    providerTxId: String(p.id ?? p.referenceCode ?? Date.now()),
    gateway: p.gateway ?? null,
    accountNumber: p.accountNumber ?? p.subAccount ?? null,
    transactionDate: p.transactionDate ?? null,
    amountIn: isIn ? amt : 0,
    amountOut: isIn ? 0 : amt,
    accumulated: toInt(p.accumulated),
    // content ưu tiên, fallback sang code/description
    content: String(p.content ?? p.code ?? p.description ?? ''),
    referenceCode: p.referenceCode ?? null,
  }
}

/**
 * Casso payload (v2):
 * {
 *   "error": 0,
 *   "data": [{
 *     "id": 3,
 *     "tid": "FT123456789",
 *     "description": "CT DEN:519002191111 DHFT6A8R8X",
 *     "amount": 5000,
 *     "cusum_balance": 100000,
 *     "when": "2021-05-24 15:37:00",
 *     "bank_sub_acc_id": "0000000000",
 *     "subAccId": "0000000000",
 *     "bankName": "Vietcombank"
 *   }]
 * }
 * Lưu ý: amount âm = tiền ra, dương = tiền vào.
 */
export function normalizeCasso(item: any): NormalizedTx {
  const raw = Number(item.amount) || 0
  return {
    provider: 'casso',
    providerTxId: String(item.tid ?? item.id ?? Date.now()),
    gateway: item.bankName ?? item.bank_name ?? null,
    accountNumber: item.subAccId ?? item.bank_sub_acc_id ?? null,
    transactionDate: item.when ?? null,
    amountIn: raw > 0 ? Math.round(raw) : 0,
    amountOut: raw < 0 ? Math.round(-raw) : 0,
    accumulated: toInt(item.cusum_balance),
    content: String(item.description ?? ''),
    referenceCode: item.tid ?? null,
  }
}

/** Tách danh sách giao dịch từ payload thô của bất kỳ provider */
export function extractTransactions(provider: string, body: any): NormalizedTx[] {
  // Casso gửi mảng trong body.data
  if (provider === 'casso' || Array.isArray(body?.data)) {
    const arr = Array.isArray(body?.data) ? body.data : []
    return arr.map(normalizeCasso)
  }
  // SePay gửi 1 object
  return [normalizeSePay(body)]
}

/* ---------------------------------------------------------
 * 3. TÁCH MÃ ĐƠN HÀNG TỪ NỘI DUNG CHUYỂN KHOẢN
 * ------------------------------------------------------- */

/**
 * Mã đơn của hệ thống có dạng: DH + 8 ký tự chữ/số in hoa (VD: DHFT6A8R8X)
 *
 * Thử thách thực tế: ngân hàng thường bóp méo nội dung CK
 *  - Chèn thêm text: "CT DEN:0011 DHFT6A8R8X TU NGUYEN VAN A"
 *  - Bỏ dấu cách:    "thanhtoandonDHFT6A8R8X"
 *  - Chữ thường:     "dhft6a8r8x"
 *  - Chèn dấu:       "DH-FT6A8R8X" / "DH_FT6A8R8X"
 *
 * Hàm này chuẩn hoá rồi quét mọi khả năng, trả về danh sách mã ứng viên
 * theo thứ tự ưu tiên (khớp chính xác trước).
 */
export function extractOrderCodes(content: string): string[] {
  if (!content) return []

  const upper = content.toUpperCase()
  // Loại bỏ mọi ký tự không phải chữ/số -> gộp thành 1 chuỗi liền
  const compact = upper.replace(/[^A-Z0-9]/g, '')

  const found = new Set<string>()

  // Quét trên chuỗi đã gộp: DH + 8 ký tự
  const re = /DH[A-Z0-9]{8}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(compact)) !== null) {
    found.add(m[0])
    // Cho phép mã chồng lấn (overlapping) để không bỏ sót
    re.lastIndex = m.index + 1
  }

  // Quét thêm trên chuỗi gốc (có dấu cách) để ưu tiên mã đứng độc lập
  const reWord = /\bDH[A-Z0-9]{8}\b/g
  const priority: string[] = []
  while ((m = reWord.exec(upper)) !== null) priority.push(m[0])

  // Mã đứng độc lập lên đầu danh sách
  const ordered = [...new Set([...priority, ...found])]
  return ordered
}

/* ---------------------------------------------------------
 * 4. TIỆN ÍCH
 * ------------------------------------------------------- */

/** Chuyển "2023-03-25 14:02:37" -> ISO string an toàn cho SQLite */
export function normalizeDate(d: string | null): string {
  if (!d) return new Date().toISOString()
  // Đã là ISO
  if (/^\d{4}-\d{2}-\d{2}T/.test(d)) return d
  // Dạng "YYYY-MM-DD HH:mm:ss"
  const m = d.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(:\d{2})?)/)
  if (m) return `${m[1]}T${m[2].length === 5 ? m[2] + ':00' : m[2]}.000Z`
  const t = Date.parse(d)
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

/** Sinh nội dung chuyển khoản gợi ý cho khách (ngắn, dễ nhập, không dấu) */
export function transferContent(orderCode: string): string {
  return orderCode
}
