import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { Breadcrumb, PostCard, Pagination, SectionTitle, EmptyState } from '../components/ui'
import { formatVND, formatUSD, getUsdRate, SKILL_TIERS, SKILL_TIER_ORDER, formatDate } from '../lib/utils'
import { formatDurationLabel, calcAvgCostPerSkill, type MembershipPlan, type UserMembership } from '../lib/tiers'

/* ---------------- BLOG LIST ---------------- */
export const BlogListPage: FC<LayoutProps & { posts: any[]; page: number; totalPages: number; q: string }> = (props) => (
  <Layout {...props} active="blog" title="Blog" description="Kiến thức, hướng dẫn và case study về làm video AI">
    <div class="bg-[#0f0e24] border-b border-[#221e54]">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Blog' }]} />
        <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Kiến thức làm video AI</h1>
        <p class="text-[#b8b6d9] mt-2 max-w-2xl">Hướng dẫn chi tiết, mẹo hay và case study thực tế từ cộng đồng làm video AI.</p>
        <form action="/blog" method="get" class="mt-5 max-w-md" role="search">
          <label for="blog-search" class="sr-only">Tìm bài viết</label>
          <div class="relative">
            <input id="blog-search" type="search" name="q" value={props.q} placeholder="Tìm bài viết..."
              class="w-full h-11 pl-10 pr-3 rounded-xl bg-[#161436] text-white placeholder-[#9492b8] border border-[#221e54] focus:border-indigo-500 outline-none text-sm transition" />
            <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
          </div>
        </form>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4 py-8">
      {props.posts.length === 0
        ? <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]"><EmptyState icon="fa-newspaper" title="Không tìm thấy bài viết" action={{ href: '/blog', label: 'Xem tất cả' }} /></div>
        : (
          <>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {props.posts.map(p => <PostCard p={p} />)}
            </div>
            <Pagination page={props.page} totalPages={props.totalPages} baseUrl={'/blog' + (props.q ? '?q=' + encodeURIComponent(props.q) : '')} />
          </>
        )}
    </div>
  </Layout>
)

/* ---------------- BLOG DETAIL ---------------- */
export const BlogDetailPage: FC<LayoutProps & { post: any; related: any[] }> = (props) => {
  const { post } = props
  return (
    <Layout {...props} active="blog" title={post.title} description={post.excerpt}>
      <article class="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: post.title }]} />
        <h1 class="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">{post.title}</h1>
        <div class="flex flex-wrap items-center gap-4 text-sm text-[#9492b8] pb-6 mb-7 border-b border-[#221e54] tabular-nums">
          <span><i class="far fa-calendar mr-1.5" aria-hidden="true"></i>{formatDate(post.created_at)}</span>
          <span><i class="far fa-eye mr-1.5" aria-hidden="true"></i>{post.view_count} lượt xem</span>
          {post.tags && (
            <div class="flex flex-wrap gap-1.5">
              {post.tags.split(',').map((t: string) => (
                <span class="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">#{t.trim()}</span>
              ))}
            </div>
          )}
        </div>
        {post.excerpt && <p class="text-lg text-[#c2c0e0] leading-relaxed mb-7 font-medium">{post.excerpt}</p>}
        <div class="prose-vn max-w-none bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-9" dangerouslySetInnerHTML={{ __html: post.content || '' }}></div>

        <div class="mt-10 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white text-center shadow-xl shadow-indigo-950/50">
          <h2 class="text-xl font-extrabold mb-2">Bắt đầu làm video AI ngay hôm nay</h2>
          <p class="text-white/85 text-sm mb-5">Khám phá kho Skill AI tự tải và dòng mới Skill AI Agent (MCP) kết nối trực tiếp Claude, Codex, Antigravity.</p>
          <div class="flex flex-wrap justify-center gap-2.5">
            <a href="/san-pham?type=skill" class="cta-white inline-flex h-11 px-5 items-center gap-2 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-slate-100 transition">
              <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Xem Skill tự tải
            </a>
            <a href="/san-pham?type=mcp_skill" class="inline-flex h-11 px-5 items-center gap-2 rounded-xl bg-black/25 border border-white/30 text-white font-bold text-sm hover:bg-black/35 transition">
              <i class="fas fa-plug-circle-bolt text-cyan-300" aria-hidden="true"></i>Xem Skill AI Agent (MCP)
            </a>
          </div>
        </div>

        {props.related.length > 0 && (
          <section class="mt-12">
            <SectionTitle title="Bài viết liên quan" />
            <div class="grid sm:grid-cols-3 gap-5">{props.related.map(p => <PostCard p={p} />)}</div>
          </section>
        )}
      </article>
    </Layout>
  )
}

