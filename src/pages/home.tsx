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
    platform: 'tiktok' as const,
    handle: '@museai.skill',
    caption: 'Skill AI làm video 30s liền mạch từ prompt đến clip viral #MuseAI #AIVideo #SkillAI',
    music: '♫ KhoSkill AI - Muse AI Sound',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=museai1',
    likes: '142.8K',
    comments: '2.5K',
    saves: '18.4K',
    shares: '3.9K',
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
    platform: 'reels' as const,
    handle: '@seedance.pro',
    caption: 'One-take 30 giây nhân vật giữ nguyên & âm thanh native trên Seedance 2.5 #Seedance25 #BuildPage',
    music: '♫ Seedance Official - Trending Beat',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=seedance',
    likes: '189.2K',
    comments: '3.2K',
    saves: '24.6K',
    shares: '6.8K',
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
    platform: 'instagram' as const,
    handle: '@thuysinh.ai',
    caption: 'Công thức dựng video thuỷ sinh AI mượt mà build page Reels triệu view #ThuySinh #AIReels',
    music: '♫ Zen Water Studio - Lo-Fi Ambient',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aquatic',
    likes: '98.5K',
    comments: '1.1K',
    saves: '14.2K',
    shares: '2.8K',
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
    platform: 'shorts' as const,
    handle: '@lamvuondiy.ai',
    caption: 'Kịch bản làm vườn DIY 30s cuốn hút từng khung hình #LamVuon #DIY #SkillAI',
    music: '♫ Morning Garden - Acoustic Warm',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=garden',
    likes: '115.6K',
    comments: '1.8K',
    saves: '19.3K',
    shares: '4.1K',
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
    platform: 'tiktok' as const,
    handle: '@fitness.affiliate',
    caption: 'Skill dựng video Fitness chốt đơn Affiliate TikTok Shop chuyển đổi cao #FitnessAI #Affiliate',
    music: '♫ Fitness Power - EDM Tempo',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=fitness',
    likes: '214.0K',
    comments: '4.9K',
    saves: '32.1K',
    shares: '9.4K',
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
      <script id="demo-videos-json" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DEMO_VIDEOS).replace(/</g, '\\u003c') }}></script>

      {/* ============ HERO ============ */}
      <section id="hero-section" class="relative bg-[#070614] text-white overflow-hidden">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="absolute inset-0 hero-grid"></div>
        <div class="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div class="grid lg:grid-cols-2 gap-10 xl:gap-12 items-center">
            <div class="min-w-0">
              <div class="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-[11px] sm:text-xs font-semibold mb-6 max-w-full">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true"></span>
                <span>Đang mở bán <b class="text-emerald-300 tabular-nums">{stats.products} Skill AI</b></span>
                <span class="text-white/40" aria-hidden="true">·</span>
                <span><span class="tabular-nums">{stats.sold.toLocaleString('vi-VN')}+</span> lượt mua thành công</span>
              </div>
              <h1 class="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5">
                Kho <span class="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Skill AI Làm Video</span> thực chiến số 1 Việt Nam
              </h1>
              <p class="text-[#c2c0e0] text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                Mở bán trọn bộ 5 Skill AI thực chiến làm video 30s chuẩn viral: Muse AI Pro, Seedance 2.5, Thuỷ Sinh, DIY Làm Vườn, Affiliate Fitness.
                Mua một lần — sở hữu trọn đời — giao link tải tự động 24/7.
              </p>
              <div class="flex flex-wrap items-center gap-3 mb-9">
                <a href="/san-pham?type=skill" class="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-semibold shadow-xl shadow-indigo-500/30 hover:opacity-95 transition">
                  <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>Xem 5 Skill đang mở bán
                </a>
                <a href="#theater" id="heroTrailerBtn" class="h-12 px-5 inline-flex items-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-semibold text-white transition shadow-lg">
                  <span class="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white shadow"><i class="fas fa-play ml-0.5" aria-hidden="true"></i></span>
                  Xem demo 30s
                </a>
                {comingSoon.length > 0 && (
                  <a href="#coming-soon-section" class="h-12 px-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur font-semibold text-[#c2c0e0] hover:text-white hover:bg-white/10 transition">
                    <i class="fas fa-clock text-amber-400" aria-hidden="true"></i>Dịch vụ sắp mở
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
                    <i class={`fas ${icon} text-indigo-400 mb-1.5`} aria-hidden="true"></i>
                    <div class="text-xl font-extrabold tabular-nums">{num}</div>
                    <div class="text-[11px] text-[#9492b8]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero 3D Multi-Device MXH Phone Stage (TikTok / FB Reels / IG Reels / YT Shorts) */}
            <div class="hero-stage-wrapper relative min-w-0">
              {/* Interactive MXH Platform Switcher */}
              <div class="flex justify-center mb-4">
                <div id="heroPlatformTabs" role="tablist" aria-label="Mô phỏng giao diện mạng xã hội"
                  class="inline-flex flex-wrap items-center justify-center gap-1 p-1 rounded-2xl bg-[#0f0e24]/90 border border-[#221e54] shadow-xl backdrop-blur-md">
                  {[
                    { id: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok' },
                    { id: 'reels', label: 'FB Reels', icon: 'fab fa-facebook' },
                    { id: 'instagram', label: 'IG Reels', icon: 'fab fa-instagram' },
                    { id: 'shorts', label: 'YT Shorts', icon: 'fab fa-youtube' }
                  ].map((pf, idx) => (
                    <button type="button" role="tab" data-platform={pf.id} aria-selected={idx === 0 ? 'true' : 'false'}
                      class={`platform-pill ${idx === 0 ? 'is-active' : ''}`}>
                      <i class={pf.icon} aria-hidden="true"></i>
                      <span>{pf.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div class="relative">
                <button type="button" id="heroPrevPhoneBtn" class="phone-nav-arrow phone-nav-prev" aria-label="Xem video trước" title="Chuyển video trước (Trái)">
                  <i class="fas fa-chevron-left" aria-hidden="true"></i>
                </button>
                <button type="button" id="heroNextPhoneBtn" class="phone-nav-arrow phone-nav-next" aria-label="Xem video tiếp theo" title="Chuyển video kế tiếp (Phải)">
                  <i class="fas fa-chevron-right" aria-hidden="true"></i>
                </button>

                <div class="hero-stage frame-landscape" id="heroStage">
                  {/* Back Left Preview Card */}
                  <div class="phone phone-back phone-left" id="heroLeftPhone" role="button" tabindex={0} aria-label="Xem video mẫu trước" title="Nhấp để xem video này ở giữa">
                    <div class="phone-notch"></div>
                    <img
                      id="heroLeftImg"
                      src={DEMO_VIDEOS[4].posterUrl}
                      alt={DEMO_VIDEOS[4].shortTitle}
                      class="w-full h-full object-cover"
                      decoding="async"
                    />
                    <div class="phone-side-hint phone-side-hint-left">
                      <i class="fas fa-arrow-right mr-1" aria-hidden="true"></i> Xem tiếp
                    </div>
                  </div>

                  {/* Back Right Preview Card */}
                  <div class="phone phone-back phone-right" id="heroRightPhone" role="button" tabindex={0} aria-label="Xem video mẫu kế tiếp" title="Nhấp để xem video này ở giữa">
                    <div class="phone-notch"></div>
                    <img
                      id="heroRightImg"
                      src={DEMO_VIDEOS[1].posterUrl}
                      alt={DEMO_VIDEOS[1].shortTitle}
                      class="w-full h-full object-cover"
                      decoding="async"
                    />
                    <div class="phone-side-hint phone-side-hint-right">
                      Xem tiếp <i class="fas fa-arrow-left ml-1" aria-hidden="true"></i>
                    </div>
                  </div>

                  {/* Main Front MXH Smartphone Showcase Frame (Auto morphs 16:9 Landscape <-> 9:16 Portrait) */}
                  <div class="phone phone-front frame-landscape" id="heroFrontPhone">
                    <div class="phone-notch"></div>
                    <div class="video-ambient-bg" id="heroFrontAmbient" style={`background-image:url('${DEMO_VIDEOS[0].posterUrl}')`}></div>

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

                    <button type="button" id="heroPlayCenterBtn" class="phone-play-btn" aria-label="Phát hoặc tạm dừng video">
                      <i class="fas fa-play text-white ml-0.5" id="heroPlayCenterIcon" aria-hidden="true"></i>
                    </button>

                    {/* Authentic MXH Short Video UI Overlay (TikTok / FB Reels / IG Reels / YT Shorts) */}
                    <div class="short-gui-overlay" id="shortGuiOverlay" data-platform={DEMO_VIDEOS[0].platform}>
                      <div class="short-top-bar" id="shortTopBar">
                        <div class="short-top-left" id="shortTopLeft">
                          <span class="short-badge-live" id="shortPlatformBadge"><i class="fab fa-tiktok mr-1" aria-hidden="true"></i>LIVE</span>
                          <span class="short-top-pill" id="shortTopModePill">Dành cho bạn</span>
                        </div>
                        <div class="short-top-right">
                          <button type="button" id="heroSoundBtn" class="short-sound-btn" aria-label="Bật tiếng" title="Bật / tắt tiếng">
                            <i class="fas fa-volume-xmark" aria-hidden="true"></i>
                            <span id="heroSoundText">Bật tiếng</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Social Interaction Stack (vertical on 9:16, compact horizontal pills on 16:9) */}
                      <div class="short-actions" id="shortActions">
                        <div class="short-avatar-box" id="shortAvatarBox">
                          <img src={DEMO_VIDEOS[0].avatar} alt="Tác giả kênh" class="short-avatar-img" id="shortAvatarImg" />
                          <button type="button" class="short-follow-plus" id="shortFollowPlus" aria-label="Theo dõi kênh" title="Theo dõi"><i class="fas fa-plus" aria-hidden="true"></i></button>
                        </div>

                        <button type="button" class="short-action-btn" id="shortLikeBtn" aria-label="Thích video" title="Thích">
                          <span class="action-icon-circle"><i class="fas fa-heart" id="shortLikeIcon" aria-hidden="true"></i></span>
                          <span class="action-count tabular-nums" id="shortLikeCount">{DEMO_VIDEOS[0].likes}</span>
                        </button>

                        <button type="button" class="short-action-btn" id="shortCommentBtn" aria-label="Xem bình luận" title="Bình luận">
                          <span class="action-icon-circle"><i class="fas fa-comment-dots" id="shortCommentIcon" aria-hidden="true"></i></span>
                          <span class="action-count tabular-nums" id="shortCommentCount">{DEMO_VIDEOS[0].comments}</span>
                        </button>

                        <button type="button" class="short-action-btn" id="shortSaveBtn" aria-label="Lưu video" title="Lưu">
                          <span class="action-icon-circle"><i class="fas fa-bookmark" id="shortSaveIcon" aria-hidden="true"></i></span>
                          <span class="action-count tabular-nums" id="shortSaveCount">{DEMO_VIDEOS[0].saves}</span>
                        </button>

                        <button type="button" class="short-action-btn" id="shortShareBtn" aria-label="Chia sẻ video" title="Chia sẻ">
                          <span class="action-icon-circle"><i class="fas fa-share" id="shortShareIcon" aria-hidden="true"></i></span>
                          <span class="action-count tabular-nums" id="shortShareCount">{DEMO_VIDEOS[0].shares}</span>
                        </button>

                        <div class="short-disc-box" id="shortDiscBox" aria-hidden="true">
                          <div class="short-disc-spin" id="shortDiscSpin">
                            <i class="fas fa-compact-disc text-white text-base"></i>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Author & Caption HUD */}
                      <div class="short-bottom-info" id="shortBottomInfo">
                        <div class="short-author-row" id="shortAuthorRow">
                          <span class="short-author-handle" id="shortAuthorHandle">{DEMO_VIDEOS[0].handle}</span>
                          <span class="short-verified-badge" id="shortVerifiedBadge" aria-label="Đã xác minh"><i class="fas fa-circle-check text-sky-400" aria-hidden="true"></i></span>
                          <button type="button" class="short-follow-pill" id="shortFollowPill">Theo dõi</button>
                        </div>
                        <p class="short-caption" id="shortCaption">{DEMO_VIDEOS[0].caption}</p>
                        <div class="short-music-track" id="shortMusicTrack">
                          <i class="fas fa-music text-[10px]" aria-hidden="true"></i>
                          <span class="short-music-title truncate" id="shortMusicTitle">{DEMO_VIDEOS[0].music}</span>
                        </div>
                      </div>

                      <div class="short-progress-track" id="heroProgressTrack" role="slider" aria-label="Tua tiến độ video" tabindex={0}>
                        <div class="short-progress-fill" id="heroProgressFill"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Product Meta Strip outside Phone Frame (No cramped top bar) */}
              <div id="heroMetaStrip" class="mt-4 mx-auto max-w-md rounded-2xl bg-[#0f0e24]/90 border border-[#221e54] px-3.5 py-2.5 flex items-center justify-between gap-3 backdrop-blur-md shadow-lg">
                <div class="min-w-0 flex items-center gap-2.5">
                  <span id="heroAspectPill" class="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold shrink-0">16:9</span>
                  <div class="min-w-0">
                    <div id="heroStudioLabel" class="text-xs font-bold text-white truncate">{DEMO_VIDEOS[0].shortTitle}</div>
                    <div class="text-[11px] text-[#9492b8] tabular-nums">Giá Skill: <b id="heroActivePrice" class="text-amber-300">{formatVND(DEMO_VIDEOS[0].price)}</b></div>
                  </div>
                </div>
                <a href={`/san-pham/${DEMO_VIDEOS[0].slug}`} id="heroDetailLink"
                  class="shrink-0 h-8 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-1.5 transition">
                  <span>Chi tiết</span>
                  <i class="fas fa-arrow-right text-[10px]" aria-hidden="true"></i>
                </a>
              </div>
              <p class="text-center text-[11px] text-[#9492b8] mt-2">
                Chọn nền tảng MXH ở trên hoặc bấm <b>Trái / Phải</b> để đổi video demo
              </p>
            </div>
          </div>
        </div>

        {/* Trust marquee */}
        <div class="relative border-t border-white/5 bg-[#070614]/70 backdrop-blur py-3 marquee-wrap overflow-hidden">
          <div class="marquee-track flex gap-10 w-max text-[#9492b8] text-xs font-semibold whitespace-nowrap">
            {[...Array(2)].map(() => (
              <>
                {['Muse AI', 'Seedance 2.5', 'Veo 3', 'Google Flow', 'Kling AI', 'ChatGPT', 'Gemini', 'CapCut', 'Sora', 'Runway'].map(b => (
                  <span class="flex items-center gap-2"><i class="fas fa-circle-nodes text-indigo-500/70" aria-hidden="true"></i>{b}</span>
                ))}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VIDEO WALL MARQUEE ============ */}
      <section class="wall" id="theater-wall" aria-label="Clip mẫu làm bằng AI">
        <div class="wall-head">
          <div class="flex flex-wrap items-center gap-3">
            <span class="wall-kicker">
              <i class="fas fa-wand-magic-sparkles text-indigo-400" aria-hidden="true"></i>
              Làm bằng Muse AI &amp; Seedance
            </span>
            <span class="wall-note">
              <i class="fas fa-mouse-pointer text-[#9492b8] mr-1" aria-hidden="true"></i>
              Clip thật từ kho dự án. Rê chuột hoặc bấm Tạm dừng · Nhấp để xem lớn.
            </span>
          </div>
          <button type="button" id="wallToggleBtn" class="wall-toggle-btn" aria-pressed="false" aria-label="Tạm dừng dải video chạy tự động">
            <i class="fas fa-pause text-[11px]" aria-hidden="true"></i>
            <span>Tạm dừng</span>
          </button>
        </div>
        <div class="wall-track-wrapper">
          <div class="wall-track" id="wallTrack">
            {[...DEMO_VIDEOS, ...DEMO_VIDEOS].map((v, idx) => (
              <button type="button"
                class={`wall-card ${v.orient === 'portrait' ? 'wall-card-portrait' : 'wall-card-landscape'}`}
                data-video-index={idx % DEMO_VIDEOS.length} data-src={v.videoUrl} data-title={v.title}
                data-slug={v.slug} data-desc={v.desc} data-poster={v.posterUrl} data-orient={v.orient}
                aria-label={`Xem demo ${v.shortTitle}`}>
                <img src={v.posterUrl} alt={v.shortTitle} loading="lazy" decoding="async" class="wall-card-thumb" />
                <span class="card-tag">{v.tag}</span>
                <span class="card-dur tabular-nums">{v.dur}</span>
                <span class="wall-card-play" aria-hidden="true">
                  <span class="wall-card-play-icon"><i class="fas fa-play ml-0.5"></i></span>
                </span>
                <div class="card-info">
                  <div class="card-title">{v.shortTitle}</div>
                  <div class="card-action"><i class="fas fa-circle-play text-[10px]" aria-hidden="true"></i>Bấm để xem video</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ THEATER SECTION ============ */}
      <section class="theater-section reveal" id="theater">
        <div class="max-w-7xl mx-auto px-4">
          <div class="text-center max-w-3xl mx-auto mb-10">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 font-mono text-xs uppercase font-bold tracking-wider mb-3">
              <i class="fas fa-eye text-xs" aria-hidden="true"></i>Xem Tận Mắt · Video AI Thật
            </span>
            <h2 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
              Xem Trước Khi Sở Hữu
            </h2>
            <p class="text-[#c2c0e0] text-sm md:text-base leading-relaxed">
              Video demo thực tế từng bộ Skill AI. Bấm chọn video bên phải để chuyển ngay lập tức.
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
                <button type="button" class="player-big-play" id="theaterBigPlayBtn" aria-label="Phát video">
                  <i class="fas fa-play text-white ml-1" aria-hidden="true"></i>
                </button>
                <div class="player-bar">
                  <button type="button" class="theater-ctrl-btn" id="theaterPlayBtn" aria-label="Phát hoặc tạm dừng">
                    <i class="fas fa-play" id="theaterPlayIcon" aria-hidden="true"></i>
                  </button>
                  <div class="theater-progress" id="theaterProgressTrack" role="slider" aria-label="Tua video" tabindex={0}>
                    <div class="theater-progress-fill" id="theaterProgressFill"></div>
                  </div>
                  <span class="theater-timecode tabular-nums" id="theaterTimecode">00:00 / 00:30</span>
                  <button type="button" class="theater-ctrl-btn" id="theaterSoundBtn" aria-label="Bật hoặc tắt tiếng">
                    <i class="fas fa-volume-high" id="theaterSoundIcon" aria-hidden="true"></i>
                  </button>
                  <button type="button" class="theater-ctrl-btn" id="theaterFullscreenBtn" aria-label="Toàn màn hình">
                    <i class="fas fa-expand" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div class="player-info border-t border-[#221e54]">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span class="px-2.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-xs font-bold uppercase tracking-wider" id="activeVideoTag">
                    {DEMO_VIDEOS[0].tag}
                  </span>
                  <span class="font-mono text-xs text-[#9492b8] tabular-nums" id="activeVideoDur">
                    Thời lượng: {DEMO_VIDEOS[0].dur}
                  </span>
                </div>
                <h3 class="text-xl md:text-2xl font-extrabold text-white mb-2" id="activeVideoTitle">
                  {DEMO_VIDEOS[0].title}
                </h3>
                <p class="text-[#c2c0e0] text-sm leading-relaxed mb-5" id="activeVideoDesc">
                  {DEMO_VIDEOS[0].desc}
                </p>
                <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black text-white tabular-nums" id="activeVideoPrice">
                      {formatVND(DEMO_VIDEOS[0].price)}
                    </span>
                    <span class="text-xs text-[#9492b8] line-through tabular-nums" id="activeVideoOrigPrice">
                      {formatVND(DEMO_VIDEOS[0].originalPrice)}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <a href={`/san-pham/${DEMO_VIDEOS[0].slug}`} id="activeVideoLink" class="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold text-xs hover:opacity-95 transition">
                      <i class="fas fa-bolt" aria-hidden="true"></i>Mua sản phẩm này
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Sidebar */}
            <div class="playlist-panel">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#221e54]">
                <div class="text-sm font-bold text-white flex items-center gap-2">
                  <i class="fas fa-list-ul text-indigo-400" aria-hidden="true"></i>Danh sách video ({DEMO_VIDEOS.length})
                </div>
                <span class="text-[11px] text-[#9492b8] font-medium">Bấm để đổi video</span>
              </div>
              <div class="playlist" id="theaterPlaylist">
                {DEMO_VIDEOS.map((v, i) => (
                  <button type="button" class={`playlist-item ${i === 0 ? 'active' : ''}`} data-index={i} aria-pressed={i === 0 ? 'true' : 'false'}>
                    <div class="playlist-thumb-wrap">
                      <img src={v.posterUrl} alt={v.shortTitle} loading="lazy" />
                      <span class="thumb-dur tabular-nums">{v.dur}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] uppercase font-bold text-indigo-400">{v.tag}</span>
                      </div>
                      <h4 class="text-xs font-bold text-white truncate">{v.shortTitle}</h4>
                      <div class="text-[11px] text-[#9492b8] mt-1 flex items-center gap-2">
                        <span class="font-extrabold text-amber-300 tabular-nums">{formatVND(v.price)}</span>
                      </div>
                    </div>
                    <span class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-[#9492b8] shrink-0" aria-hidden="true">
                      <i class="fas fa-play"></i>
                    </span>
                  </button>
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

      {/* ============ UNIFIED CATALOG SHOWCASE (Single De-duplicated Grid + Filter Tabs) ============ */}
      <section id="catalog-section" class="max-w-7xl mx-auto px-4 py-8 reveal">
        <SectionTitle
          title="Kho Skill AI thực chiến"
          subtitle="5 bộ Skill làm video 30s đang mở bán — lọc nhanh theo mức độ phổ biến"
          more={{ href: '/san-pham?type=skill', label: 'Xem tất cả' }}
        />
        <div role="tablist" aria-label="Lọc danh sách Skill AI" class="flex flex-wrap items-center gap-2 mb-7">
          <button type="button" role="tab" aria-selected="true" class="tab-btn active h-10 px-4 rounded-xl border border-[#2a2559] bg-[#0f0e24] text-sm font-bold text-[#c2c0e0] transition cursor-pointer" data-tab="featured" data-group="hp">
            <i class="fas fa-wand-magic-sparkles mr-1.5 text-indigo-300" aria-hidden="true"></i>Đang mở bán ({featured.length})
          </button>
          <button type="button" role="tab" aria-selected="false" class="tab-btn h-10 px-4 rounded-xl border border-[#2a2559] bg-[#0f0e24] text-sm font-bold text-[#c2c0e0] hover:text-white transition cursor-pointer" data-tab="hot" data-group="hp">
            <i class="fas fa-fire mr-1.5 text-orange-400" aria-hidden="true"></i>Bán chạy nhất
          </button>
          <button type="button" role="tab" aria-selected="false" class="tab-btn h-10 px-4 rounded-xl border border-[#2a2559] bg-[#0f0e24] text-sm font-bold text-[#c2c0e0] hover:text-white transition cursor-pointer" data-tab="new" data-group="hp">
            <i class="fas fa-bolt mr-1.5 text-emerald-400" aria-hidden="true"></i>Mới ra mắt
          </button>
        </div>

        <div role="tabpanel" class="tab-panel" data-tab="featured" data-group="hp">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featured.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </div>
        <div role="tabpanel" class="tab-panel hidden" data-tab="hot" data-group="hp">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hot.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </div>
        <div role="tabpanel" class="tab-panel hidden" data-tab="new" data-group="hp">
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {newest.slice(0, 8).map(p => <ProductCard p={p} />)}
          </div>
        </div>
      </section>

      {/* ============ COMING SOON SERVICES ============ */}
      {comingSoon.length > 0 && (
        <section id="coming-soon-section" class="max-w-7xl mx-auto px-4 py-10 reveal">
          <div class="rounded-3xl bg-gradient-to-br from-[#0f0e24] via-[#17153d]/80 to-[#070614] p-7 md:p-10 text-white relative overflow-hidden border border-[#221e54]">
            <div class="absolute inset-0 hero-mesh opacity-30"></div>
            <div class="relative">
              <div class="flex flex-wrap items-end justify-between gap-4 mb-7">
                <div>
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-300 text-xs font-bold mb-3">
                    <i class="fas fa-clock" aria-hidden="true"></i>DỊCH VỤ TẠM THỜI CHƯA MỞ BÁN
                  </div>
                  <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">Khóa học, Chatbot, App &amp; Combo sắp ra mắt</h2>
                  <p class="text-[#b8b6d9] mt-1.5 text-sm md:text-base">Hiện tại hệ thống chỉ mở bán 5 bộ Skill AI. Các dịch vụ khác sẽ sớm mở bán trong thời gian tới.</p>
                </div>
                <a href="/lien-he" class="cta-white h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition">
                  Nhắn Zalo nhận lịch mở bán<i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
                </a>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {comingSoon.slice(0, 4).map(c => <ProductCard p={c} compact />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ BENEFITS ============ */}
      <section id="benefits-section" class="bg-[#0f0e24]/60 border-y border-[#221e54] py-16 mt-10 reveal">
        <div class="max-w-7xl mx-auto px-4">
          <SectionTitle center title={`Lợi ích khi mua tại ${siteName}`} subtitle="Trải nghiệm mượt mà cùng quy trình hỗ trợ chuẩn thực chiến" />
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {BENEFITS.map(b => (
              <div class="p-6 rounded-2xl border border-[#221e54] bg-[#0f0e24] hover:border-indigo-500/35 hover:shadow-lg transition group">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-lg mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition">
                  <i class={`fas ${b.icon}`} aria-hidden="true"></i>
                </div>
                <h3 class="font-bold text-white mb-1.5">{b.title}</h3>
                <p class="text-sm text-[#b8b6d9] leading-relaxed">{b.desc}</p>
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
            <div class="relative p-6 rounded-2xl bg-[#0f0e24] border border-[#221e54] text-center">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold font-mono">{s.n}</div>
              <div class="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 grid place-items-center text-xl mx-auto mt-2 mb-4">
                <i class={`fas ${s.icon}`} aria-hidden="true"></i>
              </div>
              <h3 class="font-bold text-white mb-1.5">{s.title}</h3>
              <p class="text-[13px] text-[#b8b6d9] leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <i class="fas fa-arrow-right absolute top-1/2 -right-4 text-[#5c5980] hidden lg:block" aria-hidden="true"></i>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ REVIEWS ============ */}
      {reviews.length > 0 && (
        <section id="reviews-section" class="bg-[#0f0e24] border-y border-[#221e54] py-16 reveal">
          <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-10">
              <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Khách hàng nói gì?</h2>
              <p class="text-[#b8b6d9] mt-2">Cảm nhận từ những người đã trải nghiệm sản phẩm của chúng tôi</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map(r => (
                <div class="p-6 rounded-2xl bg-[#070614]/85 border border-[#221e54]">
                  <Stars rating={r.rating} size="text-sm" />
                  <p class="text-[#d6d4ee] text-sm leading-relaxed my-4">"{r.comment}"</p>
                  <div class="flex items-center gap-3 pt-4 border-t border-[#221e54]">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-sm shrink-0">
                      {(r.full_name || 'K').charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0">
                      <div class="font-semibold text-white text-sm truncate">{r.full_name}</div>
                      <a href={`/san-pham/${r.product_slug}`} class="text-xs text-[#9492b8] truncate block hover:text-indigo-300">{r.product_name}</a>
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
      <section id="faq-section" class="bg-[#070614] border-t border-[#221e54] py-16 reveal">
        <div class="max-w-3xl mx-auto px-4">
          <SectionTitle center title="Câu hỏi thường gặp" subtitle="Những thắc mắc phổ biến nhất từ khách hàng" />
          <div class="space-y-3 mt-8">
            {FAQS.map((f, i) => (
              <div class="rounded-xl border border-[#221e54] bg-[#0f0e24] overflow-hidden">
                <button type="button" class="faq-q w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition cursor-pointer"
                  aria-expanded={i === 0 ? 'true' : 'false'}>
                  <span class="font-semibold text-white text-[15px]">{f.q}</span>
                  <i class={`faq-icon fas fa-plus text-indigo-400 text-sm transition-transform shrink-0 ${i === 0 ? 'rotate-45' : ''}`} aria-hidden="true"></i>
                </button>
                <div class={`faq-a px-5 pb-4 text-sm text-[#b8b6d9] leading-relaxed ${i === 0 ? '' : 'hidden'}`}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section id="cta-section" class="max-w-7xl mx-auto px-4 py-14 reveal">
        <div class="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-fuchsia-600 p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
          <div class="absolute inset-0 hero-grid opacity-20"></div>
          <div class="relative">
            <h2 class="text-2xl md:text-4xl font-extrabold mb-3 tracking-tight">Sẵn sàng bắt đầu kiếm tiền với video AI?</h2>
            <p class="text-white/90 mb-7 max-w-2xl mx-auto">Tham gia cùng hàng nghìn người đang dùng bộ Skill của chúng tôi để sản xuất video bán hàng mỗi ngày.</p>
            <div class="flex flex-wrap justify-center gap-3">
              <a href="/dang-ky" class="cta-white h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 font-bold hover:bg-slate-100 transition shadow-xl">
                <i class="fas fa-user-plus" aria-hidden="true"></i>Đăng ký miễn phí
              </a>
              <a href="/san-pham" class="h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/30 backdrop-blur font-semibold hover:bg-white/25 transition">
                <i class="fas fa-eye" aria-hidden="true"></i>Xem sản phẩm
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
