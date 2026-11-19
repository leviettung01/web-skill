import type { FC, PropsWithChildren } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { EmptyState, StatusBadge, Stars } from '../components/ui'
import { formatVND, formatDate, formatDateTime, gradientFor, PRODUCT_TYPE_LABEL, isMcpSkill, parseMcpClients } from '../lib/utils'
import { buildMcpConfigs } from '../lib/mcp'

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

/* ---------- My Products (source code & MCP Agent Skill delivery) ---------- */
export const MyProductsPage: FC<LayoutProps & { licenses: any[]; origin?: string }> = (props) => {
  const origin = props.origin || 'https://khoskill.site'
  return (
    <AccountShell {...props} activeKey="products" title="Sản phẩm của tôi" heading="Sản phẩm của tôi"
      sub="Truy cập link tải Skill tự tải, hoặc lấy MCP Endpoint + License Key + cấu hình copy sẵn cho Claude, Codex, Antigravity.">
      {props.licenses.length === 0 ? (
        <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
          <EmptyState icon="fa-box-archive" title="Bạn chưa sở hữu sản phẩm nào"
            desc="Sau khi thanh toán thành công, link tải Skill hoặc cấu hình kết nối MCP cho AI Agent sẽ xuất hiện tại đây."
            action={{ href: '/san-pham', label: 'Khám phá sản phẩm' }} />
        </div>
      ) : (
        <div class="space-y-4">
          {props.licenses.map(l => {
            const mcp = isMcpSkill(l.product_type)
            const mcpCfg = mcp ? buildMcpConfigs({
              origin,
              slug: l.slug,
              productName: l.name,
              licenseKey: l.license_key,
              mcpEndpoint: l.mcp_endpoint,
              mcpServerName: l.mcp_server_name
            }) : null
            const mcpClients = mcp ? parseMcpClients(l.mcp_clients) : []
            const tabGroup = `mcp-${l.id}`
            return (
              <div class={`bg-[#0f0e24] rounded-2xl border overflow-hidden ${mcp ? 'border-cyan-500/40 shadow-lg shadow-cyan-950/20' : 'border-[#221e54]'}`}>
                <div class="p-5 flex flex-col sm:flex-row gap-4">
                  <div class="sm:w-40 aspect-video rounded-xl shrink-0 grid place-items-center text-white overflow-hidden"
                    style={l.thumbnail ? '' : `background:${gradientFor(l.product_id)}`}>
                    {l.thumbnail ? <img src={l.thumbnail} alt={l.name} class="w-full h-full object-cover rounded-xl" loading="lazy" />
                      : <i class={`fas ${mcp ? 'fa-plug-circle-bolt' : l.product_type === 'skill' ? 'fa-wand-magic-sparkles' : l.product_type === 'chatbot' ? 'fa-robot' : 'fa-code'} text-2xl`} aria-hidden="true"></i>}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1.5">
                      {mcp ? (
                        <span class="px-2.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold inline-flex items-center gap-1">
                          <i class="fas fa-plug-circle-bolt text-[10px]" aria-hidden="true"></i>{PRODUCT_TYPE_LABEL[l.product_type]}
                        </span>
                      ) : (
                        <span class="px-2.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">{PRODUCT_TYPE_LABEL[l.product_type]}</span>
                      )}
                      <span class="px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                        <i class="fas fa-circle-check mr-1" aria-hidden="true"></i>Đã kích hoạt
                      </span>
                      <span class="text-[11px] text-[#9492b8] font-mono">{l.version}</span>
                    </div>
                    <h2 class="font-bold text-white leading-snug mb-2 text-base">
                      <a href={`/san-pham/${l.slug}`} class={`transition ${mcp ? 'hover:text-cyan-300' : 'hover:text-indigo-300'}`}>{l.name}</a>
                    </h2>
                    <div class="text-xs text-[#9492b8] mb-3 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                      <span><i class="far fa-calendar mr-1" aria-hidden="true"></i>Mua ngày {formatDate(l.created_at)}</span>
                      {mcp ? (
                        <>
                          <span class="text-cyan-300"><i class="fas fa-bolt mr-1" aria-hidden="true"></i>{l.mcp_call_count || 0} lượt Agent gọi MCP</span>
                          {l.last_mcp_call_at && <span><i class="far fa-clock mr-1" aria-hidden="true"></i>Gần nhất: {formatDateTime(l.last_mcp_call_at)}</span>}
                        </>
                      ) : (
                        <>
                          <span><i class="fas fa-download mr-1" aria-hidden="true"></i>{l.download_count} lượt tải</span>
                          {l.file_size && l.file_size !== '—' && <span><i class="fas fa-hard-drive mr-1" aria-hidden="true"></i>{l.file_size}</span>}
                        </>
                      )}
                    </div>

                    <div class="p-3 rounded-xl bg-[#161436] border border-[#221e54] mb-3">
                      <div class="text-[11px] text-[#9492b8] mb-1 font-semibold uppercase tracking-wide">
                        {mcp ? 'License Key (MCP Bearer Token)' : 'License Key'}
                      </div>
                      <div class="flex items-center gap-2">
                        <code class={`flex-1 font-mono text-sm font-bold tracking-wider truncate ${mcp ? 'text-cyan-300' : 'text-indigo-300'}`}>{l.license_key}</code>
                        <button type="button" data-copy={l.license_key} aria-label="Sao chép license key"
                          class="shrink-0 w-9 h-9 rounded-lg bg-[#0f0e24] border border-[#2e2968] hover:border-indigo-400 hover:text-indigo-300 text-[#b8b6d9] text-xs transition grid place-items-center">
                          <i class="far fa-copy" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>

                    {mcp && mcpCfg && (
                      <div class="rounded-2xl bg-[#09081b] border border-cyan-500/35 p-4 mb-4 space-y-3.5">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <div class="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                            <i class="fas fa-plug-circle-bolt" aria-hidden="true"></i>Cấu hình kết nối MCP cho AI Agent
                          </div>
                          <div class="flex flex-wrap gap-1">
                            {mcpClients.map(cl => (
                              <span class="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[10px] font-bold">{cl}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div class="text-[11px] text-[#9492b8] font-semibold mb-1">MCP Server Endpoint (Streamable HTTP)</div>
                          <div class="flex items-center gap-2">
                            <input type="text" readonly value={mcpCfg.endpointUrl}
                              class="flex-1 h-9 px-3 rounded-lg bg-[#0f0e24] border border-[#242054] text-cyan-200 font-mono text-xs outline-none" />
                            <button type="button" data-copy={mcpCfg.endpointUrl} aria-label="Sao chép MCP Endpoint"
                              class="shrink-0 h-9 px-3 rounded-lg bg-[#161436] border border-[#2e2968] hover:border-cyan-400 text-[#c2c0e0] hover:text-white text-xs font-semibold transition">
                              <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy URL
                            </button>
                          </div>
                        </div>

                        {/* Client Config Tabs: Claude / Codex / Antigravity */}
                        <div>
                          <div role="tablist" aria-label="Chọn AI Agent để lấy cấu hình MCP" class="flex flex-wrap gap-1.5 mb-2.5">
                            <button type="button" role="tab" aria-selected="true" data-tab="claude" data-group={tabGroup}
                              class="tab-btn active h-8 px-3 rounded-lg border border-[#2a2559] bg-[#141332] text-xs font-bold text-[#c2c0e0] cursor-pointer">
                              Claude Code / Desktop
                            </button>
                            <button type="button" role="tab" aria-selected="false" data-tab="codex" data-group={tabGroup}
                              class="tab-btn h-8 px-3 rounded-lg border border-[#2a2559] bg-[#141332] text-xs font-bold text-[#c2c0e0] cursor-pointer">
                              OpenAI Codex
                            </button>
                            <button type="button" role="tab" aria-selected="false" data-tab="antigravity" data-group={tabGroup}
                              class="tab-btn h-8 px-3 rounded-lg border border-[#2a2559] bg-[#141332] text-xs font-bold text-[#c2c0e0] cursor-pointer">
                              Antigravity
                            </button>
                          </div>

                          <div role="tabpanel" data-tab="claude" data-group={tabGroup} class="tab-panel space-y-2.5">
                            <div class="rounded-xl bg-[#070614] border border-[#221e54] p-3">
                              <div class="flex items-center justify-between gap-2 mb-1.5">
                                <span class="text-[11px] font-semibold text-orange-300">Cách 1 — Chạy 1 dòng lệnh trong Claude Code CLI:</span>
                                <button type="button" data-copy-target={`mcp-claude-cli-${l.id}`}
                                  class="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-indigo-600 text-white font-semibold transition cursor-pointer">
                                  <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy lệnh
                                </button>
                              </div>
                              <pre id={`mcp-claude-cli-${l.id}`} class="text-[11px] font-mono text-cyan-200 overflow-x-auto whitespace-pre-wrap break-all">{mcpCfg.claudeCli}</pre>
                            </div>
                            <div class="rounded-xl bg-[#070614] border border-[#221e54] p-3">
                              <div class="flex items-center justify-between gap-2 mb-1.5">
                                <span class="text-[11px] font-semibold text-[#b8b6d9]">Cách 2 — Dán vào <code class="text-white">.mcp.json</code> hoặc Claude Desktop config:</span>
                                <button type="button" data-copy-target={`mcp-claude-json-${l.id}`}
                                  class="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-indigo-600 text-white font-semibold transition cursor-pointer">
                                  <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy JSON
                                </button>
                              </div>
                              <pre id={`mcp-claude-json-${l.id}`} class="text-[11px] font-mono text-[#d6d4ee] overflow-x-auto whitespace-pre">{mcpCfg.claudeJson}</pre>
                            </div>
                          </div>

                          <div role="tabpanel" data-tab="codex" data-group={tabGroup} class="tab-panel hidden space-y-2.5">
                            <div class="rounded-xl bg-[#070614] border border-[#221e54] p-3">
                              <div class="flex items-center justify-between gap-2 mb-1.5">
                                <span class="text-[11px] font-semibold text-emerald-300">Dán vào <code class="text-white">~/.codex/config.toml</code> (OpenAI Codex):</span>
                                <button type="button" data-copy-target={`mcp-codex-toml-${l.id}`}
                                  class="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer">
                                  <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy TOML
                                </button>
                              </div>
                              <pre id={`mcp-codex-toml-${l.id}`} class="text-[11px] font-mono text-emerald-200 overflow-x-auto whitespace-pre-wrap break-all">{mcpCfg.codexToml}</pre>
                            </div>
                          </div>

                          <div role="tabpanel" data-tab="antigravity" data-group={tabGroup} class="tab-panel hidden space-y-2.5">
                            <div class="rounded-xl bg-[#070614] border border-[#221e54] p-3">
                              <div class="flex items-center justify-between gap-2 mb-1.5">
                                <span class="text-[11px] font-semibold text-violet-300">Dán vào <code class="text-white">mcp_config.json</code> trong Antigravity:</span>
                                <button type="button" data-copy-target={`mcp-agy-json-${l.id}`}
                                  class="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-violet-600 text-white font-semibold transition cursor-pointer">
                                  <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy JSON
                                </button>
                              </div>
                              <pre id={`mcp-agy-json-${l.id}`} class="text-[11px] font-mono text-violet-200 overflow-x-auto whitespace-pre">{mcpCfg.antigravityJson}</pre>
                            </div>
                          </div>
                        </div>

                        <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-100 leading-relaxed">
                          <b class="text-emerald-300"><i class="fas fa-circle-info mr-1" aria-hidden="true"></i>Cách dùng chuẩn 2 bước:</b>{' '}
                          (1) Bấm <b>Tải bộ Skill Kit (Google Drive)</b> bên dưới, giải nén vào thư mục skills của AI Agent (<code class="text-white">.claude/skills/</code>, <code class="text-white">.codex/skills/</code> hoặc <code class="text-white">.agents/skills/</code>) để có đủ template, scripts, SFX, fonts &amp; demo gốc; (2) Dán cấu hình <b>MCP</b> bên trên để AI Agent tự nạp <code class="text-white">SKILL.md</code> mới nhất và dựng video tự động!
                        </div>

                        {/* Sample Agent Prompt */}
                        <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center gap-2.5 justify-between">
                          <div class="text-xs text-cyan-100 leading-relaxed min-w-0">
                            <b class="text-cyan-300">Prompt thử nhanh trong AI Agent:</b>{' '}
                            <span id={`mcp-sample-prompt-${l.id}`} class="text-white/95">{mcpCfg.samplePrompt}</span>
                          </div>
                          <button type="button" data-copy-target={`mcp-sample-prompt-${l.id}`}
                            class="shrink-0 h-8 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition cursor-pointer">
                            <i class="far fa-copy mr-1" aria-hidden="true"></i>Copy prompt
                          </button>
                        </div>

                        <div id={`mcp-test-result-${l.id}`} class="hidden rounded-xl p-3 text-xs"></div>
                      </div>
                    )}

                    {l.latest_changelog && (
                      <div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 mb-3 text-xs text-[#d6d4ee]">
                        <div class="flex items-center justify-between gap-2 mb-1">
                          <span class="font-bold text-indigo-300"><i class="fas fa-sparkles mr-1" aria-hidden="true"></i>Cập nhật {l.latest_version || l.version}</span>
                          {l.latest_release_at && <span class="text-[11px] text-[#9492b8]">{formatDate(l.latest_release_at)}</span>}
                        </div>
                        <p class="whitespace-pre-line text-[#c2c0e0] leading-relaxed">{l.latest_changelog}</p>
                      </div>
                    )}

                    <div class="flex flex-wrap gap-2">
                      {mcp ? (
                        <>
                          {l.download_url && (
                            <a href={`/tai-xuong/${l.id}`} target="_blank" rel="noopener"
                              class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:opacity-95 shadow-lg shadow-emerald-500/20 transition">
                              <i class="fab fa-google-drive" aria-hidden="true"></i>Tải bộ Skill Kit (Google Drive)
                            </a>
                          )}
                          <button type="button" data-license-id={l.id}
                            class="btn-test-mcp inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-95 shadow-lg shadow-cyan-500/20 transition cursor-pointer">
                            <i class="fas fa-plug-circle-check" aria-hidden="true"></i>Kiểm tra kết nối MCP
                          </button>
                        </>
                      ) : l.download_url ? (
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
            )
          })}
        </div>
      )}
    </AccountShell>
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