/* ---------------- PRICING & VIP MEMBERSHIP PLANS ---------------- */
function planHeaderStyle(theme: string) {
  switch (theme) {
    case 'orange':
      return {
        header: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white',
        border: 'border-amber-400/70 ring-2 ring-amber-400/25 shadow-2xl shadow-amber-500/15',
        btn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25',
        icon: 'fa-star'
      }
    case 'obsidian':
      return {
        header: 'bg-gradient-to-r from-[#070b1a] via-[#131b35] to-[#1e1b4b] text-white border-b border-amber-400/30',
        border: 'border-amber-300/45 shadow-2xl shadow-indigo-950/50',
        btn: 'bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#312e81] hover:opacity-95 text-amber-200 border border-amber-400/45 shadow-lg',
        icon: 'fa-gem'
      }
    case 'violet':
      return {
        header: 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white',
        border: 'border-violet-400/45 shadow-xl shadow-violet-950/30',
        btn: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-violet-600/25',
        icon: 'fa-rocket'
      }
    case 'blue':
      return {
        header: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white',
        border: 'border-blue-500/35',
        btn: 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-md shadow-blue-600/20',
        icon: 'fa-seedling'
      }
    case 'emerald':
      return {
        header: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white',
        border: 'border-emerald-500/35',
        btn: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-600/20',
        icon: 'fa-chart-simple'
      }
    case 'purple':
    default:
      return {
        header: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white',
        border: 'border-purple-500/35',
        btn: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-md shadow-purple-600/20',
        icon: 'fa-diamond'
      }
  }
}

const QuotaCell: FC<{ quota: number; tierLabel: string; isOptionalPick?: boolean }> = ({ quota, tierLabel, isOptionalPick }) => {
  if (quota < 0) {
    return (
      <div class="text-right">
        <div class="font-extrabold text-cyan-300 text-sm leading-tight">Full {tierLabel}</div>
        <div class="text-[11px] text-emerald-400 font-semibold mt-0.5">Update liên tục</div>
      </div>
    )
  }
  if (quota === 0) {
    return <span class="font-bold text-rose-400 text-sm">Không</span>
  }
  return (
    <div class="text-right">
      <div class="font-extrabold text-sky-300 text-sm leading-tight tabular-nums">{quota} Skill</div>
      <div class="text-[11px] text-[#9492b8] mt-0.5">{isOptionalPick ? 'Tuỳ chọn' : 'Chọn theo ý muốn'}</div>
    </div>
  )
}

