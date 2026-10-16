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
  { icon: 'fa-bolt', title: 'Giao hàng tự động 24/7', desc: 'Thanh toán xong nhận link tải, link kích hoạt hoặc key bản quyền ngay trong tài khoản, không cần chờ admin.' },
  { icon: 'fa-infinity', title: 'Sở hữu trọn đời', desc: 'Mua một lần dùng mãi mãi, không phí ẩn, không giới hạn thời gian, nhận mọi bản cập nhật miễn phí.' },
  { icon: 'fa-wand-magic-sparkles', title: 'Skill thực chiến, test kỹ', desc: 'Mỗi skill, chatbot và khóa học đều đã chạy thực tế ra video demo bạn xem được ngay trên trang sản phẩm.' },
  { icon: 'fa-headset', title: 'Hỗ trợ 1-1', desc: 'Đội ngũ hỗ trợ qua Zalo/Ultraview, cầm tay chỉ việc đến khi bạn tự làm được video đầu tiên.' },
  { icon: 'fa-shield-halved', title: 'Bảo hành & hoàn tiền', desc: 'Hoàn tiền 100% trong 7 ngày nếu sản phẩm không đúng như mô tả hoặc video demo.' },
  { icon: 'fa-rocket', title: 'Cập nhật theo model mới', desc: 'Skill và khóa học được nâng cấp liên tục theo Muse AI, Seedance, Veo, Flow... hoàn toàn miễn phí.' }
]

