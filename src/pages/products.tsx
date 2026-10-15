import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { ProductCard, Breadcrumb, Pagination, EmptyState, SectionTitle } from '../components/ui'
import type { Product, Category } from '../lib/types'
import { formatVND } from '../lib/utils'

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

const TYPES = [
  ['', 'Tất cả loại'],
  ['source', 'Source Code'],
  ['chatbot', 'Chatbot'],
  ['prompt', 'Bộ Prompt'],
  ['tool', 'Phần mềm'],
  ['combo', 'Combo']
]

export const ProductListPage: FC<ListProps> = (props) => {
  const { products, categories, total, page, totalPages, q, cat, sort, minPrice, maxPrice, type,
    heading, headingDesc, baseUrl, currentCategory } = props

  return (
    <Layout {...props} active={currentCategory ? 'products' : (baseUrl === '/combo' ? 'combo' : 'products')}
      title={heading} description={headingDesc}>
      <div class="bg-[#0f0e26] border-b border-[#1f1b4b]">
        <div class="max-w-7xl mx-auto px-4 py-7">
          <Breadcrumb items={currentCategory
            ? [{ label: 'Sản phẩm', href: '/san-pham' }, { label: currentCategory.name }]
            : [{ label: heading }]} />
          <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{heading}</h1>
          {headingDesc && <p class="text-[#9f9dbb] mt-2 max-w-3xl text-sm leading-relaxed">{headingDesc}</p>}
          <div class="mt-3 text-sm text-[#9f9dbb]">Tìm thấy <b class="text-white">{total}</b> sản phẩm</div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar filters */}
          <aside class="space-y-5">
            <form action={baseUrl} method="get" id="filter-form" class="space-y-5">
              {sort && <input type="hidden" name="sort" value={sort} />}
              <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
                <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Tìm kiếm</h3>
                <div class="relative">
                  <input type="text" name="q" value={q} placeholder="Tên sản phẩm..."
                    class="w-full h-10 pl-9 pr-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white placeholder-slate-500 outline-none text-sm transition" />
                  <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                </div>
              </div>

              {baseUrl === '/san-pham' && (
                <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
                  <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Danh mục</h3>
                  <div class="flex flex-wrap gap-1.5">
                    <a href="/san-pham" class={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${!cat ? 'bg-indigo-600 text-white border-transparent' : 'bg-[#16143c]/80 border-[#1f1b4b] text-slate-300 hover:text-white hover:border-[#2e2a5e]'}`}>
                      Tất cả
                    </a>
                    {categories.map(c => (
                      <a href={`/san-pham?cat=${c.slug}`} class={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${cat === c.slug ? 'bg-indigo-600 text-white border-transparent' : 'bg-[#16143c]/80 border-[#1f1b4b] text-slate-300 hover:text-white hover:border-[#2e2a5e]'}`}>
                        {c.name} <span class="opacity-60">({c.product_count ?? 0})</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
                <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Loại sản phẩm</h3>
                <select name="type" class="w-full h-10 px-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white outline-none text-sm">
                  {TYPES.map(([v, l]) => <option class="bg-[#0f0e26] text-white" value={v} selected={type === v}>{l}</option>)}
                </select>
              </div>

              <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
                <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Khoảng giá</h3>
                <div class="flex items-center gap-2">
                  <input type="number" name="min" value={minPrice} placeholder="Từ" min="0" step="10000"
                    class="w-full h-10 px-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white outline-none text-sm" />
                  <span class="text-slate-500">–</span>
                  <input type="number" name="max" value={maxPrice} placeholder="Đến" min="0" step="10000"
                    class="w-full h-10 px-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white outline-none text-sm" />
                </div>
                <div class="flex flex-wrap gap-1.5 mt-3">
                  {[[0, 200000, '< 200k'], [200000, 500000, '200-500k'], [500000, 1000000, '500k-1tr'], [1000000, 0, '> 1tr']].map(([mn, mx, lb]) => (
                    <a href={`${baseUrl}?min=${mn}${mx ? '&max=' + mx : ''}`}
                      class="px-2.5 py-1 rounded-md bg-[#16143c] border border-[#1f1b4b] text-slate-300 hover:text-white hover:border-indigo-500/30 text-[11px] font-medium transition">{lb}</a>
                  ))}
                </div>
              </div>

              <div class="flex gap-2">
                <button type="submit" class="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-md shadow-indigo-600/10">
                  <i class="fas fa-filter mr-1.5"></i>Lọc
                </button>
                <a href={baseUrl} class="h-10 px-4 grid place-items-center rounded-xl bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] text-sm font-semibold transition">Xoá</a>
              </div>
            </form>

            <div class="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-600/10">
              <i class="fas fa-gift text-2xl mb-2.5 opacity-90"></i>
              <h3 class="font-bold mb-1.5">Nhận mã giảm 10%</h3>
              <p class="text-xs text-white/85 mb-3.5 leading-relaxed">Dùng mã <b class="bg-white/20 px-1.5 py-0.5 rounded font-mono">WELCOME10</b> cho đơn đầu tiên từ 100k.</p>
              <button data-copy="WELCOME10" class="w-full h-9 rounded-lg bg-white text-indigo-700 font-bold text-xs hover:bg-slate-100 transition shadow-md">
                <i class="far fa-copy mr-1"></i>Sao chép mã
              </button>
            </div>
          </aside>

          {/* Grid */}
          <div>
            <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div class="flex flex-wrap gap-1.5">
                {q && <span class="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold">Từ khoá: {q}</span>}
                {cat && <span class="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold">{categories.find(c => c.slug === cat)?.name}</span>}
                {type && <span class="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold">{TYPES.find(t => t[0] === type)?.[1]}</span>}
                {(minPrice || maxPrice) && <span class="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
                  {minPrice ? formatVND(+minPrice) : '0đ'} – {maxPrice ? formatVND(+maxPrice) : '∞'}
                </span>}
              </div>
              <form action={baseUrl} method="get" class="flex items-center gap-2 ml-auto">
                {q && <input type="hidden" name="q" value={q} />}
                {cat && <input type="hidden" name="cat" value={cat} />}
                {type && <input type="hidden" name="type" value={type} />}
                {minPrice && <input type="hidden" name="min" value={minPrice} />}
                {maxPrice && <input type="hidden" name="max" value={maxPrice} />}
                <label class="text-xs text-[#9f9dbb] whitespace-nowrap">Sắp xếp:</label>
                <select name="sort" data-auto-submit class="h-9 px-3 pr-8 rounded-lg bg-[#16143c] border border-transparent text-white outline-none text-xs focus:border-indigo-500/50">
                  {SORTS.map(([v, l]) => <option class="bg-[#0f0e26] text-white" value={v} selected={sort === v}>{l}</option>)}
                </select>
              </form>
            </div>

            {products.length === 0 ? (
              <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b]">
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
