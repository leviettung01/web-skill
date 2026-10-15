import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { ProductCard, CategoryCard, SectionTitle, PostCard, Stars } from '../components/ui'
import { formatVND } from '../lib/utils'
import type { Product, Category } from '../lib/types'

interface Props extends LayoutProps {
  categories: Category[]
  featured: Product[]
  hot: Product[]
  newest: Product[]
  combos: Product[]
  posts: any[]
  reviews: any[]
  stats: { products: number; users: number; sold: number }
}

const BENEFITS = [
  { icon: 'fa-bolt', title: 'Giao hàng tự động 24/7', desc: 'Thanh toán xong nhận link source code ngay lập tức trong tài khoản, không cần chờ admin.' },
  { icon: 'fa-infinity', title: 'Sở hữu trọn đời', desc: 'Mua một lần dùng mãi mãi, không phí ẩn, không giới hạn thời gian, nhận update miễn phí.' },
  { icon: 'fa-code', title: 'Full source, không mã hoá', desc: 'Bàn giao toàn bộ mã nguồn sạch, có comment tiếng Việt, tự do chỉnh sửa theo ý bạn.' },
  { icon: 'fa-headset', title: 'Hỗ trợ kỹ thuật 1-1', desc: 'Đội ngũ dev hỗ trợ cài đặt qua Zalo/Ultraview, cam kết chạy được mới thôi.' },
  { icon: 'fa-shield-halved', title: 'Bảo hành & hoàn tiền', desc: 'Hoàn tiền 100% trong 7 ngày nếu sản phẩm không đúng như mô tả.' },
  { icon: 'fa-rocket', title: 'Cập nhật liên tục', desc: 'Sản phẩm được nâng cấp theo API mới của Veo 3, Kling, Runway... hoàn toàn miễn phí.' }
]

