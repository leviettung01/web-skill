import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { ProductCard, Breadcrumb, Pagination, EmptyState, SectionTitle } from '../components/ui'
import type { Product, Category } from '../lib/types'
import { formatVND, PRODUCT_TYPE_LABEL } from '../lib/utils'

interface ListProps extends LayoutProps {
  products: Product[]
  categories: Category[]
  total: number
  page: number
  totalPages: number
  q: string
  cat: string
  sort: string
  minPrice: string
  maxPrice: string
  type: string
  heading: string
  headingDesc?: string
  baseUrl: string
  currentCategory?: Category | null
}

const SORTS = [
  ['newest', 'Mới nhất'],
  ['bestseller', 'Bán chạy'],
  ['price_asc', 'Giá thấp → cao'],
  ['price_desc', 'Giá cao → thấp'],
  ['rating', 'Đánh giá cao'],
  ['featured', 'Nổi bật']
]

const TYPES: [string, string][] = [
  ['', 'Tất cả loại'],
  ['skill', 'Skill AI tự tải (Đang mở bán)'],
  ['mcp_skill', 'Skill AI Agent MCP (Đang mở bán)'],
  ['course', 'Khóa học (Sắp mở)'],
  ['chatbot', 'Chatbot (Sắp mở)'],
  ['app', 'App Video AI (Sắp mở)'],
  ['combo', 'Combo (Sắp mở)']
]

