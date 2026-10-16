import type { FC, PropsWithChildren } from 'hono/jsx'
import type { SessionUser } from '../lib/types'

export interface LayoutProps {
  title?: string
  description?: string
  user?: SessionUser | null
  settings?: Record<string, string>
  cartCount?: number
  active?: string
  ogImage?: string
  canonical?: string
  bodyClass?: string
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = (props) => {
  const {
    title, description, user, settings = {}, cartCount = 0,
    active = '', canonical, children
  } = props
  const siteName = settings.site_name || 'WebSkill AI'
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} — ${settings.site_tagline || ''}`
  const desc = description || settings.site_tagline || 'Kho source code & tool AI tạo video'

  const nav = [
    { href: '/', label: 'Trang chủ', key: 'home', icon: 'fa-house' },
    { href: '/san-pham', label: 'Sản phẩm', key: 'products', icon: 'fa-cubes' },
    { href: '/combo', label: 'Combo', key: 'combo', icon: 'fa-box-open' },
    { href: '/bang-gia', label: 'Bảng giá', key: 'pricing', icon: 'fa-tags' },
    { href: '/blog', label: 'Blog', key: 'blog', icon: 'fa-newspaper' },
    { href: '/affiliate', label: 'Affiliate', key: 'affiliate', icon: 'fa-handshake' },
    { href: '/lien-he', label: 'Liên hệ', key: 'contact', icon: 'fa-headset' }
  ]

  return (
    <html lang="vi" class="scroll-smooth">
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
        <link href="/static/tailwind.css" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body class={'bg-[#080716] text-[#e2e1f5] antialiased ' + (props.bodyClass || '')}>
        <div class="flex min-h-screen">
          {/* LEFT SIDEBAR (Collapsible) */}
          <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-[#0f0e26] border-r border-[#1f1b4b] flex flex-col justify-between transition-all duration-300 transform -translate-x-full lg:translate-x-0">
            <div class="flex flex-col overflow-y-auto">
              {/* Brand Logo */}
              <div class="h-16 flex items-center gap-3 px-6 border-b border-[#1f1b4b]">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg shadow-indigo-500/25">
                  <i class="fas fa-wand-magic-sparkles text-sm"></i>
                </div>
                <div class="leading-none sidebar-header-text">
                  <div class="font-extrabold text-sm tracking-tight text-white">{siteName}</div>
                  <div class="text-[9px] text-[#9f9dbb] mt-0.5">AI Video Templates</div>
                </div>
              </div>

              {/* Navigation Menu */}
              <div class="px-3 py-5 flex flex-col gap-6">
                <div>
                  <div class="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 sidebar-text">Khám phá</div>
                  <nav class="flex flex-col gap-1">
                    <a href="/" class={`sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${active === 'home' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#b9b8d9] hover:text-white hover:bg-white/5'}`}>
                      <i class="fas fa-house w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Trang chủ</span>
                    </a>
                    <a href="/san-pham?sort=hot" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-fire w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Bán chạy nhất</span>
                    </a>
                  </nav>
                </div>

                <div>
                  <div class="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 sidebar-text">Sản phẩm</div>
                  <nav class="flex flex-col gap-1">
                    <a href="/san-pham?type=course" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-graduation-cap w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Khóa học</span>
                    </a>
                    <a href="/san-pham?type=skill" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-wand-magic-sparkles w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Skill AI</span>
                    </a>
                    <a href="/san-pham?type=chatbot" class={`sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${active === 'chatbot' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#b9b8d9] hover:text-white hover:bg-white/5'}`}>
                      <i class="fas fa-robot w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Chatbot</span>
                    </a>
                    <a href="/san-pham?type=app" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-mobile-screen-button w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">App Video AI</span>
                    </a>
                    <a href="/combo" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-box-open w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between">
                        <span>Combo tiết kiệm</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold leading-none">-60%</span>
                      </span>
                    </a>
                    <a href="/lien-he" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-video w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text flex-1 flex items-center justify-between">
                        <span>Yêu cầu Video AI</span>
                        <span class="sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold leading-none">NEW</span>
                      </span>
                    </a>
                  </nav>
                </div>

                <div>
                  <div class="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 sidebar-text">Khác</div>
                  <nav class="flex flex-col gap-1">
                    <a href="/lien-he" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-user-gear w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Custom Chatbot</span>
                    </a>
                    <a href="/bang-gia" class={`sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${active === 'pricing' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#b9b8d9] hover:text-white hover:bg-white/5'}`}>
                      <i class="fas fa-tags w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Bảng giá</span>
                    </a>
                    <a href="/gioi-thieu" class="sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5">
                      <i class="fas fa-info-circle w-5 text-center text-slate-400"></i>
                      <span class="sidebar-text">Giới thiệu</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            {/* Sidebar toggle button */}
            <div class="p-3 border-t border-[#1f1b4b]">
              <button id="sidebar-toggle-btn" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition">
                <i class="fas fa-angles-left w-5 text-center"></i>
                <span class="sidebar-text">Thu nhỏ</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT WRAPPER */}
          <div id="main-content-wrap" class="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 overflow-hidden">
            {/* Header */}
            <header id="site-header" class="sticky top-0 z-40 bg-[#0f0e26]/85 backdrop-blur border-b border-[#1f1b4b]">
              <div class="max-w-7xl mx-auto px-4 sm:px-6">
                <div class="h-16 flex items-center justify-between gap-4">
                  {/* Left Brand on Mobile */}
                  <a href="/" class="flex lg:hidden items-center gap-2 shrink-0 group">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg">
                      <i class="fas fa-wand-magic-sparkles text-xs"></i>
                    </div>
                    <span class="font-extrabold text-sm tracking-tight text-white">{siteName}</span>
                  </a>

