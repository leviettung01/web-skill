import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { Breadcrumb, PostCard, Pagination, SectionTitle, EmptyState } from '../components/ui'
import { formatVND, formatDate } from '../lib/utils'

/* ---------------- BLOG LIST ---------------- */
export const BlogListPage: FC<LayoutProps & { posts: any[]; page: number; totalPages: number; q: string }> = (props) => (
  <Layout {...props} active="blog" title="Blog" description="Kiến thức, hướng dẫn và case study về làm video AI">
    <div class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Blog' }]} />
        <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Kiến thức làm video AI</h1>
        <p class="text-slate-500 mt-2 max-w-2xl">Hướng dẫn chi tiết, mẹo hay và case study thực tế từ cộng đồng làm video AI.</p>
        <form action="/blog" method="get" class="mt-5 max-w-md">
          <div class="relative">
            <input type="text" name="q" value={props.q} placeholder="Tìm bài viết..."
              class="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-100 focus:bg-white border border-transparent focus:border-brand-400 outline-none text-sm transition" />
            <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </form>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4 py-8">
      {props.posts.length === 0
        ? <div class="bg-white rounded-2xl border border-slate-200"><EmptyState icon="fa-newspaper" title="Không tìm thấy bài viết" action={{ href: '/blog', label: 'Xem tất cả' }} /></div>
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
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">{post.title}</h1>
        <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 pb-6 mb-7 border-b border-slate-200">
          <span><i class="far fa-calendar mr-1.5"></i>{formatDate(post.created_at)}</span>
          <span><i class="far fa-eye mr-1.5"></i>{post.view_count} lượt xem</span>
          {post.tags && (
            <div class="flex flex-wrap gap-1.5">
              {post.tags.split(',').map((t: string) => (
                <span class="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">#{t.trim()}</span>
              ))}
            </div>
          )}
        </div>
        {post.excerpt && <p class="text-lg text-slate-600 leading-relaxed mb-7 font-medium">{post.excerpt}</p>}
        <div class="prose-vn max-w-none" dangerouslySetInnerHTML={{ __html: post.content || '' }}></div>

        <div class="mt-10 p-6 rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white text-center">
          <h3 class="text-xl font-extrabold mb-2">Bắt đầu làm video AI ngay hôm nay</h3>
          <p class="text-white/85 text-sm mb-5">Khám phá kho source code, chatbot và bộ prompt đã được hàng nghìn creator tin dùng.</p>
          <a href="/san-pham" class="inline-flex h-11 px-6 items-center gap-2 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-slate-100 transition">
            <i class="fas fa-cubes"></i>Xem sản phẩm
          </a>
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

/* ---------------- PRICING ---------------- */
const PLANS = [
  {
    name: 'Starter', price: 199000, tag: 'Người mới bắt đầu', icon: 'fa-seedling', highlight: false,
    desc: 'Chọn 1 chatbot hoặc bộ prompt để bắt đầu làm video AI.',
    features: ['1 chatbot viết kịch bản', 'Truy cập trọn đời', 'Cập nhật prompt miễn phí', 'Hỗ trợ qua Zalo', 'Tài liệu hướng dẫn chi tiết'],
    cta: 'Xem chatbot', href: '/danh-muc/chatbot-prompt'
  },
  {
    name: 'Creator', price: 890000, tag: 'Phổ biến nhất', icon: 'fa-rocket', highlight: true,
    desc: 'Combo 10 chatbot đa ngành + 100 prompt Veo 3 tặng kèm.',
    features: ['10 chatbot đa ngành hàng', 'Tặng 100 prompt Veo 3', 'Nhận chatbot mới 12 tháng', 'Hỗ trợ ưu tiên 24/7', 'Truy cập trọn đời', 'Nhóm cộng đồng riêng'],
    cta: 'Mua combo', href: '/combo'
  },
  {
    name: 'Business', price: 4990000, tag: 'Kinh doanh', icon: 'fa-crown', highlight: false,
    desc: 'Full source code để tự vận hành nền tảng video AI của riêng bạn.',
    features: ['4 source code trị giá 7.7 triệu', 'Bộ 500 prompt Veo 3', '2 buổi setup 1-1 Ultraview', 'Hỗ trợ kỹ thuật 12 tháng', 'Không giới hạn domain', 'Ưu tiên nhận bản cập nhật', 'Tư vấn mô hình kinh doanh'],
    cta: 'Liên hệ tư vấn', href: '/san-pham/combo-source-code-all-in-one'
  }
]

export const PricingPage: FC<LayoutProps> = (props) => (
  <Layout {...props} active="pricing" title="Bảng giá" description="Bảng giá các gói sản phẩm source code và tool AI tạo video">
    <div class="bg-slate-950 text-white relative overflow-hidden">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="relative max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Bảng giá minh bạch</h1>
        <p class="text-slate-300 max-w-2xl mx-auto">Mua một lần, sở hữu trọn đời. Không phí duy trì, không phí ẩn, không giới hạn thời gian sử dụng.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 -mt-8 pb-14 relative">
      <div class="grid lg:grid-cols-3 gap-5">
        {PLANS.map(pl => (
          <div class={`rounded-2xl p-7 relative ${pl.highlight ? 'bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-2xl shadow-brand-500/30 lg:-mt-4 lg:mb-4' : 'bg-white border border-slate-200'}`}>
            {pl.highlight && (
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-extrabold whitespace-nowrap">
                ⭐ {pl.tag}
              </div>
            )}
            <div class={`w-12 h-12 rounded-xl grid place-items-center text-lg mb-4 ${pl.highlight ? 'bg-white/20' : 'bg-brand-50 text-brand-600'}`}>
              <i class={`fas ${pl.icon}`}></i>
            </div>
            <h3 class={`text-xl font-extrabold mb-1 ${pl.highlight ? '' : 'text-slate-900'}`}>{pl.name}</h3>
            {!pl.highlight && <div class="text-xs text-slate-500 mb-3">{pl.tag}</div>}
            <p class={`text-sm mb-5 leading-relaxed ${pl.highlight ? 'text-white/85' : 'text-slate-500'}`}>{pl.desc}</p>
            <div class="mb-6">
              <span class={`text-3xl font-extrabold ${pl.highlight ? '' : 'text-slate-900'}`}>{formatVND(pl.price)}</span>
              <span class={`text-sm ml-1.5 ${pl.highlight ? 'text-white/70' : 'text-slate-400'}`}>/ trọn đời</span>
            </div>
            <ul class="space-y-2.5 mb-7">
              {pl.features.map(f => (
                <li class={`flex gap-2.5 text-sm ${pl.highlight ? 'text-white/90' : 'text-slate-600'}`}>
                  <i class={`fas fa-circle-check mt-0.5 shrink-0 ${pl.highlight ? 'text-emerald-300' : 'text-emerald-500'}`}></i>{f}
                </li>
              ))}
            </ul>
            <a href={pl.href}
              class={`flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-sm transition ${pl.highlight ? 'bg-white text-brand-700 hover:bg-slate-100' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}>
              {pl.cta}<i class="fas fa-arrow-right text-xs"></i>
            </a>
          </div>
        ))}
      </div>

      <div class="mt-12 bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 class="text-xl font-extrabold text-slate-900 mb-6 text-center">So sánh chi tiết các gói</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[600px]">
            <thead>
              <tr class="border-b-2 border-slate-200">
                <th class="text-left py-3 font-bold text-slate-700">Tính năng</th>
                {PLANS.map(p => <th class="py-3 px-3 font-bold text-slate-900 text-center">{p.name}</th>)}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {[
                ['Số sản phẩm', '1', '10+', '4 source + 500 prompt'],
                ['Sở hữu trọn đời', true, true, true],
                ['Cập nhật miễn phí', true, true, true],
                ['Hỗ trợ Zalo', true, true, true],
                ['Hỗ trợ ưu tiên 24/7', false, true, true],
                ['Setup 1-1 Ultraview', false, false, true],
                ['Full source code', false, false, true],
                ['Dùng cho thương mại', false, true, true],
                ['Không giới hạn domain', false, false, true]
              ].map(([label, ...vals]) => (
                <tr>
                  <td class="py-3 text-slate-600 font-medium">{label}</td>
                  {vals.map(v => (
                    <td class="py-3 px-3 text-center">
                      {typeof v === 'boolean'
                        ? (v ? <i class="fas fa-circle-check text-emerald-500"></i> : <i class="fas fa-minus text-slate-300"></i>)
                        : <span class="font-semibold text-slate-800">{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
)

/* ---------------- ABOUT ---------------- */
export const AboutPage: FC<LayoutProps & { stats: any }> = (props) => (
  <Layout {...props} title="Giới thiệu" description="Về SrcTool AI — kho source code và tool AI tạo video hàng đầu Việt Nam">
    <div class="bg-slate-950 text-white relative overflow-hidden">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="relative max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Về SrcTool AI</h1>
        <p class="text-slate-300 leading-relaxed">Chúng tôi giúp người Việt tiếp cận công nghệ video AI một cách dễ dàng nhất — thông qua source code chất lượng, chatbot kịch bản thông minh và bộ prompt đã được kiểm chứng.</p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 py-14">
      <div class="grid sm:grid-cols-3 gap-5 mb-14">
        {[
          ['fa-cube', props.stats.products + '+', 'Sản phẩm'],
          ['fa-users', props.stats.users.toLocaleString('vi-VN') + '+', 'Khách hàng'],
          ['fa-cart-shopping', props.stats.sold.toLocaleString('vi-VN') + '+', 'Lượt mua']
        ].map(([ic, num, lb]) => (
          <div class="bg-white rounded-2xl border border-slate-200 p-7 text-center">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center mx-auto mb-3.5 shadow-lg">
              <i class={`fas ${ic}`}></i>
            </div>
            <div class="text-3xl font-extrabold text-slate-900">{num}</div>
            <div class="text-sm text-slate-500 mt-1">{lb}</div>
          </div>
        ))}
      </div>

      <div class="prose-vn max-w-none bg-white rounded-2xl border border-slate-200 p-7 md:p-10">
        <h2>Câu chuyện của chúng tôi</h2>
        <p>SrcTool AI ra đời từ nhu cầu thực tế: rất nhiều người muốn làm video bán hàng bằng AI nhưng không biết viết prompt, không biết quay dựng và cũng không đủ ngân sách thuê agency.</p>
        <p>Chúng tôi bắt đầu bằng việc xây dựng những chatbot viết kịch bản chuyên ngành, sau đó mở rộng sang bộ prompt Veo 3 và cuối cùng là full source code nền tảng tạo video AI dành cho người muốn kinh doanh dịch vụ.</p>
        <h2>Chúng tôi cung cấp gì?</h2>
        <ul>
          <li><b>Source code tool AI:</b> mã nguồn đầy đủ, không mã hoá, kèm tài liệu triển khai chi tiết</li>
          <li><b>Chatbot viết kịch bản:</b> sinh sẵn prompt ảnh và prompt video theo từng ngành hàng</li>
          <li><b>Bộ prompt Veo 3:</b> hàng trăm prompt đã test thực tế, đảm bảo ra video đẹp</li>
          <li><b>Tool automation:</b> phần mềm render hàng loạt, đăng bài đa kênh tự động</li>
        </ul>
        <h2>Cam kết</h2>
        <ul>
          <li>Giao sản phẩm tự động ngay sau khi thanh toán, không phải chờ đợi</li>
          <li>Hỗ trợ kỹ thuật 1-1 cho đến khi bạn sử dụng được</li>
          <li>Hoàn tiền 100% trong 7 ngày nếu sản phẩm không đúng mô tả</li>
          <li>Cập nhật miễn phí trọn đời theo API mới của các nền tảng AI</li>
        </ul>
        <h2>Giá trị cốt lõi</h2>
        <p><b>Thực chiến:</b> Mọi sản phẩm đều được chúng tôi tự dùng trước khi bán. <b>Minh bạch:</b> Giá công khai, không phí ẩn. <b>Đồng hành:</b> Chúng tôi hỗ trợ bạn đến khi thành công, không chỉ bán xong là hết.</p>
      </div>
    </div>
  </Layout>
)

/* ---------------- CONTACT ---------------- */
export const ContactPage: FC<LayoutProps> = (props) => (
  <Layout {...props} active="contact" title="Liên hệ" description="Liên hệ hỗ trợ SrcTool AI">
    <div class="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: 'Liên hệ' }]} />
      <div class="grid lg:grid-cols-[1fr_360px] gap-7">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h1 class="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Gửi yêu cầu hỗ trợ</h1>
          <p class="text-slate-500 text-sm mb-6">Điền form bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
          <form action="/api/tickets" method="post" data-ajax class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Họ tên *</label>
                <input type="text" name="name" required value={props.user?.full_name || ''}
                  class="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input type="email" name="email" required value={props.user?.email || ''}
                  class="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Tiêu đề *</label>
              <input type="text" name="subject" required placeholder="Vấn đề bạn gặp phải"
                class="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nội dung *</label>
              <textarea name="message" rows={6} required placeholder="Mô tả chi tiết vấn đề của bạn..."
                class="w-full p-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y"></textarea>
            </div>
            <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
            <button type="submit" class="h-12 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition">
              <i class="fas fa-paper-plane mr-1.5"></i>Gửi yêu cầu
            </button>
          </form>
        </div>

        <aside class="space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 class="font-bold text-slate-900 mb-4">Thông tin liên hệ</h3>
            <div class="space-y-4">
              {[
                ['fa-phone-volume', 'Hotline', props.settings?.hotline, `tel:${(props.settings?.hotline || '').replace(/\s/g, '')}`],
                ['fa-envelope', 'Email', props.settings?.email, `mailto:${props.settings?.email}`],
                ['fa-comment-dots', 'Zalo', props.settings?.zalo, `https://zalo.me/${props.settings?.zalo}`],
                ['fa-clock', 'Giờ làm việc', '8:00 – 22:00 (T2–CN)', '']
              ].map(([ic, lb, val, href]) => (
                <div class="flex gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0"><i class={`fas ${ic}`}></i></div>
                  <div class="min-w-0">
                    <div class="text-xs text-slate-500">{lb}</div>
                    {href ? <a href={href as string} target="_blank" rel="noopener" class="font-semibold text-slate-900 text-sm hover:text-brand-600 break-all">{val}</a>
                      : <div class="font-semibold text-slate-900 text-sm">{val}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div class="bg-gradient-to-br from-brand-600 to-fuchsia-600 rounded-2xl p-5 text-white">
            <i class="fas fa-bolt text-2xl mb-2.5"></i>
            <h3 class="font-bold mb-1.5">Cần hỗ trợ gấp?</h3>
            <p class="text-xs text-white/85 mb-4 leading-relaxed">Chat Zalo là kênh phản hồi nhanh nhất, thường dưới 5 phút trong giờ làm việc.</p>
            <a href={`https://zalo.me/${props.settings?.zalo}`} target="_blank" rel="noopener"
              class="flex items-center justify-center w-full h-11 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-slate-100 transition">Chat Zalo ngay</a>
          </div>
        </aside>
      </div>
    </div>
  </Layout>
)

/* ---------------- AFFILIATE LANDING ---------------- */
export const AffiliateLandingPage: FC<LayoutProps & { percent: number }> = (props) => (
  <Layout {...props} active="affiliate" title="Chương trình Affiliate" description="Kiếm hoa hồng khi giới thiệu sản phẩm SrcTool AI">
    <div class="bg-slate-950 text-white relative overflow-hidden">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="relative max-w-4xl mx-auto px-4 py-16 text-center">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
          <i class="fas fa-handshake text-amber-400"></i>Chương trình đối tác
        </div>
        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Nhận <span class="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{props.percent}% hoa hồng</span> mỗi đơn hàng
        </h1>
        <p class="text-slate-300 max-w-2xl mx-auto mb-8">Chia sẻ link giới thiệu, kiếm thu nhập thụ động không giới hạn. Không cần vốn, không cần kho hàng.</p>
        <a href={props.user ? '/tai-khoan/affiliate' : '/dang-ky'}
          class="inline-flex h-12 px-7 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold hover:opacity-90 shadow-xl transition">
          <i class="fas fa-rocket"></i>{props.user ? 'Vào trang Affiliate' : 'Tham gia ngay — Miễn phí'}
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
          <div class="bg-white rounded-2xl border border-slate-200 p-7 text-center">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center text-xl mx-auto mb-4 shadow-lg">
              <i class={`fas ${ic}`}></i>
            </div>
            <h3 class="font-bold text-slate-900 mb-2">{t}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>

      <SectionTitle center title="Thu nhập tham khảo" subtitle="Ước tính dựa trên số đơn giới thiệu mỗi tháng" />
      <div class="grid sm:grid-cols-3 gap-5 mt-8">
        {[[5, 890000], [20, 890000], [50, 890000]].map(([n, avg]) => (
          <div class="bg-white rounded-2xl border border-slate-200 p-7 text-center">
            <div class="text-sm text-slate-500 mb-1">{n} đơn / tháng</div>
            <div class="text-3xl font-extrabold text-emerald-600">{formatVND(Math.round(n * avg * props.percent / 100))}</div>
            <div class="text-xs text-slate-400 mt-1.5">Giá trị đơn TB {formatVND(avg)}</div>
          </div>
        ))}
      </div>

      <div class="mt-14 bg-white rounded-2xl border border-slate-200 p-7 md:p-10">
        <h2 class="text-xl font-extrabold text-slate-900 mb-5">Điều khoản chương trình</h2>
        <ul class="space-y-3 text-sm text-slate-600">
          {[
            `Hoa hồng ${props.percent}% trên giá trị đơn hàng thực thu (sau giảm giá)`,
            'Hoa hồng được ghi nhận khi đơn hàng chuyển sang trạng thái "Đã thanh toán"',
            'Rút hoa hồng tối thiểu 200.000đ, xử lý trong 1-3 ngày làm việc',
            'Không áp dụng cho đơn hàng tự mua bằng mã của chính mình',
            'Nghiêm cấm spam, chạy quảng cáo trên thương hiệu SrcTool AI'
          ].map(t => (
            <li class="flex gap-2.5"><i class="fas fa-circle-check text-emerald-500 mt-0.5 shrink-0"></i>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  </Layout>
)

/* ---------------- POLICY / TERMS / GUIDE ---------------- */
export const DocPage: FC<LayoutProps & { heading: string; html: string }> = (props) => (
  <Layout {...props} title={props.heading}>
    <div class="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: props.heading }]} />
      <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-7">{props.heading}</h1>
      <div class="bg-white rounded-2xl border border-slate-200 p-6 md:p-9">
        <div class="prose-vn max-w-none" dangerouslySetInnerHTML={{ __html: props.html }}></div>
      </div>
    </div>
  </Layout>
)

/* ---------------- 404 ---------------- */
export const NotFoundPage: FC<LayoutProps> = (props) => (
  <Layout {...props} title="Không tìm thấy trang">
    <div class="max-w-lg mx-auto px-4 py-24 text-center">
      <div class="text-7xl font-extrabold bg-gradient-to-r from-brand-500 to-fuchsia-500 bg-clip-text text-transparent mb-4">404</div>
      <h1 class="text-2xl font-extrabold text-slate-900 mb-2">Không tìm thấy trang</h1>
      <p class="text-slate-500 mb-7">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a href="/" class="h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition">
          <i class="fas fa-house"></i>Về trang chủ
        </a>
        <a href="/san-pham" class="h-11 px-5 inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 hover:border-brand-400 font-semibold text-sm transition">
          <i class="fas fa-cubes"></i>Xem sản phẩm
        </a>
      </div>
    </div>
  </Layout>
)