const STEPS = [
  { n: '01', icon: 'fa-user-plus', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản miễn phí chỉ với email trong 30 giây.' },
  { n: '02', icon: 'fa-cart-shopping', title: 'Chọn sản phẩm', desc: 'Xem demo, đọc mô tả chi tiết rồi thêm vào giỏ hàng.' },
  { n: '03', icon: 'fa-qrcode', title: 'Thanh toán QR', desc: 'Quét mã VietQR chuyển khoản, hệ thống xác nhận nhanh chóng.' },
  { n: '04', icon: 'fa-download', title: 'Nhận source code', desc: 'Link tải + license key xuất hiện ngay trong "Sản phẩm của tôi".' }
]

const FAQS = [
  { q: 'Mua source code có được chỉnh sửa và bán lại không?', a: 'Bạn được toàn quyền chỉnh sửa, sử dụng cho dự án cá nhân và kinh doanh dịch vụ. Tuy nhiên không được bán lại nguyên bản source code cho bên thứ ba.' },
  { q: 'Tôi không biết code thì có dùng được không?', a: 'Có. Mỗi sản phẩm đều kèm tài liệu cài đặt từng bước có hình ảnh và video hướng dẫn. Ngoài ra chúng tôi hỗ trợ cài đặt 1-1 qua Ultraview nếu bạn cần.' },
  { q: 'Chatbot kịch bản hoạt động như thế nào?', a: 'Sau khi mua, bạn nhận được link chatbot GPT/Gemini riêng. Chỉ cần bấm Start, chọn chủ đề là chatbot sẽ sinh ra 6 prompt tạo ảnh và 6 prompt tạo video hoàn chỉnh để bạn dán vào Veo 3 hoặc Flow.' },
  { q: 'Thanh toán xong bao lâu thì nhận được hàng?', a: 'Hệ thống giao tự động. Ngay khi đơn hàng được xác nhận thanh toán, link source code và license key sẽ xuất hiện trong mục "Sản phẩm của tôi".' },
  { q: 'Có được hỗ trợ khi gặp lỗi không?', a: 'Có. Mỗi sản phẩm đi kèm 6-12 tháng hỗ trợ kỹ thuật qua Zalo. Với gói Combo All-In-One bạn còn được 2 buổi setup 1-1 trực tiếp.' },
  { q: 'Tôi có thể dùng cho nhiều domain không?', a: 'Với source code, bạn được cài không giới hạn số domain cho mục đích sử dụng của chính bạn.' }
]

export const HomePage: FC<Props> = (props) => {
  const { categories, featured, hot, newest, combos, posts, reviews, stats } = props
  return (
    <Layout {...props} active="home">
      {/* ============ HERO ============ */}
      <section id="hero-section" class="relative bg-slate-950 text-white overflow-hidden">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="absolute inset-0 hero-grid"></div>
        <div class="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-semibold mb-6">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Đã có <b class="text-emerald-300">{stats.sold.toLocaleString('vi-VN')}+</b> lượt mua thành công
              </div>
              <h1 class="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5">
                Kho <span class="bg-gradient-to-r from-brand-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Source Code &amp; Tool AI</span> tạo video số 1 Việt Nam
              </h1>
              <p class="text-slate-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                Full source code tool tạo video AI, chatbot viết kịch bản, bộ prompt Veo 3 chuẩn điện ảnh.
                Mua một lần — sở hữu trọn đời — giao source tự động 24/7.
              </p>
              <div class="flex flex-wrap gap-3 mb-9">
                <a href="/san-pham" class="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-fuchsia-500 font-semibold shadow-xl shadow-brand-500/30 hover:opacity-90 transition">
                  <i class="fas fa-cubes"></i>Xem tất cả sản phẩm
                </a>
                <a href="/combo" class="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur font-semibold hover:bg-white/20 transition">
                  <i class="fas fa-box-open"></i>Combo giảm 60%
                </a>
              </div>
              <div class="grid grid-cols-3 gap-4 max-w-md">
                {[
                  ['fa-cube', stats.products + '+', 'Sản phẩm'],
                  ['fa-users', stats.users.toLocaleString('vi-VN') + '+', 'Khách hàng'],
                  ['fa-star', '4.9/5', 'Đánh giá']
                ].map(([icon, num, label]) => (
                  <div class="text-center p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                    <i class={`fas ${icon} text-brand-400 mb-1.5`}></i>
                    <div class="text-xl font-extrabold">{num}</div>
                    <div class="text-[11px] text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card preview */}
            <div class="relative hidden lg:block">
              <div class="animate-float">
                <div class="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-2xl">
                  <div class="flex items-center gap-2 mb-4">
                    <span class="w-3 h-3 rounded-full bg-rose-400"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <span class="ml-2 text-xs text-slate-400">srctool.ai — AI Video Studio</span>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    {['fa-film', 'fa-robot', 'fa-wand-magic-sparkles', 'fa-gears'].map((ic, i) => (
                      <div class="aspect-video rounded-xl grid place-items-center text-white/90 text-2xl"
                        style={`background:linear-gradient(135deg,${['#6366f1,#a855f7', '#8b5cf6,#ec4899', '#06b6d4,#3b82f6', '#f59e0b,#ef4444'][i]})`}>
                        <i class={`fas ${ic}`}></i>
                      </div>
                    ))}
                  </div>
                  <div class="mt-4 space-y-2">
                    <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 grid place-items-center text-xs"><i class="fas fa-check"></i></div>
                      <span class="text-xs text-slate-300">Render video 8s hoàn tất</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="absolute -bottom-5 -left-6 bg-[#0f0e26] border border-[#1f1b4b] text-white rounded-xl shadow-2xl p-3.5 flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 grid place-items-center"><i class="fas fa-download"></i></div>
                <div>
                  <div class="text-xs text-slate-400">Giao source code</div>
                  <div class="font-bold text-sm">Tự động &lt; 1 phút</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust marquee */}
        <div class="relative border-t border-white/5 bg-[#080716]/60 backdrop-blur py-4 marquee-wrap overflow-hidden">
          <div class="marquee-track flex gap-10 w-max text-slate-500 text-sm font-semibold whitespace-nowrap">
            {[...Array(2)].map(() => (
              <>
                {['Veo 3', 'Google Flow', 'Kling AI', 'Runway ML', 'ChatGPT', 'Gemini', 'Midjourney', 'CapCut', 'Luma AI', 'Sora'].map(b => (
                  <span class="flex items-center gap-2"><i class="fas fa-circle-nodes text-indigo-500/60"></i>{b}</span>
                ))}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section id="categories-section" class="max-w-7xl mx-auto px-4 py-14 reveal">
        <SectionTitle title="Danh mục sản phẩm" subtitle="Chọn đúng công cụ bạn cần cho hành trình làm video AI" more={{ href: '/san-pham', label: 'Tất cả' }} />
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {categories.map(c => <CategoryCard c={c} />)}
        </div>
      </section>

      {/* ============ FEATURED ============ */}
      {featured.length > 0 && (
        <section id="featured-section" class="max-w-7xl mx-auto px-4 py-8 reveal">
          <SectionTitle title="Sản phẩm nổi bật" subtitle="Được lựa chọn nhiều nhất bởi cộng đồng làm video AI" more={{ href: '/san-pham?sort=featured', label: 'Xem thêm' }} />
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featured.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </section>
      )}

      {/* ============ COMBO BANNER ============ */}
      {combos.length > 0 && (
        <section id="combo-section" class="max-w-7xl mx-auto px-4 py-10 reveal">
          <div class="rounded-3xl bg-gradient-to-br from-[#0f0e26] via-[#1a184c] to-[#080716] p-7 md:p-10 text-white relative overflow-hidden border border-[#1f1b4b]">
            <div class="absolute inset-0 hero-mesh opacity-40"></div>
            <div class="relative">
              <div class="flex flex-wrap items-end justify-between gap-4 mb-7">
                <div>
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-xs font-bold mb-3 pulse-ring">
                    <i class="fas fa-fire"></i>TIẾT KIỆM ĐẾN 60%
                  </div>
                  <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">Combo trọn bộ — giá cực hời</h2>
                  <p class="text-[#9f9dbb] mt-1.5 text-sm md:text-base">Mua gói thay vì mua lẻ, tiết kiệm hàng triệu đồng</p>
                </div>
                <a href="/combo" class="h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition">
                  Xem tất cả combo<i class="fas fa-arrow-right text-xs"></i>
                </a>
              </div>
              <div class="grid md:grid-cols-3 gap-4">
                {combos.slice(0, 3).map(c => {
                  const off = c.original_price ? Math.round(((c.original_price - c.price) / c.original_price) * 100) : 0
                  return (
                    <a href={`/san-pham/${c.slug}`} class="group p-5 rounded-2xl bg-[#080716]/60 backdrop-blur border border-[#1f1b4b] hover:bg-white/5 transition">
                      <div class="flex items-start justify-between gap-2 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-300 grid place-items-center"><i class="fas fa-box-open"></i></div>
                        {off > 0 && <span class="px-2 py-0.5 rounded bg-rose-500 text-[11px] font-bold">-{off}%</span>}
                      </div>
                      <h3 class="font-bold leading-snug mb-2 line-clamp-2 group-hover:text-indigo-400 transition">{c.name}</h3>
                      <p class="text-xs text-[#9f9dbb] line-clamp-2 mb-3.5 leading-relaxed">{c.short_desc}</p>
                      <div class="flex items-center gap-2">
                        <span class="text-base font-extrabold text-amber-400">{formatVND(c.price)}</span>
                        {c.original_price && <span class="text-xs text-slate-500 line-through">{formatVND(c.original_price)}</span>}
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ HOT + NEW tabs ============ */}
      <section id="hot-new-section" class="max-w-7xl mx-auto px-4 py-8 reveal">
        <div class="flex items-center gap-1 border-b border-[#1f1b4b] mb-7">
          <button class="tab-btn active px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 transition" data-tab="hot" data-group="hp">
            <i class="fas fa-fire mr-1.5 text-orange-500"></i>Bán chạy nhất
          </button>
          <button class="tab-btn px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 transition" data-tab="new" data-group="hp">
            <i class="fas fa-sparkles mr-1.5 text-indigo-400"></i>Mới ra mắt
          </button>
        </div>
        <div class="tab-panel" data-tab="hot" data-group="hp">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hot.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </div>
        <div class="tab-panel hidden" data-tab="new" data-group="hp">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {newest.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </div>
      </section>

      {/* ============ BENEFITS ============ */}
      <section id="benefits-section" class="bg-[#0f0e26]/60 border-y border-[#1f1b4b] py-16 mt-10 reveal">
        <div class="max-w-7xl mx-auto px-4">
          <SectionTitle center title="Lợi ích khi mua tại SrcTool AI" subtitle="Trải nghiệm tuyệt vời cùng những ưu điểm vượt trội" />
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {BENEFITS.map(b => (
              <div class="p-6 rounded-2xl border border-[#1f1b4b] bg-[#0f0e26] hover:border-indigo-500/20 hover:shadow-lg transition group">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-lg mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition">
                  <i class={`fas ${b.icon}`}></i>
                </div>
                <h3 class="font-bold text-white mb-1.5">{b.title}</h3>
                <p class="text-sm text-[#9f9dbb] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-section" class="max-w-7xl mx-auto px-4 py-16 reveal">
        <SectionTitle center title="Mua hàng chỉ 4 bước" subtitle="Đơn giản, nhanh chóng, nhận source code ngay lập tức" />
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8 relative">
          {STEPS.map((s, i) => (
            <div class="relative p-6 rounded-2xl bg-[#0f0e26] border border-[#1f1b4b] text-center">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-800 text-white text-xs font-bold">{s.n}</div>
              <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center text-xl mx-auto mt-2 mb-4">
                <i class={`fas ${s.icon}`}></i>
              </div>
              <h3 class="font-bold text-white mb-1.5">{s.title}</h3>
              <p class="text-[13px] text-[#9f9dbb] leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <i class="fas fa-arrow-right absolute top-1/2 -right-4 text-slate-600 hidden lg:block"></i>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ REVIEWS ============ */}
      {reviews.length > 0 && (
        <section id="reviews-section" class="bg-[#0f0e26] border-y border-[#1f1b4b] py-16 reveal">
          <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-10">
              <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Khách hàng nói gì?</h2>
              <p class="text-slate-400 mt-2">Cảm nhận từ những người đã trải nghiệm sản phẩm của chúng tôi</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map(r => (
                <div class="p-6 rounded-2xl bg-[#080716]/80 border border-[#1f1b4b]">
                  <Stars rating={r.rating} size="text-sm" />
                  <p class="text-slate-300 text-sm leading-relaxed my-4">"{r.comment}"</p>
                  <div class="flex items-center gap-3 pt-4 border-t border-[#1f1b4b]">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-sm">
                      {(r.full_name || 'K').charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-white text-sm truncate">{r.full_name}</div>
                      <a href={`/san-pham/${r.product_slug}`} class="text-xs text-slate-400 truncate block hover:text-indigo-400">{r.product_name}</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ BLOG ============ */}
      {posts.length > 0 && (
        <section id="blog-section" class="max-w-7xl mx-auto px-4 py-16 reveal">
          <SectionTitle title="Kiến thức làm video AI" subtitle="Hướng dẫn, mẹo hay và case study thực tế" more={{ href: '/blog', label: 'Tất cả bài viết' }} />
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {posts.slice(0, 4).map(p => <PostCard p={p} />)}
          </div>
        </section>
      )}

      {/* ============ FAQ ============ */}
      <section id="faq-section" class="bg-[#080716] border-t border-[#1f1b4b] py-16 reveal">
        <div class="max-w-3xl mx-auto px-4">
          <SectionTitle center title="Câu hỏi thường gặp" subtitle="Những thắc mắc phổ biến nhất từ khách hàng" />
          <div class="space-y-3 mt-8">
            {FAQS.map((f, i) => (
              <div class="rounded-xl border border-[#1f1b4b] bg-[#0f0e26] overflow-hidden">
                <button class="faq-q w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition">
                  <span class="font-semibold text-white text-[15px]">{f.q}</span>
                  <i class="faq-icon fas fa-plus text-indigo-500 text-sm transition-transform shrink-0"></i>
                </button>
                <div class={`faq-a px-5 pb-4 text-sm text-[#9f9dbb] leading-relaxed ${i === 0 ? '' : 'hidden'}`}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section id="cta-section" class="max-w-7xl mx-auto px-4 py-14 reveal">
        <div class="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-fuchsia-600 p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-600/10">
          <div class="absolute inset-0 hero-grid opacity-20"></div>
          <div class="relative">
            <h2 class="text-2xl md:text-4xl font-extrabold mb-3 tracking-tight">Sẵn sàng bắt đầu kiếm tiền với video AI?</h2>
            <p class="text-white/85 mb-7 max-w-2xl mx-auto">Tham gia cùng hàng nghìn người đang dùng công cụ của chúng tôi để sản xuất video bán hàng mỗi ngày.</p>
            <div class="flex flex-wrap justify-center gap-3">
              <a href="/dang-ky" class="h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 font-bold hover:bg-slate-100 transition shadow-xl">
                <i class="fas fa-user-plus"></i>Đăng ký miễn phí
              </a>
              <a href="/san-pham" class="h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/30 backdrop-blur font-semibold hover:bg-white/25 transition">
                <i class="fas fa-eye"></i>Xem sản phẩm
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
