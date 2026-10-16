import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { Breadcrumb, ProductCard, Stars, SectionTitle } from '../components/ui'
import { formatVND, discountPercent, parseJSON, gradientFor, PRODUCT_TYPE_LABEL, PRODUCT_TYPE_ICON, formatDate } from '../lib/utils'
import type { Product } from '../lib/types'

interface Props extends LayoutProps {
  product: Product
  related: Product[]
  comboItems: Product[]
  reviews: any[]
  owned: boolean
  inWishlist: boolean
  canReview: boolean
  ratingBreakdown: Record<number, number>
}

export const ProductDetailPage: FC<Props> = (props) => {
  const { product: p, related, comboItems, reviews, owned, inWishlist, canReview, ratingBreakdown, user, settings } = props
  const off = discountPercent(p.price, p.original_price)
  const features = parseJSON<string[]>(p.features, [])
  const tech = parseJSON<string[]>(p.tech_stack, [])
  const gallery = parseJSON<string[]>(p.gallery, [])
  const save = (p.original_price || 0) - p.price

  const isMp4 = !!p.demo_video_url && /\.mp4(\?|$)/i.test(p.demo_video_url)
  const demoPoster = isMp4 ? p.demo_video_url!.replace(/\/videos\/demo-(.+)\.mp4/i, '/videos/posters/poster-$1.jpg') : undefined

  return (
    <Layout {...props} active="products" title={p.name} description={p.short_desc} ogImage={p.thumbnail || undefined}>
      <div class="bg-[#0f0e26] border-b border-[#1f1b4b]">
        <div class="max-w-7xl mx-auto px-4 pt-6 pb-8">
          <Breadcrumb items={[
            { label: 'Sản phẩm', href: '/san-pham' },
            ...(p.category_slug ? [{ label: p.category_name!, href: `/danh-muc/${p.category_slug}` }] : []),
            { label: p.name }
          ]} />

          <div class="grid lg:grid-cols-[1fr_1.1fr] gap-8 mt-4">
            {/* COLUMN 1: Vertical Video Player / Media & Specs Grid */}
            <div>
              {p.demo_video_url ? (
                /* Vertical Phone Mockup Player */
                <div class="vertical-player-wrapper mx-auto mb-4 border-4 border-[#1f1b4b] shadow-2xl relative">
                  <div class="video-mockup-overlay">
                    <div class="video-mockup-header">
                      <span class="text-xs font-semibold text-white tracking-wider bg-black/40 px-2.5 py-1 rounded">VIDEO DEMO</span>
                      <div class="video-mockup-actions">
                        <button class="video-mockup-btn btn-vol" title="Âm thanh"><i class="fas fa-volume-up"></i></button>
                      </div>
                    </div>
                    <div class="video-mockup-footer">
                      <div class="video-mockup-info">
                        <p class="text-sm font-bold text-white">@webskill.ai</p>
                        <p class="text-xs text-white/90 mt-1 line-clamp-1">{p.name}</p>
                      </div>
                    </div>
                  </div>
                  {isMp4 ? (
                    <video src={p.demo_video_url} poster={demoPoster} class="w-full h-full border-none bg-black" controls playsinline preload="metadata"></video>
                  ) : (
                    <iframe src={p.demo_video_url} class="w-full h-full border-none" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                  )}
                </div>
              ) : p.thumbnail ? (
                <div class="rounded-2xl overflow-hidden border border-[#1f1b4b] bg-[#080716] aspect-[10/16] relative shadow-lg">
                  <img src={p.thumbnail} alt={p.name} class="w-full h-full object-cover" />
                </div>
              ) : (
                <div class="rounded-2xl overflow-hidden border border-[#1f1b4b] bg-[#080716] aspect-[10/16] grid place-items-center text-white/95 relative shadow-lg"
                  style={`background:${gradientFor(p.id)}`}>
                  <div class="text-center p-4">
                    <i class={`fas ${PRODUCT_TYPE_ICON[p.product_type] || 'fa-cube'} text-6xl mb-3 opacity-90`}></i>
                    <div class="text-sm font-bold uppercase tracking-[0.2em] opacity-80">{PRODUCT_TYPE_LABEL[p.product_type]}</div>
                  </div>
                </div>
              )}

              {gallery.length > 0 && (
                <div class="grid grid-cols-4 gap-2.5 mt-3">
                  {gallery.slice(0, 8).map((g, i) => (
                    <img src={g} alt={`${p.name} ảnh ${i + 1}`} loading="lazy"
                      class="aspect-[9/16] object-cover rounded-lg border border-[#1f1b4b] cursor-pointer hover:border-indigo-500 transition" />
                  ))}
                </div>
              )}

              {/* Specs Grid boards */}
              <div class="grid grid-cols-2 gap-3 mt-5">
                <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 grid place-items-center text-sm shrink-0"><i class="fas fa-bolt"></i></div>
                  <div>
                    <div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Giao hàng</div>
                    <div class="text-xs font-bold text-white">Tự động 24/7</div>
                  </div>
                </div>
                <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center text-sm shrink-0"><i class="fas fa-cubes"></i></div>
                  <div>
                    <div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Nội dung</div>
                    <div class="text-xs font-bold text-white">Full tài liệu + HDSD</div>
                  </div>
                </div>
                <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 grid place-items-center text-sm shrink-0"><i class="fas fa-infinity"></i></div>
                  <div>
                    <div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Truy cập</div>
                    <div class="text-xs font-bold text-white">Trọn đời + update free</div>
                  </div>
                </div>
                <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 grid place-items-center text-sm shrink-0"><i class="fas fa-headset"></i></div>
                  <div>
                    <div class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Hỗ trợ</div>
                    <div class="text-xs font-bold text-white">1-1 qua Zalo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Product info, Urgency Scarcity, Call to Action */}
            <div class="flex flex-col justify-start">
              <div class="flex flex-wrap items-center gap-2 mb-3">
                <span class="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold">{PRODUCT_TYPE_LABEL[p.product_type]}</span>
                {p.category_name && <a href={`/danh-muc/${p.category_slug}`} class="px-2.5 py-1 rounded bg-[#16143c] text-slate-300 text-xs font-medium hover:text-white hover:bg-white/5 transition">{p.category_name}</a>}
                {p.is_hot === 1 && <span class="px-2.5 py-1 rounded bg-orange-500/15 text-orange-400 text-xs font-bold"><i class="fas fa-fire mr-1 animate-pulse"></i>HOT</span>}
                {p.is_new === 1 && <span class="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-bold">MỚI</span>}
              </div>

              <h1 class="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight mb-3 glow-text-brand">{p.name}</h1>

              <div class="flex flex-wrap items-center gap-4 text-xs mb-4">
                <a href="#reviews" class="flex items-center gap-1.5">
                  <Stars rating={p.rating} size="text-xs" />
                  <b class="text-white text-sm">{p.rating.toFixed(1)}</b>
                  <span class="text-slate-400">({p.rating_count} đánh giá)</span>
                </a>
                <span class="text-[#1f1b4b]">|</span>
                <span class="text-slate-400"><i class="fas fa-cart-shopping mr-1 text-slate-500"></i>{p.sold_count} đã bán</span>
                <span class="text-[#1f1b4b]">|</span>
                <span class="text-slate-400"><i class="fas fa-eye mr-1 text-slate-500"></i>{p.view_count} xem</span>
              </div>

              <p class="text-[#9f9dbb] text-sm leading-relaxed mb-5">{p.short_desc}</p>

              {/* Pricing Box - Glowing container */}
              <div class="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#0f0e26] via-[#1a184c]/50 to-[#0b0a19] p-5 mb-4 glow-brand relative overflow-hidden">
                <div class="flex items-end flex-wrap gap-3 mb-1.5">
                  <span class="text-3xl md:text-4xl font-extrabold text-[#f43f5e] leading-none">{formatVND(p.price)}</span>
                  {p.original_price && p.original_price > p.price && (
                    <>
                      <span class="text-base text-slate-500 line-through leading-none">{formatVND(p.original_price)}</span>
                      <span class="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold">-{off}%</span>
                    </>
                  )}
                </div>
                {save > 0 && <div class="text-xs text-emerald-400 font-bold flex items-center gap-1"><i class="fas fa-piggy-bank text-sm"></i>Tiết kiệm {formatVND(save)}</div>}
                <div class="mt-4 pt-3 border-t border-indigo-500/20 text-[11px] text-[#9f9dbb] flex flex-wrap gap-x-4 gap-y-1.5">
                  <span><i class="fas fa-infinity text-indigo-400 mr-1"></i>Sở hữu trọn đời</span>
                  <span><i class="fas fa-bolt text-indigo-400 mr-1"></i>Giao tự động</span>
                  <span><i class="fas fa-rotate-left text-indigo-400 mr-1"></i>Hoàn tiền 7 ngày</span>
                </div>
              </div>

              {/* Scarcity Progress Bar */}
              <div class="mb-5 bg-[#16143c]/60 border border-[#1f1b4b] p-4 rounded-xl">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="text-rose-400 font-bold flex items-center gap-1">
                    <span class="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Ưu đãi sắp hết hạn!
                  </span>
                  <span class="text-slate-300 font-medium">Chỉ còn <b>7/20</b> lượt tải ưu đãi</span>
                </div>
                <div class="w-full h-2.5 rounded-full bg-[#080716] overflow-hidden p-0.5 border border-[#1f1b4b]">
                  <div class="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" style="width: 65%;"></div>
                </div>
              </div>

              {owned ? (
                <div class="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 mb-4">
                  <div class="flex items-center gap-2.5 text-emerald-400 font-bold mb-2">
                    <i class="fas fa-circle-check text-lg"></i>Bạn đã sở hữu sản phẩm này
                  </div>
                  <p class="text-xs text-emerald-300/80 mb-3.5 leading-relaxed">Truy cập link tải sản phẩm và license key trong khu vực tài khoản của bạn.</p>
                  <a href="/tai-khoan/san-pham" class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition">
                    <i class="fas fa-download"></i>Truy cập sản phẩm
                  </a>
                </div>
              ) : (
                <div class="flex flex-col gap-2.5 mb-4">
                  <div class="flex flex-wrap gap-2.5">
                    <button class="btn-buy-now flex-1 min-w-[150px] h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold hover:opacity-95 transition shadow-lg shadow-rose-500/10" data-id={p.id}>
                      <i class="fas fa-bolt mr-1.5"></i>Mua ngay
                    </button>
                    <button class="btn-add-cart flex-1 min-w-[150px] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/10" data-id={p.id} data-name={p.name}>
                      <i class="fas fa-cart-plus mr-1.5"></i>Thêm vào giỏ
                    </button>
                    <button class={`btn-wishlist w-12 h-12 rounded-xl border border-[#1f1b4b] hover:border-rose-500 transition flex items-center justify-center ${inWishlist ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 bg-white/5'}`}
                      data-id={p.id} title="Yêu thích">
                      <i class={`${inWishlist ? 'fas' : 'far'} fa-heart`}></i>
                    </button>
                  </div>

                  {/* Zalo Consultant CTA Button */}
                  <a href={`https://zalo.me/${settings?.zalo}`} target="_blank" rel="noopener"
                    class="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold text-xs hover:bg-indigo-500/20 hover:text-white transition duration-200">
                    <i class="fab fa-whatsapp text-sm"></i>Liên hệ tư vấn Zalo nhận khuyến mãi thêm
                  </a>
                </div>
              )}

              {p.demo_url && (
                <a href={p.demo_url} target="_blank" rel="noopener"
                  class="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[#1f1b4b] hover:border-indigo-500 text-indigo-400 hover:text-white hover:bg-[#16143c] font-semibold text-xs transition mb-5">
                  <i class="fas fa-arrow-up-right-from-square"></i>Xem demo trực tiếp
                </a>
              )}

              {features.length > 0 && (
                <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5 mb-4">
                  <h3 class="font-bold text-white mb-3 text-xs uppercase tracking-wider">Bạn nhận được</h3>
                  <ul class="space-y-2">
                    {features.map(f => (
                      <li class="flex gap-2.5 text-xs text-[#9f9dbb]">
                        <i class="fas fa-circle-check text-emerald-400 mt-0.5 shrink-0"></i><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tech.length > 0 && (
                <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
                  <h3 class="font-bold text-white mb-3 text-xs uppercase tracking-wider">Công nghệ sử dụng</h3>
                  <div class="flex flex-wrap gap-1.5">
                    {tech.map(t => <span class="px-2.5 py-1 rounded-lg bg-[#16143c] text-[#e2e1f5] text-[10px] font-bold border border-[#1f1b4b]">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Combo contents */}
      {comboItems.length > 0 && (
        <section class="max-w-7xl mx-auto px-4 py-10">
          <SectionTitle title="Combo này bao gồm" subtitle={`${comboItems.length} sản phẩm — mua lẻ tốn ${formatVND(comboItems.reduce((s, i) => s + i.price, 0))}`} />
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {comboItems.map(i => <ProductCard p={i} compact />)}
          </div>
        </section>
      )}

      {/* Description + Reviews */}
      <div class="max-w-7xl mx-auto px-4 py-10">
        <div class="grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div class="flex items-center gap-1 border-b border-[#1f1b4b] mb-6 overflow-x-auto">
              <button class="tab-btn active px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 whitespace-nowrap" data-tab="desc" data-group="pd">
                <i class="fas fa-file-lines mr-1.5"></i>Mô tả chi tiết
              </button>
              <button class="tab-btn px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 whitespace-nowrap" data-tab="rev" data-group="pd">
                <i class="fas fa-star mr-1.5"></i>Đánh giá ({p.rating_count})
              </button>
              <button class="tab-btn px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 whitespace-nowrap" data-tab="policy" data-group="pd">
                <i class="fas fa-shield-halved mr-1.5"></i>Chính sách
              </button>
            </div>

            <div class="tab-panel bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 md:p-8" data-tab="desc" data-group="pd">
              <div class="prose-vn max-w-none" dangerouslySetInnerHTML={{ __html: p.description || '<p>Đang cập nhật mô tả.</p>' }}></div>
            </div>

            <div class="tab-panel hidden" data-tab="rev" data-group="pd" id="reviews">
              <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 mb-5">
                <div class="grid sm:grid-cols-[180px_1fr] gap-7 items-center">
                  <div class="text-center">
                    <div class="text-5xl font-extrabold text-white">{p.rating.toFixed(1)}</div>
                    <div class="my-2"><Stars rating={p.rating} size="text-base" /></div>
                    <div class="text-xs text-slate-400">{p.rating_count} đánh giá</div>
                  </div>
                  <div class="space-y-1.5">
                    {[5, 4, 3, 2, 1].map(star => {
                      const cnt = ratingBreakdown[star] || 0
                      const totalR = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0) || 1
                      const pct = Math.round((cnt / totalR) * 100)
                      return (
                        <div class="flex items-center gap-2.5 text-xs">
                          <span class="w-10 text-slate-400 shrink-0">{star} <i class="fas fa-star text-amber-400"></i></span>
                          <div class="flex-1 h-2 rounded-full bg-[#16143c] overflow-hidden">
                            <div class="h-full bg-amber-400 rounded-full" style={`width:${pct}%`}></div>
                          </div>
                          <span class="w-8 text-right text-slate-400">{cnt}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {canReview && (
                <form action="/api/reviews" method="post" data-ajax data-reload="true" class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 mb-5">
                  <h3 class="font-bold text-white mb-4">Viết đánh giá của bạn</h3>
                  <input type="hidden" name="product_id" value={p.id} />
                  <div class="mb-4">
                    <label class="block text-xs font-semibold text-[#9f9dbb] mb-2">Số sao</label>
                    <select name="rating" class="h-10 px-3 rounded-lg border border-[#1f1b4b] bg-[#16143c] text-white outline-none focus:border-indigo-500/50 text-xs">
                      {[5, 4, 3, 2, 1].map(s => <option value={s}>{s} sao</option>)}
                    </select>
                  </div>
                  <div class="mb-4">
                    <label class="block text-xs font-semibold text-[#9f9dbb] mb-2">Nhận xét</label>
                    <textarea name="comment" rows={4} required placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      class="w-full p-3 rounded-lg border border-[#1f1b4b] bg-[#16143c] text-white outline-none focus:border-indigo-500/50 text-xs resize-y"></textarea>
                  </div>
                  <div class="form-error hidden text-xs text-rose-500 mb-3"></div>
                  <button type="submit" class="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/10">Gửi đánh giá</button>
                </form>
              )}
              {!user && (
                <div class="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-5 text-xs text-amber-300">
                  <i class="fas fa-circle-info mr-1.5"></i>
                  <a href="/dang-nhap" class="font-bold underline">Đăng nhập</a> và mua sản phẩm để viết đánh giá.
                </div>
              )}

              <div class="space-y-3">
                {reviews.length === 0 && <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-10 text-center text-[#9f9dbb] text-xs">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>}
                {reviews.map(r => (
                  <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-xs shrink-0">
                        {(r.full_name || 'K').charAt(0).toUpperCase()}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                          <b class="text-xs text-white">{r.full_name}</b>
                          <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">Đã mua</span>
                          <span class="text-[10px] text-slate-500 ml-auto">{formatDate(r.created_at)}</span>
                        </div>
                        <Stars rating={r.rating} />
                        <p class="text-xs text-[#9f9dbb] mt-2 leading-relaxed">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div class="tab-panel hidden bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 md:p-8" data-tab="policy" data-group="pd">
              <div class="prose-vn max-w-none">
                <h3>Chính sách giao hàng</h3>
                <p>Sản phẩm số được giao <b>tự động 100%</b>. Ngay sau khi đơn hàng chuyển sang trạng thái "Đã thanh toán", link tải sản phẩm và license key sẽ xuất hiện trong mục <b>Tài khoản → Sản phẩm của tôi</b>.</p>
                <h3>Chính sách bảo hành</h3>
                <ul>
                  <li>Hỗ trợ kỹ thuật miễn phí 6-12 tháng tuỳ sản phẩm</li>
                  <li>Nhận bản cập nhật miễn phí trọn đời</li>
                  <li>Hỗ trợ cài đặt qua Zalo/Ultraview khi cần</li>
                </ul>
                <h3>Chính sách hoàn tiền</h3>
                <p>Hoàn tiền <b>100%</b> trong vòng <b>7 ngày</b> nếu sản phẩm không đúng như mô tả hoặc không thể cài đặt được do lỗi từ phía chúng tôi.</p>
                <h3>Bản quyền sử dụng</h3>
                <ul>
                  <li>Được dùng cho dự án cá nhân và thương mại không giới hạn</li>
                  <li>Được chỉnh sửa mã nguồn theo nhu cầu</li>
                  <li>Không được bán lại nguyên bản source code cho bên thứ ba</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside class="space-y-4 lg:sticky-side">
            <div class="bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5">
              <h3 class="font-bold text-white mb-3.5 text-xs uppercase tracking-wider">Cam kết của chúng tôi</h3>
              <ul class="space-y-3 text-xs">
                {[
                  ['fa-bolt', 'Giao hàng tự động 24/7'],
                  ['fa-infinity', 'Sở hữu trọn đời, update free'],
                  ['fa-headset', 'Hỗ trợ kỹ thuật 1-1 qua Zalo'],
                  ['fa-shield-halved', 'Hoàn tiền 100% trong 7 ngày'],
                  ['fa-lock', 'Thanh toán an toàn qua VietQR']
                ].map(([ic, t]) => (
                  <li class="flex gap-2.5 text-[#9f9dbb]">
                    <i class={`fas ${ic} text-indigo-400 mt-0.5 w-4`}></i><span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div class="bg-[#0f0e26] rounded-2xl p-5 text-white border border-[#1f1b4b]">
              <h3 class="font-bold mb-1.5 text-xs uppercase tracking-wider text-white">Cần tư vấn thêm?</h3>
              <p class="text-[11px] text-[#9f9dbb] mb-4 leading-relaxed">Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.</p>
              <a href={`https://zalo.me/${settings?.zalo}`} target="_blank" rel="noopener"
                class="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs transition mb-2">
                Chat Zalo ngay
              </a>
              <a href={`tel:${(settings?.hotline || '').replace(/\s/g, '')}`}
                class="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#16143c] border border-[#1f1b4b] text-[#e2e1f5] font-bold text-xs hover:bg-white/5 transition">
                <i class="fas fa-phone"></i>{settings?.hotline}
              </a>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section class="max-w-7xl mx-auto px-4 py-10">
          <SectionTitle title="Sản phẩm liên quan" subtitle="Có thể bạn cũng quan tâm" />
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map(r => <ProductCard p={r} />)}
          </div>
        </section>
      )}
    </Layout>
  )
}
