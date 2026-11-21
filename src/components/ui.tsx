import type { FC } from 'hono/jsx'
import type { Product, Category } from '../lib/types'
import { formatVND, formatUSD, DEFAULT_USD_VND_RATE, getSkillTierMeta, discountPercent, gradientFor, PRODUCT_TYPE_LABEL, PRODUCT_TYPE_ICON, formatDate, isMcpSkill, parseMcpClients, parseDemoVideos, isDirectVideoUrl } from '../lib/utils'

export const SkillTierBadge: FC<{ tier?: string | null; price?: number; showRetail?: boolean; size?: 'xs' | 'sm' }> = ({ tier, price, showRetail = false, size = 'xs' }) => {
  const meta = getSkillTierMeta(tier, price)
  const cls = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
  return (
    <span class={`inline-flex items-center gap-1 rounded border font-extrabold uppercase tracking-wide whitespace-nowrap ${cls} ${meta.badgeCls}`}
      title={meta.isRetailOnly ? 'SKILL PRO — Chỉ bán lẻ riêng, không áp dụng gói Hội viên' : `Hạng ${meta.code} (${meta.priceRangeVnd} · ${meta.priceRangeUsd})`}>
      <i class={`fas ${meta.icon} text-[9px]`} aria-hidden="true"></i>
      <span>{meta.code}</span>
      {showRetail && meta.isRetailOnly && <span class="opacity-85 font-semibold normal-case">· Chỉ bán lẻ</span>}
    </span>
  )
}

