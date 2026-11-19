import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { Breadcrumb, PostCard, Pagination, SectionTitle, EmptyState } from '../components/ui'
import { formatVND, formatDate } from '../lib/utils'

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

/* ---------------- PRICING ---------------- */
const PLANS = [
  {
    name: 'Skill AI (Tự tải)', price: 399000, tag: 'Đang mở bán · Tự làm theo', icon: 'fa-download', highlight: false, available: true, isMcp: false,
    desc: 'Chọn Skill theo ngách (Thuỷ Sinh, Làm Vườn, Fitness) hoặc Muse AI / Seedance 2.5 để tự tải về & thao tác từng bước.',
    features: ['Trọn bộ prompt, quy trình 30s & file mẫu', 'Tự tải về máy, làm chủ thủ công từng cảnh', 'Video demo thật xem trước khi mua', 'Truy cập trọn đời + update free', 'Hỗ trợ kỹ thuật 1-1 qua Zalo'],
    cta: 'Xem Skill tự tải', href: '/san-pham?type=skill'
  },
  {
    name: 'Skill AI Agent (MCP)', price: 890000, tag: 'MỚI · Kết nối MCP trực tiếp', icon: 'fa-plug-circle-bolt', highlight: true, available: true, isMcp: true,
    desc: 'Dành cho người dùng Claude, Codex, Antigravity: kết nối trực tiếp MCP bằng License Key, AI Agent tự gọi tool tạo video theo Skill.',
    features: ['Kết nối trực tiếp MCP cho Claude, Codex, Antigravity', 'AI Agent tự gọi tool xuất storyboard, prompt & pipeline video', 'Không cần tải file hay thao tác copy-paste thủ công', 'Tự động đồng bộ bản Skill mới nhất trên server', 'Kèm License Key riêng & nút test MCP trực tiếp', 'Hỗ trợ cài đặt MCP 1-1 qua Zalo / Ultraview'],
    cta: 'Xem Skill AI Agent (MCP)', href: '/san-pham?type=mcp_skill'
  },
  {
    name: 'Combo & Chatbot / App', price: 1999000, tag: 'Chưa mở bán', icon: 'fa-clock', highlight: false, available: false, isMcp: false,
    desc: 'Khóa học chuyên sâu, Chatbot kịch bản, App render tự động và gói Combo All-In-One.',
    features: ['Khóa học Video AI (sắp mở)', 'Chatbot viết kịch bản + App render (sắp mở)', 'Combo tiết kiệm trọn bộ (sắp mở)', 'Tạm thời đóng giỏ — tập trung 2 dòng Skill chính'],
    cta: 'Chưa mở bán', href: '/combo'
  }
]