                  {/* Header Nav Links (Desktop) */}
                  <nav id="main-nav" class="hidden lg:flex items-center gap-1.5">
                    {nav.map(n => (
                      <a href={n.href}
                        class={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${active === n.key ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#9f9dbb] hover:text-white'}`}>
                        {n.label}
                      </a>
                    ))}
                  </nav>

                  {/* Header Search (Desktop) */}
                  <form action="/san-pham" method="get" class="hidden md:flex flex-1 max-w-xs ml-auto">
                    <div class="relative w-full">
                      <input type="text" name="q" placeholder="Tìm sản phẩm..." id="header-search"
                        class="w-full h-9 pl-9 pr-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none transition" />
                      <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    </div>
                  </form>

                  {/* Header Right Actions */}
                  <div class="flex items-center gap-2">
                    <a href="/gio-hang" id="cart-btn" class="relative w-9 h-9 grid place-items-center rounded-lg bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] hover:text-white transition">
                      <i class="fas fa-cart-shopping text-sm"></i>
                      <span id="cart-badge" class={`absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center ${cartCount > 0 ? '' : 'hidden'}`}>{cartCount}</span>
                    </a>

                    {user ? (
                      <div class="relative" id="user-menu-wrap">
                        <button id="user-menu-btn" class="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] hover:text-white transition">
                          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold uppercase shadow-sm">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span class="hidden sm:block text-xs font-medium max-w-[90px] truncate">{user.full_name}</span>
                          <i class="fas fa-chevron-down text-[9px] text-slate-500"></i>
                        </button>
                        <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-52 bg-[#0f0e26] rounded-xl shadow-xl border border-[#1f1b4b] py-1.5 overflow-hidden">
                          <div class="px-4 py-2 border-b border-[#1f1b4b]">
                            <div class="text-xs font-bold text-white truncate">{user.full_name}</div>
                            <div class="text-[10px] text-slate-500 truncate">{user.email}</div>
                          </div>
                          <a href="/tai-khoan" class="flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white"><i class="fas fa-gauge w-4 text-slate-500"></i>Tổng quan</a>
                          <a href="/tai-khoan/san-pham" class="flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white"><i class="fas fa-box-archive w-4 text-slate-500"></i>Sản phẩm của tôi</a>
                          <a href="/tai-khoan/don-hang" class="flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white"><i class="fas fa-receipt w-4 text-slate-500"></i>Đơn hàng</a>
                          <a href="/tai-khoan/affiliate" class="flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white"><i class="fas fa-handshake w-4 text-slate-500"></i>Affiliate</a>
                          <a href="/tai-khoan/ho-so" class="flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white"><i class="fas fa-user-gear w-4 text-slate-500"></i>Hồ sơ</a>
                          {user.role === 'admin' && (
                            <a href="/admin" class="flex items-center gap-2 px-4 py-2 text-xs text-amber-400 hover:bg-white/5 border-t border-[#1f1b4b]"><i class="fas fa-shield-halved w-4"></i>Quản trị</a>
                          )}
                          <a href="/dang-xuat" class="flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-white/5 border-t border-[#1f1b4b]"><i class="fas fa-right-from-bracket w-4"></i>Đăng xuất</a>
                        </div>
                      </div>
                    ) : (
                      <div class="flex items-center gap-1.5">
                        <a href="/dang-nhap" class="hidden sm:block px-3 h-9 leading-9 rounded-lg text-xs font-semibold text-[#b9b8d9] hover:bg-white/5 transition">Đăng nhập</a>
                        <a href="/dang-ky" class="px-3.5 h-9 leading-9 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90 shadow-md shadow-indigo-600/20 transition">Đăng ký</a>
                      </div>
                    )}

                    <button id="mobile-menu-btn" class="lg:hidden w-9 h-9 grid place-items-center rounded-lg bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] hover:text-white">
                      <i class="fas fa-bars"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile menu nav dropdown */}
              <div id="mobile-nav" class="hidden lg:hidden border-t border-[#1f1b4b] bg-[#0f0e26]">
                <div class="px-4 py-3 flex flex-col gap-2">
                  <form action="/san-pham" method="get" class="mb-2">
                    <div class="relative">
                      <input type="text" name="q" placeholder="Tìm sản phẩm..."
                        class="w-full h-10 pl-10 pr-3 rounded-lg bg-[#16143c] border border-transparent text-xs text-white placeholder-slate-500 outline-none" />
                      <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    </div>
                  </form>
                  <div class="grid grid-cols-2 gap-1.5">
                    {nav.map(n => (
                      <a href={n.href} class={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${active === n.key ? 'bg-indigo-500/10 text-indigo-400' : 'text-[#b9b8d9] hover:bg-white/5'}`}>
                        <i class={`fas ${n.icon} w-4 text-center text-slate-400`}></i>{n.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </header>

            {/* Main content body */}
            <main id="main-content" class="flex-1">{children}</main>

            {/* Footer */}
            <footer id="site-footer" class="bg-[#0b0a19] text-[#9f9dbb] border-t border-[#1f1b4b] mt-16">
              <div class="max-w-7xl mx-auto px-4 py-12">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <div class="flex items-center gap-2.5 mb-4">
                      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg">
                        <i class="fas fa-wand-magic-sparkles text-sm"></i>
                      </div>
                      <span class="font-extrabold text-base text-white">{siteName}</span>
                    </div>
                    <p class="text-xs leading-relaxed mb-4">{settings.site_tagline}</p>
                    <div class="flex gap-2">
                      <a href={settings.facebook || '#'} target="_blank" rel="noopener" class="w-8 h-8 rounded-lg bg-[#16143c] hover:bg-indigo-600 grid place-items-center transition text-slate-300 hover:text-white"><i class="fab fa-facebook-f text-xs"></i></a>
                      <a href={`https://zalo.me/${settings.zalo}`} target="_blank" rel="noopener" class="w-8 h-8 rounded-lg bg-[#16143c] hover:bg-[#0068ff] grid place-items-center transition text-slate-300 hover:text-white text-[10px] font-bold">Zalo</a>
                      <a href="#" class="w-8 h-8 rounded-lg bg-[#16143c] hover:bg-red-600 grid place-items-center transition text-slate-300 hover:text-white"><i class="fab fa-youtube text-xs"></i></a>
                      <a href="#" class="w-8 h-8 rounded-lg bg-[#16143c] hover:bg-slate-900 grid place-items-center transition text-slate-300 hover:text-white"><i class="fab fa-tiktok text-xs"></i></a>
                    </div>
                  </div>
                  <div>
                    <h4 class="text-white font-bold mb-4 text-xs uppercase tracking-wider">Sản phẩm</h4>
                    <ul class="space-y-2 text-xs">
                      <li><a href="/san-pham?type=course" class="hover:text-indigo-400 transition">Khóa học Video AI</a></li>
                      <li><a href="/san-pham?type=skill" class="hover:text-indigo-400 transition">Skill Tạo Video AI</a></li>
                      <li><a href="/san-pham?type=chatbot" class="hover:text-indigo-400 transition">Chatbot Kịch Bản</a></li>
                      <li><a href="/san-pham?type=app" class="hover:text-indigo-400 transition">App Làm Video AI</a></li>
                      <li><a href="/combo" class="hover:text-indigo-400 transition">Combo Trọn Bộ</a></li>
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
                      <li class="flex gap-2.5"><i class="fas fa-phone-volume mt-0.5 text-indigo-400"></i><span>Hotline: <b class="text-white">{settings.hotline}</b></span></li>
                      <li class="flex gap-2.5"><i class="fas fa-envelope mt-0.5 text-indigo-400"></i><span>{settings.email}</span></li>
                      <li class="flex gap-2.5"><i class="fab fa-facebook-messenger mt-0.5 text-indigo-400"></i><span>Chat Zalo/Messenger 24/7</span></li>
                    </ul>
                  </div>
                </div>
                <div class="mt-10 pt-6 border-t border-[#1f1b4b] flex flex-col md:flex-row items-center justify-between gap-3 text-[10px]">
                  <div>© 2026 {siteName}. Tất cả các quyền được bảo lưu.</div>
                  <div>Phát triển với <span class="text-rose-500">♥</span> tại Việt Nam</div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* Floating contact */}
        <div id="float-contact" class="fixed right-4 bottom-4 z-45 flex flex-col gap-2.5">
          <a href={`https://zalo.me/${settings.zalo}`} target="_blank" rel="noopener"
            class="w-11 h-11 rounded-full bg-[#0068ff] text-white grid place-items-center shadow-xl hover:scale-110 transition text-[10px] font-bold" title="Chat Zalo">Zalo</a>
          <a href={`tel:${(settings.hotline || '').replace(/\s/g, '')}`}
            class="w-11 h-11 rounded-full bg-emerald-500 text-white grid place-items-center shadow-xl hover:scale-110 transition text-sm" title="Gọi ngay">
            <i class="fas fa-phone"></i>
          </a>
          <button id="back-to-top" class="w-11 h-11 rounded-full bg-[#16143c] border border-[#1f1b4b] text-white grid place-items-center shadow-xl hover:scale-110 transition opacity-0 pointer-events-none text-sm" title="Lên đầu trang">
            <i class="fas fa-arrow-up"></i>
          </button>
        </div>

        <div id="toast-container" class="fixed top-20 right-4 z-[100] flex flex-col gap-2"></div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
}
