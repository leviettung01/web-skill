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
  comingSoon: Product[]
  posts: any[]
  reviews: any[]
  stats: { products: number; users: number; sold: number }
}

const BENEFITS = [
  { icon: 'fa-bolt', title: 'Giao hàng tự động 24/7', desc: 'Thanh toán xong nhận ngay bộ tài liệu Skill, prompt chuẩn và quy trình chi tiết trong tài khoản, không cần chờ admin.' },
  { icon: 'fa-infinity', title: 'Sở hữu trọn đời', desc: 'Mua một lần dùng mãi mãi, không phí ẩn, nhận mọi bản cập nhật prompt & quy trình mới hoàn toàn miễn phí.' },
  { icon: 'fa-wand-magic-sparkles', title: 'Skill thực chiến, test kỹ', desc: 'Tất cả 5 bộ Skill AI đang mở bán đều đã chạy thực tế ra video demo xem ngay trên trang sản phẩm.' },
  { icon: 'fa-headset', title: 'Hỗ trợ 1-1 qua Zalo', desc: 'Đội ngũ hỗ trợ cầm tay chỉ việc đến khi bạn áp dụng Skill để tạo được video đầu tiên.' },
  { icon: 'fa-shield-halved', title: 'Bảo hành & hoàn tiền', desc: 'Hoàn tiền 100% trong 7 ngày nếu nội dung Skill không đúng như mô tả hoặc video demo.' },
  { icon: 'fa-rocket', title: 'Cập nhật theo model mới', desc: 'Bộ Skill được tinh chỉnh liên tục theo Muse AI, Seedance 2.5, Veo 3, Flow... hoàn toàn miễn phí.' }
]