export const PricingPage: FC<LayoutProps> = (props) => (
  <Layout {...props} active="pricing" title="Bảng giá" description="Bảng giá dòng Skill AI tự tải và Skill AI Agent (MCP) kết nối trực tiếp Claude, Codex, Antigravity">
    <div class="bg-[#070614] text-white relative overflow-hidden border-b border-[#221e54]">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="relative max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Bảng giá minh bạch</h1>
        <p class="text-[#c2c0e0] max-w-2xl mx-auto">Chọn giữa <b>Skill AI (tự tải về làm theo)</b> hoặc <b>Skill AI Agent (MCP)</b> kết nối trực tiếp Claude, Codex, Antigravity. Mua một lần, sở hữu trọn đời.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 -mt-8 pb-14 relative">
      <div class="grid lg:grid-cols-3 gap-5">
        {PLANS.map(pl => (
          <div class={`rounded-2xl p-7 relative ${pl.highlight ? 'bg-gradient-to-br from-cyan-600 via-indigo-600 to-fuchsia-600 text-white shadow-2xl shadow-cyan-500/25 lg:-mt-4 lg:mb-4' : 'bg-[#0f0e24] border border-[#221e54]'}`}>
            {pl.highlight && (
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-300 text-slate-950 text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1">
                <i class="fas fa-plug-circle-bolt text-[10px]" aria-hidden="true"></i>{pl.tag}
              </div>
            )}
            <div class={`w-12 h-12 rounded-xl grid place-items-center text-lg mb-4 ${pl.highlight ? 'bg-white/20 text-white' : pl.available ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
              <i class={`fas ${pl.icon}`} aria-hidden="true"></i>
            </div>
            <h2 class="text-xl font-extrabold text-white mb-1">{pl.name}</h2>
            {!pl.highlight && (
              <div class={`text-xs font-bold mb-3 ${pl.available ? 'text-emerald-400' : 'text-amber-300'}`}>{pl.tag}</div>
            )}
            <p class={`text-sm mb-5 leading-relaxed ${pl.highlight ? 'text-white/90' : 'text-[#b8b6d9]'}`}>{pl.desc}</p>
            <div class="mb-6">
              <span class="text-3xl font-extrabold text-white tabular-nums">{formatVND(pl.price)}</span>
              <span class={`text-sm ml-1.5 ${pl.highlight ? 'text-white/80' : 'text-[#9492b8]'}`}>{pl.available ? '/ trọn đời' : '/ dự kiến'}</span>
            </div>
            <ul class="space-y-2.5 mb-7">
              {pl.features.map(f => (
                <li class={`flex gap-2.5 text-sm ${pl.highlight ? 'text-white/95' : 'text-[#c2c0e0]'}`}>
                  <i class={`fas ${pl.available ? 'fa-circle-check' : 'fa-clock'} mt-0.5 shrink-0 ${pl.highlight ? 'text-cyan-200' : pl.available ? 'text-emerald-400' : 'text-amber-400'}`} aria-hidden="true"></i>{f}
                </li>
              ))}
            </ul>
            <a href={pl.href}
              class={`flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-sm transition ${pl.highlight ? 'cta-white bg-white text-indigo-700 hover:bg-slate-100' : pl.available ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'}`}>
              {pl.cta}<i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
            </a>
          </div>
        ))}
      </div>

      <div class="mt-12 bg-[#0f0e24] rounded-2xl border border-[#221e54] p-6 md:p-8">
        <h2 class="text-xl font-extrabold text-white mb-6 text-center">So sánh Skill tự tải vs Skill AI Agent (MCP)</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[600px]">
            <thead>
              <tr class="border-b-2 border-[#221e54]">
                <th class="text-left py-3 font-bold text-[#c2c0e0]">Tính năng</th>
                {PLANS.map(p => <th class="py-3 px-3 font-bold text-white text-center">{p.name}</th>)}
              </tr>
            </thead>
            <tbody class="divide-y divide-[#221e54]">
              {[
                ['Trạng thái', 'Đang mở bán', 'Đang mở bán', 'Chưa mở bán'],
                ['Hình thức sử dụng', 'Tự tải file & làm theo', 'AI Agent gọi MCP trực tiếp', 'Trọn gói'],
                ['Tương thích Claude / Codex / Antigravity', false, true, 'Tuỳ gói'],
                ['Tự động đồng bộ bản Skill từ server', false, true, true],
                ['Sở hữu trọn đời', true, true, true],
                ['Cập nhật miễn phí', true, true, true],
                ['Hỗ trợ 1-1 qua Zalo', true, true, true],
                ['Khóa học + Chatbot + App', false, false, 'Sắp mở']
              ].map(([label, ...vals]) => (
                <tr>
                  <td class="py-3.5 text-[#c2c0e0] font-medium">{label}</td>
                  {vals.map(v => (
                    <td class="py-3.5 px-3 text-center">
                      {typeof v === 'boolean'
                        ? (v
                          ? <i class="fas fa-circle-check text-emerald-400" aria-label="Có"></i>
                          : <i class="fas fa-minus text-[#9492b8]" aria-label="Không"></i>)
                        : <span class="font-semibold text-white">{v}</span>}
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
