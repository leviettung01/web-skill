import type { FC, PropsWithChildren } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { EmptyState, StatusBadge, Stars } from '../components/ui'
import { formatVND, formatDate, formatDateTime, gradientFor, PRODUCT_TYPE_LABEL, isMcpSkill } from '../lib/utils'
import { buildUnifiedMcpConfigs, getSkillQuickStartGuide, resolveMcpServerName } from '../lib/mcp'

const MENU = [
  { href: '/tai-khoan', icon: 'fa-gauge', label: 'Tổng quan', key: 'dash' },
  { href: '/tai-khoan/thong-bao', icon: 'fa-bell', label: 'Thông báo', key: 'notifications' },
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
              {props.user?.avatar_url ? (
                <img src={props.user.avatar_url} alt={props.user.full_name} class="w-12 h-12 rounded-full object-cover shrink-0 border border-white/15" referrerpolicy="no-referrer" />
              ) : (
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-lg shrink-0">
                  {props.user?.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div class="min-w-0">
                <div class="font-bold text-white truncate text-sm">{props.user?.full_name}</div>
                <div class="text-xs text-[#9492b8] truncate">{props.user?.email}</div>
              </div>
            </div>
          </div>
          <nav aria-label="Menu tài khoản" class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-2 space-y-0.5">
            {MENU.map(m => (
              <a href={m.href} aria-current={props.activeKey === m.key ? 'page' : undefined}
                class={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${props.activeKey === m.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[#b8b6d9] hover:text-white hover:bg-[#161436]'}`}>
                <span class="flex items-center gap-3"><i class={`fas ${m.icon} w-4`} aria-hidden="true"></i>{m.label}</span>
                {m.key === 'notifications' && (props.unreadNotifs || 0) > 0 && (
                  <span class={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${props.activeKey === m.key ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'}`}>
                    {props.unreadNotifs}
                  </span>
                )}
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

export interface McpConnectionRow {
  id: number
  client_name: string
  client_domain?: string | null
  created_at?: string | null
  last_used_at?: string | null
}

/* ---------- My Products (Simple Non-Tech AI Connect + Clean Skill List) ---------- */
export const MyProductsPage: FC<LayoutProps & {
  licenses: any[]
  origin?: string
  mcpToken?: string
  mcpConnections?: McpConnectionRow[]
}> = (props) => {
  const origin = (props.origin || 'https://khoskill.site').replace(/\/+$/, '')
  const mcpLicenses = props.licenses.filter(l => isMcpSkill(l.product_type))
  const hasMcp = mcpLicenses.length > 0
  const enabledMcpCount = mcpLicenses.filter(l => l.mcp_enabled === undefined || Number(l.mcp_enabled) !== 0).length
  const connections = props.mcpConnections || []
  const unified = buildUnifiedMcpConfigs({ origin, userToken: props.mcpToken || '' })

  return (
    <AccountShell {...props} activeKey="products" title="Sản phẩm của tôi" heading="Sản phẩm của tôi"
      sub="Kết nối AI một lần để dùng mọi Skill đã mua, chọn bật/tắt hoặc mở dùng ngay từng Skill cụ thể.">
      {props.licenses.length === 0 ? (
        <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
          <EmptyState icon="fa-box-archive" title="Bạn chưa sở hữu sản phẩm nào"
            desc="Sau khi thanh toán thành công, hướng dẫn kết nối AI và link tải Skill sẽ xuất hiện ngay tại đây."
            action={{ href: '/san-pham', label: 'Khám phá sản phẩm' }} />
        </div>
      ) : (
        <div class="space-y-7">
          {hasMcp && (
            <section aria-labelledby="ai-connect-heading">
              <div class="mb-3.5">
                <h2 id="ai-connect-heading" class="text-xl font-extrabold text-white tracking-tight">Kết nối AI của bạn</h2>
                <p class="text-sm text-[#a9a7ce] mt-1 leading-relaxed">
                  Kết nối một lần để AI tự dùng mọi Skill đang bật — hoặc chọn riêng 1 Skill cụ thể bên dưới nếu chỉ muốn nối đúng Skill đó.
                </p>
              </div>

              <div id="ai-connect-card" data-origin={origin} data-mcp-token={props.mcpToken || ''}
                class="bg-[#0f0e24] rounded-2xl border border-[#2a2559] shadow-xl shadow-black/25 p-5 sm:p-6 space-y-5">
                {/* Skill Scope Picker: All Active Skills OR Pick 1 Specific Skill */}
                <div class="pb-4 border-b border-[#221e54]">
                  <div class="text-xs font-bold text-[#c2c0e0] mb-2.5">Chọn Skill muốn kết nối:</div>
                  <div id="ai-scope-picker" class="flex flex-wrap gap-2" role="radiogroup" aria-label="Chọn phạm vi Skill kết nối">
                    <button type="button" role="radio" aria-checked="true"
                      data-scope-slug="" data-scope-name="Tất cả Skill đang bật" data-scope-server="khoskill"
                      class="ai-scope-chip active inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-xs font-bold transition cursor-pointer">
                      <i class="fas fa-layer-group text-[11px]" aria-hidden="true"></i>
                      <span>Tất cả Skill đang bật (<span id="ai-scope-enabled-count">{enabledMcpCount}</span>)</span>
                    </button>
                    {mcpLicenses.map(s => {
                      const guide = getSkillQuickStartGuide(s.slug, s.name)
                      const isOn = s.mcp_enabled === undefined || Number(s.mcp_enabled) !== 0
                      const srvName = resolveMcpServerName({ slug: s.slug, mcp_server_name: s.mcp_server_name })
                      return (
                        <button type="button" role="radio" aria-checked="false"
                          data-scope-slug={s.slug} data-scope-name={guide.shortName} data-scope-server={srvName}
                          data-scope-license-id={s.id}
                          class="ai-scope-chip inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-xs font-semibold transition cursor-pointer">
                          <span data-scope-dot={s.id} class={`w-2 h-2 rounded-full shrink-0 ${isOn ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                          <span>{guide.shortName}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p id="ai-scope-note" class="text-xs text-[#9492b8] mt-2">
                    Đang nối <b class="text-white">toàn bộ Skill đang bật</b> — mua thêm Skill mới AI sẽ tự dùng ngay.
                  </p>
                </div>

                {/* Pill Tab Switcher */}
                <div role="tablist" aria-label="Chọn ứng dụng AI để kết nối"
                  class="ai-connect-tabs grid grid-cols-2 sm:grid-cols-5 gap-1 p-1.5 rounded-2xl sm:rounded-full bg-[#09081b] border border-[#242054]">
                  <button type="button" role="tab" aria-selected="true" data-tab="claude" data-group="ai-connect"
                    class="ai-connect-tab tab-btn active h-10 px-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition cursor-pointer">
                    Claude
                  </button>
                  <button type="button" role="tab" aria-selected="false" data-tab="chatgpt" data-group="ai-connect"
                    class="ai-connect-tab tab-btn h-10 px-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold text-[#b8b6d9] hover:text-white transition cursor-pointer">
                    ChatGPT
                  </button>
                  <button type="button" role="tab" aria-selected="false" data-tab="claude-code" data-group="ai-connect"
                    class="ai-connect-tab tab-btn h-10 px-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold text-[#b8b6d9] hover:text-white transition cursor-pointer">
                    Claude Code
                  </button>
                  <button type="button" role="tab" aria-selected="false" data-tab="codex" data-group="ai-connect"
                    class="ai-connect-tab tab-btn h-10 px-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold text-[#b8b6d9] hover:text-white transition cursor-pointer">
                    Codex
                  </button>
                  <button type="button" role="tab" aria-selected="false" data-tab="antigravity" data-group="ai-connect"
                    class="ai-connect-tab tab-btn col-span-2 sm:col-span-1 h-10 px-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold text-[#b8b6d9] hover:text-white transition cursor-pointer">
                    Antigravity
                  </button>
                </div>

                {/* Tab 1: Claude (claude.ai OAuth) */}
                <div role="tabpanel" data-tab="claude" data-group="ai-connect" class="tab-panel space-y-3.5 text-sm text-[#d6d4ee] leading-relaxed">
                  <p>1. Mở <b class="text-white">claude.ai</b> → <b class="text-white">Cài đặt (Settings)</b> → <b class="text-white">Trình kết nối (Connectors)</b> → <b class="text-white">Thêm trình kết nối tuỳ chỉnh</b>.</p>
                  <div>
                    <p>2. Đặt tên <b class="text-white">KhoSkill AI</b>, dán địa chỉ này:</p>
                    <div class="mt-2.5 flex items-center gap-2.5">
                      <div class="flex-1 min-w-0 h-12 px-4 rounded-full bg-[#09081b] border border-[#2a2559] flex items-center">
                        <code class="ai-mcp-url text-xs sm:text-sm font-mono text-[#e8e7fb] truncate select-all">{unified.endpointUrl}</code>
                      </div>
                      <button type="button" data-copy={unified.endpointUrl}
                        class="ai-mcp-copy-url shrink-0 h-12 px-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer">
                        Chép
                      </button>
                    </div>
                  </div>
                  <p>3. Bấm <b class="text-white">Kết nối (Connect)</b> → đăng nhập tài khoản <b class="text-white">KhoSkill AI</b> → bấm <b class="text-white">Cho phép</b>.</p>
                  <p>4. Xong. Bấm <b class="text-white">Dùng Skill này</b> ở danh sách bên dưới để chép câu nhắn mẫu gửi cho Claude.</p>
                </div>

                {/* Tab 2: ChatGPT (chatgpt.com OAuth) */}
                <div role="tabpanel" data-tab="chatgpt" data-group="ai-connect" class="tab-panel hidden space-y-3.5 text-sm text-[#d6d4ee] leading-relaxed">
                  <p>1. Mở <b class="text-white">chatgpt.com</b> → <b class="text-white">Cài đặt (Settings)</b> → <b class="text-white">Ứng dụng &amp; Trình kết nối (Connectors)</b> → <b class="text-white">Tạo mới</b>.</p>
                  <div>
                    <p>2. Đặt tên <b class="text-white">KhoSkill AI</b>, dán địa chỉ này:</p>
                    <div class="mt-2.5 flex items-center gap-2.5">
                      <div class="flex-1 min-w-0 h-12 px-4 rounded-full bg-[#09081b] border border-[#2a2559] flex items-center">
                        <code class="ai-mcp-url text-xs sm:text-sm font-mono text-[#e8e7fb] truncate select-all">{unified.endpointUrl}</code>
                      </div>
                      <button type="button" data-copy={unified.endpointUrl}
                        class="ai-mcp-copy-url shrink-0 h-12 px-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer">
                        Chép
                      </button>
                    </div>
                  </div>
                  <p>3. Chọn xác thực <b class="text-white">OAuth</b> → đăng nhập tài khoản <b class="text-white">KhoSkill AI</b> → bấm <b class="text-white">Cho phép</b>.</p>
                  <p>4. Xong. Bấm <b class="text-white">Dùng Skill này</b> ở danh sách bên dưới để chép câu nhắn mẫu gửi cho ChatGPT.</p>
                </div>

                {/* Tab 3: Claude Code — 1-paste into chat */}
                <div role="tabpanel" data-tab="claude-code" data-group="ai-connect" class="tab-panel hidden space-y-3.5 text-sm text-[#d6d4ee] leading-relaxed">
                  <div>
                    <p>1. Bấm <b class="text-white">Chép</b> rồi <b class="text-white">dán thẳng vào khung chat Claude Code</b> (AI tự cài giúp bạn, không cần chỉnh tay):</p>
                    <div class="mt-2.5 flex flex-col sm:flex-row sm:items-start gap-2.5 p-3.5 rounded-2xl bg-[#09081b] border border-[#2a2559]">
                      <pre id="unified-claude-code-prompt" class="flex-1 min-w-0 text-xs font-sans text-[#e8e7fb] whitespace-pre-wrap break-all leading-relaxed select-all">{unified.claudeCodePrompt}</pre>
                      <button type="button" data-copy-target="unified-claude-code-prompt"
                        class="shrink-0 self-start h-10 px-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer">
                        Chép
                      </button>
                    </div>
                  </div>
                  <p>2. Khi Claude Code hỏi quyền chạy lệnh → bấm <b class="text-white">Cho phép (Allow)</b> là xong — áp dụng cho mọi dự án.</p>
                  <details class="rounded-xl bg-[#09081b]/60 border border-[#221e54] px-3.5 py-2.5 text-xs">
                    <summary class="cursor-pointer font-semibold text-[#a9a7ce] hover:text-white select-none">
                      Hoặc chỉ lấy 1 dòng lệnh Terminal (nếu bạn muốn tự chạy)
                    </summary>
                    <div class="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                      <code id="unified-claude-code" class="flex-1 min-w-0 font-mono text-[11px] text-cyan-200 break-all select-all">{unified.claudeCodeCli}</code>
                      <button type="button" data-copy-target="unified-claude-code"
                        class="shrink-0 self-start sm:self-center h-8 px-3.5 rounded-full bg-[#161436] border border-[#2e2968] hover:border-indigo-400 text-white font-semibold text-[11px] transition cursor-pointer">
                        Chép lệnh
                      </button>
                    </div>
                  </details>
                </div>

                {/* Tab 4: Codex — 1-paste into chat */}
                <div role="tabpanel" data-tab="codex" data-group="ai-connect" class="tab-panel hidden space-y-3.5 text-sm text-[#d6d4ee] leading-relaxed">
                  <div>
                    <p>1. Bấm <b class="text-white">Chép</b> rồi <b class="text-white">dán thẳng vào khung chat Codex</b> (Codex tự mở file và cài giúp bạn):</p>
                    <div class="mt-2.5 flex flex-col sm:flex-row sm:items-start gap-2.5 p-3.5 rounded-2xl bg-[#09081b] border border-[#2a2559]">
                      <pre id="unified-codex-prompt" class="flex-1 min-w-0 text-xs font-sans text-[#e8e7fb] whitespace-pre-wrap break-all leading-relaxed select-all">{unified.codexPrompt}</pre>
                      <button type="button" data-copy-target="unified-codex-prompt"
                        class="shrink-0 self-start h-10 px-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer">
                        Chép
                      </button>
                    </div>
                  </div>
                  <p>2. Khi Codex hỏi quyền lưu file cài đặt → bấm <b class="text-white">Cho phép (Allow)</b> → đóng và mở lại <b class="text-white">Codex</b> là xong.</p>
                  <details class="rounded-xl bg-[#09081b]/60 border border-[#221e54] px-3.5 py-2.5 text-xs">
                    <summary class="cursor-pointer font-semibold text-[#a9a7ce] hover:text-white select-none">
                      Hoặc tự dán thủ công vào ~/.codex/config.toml
                    </summary>
                    <div class="mt-2.5 flex flex-col sm:flex-row sm:items-start gap-2">
                      <pre id="unified-codex-toml" class="flex-1 min-w-0 font-mono text-[11px] text-emerald-200 whitespace-pre-wrap break-all select-all">{unified.codexToml}</pre>
                      <button type="button" data-copy-target="unified-codex-toml"
                        class="shrink-0 self-start h-8 px-3.5 rounded-full bg-[#161436] border border-[#2e2968] hover:border-emerald-400 text-white font-semibold text-[11px] transition cursor-pointer">
                        Chép TOML
                      </button>
                    </div>
                  </details>
                </div>

                {/* Tab 5: Antigravity — 1-paste into chat */}
                <div role="tabpanel" data-tab="antigravity" data-group="ai-connect" class="tab-panel hidden space-y-3.5 text-sm text-[#d6d4ee] leading-relaxed">
                  <div>
                    <p>1. Bấm <b class="text-white">Chép</b> rồi <b class="text-white">dán thẳng vào khung chat Antigravity</b> (AI tự cài vào máy giúp bạn, không phải tự tìm file):</p>
                    <div class="mt-2.5 flex flex-col sm:flex-row sm:items-start gap-2.5 p-3.5 rounded-2xl bg-[#09081b] border border-[#2a2559]">
                      <pre id="unified-agy-prompt" class="flex-1 min-w-0 text-xs font-sans text-[#e8e7fb] whitespace-pre-wrap break-all leading-relaxed select-all">{unified.antigravityPrompt}</pre>
                      <button type="button" data-copy-target="unified-agy-prompt"
                        class="shrink-0 self-start h-10 px-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer">
                        Chép
                      </button>
                    </div>
                  </div>
                  <p>2. Khi Antigravity hiện hộp xác nhận sửa file cài đặt → bấm <b class="text-white">Cho phép (Allow)</b>.</p>
                  <p>3. Xong. Mở <b class="text-white">đoạn chat mới</b> (hoặc bấm dấu <b class="text-white">...</b> → <b class="text-white">MCP Servers</b> → <b class="text-white">Refresh</b>) là AI tự dùng mọi Skill của bạn.</p>
                  <details class="rounded-xl bg-[#09081b]/60 border border-[#221e54] px-3.5 py-2.5 text-xs space-y-2.5">
                    <summary class="cursor-pointer font-semibold text-[#a9a7ce] hover:text-white select-none">
                      Hoặc xem hướng dẫn tự dán thủ công từng bước (4 bước)
                    </summary>
                    <ol class="list-decimal list-inside space-y-1 text-[#b8b6d9] pt-1">
                      <li>Trong Antigravity, bấm nút <b class="text-white">...</b> (góc trên phải) → <b class="text-white">MCP Servers</b> → <b class="text-white">Manage MCP Servers</b> → <b class="text-white">View raw config</b>.</li>
                      <li>Gộp mục bên dưới vào trong <code class="text-white">"mcpServers"</code> (đừng xoá server cũ nếu đã có):</li>
                    </ol>
                    <div class="flex flex-col sm:flex-row sm:items-start gap-2">
                      <pre id="unified-agy-json" class="flex-1 min-w-0 font-mono text-[11px] text-violet-200 overflow-x-auto whitespace-pre select-all">{unified.antigravityJson}</pre>
                      <button type="button" data-copy-target="unified-agy-json"
                        class="shrink-0 self-start h-8 px-3.5 rounded-full bg-[#161436] border border-[#2e2968] hover:border-violet-400 text-white font-semibold text-[11px] transition cursor-pointer">
                        Chép JSON
                      </button>
                    </div>
                    <p class="text-[#b8b6d9]">3. Bấm <b class="text-white">Ctrl + S</b> lưu file → quay lại <b class="text-white">MCP Servers</b> bấm <b class="text-white">Refresh</b> là xong.</p>
                  </details>
                </div>

                {/* Connected AI Clients List */}
                <div class="pt-5 border-t border-[#221e54]">
                  <h3 class="text-sm font-bold text-white mb-3">AI đang kết nối</h3>
                  {connections.length > 0 ? (
                    <div class="space-y-2.5" id="mcp-connections-list">
                      {connections.map(conn => (
                        <div class="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl bg-[#09081b]/75 border border-[#221e54]" data-conn-row={conn.id}>
                          <div class="min-w-0">
                            <div class="font-bold text-sm text-white truncate">{conn.client_name}</div>
                            <div class="text-xs text-[#9492b8] mt-0.5 flex flex-wrap items-center gap-x-1.5">
                              <span class="text-emerald-300 font-medium">{conn.client_domain || 'không rõ tên miền'}</span>
                              <span>· nối ngày {formatDate(conn.created_at || '')}</span>
                              <span>· {conn.last_used_at ? `dùng gần nhất ${formatDate(conn.last_used_at)}` : 'chưa dùng lần nào'}</span>
                            </div>
                          </div>
                          <button type="button" data-conn-id={conn.id} data-conn-name={conn.client_name}
                            class="btn-revoke-mcp-conn shrink-0 h-9 px-4 rounded-full border border-[#322d6e] bg-[#161436] hover:border-rose-400 hover:text-rose-300 text-xs font-semibold text-[#e2e1f5] transition cursor-pointer">
                            Ngắt
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p class="text-xs text-[#9492b8]">Chưa có AI nào đang kết nối. Làm theo các bước ở trên để kết nối Claude hoặc ChatGPT.</p>
                  )}
                  <p class="text-xs text-[#8b89b0] mt-3 leading-relaxed">
                    Tên ứng dụng do chính ứng dụng tự khai. Tên miền bên dưới mới là thứ không giả được — thấy tên miền lạ thì ngắt ngay.
                  </p>
                </div>

                {/* Security Warning + Revoke All */}
                <div class="pt-4 border-t border-[#221e54] text-xs text-[#9492b8] leading-relaxed">
                  <p>
                    Lệnh ở tab Claude Code / Codex / Antigravity chứa mã riêng của bạn — đừng gửi cho người khác. Nếu lỡ để lộ, hoặc muốn gỡ quyền của mọi AI đã kết nối:
                  </p>
                  <button type="button"
                    class="btn-revoke-all-mcp mt-1.5 inline-flex items-center gap-1.5 font-semibold text-rose-400 hover:text-rose-300 hover:underline transition cursor-pointer">
                    Ngắt mọi kết nối AI
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Owned Skills List (Pick any specific Skill to Use or Toggle On/Off for AI) */}
          <section aria-labelledby="owned-skills-heading">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3.5">
              <div>
                <h2 id="owned-skills-heading" class="text-lg font-extrabold text-white tracking-tight">Skill bạn đã mua</h2>
                {hasMcp && (
                  <p class="text-xs text-[#9492b8] mt-0.5">Bấm <b class="text-white">Dùng Skill này</b> để lấy câu nhắn dùng ngay, hoặc bật/tắt công tắc để chọn Skill cho AI.</p>
                )}
              </div>
              {hasMcp ? (
                <span id="mcp-enabled-counter" class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tabular-nums">
                  Đang bật {enabledMcpCount}/{mcpLicenses.length} Skill cho AI
                </span>
              ) : (
                <span class="text-xs text-[#9492b8] tabular-nums">{props.licenses.length} sản phẩm</span>
              )}
            </div>

            <div class="space-y-3">
              {props.licenses.map(l => {
                const mcp = isMcpSkill(l.product_type)
                const isEnabled = l.mcp_enabled === undefined || Number(l.mcp_enabled) !== 0
                const guide = mcp ? getSkillQuickStartGuide(l.slug, l.name) : null
                return (
                  <div data-skill-card={l.id}
                    class={`bg-[#0f0e24] rounded-2xl border transition p-4 flex flex-col sm:flex-row items-start gap-4 ${mcp && !isEnabled ? 'border-[#221e54] opacity-75' : 'border-[#221e54] hover:border-indigo-500/40'}`}>
                    <a href={`/san-pham/${l.slug}`}
                      class="block w-full sm:w-36 h-40 sm:h-24 self-start shrink-0 rounded-xl overflow-hidden bg-[#09081b] border border-white/10"
                      style={l.thumbnail ? '' : `background:${gradientFor(l.product_id)}`}>
                      {l.thumbnail ? (
                        <img src={l.thumbnail} alt={l.name} class="w-full h-full object-cover object-[50%_35%]" loading="lazy" />
                      ) : (
                        <div class="w-full h-full grid place-items-center text-white">
                          <i class={`fas ${mcp ? 'fa-plug-circle-bolt' : l.product_type === 'skill' ? 'fa-wand-magic-sparkles' : l.product_type === 'chatbot' ? 'fa-robot' : 'fa-code'} text-xl`} aria-hidden="true"></i>
                        </div>
                      )}
                    </a>

                    <div class="flex-1 min-w-0 w-full">
                      <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div class="flex flex-wrap items-center gap-2">
                          {mcp ? (
                            <span class="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-[11px] font-bold">
                              Skill AI Agent
                            </span>
                          ) : (
                            <span class="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                              {PRODUCT_TYPE_LABEL[l.product_type]}
                            </span>
                          )}
                          <span class="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                            <i class="fas fa-circle-check mr-1" aria-hidden="true"></i>Đã kích hoạt
                          </span>
                          <span class="text-[11px] text-[#9492b8] font-mono">{l.version}</span>
                        </div>

                        {mcp && (
                          <button type="button" role="switch" aria-checked={isEnabled ? 'true' : 'false'}
                            data-license-id={l.id} data-slug={l.slug} data-enabled={isEnabled ? '1' : '0'}
                            title={isEnabled ? 'Bấm để tạm tắt Skill này khỏi AI' : 'Bấm để bật lại Skill này cho AI'}
                            class={`btn-toggle-mcp-skill inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold transition cursor-pointer ${isEnabled
                              ? 'is-on bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                              : 'bg-[#161436] border-[#2e2968] text-[#9492b8]'}`}>
                            <span class="skill-toggle-track"><span class="skill-toggle-thumb"></span></span>
                            <span class="skill-toggle-label">{isEnabled ? 'Đang bật cho AI' : 'Đang tắt'}</span>
                          </button>
                        )}
                      </div>

                      <h3 class="font-bold text-white leading-snug text-[15px]">
                        <a href={`/san-pham/${l.slug}`} class="hover:text-indigo-300 transition">{l.name}</a>
                      </h3>

                      <div class="text-xs text-[#9492b8] mt-1 flex flex-wrap gap-x-2 gap-y-0.5 tabular-nums">
                        <span>Mua ngày {formatDate(l.created_at)}</span>
                        {!mcp && (
                          <>
                            <span>· {l.download_count} lượt tải</span>
                            {l.file_size && l.file_size !== '—' && <span>· {l.file_size}</span>}
                          </>
                        )}
                      </div>

                      {l.latest_changelog && (
                        <div class="mt-2.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-[#d6d4ee]">
                          <div class="flex items-center justify-between gap-2 mb-0.5">
                            <span class="font-bold text-indigo-300"><i class="fas fa-sparkles mr-1" aria-hidden="true"></i>Cập nhật {l.latest_version || l.version}</span>
                            {l.latest_release_at && <span class="text-[11px] text-[#9492b8]">{formatDate(l.latest_release_at)}</span>}
                          </div>
                          <p class="whitespace-pre-line text-[#c2c0e0] leading-relaxed">{l.latest_changelog}</p>
                        </div>
                      )}

                      <div class="flex flex-wrap items-center gap-2 mt-3">
                        {mcp && guide && (
                          <button type="button"
                            data-slug={l.slug}
                            data-name={l.name}
                            data-short-name={guide.shortName}
                            data-input-label={guide.inputLabel}
                            data-placeholder={guide.inputPlaceholder}
                            data-prompt-template={guide.promptTemplate}
                            data-download-href={l.download_url ? `/tai-xuong/${l.id}` : ''}
                            class="btn-use-skill inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition cursor-pointer">
                            <i class="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>Dùng Skill này
                          </button>
                        )}

                        {l.download_url ? (
                          <a href={`/tai-xuong/${l.id}`} target="_blank" rel="noopener"
                            class={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-semibold text-xs sm:text-sm transition ${mcp
                              ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 hover:bg-emerald-600 hover:text-white'
                              : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:brightness-110 shadow-md shadow-indigo-500/20'}`}>
                            <i class={mcp ? 'fab fa-google-drive' : 'fas fa-download'} aria-hidden="true"></i>
                            {mcp ? 'Tải file Drive' : l.product_type === 'skill' ? 'Tải bộ Skill AI' : l.product_type === 'chatbot' ? 'Mở Chatbot' : 'Tải xuống'}
                          </a>
                        ) : (
                          <span class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                            <i class="fas fa-clock" aria-hidden="true"></i>Đang chuẩn bị link...
                          </span>
                        )}

                        {l.doc_url && (
                          <a href={l.doc_url} target="_blank" rel="noopener"
                            class="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#2e2968] text-[#c2c0e0] hover:border-indigo-400 hover:text-white font-semibold text-xs transition">
                            <i class="fas fa-book" aria-hidden="true"></i>Hướng dẫn
                          </a>
                        )}

                        <a href={`/san-pham/${l.slug}#reviews`}
                          class="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#2e2968] text-[#c2c0e0] hover:border-amber-400 hover:text-amber-300 font-semibold text-xs transition">
                          <i class="far fa-star" aria-hidden="true"></i>Đánh giá
                        </a>

                        <button type="button" data-copy={l.license_key} title={`Sao chép mã bản quyền: ${l.license_key}`}
                          class="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#262258] bg-[#141332] hover:border-indigo-400 hover:text-white text-[#9e9cc2] font-medium text-xs transition cursor-pointer">
                          <i class="far fa-copy text-[11px]" aria-hidden="true"></i>Chép mã
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 1-Click Quick Use Modal for Any Selected Skill */}
          {hasMcp && (
            <div id="use-skill-modal" role="dialog" aria-modal="true" aria-labelledby="use-skill-modal-title"
              class="fixed inset-0 z-[120] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div class="relative w-full max-w-xl bg-[#0f0e24] rounded-3xl border border-[#2f2a68] shadow-2xl p-5 sm:p-6 space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold mb-1.5">
                      <i class="fas fa-bolt text-[10px]" aria-hidden="true"></i>Dùng ngay với AI đã kết nối
                    </span>
                    <h3 id="use-skill-modal-title" class="text-lg font-extrabold text-white leading-snug">Dùng Skill</h3>
                  </div>
                  <button type="button" id="use-skill-close-btn" aria-label="Đóng cửa sổ"
                    class="w-9 h-9 shrink-0 rounded-full bg-[#161436] hover:bg-rose-500 text-[#c2c0e0] hover:text-white grid place-items-center transition cursor-pointer">
                    <i class="fas fa-xmark" aria-hidden="true"></i>
                  </button>
                </div>

                <div>
                  <label for="use-skill-user-input" id="use-skill-input-label" class="block text-xs font-bold text-[#d6d4ee] mb-1.5">
                    1. Nhập chủ đề hoặc đường dẫn video của bạn (tuỳ chọn):
                  </label>
                  <input id="use-skill-user-input" type="text"
                    placeholder="Ví dụ: Mô tả ngắn nội dung bạn muốn dựng..."
                    class="w-full h-11 px-3.5 rounded-xl bg-[#09081b] border border-[#2a2559] focus:border-indigo-400 text-sm text-white placeholder-[#7d7ba6] outline-none transition" />
                </div>

                <div>
                  <div class="text-xs font-bold text-[#d6d4ee] mb-1.5">
                    2. Chép câu nhắn dưới đây rồi dán thẳng vào Claude / ChatGPT / Antigravity:
                  </div>
                  <div class="p-3.5 rounded-2xl bg-[#09081b] border border-[#2a2559] space-y-3">
                    <p id="use-skill-prompt-preview" class="text-xs sm:text-sm text-[#e8e7fb] leading-relaxed select-all"></p>
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button type="button" id="use-skill-copy-btn"
                        class="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer">
                        <i class="far fa-copy" aria-hidden="true"></i><span>Chép câu nhắn</span>
                      </button>
                      <div class="flex flex-wrap items-center gap-1.5 text-xs">
                        <a href="https://claude.ai/new" target="_blank" rel="noopener"
                          class="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-[#161436] border border-[#2e2968] hover:border-indigo-400 text-[#d6d4ee] hover:text-white font-semibold transition">
                          Mở Claude <i class="fas fa-arrow-up-right-from-square text-[10px]" aria-hidden="true"></i>
                        </a>
                        <a href="https://chatgpt.com" target="_blank" rel="noopener"
                          class="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-[#161436] border border-[#2e2968] hover:border-emerald-400 text-[#d6d4ee] hover:text-white font-semibold transition">
                          Mở ChatGPT <i class="fas fa-arrow-up-right-from-square text-[10px]" aria-hidden="true"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-[#221e54] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button type="button" id="use-skill-select-only"
                    class="text-indigo-300 hover:text-indigo-200 font-semibold hover:underline transition cursor-pointer">
                    <i class="fas fa-plug mr-1" aria-hidden="true"></i>Hoặc chỉ kết nối riêng Skill này ở khung trên ↑
                  </button>
                  <a id="use-skill-drive-link" href="#" target="_blank" rel="noopener"
                    class="hidden inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-semibold hover:underline">
                    <i class="fab fa-google-drive" aria-hidden="true"></i>Tải bộ Skill (Google Drive)
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AccountShell>
  )
}

/* ---------- MCP OAuth 2.1 Consent Page (Claude / ChatGPT 1-click connect) ---------- */
export const OAuthConsentPage: FC<LayoutProps & {
  clientName?: string
  clientDomain?: string
  clientId?: string
  redirectUri?: string
  state?: string
  scope?: string
  codeChallenge?: string
  codeChallengeMethod?: string
  ownedSkills?: { name: string; slug: string }[]
  errorMsg?: string
  reloginUrl?: string
}> = (props) => {
  const skills = props.ownedSkills || []
  return (
    <Layout {...props} title="Cho phép kết nối AI" bodyClass="dark-portal bg-[#070614] text-slate-100">
      <div class="max-w-lg mx-auto px-4 py-12 sm:py-16">
        <div class="bg-[#0f0e24] rounded-3xl border border-[#2a2559] shadow-2xl shadow-indigo-950/40 p-6 sm:p-8">
          {props.errorMsg ? (
            <div class="text-center space-y-4">
              <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 grid place-items-center text-xl">
                <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
              </div>
              <h1 class="text-xl font-extrabold text-white">Không thể kết nối AI</h1>
              <p class="text-sm text-[#b8b6d9] leading-relaxed">{props.errorMsg}</p>
              <a href="/tai-khoan/san-pham"
                class="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition">
                Quay về Sản phẩm của tôi
              </a>
            </div>
          ) : (
            <div class="space-y-5">
              <div class="flex items-center justify-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-lg shadow-lg shadow-indigo-500/25">
                  <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
                </div>
                <i class="fas fa-arrows-left-right text-[#7d7ba6] text-sm" aria-hidden="true"></i>
                <div class="w-12 h-12 rounded-2xl bg-[#161436] border border-[#2e2968] text-cyan-300 grid place-items-center text-lg">
                  <i class="fas fa-robot" aria-hidden="true"></i>
                </div>
              </div>

              <div class="text-center">
                <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Cho phép {props.clientName || 'Ứng dụng AI'} kết nối?
                </h1>
                <p class="text-xs sm:text-sm text-[#a9a7ce] mt-1.5">
                  Ứng dụng này muốn dùng các Skill bạn đã mua trên <b class="text-white">KhoSkill AI</b>.
                </p>
              </div>

              {/* Verified Domain Pill */}
              <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <i class="fas fa-shield-halved text-emerald-400 mt-0.5 text-base shrink-0" aria-hidden="true"></i>
                <div class="text-xs leading-relaxed">
                  <div class="text-emerald-200 font-bold">
                    Tên miền xác thực: <span class="font-mono text-white">{props.clientDomain}</span>
                  </div>
                  <div class="text-emerald-200/80 mt-0.5">
                    Tên miền này được xác thực trực tiếp từ địa chỉ kết nối. Chỉ bấm Cho phép nếu bạn nhận ra ứng dụng này.
                  </div>
                </div>
              </div>

              {/* Signed-in Account */}
              <div class="p-3.5 rounded-2xl bg-[#09081b] border border-[#221e54] flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-sm shrink-0">
                    {(props.user?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-bold text-white truncate">{props.user?.full_name}</div>
                    <div class="text-xs text-[#9492b8] truncate">{props.user?.email}</div>
                  </div>
                </div>
                {props.reloginUrl && (
                  <a href={props.reloginUrl} data-no-pjax class="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200 hover:underline">
                    Đổi tài khoản
                  </a>
                )}
              </div>

              {/* Plain-language Permissions */}
              <div class="space-y-2 text-xs sm:text-sm text-[#d6d4ee]">
                <div class="flex items-start gap-2.5">
                  <i class="fas fa-circle-check text-emerald-400 mt-1 text-xs shrink-0" aria-hidden="true"></i>
                  <span>
                    Dùng toàn bộ <b class="text-white">Skill AI Agent</b> bạn đã mua ({skills.length} Skill hiện có) và tự nhận Skill mới khi bạn mua thêm.
                  </span>
                </div>
                <div class="flex items-start gap-2.5">
                  <i class="fas fa-lock text-indigo-400 mt-1 text-xs shrink-0" aria-hidden="true"></i>
                  <span>Không xem mật khẩu, không sửa hồ sơ và không thể thanh toán thay bạn. Bạn có thể bấm <b>Ngắt</b> bất cứ lúc nào.</span>
                </div>
              </div>

              {skills.length > 0 && (
                <div class="flex flex-wrap gap-1.5">
                  {skills.slice(0, 6).map(s => (
                    <span class="px-2.5 py-1 rounded-lg bg-[#161436] border border-[#2a2559] text-[11px] font-semibold text-cyan-200">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}

              <form method="post" action="/oauth/authorize" class="grid grid-cols-2 gap-3 pt-2">
                <input type="hidden" name="client_id" value={props.clientId || ''} />
                <input type="hidden" name="redirect_uri" value={props.redirectUri || ''} />
                <input type="hidden" name="state" value={props.state || ''} />
                <input type="hidden" name="scope" value={props.scope || 'mcp'} />
                <input type="hidden" name="code_challenge" value={props.codeChallenge || ''} />
                <input type="hidden" name="code_challenge_method" value={props.codeChallengeMethod || 'S256'} />

                <button type="submit" name="decision" value="deny"
                  class="h-11 rounded-xl border border-[#2e2968] bg-[#161436] hover:bg-[#1e1b46] text-[#d6d4ee] font-semibold text-sm transition cursor-pointer">
                  Huỷ
                </button>
                <button type="submit" name="decision" value="allow"
                  class="h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer">
                  Cho phép
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

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

/* ---------- Notifications ---------- */
export const NotificationsPage: FC<LayoutProps & { notifications: any[] }> = (props) => {
  const unreadCount = props.notifications.filter(n => !n.is_read).length
  return (
    <AccountShell {...props} activeKey="notifications" title="Thông báo" heading="Hộp thư thông báo"
      sub="Cập nhật phiên bản Skill AI mới, trạng thái đơn hàng và thông báo từ quản trị viên.">
      <div class="flex items-center justify-between mb-4">
        <div class="text-xs text-[#9492b8]">
          {unreadCount > 0 ? <>Bạn có <b class="text-indigo-300">{unreadCount}</b> thông báo chưa đọc</> : 'Tất cả thông báo đã được đọc'}
        </div>
        {unreadCount > 0 && (
          <form action="/api/account/notifications/read-all" method="post" data-ajax data-reload="true">
            <button type="submit" class="h-9 px-3.5 rounded-xl bg-[#161436] border border-[#2e2968] hover:border-indigo-400 text-xs font-semibold text-[#c2c0e0] hover:text-white transition cursor-pointer">
              <i class="fas fa-check-double mr-1.5 text-indigo-400" aria-hidden="true"></i>Đánh dấu tất cả đã đọc
            </button>
          </form>
        )}
      </div>

      {props.notifications.length === 0 ? (
        <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
          <EmptyState icon="fa-bell-slash" title="Chưa có thông báo nào"
            desc="Khi sản phẩm bạn mua có bản cập nhật mới hoặc đơn hàng hoàn tất, thông báo sẽ hiện tại đây." />
        </div>
      ) : (
        <div class="space-y-3">
          {props.notifications.map(n => {
            const icon = n.type === 'product_update' ? 'fa-rocket text-fuchsia-400'
              : n.type === 'order' ? 'fa-circle-check text-emerald-400'
              : n.type === 'admin' ? 'fa-bullhorn text-amber-400'
              : 'fa-bell text-indigo-400'
            return (
              <div class={`rounded-2xl border p-5 transition ${n.is_read ? 'bg-[#0f0e24] border-[#221e54]' : 'bg-[#151336] border-indigo-500/45 shadow-lg shadow-indigo-950/30'}`}>
                <div class="flex items-start gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-[#161436] border border-[#2a2559] grid place-items-center shrink-0 mt-0.5">
                    <i class={`fas ${icon}`} aria-hidden="true"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h2 class="font-bold text-white text-sm flex items-center gap-2">
                        {n.title}
                        {!n.is_read && <span class="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">Mới</span>}
                      </h2>
                      <span class="text-[11px] text-[#9492b8] tabular-nums">{formatDateTime(n.created_at)}</span>
                    </div>
                    <p class="text-sm text-[#c2c0e0] whitespace-pre-line leading-relaxed">{n.message}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      {n.link_url && (
                        <a href={`/tai-khoan/thong-bao/${n.id}/doc`} data-no-pjax
                          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition">
                          <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>Xem chi tiết
                        </a>
                      )}
                      {!n.is_read && !n.link_url && (
                        <a href={`/tai-khoan/thong-bao/${n.id}/doc`} data-no-pjax
                          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#2e2968] hover:border-indigo-400 text-[#c2c0e0] hover:text-white text-xs font-medium transition">
                          <i class="fas fa-check" aria-hidden="true"></i>Đánh dấu đã đọc
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AccountShell>
  )
}

/* ---------- Affiliate ---------- */
export const AffiliateDashboard: FC<LayoutProps & {
  affCode: string; earned: number; refCount: number; percent: number; referrals: any[]; siteUrl: string
  emailVerified: boolean; userEmail: string; googleEnabled?: boolean
}> = (props) => {
  const link = `${props.siteUrl}/dang-ky?ref=${props.affCode}`
  return (
    <AccountShell {...props} activeKey="affiliate" title="Affiliate" heading="Chương trình Affiliate" sub={`Giới thiệu bạn bè và nhận hoa hồng ${props.percent}% cho mỗi đơn hàng thành công.`}>
      {!props.emailVerified && (
        <div class="mb-6 p-5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-100">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 grid place-items-center text-amber-300 shrink-0">
              <i class="fas fa-shield-exclamation text-lg" aria-hidden="true"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="font-bold text-white text-base mb-1">Cần xác minh Email để bật Affiliate</h2>
              <p class="text-sm text-amber-100/90 leading-relaxed mb-3">
                Để bảo vệ hoa hồng và chống tài khoản ảo, bạn cần xác minh email <b class="text-white">{props.userEmail}</b> trước khi kích hoạt link giới thiệu và nhận hoa hồng {props.percent}%.
              </p>
              <div class="flex flex-wrap items-center gap-2.5">
                <form action="/api/account/send-verify-email" method="post" data-ajax class="inline-flex items-center">
                  <button type="submit" class="h-10 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer">
                    <i class="fas fa-paper-plane mr-1.5" aria-hidden="true"></i>Gửi link xác minh tới Email
                  </button>
                </form>
                <a href="/tai-khoan/ho-so" class="h-10 px-4 inline-flex items-center rounded-xl bg-[#161436] border border-[#2e2968] hover:border-indigo-400 text-white text-xs font-semibold transition">
                  Mở Hồ sơ cá nhân
                </a>
                {props.googleEnabled && (
                  <a href="/api/auth/google?next=/tai-khoan/affiliate" data-no-pjax
                    class="cta-white h-10 px-4 inline-flex items-center rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold transition">
                    Xác minh nhanh bằng Google
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      <div class={`bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-6 text-white mb-6 shadow-xl shadow-indigo-950/50 ${props.emailVerified ? '' : 'opacity-65'}`}>
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <h2 class="font-bold text-lg">Link giới thiệu của bạn</h2>
          {!props.emailVerified && <span class="px-2.5 py-0.5 rounded-full bg-black/30 text-amber-200 text-xs font-bold"><i class="fas fa-lock mr-1" aria-hidden="true"></i>Chờ xác minh Email</span>}
        </div>
        <p class="text-sm text-white/85 mb-4">Chia sẻ link này, mỗi khi có người đăng ký và mua hàng bạn nhận {props.percent}% hoa hồng.</p>
        {props.emailVerified ? (
          <>
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
          </>
        ) : (
          <div class="p-3.5 rounded-xl bg-black/25 border border-white/15 text-sm text-white/90">
            <i class="fas fa-lock mr-2 text-amber-300" aria-hidden="true"></i>Link giới thiệu và mã Affiliate sẽ tự động mở khoá ngay sau khi bạn hoàn tất xác minh Email.
          </div>
        )}
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
export const ProfilePage: FC<LayoutProps & { profile: any; googleEnabled?: boolean; verifiedBanner?: boolean }> = (props) => {
  const isVerified = props.profile.email_verified === 1
  const isOAuthOnly = String(props.profile.password_hash || '').startsWith('OAUTH$')
  return (
    <AccountShell {...props} activeKey="profile" title="Hồ sơ" heading="Hồ sơ cá nhân" sub="Cập nhật thông tin, xác minh email và mật khẩu tài khoản.">
      {props.verifiedBanner && (
        <div class="mb-5 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-sm text-emerald-200 flex items-center gap-3">
          <i class="fas fa-circle-check text-emerald-400 text-lg shrink-0" aria-hidden="true"></i>
          <span>Email của bạn đã được xác minh thành công! Tính năng Affiliate và thông báo qua email đã sẵn sàng.</span>
        </div>
      )}

      {/* Email Verification & Google Link Card */}
      <div class={`mb-5 rounded-2xl border p-5 ${isVerified ? 'bg-[#0f0e24] border-emerald-500/35' : 'bg-amber-500/10 border-amber-500/35'}`}>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${isVerified ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/35'}`}>
              <i class={`fas ${isVerified ? 'fa-shield-check' : 'fa-envelope-circle-check'} text-lg`} aria-hidden="true"></i>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <h2 class="font-bold text-white text-base">Xác minh Email / Gmail</h2>
                {isVerified ? (
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold">
                    <i class="fas fa-check mr-1" aria-hidden="true"></i>Đã xác minh
                  </span>
                ) : (
                  <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold">
                    <i class="fas fa-clock mr-1" aria-hidden="true"></i>Chưa xác minh
                  </span>
                )}
                {props.profile.google_id && (
                  <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-semibold">
                    Đã liên kết Google
                  </span>
                )}
              </div>
              <p class="text-xs text-[#c2c0e0] leading-relaxed">
                {isVerified
                  ? `Email ${props.profile.email} đã được xác minh${props.profile.email_verified_at ? ' lúc ' + formatDateTime(props.profile.email_verified_at) : ''}. Bạn nhận đủ thông báo cập nhật Skill AI và quyền Affiliate.`
                  : 'Bạn vẫn mua hàng bình thường mà không cần OTP. Bấm nút bên cạnh để xác minh Gmail khi muốn bật Affiliate, nhận bản cập nhật Skill mới qua email và khôi phục mật khẩu tự động.'}
              </p>
            </div>
          </div>

          {!isVerified && (
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <form action="/api/account/send-verify-email" method="post" data-ajax>
                <button type="submit" class="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition cursor-pointer whitespace-nowrap">
                  <i class="fas fa-paper-plane mr-1.5" aria-hidden="true"></i>Gửi link xác minh
                </button>
              </form>
              {props.googleEnabled && (
                <a href="/api/auth/google?next=/tai-khoan/ho-so" data-no-pjax
                  class="cta-white h-10 px-4 inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition whitespace-nowrap">
                  <i class="fab fa-google" aria-hidden="true"></i>Xác minh với Google
                </a>
              )}
            </div>
          )}
        </div>
      </div>

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
            <button type="submit" class="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer">Lưu thay đổi</button>
          </div>
        </form>

        <form action="/api/account/password" method="post" data-ajax class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 self-start">
          <h2 class="font-bold text-white mb-2 text-base"><i class="fas fa-key mr-2 text-indigo-400" aria-hidden="true"></i>{isOAuthOnly ? 'Đặt mật khẩu đăng nhập' : 'Đổi mật khẩu'}</h2>
          {isOAuthOnly && (
            <p class="text-xs text-[#9492b8] mb-4">Tài khoản tạo qua Google chưa có mật khẩu riêng. Đặt mật khẩu nếu bạn muốn đăng nhập thêm bằng Email.</p>
          )}
          <div class="space-y-4 mt-4">
            {!isOAuthOnly && (
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
            )}
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
            <button type="submit" class="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer">{isOAuthOnly ? 'Đặt mật khẩu' : 'Đổi mật khẩu'}</button>
          </div>
        </form>
      </div>
    </AccountShell>
  )
}