const MembershipCard: FC<{
  plan: MembershipPlan
  usdRate: number
  isCurrent?: boolean
}> = ({ plan, usdRate, isCurrent }) => {
  const st = planHeaderStyle(plan.theme_color)
  const hasFull = plan.vip1_quota < 0 || plan.vip2_quota < 0
  return (
    <div class={`rounded-2xl bg-[#0f0e24] border flex flex-col relative transition hover:-translate-y-1 duration-200 ${st.border}`}>
      {plan.badge && (
        <div class={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-lg ${plan.is_popular ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'}`}>
          {plan.badge}
        </div>
      )}

      {/* Colored Header Strip (matching reference layout) */}
      <div class={`${st.header} rounded-t-2xl px-5 pt-6 pb-5 flex items-start justify-between gap-3`}>
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-9 h-9 rounded-xl bg-white/15 backdrop-blur grid place-items-center text-sm shrink-0">
            <i class={`fas ${st.icon}`} aria-hidden="true"></i>
          </span>
          <div class="min-w-0">
            <h3 class="text-base sm:text-lg font-black tracking-tight uppercase leading-tight truncate">{plan.name}</h3>
            {isCurrent && (
              <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                <i class="fas fa-circle-check text-emerald-300" aria-hidden="true"></i>Gói đang dùng
              </span>
            )}
          </div>
        </div>
        <div class="text-right shrink-0 tabular-nums">
          <div class="text-xl sm:text-2xl font-black leading-none">{formatVND(plan.price_vnd)}</div>
          <div class="text-xs font-bold text-white/90 mt-1">{formatUSD(plan.price_vnd, usdRate)} USD · {formatDurationLabel(plan.duration_days)}</div>
        </div>
      </div>

      {/* Structured Quota Rows */}
      <div class="p-5 flex-1 flex flex-col">
        <div class="divide-y divide-[#221e54] text-sm">
          {/* VIP I */}
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 grid place-items-center text-xs shrink-0">
                <i class="fas fa-book-open" aria-hidden="true"></i>
              </span>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs sm:text-sm">Skill VIP I</div>
                <div class="text-[11px] text-[#9492b8]">Lẻ ~135K ({formatUSD(135000, usdRate)})</div>
              </div>
            </div>
            <QuotaCell quota={plan.vip1_quota} tierLabel="VIP I" />
          </div>

          {/* VIP II */}
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 grid place-items-center text-xs shrink-0">
                <i class="fas fa-layer-group" aria-hidden="true"></i>
              </span>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs sm:text-sm">Skill VIP II</div>
                <div class="text-[11px] text-[#9492b8]">Lẻ ~270K ({formatUSD(270000, usdRate)})</div>
              </div>
            </div>
            <QuotaCell quota={plan.vip2_quota} tierLabel="VIP II" />
          </div>

          {/* VIP III */}
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 grid place-items-center text-xs shrink-0">
                <i class="fas fa-crown" aria-hidden="true"></i>
              </span>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs sm:text-sm">Skill VIP III</div>
                <div class="text-[11px] text-[#9492b8]">Lẻ 399K – 599K</div>
              </div>
            </div>
            <QuotaCell quota={plan.vip3_quota} tierLabel="VIP III" isOptionalPick />
          </div>

          {/* VIP IV */}
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 grid place-items-center text-xs shrink-0">
                <i class="fas fa-gem" aria-hidden="true"></i>
              </span>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs sm:text-sm">Skill VIP IV</div>
                <div class="text-[11px] text-[#9492b8]">Lẻ 999K ({formatUSD(999000, usdRate)})</div>
              </div>
            </div>
            <QuotaCell quota={plan.vip4_quota} tierLabel="VIP IV" isOptionalPick />
          </div>

          {/* Daily Download Cap (50 skills/day) */}
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 text-xs sm:text-sm text-[#c2c0e0]">
              <span class="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-300 grid place-items-center text-xs shrink-0">
                <i class="fas fa-gauge-high" aria-hidden="true"></i>
              </span>
              <span>Giới hạn tải / ngày</span>
            </div>
            <span class="font-extrabold text-cyan-300 text-xs sm:text-sm tabular-nums whitespace-nowrap">
              {plan.daily_download_limit || 50} Skill / ngày
            </span>
          </div>

          {/* Retail Discount Perk (e.g., BLACK DIAMOND -40% off individual skills!) */}
          {Number(plan.retail_discount_percent || 0) > 0 && (
            <div class="py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 text-xs sm:text-sm text-amber-200 font-semibold">
                <span class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 grid place-items-center text-xs shrink-0">
                  <i class="fas fa-percent" aria-hidden="true"></i>
                </span>
                <span>Ưu đãi mua Skill lẻ</span>
              </div>
              <div class="text-right">
                <div class="font-black text-amber-300 text-sm">Giảm {plan.retail_discount_percent}%</div>
                <div class="text-[11px] text-emerald-400 font-semibold">Áp dụng cả SKILL PRO</div>
              </div>
            </div>
          )}

          {/* Estimated Value */}
          {plan.est_value_vnd > 0 && (
            <div class="py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 text-xs sm:text-sm text-[#c2c0e0]">
                <span class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-300 grid place-items-center text-xs shrink-0">
                  <i class="fas fa-coins" aria-hidden="true"></i>
                </span>
                <span>Giá trị nhận được</span>
              </div>
              <div class="text-right tabular-nums">
                <div class="font-extrabold text-emerald-400 text-sm">
                  {formatVND(plan.est_value_vnd)}{hasFull ? '+' : ''}
                </div>
                <div class="text-[11px] text-[#9492b8]">{formatUSD(plan.est_value_vnd, usdRate)}{hasFull ? '+' : ''}</div>
              </div>
            </div>
          )}

          {/* Average Cost */}
          <div class="py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 text-xs sm:text-sm text-[#c2c0e0]">
              <span class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-300 grid place-items-center text-xs shrink-0">
                <i class="fas fa-chart-line" aria-hidden="true"></i>
              </span>
              <span>Chi phí trung bình</span>
            </div>
            <span class="font-extrabold text-sky-300 text-sm tabular-nums">{calcAvgCostPerSkill(plan)}</span>
          </div>

          {/* Ideal For */}
          {plan.ideal_for && (
            <div class="py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 text-xs sm:text-sm text-[#c2c0e0] shrink-0">
                <span class="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-300 grid place-items-center text-xs shrink-0">
                  <i class="fas fa-lightbulb" aria-hidden="true"></i>
                </span>
                <span>Phù hợp cho</span>
              </div>
              <span class="text-xs font-semibold text-white text-right">{plan.ideal_for}</span>
            </div>
          )}
        </div>

        <a href={`/hoi-vien/thanh-toan/${plan.slug}`}
          class={`mt-5 flex items-center justify-center gap-2 w-full h-12 rounded-xl font-extrabold text-sm transition ${st.btn}`}>
          <span>{isCurrent ? `Gia hạn / Mua lại ${plan.name}` : `Đăng ký ${plan.name}`}</span>
          <i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  )
}

export const PricingPage: FC<LayoutProps & {
  plans?: MembershipPlan[]
  activeMembership?: UserMembership | null
  tierCounts?: Record<string, number>
}> = (props) => {
  const usdRate = getUsdRate(props.settings)
  const plans = props.plans || []
  const premiumPlans = plans.filter(p => p.group_type === 'premium')
  const starterPlans = plans.filter(p => p.group_type !== 'premium')
  const activeMem = props.activeMembership || null
  const tierCounts = props.tierCounts || {}

  return (
    <Layout {...props} active="pricing" title="Bảng giá Hội viên VIP & Phân hạng Skill"
      description="Phân cấp Skill VIP I – VIP IV, SKILL PRO bán lẻ và 6 gói Hội viên (Basic, Standard, Silver, Premium, Gold, Black Diamond) niêm yết song song VNĐ & USD.">
      {/* Top Hero */}
      <div class="bg-[#070614] text-white relative overflow-hidden border-b border-[#221e54]">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="relative max-w-7xl mx-auto px-4 pt-12 pb-10 text-center">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-200 text-xs font-bold mb-4">
            <i class="fas fa-crown text-amber-400" aria-hidden="true"></i>
            <span>Hệ thống phân hạng Skill VIP I – IV · Niêm yết song song VNĐ &amp; USD</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Bảng giá Hội viên VIP &amp; Hạng Skill</h1>
          <p class="text-[#c2c0e0] max-w-2xl mx-auto text-sm md:text-base">
            Mua lẻ từng Skill theo hạng hoặc đăng ký <b>Gói Hội Viên</b> để nhận hàng chục đến <b>Full kho Skill VIP I &amp; VIP II (update liên tục)</b> với chi phí siêu tiết kiệm.
          </p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 5 Skill Tier Pills Strip (mirroring reference image top bar) */}
        <section aria-label="Phân hạng Skill VIP">
          <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SKILL_TIER_ORDER.map(tk => {
              const m = SKILL_TIERS[tk]
              const cnt = tierCounts[tk] || 0
              return (
                <a href={`/san-pham?tier=${tk}`}
                  class={`group rounded-2xl p-4 bg-gradient-to-r ${m.bannerGrad} text-white shadow-lg hover:-translate-y-0.5 transition flex items-center justify-between gap-3`}>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded-lg bg-black/25 font-black text-xs tracking-wide whitespace-nowrap">{m.code}</span>
                      {cnt > 0 && <span class="text-[11px] font-bold text-white/90 tabular-nums">{cnt} Skill</span>}
                    </div>
                    <div class="font-extrabold text-sm sm:text-base leading-tight tabular-nums">{m.priceRangeVnd}</div>
                    <div class="text-[11px] text-white/90 font-medium mt-0.5">
                      {m.priceRangeUsd} · {m.subtitle}
                    </div>
                  </div>
                  <span class="w-10 h-10 rounded-xl bg-white/15 grid place-items-center text-lg shrink-0 group-hover:scale-110 transition">
                    <i class={`fas ${m.icon}`} aria-hidden="true"></i>
                  </span>
                </a>
              )
            })}
          </div>

          {/* Info Notice Strip (exact style from reference) */}
          <div class="mt-3.5 px-4 py-3 rounded-xl bg-sky-500/10 border border-sky-400/35 text-xs sm:text-sm text-sky-100 flex items-start sm:items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-sky-500 text-white grid place-items-center text-xs shrink-0 mt-0.5 sm:mt-0">
              <i class="fas fa-info" aria-hidden="true"></i>
            </span>
            <p class="leading-relaxed">
              Gói Hội viên chỉ áp dụng nhận các Skill lẻ thuộc hạng <b>VIP I – VIP IV</b> theo hạn mức của từng gói (tối đa <b class="text-cyan-300">50 Skill / ngày</b>), <b class="text-amber-300">không áp dụng cho SKILL PRO (chỉ bán lẻ riêng)</b>. Đặc biệt: Hội viên <b class="text-amber-300">BLACK DIAMOND</b> được <b class="text-emerald-300">giảm ngay 40%</b> khi mua bất kỳ Skill lẻ nào (kể cả SKILL PRO). Tỷ giá tham khảo: <b class="tabular-nums">1 USD ≈ {formatVND(usdRate)}</b>.
            </p>
          </div>
        </section>

        {/* Active Member Quick Banner */}
        {activeMem && (
          <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#121134] to-indigo-950/70 border border-emerald-400/40 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 grid place-items-center text-lg shrink-0">
                <i class="fas fa-crown" aria-hidden="true"></i>
              </span>
              <div class="min-w-0">
                <div class="text-sm font-extrabold text-white">
                  Bạn đang là Hội viên <span class="text-amber-300">{activeMem.plan_name}</span>
                </div>
                <div class="text-xs text-[#c2c0e0] mt-0.5">
                  Hiệu lực đến <b>{formatDate(activeMem.expires_at)}</b> · Vào trang Hội viên để xem hạn mức VIP I – IV còn lại và nhận Skill ngay.
                </div>
              </div>
            </div>
            <a href="/tai-khoan/hoi-vien"
              class="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 transition shrink-0">
              <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Mở kho Hội viên của tôi →
            </a>
          </div>
        )}

        {/* SECTION 1: GÓI CAO CẤP (PREMIUM, GOLD, BLACK DIAMOND) */}
        {premiumPlans.length > 0 && (
          <section aria-labelledby="heading-premium-plans" class="pt-2">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
              <h2 id="heading-premium-plans" class="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
                <span class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 grid place-items-center text-sm">
                  <i class="fas fa-crown" aria-hidden="true"></i>
                </span>
                <span>GÓI CAO CẤP</span>
                <span class="text-xs font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-full">
                  Full VIP I + VIP II update liên tục
                </span>
              </h2>
            </div>
            <div class="grid lg:grid-cols-3 gap-6 items-stretch">
              {premiumPlans.map(plan => (
                <MembershipCard plan={plan} usdRate={usdRate} isCurrent={activeMem?.plan_slug === plan.slug} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: GÓI CƠ BẢN (BASIC, STANDARD, SILVER) */}
        {starterPlans.length > 0 && (
          <section aria-labelledby="heading-starter-plans" class="pt-4">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
              <h2 id="heading-starter-plans" class="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
                <span class="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 grid place-items-center text-sm">
                  <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                </span>
                <span>GÓI CƠ BẢN</span>
                <span class="text-xs font-semibold text-[#c2c0e0] bg-[#161436] border border-[#2a2559] px-2.5 py-0.5 rounded-full">
                  Chọn lẻ theo hạn mức VIP I – III
                </span>
              </h2>
            </div>
            <div class="grid lg:grid-cols-3 gap-6 items-stretch">
              {starterPlans.map(plan => (
                <MembershipCard plan={plan} usdRate={usdRate} isCurrent={activeMem?.plan_slug === plan.slug} />
              ))}
            </div>
          </section>
        )}

        {/* Full Comparison Table */}
        {plans.length > 0 && (
          <section class="mt-8 bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-8">
            <h2 class="text-xl font-extrabold text-white mb-2 text-center">So sánh chi tiết tất cả gói Hội viên</h2>
            <p class="text-xs text-[#9492b8] text-center mb-6">Mọi gói đều kích hoạt tự động 24/7 qua VietQR, hỗ trợ dùng song song cả Skill tự tải &amp; Skill AI Agent (MCP).</p>
            <div class="overflow-x-auto">
              <table class="w-full text-xs sm:text-sm min-w-[760px]">
                <thead>
                  <tr class="border-b-2 border-[#221e54]">
                    <th class="text-left py-3 pr-3 font-bold text-[#c2c0e0]">Quyền lợi</th>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <th class={`py-3 px-2.5 font-extrabold text-center whitespace-nowrap ${pl.is_popular ? 'text-amber-300' : 'text-white'}`}>
                        {pl.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#221e54] tabular-nums">
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Giá gói (VNĐ / USD)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center">
                        <div class="font-extrabold text-rose-400">{formatVND(pl.price_vnd)}</div>
                        <div class="text-[11px] text-[#9492b8]">{formatUSD(pl.price_vnd, usdRate)}</div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Thời hạn</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center text-white font-semibold">{formatDurationLabel(pl.duration_days)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Skill VIP I (~135K / $5)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center font-bold">
                        {pl.vip1_quota < 0 ? <span class="text-emerald-400">Full (Update)</span> : pl.vip1_quota > 0 ? <span class="text-sky-300">{pl.vip1_quota} Skill</span> : <span class="text-rose-400">Không</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Skill VIP II (~270K / $10)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center font-bold">
                        {pl.vip2_quota < 0 ? <span class="text-emerald-400">Full (Update)</span> : pl.vip2_quota > 0 ? <span class="text-sky-300">{pl.vip2_quota} Skill</span> : <span class="text-rose-400">Không</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Skill VIP III (399K – 599K)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center font-bold">
                        {pl.vip3_quota < 0 ? <span class="text-emerald-400">Full</span> : pl.vip3_quota > 0 ? <span class="text-amber-300">{pl.vip3_quota} Skill</span> : <span class="text-rose-400">Không</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Skill VIP IV (999K)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center font-bold">
                        {pl.vip4_quota < 0 ? <span class="text-emerald-400">Full</span> : pl.vip4_quota > 0 ? <span class="text-violet-300">{pl.vip4_quota} Skill</span> : <span class="text-rose-400">Không</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Giới hạn tải mỗi ngày</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center text-xs font-bold text-cyan-300 whitespace-nowrap">
                        {pl.daily_download_limit || 50} Skill/ngày
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">Ưu đãi mua Skill lẻ (kể cả PRO)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center font-extrabold">
                        {Number(pl.retail_discount_percent || 0) > 0
                          ? <span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs">Giảm {pl.retail_discount_percent}%</span>
                          : <span class="text-[#9492b8] font-normal">—</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td class="py-3 pr-3 text-[#c2c0e0] font-semibold">SKILL PRO (Siêu cấp bán lẻ)</td>
                    {[...starterPlans, ...premiumPlans].map(pl => (
                      <td class="py-3 px-2.5 text-center text-xs font-semibold">
                        {Number(pl.retail_discount_percent || 0) > 0
                          ? <span class="text-emerald-300">Mua lẻ -{pl.retail_discount_percent}%</span>
                          : <span class="text-rose-300">Chỉ bán lẻ</span>}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}

/* ---------------- ABOUT ---------------- */
export const AboutPage: FC<LayoutProps & { stats: any }> = (props) => {
  const siteName = props.settings?.site_name || 'KhoSkill AI'
  return (
  <Layout {...props} title="Giới thiệu" description={`Về ${siteName} — kho Skill AI & Skill AI Agent (MCP) làm video thực chiến hàng đầu Việt Nam`}>
    <div class="bg-[#070614] text-white relative overflow-hidden border-b border-[#221e54]">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="relative max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Về {siteName}</h1>
        <p class="text-[#c2c0e0] leading-relaxed">Chúng tôi giúp người Việt làm video AI bán hàng dễ dàng nhất — với 2 dòng sản phẩm đang mở bán: <b>Skill AI tự tải</b> và <b>Skill AI Agent (MCP)</b> kết nối trực tiếp vào Claude, Codex, Antigravity.</p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-14">
      <div class="grid sm:grid-cols-3 gap-5 mb-14">
        {[
          ['fa-wand-magic-sparkles', props.stats.products + ' Skill', 'Đang mở bán'],
          ['fa-users', props.stats.users.toLocaleString('vi-VN') + '+', 'Khách hàng'],
          ['fa-cart-shopping', props.stats.sold.toLocaleString('vi-VN') + '+', 'Lượt mua']
        ].map(([ic, num, lb]) => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-7 text-center">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center mx-auto mb-3.5 shadow-lg">
              <i class={`fas ${ic}`} aria-hidden="true"></i>
            </div>
            <div class="text-3xl font-extrabold text-white tabular-nums">{num}</div>
            <div class="text-sm text-[#9492b8] mt-1">{lb}</div>
          </div>
        ))}
      </div>

      <div class="prose-vn max-w-none bg-[#0f0e24] rounded-2xl border border-[#221e54] p-7 md:p-10">
        <h2>Câu chuyện của chúng tôi</h2>
        <p>{siteName} ra đời từ nhu cầu thực tế: rất nhiều người muốn làm video bán hàng bằng AI nhưng không biết viết prompt chuẩn, không giữ được nhân vật xuyên suốt 30 giây và tốn nhiều thời gian thử sai.</p>
        <p>Chúng tôi đóng gói sẵn cả <b>Skill tự tải về làm theo</b> lẫn dòng <b>Skill AI Agent (MCP)</b> thế hệ mới để các AI Agent như <b>Claude, Codex, Antigravity</b> có thể kết nối trực tiếp về MCP Server và tự động thực thi quy trình tạo video theo Skill.</p>
        <h2>Trạng thái dịch vụ hiện tại</h2>
        <ul>
          <li><b>Skill AI tự tải (Đang mở bán):</b> nhận link tải bộ prompt, quy trình &amp; checklist tự động 24/7 ngay sau thanh toán.</li>
          <li><b>Skill AI Agent MCP (Đang mở bán):</b> nhận ngay MCP Endpoint + License Key + cấu hình 1-click cho Claude, Codex, Antigravity.</li>
          <li><b>Khóa học, Chatbot, App Video AI &amp; Combo (Chưa mở bán):</b> đang trong giai đoạn hoàn thiện và nâng cấp, sẽ sớm công bố mở bán.</li>
        </ul>
        <h2>Cam kết</h2>
        <ul>
          <li>Giao tài liệu Skill tự động ngay sau khi thanh toán, không phải chờ đợi</li>
          <li>Hỗ trợ kỹ thuật 1-1 qua Zalo cho đến khi bạn tự render được video</li>
          <li>Hoàn tiền 100% trong 7 ngày nếu sản phẩm không đúng mô tả</li>
          <li>Cập nhật miễn phí trọn đời theo các bản nâng cấp AI mới</li>
        </ul>
        <h2>Giá trị cốt lõi</h2>
        <p><b>Thực chiến:</b> Mọi sản phẩm đều được chúng tôi tự dùng trước khi bán. <b>Minh bạch:</b> Giá công khai, không phí ẩn. <b>Đồng hành:</b> Chúng tôi hỗ trợ bạn đến khi thành công, không chỉ bán xong là hết.</p>
      </div>
    </div>
  </Layout>
  )
}

/* ---------------- CONTACT ---------------- */
export const ContactPage: FC<LayoutProps> = (props) => {
  const siteName = props.settings?.site_name || 'KhoSkill AI'
  return (
  <Layout {...props} active="contact" title="Liên hệ" description={`Liên hệ hỗ trợ ${siteName}`}>
    <div class="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: 'Liên hệ' }]} />
      <div class="grid lg:grid-cols-[1fr_360px] gap-7">
        <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-8">
          <h1 class="text-2xl font-extrabold text-white mb-2 tracking-tight">Gửi yêu cầu hỗ trợ</h1>
          <p class="text-[#b8b6d9] text-sm mb-6">Điền form bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
          <form action="/api/tickets" method="post" data-ajax class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="contact-name" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Họ tên *</label>
                <input id="contact-name" type="text" name="name" required value={props.user?.full_name || ''}
                  class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label for="contact-email" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Email *</label>
                <input id="contact-email" type="email" name="email" required value={props.user?.email || ''}
                  class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label for="contact-subject" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Tiêu đề *</label>
              <input id="contact-subject" type="text" name="subject" required placeholder="Vấn đề bạn gặp phải"
                class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm" />
            </div>
            <div>
              <label for="contact-message" class="block text-sm font-medium text-[#c2c0e0] mb-1.5">Nội dung *</label>
              <textarea id="contact-message" name="message" rows={6} required placeholder="Mô tả chi tiết vấn đề của bạn..."
                class="w-full p-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-white placeholder-[#9492b8] focus:border-indigo-500 outline-none text-sm resize-y"></textarea>
            </div>
            <div role="alert" class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-sm text-rose-200"></div>
            <button type="submit" class="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-indigo-500/25 transition">
              <i class="fas fa-paper-plane mr-1.5" aria-hidden="true"></i>Gửi yêu cầu
            </button>
          </form>
        </div>

        <aside class="space-y-4">
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
            <h2 class="font-bold text-white mb-4 text-base">Thông tin liên hệ</h2>
            <div class="space-y-4">
              {[
                ['fa-phone-volume', 'Hotline', props.settings?.hotline, `tel:${(props.settings?.hotline || '').replace(/\s/g, '')}`],
                ['fa-envelope', 'Email', props.settings?.email, `mailto:${props.settings?.email}`],
                ['fa-comment-dots', 'Zalo', props.settings?.zalo, `https://zalo.me/${props.settings?.zalo}`],
                ['fa-clock', 'Giờ làm việc', '8:00 – 22:00 (T2–CN)', '']
              ].map(([ic, lb, val, href]) => (
                <div class="flex gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 grid place-items-center shrink-0">
                    <i class={`fas ${ic}`} aria-hidden="true"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs text-[#9492b8]">{lb}</div>
                    {href ? <a href={href as string} target="_blank" rel="noopener" class="font-semibold text-white text-sm hover:text-indigo-300 break-all transition">{val}</a>
                      : <div class="font-semibold text-white text-sm">{val}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div class="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-950/50">
            <i class="fas fa-bolt text-2xl mb-2.5" aria-hidden="true"></i>
            <h2 class="font-bold mb-1.5 text-base">Cần hỗ trợ gấp?</h2>
            <p class="text-xs text-white/90 mb-4 leading-relaxed">Chat Zalo là kênh phản hồi nhanh nhất, thường dưới 5 phút trong giờ làm việc.</p>
            <a href={`https://zalo.me/${props.settings?.zalo}`} target="_blank" rel="noopener"
              class="cta-white flex items-center justify-center w-full h-11 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-slate-100 transition">Chat Zalo ngay</a>
          </div>
        </aside>
      </div>
    </div>
  </Layout>
  )
}

/* ---------------- AFFILIATE LANDING ---------------- */
export const AffiliateLandingPage: FC<LayoutProps & { percent: number }> = (props) => {
  const siteName = props.settings?.site_name || 'KhoSkill AI'
  return (
  <Layout {...props} active="affiliate" title="Chương trình Affiliate" description={`Kiếm hoa hồng khi giới thiệu sản phẩm ${siteName}`}>
    <div class="bg-[#070614] text-white relative overflow-hidden border-b border-[#221e54]">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="relative max-w-4xl mx-auto px-4 py-16 text-center">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
          <i class="fas fa-handshake text-amber-400" aria-hidden="true"></i>Chương trình đối tác
        </div>
        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Nhận <span class="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{props.percent}% hoa hồng</span> mỗi đơn hàng
        </h1>
        <p class="text-[#c2c0e0] max-w-2xl mx-auto mb-8">Chia sẻ link giới thiệu, kiếm thu nhập thụ động không giới hạn. Không cần vốn, không cần kho hàng.</p>
        <a href={props.user ? '/tai-khoan/affiliate' : '/dang-ky'}
          class="inline-flex h-12 px-7 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold hover:opacity-90 shadow-xl transition">
          <i class="fas fa-rocket" aria-hidden="true"></i>{props.user ? 'Vào trang Affiliate' : 'Tham gia ngay — Miễn phí'}
        </a>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-14">
      <SectionTitle center title="Cách hoạt động" subtitle="Chỉ 3 bước đơn giản để bắt đầu kiếm tiền" />
      <div class="grid md:grid-cols-3 gap-5 mt-8 mb-14">
        {[
          ['fa-user-plus', '1. Đăng ký tài khoản', 'Tạo tài khoản miễn phí và nhận ngay mã giới thiệu riêng của bạn.'],
          ['fa-share-nodes', '2. Chia sẻ link', 'Đăng link lên Facebook, TikTok, Zalo, group hoặc gửi trực tiếp cho bạn bè.'],
          ['fa-coins', '3. Nhận hoa hồng', `Nhận ${props.percent}% giá trị mỗi đơn hàng phát sinh từ link của bạn.`]
        ].map(([ic, t, d]) => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-7 text-center">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-xl mx-auto mb-4 shadow-lg">
              <i class={`fas ${ic}`} aria-hidden="true"></i>
            </div>
            <h3 class="font-bold text-white mb-2">{t}</h3>
            <p class="text-sm text-[#b8b6d9] leading-relaxed">{d}</p>
          </div>
        ))}
      </div>

      <SectionTitle center title="Thu nhập tham khảo" subtitle="Ước tính dựa trên số đơn giới thiệu mỗi tháng" />
      <div class="grid sm:grid-cols-3 gap-5 mt-8">
        {[[5, 890000], [20, 890000], [50, 890000]].map(([n, avg]) => (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-7 text-center">
            <div class="text-sm text-[#b8b6d9] mb-1 tabular-nums">{n} đơn / tháng</div>
            <div class="text-3xl font-extrabold text-emerald-400 tabular-nums">{formatVND(Math.round(n * avg * props.percent / 100))}</div>
            <div class="text-xs text-[#9492b8] mt-1.5 tabular-nums">Giá trị đơn TB {formatVND(avg)}</div>
          </div>
        ))}
      </div>

      <div class="mt-14 bg-[#0f0e24] rounded-2xl border border-[#221e54] p-7 md:p-10">
        <h2 class="text-xl font-extrabold text-white mb-5">Điều khoản chương trình</h2>
        <ul class="space-y-3 text-sm text-[#c2c0e0]">
          {[
            `Hoa hồng ${props.percent}% trên giá trị đơn hàng thực thu (sau giảm giá)`,
            'Hoa hồng được ghi nhận khi đơn hàng chuyển sang trạng thái "Đã thanh toán"',
            'Rút hoa hồng tối thiểu 200.000đ, xử lý trong 1-3 ngày làm việc',
            'Không áp dụng cho đơn hàng tự mua bằng mã của chính mình',
            `Nghiêm cấm spam, chạy quảng cáo trên thương hiệu ${siteName}`
          ].map(t => (
            <li class="flex gap-2.5"><i class="fas fa-circle-check text-emerald-400 mt-0.5 shrink-0" aria-hidden="true"></i>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  </Layout>
  )
}

/* ---------------- POLICY / TERMS / GUIDE ---------------- */
export const DocPage: FC<LayoutProps & { heading: string; html: string }> = (props) => (
  <Layout {...props} title={props.heading}>
    <div class="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: props.heading }]} />
      <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-7">{props.heading}</h1>
      <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-9">
        <div class="prose-vn max-w-none" dangerouslySetInnerHTML={{ __html: props.html }}></div>
      </div>
    </div>
  </Layout>
)

/* ---------------- 404 ---------------- */
export const NotFoundPage: FC<LayoutProps> = (props) => (
  <Layout {...props} title="Không tìm thấy trang">
    <div class="max-w-lg mx-auto px-4 py-24 text-center">
      <div class="text-7xl font-extrabold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent mb-4 tabular-nums">404</div>
      <h1 class="text-2xl font-extrabold text-white mb-2">Không tìm thấy trang</h1>
      <p class="text-[#b8b6d9] mb-7">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a href="/" class="h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition">
          <i class="fas fa-house" aria-hidden="true"></i>Về trang chủ
        </a>
        <a href="/san-pham" class="h-11 px-5 inline-flex items-center gap-2 rounded-xl border border-[#2e2968] text-[#c2c0e0] hover:border-indigo-400 hover:text-white font-semibold text-sm transition">
          <i class="fas fa-cubes" aria-hidden="true"></i>Xem sản phẩm
        </a>
      </div>
    </div>
  </Layout>
)
