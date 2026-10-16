import type { FC } from 'hono/jsx'
import type { Product, Category } from '../lib/types'
import { formatVND, discountPercent, gradientFor, PRODUCT_TYPE_LABEL, PRODUCT_TYPE_ICON, formatDate } from '../lib/utils'

export const Stars: FC<{ rating: number; size?: string }> = ({ rating, size = 'text-xs' }) => (
  <span class={`text-amber-400 ${size}`}>
    {[1, 2, 3, 4, 5].map(i => (
      <i class={`fa-star ${rating >= i ? 'fas' : rating >= i - 0.5 ? 'fas fa-star-half-stroke' : 'far'}`}></i>
    ))}
  </span>
)

export const ProductCard: FC<{ p: Product; compact?: boolean }> = ({ p, compact }) => {
  const off = discountPercent(p.price, p.original_price)
  return (
    <article class="product-card group bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-500/30 transition-all duration-300 flex flex-col">
      {/* Media area - 10/16 aspect ratio (vertical mockup) */}
      <div class="relative aspect-[10/16] overflow-hidden bg-[#080716]" style={p.thumbnail ? '' : `background:${gradientFor(p.id)}`}>
        {p.thumbnail
          ? <img src={p.thumbnail} alt={p.name} loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          : (
            <div class="w-full h-full grid place-items-center text-white/95 p-4 text-center">
              <div>
                <i class={`fas ${PRODUCT_TYPE_ICON[p.product_type] || 'fa-cube'} text-4xl mb-2 opacity-95`}></i>
                <div class="text-[11px] font-bold uppercase tracking-widest opacity-80">{PRODUCT_TYPE_LABEL[p.product_type] || 'Sản phẩm'}</div>
              </div>
            </div>
          )}

        {/* Top badges */}
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span class="px-2 py-1 rounded bg-amber-500 text-black text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
            <i class="fas fa-crown text-[8px]"></i>Premium
          </span>
          {off > 0 && <span class="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold shadow-md">-{off}%</span>}
          {p.is_hot === 1 && <span class="px-2 py-0.5 rounded bg-orange-500 text-white text-[9px] font-bold shadow-md flex items-center gap-0.5"><i class="fas fa-fire text-[8px]"></i>HOT</span>}
        </div>
        <div class="absolute top-3 right-3 z-10">
          <span class="px-2 py-1 rounded bg-[#0068ff] text-white text-[9px] font-black tracking-wider uppercase shadow-md">
            {PRODUCT_TYPE_LABEL[p.product_type] || 'Sản phẩm'}
          </span>
        </div>

        {/* Hover video play demo trigger */}
        {p.demo_video_url && (
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition duration-300 z-20">
            <button class="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition duration-300 cursor-pointer"
              data-video={p.demo_video_url} data-aspect="vertical" title="Xem Demo">
              <i class="fas fa-play text-sm ml-0.5"></i>
            </button>
            <span class="text-white text-xs font-semibold tracking-wide">Xem Demo</span>
          </div>
        )}

        {/* Click area to go to detail page */}
        <a href={`/san-pham/${p.slug}`} class="absolute inset-0 z-10" aria-label={`Xem chi tiết ${p.name}`}></a>
      </div>

      {/* Info area */}
      <div class="p-4 flex flex-col flex-1">
        <div class="flex items-center gap-2 mb-2 text-[10px] text-[#9f9dbb]">
          <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold uppercase">{PRODUCT_TYPE_LABEL[p.product_type]}</span>
          <span>{p.version}</span>
        </div>

        <h3 class="font-semibold text-sm leading-snug text-white line-clamp-2 mb-2 group-hover:text-indigo-400 transition">
          <a href={`/san-pham/${p.slug}`}>{p.name}</a>
        </h3>

        {!compact && <p class="text-[12px] text-[#9f9dbb] line-clamp-2 mb-3 leading-relaxed">{p.short_desc}</p>}

        <div class="flex items-center gap-3 text-[11px] text-[#9f9dbb] mb-4">
          <span class="flex items-center gap-1"><Stars rating={p.rating} /><b class="text-white">{p.rating.toFixed(1)}</b></span>
          <span><i class="fas fa-cart-shopping mr-1 text-slate-500"></i>{p.sold_count} đã bán</span>
        </div>

        {/* Pricing & Add/Wishlist actions */}
        <div class="mt-auto pt-3 border-t border-[#1f1b4b] flex items-end justify-between gap-2">
          <div>
            {p.original_price && p.original_price > p.price && (
              <div class="text-[10px] text-slate-500 line-through leading-none mb-0.5">{formatVND(p.original_price)}</div>
            )}
            <div class="text-base font-extrabold text-[#f43f5e] leading-none">{formatVND(p.price)}</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="btn-wishlist w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-rose-500 text-slate-400 hover:text-rose-500 flex items-center justify-center transition"
              data-id={p.id} title="Yêu thích">
              <i class="far fa-heart text-xs"></i>
            </button>
            <button class="btn-add-cart h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition shadow-md shadow-indigo-600/10"
              data-id={p.id} data-name={p.name}>
              Thêm
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export const SectionTitle: FC<{ title: string; subtitle?: string; center?: boolean; more?: { href: string; label: string } }> =
  ({ title, subtitle, center, more }) => (
    <div class={`flex items-end justify-between gap-4 mb-7 ${center ? 'flex-col items-center text-center' : ''}`}>
      <div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        {subtitle && <p class="text-[#9f9dbb] mt-1.5 text-sm md:text-base">{subtitle}</p>}
      </div>
      {more && (
        <a href={more.href} class="shrink-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:gap-2 flex items-center gap-1.5 transition-all">
          {more.label}<i class="fas fa-arrow-right text-xs"></i>
        </a>
      )}
    </div>
  )

export const CategoryCard: FC<{ c: Category }> = ({ c }) => (
  <a href={`/danh-muc/${c.slug}`} class="group relative p-5 rounded-2xl bg-[#0f0e26] border border-[#1f1b4b] hover:border-indigo-500/30 hover:shadow-lg transition-all overflow-hidden">
    <div class={`w-11 h-11 rounded-xl grid place-items-center text-white mb-3.5 shadow-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 group-hover:scale-110 transition`}>
      <i class={`fas ${c.icon}`}></i>
    </div>
    <h3 class="font-bold text-white mb-1 group-hover:text-indigo-400 transition">{c.name}</h3>
    <p class="text-[13px] text-[#9f9dbb] line-clamp-2 leading-relaxed">{c.description}</p>
    <div class="mt-3 text-xs font-semibold text-indigo-400">{c.product_count ?? 0} sản phẩm <i class="fas fa-arrow-right ml-0.5 text-[10px]"></i></div>
  </a>
)

export const Breadcrumb: FC<{ items: { label: string; href?: string }[] }> = ({ items }) => (
  <nav class="text-[13px] text-slate-500 mb-5" aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li><a href="/" class="hover:text-brand-600"><i class="fas fa-house"></i></a></li>
      {items.map(i => (
        <>
          <li class="text-slate-300">/</li>
          <li>{i.href ? <a href={i.href} class="hover:text-brand-600">{i.label}</a> : <span class="text-slate-800 font-medium">{i.label}</span>}</li>
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
    <nav class="flex items-center justify-center gap-1.5 mt-10">
      {page > 1 && <a href={`${baseUrl}${sep}page=${page - 1}`} class="h-9 px-3 grid place-items-center rounded-lg bg-white border border-slate-200 hover:border-brand-400 text-sm"><i class="fas fa-chevron-left text-xs"></i></a>}
      {pages.map((p, idx) => (
        <>
          {idx > 0 && pages[idx - 1] !== p - 1 && <span class="px-1 text-slate-400">…</span>}
          <a href={`${baseUrl}${sep}page=${p}`}
            class={`h-9 min-w-[36px] px-2 grid place-items-center rounded-lg text-sm font-medium border transition ${p === page ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 hover:border-brand-400'}`}>{p}</a>
        </>
      ))}
      {page < totalPages && <a href={`${baseUrl}${sep}page=${page + 1}`} class="h-9 px-3 grid place-items-center rounded-lg bg-white border border-slate-200 hover:border-brand-400 text-sm"><i class="fas fa-chevron-right text-xs"></i></a>}
    </nav>
  )
}

export const EmptyState: FC<{ icon?: string; title: string; desc?: string; action?: { href: string; label: string } }> =
  ({ icon = 'fa-box-open', title, desc, action }) => (
    <div class="text-center py-16 px-4">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 text-2xl mx-auto mb-4">
        <i class={`fas ${icon}`}></i>
      </div>
      <h3 class="font-bold text-lg text-slate-800 mb-1.5">{title}</h3>
      {desc && <p class="text-slate-500 text-sm mb-5 max-w-md mx-auto">{desc}</p>}
      {action && <a href={action.href} class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">{action.label}</a>}
    </div>
  )

export const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const map: Record<string, [string, string]> = {
    pending: ['bg-amber-100 text-amber-700', 'Chờ thanh toán'],
    paid: ['bg-emerald-100 text-emerald-700', 'Đã thanh toán'],
    cancelled: ['bg-slate-200 text-slate-600', 'Đã huỷ'],
    refunded: ['bg-rose-100 text-rose-700', 'Đã hoàn tiền'],
    active: ['bg-emerald-100 text-emerald-700', 'Hoạt động'],
    banned: ['bg-rose-100 text-rose-700', 'Bị khoá'],
    published: ['bg-emerald-100 text-emerald-700', 'Hiển thị'],
    draft: ['bg-slate-200 text-slate-600', 'Nháp'],
    open: ['bg-blue-100 text-blue-700', 'Đang mở'],
    closed: ['bg-slate-200 text-slate-600', 'Đã đóng']
  }
  const [cls, label] = map[status] || ['bg-slate-100 text-slate-600', status]
  return <span class={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${cls}`}>{label}</span>
}

export const PostCard: FC<{ p: any }> = ({ p }) => (
  <article class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition">
    <a href={`/blog/${p.slug}`} class="block aspect-[16/9] relative" style={`background:${gradientFor(p.id + 3)}`}>
      {p.thumbnail
        ? <img src={p.thumbnail} alt={p.title} loading="lazy" class="w-full h-full object-cover" />
        : <div class="w-full h-full grid place-items-center text-white/90 text-3xl"><i class="fas fa-newspaper"></i></div>}
    </a>
    <div class="p-4">
      <div class="text-[11px] text-slate-400 mb-2 flex items-center gap-3">
        <span><i class="far fa-calendar mr-1"></i>{formatDate(p.created_at)}</span>
        <span><i class="far fa-eye mr-1"></i>{p.view_count}</span>
      </div>
      <h3 class="font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-brand-600 transition">
        <a href={`/blog/${p.slug}`}>{p.title}</a>
      </h3>
      <p class="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">{p.excerpt}</p>
    </div>
  </article>
)