const STEPS = [
  { n: '01', icon: 'fa-user-plus', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản miễn phí chỉ với email trong 30 giây.' },
  { n: '02', icon: 'fa-cart-shopping', title: 'Chọn bộ Skill AI', desc: 'Xem video demo thực tế, đọc chi tiết ngách rồi thêm vào giỏ.' },
  { n: '03', icon: 'fa-qrcode', title: 'Thanh toán VietQR', desc: 'Quét mã VietQR chuyển khoản, hệ thống tự động xác nhận 24/7.' },
  { n: '04', icon: 'fa-download', title: 'Nhận link tải Skill', desc: 'Link tải + mã kích hoạt xuất hiện ngay trong "Sản phẩm của tôi".' }
]

const FAQS = [
  { q: 'Mua Skill AI thì tôi nhận được những gì?', a: 'Bạn nhận trọn bộ tài liệu số của Skill: file cấu hình/prompt chuẩn hoá theo ngách, quy trình từng bước tạo video 30s, checklist dựng clip & đăng page, cùng link hướng dẫn thực hành. Giao tự động ngay sau khi thanh toán.' },
  { q: 'Tôi chưa từng làm video AI thì có dùng được Skill không?', a: 'Hoàn toàn được. Mỗi bộ Skill đều viết sẵn công thức từng bước cho người mới, kèm ví dụ prompt thực tế và hỗ trợ qua Zalo nếu bạn gặp vướng mắc.' },
  { q: 'Các dịch vụ Khóa học, Chatbot, App Video AI khi nào mở bán?', a: 'Hiện tại hệ thống tập trung mở bán trước 5 bộ Skill AI hoàn thiện nhất. Các hạng mục Khóa học Video AI, Chatbot viết kịch bản, App làm video và Combo đang ở trạng thái Chưa mở bán để hoàn thiện chất lượng trước khi phát hành.' },
  { q: 'Thanh toán xong bao lâu thì nhận được hàng?', a: 'Hệ thống giao tự động 24/7. Ngay khi chuyển khoản đúng mã đơn hàng và hệ thống xác nhận thành công, link tải xuất hiện lập tức trong mục "Sản phẩm của tôi".' },
  { q: 'Tôi có thể dùng Skill cho nhiều kênh TikTok/Reels không?', a: 'Có. Skill mua một lần sử dụng không giới hạn cho mọi kênh cá nhân và kênh bán hàng của chính bạn.' }
]

const R2_BASE = 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev'

const DEMO_VIDEOS = [
  {
    id: 'muse-ai',
    title: 'Skill Video Muse AI Pro — Từ Prompt Đến Video 10s Chuẩn Viral',
    shortTitle: 'Skill Muse AI Pro 30s',
    tag: 'Skill AI',
    dur: '0:30',
    orient: 'landscape' as const,
    desc: 'Bộ Skill làm video AI bằng Muse AI từ A-Z: công thức prompt khóa nhân vật, render clip 10s lip-sync tiếng Việt tự nhiên, ghép thành video hoàn chỉnh.',
    videoUrl: `${R2_BASE}/videos/demo-khoa-hoc-muse-ai.mp4`,
    posterUrl: `${R2_BASE}/videos/posters/poster-khoa-hoc-muse-ai.jpg`,
    slug: 'khoa-hoc-video-muse-ai',
    price: 599000,
    originalPrice: 1299000
  },
  {
    id: 'seedance-25',
    title: 'Skill Video Seedance 2.5 — One-Take 30s Build Page',
    shortTitle: 'Skill Seedance 2.5 · 30s',
    tag: 'Skill AI',
    dur: '0:30',
    orient: 'portrait' as const,
    desc: 'Bộ Skill làm chủ Seedance 2.5: quay one-take 30 giây nhân vật giữ nguyên, âm thanh native — công thức build page Reels/TikTok lên nhanh.',
    videoUrl: `${R2_BASE}/videos/demo-khoa-hoc-seedance.mp4`,
    posterUrl: `${R2_BASE}/videos/posters/poster-khoa-hoc-seedance.jpg`,
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
    orient: 'landscape' as const,
    desc: 'Bộ skill làm video thuỷ sinh 30s: prompt, quy trình render và checklist đăng bài để build page Reels ngách thuỷ sinh.',
    videoUrl: `${R2_BASE}/videos/demo-skill-thuy-sinh.mp4`,
    posterUrl: `${R2_BASE}/videos/posters/poster-skill-thuy-sinh.jpg`,
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
    orient: 'landscape' as const,
    desc: 'Skill làm video DIY làm vườn 30s: công thức cảnh quay, prompt mẫu và lịch đăng để build page Reels ngách làm vườn.',
    videoUrl: `${R2_BASE}/videos/demo-skill-lam-vuon.mp4`,
    posterUrl: `${R2_BASE}/videos/posters/poster-skill-lam-vuon.jpg`,
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
    orient: 'landscape' as const,
    desc: 'Skill làm video fitness 30s bán hàng affiliate: kịch bản chuyển đổi cao, prompt và quy trình edit tay chi tiết.',
    videoUrl: `${R2_BASE}/videos/demo-skill-fitness.mp4`,
    posterUrl: `${R2_BASE}/videos/posters/poster-skill-fitness.jpg`,
    slug: 'skill-video-affiliate-fitness',
    price: 449000,
    originalPrice: 899000
  }
]

export const HomePage: FC<Props> = (props) => {
  const { categories, featured, hot, newest, comingSoon, posts, reviews, stats } = props
  const siteName = props.settings?.site_name || 'KhoSkill AI'
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
                Đang mở bán <b class="text-emerald-300">{stats.products} Skill AI</b> — {stats.sold.toLocaleString('vi-VN')}+ lượt mua thành công
              </div>
              <h1 class="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5">
                Kho <span class="bg-gradient-to-r from-brand-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Skill AI Làm Video</span> thực chiến số 1 Việt Nam
              </h1>
              <p class="text-slate-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                Mở bán trọn bộ 5 Skill AI thực chiến làm video 30s chuẩn viral: Muse AI Pro, Seedance 2.5, Thuỷ Sinh, DIY Làm Vườn, Affiliate Fitness.
                Mua một lần — sở hữu trọn đời — giao link tải tự động 24/7.
              </p>
              <div class="flex flex-wrap items-center gap-3 mb-9">
                <a href="/san-pham?type=skill" class="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-fuchsia-500 font-semibold shadow-xl shadow-brand-500/30 hover:opacity-90 transition">
                  <i class="fas fa-wand-magic-sparkles"></i>Xem 5 Skill đang mở bán
                </a>
                <a href="#theater" id="heroTrailerBtn" class="h-12 px-5 inline-flex items-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-semibold text-white transition shadow-lg">
                  <span class="w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white shadow"><i class="fas fa-play ml-0.5"></i></span>
                  Xem demo 30s
                </a>
                {comingSoon.length > 0 && (
                  <a href="#coming-soon-section" class="h-12 px-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition">
                    <i class="fas fa-clock text-amber-400"></i>Dịch vụ sắp mở
                  </a>
                )}
              </div>
              <div class="grid grid-cols-3 gap-4 max-w-md">
                {[
                  ['fa-wand-magic-sparkles', stats.products + ' Skill', 'Đang mở bán'],
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

            {/* Hero 3D Multi-Device Stage with Switchable Carousel & Short GUI (Phone dọc chuẩn TikTok / Reels) */}
            <div class="hero-stage-wrapper relative">
              {/* Navigation arrows for switching phones */}
              <button id="heroPrevPhoneBtn" class="phone-nav-arrow phone-nav-prev" aria-label="Xem video trước" title="Chuyển video trước (Trái)">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button id="heroNextPhoneBtn" class="phone-nav-arrow phone-nav-next" aria-label="Xem video tiếp theo" title="Chuyển video kế tiếp (Phải)">
                <i class="fas fa-chevron-right"></i>
              </button>

              <div class="hero-stage frame-landscape" id="heroStage">
                {/* Back Left Preview Card (Poster-first for fast initial load) */}
                <div class="phone phone-back phone-left" id="heroLeftPhone" role="button" tabindex="0" title="Nhấp để xem video này ở giữa">
                  <div class="phone-notch"></div>
                  <img
                    id="heroLeftImg"
                    src={DEMO_VIDEOS[4].posterUrl}
                    alt={DEMO_VIDEOS[4].shortTitle}
                    class="w-full h-full object-cover"
                    decoding="async"
                  />
                  <div class="phone-side-hint phone-side-hint-left">
                    <i class="fas fa-arrow-right mr-1"></i> Xem tiếp
                  </div>
                </div>

                {/* Back Right Preview Card */}
                <div class="phone phone-back phone-right" id="heroRightPhone" role="button" tabindex="0" title="Nhấp để xem video này ở giữa">
                  <div class="phone-notch"></div>
                  <img
                    id="heroRightImg"
                    src={DEMO_VIDEOS[1].posterUrl}
                    alt={DEMO_VIDEOS[1].shortTitle}
                    class="w-full h-full object-cover"
                    decoding="async"
                  />
                  <div class="phone-side-hint phone-side-hint-right">
                    Xem tiếp <i class="fas fa-arrow-left ml-1"></i>
                  </div>
                </div>

                {/* Main Front Showcase Frame (Auto morphs 16:9 Landscape <-> 9:16 Portrait) */}
                <div class="phone phone-front frame-landscape" id="heroFrontPhone">
                  <div class="phone-notch"></div>
                  <div class="video-ambient-bg" id="heroFrontAmbient" style={`background-image:url('${DEMO_VIDEOS[0].posterUrl}')`}></div>

                  {/* Main video: giữ nguyên tỉ lệ gốc (object-fit: contain), không crop */}
                  <video
                    id="heroFrontVideo"
                    src={DEMO_VIDEOS[0].videoUrl}
                    poster={DEMO_VIDEOS[0].posterUrl}
                    playsinline
                    muted
                    loop
                    autoplay
                    preload="metadata"
                  ></video>

                  {/* Center play/pause overlay */}
                  <button id="heroPlayCenterBtn" class="phone-play-btn" aria-label="Phát / tạm dừng">
                    <i class="fas fa-play text-white ml-0.5" id="heroPlayCenterIcon"></i>
                  </button>

                  {/* Short Video GUI Overlay (TikTok / Reels / Instagram) */}
                  <div class="short-gui-overlay" id="shortGuiOverlay" data-platform="tiktok">
                    {/* Top Bar */}
                    <div class="short-top-bar" id="shortTopBar">
                      <div class="short-top-left" id="shortTopLeft">
                        <span class="short-badge-live"><i class="fas fa-tower-broadcast mr-1 text-rose-500"></i>LIVE</span>
                        <span class="short-top-pill">Dành cho bạn</span>
                      </div>
                      <div class="short-top-right">
                        <button id="heroSoundBtn" class="short-sound-btn" aria-label="Bật tiếng" title="Bật / tắt tiếng">
                          <i class="fas fa-volume-xmark mr-1"></i><span id="heroSoundText">Bật tiếng</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Action Icons Column */}
                    <div class="short-actions" id="shortActions">
                      {/* Avatar */}
                      <div class="short-avatar-box" id="shortAvatarBox">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=khoskill1" alt="Avatar" class="short-avatar-img" id="shortAvatarImg" />
                        <button class="short-follow-plus" id="shortFollowPlus" title="Theo dõi"><i class="fas fa-plus"></i></button>
                      </div>

                      {/* Like */}
                      <div class="short-action-btn" id="shortLikeBtn" role="button" title="Thích">
                        <div class="action-icon-circle"><i class="fas fa-heart text-white" id="shortLikeIcon"></i></div>
                        <span class="action-count" id="shortLikeCount">142.8K</span>
                      </div>

                      {/* Comment */}
                      <div class="short-action-btn" id="shortCommentBtn" role="button" title="Bình luận">
                        <div class="action-icon-circle"><i class="fas fa-comment-dots text-white" id="shortCommentIcon"></i></div>
                        <span class="action-count" id="shortCommentCount">2.5K</span>
                      </div>

                      {/* Bookmark / Save */}
                      <div class="short-action-btn" id="shortSaveBtn" role="button" title="Lưu">
                        <div class="action-icon-circle"><i class="fas fa-bookmark text-white" id="shortSaveIcon"></i></div>
                        <span class="action-count" id="shortSaveCount">18.4K</span>
                      </div>

                      {/* Share */}
                      <div class="short-action-btn" id="shortShareBtn" role="button" title="Chia sẻ">
                        <div class="action-icon-circle"><i class="fas fa-share text-white" id="shortShareIcon"></i></div>
                        <span class="action-count" id="shortShareCount">3.9K</span>
                      </div>

                      {/* Music Disc */}
                      <div class="short-disc-box" id="shortDiscBox">
                        <div class="short-disc-spin" id="shortDiscSpin">
                          <i class="fas fa-compact-disc text-white text-lg"></i>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div class="short-bottom-info" id="shortBottomInfo">
                      <div class="short-author-row" id="shortAuthorRow">
                        <span class="short-author-handle" id="shortAuthorHandle">@khoskill.ai</span>
                        <span class="short-verified-badge" id="shortVerifiedBadge"><i class="fas fa-circle-check text-sky-400"></i></span>
                        <button class="short-follow-pill" id="shortFollowPill">Theo dõi</button>
                      </div>
                      <p class="short-caption" id="shortCaption">
                        Skill làm video AI 30s liền mạch chỉ với 1 prompt chuẩn viral 🚀 Khóa nhân vật cực đỉnh #MuseAI #AIVideo #SkillAI
                      </p>
                      <div class="short-music-track" id="shortMusicTrack">
                        <i class="fas fa-music text-[10px] animate-pulse"></i>
                        <span class="short-music-title" id="shortMusicTitle">♫ KhoSkill AI - Âm thanh gốc</span>
                      </div>
                    </div>

                    {/* Bottom Scrubber */}
                    <div class="short-progress-track" id="heroProgressTrack">
                      <div class="short-progress-fill" id="heroProgressFill"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage interaction hint */}
              <div class="stage-nav-hint text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur shadow-sm">
                  <i class="fas fa-arrow-left-right text-brand-400"></i> Bấm <b>Trái / Phải</b> hoặc <b>chạm điện thoại 2 bên</b> để đổi chiều xem video
                </span>
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
            {[...DEMO_VIDEOS, ...DEMO_VIDEOS].map((v, idx) => (
              <div class={`wall-card ${v.orient === 'portrait' ? 'wall-card-portrait' : 'wall-card-landscape'}`}
                data-video-index={idx % DEMO_VIDEOS.length} data-src={v.videoUrl} data-title={v.title}
                data-slug={v.slug} data-desc={v.desc} data-poster={v.posterUrl} data-orient={v.orient}>
                <img src={v.posterUrl} alt={v.shortTitle} loading="lazy" decoding="async" class="wall-card-thumb" />
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
                <div class="video-ambient-bg" id="theaterAmbientBg" style={`background-image: url('${DEMO_VIDEOS[0].posterUrl}')`}></div>
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
          <SectionTitle title="5 Skill AI đang mở bán" subtitle="Bộ 5 Skill thực chiến tạo video 30s — đã test ra demo, mua là dùng ngay" more={{ href: '/san-pham?type=skill', label: 'Xem tất cả' }} />
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featured.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </section>
      )}

      {/* ============ COMING SOON SERVICES ============ */}
      {comingSoon.length > 0 && (
        <section id="coming-soon-section" class="max-w-7xl mx-auto px-4 py-10 reveal">
          <div class="rounded-3xl bg-gradient-to-br from-[#0f0e26] via-[#1a184c]/70 to-[#080716] p-7 md:p-10 text-white relative overflow-hidden border border-[#1f1b4b]">
            <div class="absolute inset-0 hero-mesh opacity-30"></div>
            <div class="relative">
              <div class="flex flex-wrap items-end justify-between gap-4 mb-7">
                <div>
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
                    <i class="fas fa-clock"></i>DỊCH VỤ TẠM THỜI CHƯA MỞ BÁN
                  </div>
                  <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">Khóa học, Chatbot, App &amp; Combo sắp ra mắt</h2>
                  <p class="text-[#9f9dbb] mt-1.5 text-sm md:text-base">Hiện tại hệ thống chỉ mở bán 5 bộ Skill AI. Các dịch vụ khác sẽ sớm mở bán trong thời gian tới.</p>
                </div>
                <a href="/lien-he" class="cta-white h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition">
                  Nhắn Zalo nhận lịch mở bán<i class="fas fa-arrow-right text-xs"></i>
                </a>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {comingSoon.slice(0, 4).map(c => <ProductCard p={c} compact />)}
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
          <SectionTitle center title={`Lợi ích khi mua tại ${siteName}`} subtitle="Trải nghiệm tuyệt vời cùng những ưu điểm vượt trội" />
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
        <SectionTitle center title="Mua hàng chỉ 4 bước" subtitle="Đơn giản, nhanh chóng, nhận link tải & tài liệu Skill ngay lập tức" />
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
              <a href="/dang-ky" class="cta-white h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 font-bold hover:bg-slate-100 transition shadow-xl">
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