const STEPS = [
  { n: '01', icon: 'fa-user-plus', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản miễn phí chỉ với email trong 30 giây.' },
  { n: '02', icon: 'fa-cart-shopping', title: 'Chọn sản phẩm', desc: 'Xem video demo, đọc mô tả chi tiết rồi thêm vào giỏ hàng.' },
  { n: '03', icon: 'fa-qrcode', title: 'Thanh toán QR', desc: 'Quét mã VietQR chuyển khoản, hệ thống xác nhận nhanh chóng.' },
  { n: '04', icon: 'fa-download', title: 'Nhận sản phẩm', desc: 'Link tải + license key xuất hiện ngay trong "Sản phẩm của tôi".' }
]

const FAQS = [
  { q: 'Mua khóa học / skill thì tôi nhận được gì?', a: 'Bạn nhận toàn bộ nội dung số của sản phẩm: video bài giảng + tài liệu với khóa học; bộ prompt, quy trình và file cấu hình với skill; link chatbot riêng với chatbot; bộ cài/app với app. Tất cả được giao tự động ngay sau khi thanh toán.' },
  { q: 'Tôi không biết gì về AI thì có học được không?', a: 'Có. Mỗi khóa học và skill đều thiết kế cho người mới: xem video demo trước khi mua, làm theo từng bước có hình ảnh minh hoạ. Ngoài ra chúng tôi hỗ trợ 1-1 qua Zalo nếu bạn cần.' },
  { q: 'Skill tạo video AI hoạt động như thế nào?', a: 'Sau khi mua, bạn nhận bộ skill gồm prompt, quy trình và file cấu hình cho đúng ngách của mình (Thuỷ Sinh, Làm Vườn, Fitness...). Chỉ cần làm theo là ra video 30s đúng chuẩn để build page Reels/TikTok.' },
  { q: 'Thanh toán xong bao lâu thì nhận được hàng?', a: 'Hệ thống giao tự động. Ngay khi đơn hàng được xác nhận thanh toán, link tải và license key sẽ xuất hiện trong mục "Sản phẩm của tôi".' },
  { q: 'Có được hỗ trợ khi gặp lỗi không?', a: 'Có. Mỗi sản phẩm đi kèm hỗ trợ qua Zalo. Với gói Combo All-In-One bạn còn được ưu tiên hỗ trợ 1-1 trực tiếp.' },
  { q: 'Tôi có thể dùng skill cho nhiều kênh không?', a: 'Có. Skill mua một lần dùng không giới hạn cho mọi kênh TikTok, Reels, YouTube Shorts của chính bạn.' }
]

const DEMO_VIDEOS = [
  {
    id: 'muse-ai',
    title: 'Khóa Học Video Muse AI — Từ Prompt Đến Video 10s Chuẩn Viral',
    shortTitle: 'Khóa học Muse AI Pro 30s',
    tag: 'Khóa học',
    dur: '0:30',
    desc: 'Học làm video AI bằng Muse AI từ A-Z: viết prompt khóa nhân vật, render clip 10s có lip-sync tiếng Việt tự nhiên, ghép thành video hoàn chỉnh.',
    videoUrl: '/videos/demo-khoa-hoc-muse-ai.mp4',
    posterUrl: '/videos/posters/poster-khoa-hoc-muse-ai.jpg',
    slug: 'khoa-hoc-video-muse-ai',
    price: 599000,
    originalPrice: 1299000
  },
  {
    id: 'seedance-25',
    title: 'Khóa Học Video Seedance 2.5 — One-Take 30s Build Page',
    shortTitle: 'Seedance 2.5 · One-Take 30s',
    tag: 'Khóa học',
    dur: '0:30',
    desc: 'Làm chủ Seedance 2.5: quay one-take 30 giây nhân vật giữ nguyên, âm thanh native — công thức build page Reels/TikTok lên nhanh.',
    videoUrl: '/videos/demo-khoa-hoc-seedance.mp4',
    posterUrl: '/videos/posters/poster-khoa-hoc-seedance.jpg',
    slug: 'khoa-hoc-video-seedance-25-30s',
    price: 699000,
    originalPrice: 1399000
  },
  {
    id: 'skill-thuy-sinh',
    title: 'Skill Video Thuỷ Sinh 30s — Build Page Reels',
    shortTitle: 'Skill Video Thuỷ Sinh 30s',
    tag: 'Skill AI',
    dur: '0:15',
    desc: 'Bộ skill làm video thuỷ sinh 30s: prompt, quy trình render và checklist đăng bài để build page Reels ngách thuỷ sinh.',
    videoUrl: '/videos/demo-skill-thuy-sinh.mp4',
    posterUrl: '/videos/posters/poster-skill-thuy-sinh.jpg',
    slug: 'skill-video-thuy-sinh-30s',
    price: 399000,
    originalPrice: 799000
  },
  {
    id: 'skill-lam-vuon',
    title: 'Skill Video DIY Làm Vườn 30s — Build Page Reels',
    shortTitle: 'Skill Làm Vườn DIY 30s',
    tag: 'Skill AI',
    dur: '0:25',
    desc: 'Skill làm video DIY làm vườn 30s: công thức cảnh quay, prompt mẫu và lịch đăng để build page Reels ngách làm vườn.',
    videoUrl: '/videos/demo-skill-lam-vuon.mp4',
    posterUrl: '/videos/posters/poster-skill-lam-vuon.jpg',
    slug: 'skill-video-diy-lam-vuon-30s',
    price: 399000,
    originalPrice: 799000
  },
  {
    id: 'skill-fitness',
    title: 'Skill Video Affiliate Fitness — Video 30s Chốt Đơn',
    shortTitle: 'Skill Affiliate Fitness 30s',
    tag: 'Skill AI',
    dur: '0:20',
    desc: 'Skill làm video fitness 30s bán hàng affiliate: kịch bản chuyển đổi cao, prompt và quy trình edit tay chi tiết.',
    videoUrl: '/videos/demo-skill-fitness.mp4',
    posterUrl: '/videos/posters/poster-skill-fitness.jpg',
    slug: 'skill-video-affiliate-fitness',
    price: 449000,
    originalPrice: 899000
  }
]

export const HomePage: FC<Props> = (props) => {
  const { categories, featured, hot, newest, combos, posts, reviews, stats } = props
  return (
    <Layout {...props} active="home">
      {/* ============ HERO ============ */}
      <section id="hero-section" class="relative bg-slate-950 text-white overflow-hidden">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="absolute inset-0 hero-grid"></div>
        <div class="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div class="grid lg:grid-cols-2 gap-10 xl:gap-12 items-center">
            <div>
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-semibold mb-6">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Đã có <b class="text-emerald-300">{stats.sold.toLocaleString('vi-VN')}+</b> lượt mua thành công
              </div>
              <h1 class="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5">
                Kho <span class="bg-gradient-to-r from-brand-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Chatbot, Skill &amp; App AI</span> làm video số 1 Việt Nam
              </h1>
              <p class="text-slate-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                Khóa học, skill, chatbot và app làm video AI: Video Muse AI, Seedance 2.5 30s, Google Flow Veo —
                kèm skill theo ngách Thuỷ Sinh, Làm Vườn, Affiliate Fitness.
                Mua một lần — sở hữu trọn đời — giao hàng tự động 24/7.
              </p>
              <div class="flex flex-wrap items-center gap-3 mb-9">
                <a href="/san-pham" class="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-fuchsia-500 font-semibold shadow-xl shadow-brand-500/30 hover:opacity-90 transition">
                  <i class="fas fa-cubes"></i>Xem tất cả sản phẩm
                </a>
                <a href="#theater" id="heroTrailerBtn" class="h-12 px-5 inline-flex items-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-semibold text-white transition shadow-lg">
                  <span class="w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white shadow"><i class="fas fa-play ml-0.5"></i></span>
                  Xem trailer 30s
                </a>
                <a href="/combo" class="h-12 px-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition">
                  <i class="fas fa-box-open text-amber-400"></i>Combo -60%
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

            {/* Hero 3D Multi-Device Stage (1clickvn style) */}
            <div class="hero-stage-wrapper relative">
              <div class="hero-stage">
                {/* Back Left Phone */}
                <div class="phone phone-back phone-left" aria-hidden="true">
                  <video
                    src="/videos/demo-skill-lam-vuon.mp4"
                    poster="/videos/posters/poster-skill-lam-vuon.jpg"
                    playsinline
                    muted
                    loop
                    autoplay
                    preload="metadata"
                  ></video>
                </div>

                {/* Back Right Phone */}
                <div class="phone phone-back phone-right" aria-hidden="true">
                  <video
                    src="/videos/demo-skill-fitness.mp4"
                    poster="/videos/posters/poster-skill-fitness.jpg"
                    playsinline
                    muted
                    loop
                    autoplay
                    preload="metadata"
                  ></video>
                </div>

                {/* Main Front Phone */}
                <div class="phone phone-front" id="heroFrontPhone">
                  {/* Smartphone dynamic notch */}
                  <div class="phone-notch"></div>

                  {/* Main video */}
                  <video
                    id="heroFrontVideo"
                    src="/videos/demo-khoa-hoc-muse-ai.mp4"
                    poster="/videos/posters/poster-khoa-hoc-muse-ai.jpg"
                    playsinline
                    muted
                    loop
                    autoplay
                    preload="auto"
                  ></video>

                  {/* Center play/pause overlay */}
                  <button id="heroPlayCenterBtn" class="phone-play-btn" aria-label="Phát / tạm dừng">
                    <i class="fas fa-play text-white ml-0.5" id="heroPlayCenterIcon"></i>
                  </button>

                  {/* Bottom in-video bar */}
                  <div class="phone-bottom-bar">
                    <div class="phone-progress-track" id="heroProgressTrack">
                      <div class="phone-progress-fill" id="heroProgressFill"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-white/90 pt-1.5">
                      <span class="font-bold truncate max-w-[170px]" id="heroVideoTitle">Muse AI Pro · 30s</span>
                      <button id="heroSoundBtn" class="phone-sound-toggle snd" aria-label="Bật tiếng">
                        <i class="fas fa-volume-xmark mr-1"></i><span>Bật tiếng</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Chips matching 1clickvn */}
                <div class="float-chip chip-seed">
                  <span class="chip-mono">0:30</span>
                  <span>Clip Seedance liền mạch</span>
                </div>

                <div class="float-chip chip-proof">
                  <span class="chip-ic ok"><i class="fas fa-check"></i></span>
                  <span><b>84/84 video</b> · Lỗi 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust marquee */}
        <div class="relative border-t border-white/5 bg-[#080716]/60 backdrop-blur py-3 marquee-wrap overflow-hidden">
          <div class="marquee-track flex gap-10 w-max text-slate-500 text-xs font-semibold whitespace-nowrap">
            {[...Array(2)].map(() => (
              <>
                {['Muse AI', 'Seedance 2.5', 'Veo 3', 'Google Flow', 'Kling AI', 'ChatGPT', 'Gemini', 'CapCut', 'Sora', 'Runway'].map(b => (
                  <span class="flex items-center gap-2"><i class="fas fa-circle-nodes text-indigo-500/60"></i>{b}</span>
                ))}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VIDEO WALL MARQUEE (1clickvn style) ============ */}
      <section class="wall" id="theater-wall" aria-label="Clip mẫu làm bằng AI">
        <div class="wall-head">
          <span class="wall-kicker">
            <i class="fas fa-wand-magic-sparkles text-brand-400"></i>
            Làm bằng Muse AI &amp; Seedance
          </span>
          <span class="wall-note">
            <i class="fas fa-mouse-pointer text-slate-400 mr-1"></i>
            Clip thật từ repo, không dựng lại. Rê chuột để dừng · Bấm để xem lớn.
          </span>
        </div>
        <div class="wall-track-wrapper">
          <div class="wall-track" id="wallTrack">
            {[...DEMO_VIDEOS, ...DEMO_VIDEOS, ...DEMO_VIDEOS].map((v, idx) => (
              <div class="wall-card" data-video-index={idx % DEMO_VIDEOS.length} data-src={v.videoUrl} data-title={v.title} data-slug={v.slug} data-desc={v.desc} data-poster={v.posterUrl}>
                <video src={v.videoUrl} poster={v.posterUrl} playsinline muted loop preload="none"></video>
                <span class="card-tag">{v.tag}</span>
                <span class="card-dur">{v.dur}</span>
                <div class="wall-card-play">
                  <div class="wall-card-play-icon"><i class="fas fa-play ml-0.5"></i></div>
                </div>
                <div class="card-info">
                  <div class="card-title">{v.shortTitle}</div>
                  <div class="card-action"><i class="fas fa-circle-play text-[10px]"></i>Bấm để xem video</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ THEATER SECTION (1clickvn style) ============ */}
      <section class="theater-section reveal" id="theater">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center max-w-3xl mx-auto mb-10">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 font-mono text-xs uppercase font-bold tracking-wider mb-3">
              <i class="fas fa-eye text-xs"></i>Xem Tận Mắt · Video AI Thật
            </span>
            <h2 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
              Xem Trước Khi Sở Hữu
            </h2>
            <p class="text-slate-300 text-sm md:text-base leading-relaxed">
              Trailer 30s, video học viên và clip demo các ngách từ kho repo. Bấm chọn video bên phải để chuyển ngay lập tức.
            </p>
          </div>

          <div class="theater-layout">
            {/* Cinema Main Player */}
            <div class="cinema-box" id="cinemaScreenBox">
              <div class="player-frame" id="theaterPlayerFrame">
                <div class="video-ambient-bg" id="theaterAmbientBg" style="background-image: url('/videos/posters/poster-khoa-hoc-muse-ai.jpg')"></div>
                <video
                  id="theaterVideoElement"
                  class="main-video"
                  src={DEMO_VIDEOS[0].videoUrl}
                  poster={DEMO_VIDEOS[0].posterUrl}
                  playsinline
                  preload="metadata"
                ></video>
                <button class="player-big-play" id="theaterBigPlayBtn" aria-label="Phát video">
                  <i class="fas fa-play text-white ml-1"></i>
                </button>
                <div class="player-bar">
                  <button class="theater-ctrl-btn" id="theaterPlayBtn" aria-label="Phát / tạm dừng">
                    <i class="fas fa-play" id="theaterPlayIcon"></i>
                  </button>
                  <div class="theater-progress" id="theaterProgressTrack">
                    <div class="theater-progress-fill" id="theaterProgressFill"></div>
                  </div>
                  <span class="theater-timecode" id="theaterTimecode">00:00 / 00:30</span>
                  <button class="theater-ctrl-btn" id="theaterSoundBtn" aria-label="Bật / tắt tiếng">
                    <i class="fas fa-volume-high" id="theaterSoundIcon"></i>
                  </button>
                  <button class="theater-ctrl-btn" id="theaterFullscreenBtn" aria-label="Toàn màn hình">
                    <i class="fas fa-expand"></i>
                  </button>
                </div>
              </div>
              <div class="player-info border-t border-[#1f1b4b]">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span class="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 text-xs font-bold uppercase tracking-wider" id="activeVideoTag">
                    {DEMO_VIDEOS[0].tag}
                  </span>
                  <span class="font-mono text-xs text-slate-400" id="activeVideoDur">
                    Thời lượng: {DEMO_VIDEOS[0].dur}
                  </span>
                </div>
                <h3 class="text-xl md:text-2xl font-extrabold text-white mb-2" id="activeVideoTitle">
                  {DEMO_VIDEOS[0].title}
                </h3>
                <p class="text-slate-300 text-sm leading-relaxed mb-5" id="activeVideoDesc">
                  {DEMO_VIDEOS[0].desc}
                </p>
                <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black text-white" id="activeVideoPrice">
                      {formatVND(DEMO_VIDEOS[0].price)}
                    </span>
                    <span class="text-xs text-slate-500 line-through" id="activeVideoOrigPrice">
                      {formatVND(DEMO_VIDEOS[0].originalPrice)}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <a href={`/san-pham/${DEMO_VIDEOS[0].slug}`} id="activeVideoLink" class="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-fuchsia-500 text-white font-semibold text-xs hover:opacity-90 transition">
                      <i class="fas fa-bolt"></i>Mua sản phẩm này
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Sidebar */}
            <div class="playlist-panel">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#1f1b4b]">
                <div class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fas fa-list-ul text-brand-400"></i>Danh sách video ({DEMO_VIDEOS.length})
                </div>
                <span class="text-[11px] text-slate-400 font-medium">Bấm để đổi video</span>
              </div>
              <div class="playlist" id="theaterPlaylist">
                {DEMO_VIDEOS.map((v, i) => (
                  <div class={`playlist-item ${i === 0 ? 'active' : ''}`} data-index={i}>
                    <div class="playlist-thumb-wrap">
                      <img src={v.posterUrl} alt={v.shortTitle} loading="lazy" />
                      <span class="thumb-dur">{v.dur}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] uppercase font-bold text-brand-400">{v.tag}</span>
                      </div>
                      <h4 class="text-xs font-bold text-white truncate group-hover:text-brand-300">{v.shortTitle}</h4>
                      <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span class="font-extrabold text-amber-400">{formatVND(v.price)}</span>
                      </div>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-slate-400 shrink-0">
                      <i class="fas fa-play"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
          <SectionTitle center title="Lợi ích khi mua tại WebSkill AI" subtitle="Trải nghiệm tuyệt vời cùng những ưu điểm vượt trội" />
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
