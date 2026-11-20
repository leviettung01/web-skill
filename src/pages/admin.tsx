import type { FC, PropsWithChildren } from 'hono/jsx'
import { StatusBadge, Pagination, EmptyState } from '../components/ui'
import { formatVND, formatDate, formatDateTime, PRODUCT_TYPE_LABEL, isMcpSkill, parseMcpClients, parseMcpTools } from '../lib/utils'
import type { SessionUser } from '../lib/types'

interface AdminProps {
  user: SessionUser
  activeKey: string
  heading: string
  sub?: string
  title?: string
}

const MENU = [
  { href: '/admin', icon: 'fa-gauge-high', label: 'Dashboard', key: 'dash' },
  { href: '/admin/san-pham', icon: 'fa-cubes', label: 'Sản phẩm', key: 'products' },
  { href: '/admin/danh-muc', icon: 'fa-folder-tree', label: 'Danh mục', key: 'categories' },
  { href: '/admin/don-hang', icon: 'fa-receipt', label: 'Đơn hàng', key: 'orders' },
  { href: '/admin/giao-dich', icon: 'fa-building-columns', label: 'Giao dịch NH', key: 'banktx' },
  { href: '/admin/thanh-vien', icon: 'fa-users', label: 'Thành viên', key: 'users' },
  { href: '/admin/ma-giam-gia', icon: 'fa-ticket', label: 'Mã giảm giá', key: 'coupons' },
  { href: '/admin/bai-viet', icon: 'fa-newspaper', label: 'Bài viết', key: 'posts' },
  { href: '/admin/danh-gia', icon: 'fa-star', label: 'Đánh giá', key: 'reviews' },
  { href: '/admin/ho-tro', icon: 'fa-headset', label: 'Hỗ trợ', key: 'tickets' },
  { href: '/admin/cai-dat', icon: 'fa-gear', label: 'Cài đặt', key: 'settings' }
]