export const ProductListPage: FC<ListProps> = (props) => {
  const { products, categories, total, page, totalPages, q, cat, sort, minPrice, maxPrice, type,
    heading, headingDesc, baseUrl, currentCategory } = props
  const isMcpView = type === 'mcp_skill' || cat === 'skill-ai-agent-mcp' || currentCategory?.slug === 'skill-ai-agent-mcp'
  const isComingSoonView = baseUrl === '/combo'
    || ['course', 'chatbot', 'app', 'combo'].includes(type)
    || (!!currentCategory && currentCategory.slug !== 'skill-video-ai' && currentCategory.slug !== 'skill-ai-agent-mcp')

  return (
    <Layout {...props} active={isMcpView ? 'mcp_skill' : (baseUrl === '/combo' ? 'combo' : 'products')}
      title={heading} description={headingDesc}>
      <div class="bg-[#0f0e24] border-b border-[#221e54]">
        <div class="max-w-7xl mx-auto px-4 py-7">
          <Breadcrumb items={currentCategory
            ? [{ label: 'Sản phẩm', href: '/san-pham' }, { label: currentCategory.name }]
            : [{ label: heading }]} />
          <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{heading}</h1>
          {headingDesc && <p class="text-[#b8b6d9] mt-2 max-w-3xl text-sm leading-relaxed">{headingDesc}</p>}
          <div class="mt-3 text-sm text-[#9492b8] tabular-nums">Tìm thấy <b class="text-white">{total}</b> sản phẩm</div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar filters */}
          <aside class="space-y-5">
            <form action={baseUrl} method="get" id="filter-form" class="space-y-5">
              {sort && <input type="hidden" name="sort" value={sort} />}
              <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                <label for="filter-q" class="block font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Tìm kiếm</label>
                <div class="relative">
                  <input id="filter-q" type="text" name="q" value={q} placeholder="Tên sản phẩm..."
                    class="w-full h-11 pl-9 pr-3 rounded-lg bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-white placeholder-[#9492b8] outline-none text-sm transition" />
                  <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
                </div>
              </div>

              {baseUrl === '/san-pham' && (
                <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                  <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Danh mục</h3>
                  <div class="flex flex-wrap gap-1.5">
                    <a href="/san-pham" aria-current={!cat ? 'page' : undefined}
                      class={`px-3 py-2 rounded-full text-xs font-semibold transition border ${!cat ? 'bg-indigo-600 text-white border-transparent' : 'bg-[#161436] border-[#221e54] text-[#c2c0e0] hover:text-white hover:border-indigo-500/40'}`}>
                      Tất cả
                    </a>
                    {categories.map(c => (
                      <a href={`/san-pham?cat=${c.slug}`} aria-current={cat === c.slug ? 'page' : undefined}
                        class={`px-3 py-2 rounded-full text-xs font-semibold transition border ${cat === c.slug ? 'bg-indigo-600 text-white border-transparent' : 'bg-[#161436] border-[#221e54] text-[#c2c0e0] hover:text-white hover:border-indigo-500/40'}`}>
                        {c.name} <span class="opacity-70 tabular-nums">({c.product_count ?? 0})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                <label for="filter-type" class="block font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Loại sản phẩm</label>
                <select id="filter-type" name="type" class="w-full h-11 px-3 rounded-lg bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-white outline-none text-sm">
                  {TYPES.map(([v, l]) => <option class="bg-[#0f0e24] text-white" value={v} selected={type === v}>{l}</option>)}
                </select>
              </div>

              <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Khoảng giá</h3>
                <div class="flex items-center gap-2">
                  <label for="filter-min" class="sr-only">Giá từ</label>
                  <input id="filter-min" type="number" name="min" value={minPrice} placeholder="Từ" min="0" step="10000"
                    class="w-full h-11 px-3 rounded-lg bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-white outline-none text-sm tabular-nums" />
                  <span class="text-[#9492b8]" aria-hidden="true">–</span>
                  <label for="filter-max" class="sr-only">Giá đến</label>
                  <input id="filter-max" type="number" name="max" value={maxPrice} placeholder="Đến" min="0" step="10000"
                    class="w-full h-11 px-3 rounded-lg bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-white outline-none text-sm tabular-nums" />
                </div>
                <div class="flex flex-wrap gap-1.5 mt-3">
                  {[[0, 200000, '< 200k'], [200000, 500000, '200-500k'], [500000, 1000000, '500k-1tr'], [1000000, 0, '> 1tr']].map(([mn, mx, lb]) => (
                    <a href={`${baseUrl}?min=${mn}${mx ? '&max=' + mx : ''}`}
                      class="px-2.5 py-1.5 rounded-md bg-[#161436] border border-[#221e54] text-[#c2c0e0] hover:text-white hover:border-indigo-500/40 text-[11px] font-medium tabular-nums transition">{lb}</a>
                  ))}
                </div>
              </div>

              <div class="flex gap-2">
                <button type="submit" class="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-md shadow-indigo-600/15 cursor-pointer">
                  <i class="fas fa-filter mr-1.5" aria-hidden="true"></i>Lọc
                </button>
                <a href={baseUrl} class="h-11 px-4 grid place-items-center rounded-xl bg-[#161436] border border-[#221e54] hover:bg-white/10 text-[#c2c0e0] text-sm font-semibold transition">Xoá</a>
              </div>
            </form>

            <div class="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-600/15">
              <i class="fas fa-gift text-2xl mb-2.5 opacity-90" aria-hidden="true"></i>
              <h3 class="font-bold mb-1.5">Nhận mã giảm 10%</h3>
              <p class="text-xs text-white/90 mb-3.5 leading-relaxed">Dùng mã <b class="bg-white/20 px-1.5 py-0.5 rounded font-mono">WELCOME10</b> cho đơn đầu tiên từ 100k.</p>
              <button type="button" data-copy="WELCOME10" class="cta-white w-full h-10 rounded-lg bg-white text-indigo-700 font-bold text-xs hover:bg-slate-100 transition shadow-md cursor-pointer">
                <i class="far fa-copy mr-1" aria-hidden="true"></i>Sao chép mã
              </button>
            </div>
          </aside>

          {/* Grid */}
          <div>
            {baseUrl === '/san-pham' && (
              <div class="flex flex-wrap items-center gap-2 mb-5">
                <a href="/san-pham"
                  class={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition ${!type && !cat ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' : 'bg-[#0f0e24] border-[#221e54] text-[#c2c0e0] hover:text-white hover:border-indigo-500/40'}`}>
                  <i class="fas fa-cubes text-[11px]" aria-hidden="true"></i>Tất cả đang bán
                </a>
                <a href="/san-pham?type=skill"
                  class={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition ${type === 'skill' || cat === 'skill-video-ai' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' : 'bg-[#0f0e24] border-[#221e54] text-[#c2c0e0] hover:text-white hover:border-indigo-500/40'}`}>
                  <i class="fas fa-download text-[11px]" aria-hidden="true"></i>Skill AI tự tải
                </a>
                <a href="/san-pham?type=mcp_skill"
                  class={`h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition ${isMcpView ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 shadow-md shadow-cyan-600/25' : 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20 hover:text-white'}`}>
                  <i class="fas fa-plug-circle-bolt text-[11px]" aria-hidden="true"></i>Skill AI Agent (MCP)
                  <span class="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 text-[9px] font-black leading-none">MỚI</span>
                </a>
              </div>
            )}
            {isMcpView && (
              <div class="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#121134] to-indigo-950/60 border border-cyan-400/40 flex flex-wrap items-center justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <div class="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                    <i class="fas fa-plug-circle-bolt" aria-hidden="true"></i>Skill AI Agent · Kết nối trực tiếp MCP
                  </div>
                  <p class="text-xs sm:text-sm text-[#d6d4ee] leading-relaxed">
                    Khác với dòng Skill tự tải về làm thủ công: dòng này kết nối thẳng qua <b>MCP</b> vào <b>Claude, Codex, Antigravity</b> bằng License Key để AI Agent tự gọi tool và tạo video theo Skill ngay.
                  </p>
                </div>
                <div class="flex flex-wrap gap-1.5 shrink-0">
                  {['Claude', 'Codex', 'Antigravity'].map(cl => (
                    <span class="px-2.5 py-1 rounded-lg bg-[#070614]/80 border border-cyan-400/35 text-cyan-200 text-[11px] font-bold">{cl}</span>
                  ))}
                </div>
              </div>
            )}
            {isComingSoonView && (
              <div class="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex flex-wrap items-center justify-between gap-3">
                <div class="text-xs sm:text-sm text-amber-200 leading-relaxed">
                  <i class="fas fa-clock text-amber-400 mr-2" aria-hidden="true"></i>
                  <b>Hạng mục này tạm thời chưa mở bán.</b> Hiện tại cửa hàng đang mở bán dòng <b>Skill AI (tự tải)</b> và <b>Skill AI Agent (MCP)</b>.
                </div>
                <a href="/san-pham" class="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shrink-0">
                  Xem Skill đang bán →
                </a>
              </div>
            )}
            <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div class="flex flex-wrap gap-1.5">
                {q && <span class="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 text-xs font-semibold">Từ khoá: {q}</span>}
                {cat && <span class="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 text-xs font-semibold">{categories.find(c => c.slug === cat)?.name}</span>}
                {type && <span class="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 text-xs font-semibold">{TYPES.find(t => t[0] === type)?.[1]}</span>}
                {(minPrice || maxPrice) && <span class="px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 text-xs font-semibold tabular-nums">
                  {minPrice ? formatVND(+minPrice) : '0đ'} – {maxPrice ? formatVND(+maxPrice) : '∞'}
                </span>}
              </div>
              <form action={baseUrl} method="get" class="flex items-center gap-2 ml-auto">
                {q && <input type="hidden" name="q" value={q} />}
                {cat && <input type="hidden" name="cat" value={cat} />}
                {type && <input type="hidden" name="type" value={type} />}
                {minPrice && <input type="hidden" name="min" value={minPrice} />}
                {maxPrice && <input type="hidden" name="max" value={maxPrice} />}
                <label for="sort-select" class="text-xs text-[#9492b8] whitespace-nowrap">Sắp xếp:</label>
                <select id="sort-select" name="sort" data-auto-submit class="h-10 px-3 pr-8 rounded-lg bg-[#161436] border border-[#2a2559] text-white outline-none text-xs focus:border-indigo-500">
                  {SORTS.map(([v, l]) => <option class="bg-[#0f0e24] text-white" value={v} selected={sort === v}>{l}</option>)}
                </select>
              </form>
            </div>

            {products.length === 0 ? (
              <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
                <EmptyState icon="fa-magnifying-glass" title="Không tìm thấy sản phẩm nào"
                  desc="Thử thay đổi từ khoá hoặc bộ lọc để tìm sản phẩm phù hợp hơn."
                  action={{ href: baseUrl, label: 'Xoá bộ lọc' }} />
              </div>
            ) : (
              <>
                <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map(p => <ProductCard p={p} />)}
                </div>
                <Pagination page={page} totalPages={totalPages} baseUrl={
                  baseUrl + '?' + new URLSearchParams(
                    Object.entries({ q, cat, sort, type, min: minPrice, max: maxPrice }).filter(([, v]) => v) as any
                  ).toString()
                } />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
