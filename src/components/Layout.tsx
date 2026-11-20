import type { FC, PropsWithChildren } from 'hono/jsx'
import type { SessionUser } from '../lib/types'

export interface LayoutProps {
  title?: string
  description?: string
  user?: SessionUser | null
  settings?: Record<string, string>
  cartCount?: number
  unreadNotifs?: number
  active?: string
  currentPath?: string
  currentQueryType?: string
  currentQuerySort?: string
  ogImage?: string
  canonical?: string
  bodyClass?: string
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = (props) => {
  const {
    title, description, user, settings = {}, cartCount = 0, unreadNotifs = 0,
    active = '', currentPath = '', currentQueryType = '', currentQuerySort = '',
    canonical, children
  } = props
  const siteName = settings.site_name || 'KhoSkill AI'
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} — ${settings.site_tagline || ''}`
  const desc = description || settings.site_tagline || 'Kho Skill AI tạo video chuyên nghiệp'

  const path = currentPath || '/'
  const isHome = active === 'home' || (currentPath === '/' && !active)
  const isProductsAll = (path === '/san-pham' && !currentQueryType && !currentQuerySort) || active === 'products'
  const isBestseller = path === '/san-pham' && (currentQuerySort === 'bestseller' || currentQuerySort === 'hot')
  const isSkill = (path === '/san-pham' && currentQueryType === 'skill') || path === '/danh-muc/skill-video-ai' || active === 'skill'
  const isMcpSkill = (path === '/san-pham' && currentQueryType === 'mcp_skill') || path === '/danh-muc/skill-ai-agent-mcp' || active === 'mcp_skill'
  const isCourse = (path === '/san-pham' && currentQueryType === 'course') || path === '/danh-muc/khoa-hoc-video-ai' || active === 'course'
  const isChatbot = (path === '/san-pham' && currentQueryType === 'chatbot') || path === '/danh-muc/chatbot-kich-ban' || active === 'chatbot'
  const isApp = (path === '/san-pham' && currentQueryType === 'app') || path === '/danh-muc/app-video-ai' || active === 'app'
  const isCombo = path === '/combo' || currentQueryType === 'combo' || path === '/danh-muc/combo-tiet-kiem' || active === 'combo'
  const isPricing = path === '/bang-gia' || active === 'pricing'
  const isBlog = path.startsWith('/blog') || active === 'blog'
  const isAffiliate = path === '/affiliate' || active === 'affiliate'
  const isAbout = path === '/gioi-thieu' || active === 'about'
  const isContact = (path === '/lien-he' || active === 'contact') && !currentQueryType

  const nav = [
    { href: '/', label: 'Trang chủ', key: 'home', icon: 'fa-house', on: isHome },
    { href: '/san-pham', label: 'Sản phẩm', key: 'products', icon: 'fa-cubes', on: path.startsWith('/san-pham') || path.startsWith('/danh-muc') || active === 'products' },
    { href: '/bang-gia', label: 'Bảng giá', key: 'pricing', icon: 'fa-tags', on: isPricing },
    { href: '/blog', label: 'Blog', key: 'blog', icon: 'fa-newspaper', on: isBlog },
    { href: '/affiliate', label: 'Affiliate', key: 'affiliate', icon: 'fa-handshake', on: isAffiliate }
  ]

  const mobExtraNav = [
    { href: '/combo', label: 'Combo', key: 'combo', icon: 'fa-box-open', on: isCombo },
    { href: '/lien-he', label: 'Liên hệ', key: 'contact', icon: 'fa-headset', on: isContact }
  ]

  const sbCls = (on: boolean) =>
    `sidebar-menu-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${on
      ? 'is-active text-white bg-indigo-500/15 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
      : 'text-[#c2c0e0] border border-transparent hover:text-white hover:bg-white/5'}`

  return (
    <html lang="vi" class="scroll-smooth overflow-x-clip">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{fullTitle}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        {props.ogImage && <meta property="og:image" content={props.ogImage} />}
        {canonical && <link rel="canonical" href={canonical} />}
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        <link href="/static/tailwind.css?v=20261124" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
        <link href="/static/style.css?v=20261124" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var s=localStorage.getItem('khoskill_sidebar_state');if(s==='expanded')document.documentElement.classList.add('sb-pinned');}catch(e){}})();`
        }}></script>
      </head>
      <body class={'bg-[#070614] text-[#f4f4fc] antialiased dark-portal overflow-x-clip ' + (props.bodyClass || '')}>
        <a href="#main-content" class="skip-link">Chuyển đến nội dung chính</a>
        <div id="nav-progress" aria-hidden="true"></div>
        <div id="sidebar-backdrop" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs hidden lg:hidden" aria-hidden="true"></div>
        <div class="flex min-h-screen">
          {/* LEFT SIDEBAR (Auto Hover-Expand Rail + Click "Thu gọn") */}
          <aside id="sidebar" aria-label="Thanh điều hướng bên" class="fixed inset-y-0 left-0 z-50 w-64 lg:w-[72px] bg-[#0f0e24]/95 backdrop-blur-md border-r border-[#221e54] flex flex-col justify-between transition-all duration-200 transform -translate-x-full lg:translate-x-0">
            <div class="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {/* Brand Logo */}
              <a href="/" class="h-16 shrink-0 flex items-center gap-3 px-[18px] border-b border-[#221e54] hover:bg-white/[0.03] transition-colors">
                <div class="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg shadow-indigo-500/25">
                  <i class="fas fa-wand-magic-sparkles text-sm" aria-hidden="true"></i>
                </div>
                <div class="leading-none sidebar-header-text min-w-0">
                  <div class="font-extrabold text-sm tracking-tight text-white whitespace-nowrap">{siteName}</div>
                  <div class="text-[10px] text-[#9492b8] mt-0.5 whitespace-nowrap">Kho Skill Video AI</div>
                </div>
              </a>

              {/* Navigation Menu */}
              <div class="px-3 py-4 flex flex-col gap-5">
                <div>
                  <div class="sidebar-group-label px-3 text-[10px] uppercase font-bold text-[#9492b8] tracking-wider mb-1.5 sidebar-text">Khám phá</div>
                  <nav class="flex flex-col gap-1" aria-label="Khám phá">
                    <a href="/" title="Trang chủ" data-nav="home" aria-current={isHome ? 'page' : undefined} class={sbCls(isHome)}>
                      <i class={`fas fa-house w-5 shrink-0 text-center ${isHome ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Trang chủ</span>
                    </a>
                    <a href="/san-pham" title="Tất cả sản phẩm" data-nav="all" aria-current={isProductsAll ? 'page' : undefined} class={sbCls(isProductsAll)}>
                      <i class={`fas fa-cubes w-5 shrink-0 text-center ${isProductsAll ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Tất cả sản phẩm</span>
                    </a>
                    <a href="/san-pham?sort=bestseller" title="Bán chạy nhất" data-nav="bestseller" aria-current={isBestseller ? 'page' : undefined} class={sbCls(isBestseller)}>
                      <i class={`fas fa-fire w-5 shrink-0 text-center ${isBestseller ? 'text-orange-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Bán chạy nhất</span>
                    </a>
                  </nav>
                </div>

                <div>
                  <div class="sidebar-group-label px-3 text-[10px] uppercase font-bold text-[#9492b8] tracking-wider mb-1.5 sidebar-text">Danh mục</div>
                  <nav class="flex flex-col gap-1" aria-label="Danh mục sản phẩm">
                    <a href="/san-pham?type=skill" title="Skill AI tự tải (Đang bán)" data-nav="skill" aria-current={isSkill ? 'page' : undefined} class={sbCls(isSkill)}>
                      <i class={`fas fa-wand-magic-sparkles w-5 shrink-0 text-center ${isSkill ? 'text-indigo-400' : 'text-indigo-400/80'}`} aria-hidden="true"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span class="truncate">Skill AI</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold leading-none shrink-0">Đang bán</span>
                      </span>
                    </a>
                    <a href="/san-pham?type=mcp_skill" title="Skill AI Agent (MCP) — Claude, Codex, Antigravity" data-nav="mcp_skill" aria-current={isMcpSkill ? 'page' : undefined} class={sbCls(isMcpSkill)}>
                      <i class={`fas fa-plug-circle-bolt w-5 shrink-0 text-center ${isMcpSkill ? 'text-cyan-300' : 'text-cyan-400/85'}`} aria-hidden="true"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span class="truncate">Skill Agent MCP</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold leading-none shrink-0">MCP Mới</span>
                      </span>
                    </a>
                    <a href="/san-pham?type=course" title="Khóa học Video AI (Sắp mở)" data-nav="course" aria-current={isCourse ? 'page' : undefined} class={sbCls(isCourse)}>
                      <i class={`fas fa-graduation-cap w-5 shrink-0 text-center ${isCourse ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span class="truncate">Khóa học</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#b8b6d9] font-semibold leading-none shrink-0">Sắp mở</span>
                      </span>
                    </a>
                    <a href="/san-pham?type=chatbot" title="Chatbot (Sắp mở)" data-nav="chatbot" aria-current={isChatbot ? 'page' : undefined} class={sbCls(isChatbot)}>
                      <i class={`fas fa-robot w-5 shrink-0 text-center ${isChatbot ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span class="truncate">Chatbot</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#b8b6d9] font-semibold leading-none shrink-0">Sắp mở</span>
                      </span>
                    </a>
                    <a href="/san-pham?type=app" title="App Video AI (Sắp mở)" data-nav="app" aria-current={isApp ? 'page' : undefined} class={sbCls(isApp)}>
                      <i class={`fas fa-mobile-screen-button w-5 shrink-0 text-center ${isApp ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span class="truncate">App Video AI</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#b8b6d9] font-semibold leading-none shrink-0">Sắp mở</span>
                      </span>
                    </a>
                    <a href="/combo" title="Combo tiết kiệm (Sắp mở)" data-nav="combo" aria-current={isCombo ? 'page' : undefined} class={sbCls(isCombo)}>
                      <i class={`fas fa-box-open w-5 shrink-0 text-center ${isCombo ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span class="truncate">Combo tiết kiệm</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#b8b6d9] font-semibold leading-none shrink-0">Sắp mở</span>
                      </span>
                    </a>
                  </nav>
                </div>

                <div>
                  <div class="sidebar-group-label px-3 text-[10px] uppercase font-bold text-[#9492b8] tracking-wider mb-1.5 sidebar-text">Thông tin</div>
                  <nav class="flex flex-col gap-1" aria-label="Thông tin và hỗ trợ">
                    <a href="/bang-gia" title="Bảng giá" data-nav="pricing" aria-current={isPricing ? 'page' : undefined} class={sbCls(isPricing)}>
                      <i class={`fas fa-tags w-5 shrink-0 text-center ${isPricing ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Bảng giá</span>
                    </a>
                    <a href="/blog" title="Blog kiến thức" data-nav="blog" aria-current={isBlog ? 'page' : undefined} class={sbCls(isBlog)}>
                      <i class={`fas fa-newspaper w-5 shrink-0 text-center ${isBlog ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Blog</span>
                    </a>
                    <a href="/affiliate" title="Affiliate" data-nav="affiliate" aria-current={isAffiliate ? 'page' : undefined} class={sbCls(isAffiliate)}>
                      <i class={`fas fa-handshake w-5 shrink-0 text-center ${isAffiliate ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Affiliate</span>
                    </a>
                    <a href="/gioi-thieu" title="Giới thiệu" data-nav="about" aria-current={isAbout ? 'page' : undefined} class={sbCls(isAbout)}>
                      <i class={`fas fa-circle-info w-5 shrink-0 text-center ${isAbout ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Giới thiệu</span>
                    </a>
                    <a href="/lien-he" title="Liên hệ & Yêu cầu riêng" data-nav="contact" aria-current={isContact ? 'page' : undefined} class={sbCls(isContact)}>
                      <i class={`fas fa-headset w-5 shrink-0 text-center ${isContact ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>
                      <span class="sidebar-text whitespace-nowrap">Liên hệ hỗ trợ</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            {/* Sidebar Footer Controls: Thu gọn + Ghim mở rộng */}
            <div class="p-3 border-t border-[#221e54] flex items-center gap-1.5 shrink-0">
              <button type="button" id="sidebar-toggle-btn" title="Thu gọn thanh bên" aria-label="Thu gọn thanh bên"
                class="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#c2c0e0] hover:text-white hover:bg-white/10 transition cursor-pointer">
                <i id="sidebar-toggle-icon" class="fas fa-angles-left w-5 shrink-0 text-center" aria-hidden="true"></i>
                <span id="sidebar-toggle-label" class="sidebar-text whitespace-nowrap">Thu gọn</span>
              </button>
              <button type="button" id="sidebar-pin-btn" title="Ghim cố định mở rộng" aria-label="Ghim cố định thanh bên"
                class="sidebar-badge w-9 h-9 shrink-0 grid place-items-center rounded-xl text-xs text-[#9492b8] hover:text-white hover:bg-white/10 transition cursor-pointer">
                <i class="fas fa-thumbtack" aria-hidden="true"></i>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT WRAPPER */}
          <div id="main-content-wrap" class="flex-1 min-w-0 lg:ml-[72px] flex flex-col min-h-screen transition-[margin] duration-200 overflow-x-clip">
            {/* Header */}
            <header id="site-header" class="sticky top-0 z-40 bg-[#0f0e24]/85 backdrop-blur border-b border-[#221e54]">
              <div class="max-w-7xl mx-auto px-4 sm:px-6">
                <div class="h-16 flex items-center justify-between gap-4">
                  {/* Left Brand on Mobile */}
                  <a href="/" class="flex lg:hidden items-center gap-2 shrink-0 group">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg">
                      <i class="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
                    </div>
                    <span class="font-extrabold text-sm tracking-tight text-white">{siteName}</span>
                  </a>

                  {/* Header Nav Links (Desktop - Streamlined 5 Links) */}
                  <nav id="main-nav" aria-label="Điều hướng chính" class="hidden lg:flex items-center gap-1.5">
                    {nav.map(n => (
                      <a href={n.href} data-top-nav={n.key} aria-current={n.on ? 'page' : undefined}
                        class={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${n.on ? 'is-active text-indigo-300 bg-indigo-500/15 border border-indigo-500/30' : 'text-[#b8b6d9] hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        {n.label}
                      </a>
                    ))}
                  </nav>

                  {/* Header Search (Desktop) */}
                  <form action="/san-pham" method="get" class="hidden md:flex flex-1 max-w-xs ml-auto" role="search">
                    <label for="header-search" class="sr-only">Tìm kiếm sản phẩm</label>
                    <div class="relative w-full">
                      <input type="text" name="q" placeholder="Tìm sản phẩm..." id="header-search"
                        class="w-full h-9 pl-9 pr-10 rounded-lg bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-xs text-white placeholder-[#9492b8] outline-none transition" />
                      <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#9492b8] text-xs" aria-hidden="true"></i>
                      <kbd class="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded bg-[#0f0e24] border border-white/10 text-[10px] font-mono text-[#9492b8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">/</kbd>
                    </div>
                  </form>

                  {/* Header Right Actions */}
                  <div class="flex items-center gap-2">
                    <a href="/gio-hang" id="cart-btn" aria-label={`Giỏ hàng (${cartCount} sản phẩm)`} title="Giỏ hàng"
                      class="relative w-9 h-9 grid place-items-center rounded-lg bg-[#161436] border border-[#2a2559] hover:bg-white/10 text-[#c2c0e0] hover:text-white transition">
                      <i class="fas fa-cart-shopping text-sm" aria-hidden="true"></i>
                      <span id="cart-badge" class={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold tabular-nums grid place-items-center ${cartCount > 0 ? '' : 'hidden'}`}>{cartCount}</span>
                    </a>

                    {user && (
                      <a href="/tai-khoan/thong-bao" id="notif-btn" aria-label={`Thông báo (${unreadNotifs} chưa đọc)`} title="Thông báo"
                        class="relative w-9 h-9 grid place-items-center rounded-lg bg-[#161436] border border-[#2a2559] hover:bg-white/10 text-[#c2c0e0] hover:text-white transition">
                        <i class="fas fa-bell text-sm" aria-hidden="true"></i>
                        <span id="notif-badge" class={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold tabular-nums grid place-items-center ${unreadNotifs > 0 ? '' : 'hidden'}`}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
                      </a>
                    )}

                    {user ? (
                      <div class="relative" id="user-menu-wrap">
                        <button type="button" id="user-menu-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="user-dropdown" aria-label="Menu tài khoản"
                          class="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg bg-[#161436] border border-[#2a2559] hover:bg-white/10 text-[#c2c0e0] hover:text-white transition cursor-pointer">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} class="w-7 h-7 rounded-full object-cover shadow-sm" referrerpolicy="no-referrer" />
                          ) : (
                            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold uppercase shadow-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span class="hidden sm:block text-xs font-medium max-w-[90px] truncate">{user.full_name}</span>
                          <i class="fas fa-chevron-down text-[9px] text-[#9492b8]" aria-hidden="true"></i>
                        </button>
                        <div id="user-dropdown" role="menu" class="hidden absolute right-0 mt-2 w-56 bg-[#0f0e24] rounded-xl shadow-xl border border-[#221e54] py-1.5 overflow-hidden">
                          <div class="px-4 py-2 border-b border-[#221e54]">
                            <div class="text-xs font-bold text-white truncate">{user.full_name}</div>
                            <div class="text-[11px] text-[#9492b8] truncate">{user.email}</div>
                          </div>
                          <a href="/tai-khoan" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-[#c2c0e0] hover:bg-white/5 hover:text-white"><i class="fas fa-gauge w-4 text-[#9492b8]" aria-hidden="true"></i>Tổng quan</a>
                          <a href="/tai-khoan/thong-bao" role="menuitem" class="flex items-center justify-between gap-2 px-4 py-2 text-xs text-[#c2c0e0] hover:bg-white/5 hover:text-white">
                            <span class="flex items-center gap-2"><i class="fas fa-bell w-4 text-[#9492b8]" aria-hidden="true"></i>Thông báo</span>
                            {unreadNotifs > 0 && <span class="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">{unreadNotifs}</span>}
                          </a>
                          <a href="/tai-khoan/san-pham" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-[#c2c0e0] hover:bg-white/5 hover:text-white"><i class="fas fa-box-archive w-4 text-[#9492b8]" aria-hidden="true"></i>Sản phẩm của tôi</a>
                          <a href="/tai-khoan/don-hang" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-[#c2c0e0] hover:bg-white/5 hover:text-white"><i class="fas fa-receipt w-4 text-[#9492b8]" aria-hidden="true"></i>Đơn hàng</a>
                          <a href="/tai-khoan/affiliate" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-[#c2c0e0] hover:bg-white/5 hover:text-white"><i class="fas fa-handshake w-4 text-[#9492b8]" aria-hidden="true"></i>Affiliate</a>
                          <a href="/tai-khoan/ho-so" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-[#c2c0e0] hover:bg-white/5 hover:text-white"><i class="fas fa-user-gear w-4 text-[#9492b8]" aria-hidden="true"></i>Hồ sơ &amp; Xác minh</a>
                          {user.role === 'admin' && (
                            <a href="/admin" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-amber-400 hover:bg-white/5 border-t border-[#221e54]"><i class="fas fa-shield-halved w-4" aria-hidden="true"></i>Quản trị</a>
                          )}
                          <a href="/dang-xuat" role="menuitem" class="flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-white/5 border-t border-[#221e54]"><i class="fas fa-right-from-bracket w-4" aria-hidden="true"></i>Đăng xuất</a>
                        </div>
                      </div>
                    ) : (
                      <div class="flex items-center gap-1.5">
                        <a href="/dang-nhap" class="hidden sm:inline-flex items-center px-3 h-9 rounded-lg text-xs font-semibold text-[#c2c0e0] hover:text-white hover:bg-white/5 transition">Đăng nhập</a>
                        <a href="/dang-ky" class="inline-flex items-center px-3.5 h-9 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-95 shadow-md shadow-indigo-600/25 transition">Đăng ký</a>
                      </div>
                    )}

                    <button type="button" id="mobile-menu-btn" aria-label="Mở menu điều hướng" aria-expanded="false" aria-controls="mobile-nav"
                      class="lg:hidden w-9 h-9 grid place-items-center rounded-lg bg-[#161436] border border-[#2a2559] hover:bg-white/10 text-[#c2c0e0] hover:text-white cursor-pointer">
                      <i class="fas fa-bars" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile menu nav dropdown */}
              <div id="mobile-nav" class="hidden lg:hidden border-t border-[#221e54] bg-[#0f0e24]">
                <div class="px-4 py-3 flex flex-col gap-2">
                  <form action="/san-pham" method="get" class="mb-2" role="search">
                    <label for="mobile-search" class="sr-only">Tìm kiếm sản phẩm</label>
                    <div class="relative">
                      <input type="text" name="q" id="mobile-search" placeholder="Tìm sản phẩm..."
                        class="w-full h-10 pl-10 pr-3 rounded-lg bg-[#161436] border border-[#2a2559] text-xs text-white placeholder-[#9492b8] outline-none" />
                      <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9492b8]" aria-hidden="true"></i>
                    </div>
                  </form>
                  <div class="grid grid-cols-2 gap-1.5">
                    {[...nav, ...mobExtraNav].map(n => (
                      <a href={n.href} data-mob-nav={n.key} aria-current={n.on ? 'page' : undefined}
                        class={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${n.on ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-[#c2c0e0] hover:bg-white/5'}`}>
                        <i class={`fas ${n.icon} w-4 text-center ${n.on ? 'text-indigo-400' : 'text-[#9492b8]'}`} aria-hidden="true"></i>{n.label}
                      </a>
                    ))}
                  </div>
                  <div class="pt-2 border-t border-[#221e54] flex flex-wrap gap-1.5">
                    <a href="/san-pham?type=skill" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                      <i class="fas fa-wand-magic-sparkles mr-1" aria-hidden="true"></i>Skill AI (Tự tải)
                    </a>
                    <a href="/san-pham?type=mcp_skill" class="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[11px] font-bold">
                      <i class="fas fa-plug-circle-bolt mr-1" aria-hidden="true"></i>Skill Agent MCP
                    </a>
                    <a href="/san-pham?type=course" class="px-2.5 py-1.5 rounded-lg bg-[#161436] text-[#9492b8] text-[11px] font-medium">Khóa học (Sắp mở)</a>
                    <a href="/san-pham?type=chatbot" class="px-2.5 py-1.5 rounded-lg bg-[#161436] text-[#9492b8] text-[11px] font-medium">Chatbot (Sắp mở)</a>
                    <a href="/san-pham?type=app" class="px-2.5 py-1.5 rounded-lg bg-[#161436] text-[#9492b8] text-[11px] font-medium">App Video AI (Sắp mở)</a>
                  </div>
                </div>
              </div>
            </header>

            {/* Main content body */}
            <main id="main-content" tabindex={-1} class="flex-1 min-w-0 outline-none">{children}</main>

            {/* Footer */}
            <footer id="site-footer" class="bg-[#060512] text-[#9492b8] border-t border-[#221e54] mt-16">
              <div class="max-w-7xl mx-auto px-4 py-12">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <div class="flex items-center gap-2.5 mb-4">
                      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg">
                        <i class="fas fa-wand-magic-sparkles text-sm" aria-hidden="true"></i>
                      </div>
                      <span class="font-extrabold text-base text-white">{siteName}</span>
                    </div>
                    <p class="text-xs leading-relaxed mb-4 text-[#b8b6d9]">{settings.site_tagline}</p>
                    <div class="flex gap-2">
                      {settings.facebook && (
                        <a href={settings.facebook} target="_blank" rel="noopener" aria-label="Facebook" title="Facebook"
                          class="w-9 h-9 rounded-lg bg-[#161436] hover:bg-indigo-600 grid place-items-center transition text-[#c2c0e0] hover:text-white"><i class="fab fa-facebook-f text-xs" aria-hidden="true"></i></a>
                      )}
                      {settings.zalo && (
                        <a href={`https://zalo.me/${settings.zalo}`} target="_blank" rel="noopener" aria-label="Chat Zalo" title="Zalo"
                          class="w-9 h-9 rounded-lg bg-[#161436] hover:bg-[#0068ff] grid place-items-center transition text-[#c2c0e0] hover:text-white text-[10px] font-bold">Zalo</a>
                      )}
                      {settings.youtube && (
                        <a href={settings.youtube} target="_blank" rel="noopener" aria-label="YouTube" title="YouTube"
                          class="w-9 h-9 rounded-lg bg-[#161436] hover:bg-red-600 grid place-items-center transition text-[#c2c0e0] hover:text-white"><i class="fab fa-youtube text-xs" aria-hidden="true"></i></a>
                      )}
                      {settings.tiktok && (
                        <a href={settings.tiktok} target="_blank" rel="noopener" aria-label="TikTok" title="TikTok"
                          class="w-9 h-9 rounded-lg bg-[#161436] hover:bg-white/20 grid place-items-center transition text-[#c2c0e0] hover:text-white"><i class="fab fa-tiktok text-xs" aria-hidden="true"></i></a>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 class="text-white font-bold mb-4 text-xs uppercase tracking-wider">Sản phẩm</h4>
                    <ul class="space-y-2 text-xs">
                      <li><a href="/san-pham?type=skill" class="text-white font-semibold hover:text-indigo-400 transition">Skill Tạo Video AI <span class="text-[10px] text-emerald-400 ml-1">(Đang bán)</span></a></li>
                      <li><a href="/san-pham?type=mcp_skill" class="text-cyan-300 font-semibold hover:text-cyan-200 transition">Skill AI Agent (MCP) <span class="text-[10px] text-cyan-400 ml-1">(Mới · Đang bán)</span></a></li>
                      <li><a href="/san-pham?type=course" class="hover:text-indigo-400 transition">Khóa học Video AI <span class="text-[10px] text-[#9492b8] ml-1">(Sắp mở)</span></a></li>
                      <li><a href="/san-pham?type=chatbot" class="hover:text-indigo-400 transition">Chatbot Kịch Bản <span class="text-[10px] text-[#9492b8] ml-1">(Sắp mở)</span></a></li>
                      <li><a href="/san-pham?type=app" class="hover:text-indigo-400 transition">App Làm Video AI <span class="text-[10px] text-[#9492b8] ml-1">(Sắp mở)</span></a></li>
                      <li><a href="/combo" class="hover:text-indigo-400 transition">Combo Trọn Bộ <span class="text-[10px] text-[#9492b8] ml-1">(Sắp mở)</span></a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-white font-bold mb-4 text-xs uppercase tracking-wider">Hỗ trợ</h4>
                    <ul class="space-y-2 text-xs">
                      <li><a href="/huong-dan" class="hover:text-indigo-400 transition">Hướng dẫn mua hàng</a></li>
                      <li><a href="/chinh-sach" class="hover:text-indigo-400 transition">Chính sách bảo hành</a></li>
                      <li><a href="/dieu-khoan" class="hover:text-indigo-400 transition">Điều khoản sử dụng</a></li>
                      <li><a href="/lien-he" class="hover:text-indigo-400 transition">Liên hệ hỗ trợ</a></li>
                      <li><a href="/gioi-thieu" class="hover:text-indigo-400 transition">Về chúng tôi</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-white font-bold mb-4 text-xs uppercase tracking-wider">Liên hệ</h4>
                    <ul class="space-y-3 text-xs">
                      <li class="flex gap-2.5"><i class="fas fa-phone-volume mt-0.5 text-indigo-400" aria-hidden="true"></i><span>Hotline: <b class="text-white tabular-nums">{settings.hotline}</b></span></li>
                      <li class="flex gap-2.5"><i class="fas fa-envelope mt-0.5 text-indigo-400" aria-hidden="true"></i><span>{settings.email}</span></li>
                      <li class="flex gap-2.5"><i class="fab fa-facebook-messenger mt-0.5 text-indigo-400" aria-hidden="true"></i><span>Chat Zalo/Messenger 24/7</span></li>
                    </ul>
                  </div>
                </div>
                <div class="mt-10 pt-6 border-t border-[#221e54] flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]">
                  <div>© 2026 {siteName}. Tất cả các quyền được bảo lưu.</div>
                  <div>Phát triển tại Việt Nam</div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* Floating contact */}
        <div id="float-contact" class="fixed right-4 bottom-4 z-45 flex flex-col gap-2.5">
          <a href={`https://zalo.me/${settings.zalo}`} target="_blank" rel="noopener" aria-label="Chat Zalo hỗ trợ" title="Chat Zalo"
            class="w-11 h-11 rounded-full bg-[#0068ff] text-white grid place-items-center shadow-xl hover:scale-110 transition text-[10px] font-bold">Zalo</a>
          <a href={`tel:${(settings.hotline || '').replace(/\s/g, '')}`} aria-label={`Gọi hotline ${settings.hotline || ''}`} title="Gọi ngay"
            class="w-11 h-11 rounded-full bg-emerald-600 text-white grid place-items-center shadow-xl hover:scale-110 transition text-sm">
            <i class="fas fa-phone" aria-hidden="true"></i>
          </a>
          <button type="button" id="back-to-top" aria-label="Lên đầu trang" title="Lên đầu trang"
            class="w-11 h-11 rounded-full bg-[#161436] border border-[#2a2559] text-white grid place-items-center shadow-xl hover:scale-110 transition opacity-0 pointer-events-none text-sm cursor-pointer">
            <i class="fas fa-arrow-up" aria-hidden="true"></i>
          </button>
        </div>

        <div id="toast-container" aria-live="polite" aria-atomic="true" role="status" class="fixed top-20 right-4 z-[100] flex flex-col gap-2"></div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js"></script>
        <script src="/static/app.js?v=20261124"></script>
      </body>
    </html>
  )
}