export const AdminShell: FC<PropsWithChildren<AdminProps>> = (props) => (
  <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.heading} | Quản trị KhoSkill AI</title>
      <meta name="robots" content="noindex,nofollow" />
      <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
      <script src="https://cdn.tailwindcss.com"></script>
      <script dangerouslySetInnerHTML={{
        __html: `tailwind.config={theme:{extend:{colors:{brand:{50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81'}},fontFamily:{sans:['Be Vietnam Pro','system-ui','sans-serif']}}}}`
      }}></script>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
      <link href="/static/style.css?v=20261123" rel="stylesheet" />
    </head>
    <body class="bg-slate-100 text-slate-800 antialiased">
      <div class="flex min-h-screen">
        {/* Sidebar */}
        <aside id="admin-sidebar" class="w-60 bg-slate-900 text-slate-300 flex-col fixed inset-y-0 left-0 z-40 hidden lg:flex">
          <a href="/admin" class="h-16 flex items-center gap-2.5 px-5 border-b border-slate-800 shrink-0">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-white">
              <i class="fas fa-shield-halved text-sm"></i>
            </div>
            <div class="leading-none">
              <div class="font-extrabold text-white text-sm">Admin Panel</div>
              <div class="text-[10px] text-slate-500 mt-0.5">KhoSkill AI</div>
            </div>
          </a>
          <nav class="flex-1 overflow-y-auto p-3 space-y-0.5">
            {MENU.map(m => (
              <a href={m.href} class={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${props.activeKey === m.key ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                <i class={`fas ${m.icon} w-4 text-center`}></i>{m.label}
              </a>
            ))}
          </nav>
          <div class="p-3 border-t border-slate-800 space-y-0.5">
            <a href="/" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 hover:text-white transition">
              <i class="fas fa-arrow-left w-4 text-center"></i>Về trang chủ
            </a>
            <a href="/dang-xuat" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-950 transition">
              <i class="fas fa-right-from-bracket w-4 text-center"></i>Đăng xuất
            </a>
          </div>
        </aside>

        <div class="flex-1 lg:ml-60 min-w-0">
          <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center gap-4 px-5">
            <button id="admin-menu-btn" class="lg:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100"><i class="fas fa-bars"></i></button>
            <div class="min-w-0">
              <h1 class="font-extrabold text-slate-900 truncate">{props.heading}</h1>
              {props.sub && <p class="text-xs text-slate-500 truncate">{props.sub}</p>}
            </div>
            <div class="ml-auto flex items-center gap-3">
              <a href="/" target="_blank" class="hidden sm:flex h-9 px-3.5 items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">
                <i class="fas fa-arrow-up-right-from-square text-xs"></i>Xem site
              </a>
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold">
                  {props.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div class="hidden md:block leading-none">
                  <div class="text-sm font-semibold">{props.user.full_name}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Quản trị viên</div>
                </div>
              </div>
            </div>
          </header>
          <main class="p-5">{props.children}</main>
        </div>
      </div>

      <div id="toast-container" class="fixed top-20 right-4 z-[100] flex flex-col gap-2"></div>
      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js"></script>
      <script src="/static/app.js?v=20261123"></script>
      <script src="/static/admin.js?v=20261123"></script>
    </body>
  </html>
)

/* ---------------- DASHBOARD ---------------- */
export const AdminDashboard: FC<AdminProps & {
  stats: any; recentOrders: any[]; topProducts: any[]; chart: { label: string; value: number }[]; setupWarnings?: { text: string; href: string; action: string }[]
}> = (props) => {
  const max = Math.max(...props.chart.map(c => c.value), 1)
  return (
    <AdminShell {...props} activeKey="dash" heading="Dashboard" sub="Tổng quan hoạt động hệ thống">
      {(props.setupWarnings?.length || 0) > 0 && (
        <div class="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div class="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2">
            <i class="fas fa-triangle-exclamation text-amber-600"></i>
            Checklist cấu hình trước khi nhận đơn hàng thật
          </div>
          <ul class="space-y-1.5 text-xs text-amber-800">
            {props.setupWarnings!.map(w => (
              <li class="flex items-center justify-between gap-3 flex-wrap">
                <span>• {w.text}</span>
                <a href={w.href} class="px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 font-semibold text-amber-900 whitespace-nowrap">{w.action} →</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {[
          ['fa-sack-dollar', 'Doanh thu', formatVND(props.stats.revenue), 'from-emerald-500 to-teal-600', `${props.stats.paidOrders} đơn đã thanh toán`],
          ['fa-receipt', 'Tổng đơn hàng', String(props.stats.orders), 'from-brand-500 to-brand-600', `${props.stats.pendingOrders} đơn chờ xử lý`],
          ['fa-users', 'Thành viên', String(props.stats.users), 'from-fuchsia-500 to-purple-600', `+${props.stats.newUsers} trong 30 ngày`],
          ['fa-cubes', 'Sản phẩm', String(props.stats.products), 'from-amber-500 to-orange-600', `${props.stats.totalSold} lượt bán`]
        ].map(([ic, lb, val, grad, note]) => (
          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <div class="flex items-start justify-between mb-3.5">
              <div class={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center shadow-lg`}><i class={`fas ${ic}`}></i></div>
            </div>
            <div class="text-2xl font-extrabold text-slate-900 leading-none mb-1.5">{val}</div>
            <div class="text-xs text-slate-500">{lb}</div>
            <div class="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">{note}</div>
          </div>
        ))}
      </div>

      <div class="grid lg:grid-cols-[1.4fr_1fr] gap-5 mb-5">
        <div class="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 class="font-bold text-slate-900 mb-5">Doanh thu 7 ngày gần nhất</h3>
          <div class="flex items-end gap-2 h-48">
            {props.chart.map(c => (
              <div class="flex-1 flex flex-col items-center gap-2">
                <div class="text-[10px] font-bold text-slate-600">{c.value > 0 ? (c.value / 1000).toFixed(0) + 'k' : ''}</div>
                <div class="w-full bg-gradient-to-t from-brand-600 to-fuchsia-500 rounded-t-lg transition-all hover:opacity-80"
                  style={`height:${Math.max((c.value / max) * 100, 2)}%`} title={formatVND(c.value)}></div>
                <div class="text-[10px] text-slate-500 whitespace-nowrap">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200"><h3 class="font-bold text-slate-900">Sản phẩm bán chạy</h3></div>
          <div class="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {props.topProducts.map((p, i) => (
              <div class="flex items-center gap-3 px-5 py-3">
                <div class={`w-7 h-7 rounded-lg grid place-items-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</div>
                  <div class="text-[11px] text-slate-500">{p.sold_count} lượt bán</div>
                </div>
                <div class="text-sm font-bold text-slate-900 shrink-0">{formatVND(p.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-bold text-slate-900">Đơn hàng gần đây</h3>
          <a href="/admin/don-hang" class="text-xs font-semibold text-brand-600 hover:underline">Xem tất cả</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full admin-table text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr><th class="text-left">Mã đơn</th><th class="text-left">Khách hàng</th><th class="text-left">Ngày</th><th class="text-right">Tổng tiền</th><th class="text-center">Trạng thái</th><th></th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {props.recentOrders.map(o => (
                <tr>
                  <td><b class="text-brand-600">{o.order_code}</b></td>
                  <td><div class="font-medium text-slate-800">{o.full_name}</div><div class="text-xs text-slate-500">{o.email}</div></td>
                  <td class="text-slate-500 whitespace-nowrap">{formatDate(o.created_at)}</td>
                  <td class="text-right font-bold">{formatVND(o.total)}</td>
                  <td class="text-center"><StatusBadge status={o.status} /></td>
                  <td class="text-right"><a href={`/admin/don-hang/${o.id}`} class="text-brand-600 hover:underline text-xs font-semibold">Chi tiết</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  )
}

/* ---------------- PRODUCTS ---------------- */
export const AdminProducts: FC<AdminProps & { products: any[]; categories: any[]; page: number; totalPages: number; q: string }> = (props) => (
  <AdminShell {...props} activeKey="products" heading="Quản lý sản phẩm" sub={`${props.products.length} sản phẩm hiển thị`}>
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <form action="/admin/san-pham" method="get" class="flex-1 min-w-[200px] max-w-sm">
        <div class="relative">
          <input type="text" name="q" value={props.q} placeholder="Tìm sản phẩm..."
            class="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm" />
          <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        </div>
      </form>
      <a href="/admin/san-pham/moi" class="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition ml-auto">
        <i class="fas fa-plus"></i>Thêm sản phẩm
      </a>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full admin-table text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr><th class="text-left">Sản phẩm</th><th class="text-left">Danh mục</th><th class="text-right">Giá</th><th class="text-center">Đã bán</th><th class="text-center">Trạng thái</th><th class="text-right">Thao tác</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {props.products.map(p => (
              <tr>
                <td>
                  <div class="font-semibold text-slate-900 line-clamp-1 max-w-xs">{p.name}</div>
                  <div class="text-xs text-slate-500 flex gap-2 mt-0.5">
                    <span class={`px-1.5 py-0.5 rounded font-medium ${isMcpSkill(p.product_type) ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-brand-50 text-brand-700'}`}>
                      {isMcpSkill(p.product_type) && <i class="fas fa-plug-circle-bolt mr-1 text-[10px]"></i>}
                      {PRODUCT_TYPE_LABEL[p.product_type]}
                    </span>
                    <span>{p.version}</span>
                    {p.is_hot === 1 && <span class="text-orange-600 font-semibold">HOT</span>}
                    {p.is_featured === 1 && <span class="text-amber-600 font-semibold">★</span>}
                  </div>
                </td>
                <td class="text-slate-600">{p.category_name || '—'}</td>
                <td class="text-right">
                  <div class="font-bold text-slate-900">{formatVND(p.price)}</div>
                  {p.original_price > p.price && <div class="text-xs text-slate-400 line-through">{formatVND(p.original_price)}</div>}
                </td>
                <td class="text-center font-semibold">{p.sold_count}</td>
                <td class="text-center"><StatusBadge status={p.status} /></td>
                <td class="text-right whitespace-nowrap">
                  <a href={`/san-pham/${p.slug}`} target="_blank" class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500" title="Xem"><i class="fas fa-eye text-xs"></i></a>
                  <a href={`/admin/san-pham/${p.id}`} class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-brand-50 text-brand-600" title="Sửa"><i class="fas fa-pen text-xs"></i></a>
                  <button class="btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500" title="Xoá"
                    data-url={`/api/admin/products/${p.id}`} data-name={p.name}><i class="fas fa-trash-can text-xs"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Pagination page={props.page} totalPages={props.totalPages} baseUrl={'/admin/san-pham' + (props.q ? '?q=' + encodeURIComponent(props.q) : '')} />
  </AdminShell>
)

/* ---------------- PRODUCT FORM ---------------- */
const fieldCls = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

export const AdminProductForm: FC<AdminProps & { product: any; categories: any[]; isNew: boolean; releases?: any[] }> = (props) => {
  const p = props.product || {}
  return (
    <AdminShell {...props} activeKey="products" heading={props.isNew ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'} sub={props.isNew ? '' : p.name}>
      <form action={props.isNew ? '/api/admin/products' : `/api/admin/products/${p.id}/update`} method="post" data-ajax class="grid lg:grid-cols-[1fr_320px] gap-5">
        <div class="space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Thông tin cơ bản</h3>
            <div>
              <label class={labelCls}>Tên sản phẩm *</label>
              <input type="text" name="name" value={p.name || ''} required class={fieldCls} />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class={labelCls}>Slug (URL) *</label>
                <input type="text" name="slug" value={p.slug || ''} required placeholder="ten-san-pham" class={fieldCls} />
              </div>
              <div>
                <label class={labelCls}>Phiên bản</label>
                <input type="text" name="version" value={p.version || 'v1.0'} class={fieldCls} />
              </div>
            </div>
            <div>
              <label class={labelCls}>Mô tả ngắn</label>
              <textarea name="short_desc" rows={2} class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y">{p.short_desc || ''}</textarea>
            </div>
            <div>
              <label class={labelCls}>Mô tả chi tiết (HTML)</label>
              <textarea name="description" rows={12} class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm font-mono resize-y">{p.description || ''}</textarea>
              <p class="text-xs text-slate-400 mt-1">Hỗ trợ HTML: &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt;, &lt;b&gt;, &lt;code&gt;</p>
            </div>
          </div>

          {/* New prominent image and video demo section */}
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900 flex items-center gap-2"><i class="fas fa-photo-film text-brand-500"></i>Hình ảnh &amp; Video mô tả sản phẩm</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class={labelCls}>Ảnh đại diện sản phẩm (URL)</label>
                <input type="url" name="thumbnail" value={p.thumbnail || ''} placeholder="https://..." class={fieldCls} />
              </div>
              <div>
                <label class={labelCls}>Video Demo sản phẩm (YouTube hoặc link MP4)</label>
                <input type="text" name="demo_video_url" value={p.demo_video_url || ''} placeholder="/static/demos/demo.mp4 hoặc https://youtu.be/..." class={fieldCls} />
                <p class="text-[11px] text-slate-400 mt-1">Video thành phẩm sau edit (MP4, YouTube, hoặc Google Drive preview).</p>
              </div>
              <div class="sm:col-span-2">
                <label class={labelCls}>Video Raw gốc trước khi Edit (Tuỳ chọn — bật giao diện So sánh Trước / Sau)</label>
                <input type="text" name="raw_video_url" value={p.raw_video_url || ''} placeholder="/static/demos/raw-talking-head.mp4 (để trống nếu không cần so sánh Trước/Sau)" class={fieldCls} />
                <p class="text-[11px] text-slate-400 mt-1">Dành cho Skill Talking Head / Walking Talking Head: khi có link MP4 Raw, trang chi tiết tự động bật trình phát so sánh đồng bộ <b>Song song (Raw | Sau Edit)</b> và <b>Kéo gạt Trước/Sau</b>.</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Nội dung bàn giao</h3>
            <div>
              <label class={labelCls}>🔗 Link tải Skill / Tài liệu bàn giao <span class="text-slate-400 font-normal">(tuỳ chọn nếu là Skill AI Agent MCP)</span></label>
              <input type="url" name="download_url" value={p.download_url || ''} placeholder="https://drive.google.com/..." class={fieldCls} />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class={labelCls}>Link tài liệu hướng dẫn</label>
                <input type="url" name="doc_url" value={p.doc_url || ''} class={fieldCls} />
              </div>
              <div>
                <label class={labelCls}>Dung lượng file / Định dạng</label>
                <input type="text" name="file_size" value={p.file_size || ''} placeholder="248 MB hoặc MCP Live API" class={fieldCls} />
              </div>
            </div>
            <div>
              <label class={labelCls}>Link demo trực tiếp</label>
              <input type="url" name="demo_url" value={p.demo_url || ''} class={fieldCls} />
            </div>
          </div>

          <div id="mcp-config-card" class={`rounded-2xl border p-5 space-y-4 transition ${isMcpSkill(p.product_type) ? 'bg-cyan-50/40 border-cyan-300 ring-2 ring-cyan-200/60' : 'bg-white border-slate-200'}`}>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-bold text-slate-900 flex items-center gap-2">
                <i class="fas fa-plug-circle-bolt text-cyan-600"></i>Cấu hình MCP cho AI Agent (Claude / Codex / Antigravity)
              </h3>
              <span id="mcp-mode-badge" class={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isMcpSkill(p.product_type) ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {isMcpSkill(p.product_type) ? 'Đang kích hoạt chế độ MCP' : 'Dành cho loại Skill AI Agent (MCP)'}
              </span>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">
              Khi chọn loại sản phẩm <b>Skill AI Agent (MCP)</b>, khách mua xong sẽ nhận ngay cấu hình MCP + License Key để cắm trực tiếp vào Claude, Codex, Antigravity. Để trống <b>MCP Endpoint</b> để dùng luôn endpoint tích hợp sẵn <code class="font-mono bg-slate-100 px-1 rounded">/api/mcp/{p.slug || 'slug-san-pham'}</code>.
            </p>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class={labelCls}>Tên MCP Server Key</label>
                <input type="text" name="mcp_server_name" value={p.mcp_server_name || ''} placeholder="khoskill-video-viral" class={fieldCls} />
              </div>
              <div>
                <label class={labelCls}>AI Agent hỗ trợ (phân cách dấu phẩy)</label>
                <input type="text" name="mcp_clients_text" value={p.mcp_clients ? parseMcpClients(p.mcp_clients).join(', ') : 'Claude, Codex, Antigravity'} placeholder="Claude, Codex, Antigravity" class={fieldCls} />
              </div>
            </div>
            <div>
              <label class={labelCls}>MCP Server Endpoint tuỳ chỉnh <span class="text-slate-400 font-normal">(để trống = dùng /api/mcp/slug có sẵn)</span></label>
              <input type="url" name="mcp_endpoint" value={p.mcp_endpoint || ''} placeholder="https://mcp.domain-cua-ban.com/mcp (tuỳ chọn)" class={fieldCls} />
            </div>
            <div>
              <label class={labelCls}>Danh sách MCP Tools hiển thị &amp; expose (mỗi dòng: <code>ten_tool | Mô tả</code>)</label>
              <textarea name="mcp_tools_text" rows={4} placeholder={'list_licensed_skills | Liệt kê Skill MCP đã kích hoạt\nget_skill_blueprint | Nạp quy trình & công thức Skill\ngenerate_video_storyboard | Sinh storyboard 30s + prompt từng cảnh\ncreate_video_from_skill | Chạy pipeline tạo video theo Skill'}
                class="w-full p-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none text-xs font-mono resize-y">{p.mcp_tools ? parseMcpTools(p.mcp_tools).map(t => `${t.name} | ${t.description}`).join('\n') : ''}</textarea>
            </div>
            <div>
              <label class={labelCls}>Nội dung Skill Blueprint / System Prompt trả về qua MCP (Markdown)</label>
              <textarea name="mcp_skill_prompt" rows={8} placeholder="# SKILL BLUEPRINT&#10;Nhập toàn bộ quy trình, luật khóa nhân vật, công thức Hook-Body-CTA mà AI Agent sẽ nạp khi gọi tool get_skill_blueprint / create_video_from_skill..."
                class="w-full p-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none text-xs font-mono resize-y">{p.mcp_skill_prompt || ''}</textarea>
            </div>
            <div>
              <label class={labelCls}>Webhook / API Render Video bên ngoài <span class="text-slate-400 font-normal">(tuỳ chọn — nếu nhập, tool create_video_from_skill sẽ POST job sang đây)</span></label>
              <input type="url" name="mcp_render_webhook" value={p.mcp_render_webhook || ''} placeholder="https://worker.domain.com/render-video (tuỳ chọn)" class={fieldCls} />
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Tính năng &amp; Công nghệ</h3>
            <div>
              <label class={labelCls}>Danh sách tính năng (mỗi dòng 1 mục)</label>
              <textarea name="features_text" rows={6} class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y">{(() => { try { return JSON.parse(p.features || '[]').join('\n') } catch { return '' } })()}</textarea>
            </div>
            <div>
              <label class={labelCls}>Công nghệ (mỗi dòng 1 mục)</label>
              <textarea name="tech_text" rows={4} class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y">{(() => { try { return JSON.parse(p.tech_stack || '[]').join('\n') } catch { return '' } })()}</textarea>
            </div>
          </div>
        </div>

        <aside class="space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Giá bán</h3>
            <div>
              <label class={labelCls}>Giá bán (VND) *</label>
              <input type="number" name="price" value={p.price || 0} required min="0" step="1000" class={fieldCls} />
            </div>
            <div>
              <label class={labelCls}>Giá gốc (gạch ngang)</label>
              <input type="number" name="original_price" value={p.original_price || ''} min="0" step="1000" class={fieldCls} />
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Phân loại</h3>
            <div>
              <label class={labelCls}>Danh mục</label>
              <select name="category_id" class={fieldCls}>
                {props.categories.map(c => <option value={c.id} selected={p.category_id === c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label class={labelCls}>Loại sản phẩm</label>
              <select name="product_type" class={fieldCls}>
                {Object.entries(PRODUCT_TYPE_LABEL).map(([v, l]) => <option value={v} selected={p.product_type === v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label class={labelCls}>Trạng thái</label>
              <select name="status" class={fieldCls}>
                <option value="published" selected={!p.status || p.status === 'published'}>Đang mở bán</option>
                <option value="coming_soon" selected={p.status === 'coming_soon'}>Chưa mở bán</option>
                <option value="draft" selected={p.status === 'draft'}>Nháp (ẩn)</option>
              </select>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 class="font-bold text-slate-900">Đánh dấu</h3>
            {[['is_featured', 'Nổi bật (trang chủ)'], ['is_hot', 'Bán chạy (HOT)'], ['is_new', 'Mới ra mắt']].map(([n, l]) => (
              <label class="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" name={n} value="1" checked={p[n] === 1} class="accent-brand-600 w-4 h-4" />{l}
              </label>
            ))}
          </div>

          {!props.isNew && (
            <div class="bg-white rounded-2xl border border-indigo-200 p-5 space-y-3">
              <h3 class="font-bold text-slate-900 flex items-center gap-2">
                <i class="fas fa-rocket text-indigo-600"></i>Phát hành cập nhật
              </h3>
              <p class="text-xs text-slate-500">Khi nâng phiên bản hoặc đổi link tải, nhập ghi chú và tích chọn bên dưới để thông báo cho tất cả khách đã mua.</p>
              <div>
                <label class={labelCls}>Ghi chú cập nhật (Changelog)</label>
                <textarea name="release_notes" rows={3} placeholder="VD: Nâng cấp prompt v2.0, sửa lỗi khung hình dọc, thêm tài liệu hướng dẫn..."
                  class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-xs resize-y"></textarea>
              </div>
              <label class="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <input type="checkbox" name="notify_buyers" value="1" class="mt-0.5 accent-brand-600 w-4 h-4 shrink-0" />
                <span>Gửi thông báo trong tài khoản &amp; Email tới tất cả khách hàng đã mua sản phẩm này</span>
              </label>
              {(props.releases || []).length > 0 && (
                <div class="pt-2 border-t border-slate-100 space-y-1.5">
                  <div class="text-[11px] font-bold text-slate-500 uppercase">Lịch sử cập nhật</div>
                  {(props.releases || []).slice(0, 3).map((r: any) => (
                    <div class="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div class="flex justify-between font-semibold text-slate-800">
                        <span>{r.version}</span>
                        <span class="text-[10px] text-slate-400">{formatDate(r.created_at)} · {r.notified_count} khách</span>
                      </div>
                      <div class="text-slate-600 line-clamp-2 mt-0.5">{r.changelog}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 mb-3"></div>
            <button type="submit" class="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition mb-2">
              <i class="fas fa-floppy-disk mr-1.5"></i>{props.isNew ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
            </button>
            <a href="/admin/san-pham" class="block text-center h-11 leading-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition">Huỷ</a>
          </div>
        </aside>
      </form>
    </AdminShell>
  )
}

/* ---------------- ORDERS ---------------- */
export const AdminOrders: FC<AdminProps & { orders: any[]; page: number; totalPages: number; status: string; q: string }> = (props) => (
  <AdminShell {...props} activeKey="orders" heading="Quản lý đơn hàng">
    <div class="flex flex-wrap gap-2 mb-4">
      {[['', 'Tất cả'], ['pending', 'Chờ thanh toán'], ['paid', 'Đã thanh toán'], ['cancelled', 'Đã huỷ'], ['refunded', 'Hoàn tiền']].map(([v, l]) => (
        <a href={`/admin/don-hang${v ? '?status=' + v : ''}`}
          class={`h-9 px-4 inline-flex items-center rounded-xl text-sm font-semibold transition ${props.status === v ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 hover:border-brand-400'}`}>{l}</a>
      ))}
      <form action="/admin/don-hang" method="get" class="ml-auto">
        {props.status && <input type="hidden" name="status" value={props.status} />}
        <div class="relative">
          <input type="text" name="q" value={props.q} placeholder="Mã đơn / email..."
            class="w-56 h-9 pl-8 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm" />
          <i class="fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        </div>
      </form>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full admin-table text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr><th class="text-left">Mã đơn</th><th class="text-left">Khách hàng</th><th class="text-left">Ngày</th><th class="text-left">Thanh toán</th><th class="text-right">Tổng</th><th class="text-center">Trạng thái</th><th class="text-right">Thao tác</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {props.orders.length === 0 && <tr><td colspan={7} class="text-center py-12 text-slate-500">Không có đơn hàng nào</td></tr>}
            {props.orders.map(o => (
              <tr>
                <td><a href={`/admin/don-hang/${o.id}`} class="font-bold text-brand-600 hover:underline">{o.order_code}</a></td>
                <td><div class="font-medium text-slate-800">{o.full_name}</div><div class="text-xs text-slate-500">{o.email}</div></td>
                <td class="text-slate-500 whitespace-nowrap text-xs">{formatDateTime(o.created_at)}</td>
                <td class="text-slate-600 text-xs">{o.payment_method === 'bank' ? 'VietQR' : o.payment_method === 'momo' ? 'MoMo' : 'Ví'}</td>
                <td class="text-right font-bold">{formatVND(o.total)}</td>
                <td class="text-center"><StatusBadge status={o.status} /></td>
                <td class="text-right whitespace-nowrap">
                  {o.status === 'pending' && (
                    <button class="btn-order-action h-8 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition"
                      data-id={o.id} data-status="paid" title="Xác nhận thanh toán"><i class="fas fa-check mr-1"></i>Duyệt</button>
                  )}
                  <a href={`/admin/don-hang/${o.id}`} class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500 ml-1"><i class="fas fa-eye text-xs"></i></a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Pagination page={props.page} totalPages={props.totalPages} baseUrl={'/admin/don-hang?status=' + props.status} />
  </AdminShell>
)

export const AdminOrderDetail: FC<AdminProps & {
  order: any; items: any[]; licenses?: any[]; bankTx?: any; customerStats?: { order_count: number; spent: number; email_verified: number; google_id?: string | null }
}> = (props) => {
  const { order, items, licenses = [], bankTx, customerStats } = props
  const pmLabel = order.payment_method === 'bank' ? 'Chuyển khoản / VietQR' : order.payment_method === 'momo' ? 'MoMo' : 'Ví số dư'
  const paidViaLabel = order.paid_via === 'webhook' ? 'Webhook tự động (SePay/Casso)' : order.paid_via === 'admin' ? 'Admin xác nhận' : order.paid_via === 'manual' ? 'Đối soát thủ công / Demo' : order.paid_via || '—'
  return (
    <AdminShell {...props} activeKey="orders" heading={`Đơn hàng ${order.order_code}`} sub={formatDateTime(order.created_at)}>
      <div class="mb-4">
        <a href="/admin/don-hang" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition">
          <i class="fas fa-arrow-left"></i>Quay lại danh sách đơn hàng
        </a>
      </div>
      <div class="grid lg:grid-cols-[1fr_340px] gap-5">
        <div class="space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-bold text-slate-900">Sản phẩm ({items.length})</h3>
            </div>
            <table class="w-full admin-table text-sm">
              <tbody class="divide-y divide-slate-100">
                {items.map(it => (
                  <tr>
                    <td>
                      <div class="font-semibold text-slate-800">{it.product_name}</div>
                      <div class="flex flex-wrap items-center gap-3 mt-1 text-xs">
                        {it.slug && <a href={`/san-pham/${it.slug}`} target="_blank" class="text-slate-500 hover:text-brand-600 hover:underline"><i class="fas fa-eye mr-1"></i>Xem trang bán</a>}
                        {it.product_id && <a href={`/admin/san-pham/${it.product_id}`} class="text-brand-600 font-semibold hover:underline"><i class="fas fa-pen-to-square mr-1"></i>Sửa sản phẩm / Gắn link tải</a>}
                      </div>
                    </td>
                    <td class="text-right font-bold whitespace-nowrap">{formatVND(it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-bold text-slate-900">License Key &amp; Quyền tải đã cấp ({licenses.length})</h3>
            </div>
            {licenses.length === 0 ? (
              <div class="p-5 text-sm text-slate-500">Chưa cấp license (đơn chưa thanh toán hoặc đã hoàn tiền).</div>
            ) : (
              <div class="divide-y divide-slate-100">
                {licenses.map(l => (
                  <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        <span>{l.product_name}</span>
                        <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono">{l.version || 'v1.0'}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <code class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">{l.license_key}</code>
                        {isMcpSkill(l.product_type) ? (
                          <span class="text-xs text-cyan-700 font-medium">· {l.mcp_call_count || 0} lượt gọi MCP</span>
                        ) : (
                          <span class="text-xs text-slate-500">· {l.download_count || 0} lượt tải</span>
                        )}
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      {isMcpSkill(l.product_type) ? (
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold">
                          <i class="fas fa-plug-circle-bolt"></i>MCP Live
                        </span>
                      ) : l.download_url ? (
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          <i class="fas fa-link"></i>Đã có link tải
                        </span>
                      ) : (
                        <a href={`/admin/san-pham/${l.product_id}`} class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100">
                          <i class="fas fa-triangle-exclamation"></i>Chưa gắn link tải →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {bankTx && (
            <div class="bg-white rounded-2xl border border-emerald-200 p-5 space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900 flex items-center gap-2"><i class="fas fa-building-columns text-emerald-600"></i>Giao dịch ngân hàng đối soát</h3>
                <a href="/admin/giao-dich" class="text-xs font-semibold text-brand-600 hover:underline">Xem tất cả →</a>
              </div>
              <div class="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div>Ngân hàng: <b class="text-slate-900">{bankTx.gateway || bankTx.provider}</b></div>
                <div>Số tiền nhận: <b class="text-emerald-600">{formatVND(bankTx.amount_in)}</b></div>
                <div>Mã tham chiếu: <code class="font-mono text-slate-800">{bankTx.reference_code || bankTx.provider_tx_id}</code></div>
                <div>Thời gian GD: <b class="text-slate-800">{formatDateTime(bankTx.transaction_date)}</b></div>
                <div class="sm:col-span-2">Nội dung CK: <code class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 break-all">{bankTx.content}</code></div>
              </div>
            </div>
          )}

          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 class="font-bold text-slate-900 mb-4">Thao tác</h3>
            <div class="flex flex-wrap gap-2">
              {order.status === 'pending' && (
                <>
                  <button class="btn-order-action h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition" data-id={order.id} data-status="paid">
                    <i class="fas fa-check-circle mr-1.5"></i>Xác nhận đã thanh toán
                  </button>
                  <button class="btn-order-action h-11 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition" data-id={order.id} data-status="cancelled">
                    <i class="fas fa-ban mr-1.5"></i>Huỷ đơn
                  </button>
                </>
              )}
              {order.status === 'paid' && (
                <button class="btn-order-action h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition" data-id={order.id} data-status="refunded">
                  <i class="fas fa-rotate-left mr-1.5"></i>Hoàn tiền
                </button>
              )}
              {order.status !== 'pending' && order.status !== 'paid' && <p class="text-sm text-slate-500">Đơn hàng đã kết thúc, không có thao tác khả dụng.</p>}
            </div>
          </div>
        </div>

        <aside class="space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900">Khách hàng</h3>
              {customerStats?.email_verified === 1 ? (
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"><i class="fas fa-circle-check mr-1"></i>Email đã xác minh</span>
              ) : (
                <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Chưa xác minh email</span>
              )}
            </div>
            <div class="space-y-2.5 text-sm">
              <div><span class="text-slate-500">Họ tên:</span> <b>{order.full_name}</b></div>
              <div><span class="text-slate-500">Email:</span> <b class="break-all">{order.email}</b></div>
              <div><span class="text-slate-500">SĐT:</span> <b>{order.phone || '—'}</b></div>
              {customerStats && (
                <div class="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                  <span>{customerStats.order_count} đơn hàng</span>
                  <span>Tổng chi: <b class="text-slate-800">{formatVND(customerStats.spent)}</b></span>
                </div>
              )}
              <a href={`/admin/thanh-vien/${order.user_id}`}
                class="mt-2 w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition">
                <i class="fas fa-user"></i>Xem hồ sơ &amp; gửi thông báo →
              </a>
            </div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 class="font-bold text-slate-900 mb-4">Thanh toán</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Phương thức</span><b class="text-xs">{pmLabel}</b></div>
              <div class="flex justify-between"><span class="text-slate-500">Tạm tính</span><b>{formatVND(order.subtotal)}</b></div>
              {order.discount > 0 && <div class="flex justify-between"><span class="text-slate-500">Giảm ({order.coupon_code})</span><b class="text-emerald-600">-{formatVND(order.discount)}</b></div>}
              <div class="flex justify-between pt-2.5 border-t border-slate-100"><span class="font-bold">Tổng</span><b class="text-lg text-rose-600">{formatVND(order.total)}</b></div>
              <div class="flex justify-between pt-2"><span class="text-slate-500">Trạng thái</span><StatusBadge status={order.status} /></div>
              {order.paid_via && <div class="flex justify-between gap-2"><span class="text-slate-500 shrink-0">Nguồn XN</span><b class="text-xs text-right">{paidViaLabel}</b></div>}
              {order.paid_amount > 0 && <div class="flex justify-between"><span class="text-slate-500">Thực thu</span><b class="text-xs text-emerald-600">{formatVND(order.paid_amount)}</b></div>}
              {order.paid_at && <div class="flex justify-between"><span class="text-slate-500">Thanh toán lúc</span><b class="text-xs">{formatDateTime(order.paid_at)}</b></div>}
            </div>
            {order.note && <div class="mt-4 pt-4 border-t border-slate-100"><div class="text-xs text-slate-500 mb-1">Ghi chú</div><p class="text-sm">{order.note}</p></div>}
          </div>
        </aside>
      </div>
    </AdminShell>
  )
}

/* ---------------- USERS ---------------- */
export const AdminUsers: FC<AdminProps & { users: any[]; page: number; totalPages: number; q: string }> = (props) => (
  <AdminShell {...props} activeKey="users" heading="Quản lý thành viên">
    <form action="/admin/thanh-vien" method="get" class="mb-4 max-w-sm">
      <div class="relative">
        <input type="text" name="q" value={props.q} placeholder="Tìm theo tên hoặc email..."
          class="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm" />
        <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
      </div>
    </form>
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full admin-table text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr><th class="text-left">Thành viên</th><th class="text-left">SĐT</th><th class="text-center">Đơn hàng</th><th class="text-right">Đã chi</th><th class="text-right">Số dư</th><th class="text-center">Vai trò</th><th class="text-center">Trạng thái</th><th class="text-right">Thao tác</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {props.users.map(u => (
              <tr>
                <td>
                  <a href={`/admin/thanh-vien/${u.id}`} class="flex items-center gap-2.5 group">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold shrink-0">{u.full_name.charAt(0).toUpperCase()}</div>
                    <div class="min-w-0">
                      <div class="font-semibold text-slate-900 group-hover:text-brand-600 truncate flex items-center gap-1.5">
                        <span>{u.full_name}</span>
                        {u.email_verified === 1 && <i class="fas fa-circle-check text-emerald-500 text-[11px]" title="Email đã xác minh"></i>}
                      </div>
                      <div class="text-xs text-slate-500 truncate">{u.email}</div>
                    </div>
                  </a>
                </td>
                <td class="text-slate-600">{u.phone || '—'}</td>
                <td class="text-center font-semibold">{u.order_count || 0}</td>
                <td class="text-right font-bold">{formatVND(u.spent || 0)}</td>
                <td class="text-right text-emerald-600 font-semibold">{formatVND(u.balance)}</td>
                <td class="text-center">
                  <span class={`px-2 py-0.5 rounded text-[11px] font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                </td>
                <td class="text-center"><StatusBadge status={u.status} /></td>
                <td class="text-right whitespace-nowrap">
                  <a href={`/admin/thanh-vien/${u.id}`} class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-brand-50 text-brand-600" title="Xem hồ sơ & gửi thông báo">
                    <i class="fas fa-eye text-xs"></i>
                  </a>
                  <button class="btn-user-action inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500" title={u.status === 'active' ? 'Khoá' : 'Mở khoá'}
                    data-id={u.id} data-action="toggle-status"><i class={`fas ${u.status === 'active' ? 'fa-lock' : 'fa-lock-open'} text-xs`}></i></button>
                  <button class="btn-user-action inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-amber-50 text-amber-600" title="Đổi vai trò"
                    data-id={u.id} data-action="toggle-role"><i class="fas fa-user-shield text-xs"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Pagination page={props.page} totalPages={props.totalPages} baseUrl="/admin/thanh-vien" />
  </AdminShell>
)

export const AdminUserDetail: FC<AdminProps & {
  member: any
  stats: { order_count: number; spent: number; license_count: number }
  orders: any[]
  licenses: any[]
  referrals: any[]
  notifications: any[]
  referrer?: any
  emailEnabled?: boolean
}> = (props) => {
  const { member, stats, orders, licenses, referrals, notifications, referrer, emailEnabled } = props
  return (
    <AdminShell {...props} activeKey="users" heading={`Thành viên: ${member.full_name}`} sub={member.email}>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <a href="/admin/thanh-vien" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition">
          <i class="fas fa-arrow-left"></i>Quay lại danh sách thành viên
        </a>
        <div class="flex items-center gap-2">
          <button class="btn-user-action h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-semibold transition"
            data-id={member.id} data-action="toggle-status">
            <i class={`fas ${member.status === 'active' ? 'fa-lock text-rose-500' : 'fa-lock-open text-emerald-600'} mr-1.5`}></i>
            {member.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá'}
          </button>
          <button class="btn-user-action h-9 px-3.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-amber-700 text-xs font-semibold transition"
            data-id={member.id} data-action="toggle-role">
            <i class="fas fa-user-shield mr-1.5"></i>{member.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-[1fr_360px] gap-5">
        <div class="space-y-5">
          {/* Stats */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Sản phẩm sở hữu', String(stats.license_count), 'text-brand-600'],
              ['Tổng đơn hàng', String(stats.order_count), 'text-slate-900'],
              ['Tổng chi tiêu', formatVND(stats.spent), 'text-emerald-600'],
              ['Số dư ví', formatVND(member.balance), 'text-amber-600']
            ].map(([lb, val, cls]) => (
              <div class="bg-white rounded-2xl border border-slate-200 p-4">
                <div class="text-xs text-slate-500">{lb}</div>
                <div class={`text-lg font-extrabold mt-1 tabular-nums ${cls}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Owned products & licenses */}
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-bold text-slate-900">Sản phẩm &amp; License đang sở hữu ({licenses.length})</h3>
            </div>
            {licenses.length === 0 ? (
              <div class="p-6 text-sm text-slate-500">Thành viên này chưa sở hữu sản phẩm nào.</div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full admin-table text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr><th class="text-left">Sản phẩm</th><th class="text-left">License Key</th><th class="text-center">Lượt tải</th><th class="text-right">Thao tác</th></tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {licenses.map(l => (
                      <tr>
                        <td>
                          <div class="font-semibold text-slate-800">{l.product_name}</div>
                          <div class="text-xs text-slate-400">{l.version || 'v1.0'} · Cấp {formatDate(l.created_at)}</div>
                        </td>
                        <td><code class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">{l.license_key}</code></td>
                        <td class="text-center font-semibold">{l.download_count || 0}</td>
                        <td class="text-right whitespace-nowrap">
                          <a href={`/admin/san-pham/${l.product_id}`} class="text-xs font-semibold text-brand-600 hover:underline">Sửa SP / Cập nhật →</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders */}
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200"><h3 class="font-bold text-slate-900">Lịch sử đơn hàng ({orders.length})</h3></div>
            {orders.length === 0 ? (
              <div class="p-6 text-sm text-slate-500">Chưa có đơn hàng nào.</div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full admin-table text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr><th class="text-left">Mã đơn</th><th class="text-left">Ngày tạo</th><th class="text-right">Tổng</th><th class="text-center">Trạng thái</th><th class="text-right"></th></tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {orders.map(o => (
                      <tr>
                        <td><a href={`/admin/don-hang/${o.id}`} class="font-bold text-brand-600 hover:underline">{o.order_code}</a></td>
                        <td class="text-xs text-slate-500">{formatDateTime(o.created_at)}</td>
                        <td class="text-right font-bold">{formatVND(o.total)}</td>
                        <td class="text-center"><StatusBadge status={o.status} /></td>
                        <td class="text-right"><a href={`/admin/don-hang/${o.id}`} class="text-xs font-semibold text-slate-500 hover:text-brand-600">Chi tiết →</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Affiliate referrals */}
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-bold text-slate-900">Affiliate ({referrals.length} người giới thiệu)</h3>
              <span class="text-xs text-emerald-600 font-bold">Hoa hồng đã nhận: {formatVND(member.affiliate_earned || 0)}</span>
            </div>
            {referrals.length === 0 ? (
              <div class="p-6 text-sm text-slate-500">Chưa giới thiệu thành viên nào.</div>
            ) : (
              <div class="divide-y divide-slate-100">
                {referrals.map(r => (
                  <div class="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <a href={`/admin/thanh-vien/${r.id}`} class="font-semibold text-slate-800 hover:text-brand-600">{r.full_name}</a>
                      <div class="text-xs text-slate-500">{r.email}</div>
                    </div>
                    <div class="text-right text-xs">
                      <div class="font-bold text-slate-800">{formatVND(r.spent || 0)}</div>
                      <div class="text-slate-400">{formatDate(r.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside class="space-y-5">
          {/* Customer profile card */}
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-sm">
            <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} class="w-12 h-12 rounded-full object-cover shrink-0" referrerpolicy="no-referrer" />
              ) : (
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center font-bold text-lg shrink-0">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div class="min-w-0">
                <div class="font-bold text-slate-900 truncate">{member.full_name}</div>
                <div class="text-xs text-slate-500 truncate">{member.email}</div>
                <div class="flex flex-wrap gap-1.5 mt-1">
                  {member.email_verified === 1 ? (
                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"><i class="fas fa-check mr-1"></i>Email đã xác minh</span>
                  ) : (
                    <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Chưa xác minh email</span>
                  )}
                  {member.google_id && <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">Google</span>}
                </div>
              </div>
            </div>
            <div class="flex justify-between"><span class="text-slate-500">SĐT</span><b>{member.phone || '—'}</b></div>
            <div class="flex justify-between"><span class="text-slate-500">Vai trò</span><b>{member.role === 'admin' ? 'Admin' : 'User'}</b></div>
            <div class="flex justify-between"><span class="text-slate-500">Trạng thái</span><StatusBadge status={member.status} /></div>
            <div class="flex justify-between"><span class="text-slate-500">Mã Affiliate</span><code class="font-mono font-bold text-brand-600">{member.affiliate_code}</code></div>
            {referrer && <div class="flex justify-between"><span class="text-slate-500">Người giới thiệu</span><a href={`/admin/thanh-vien/${referrer.id}`} class="font-semibold text-brand-600 hover:underline">{referrer.full_name}</a></div>}
            <div class="flex justify-between"><span class="text-slate-500">Ngày tham gia</span><b class="text-xs">{formatDateTime(member.created_at)}</b></div>
          </div>

          {/* Direct notification + email form */}
          <form action={`/api/admin/users/${member.id}/notify`} method="post" data-ajax data-reload="true"
            class="bg-white rounded-2xl border border-indigo-200 p-5 space-y-3.5">
            <h3 class="font-bold text-slate-900 flex items-center gap-2">
              <i class="fas fa-paper-plane text-brand-600"></i>Gửi thông báo / Link cho khách
            </h3>
            <p class="text-xs text-slate-500">Thông báo sẽ hiện ngay trong hộp thư tài khoản của khách{emailEnabled ? ' và gửi kèm qua Email.' : ' (Email đang tắt vì chưa cấu hình Resend API key).'}</p>
            <div>
              <label class={labelCls}>Tiêu đề *</label>
              <input type="text" name="title" required placeholder="VD: Cập nhật bản Skill v2.0 hoặc Link riêng" class={fieldCls} />
            </div>
            <div>
              <label class={labelCls}>Nội dung *</label>
              <textarea name="message" rows={4} required placeholder="Nhập nội dung thông báo, hướng dẫn hoặc ghi chú phiên bản mới..."
                class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y"></textarea>
            </div>
            <div>
              <label class={labelCls}>Link đính kèm <span class="text-slate-400 font-normal">(tuỳ chọn)</span></label>
              <input type="text" name="link_url" placeholder="/tai-khoan/san-pham hoặc https://..." class={fieldCls} />
            </div>
            <label class="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" name="send_email" value="1" checked={!!emailEnabled} class="mt-0.5 accent-brand-600 w-4 h-4 shrink-0" />
              <span>Gửi kèm Email tới <b>{member.email}</b> {!emailEnabled && <span class="text-amber-600">(cần RESEND_API_KEY)</span>}</span>
            </label>
            <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
            <button type="submit" class="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition cursor-pointer">
              <i class="fas fa-bell mr-1.5"></i>Gửi thông báo ngay
            </button>
          </form>

          {/* Recent notifications sent to user */}
          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 class="font-bold text-slate-900 mb-3 text-sm">Thông báo đã gửi ({notifications.length})</h3>
            {notifications.length === 0 ? (
              <p class="text-xs text-slate-500">Chưa có thông báo nào.</p>
            ) : (
              <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {notifications.map(n => (
                  <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div class="flex items-center justify-between gap-2 font-semibold text-slate-800">
                      <span class="truncate">{n.title}</span>
                      <span class={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${n.is_read ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
                        {n.is_read ? 'Đã đọc' : 'Chưa đọc'}
                      </span>
                    </div>
                    <p class="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    <div class="text-[10px] text-slate-400 mt-1">{formatDateTime(n.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </AdminShell>
  )
}

/* ---------------- GENERIC LIST PAGES ---------------- */
export const AdminCategories: FC<AdminProps & { categories: any[]; editing?: any }> = (props) => {
  const ed = props.editing
  return (
    <AdminShell {...props} activeKey="categories" heading="Quản lý danh mục">
      <div class="grid lg:grid-cols-[1fr_340px] gap-5">
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table class="w-full admin-table text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr><th class="text-left">Danh mục</th><th class="text-left">Slug</th><th class="text-center">SP</th><th class="text-right"></th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {props.categories.map(c => (
                <tr>
                  <td>
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0"><i class={`fas ${c.icon} text-xs`}></i></div>
                      <div><div class="font-semibold text-slate-900">{c.name}</div><div class="text-xs text-slate-500 line-clamp-1 max-w-xs">{c.description}</div></div>
                    </div>
                  </td>
                  <td class="text-slate-500 font-mono text-xs">{c.slug}</td>
                  <td class="text-center font-semibold">{c.product_count || 0}</td>
                  <td class="text-right whitespace-nowrap">
                    <a href={`/admin/danh-muc?edit=${c.id}`} class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-brand-50 text-brand-600" title="Sửa"><i class="fas fa-pen text-xs"></i></a>
                    <button class="btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500"
                      data-url={`/api/admin/categories/${c.id}`} data-name={c.name}><i class="fas fa-trash-can text-xs"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={ed ? `/api/admin/categories/${ed.id}/update` : '/api/admin/categories'} method="post" data-ajax data-reload="true" class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900">{ed ? `Sửa: ${ed.name}` : 'Thêm danh mục'}</h3>
            {ed && <a href="/admin/danh-muc" class="text-xs text-slate-500 hover:underline">Huỷ sửa</a>}
          </div>
          <div><label class={labelCls}>Tên *</label><input type="text" name="name" value={ed?.name || ''} required class={fieldCls} /></div>
          <div><label class={labelCls}>Slug *</label><input type="text" name="slug" value={ed?.slug || ''} required placeholder="ten-danh-muc" class={fieldCls} /></div>
          <div><label class={labelCls}>Mô tả</label><textarea name="description" rows={3} class="w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm">{ed?.description || ''}</textarea></div>
          <div><label class={labelCls}>Icon (FontAwesome)</label><input type="text" name="icon" value={ed?.icon || 'fa-cube'} class={fieldCls} /></div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
          <button type="submit" class="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">{ed ? 'Lưu thay đổi' : 'Thêm danh mục'}</button>
        </form>
      </div>
    </AdminShell>
  )
}

export const AdminCoupons: FC<AdminProps & { coupons: any[] }> = (props) => (
  <AdminShell {...props} activeKey="coupons" heading="Mã giảm giá">
    <div class="grid lg:grid-cols-[1fr_340px] gap-5">
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full admin-table text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr><th class="text-left">Mã</th><th class="text-left">Giảm</th><th class="text-right">Đơn tối thiểu</th><th class="text-center">Đã dùng</th><th class="text-left">Hết hạn</th><th class="text-right"></th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {props.coupons.map(c => (
                <tr>
                  <td><code class="px-2 py-1 rounded bg-brand-50 text-brand-700 font-bold text-xs">{c.code}</code></td>
                  <td class="font-semibold">{c.type === 'percent' ? c.value + '%' : formatVND(c.value)}</td>
                  <td class="text-right text-slate-600">{formatVND(c.min_order)}</td>
                  <td class="text-center">{c.used_count}{c.max_uses > 0 ? ` / ${c.max_uses}` : ''}</td>
                  <td class="text-slate-500 text-xs">{formatDate(c.expires_at)}</td>
                  <td class="text-right">
                    <button class="btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500"
                      data-url={`/api/admin/coupons/${c.id}`} data-name={c.code}><i class="fas fa-trash-can text-xs"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form action="/api/admin/coupons" method="post" data-ajax data-reload="true" class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start">
        <h3 class="font-bold text-slate-900">Tạo mã mới</h3>
        <div><label class={labelCls}>Mã *</label><input type="text" name="code" required style="text-transform:uppercase" class={fieldCls} /></div>
        <div><label class={labelCls}>Loại giảm</label><select name="type" class={fieldCls}><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền cố định</option></select></div>
        <div><label class={labelCls}>Giá trị *</label><input type="number" name="value" required min="1" class={fieldCls} /></div>
        <div><label class={labelCls}>Đơn tối thiểu</label><input type="number" name="min_order" value="0" min="0" step="10000" class={fieldCls} /></div>
        <div><label class={labelCls}>Số lần dùng tối đa (0 = ∞)</label><input type="number" name="max_uses" value="0" min="0" class={fieldCls} /></div>
        <div><label class={labelCls}>Ngày hết hạn</label><input type="date" name="expires_at" class={fieldCls} /></div>
        <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
        <button type="submit" class="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">Tạo mã giảm giá</button>
      </form>
    </div>
  </AdminShell>
)

export const AdminPosts: FC<AdminProps & { posts: any[]; editing?: any }> = (props) => {
  const ed = props.editing
  return (
    <AdminShell {...props} activeKey="posts" heading="Quản lý bài viết">
      <div class="grid lg:grid-cols-[1fr_400px] gap-5">
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table class="w-full admin-table text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr><th class="text-left">Tiêu đề</th><th class="text-center">Lượt xem</th><th class="text-left">Ngày</th><th class="text-right"></th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {props.posts.map(p => (
                <tr>
                  <td><div class="font-semibold text-slate-900 line-clamp-1 max-w-sm">{p.title}</div><div class="text-xs text-slate-500 font-mono">{p.slug}</div></td>
                  <td class="text-center">{p.view_count}</td>
                  <td class="text-slate-500 text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                  <td class="text-right whitespace-nowrap">
                    <a href={`/blog/${p.slug}`} target="_blank" class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500" title="Xem"><i class="fas fa-eye text-xs"></i></a>
                    <a href={`/admin/bai-viet?edit=${p.id}`} class="inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-brand-50 text-brand-600" title="Sửa"><i class="fas fa-pen text-xs"></i></a>
                    <button class="btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500"
                      data-url={`/api/admin/posts/${p.id}`} data-name={p.title}><i class="fas fa-trash-can text-xs"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={ed ? `/api/admin/posts/${ed.id}/update` : '/api/admin/posts'} method="post" data-ajax data-reload="true" class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900">{ed ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h3>
            {ed && <a href="/admin/bai-viet" class="text-xs text-slate-500 hover:underline">Huỷ sửa</a>}
          </div>
          <div><label class={labelCls}>Tiêu đề *</label><input type="text" name="title" value={ed?.title || ''} required class={fieldCls} /></div>
          <div><label class={labelCls}>Slug *</label><input type="text" name="slug" value={ed?.slug || ''} required class={fieldCls} /></div>
          <div><label class={labelCls}>Mô tả ngắn</label><textarea name="excerpt" rows={2} class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm">{ed?.excerpt || ''}</textarea></div>
          <div><label class={labelCls}>Nội dung (HTML)</label><textarea name="content" rows={10} class="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm font-mono">{ed?.content || ''}</textarea></div>
          <div><label class={labelCls}>Tags (phân cách dấu phẩy)</label><input type="text" name="tags" value={ed?.tags || ''} placeholder="veo3,huong-dan" class={fieldCls} /></div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
          <button type="submit" class="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">{ed ? 'Lưu thay đổi' : 'Đăng bài'}</button>
        </form>
      </div>
    </AdminShell>
  )
}

export const AdminReviews: FC<AdminProps & { reviews: any[] }> = (props) => (
  <AdminShell {...props} activeKey="reviews" heading="Quản lý đánh giá">
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full admin-table text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr><th class="text-left">Người đánh giá</th><th class="text-left">Sản phẩm</th><th class="text-center">Sao</th><th class="text-left">Nội dung</th><th class="text-left">Ngày</th><th class="text-right"></th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {props.reviews.length === 0 && <tr><td colspan={6} class="text-center py-12 text-slate-500">Chưa có đánh giá nào</td></tr>}
            {props.reviews.map(r => (
              <tr>
                <td><div class="font-semibold text-slate-900">{r.full_name}</div><div class="text-xs text-slate-500">{r.email}</div></td>
                <td class="text-slate-600 max-w-[180px]"><div class="line-clamp-1">{r.product_name}</div></td>
                <td class="text-center"><span class="text-amber-500 font-bold">{r.rating}★</span></td>
                <td class="max-w-xs"><div class="line-clamp-2 text-slate-600">{r.comment}</div></td>
                <td class="text-slate-500 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td class="text-right">
                  <button class="btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500"
                    data-url={`/api/admin/reviews/${r.id}`} data-name="đánh giá này"><i class="fas fa-trash-can text-xs"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminShell>
)

export const AdminTickets: FC<AdminProps & { tickets: any[] }> = (props) => (
  <AdminShell {...props} activeKey="tickets" heading="Yêu cầu hỗ trợ">
    <div class="space-y-3">
      {props.tickets.length === 0 && (
        <div class="bg-white rounded-2xl border border-slate-200"><EmptyState icon="fa-headset" title="Chưa có yêu cầu hỗ trợ nào" /></div>
      )}
      {props.tickets.map(t => (
        <div class="bg-white rounded-2xl border border-slate-200 p-5">
          <div class="flex flex-wrap items-start gap-3 mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-slate-900">{t.subject}</h3>
              <div class="text-xs text-slate-500 mt-1">
                <b>{t.name}</b> · {t.email} · {formatDateTime(t.created_at)}
              </div>
            </div>
            <StatusBadge status={t.status} />
          </div>
          <p class="text-sm text-slate-600 leading-relaxed p-3.5 rounded-xl bg-slate-50 border border-slate-100">{t.message}</p>
          <div class="mt-3 flex gap-2">
            <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`}
              class="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition">
              <i class="fas fa-reply"></i>Trả lời email
            </a>
            {t.status === 'open' && (
              <button class="btn-ticket-close h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition" data-id={t.id}>
                <i class="fas fa-check"></i>Đánh dấu đã xử lý
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </AdminShell>
)

export const AdminSettings: FC<AdminProps & {
  settings: Record<string, string>
  integrationStatus?: { emailConfigured: boolean; emailFrom: string; googleConfigured: boolean; origin: string }
}> = (props) => {
  const s = props.settings
  const st = props.integrationStatus
  const callbackUrl = st ? `${st.origin}/api/auth/google/callback` : '/api/auth/google/callback'
  return (
    <AdminShell {...props} activeKey="settings" heading="Cài đặt hệ thống">
      <form action="/api/admin/settings" method="post" data-ajax class="grid lg:grid-cols-2 gap-5">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 class="font-bold text-slate-900">Thông tin website</h3>
          {[
            ['site_name', 'Tên website'], ['site_tagline', 'Slogan'],
            ['hotline', 'Hotline'], ['email', 'Email hỗ trợ'],
            ['zalo', 'Số Zalo'], ['facebook', 'Link Facebook'],
            ['youtube', 'Link kênh YouTube'], ['tiktok', 'Link TikTok']
          ].map(([k, l]) => (
            <div><label class={labelCls}>{l}</label><input type="text" name={k} value={s[k] || ''} class={fieldCls} /></div>
          ))}
        </div>
        <div class="space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Thông tin thanh toán</h3>
            {[
              ['bank_name', 'Tên ngân hàng'], ['bank_code', 'Mã bank (VietQR: MB, VCB, TCB...)'],
              ['bank_account', 'Số tài khoản'], ['bank_owner', 'Chủ tài khoản (IN HOA, không dấu)']
            ].map(([k, l]) => (
              <div><label class={labelCls}>{l}</label><input type="text" name={k} value={s[k] || ''} class={fieldCls} /></div>
            ))}
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 class="font-bold text-slate-900">Affiliate</h3>
            <div><label class={labelCls}>Phần trăm hoa hồng (%)</label><input type="number" name="affiliate_percent" value={s.affiliate_percent || '20'} min="0" max="100" class={fieldCls} /></div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-bold text-slate-900 flex items-center gap-2">
                <i class="fas fa-bolt text-amber-500"></i>Webhook ngân hàng
              </h3>
              <a href="/admin/giao-dich#webhook-config" class="text-xs font-semibold text-brand-600 hover:underline">Lấy URL &amp; API Key →</a>
            </div>
            <div>
              <label class={labelCls}>Nhà cung cấp</label>
              <select name="payment_provider" class={fieldCls}>
                {[['sepay', 'SePay (sepay.vn)'], ['casso', 'Casso (casso.vn)'], ['manual', 'Thủ công (không webhook)']].map(([v, l]) => (
                  <option value={v} selected={(s.payment_provider || 'sepay') === v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label class={labelCls}>Thời gian giữ đơn (phút)</label>
              <input type="number" name="payment_timeout_minutes" value={s.payment_timeout_minutes || '60'} min="5" class={fieldCls} />
            </div>
            <div>
              <label class={labelCls}>Sai số cho phép (VND)</label>
              <input type="number" name="amount_tolerance" value={s.amount_tolerance || '0'} min="0" class={fieldCls} />
              <p class="text-[11px] text-slate-500 mt-1">Đặt 0 nếu muốn khớp số tiền tuyệt đối.</p>
            </div>
            <label class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
              <input type="hidden" name="auto_confirm_manual" value="0" />
              <input type="checkbox" name="auto_confirm_manual" value="1" checked={s.auto_confirm_manual === '1'} class="mt-0.5" />
              <span class="text-xs text-amber-800 leading-relaxed">
                <b>Bật chế độ DEMO</b> — cho khách tự xác nhận đã chuyển khoản mà không cần webhook.
                <b class="text-rose-700"> Tắt khi chạy thật</b>, nếu không khách có thể nhận hàng mà chưa trả tiền.
              </span>
            </label>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 mb-3"></div>
            <button type="submit" class="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition">
              <i class="fas fa-floppy-disk mr-1.5"></i>Lưu cài đặt
            </button>
          </div>
        </div>
      </form>

      {st && (
        <section class="mt-5 bg-white rounded-2xl border border-slate-200 p-5">
          <h3 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i class="fas fa-plug text-brand-600"></i>Trạng thái tích hợp Email (Resend) &amp; Google Login
          </h3>
          <div class="grid md:grid-cols-2 gap-4 text-xs">
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="flex items-center justify-between">
                <b class="text-sm text-slate-900"><i class="fas fa-envelope mr-1.5 text-brand-600"></i>Email tự động (Resend)</b>
                <span class={`px-2.5 py-0.5 rounded-full font-bold ${st.emailConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {st.emailConfigured ? 'Đã kết nối' : 'Chưa cấu hình'}
                </span>
              </div>
              <div class="text-slate-600">Địa chỉ gửi (From): <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{st.emailFrom}</code></div>
              <p class="text-slate-500 leading-relaxed">Thêm biến môi trường <code class="font-mono">RESEND_API_KEY</code> (và tuỳ chọn <code class="font-mono">EMAIL_FROM</code>) trên Vercel + xác thực bản ghi DNS SPF/DKIM của Resend tại Tenten để bật gửi link xác minh, quên mật khẩu &amp; email cập nhật Skill.</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="flex items-center justify-between">
                <b class="text-sm text-slate-900"><i class="fab fa-google mr-1.5 text-rose-500"></i>Đăng nhập Google (OAuth 2.0)</b>
                <span class={`px-2.5 py-0.5 rounded-full font-bold ${st.googleConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {st.googleConfigured ? 'Đang bật' : 'Chưa cấu hình'}
                </span>
              </div>
              <div class="text-slate-600">Authorized Redirect URI (dán vào Google Cloud Console):</div>
              <div class="flex items-center gap-1.5">
                <input type="text" readonly value={callbackUrl} class="flex-1 h-8 px-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700" />
                <button type="button" data-copy={callbackUrl} class="h-8 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold">
                  <i class="far fa-copy"></i>
                </button>
              </div>
              <p class="text-slate-500 leading-relaxed">Thêm biến <code class="font-mono">GOOGLE_CLIENT_ID</code> &amp; <code class="font-mono">GOOGLE_CLIENT_SECRET</code> trên Vercel để nút "Tiếp tục với Google" xuất hiện tại trang Đăng nhập / Đăng ký.</p>
            </div>
          </div>
        </section>
      )}
    </AdminShell>
  )
}

/* ============================================================
   GIAO DỊCH NGÂN HÀNG — Đối soát webhook
   ============================================================ */
const TX_STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  matched: { label: 'Đã khớp', cls: 'bg-emerald-100 text-emerald-700', icon: 'fa-circle-check' },
  unmatched: { label: 'Chưa khớp', cls: 'bg-amber-100 text-amber-700', icon: 'fa-circle-question' },
  amount_mismatch: { label: 'Lệch tiền', cls: 'bg-rose-100 text-rose-700', icon: 'fa-triangle-exclamation' },
  duplicate: { label: 'Trùng lặp', cls: 'bg-violet-100 text-violet-700', icon: 'fa-clone' },
  ignored: { label: 'Bỏ qua', cls: 'bg-slate-100 text-slate-500', icon: 'fa-ban' }
}

export const AdminBankTx: FC<AdminProps & {
  txs: any[]; stats: any; page: number; totalPages: number
  status: string; q: string; settings: Record<string, string>; origin: string
}> = (props) => {
  const s = props.settings
  const webhookUrl = `${props.origin}/api/webhook/bank`
  const provider = s.payment_provider || 'sepay'
  const keyReady = s.webhook_api_key && s.webhook_api_key !== 'CHANGE_ME_SECRET'

  return (
    <AdminShell {...props} activeKey="banktx" heading="Giao dịch ngân hàng"
      sub="Tự động đối soát chuyển khoản và cấp quyền tải Skill AI">

      {/* Hướng dẫn cấu hình webhook */}
      <section id="webhook-config" class="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 class="font-bold text-slate-900 flex items-center gap-2">
              <i class="fas fa-plug text-brand-600"></i>Cấu hình Webhook
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Dán 2 thông tin dưới đây vào dashboard {provider === 'casso' ? 'Casso' : 'SePay'} → mục Webhook / Tích hợp.
            </p>
          </div>
          <span class={`h-7 px-3 inline-flex items-center gap-1.5 rounded-full text-xs font-bold ${keyReady ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <i class={`fas ${keyReady ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {keyReady ? 'Đã cấu hình' : 'Chưa đặt API key'}
          </span>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class={labelCls}>Webhook URL</label>
            <div class="flex gap-2">
              <input type="text" readonly value={webhookUrl}
                class="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700 outline-none" />
              <button data-copy={webhookUrl} title="Copy"
                class="w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div>
            <label class={labelCls}>API Key (Authorization: Apikey ...)</label>
            <div class="flex gap-2">
              <input type="text" id="webhook-key" readonly value={s.webhook_api_key || ''}
                class="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700 outline-none" />
              <button data-copy={s.webhook_api_key || ''} title="Copy"
                class="w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                <i class="fas fa-copy"></i>
              </button>
              <button id="btn-regen-key" title="Tạo key mới"
                class="w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 transition">
                <i class="fas fa-rotate"></i>
              </button>
            </div>
          </div>
        </div>

        <details class="mt-4 rounded-xl bg-slate-50 border border-slate-200">
          <summary class="px-4 py-3 cursor-pointer text-sm font-semibold text-slate-700">
            <i class="fas fa-circle-info mr-1.5 text-brand-600"></i>Hướng dẫn chi tiết từng bước
          </summary>
          <div class="px-4 pb-4 text-sm text-slate-600 leading-relaxed space-y-3">
            <div>
              <b class="text-slate-900">Bước 1 — Liên kết ngân hàng</b>
              <p>Đăng ký tại <b>{provider === 'casso' ? 'casso.vn' : 'sepay.vn'}</b>, thêm tài khoản ngân hàng
                <b class="font-mono"> {s.bank_account || '(chưa đặt)'} </b>({s.bank_name || '—'}) và chờ liên kết thành công.</p>
            </div>
            <div>
              <b class="text-slate-900">Bước 2 — Tạo Webhook</b>
              <p>Vào mục <i>Webhooks</i> → <i>Thêm webhook</i>. Dán <b>Webhook URL</b> ở trên.
                Chọn kiểu xác thực <b>API Key</b> và dán <b>API Key</b> ở trên. Chọn sự kiện <b>tiền vào (money in)</b>.</p>
            </div>
            <div>
              <b class="text-slate-900">Bước 3 — Tắt chế độ demo</b>
              <p>Vào <a href="/admin/cai-dat" class="text-brand-600 font-semibold hover:underline">Cài đặt</a> →
                bỏ tick <i>"Bật chế độ DEMO"</i> để buộc mọi đơn phải có giao dịch thật mới được cấp hàng.</p>
            </div>
            <div>
              <b class="text-slate-900">Bước 4 — Kiểm thử</b>
              <p>Tạo 1 đơn hàng, chuyển khoản đúng số tiền với nội dung là <b>mã đơn</b> (VD: <span class="font-mono">DHAB12CD34</span>).
                Giao dịch sẽ hiện trong bảng dưới với trạng thái <b class="text-emerald-700">Đã khớp</b> và khách nhận được link tải ngay.</p>
            </div>
            <p class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <i class="fas fa-lightbulb mr-1"></i>
              <b>Lưu ý:</b> hệ thống tách mã đơn bằng regex <span class="font-mono">DH + 8 ký tự</span>, tự bỏ dấu cách và ký tự lạ
              nên vẫn khớp khi ngân hàng chèn thêm text. Nếu khách chuyển thừa tiền, phần thừa được cộng vào ví của khách.
            </p>
          </div>
        </details>
      </section>

      {/* Thống kê */}
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          ['Tổng giao dịch', props.stats?.total || 0, 'fa-list', 'text-slate-600'],
          ['Đã khớp', props.stats?.matched || 0, 'fa-circle-check', 'text-emerald-600'],
          ['Chưa khớp', props.stats?.unmatched || 0, 'fa-circle-question', 'text-amber-600'],
          ['Lệch tiền', props.stats?.mismatch || 0, 'fa-triangle-exclamation', 'text-rose-600'],
          ['Doanh thu khớp', formatVND(props.stats?.revenue || 0), 'fa-sack-dollar', 'text-brand-600']
        ].map(([label, val, icon, cls]: any) => (
          <div class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class={`text-xs font-medium text-slate-500 flex items-center gap-1.5`}>
              <i class={`fas ${icon} ${cls}`}></i>{label}
            </div>
            <div class={`text-xl font-extrabold mt-1.5 ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Bộ lọc */}
      <div class="flex flex-wrap gap-2 mb-4">
        {[['', 'Tất cả'], ['matched', 'Đã khớp'], ['unmatched', 'Chưa khớp'], ['amount_mismatch', 'Lệch tiền'], ['duplicate', 'Trùng lặp'], ['ignored', 'Bỏ qua']].map(([v, l]) => (
          <a href={`/admin/giao-dich${v ? '?status=' + v : ''}`}
            class={`h-9 px-4 inline-flex items-center rounded-xl text-sm font-semibold transition ${props.status === v ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 hover:border-brand-400'}`}>{l}</a>
        ))}
        <form action="/admin/giao-dich" method="get" class="ml-auto">
          {props.status && <input type="hidden" name="status" value={props.status} />}
          <div class="relative">
            <input type="text" name="q" value={props.q} placeholder="Nội dung / mã đơn..."
              class="w-56 h-9 pl-8 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm" />
            <i class="fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        </form>
      </div>

      {/* Bảng giao dịch */}
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full admin-table text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left">Thời gian</th><th class="text-left">Nội dung CK</th>
                <th class="text-left">Bank</th><th class="text-right">Tiền vào</th>
                <th class="text-left">Đơn hàng</th><th class="text-center">Trạng thái</th>
                <th class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {props.txs.length === 0 && (
                <tr><td colspan={7} class="text-center py-12 text-slate-500">
                  <i class="fas fa-inbox text-2xl block mb-2 text-slate-300"></i>
                  Chưa có giao dịch nào. Hãy cấu hình webhook ở trên.
                </td></tr>
              )}
              {props.txs.map(t => {
                const st = TX_STATUS[t.match_status] || TX_STATUS.ignored
                return (
                  <tr>
                    <td class="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(t.transaction_date)}</td>
                    <td class="max-w-[260px]">
                      <div class="text-xs text-slate-700 font-mono break-words">{t.content || '—'}</div>
                      {t.note && <div class="text-[11px] text-slate-400 mt-0.5">{t.note}</div>}
                    </td>
                    <td class="text-xs text-slate-600 whitespace-nowrap">
                      <div class="font-medium">{t.gateway || '—'}</div>
                      <div class="text-slate-400">{t.provider}</div>
                    </td>
                    <td class="text-right font-bold text-emerald-600 whitespace-nowrap">{formatVND(t.amount_in)}</td>
                    <td>
                      {t.matched_order_code
                        ? <span class="font-mono text-xs font-bold text-brand-600">{t.matched_order_code}</span>
                        : <span class="text-xs text-slate-400">—</span>}
                    </td>
                    <td class="text-center">
                      <span class={`h-6 px-2.5 inline-flex items-center gap-1 rounded-full text-[11px] font-bold whitespace-nowrap ${st.cls}`}>
                        <i class={`fas ${st.icon}`}></i>{st.label}
                      </span>
                    </td>
                    <td class="text-right whitespace-nowrap">
                      {['unmatched', 'amount_mismatch'].includes(t.match_status) && (
                        <button class="btn-tx-match h-8 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition"
                          data-id={t.id} data-amount={t.amount_in} title="Gán thủ công cho đơn hàng">
                          <i class="fas fa-link mr-1"></i>Gán đơn
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={props.page} totalPages={props.totalPages} baseUrl={'/admin/giao-dich?status=' + props.status} />
    </AdminShell>
  )
}
