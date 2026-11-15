import type { FC, PropsWithChildren } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { EmptyState, StatusBadge, Stars } from '../components/ui'
import { formatVND, formatDate, formatDateTime, gradientFor, PRODUCT_TYPE_LABEL } from '../lib/utils'

const MENU = [
  { href: '/tai-khoan', icon: 'fa-gauge', label: 'Tổng quan', key: 'dash' },
  { href: '/tai-khoan/san-pham', icon: 'fa-box-archive', label: 'Sản phẩm của tôi', key: 'products' },
  { href: '/tai-khoan/don-hang', icon: 'fa-receipt', label: 'Đơn hàng', key: 'orders' },
  { href: '/tai-khoan/yeu-thich', icon: 'fa-heart', label: 'Yêu thích', key: 'wishlist' },
  { href: '/tai-khoan/affiliate', icon: 'fa-handshake', label: 'Affiliate', key: 'affiliate' },
  { href: '/tai-khoan/ho-so', icon: 'fa-user-gear', label: 'Hồ sơ', key: 'profile' }
]

const AccountShell: FC<PropsWithChildren<LayoutProps & { activeKey: string; heading: string; sub?: string }>> = (props) => (
  <Layout {...props} bodyClass="dark-portal bg-[#070614] text-slate-100">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside class="lg:sticky-side">
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-4 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-lg shrink-0">
                {props.user?.full_name.charAt(0).toUpperCase()}
              </div>
              <div class="min-w-0">
                <div class="font-bold text-white truncate text-sm">{props.user?.full_name}</div>
                <div class="text-xs text-[#9492b8] truncate">{props.user?.email}</div>
              </div>
            </div>
          </div>
          <nav aria-label="Menu tài khoản" class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-2 space-y-0.5">
            {MENU.map(m => (
              <a href={m.href} aria-current={props.activeKey === m.key ? 'page' : undefined}
                class={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${props.activeKey === m.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[#b8b6d9] hover:text-white hover:bg-[#161436]'}`}>
                <i class={`fas ${m.icon} w-4`} aria-hidden="true"></i>{m.label}
              </a>
            ))}
            {props.user?.role === 'admin' && (
              <a href="/admin" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-amber-500/10 transition">
                <i class="fas fa-shield-halved w-4" aria-hidden="true"></i>Trang quản trị
              </a>
            )}
            <a href="/dang-xuat" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition">
              <i class="fas fa-right-from-bracket w-4" aria-hidden="true"></i>Đăng xuất
            </a>
          </nav>
        </aside>
        <div>
          <div class="mb-6">
            <h1 class="text-2xl font-extrabold text-white tracking-tight">{props.heading}</h1>
            {props.sub && <p class="text-[#9492b8] text-sm mt-1">{props.sub}</p>}
          </div>
          {props.children}
        </div>
      </div>
    </div>
  </Layout>
)

/* ---------- Dashboard ---------- */
export const AccountDashboard: FC<LayoutProps & {
  stats: { orders: number; products: number; spent: number; balance: number }
  recentOrders: any[]; recentProducts: any[]
}> = (props) => {
  const { stats, recentOrders, recentProducts } = props
  return (
    <AccountShell {...props} activeKey="dash" title="Tài khoản" heading={`Xin chào, ${props.user?.full_name}`} sub="Đây là tổng quan hoạt động tài khoản của bạn.">
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          ['fa-box-archive', 'Sản phẩm sở hữu', String(stats.products), 'from-indigo-500 to-indigo-600'],
          ['fa-receipt', 'Tổng đơn hàng', String(stats.orders), 'from-fuchsia-500 to-purple-600'],
          ['fa-wallet', 'Đã chi tiêu', formatVND(stats.spent), 'from-emerald-500 to-teal-600'],
          ['fa-piggy-bank', 'Số dư ví', formatVND(stats.balance), 'from-amber-500 to-orange-600']
        ].map(([ic, lb, val, grad]) => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
            <div class={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center mb-3.5 shadow-lg`}>
              <i class={`fas ${ic}`} aria-hidden="true"></i>
            </div>
            <div class="text-2xl font-extrabold text-white tabular-nums leading-none mb-1">{val}</div>
            <div class="text-xs text-[#9492b8]">{lb}</div>
          </div>
        ))}
      </div>

      <div class="grid lg:grid-cols-2 gap-5">
        <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden">
          <div class="px-5 py-4 border-b border-[#221e54] flex items-center justify-between">
            <h2 class="font-bold text-white text-base">Đơn hàng gần đây</h2>
            <a href="/tai-khoan/don-hang" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">Xem tất cả</a>
          </div>
          {recentOrders.length === 0
            ? <div class="p-8 text-center text-sm text-[#9492b8]">Chưa có đơn hàng nào</div>
            : (
              <div class="divide-y divide-[#221e54]">
                {recentOrders.map(o => (
                  <a href={`/don-hang/${o.order_code}`} class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#161436] transition">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-300 grid place-items-center text-sm shrink-0">
                      <i class="fas fa-receipt" aria-hidden="true"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-white text-sm tabular-nums">{o.order_code}</div>
                      <div class="text-xs text-[#9492b8] tabular-nums">{formatDate(o.created_at)}</div>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="font-bold text-white text-sm tabular-nums mb-1">{formatVND(o.total)}</div>
                      <StatusBadge status={o.status} />
                    </div>
                  </a>
                ))}
              </div>
            )}
        </div>

        <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden">
          <div class="px-5 py-4 border-b border-[#221e54] flex items-center justify-between">
            <h2 class="font-bold text-white text-base">Sản phẩm mới nhận</h2>
            <a href="/tai-khoan/san-pham" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">Xem tất cả</a>
          </div>
          {recentProducts.length === 0
            ? (
              <div class="p-8 text-center">
                <p class="text-sm text-[#9492b8] mb-3">Bạn chưa sở hữu sản phẩm nào</p>
                <a href="/san-pham" class="inline-flex h-10 px-4 items-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition">Khám phá ngay</a>
              </div>
            )
            : (
              <div class="divide-y divide-[#221e54]">
                {recentProducts.map(p => (
                  <a href="/tai-khoan/san-pham" class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#161436] transition">
                    <div class="w-14 aspect-video rounded-lg shrink-0 grid place-items-center text-white text-xs" style={`background:${gradientFor(p.product_id)}`}>
                      <i class="fas fa-code" aria-hidden="true"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-white text-sm line-clamp-1">{p.name}</div>
                      <div class="text-xs text-[#9492b8] tabular-nums">{formatDate(p.created_at)}</div>
                    </div>
                    <i class="fas fa-chevron-right text-[#9492b8] text-xs" aria-hidden="true"></i>
                  </a>
                ))}
              </div>
            )}
        </div>
      </div>
    </AccountShell>
  )
}

/* ---------- My Products (source code delivery) ---------- */
export const MyProductsPage: FC<LayoutProps & { licenses: any[] }> = (props) => (
  <AccountShell {...props} activeKey="products" title="Sản phẩm của tôi" heading="Sản phẩm của tôi"
    sub="Truy cập link tải sản phẩm, tài liệu và license key của các sản phẩm bạn đã mua.">
    {props.licenses.length === 0 ? (
      <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
        <EmptyState icon="fa-box-archive" title="Bạn chưa sở hữu sản phẩm nào"
          desc="Sau khi thanh toán thành công, link tải sản phẩm sẽ xuất hiện tại đây."
          action={{ href: '/san-pham', label: 'Khám phá sản phẩm' }} />
      </div>
    ) : (
      <div class="space-y-4">
        {props.licenses.map(l => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden">
            <div class="p-5 flex flex-col sm:flex-row gap-4">
              <div class="sm:w-40 aspect-video rounded-xl shrink-0 grid place-items-center text-white overflow-hidden"
                style={l.thumbnail ? '' : `background:${gradientFor(l.product_id)}`}>
                {l.thumbnail ? <img src={l.thumbnail} alt={l.name} class="w-full h-full object-cover rounded-xl" loading="lazy" />
                  : <i class={`fas ${l.product_type === 'skill' ? 'fa-wand-magic-sparkles' : l.product_type === 'chatbot' ? 'fa-robot' : 'fa-code'} text-2xl`} aria-hidden="true"></i>}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <span class="px-2.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">{PRODUCT_TYPE_LABEL[l.product_type]}</span>
                  <span class="px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                    <i class="fas fa-circle-check mr-1" aria-hidden="true"></i>Đã kích hoạt
                  </span>
                  <span class="text-[11px] text-[#9492b8] font-mono">{l.version}</span>
                </div>
                <h2 class="font-bold text-white leading-snug mb-2 text-base">
                  <a href={`/san-pham/${l.slug}`} class="hover:text-indigo-300 transition">{l.name}</a>
                </h2>
                <div class="text-xs text-[#9492b8] mb-3 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                  <span><i class="far fa-calendar mr-1" aria-hidden="true"></i>Mua ngày {formatDate(l.created_at)}</span>
                  <span><i class="fas fa-download mr-1" aria-hidden="true"></i>{l.download_count} lượt tải</span>
                  {l.file_size && l.file_size !== '—' && <span><i class="fas fa-hard-drive mr-1" aria-hidden="true"></i>{l.file_size}</span>}
                </div>

                <div class="p-3 rounded-xl bg-[#161436] border border-[#221e54] mb-3">
                  <div class="text-[11px] text-[#9492b8] mb-1 font-semibold uppercase tracking-wide">License Key</div>
                  <div class="flex items-center gap-2">
                    <code class="flex-1 font-mono text-sm text-indigo-300 font-bold tracking-wider truncate">{l.license_key}</code>
                    <button type="button" data-copy={l.license_key} aria-label="Sao chép license key"
                      class="shrink-0 w-9 h-9 rounded-lg bg-[#0f0e24] border border-[#2e2968] hover:border-indigo-400 hover:text-indigo-300 text-[#b8b6d9] text-xs transition grid place-items-center">
                      <i class="far fa-copy" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  {l.download_url ? (
                    <a href={`/tai-xuong/${l.id}`} target="_blank" rel="noopener"
                      class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-indigo-500/20 transition">
                      <i class="fas fa-download" aria-hidden="true"></i>{l.product_type === 'skill' ? 'Tải bộ Skill AI' : l.product_type === 'chatbot' ? 'Mở Chatbot' : 'Mở & Tải xuống'}
                    </a>
                  ) : (
                    <span class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-sm">
                      <i class="fas fa-clock" aria-hidden="true"></i>Đang chuẩn bị link...
                    </span>
                  )}
                  {l.doc_url && (
                    <a href={l.doc_url} target="_blank" rel="noopener"
                      class="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#2e2968] text-[#c2c0e0] hover:border-indigo-400 hover:text-white font-semibold text-sm transition">
                      <i class="fas fa-book" aria-hidden="true"></i>Tài liệu
                    </a>
                  )}
                  <a href={`/san-pham/${l.slug}#reviews`}
                    class="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#2e2968] text-[#c2c0e0] hover:border-amber-400 hover:text-amber-300 font-semibold text-sm transition">
                    <i class="far fa-star" aria-hidden="true"></i>Đánh giá
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </AccountShell>
)

/* ---------- Orders ---------- */
export const MyOrdersPage: FC<LayoutProps & { orders: any[] }> = (props) => (
  <AccountShell {...props} activeKey="orders" title="Đơn hàng" heading="Lịch sử đơn hàng" sub="Theo dõi trạng thái và chi tiết các đơn hàng của bạn.">
    {props.orders.length === 0 ? (
      <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
        <EmptyState icon="fa-receipt" title="Chưa có đơn hàng nào" action={{ href: '/san-pham', label: 'Mua sắm ngay' }} />
      </div>
    ) : (
      <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[#161436] border-b border-[#221e54] text-[#b8b6d9] text-xs uppercase tracking-wider">
              <tr>
                <th class="text-left py-3.5 px-4 font-semibold">Mã đơn</th>
                <th class="text-left py-3.5 px-4 font-semibold">Ngày</th>
                <th class="text-left py-3.5 px-4 font-semibold">Sản phẩm</th>
                <th class="text-right py-3.5 px-4 font-semibold">Tổng tiền</th>
                <th class="text-center py-3.5 px-4 font-semibold">Trạng thái</th>
                <th class="py-3.5 px-4"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#221e54]">
              {props.orders.map(o => (
                <tr class="hover:bg-[#161436]/60 transition">
                  <td class="py-3.5 px-4"><b class="text-indigo-300 font-mono tabular-nums">{o.order_code}</b></td>
                  <td class="py-3.5 px-4 text-[#9492b8] whitespace-nowrap tabular-nums">{formatDate(o.created_at)}</td>
                  <td class="py-3.5 px-4 text-[#c2c0e0] max-w-[240px]"><div class="line-clamp-1">{o.product_names || '—'}</div></td>
                  <td class="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap tabular-nums">{formatVND(o.total)}</td>
                  <td class="py-3.5 px-4 text-center"><StatusBadge status={o.status} /></td>
                  <td class="py-3.5 px-4 text-right">
                    <a href={`/don-hang/${o.order_code}`} class="inline-flex h-9 px-3 items-center rounded-lg bg-[#161436] border border-[#2e2968] hover:border-indigo-400 hover:text-indigo-300 text-[#c2c0e0] text-xs font-semibold transition">
                      Chi tiết
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </AccountShell>
)

/* ---------- Wishlist ---------- */
export const WishlistPage: FC<LayoutProps & { items: any[] }> = (props) => (
  <AccountShell {...props} activeKey="wishlist" title="Yêu thích" heading="Sản phẩm yêu thích" sub="Danh sách sản phẩm bạn đã lưu để mua sau.">
    {props.items.length === 0 ? (
      <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
        <EmptyState icon="fa-heart" title="Chưa có sản phẩm yêu thích" action={{ href: '/san-pham', label: 'Khám phá sản phẩm' }} />
      </div>
    ) : (
      <div class="space-y-3">
        {props.items.map(p => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-4 flex gap-4">
            <a href={`/san-pham/${p.slug}`} class="w-28 aspect-video rounded-xl shrink-0 grid place-items-center text-white"
              style={`background:${gradientFor(p.id)}`} aria-label={p.name}>
              <i class="fas fa-code" aria-hidden="true"></i>
            </a>
            <div class="flex-1 min-w-0">
              <h2 class="font-bold text-white line-clamp-2 leading-snug mb-1.5 text-base">
                <a href={`/san-pham/${p.slug}`} class="hover:text-indigo-300 transition">{p.name}</a>
              </h2>
              <div class="text-lg font-extrabold text-emerald-400 tabular-nums mb-2">{formatVND(p.price)}</div>
              <div class="flex flex-wrap gap-2">
                {p.status === 'coming_soon' ? (
                  <a href={`/san-pham/${p.slug}`} class="h-10 px-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5">
                    <i class="fas fa-clock" aria-hidden="true"></i>Chưa mở bán
                  </a>
                ) : (
                  <button type="button" class="btn-add-cart h-10 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition" data-id={p.id} data-name={p.name}>
                    <i class="fas fa-cart-plus mr-1.5" aria-hidden="true"></i>Thêm giỏ
                  </button>
                )}
                <button type="button" class="btn-wishlist h-10 px-3.5 rounded-xl border border-[#2e2968] text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition" data-id={p.id}>
                  <i class="fas fa-heart mr-1.5" aria-hidden="true"></i>Bỏ thích
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </AccountShell>
)

/* ---------- Affiliate ---------- */
export const AffiliateDashboard: FC<LayoutProps & {
  affCode: string; earned: number; refCount: number; percent: number; referrals: any[]; siteUrl: string
}> = (props) => {
  const link = `${props.siteUrl}/dang-ky?ref=${props.affCode}`
  return (
    <AccountShell {...props} activeKey="affiliate" title="Affiliate" heading="Chương trình Affiliate" sub={`Giới thiệu bạn bè và nhận hoa hồng ${props.percent}% cho mỗi đơn hàng thành công.`}>
      <div class="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          ['fa-percent', 'Hoa hồng', props.percent + '%', 'from-indigo-500 to-indigo-600'],
          ['fa-users', 'Người giới thiệu', String(props.refCount), 'from-fuchsia-500 to-purple-600'],
          ['fa-coins', 'Tổng hoa hồng', formatVND(props.earned), 'from-emerald-500 to-teal-600']
        ].map(([ic, lb, val, grad]) => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
            <div class={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center mb-3.5 shadow-lg`}>
              <i class={`fas ${ic}`} aria-hidden="true"></i>
            </div>
            <div class="text-2xl font-extrabold text-white tabular-nums leading-none mb-1">{val}</div>
            <div class="text-xs text-[#9492b8]">{lb}</div>
          </div>
        ))}
      </div>

      <div class="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-6 text-white mb-6 shadow-xl shadow-indigo-950/50">
        <h2 class="font-bold text-lg mb-1.5">Link giới thiệu của bạn</h2>
        <p class="text-sm text-white/85 mb-4">Chia sẻ link này, mỗi khi có người đăng ký và mua hàng bạn nhận {props.percent}% hoa hồng.</p>
        <div class="flex flex-col sm:flex-row gap-2">
          <label for="aff-link" class="sr-only">Link giới thiệu của bạn</label>
          <input type="text" value={link} readonly id="aff-link"
            class="flex-1 h-11 px-4 rounded-xl bg-white/15 border border-white/25 text-white text-sm outline-none backdrop-blur font-mono" />
          <button type="button" data-copy={link} class="cta-white h-11 px-5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-slate-100 transition whitespace-nowrap">
            <i class="far fa-copy mr-1.5" aria-hidden="true"></i>Sao chép link
          </button>
        </div>
        <div class="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-3 text-sm">
          <span class="text-white/85">Mã của bạn:</span>
          <code class="px-3 py-1 rounded-lg bg-white/20 font-mono font-bold tracking-widest">{props.affCode}</code>
          <button type="button" data-copy={props.affCode} class="text-white/85 hover:text-white text-xs font-medium">
            <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy mã
          </button>
        </div>
      </div>

      <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden">
        <div class="px-5 py-4 border-b border-[#221e54]"><h2 class="font-bold text-white text-base">Danh sách người bạn giới thiệu</h2></div>
        {props.referrals.length === 0
          ? <div class="p-10 text-center text-sm text-[#9492b8]">Chưa có ai đăng ký qua link của bạn. Hãy bắt đầu chia sẻ!</div>
          : (
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-[#161436] border-b border-[#221e54] text-[#b8b6d9] text-xs uppercase tracking-wider">
                  <tr>
                    <th class="text-left py-3.5 px-4 font-semibold">Thành viên</th>
                    <th class="text-left py-3.5 px-4 font-semibold">Ngày tham gia</th>
                    <th class="text-right py-3.5 px-4 font-semibold">Đã mua</th>
                    <th class="text-right py-3.5 px-4 font-semibold">Hoa hồng</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#221e54]">
                  {props.referrals.map(r => (
                    <tr class="hover:bg-[#161436]/60 transition">
                      <td class="py-3.5 px-4">
                        <div class="font-semibold text-white">{r.full_name}</div>
                        <div class="text-xs text-[#9492b8]">{r.email.replace(/(.{2}).*(@.*)/, '$1***$2')}</div>
                      </td>
                      <td class="py-3.5 px-4 text-[#9492b8] tabular-nums">{formatDate(r.created_at)}</td>
                      <td class="py-3.5 px-4 text-right font-semibold text-[#c2c0e0] tabular-nums">{formatVND(r.spent || 0)}</td>
                      <td class="py-3.5 px-4 text-right font-bold text-emerald-400 tabular-nums">{formatVND(Math.round((r.spent || 0) * props.percent / 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </AccountShell>
  )
}

/* ---------- Profile ---------- */
export const ProfilePage: FC<LayoutProps & { profile: any }> = (props) => (
  <AccountShell {...props} activeKey="profile" title="Hồ sơ" heading="Hồ sơ cá nhân" sub="Cập nhật thông tin và mật khẩu tài khoản.">
    <div class="grid lg:grid-cols-2 gap-5">
      <form action="/api/account/profile" method="post" data-ajax class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6">
        <h2 class="font-bold text-white mb-5 text-base"><i class="fas fa-user mr-2 text-indigo-400" aria-hidden="true"></i>Thông tin cá nhân</h2>
        <div class="space-y-4">
          <div>
            <label for="profile-name" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Họ và tên</label>
            <input id="profile-name" type="text" name="full_name" value={props.profile.full_name} required autocomplete="name"
              class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
          </div>
          <div>
            <label for="profile-email" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Email</label>
            <input id="profile-email" type="email" value={props.profile.email} disabled
              class="w-full h-11 px-3.5 rounded-xl bg-[#070614] border border-[#221e54] text-sm text-[#9492b8] cursor-not-allowed" />
            <p class="text-xs text-[#9492b8] mt-1">Email không thể thay đổi</p>
          </div>
          <div>
            <label for="profile-phone" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Số điện thoại</label>
            <input id="profile-phone" type="tel" name="phone" value={props.profile.phone || ''} autocomplete="tel"
              class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
          </div>
          <div role="alert" class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-sm text-rose-200"></div>
          <button type="submit" class="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition">Lưu thay đổi</button>
        </div>
      </form>

      <form action="/api/account/password" method="post" data-ajax class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 self-start">
        <h2 class="font-bold text-white mb-5 text-base"><i class="fas fa-key mr-2 text-indigo-400" aria-hidden="true"></i>Đổi mật khẩu</h2>
        <div class="space-y-4">
          <div>
            <label for="current-password" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Mật khẩu hiện tại</label>
            <div class="relative">
              <input id="current-password" type="password" name="current_password" required autocomplete="current-password"
                class="w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
              <button type="button" class="toggle-password-btn absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#9492b8] hover:text-white grid place-items-center transition"
                aria-label="Hiện mật khẩu hiện tại" aria-pressed="false" data-target="current-password">
                <i class="far fa-eye text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div>
            <label for="new-password" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Mật khẩu mới</label>
            <div class="relative">
              <input id="new-password" type="password" name="new_password" required minlength={6} autocomplete="new-password"
                class="w-full h-11 pl-3.5 pr-11 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
              <button type="button" class="toggle-password-btn absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#9492b8] hover:text-white grid place-items-center transition"
                aria-label="Hiện mật khẩu mới" aria-pressed="false" data-target="new-password">
                <i class="far fa-eye text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div role="alert" class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-sm text-rose-200"></div>
          <button type="submit" class="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition">Đổi mật khẩu</button>
        </div>
      </form>
    </div>
  </AccountShell>
)