export const Stars: FC<{ rating: number; size?: string }> = ({ rating, size = 'text-xs' }) => (
  <span class={`text-amber-400 ${size}`} aria-label={`Đánh giá ${rating.toFixed(1)} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map(i => (
      <i class={`fa-star ${rating >= i ? 'fas' : rating >= i - 0.5 ? 'fas fa-star-half-stroke' : 'far'}`} aria-hidden="true"></i>
    ))}
  </span>
)

export const ProductCard: FC<{ p: Product; compact?: boolean; usdRate?: number }> = ({ p, compact, usdRate = DEFAULT_USD_VND_RATE }) => {
  const off = discountPercent(p.price, p.original_price)
  const comingSoon = p.status === 'coming_soon'
  const mcp = isMcpSkill(p.product_type)
  const mcpClients = mcp ? parseMcpClients(p.mcp_clients) : []
  const tierMeta = getSkillTierMeta(p.skill_tier, p.price)
  const demoVideos = parseDemoVideos(p)
  const hoverVideoUrl = demoVideos[0]?.url || (isDirectVideoUrl(p.demo_video_url) ? p.demo_video_url! : '')
  const hasMultiDemo = demoVideos.length >= 2
  const modalVideoUrl = demoVideos[0]?.url || p.demo_video_url || ''
  return (
    <article class={`product-card group bg-[#0f0e24] rounded-2xl border overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${mcp ? 'border-cyan-500/35 hover:border-cyan-400/65 hover:shadow-cyan-500/15' : 'border-[#221e54] hover:border-indigo-500/40 hover:shadow-indigo-500/15'} ${comingSoon ? 'opacity-90' : ''}`}>
      {/* Media area - adaptive 16:9 frame with instant hover/hold video preview */}
      <div
        class="product-card-media relative aspect-video overflow-hidden bg-[#070614]"
        style={p.thumbnail ? '' : `background:${gradientFor(p.id)}`}
        data-hover-video={hoverVideoUrl || undefined}
        data-hover-poster={p.thumbnail || undefined}
      >
        {p.thumbnail
          ? (
            <>
              <div class="product-card-ambient absolute inset-0 bg-cover bg-center scale-110 blur-md opacity-0 transition-opacity duration-200 pointer-events-none"
                style={`background-image:url('${p.thumbnail}')`}></div>
              <img src={p.thumbnail} alt={p.name} loading="lazy" decoding="async"
                class={`product-card-img relative z-[1] w-full h-full object-cover transition duration-500 ${hoverVideoUrl ? '' : 'group-hover:scale-105'} ${comingSoon ? 'opacity-80 grayscale-[15%]' : ''}`} />
            </>
          )
          : (
            <div class="w-full h-full grid place-items-center text-white/95 p-4 text-center">
              <div>
                <i class={`fas ${PRODUCT_TYPE_ICON[p.product_type] || 'fa-cube'} text-4xl mb-2 opacity-95`} aria-hidden="true"></i>
                <div class="text-[11px] font-bold uppercase tracking-widest opacity-80">{PRODUCT_TYPE_LABEL[p.product_type] || 'Sản phẩm'}</div>
              </div>
            </div>
          )}

        {/* Top-left priority badges */}
        <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20 pointer-events-none">
          {comingSoon ? (
            <span class="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1 shadow-md">
              <i class="fas fa-clock text-[9px]" aria-hidden="true"></i>Chưa mở bán
            </span>
          ) : (
            <>
              {mcp && (
                <span class="px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 text-[10px] font-black shadow-md inline-flex items-center gap-1">
                  <i class="fas fa-plug-circle-bolt text-[9px]" aria-hidden="true"></i>MCP LIVE
                </span>
              )}
              {p.raw_video_url && (
                <span class="px-2 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[10px] font-black shadow-md inline-flex items-center gap-1">
                  <i class="fas fa-columns text-[9px]" aria-hidden="true"></i>RAW ↔ EDIT
                </span>
              )}
              {p.is_hot === 1 && <span class="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold shadow-md inline-flex items-center gap-1"><i class="fas fa-fire text-[9px]" aria-hidden="true"></i>HOT</span>}
              {!mcp && p.is_hot !== 1 && p.is_new === 1 && <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-md">MỚI</span>}
              {off > 0 && <span class="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold tabular-nums shadow-md">-{off}%</span>}
            </>
          )}
        </div>

        {/* Live hover-preview indicator (fades in smoothly while playing) */}
        {hoverVideoUrl && (
          <div class="card-playing-pill absolute top-3 right-3 z-20 pointer-events-none px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-[10px] font-bold inline-flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Preview</span>
          </div>
        )}

        {/* Subtle media meta pill (auto-fades out when hover preview plays; clicking expands fullscreen modal with 16:9 + 9:16 switcher) */}
        {modalVideoUrl && (
          <div class="card-media-corner absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1.5">
            {hasMultiDemo && (
              <span class="card-idle-pill pointer-events-none h-6 px-2 rounded-full bg-[#070614]/75 backdrop-blur-md border border-white/15 text-white/95 text-[10px] font-bold inline-flex items-center gap-1 shadow">
                <i class="fas fa-film text-cyan-300 text-[9px]" aria-hidden="true"></i>
                <span>2 Video</span>
              </span>
            )}
            <button type="button"
              class="card-expand-btn w-7 h-7 rounded-full bg-[#070614]/70 hover:bg-indigo-600 backdrop-blur-md border border-white/20 hover:border-indigo-400 text-white/90 hover:text-white grid place-items-center shadow-md transition cursor-pointer"
              data-video={modalVideoUrl}
              data-videos={demoVideos.length > 0 ? JSON.stringify(demoVideos) : undefined}
              data-poster={p.thumbnail || ''}
              data-title={p.name}
              data-aspect="auto"
              aria-label={`Phóng to video demo ${p.name}`}
              title={hasMultiDemo ? 'Mở trình phát lớn (16:9 & 9:16)' : 'Mở trình phát lớn'}>
              <i class="fas fa-expand text-[10px]" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* Click area to go to detail page */}
        <a href={`/san-pham/${p.slug}`} class="absolute inset-0 z-10" aria-label={`Xem chi tiết ${p.name}`}></a>
      </div>

      {/* Info area */}
      <div class="p-4 flex flex-col flex-1">
        <div class="flex flex-wrap items-center gap-1.5 mb-2 text-[11px] text-[#9492b8]">
          {mcp ? (
            <span class="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold uppercase inline-flex items-center gap-1">
              <i class="fas fa-plug-circle-bolt text-[9px]" aria-hidden="true"></i>{PRODUCT_TYPE_LABEL[p.product_type]}
            </span>
          ) : (
            <span class="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold uppercase">{PRODUCT_TYPE_LABEL[p.product_type]}</span>
          )}
          <SkillTierBadge tier={p.skill_tier} price={p.price} />
          <span class="font-mono text-[10px] ml-auto">{p.version}</span>
        </div>

        <h3 class={`font-semibold text-sm leading-snug text-white line-clamp-2 mb-2 transition ${mcp ? 'group-hover:text-cyan-300' : 'group-hover:text-indigo-300'}`}>
          <a href={`/san-pham/${p.slug}`}>{p.name}</a>
        </h3>

        {!compact && <p class="text-[12px] text-[#b8b6d9] line-clamp-2 mb-3 leading-relaxed">{p.short_desc}</p>}

        {mcp && !compact && (
          <div class="flex flex-wrap items-center gap-1.5 mb-3">
            {mcpClients.slice(0, 3).map(cl => (
              <span class="px-2 py-0.5 rounded-md bg-[#161436] border border-cyan-500/25 text-cyan-200 text-[10px] font-semibold">
                {cl}
              </span>
            ))}
          </div>
        )}

        <div class="flex items-center gap-3 text-[11px] text-[#9492b8] mb-4">
          {comingSoon ? (
            <span class="text-amber-300 font-medium"><i class="fas fa-hourglass-half mr-1" aria-hidden="true"></i>Đang hoàn thiện &amp; sắp ra mắt</span>
          ) : (
            <>
              <span class="flex items-center gap-1"><Stars rating={p.rating} /><b class="text-white tabular-nums">{p.rating.toFixed(1)}</b></span>
              <span class="tabular-nums"><i class="fas fa-cart-shopping mr-1 text-[#9492b8]" aria-hidden="true"></i>{p.sold_count} đã bán</span>
            </>
          )}
        </div>

        {/* Pricing & Add/Wishlist actions */}
        <div class="mt-auto pt-3 border-t border-[#221e54] flex items-end justify-between gap-2">
          <div class="min-w-0">
            {comingSoon ? (
              <div class="text-xs font-semibold text-amber-300 tabular-nums whitespace-nowrap">
                Dự kiến: {formatVND(p.price)} <span class="text-[#9492b8] font-normal">({formatUSD(p.price, usdRate)})</span>
              </div>
            ) : (
              <>
                {p.original_price && p.original_price > p.price && (
                  <div class="text-[11px] text-[#9492b8] line-through leading-none mb-0.5 tabular-nums">{formatVND(p.original_price)}</div>
                )}
                <div class="flex items-baseline gap-1.5 flex-wrap">
                  <span class="text-base font-extrabold text-rose-400 leading-none tabular-nums">{formatVND(p.price)}</span>
                  <span class="text-[11px] font-semibold text-[#9492b8] leading-none tabular-nums">{formatUSD(p.price, usdRate)}</span>
                </div>
                {tierMeta.isRetailOnly && (
                  <div class="text-[10px] text-amber-300/90 font-semibold mt-1 leading-none">Chỉ bán lẻ</div>
                )}
              </>
            )}
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            {comingSoon ? (
              <a href={`/san-pham/${p.slug}`}
                class="h-9 px-3 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition">
                <i class="fas fa-clock text-[10px]" aria-hidden="true"></i>Chưa mở bán
              </a>
            ) : (
              <>
                <button type="button" class="btn-wishlist w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-rose-400 text-[#b8b6d9] hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                  data-id={p.id} aria-label={`Yêu thích ${p.name}`} title="Yêu thích">
                  <i class="far fa-heart text-xs" aria-hidden="true"></i>
                </button>
                <button type="button" class={`btn-add-cart h-9 px-3 rounded-lg text-white text-xs font-bold transition shadow-md cursor-pointer ${mcp ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 shadow-cyan-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}
                  data-id={p.id} data-name={p.name} aria-label={`Thêm ${p.name} vào giỏ hàng`}>
                  Thêm
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export const SectionTitle: FC<{ title: string; subtitle?: string; center?: boolean; more?: { href: string; label: string } }> =
  ({ title, subtitle, center, more }) => (
    <div class={`flex gap-4 mb-7 ${center ? 'flex-col items-center justify-center text-center' : 'flex-wrap items-end justify-between'}`}>
      <div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        {subtitle && <p class="text-[#b8b6d9] mt-1.5 text-sm md:text-base">{subtitle}</p>}
      </div>
      {more && (
        <a href={more.href} class="shrink-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:gap-2 flex items-center gap-1.5 transition-all">
          {more.label}<i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
        </a>
      )}
    </div>
  )

export const CategoryCard: FC<{ c: Category }> = ({ c }) => {
  const count = c.product_count ?? 0
  const isMcpCat = c.slug === 'skill-ai-agent-mcp'
  const iconBg = isMcpCat
    ? 'from-cyan-500 to-indigo-600'
    : c.slug === 'skill-video-ai'
      ? 'from-indigo-500 to-fuchsia-500'
      : 'from-slate-600 to-indigo-700'
  return (
    <a href={`/danh-muc/${c.slug}`}
      class={`group relative p-5 rounded-2xl bg-[#0f0e24] border hover:shadow-lg transition-all overflow-hidden flex flex-col ${isMcpCat ? 'border-cyan-500/35 hover:border-cyan-400/70' : 'border-[#221e54] hover:border-indigo-500/40'}`}>
      <div class={`w-11 h-11 rounded-xl grid place-items-center text-white mb-3.5 shadow-lg bg-gradient-to-br ${iconBg} group-hover:scale-110 transition`}>
        <i class={`fas ${c.icon}`} aria-hidden="true"></i>
      </div>
      <h3 class={`font-bold text-white mb-1 transition ${isMcpCat ? 'group-hover:text-cyan-300' : 'group-hover:text-indigo-300'}`}>{c.name}</h3>
      <p class="text-[13px] text-[#b8b6d9] line-clamp-2 leading-relaxed">{c.description}</p>
      <div class="mt-auto pt-3 text-xs font-semibold">
        {count > 0 ? (
          isMcpCat ? (
            <span class="text-cyan-300 tabular-nums inline-flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {count} Skill MCP <i class="fas fa-arrow-right text-[10px]" aria-hidden="true"></i>
            </span>
          ) : (
            <span class="text-emerald-400 tabular-nums">{count} Skill đang mở bán <i class="fas fa-arrow-right ml-0.5 text-[10px]" aria-hidden="true"></i></span>
          )
        ) : (
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-semibold">
            <i class="fas fa-clock text-[10px]" aria-hidden="true"></i>Chưa mở bán
          </span>
        )}
      </div>
    </a>
  )
}

export const Breadcrumb: FC<{ items: { label: string; href?: string }[] }> = ({ items }) => (
  <nav class="text-[13px] text-[#9492b8] mb-5" aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li><a href="/" aria-label="Trang chủ" class="hover:text-indigo-300 transition"><i class="fas fa-house" aria-hidden="true"></i></a></li>
      {items.map(i => (
        <>
          <li class="text-[#5c5980]" aria-hidden="true">/</li>
          <li>{i.href ? <a href={i.href} class="hover:text-indigo-300 transition">{i.label}</a> : <span class="text-white font-medium">{i.label}</span>}</li>
        </>
      ))}
    </ol>
  </nav>
)

export const Pagination: FC<{ page: number; totalPages: number; baseUrl: string }> = ({ page, totalPages, baseUrl }) => {
  if (totalPages <= 1) return <></>
  const sep = baseUrl.includes('?') ? '&' : '?'
  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
  }
  return (
    <nav aria-label="Phân trang" class="flex items-center justify-center gap-1.5 mt-10">
      {page > 1 && <a href={`${baseUrl}${sep}page=${page - 1}`} aria-label="Trang trước" class="h-10 min-w-[40px] px-3 grid place-items-center rounded-lg bg-[#0f0e24] border border-[#221e54] text-[#c2c0e0] hover:border-indigo-400 hover:text-white text-sm transition"><i class="fas fa-chevron-left text-xs" aria-hidden="true"></i></a>}
      {pages.map((p, idx) => (
        <>
          {idx > 0 && pages[idx - 1] !== p - 1 && <span class="px-1 text-[#9492b8]">…</span>}
          <a href={`${baseUrl}${sep}page=${p}`} aria-current={p === page ? 'page' : undefined}
            class={`h-10 min-w-[40px] px-2.5 grid place-items-center rounded-lg text-sm font-medium tabular-nums border transition ${p === page ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#0f0e24] border-[#221e54] text-[#c2c0e0] hover:border-indigo-400 hover:text-white'}`}>{p}</a>
        </>
      ))}
      {page < totalPages && <a href={`${baseUrl}${sep}page=${page + 1}`} aria-label="Trang sau" class="h-10 min-w-[40px] px-3 grid place-items-center rounded-lg bg-[#0f0e24] border border-[#221e54] text-[#c2c0e0] hover:border-indigo-400 hover:text-white text-sm transition"><i class="fas fa-chevron-right text-xs" aria-hidden="true"></i></a>}
    </nav>
  )
}

export const EmptyState: FC<{ icon?: string; title: string; desc?: string; action?: { href: string; label: string } }> =
  ({ icon = 'fa-box-open', title, desc, action }) => (
    <div class="text-center py-16 px-4 bg-[#0f0e24] border border-[#221e54] rounded-2xl">
      <div class="w-16 h-16 rounded-2xl bg-[#161436] border border-[#2a2559] grid place-items-center text-indigo-400 text-2xl mx-auto mb-4">
        <i class={`fas ${icon}`} aria-hidden="true"></i>
      </div>
      <h3 class="font-bold text-lg text-white mb-1.5">{title}</h3>
      {desc && <p class="text-[#b8b6d9] text-sm mb-5 max-w-md mx-auto">{desc}</p>}
      {action && <a href={action.href} class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition">{action.label}</a>}
    </div>
  )

export const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const map: Record<string, [string, string]> = {
    pending: ['fa-clock', 'Chờ thanh toán'],
    paid: ['fa-circle-check', 'Đã thanh toán'],
    cancelled: ['fa-ban', 'Đã huỷ'],
    refunded: ['fa-rotate-left', 'Đã hoàn tiền'],
    active: ['fa-circle-check', 'Hoạt động'],
    banned: ['fa-lock', 'Bị khoá'],
    published: ['fa-eye', 'Hiển thị'],
    coming_soon: ['fa-clock', 'Chưa mở bán'],
    draft: ['fa-file-pen', 'Nháp'],
    open: ['fa-envelope-open', 'Đang mở'],
    closed: ['fa-circle-check', 'Đã đóng']
  }
  const [icon, label] = map[status] || ['fa-circle-info', status]
  return (
    <span class={`status-badge status-${status}`}>
      <i class={`fas ${icon} text-[10px] mr-1`} aria-hidden="true"></i>{label}
    </span>
  )
}

export const PostCard: FC<{ p: any }> = ({ p }) => (
  <article class="group bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden hover:border-indigo-500/40 hover:shadow-xl transition">
    <a href={`/blog/${p.slug}`} class="block aspect-[16/9] relative" style={`background:${gradientFor(p.id + 3)}`}>
      {p.thumbnail
        ? <img src={p.thumbnail} alt={p.title} loading="lazy" class="w-full h-full object-cover" />
        : <div class="w-full h-full grid place-items-center text-white/90 text-3xl"><i class="fas fa-newspaper" aria-hidden="true"></i></div>}
    </a>
    <div class="p-4">
      <div class="text-[11px] text-[#9492b8] mb-2 flex items-center gap-3 tabular-nums">
        <span><i class="far fa-calendar mr-1" aria-hidden="true"></i>{formatDate(p.created_at)}</span>
        <span><i class="far fa-eye mr-1" aria-hidden="true"></i>{p.view_count}</span>
      </div>
      <h3 class="font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-indigo-300 transition">
        <a href={`/blog/${p.slug}`}>{p.title}</a>
      </h3>
      <p class="text-[13px] text-[#b8b6d9] line-clamp-2 leading-relaxed">{p.excerpt}</p>
    </div>
  </article>
)
