import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'

const inputCls =
  'w-full h-11 rounded-xl bg-[#12102a] border border-[#2a2559] hover:border-[#3c367c] text-white placeholder-[#7d7ba6] focus:border-indigo-400 focus:bg-[#161436] focus:ring-4 focus:ring-indigo-500/15 outline-none text-sm transition'

const primaryBtnCls =
  'w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2'

const FEATURES: [string, string, string, string][] = [
  ['fa-bolt', 'text-amber-300 bg-amber-500/15 border-amber-400/25', 'Nhận link sau 3 giây', 'Quét VietQR kích hoạt License Key tự động 24/7'],
  ['fa-key', 'text-indigo-300 bg-indigo-500/15 border-indigo-400/25', 'Sở hữu trọn đời', 'Dùng không giới hạn kênh, không thu phí gia hạn'],
  ['fa-rocket', 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-400/25', 'Cập nhật miễn phí', 'Thông báo tự động khi nâng cấp prompt & model mới'],
  ['fa-headset', 'text-emerald-300 bg-emerald-500/15 border-emerald-400/25', 'Hỗ trợ kỹ thuật 1-1', 'Kèm video demo thực chiến và hướng dẫn qua Zalo'],
]

const AuthShell: FC<{
  title: string
  subtitle: string
  mode?: 'login' | 'register'
  loginHref?: string
  registerHref?: string
  settings?: Record<string, string>
  children: any
}> = ({ title, subtitle, mode, loginHref = '/dang-nhap', registerHref = '/dang-ky', settings = {}, children }) => {
  const siteName = settings.site_name || 'KhoSkill AI'
  return (
    <div class="min-h-[calc(100vh-64px)] grid lg:grid-cols-12 bg-[#070614]">
      {/* Left Brand & Trust Showcase */}
      <div class="hidden lg:flex lg:col-span-6 relative bg-[#09081b] border-r border-white/[0.06] p-10 xl:p-14 flex-col justify-between overflow-hidden">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="absolute inset-0 hero-grid opacity-80"></div>
        <div class="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div class="pointer-events-none absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-fuchsia-600/15 blur-[110px]"></div>

        <div class="relative flex items-center justify-between gap-4">
          <a href="/" class="inline-flex items-center gap-2.5 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-indigo-500/25 text-white">
              <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
            </div>
            <span class="font-extrabold text-lg text-white tracking-tight">{siteName}</span>
          </a>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Giao hàng tự động 24/7
          </span>
        </div>

        <div class="relative my-auto py-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-xs font-semibold mb-5">
            <i class="fas fa-film text-[11px]" aria-hidden="true"></i>Bộ Skill AI Làm Video Chuẩn Viral
          </div>
          <h2 class="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white mb-4">
            Sản xuất video triệu view với <span class="bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">Skill AI thực chiến</span>
          </h2>
          <p class="text-[#b8b6d9] text-sm xl:text-base mb-8 max-w-lg leading-relaxed">
            Truy cập ngay kho Skill Muse AI, Seedance 2.5, Google Flow Veo cùng quy trình dựng kênh bán hàng tối ưu sẵn cho creator Việt.
          </p>

          <div class="grid grid-cols-2 gap-3.5 max-w-xl">
            {FEATURES.map(([ic, colorCls, heading, desc]) => (
              <div class="p-4 rounded-2xl bg-[#110f29]/80 border border-[#242054] backdrop-blur-xs">
                <div class={`w-9 h-9 rounded-xl border grid place-items-center mb-3 ${colorCls}`}>
                  <i class={`fas ${ic} text-sm`} aria-hidden="true"></i>
                </div>
                <div class="font-bold text-white text-sm mb-1">{heading}</div>
                <p class="text-xs text-[#9e9cc2] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div class="relative flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/[0.06] text-xs text-[#9492b8]">
          <span>© 2026 {siteName} — Phát triển tại Việt Nam</span>
          <div class="flex items-center gap-4">
            <span><b class="text-white">1.500+</b> lượt mua</span>
            <span><b class="text-amber-300">4.9/5</b> đánh giá</span>
          </div>
        </div>
      </div>

      {/* Right Auth Card */}
      <div class="lg:col-span-6 relative flex items-center justify-center p-4 sm:p-8 lg:p-10 bg-[#070614] overflow-hidden">
        <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-indigo-600/15 blur-[120px]"></div>

        <div class="relative w-full max-w-[440px] bg-[#0e0d22]/95 border border-[#29245e] ring-1 ring-white/[0.05] rounded-3xl p-6 sm:p-8 shadow-[0_24px_80px_-20px_rgba(79,70,229,0.32)]">
          <div class="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/75 to-transparent"></div>

          {/* Mobile brand lockup */}
          <div class="lg:hidden flex items-center justify-between mb-5">
            <a href="/" class="inline-flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white text-xs shadow-md shadow-indigo-500/25">
                <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
              </div>
              <span class="font-extrabold text-sm text-white">{siteName}</span>
            </a>
            <span class="text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Tự động 24/7
            </span>
          </div>

          {/* Mode Tab Switcher */}
          {mode && (
            <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#070614] border border-[#231f52] mb-6" role="tablist" aria-label="Chọn chế độ tài khoản">
              <a href={loginHref} role="tab" aria-selected={mode === 'login'}
                class={mode === 'login'
                  ? 'h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs sm:text-sm grid place-items-center shadow-sm'
                  : 'h-9 rounded-lg text-[#9e9cc2] hover:text-white font-medium text-xs sm:text-sm grid place-items-center transition'}>
                Đăng nhập
              </a>
              <a href={registerHref} role="tab" aria-selected={mode === 'register'}
                class={mode === 'register'
                  ? 'h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs sm:text-sm grid place-items-center shadow-sm'
                  : 'h-9 rounded-lg text-[#9e9cc2] hover:text-white font-medium text-xs sm:text-sm grid place-items-center transition'}>
                Đăng ký
              </a>
            </div>
          )}

          <h1 class="text-2xl font-extrabold text-white mb-1.5 tracking-tight">{title}</h1>
          <p class="text-[#a9a7ce] text-sm mb-5 leading-relaxed">{subtitle}</p>
          {children}

          <div class="mt-6 pt-4 border-t border-[#1e1a47] flex items-center justify-center gap-4 text-[11px] text-[#8b89b0]">
            <span><i class="fas fa-lock text-emerald-400 mr-1" aria-hidden="true"></i>Bảo mật SSL</span>
            <span aria-hidden="true">•</span>
            <span><i class="fas fa-bolt text-indigo-400 mr-1" aria-hidden="true"></i>Nhận Skill ngay</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const PasswordField: FC<{
  id: string
  name: string
  label: string
  autocomplete: string
  placeholder: string
  minLength?: number
  rightSlot?: any
}> = ({ id, name, label, autocomplete, placeholder, minLength, rightSlot }) => (
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <label for={id} class="block text-xs font-semibold text-[#e2e1f5]">{label}</label>
      {rightSlot}
    </div>
    <div class="relative">
      <input id={id} type="password" name={name} required minlength={minLength}
        autocomplete={autocomplete} placeholder={placeholder}
        class={inputCls + ' pl-10 pr-10'} />
      <i class="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
      <button type="button"
        class="toggle-password-btn absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#8b89b0] hover:text-white grid place-items-center cursor-pointer transition"
        aria-label="Hiện mật khẩu" title="Hiện / ẩn mật khẩu">
        <i class="far fa-eye text-sm" aria-hidden="true"></i>
      </button>
    </div>
  </div>
)

const OAUTH_ERROR_MAP: Record<string, string> = {
  banned: 'Tài khoản của bạn đã bị khoá.',
  unverified: 'Email Google của bạn chưa được Google xác minh.',
  cancelled: 'Bạn đã huỷ đăng nhập Google.',
  not_configured: 'Đăng nhập Google hiện chưa được kích hoạt.',
  state_invalid: 'Phiên đăng nhập Google đã hết hạn, vui lòng thử lại.',
  failed: 'Không thể kết nối Google lúc này, vui lòng thử lại.'
}

const GoogleButton: FC<{ href: string; label: string }> = ({ href, label }) => (
  <div class="flex flex-col gap-4 mb-5">
    <a href={href} data-no-pjax
      class="cta-white flex items-center justify-center gap-3 w-full h-11 px-4 rounded-xl bg-white hover:bg-[#f6f7fb] text-[#111827] font-semibold text-sm border border-white/80 shadow-md shadow-black/20 transition">
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
        <path fill="#34A853" d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.73-2.46 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.13H1.03v3.14C3.04 21.15 7.2 24 12 24Z"/>
        <path fill="#FBBC05" d="M5.03 14.02c-.25-.73-.39-1.51-.39-2.32s.14-1.59.39-2.32V6.24H1.03A11.98 11.98 0 0 0 0 11.7c0 1.94.46 3.77 1.03 5.46l4-3.14Z"/>
        <path fill="#EA4335" d="M12 4.65c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.09 15.3 0 12 0 7.2 0 3.04 2.85 1.03 7.14l4 3.14C6.01 6.84 8.76 4.65 12 4.65Z"/>
      </svg>
      <span>{label}</span>
    </a>
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-[#262258]"></div>
      <span class="text-[11px] font-medium text-[#8b89b0] uppercase tracking-wider shrink-0">Hoặc bằng email</span>
      <div class="h-px flex-1 bg-[#262258]"></div>
    </div>
  </div>
)

export const LoginPage: FC<LayoutProps & { next?: string; registered?: boolean; resetSuccess?: boolean; oauthError?: string; googleEnabled?: boolean }> = (props) => {
  const errMsg = props.oauthError ? (OAUTH_ERROR_MAP[props.oauthError] || OAUTH_ERROR_MAP.failed) : ''
  const googleHref = `/api/auth/google${props.next ? '?next=' + encodeURIComponent(props.next) : ''}`
  const loginHref = `/dang-nhap${props.next ? '?next=' + encodeURIComponent(props.next) : ''}`
  const regHref = `/dang-ky${props.next ? '?next=' + encodeURIComponent(props.next) : ''}`

  return (
    <Layout {...props} title="Đăng nhập">
      <AuthShell title="Chào mừng quay lại"
        subtitle="Đăng nhập để tải Skill AI, xem License Key và nhận bản cập nhật mới nhất."
        mode="login" loginHref={loginHref} registerHref={regHref} settings={props.settings}>
        {props.registered && (
          <div class="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs sm:text-sm text-emerald-300">
            <i class="fas fa-circle-check mr-1.5" aria-hidden="true"></i>Đăng ký thành công! Vui lòng đăng nhập.
          </div>
        )}
        {props.resetSuccess && (
          <div class="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs sm:text-sm text-emerald-300">
            <i class="fas fa-circle-check mr-1.5" aria-hidden="true"></i>Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.
          </div>
        )}
        {errMsg && (
          <div role="alert" class="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs sm:text-sm text-rose-300">
            <i class="fas fa-triangle-exclamation mr-1.5" aria-hidden="true"></i>{errMsg}
          </div>
        )}
        {props.googleEnabled && <GoogleButton href={googleHref} label="Tiếp tục với Google" />}

        <form action="/api/auth/login" method="post" data-ajax class="space-y-4">
          <input type="hidden" name="next" value={props.next || ''} />
          <div>
            <label for="login-email" class="block text-xs font-semibold text-[#e2e1f5] mb-1.5">Email</label>
            <div class="relative">
              <input type="email" name="email" required autocomplete="email" placeholder="tenban@gmail.com"
                class={inputCls + ' pl-10 pr-4'} id="login-email" />
              <i class="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
            </div>
          </div>

          <PasswordField id="login-password" name="password" label="Mật khẩu"
            autocomplete="current-password" placeholder="Nhập mật khẩu"
            rightSlot={<a href="/quen-mat-khau" class="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline">Quên mật khẩu?</a>} />

          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs sm:text-sm text-rose-300" role="alert"></div>
          <button type="submit" class={primaryBtnCls}>
            <span>Đăng nhập</span>
            <i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
          </button>
        </form>

        <p class="mt-5 text-center text-xs sm:text-sm text-[#9e9cc2]">
          Chưa có tài khoản? <a href={regHref} class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">Đăng ký miễn phí</a>
        </p>
      </AuthShell>
    </Layout>
  )
}

export const RegisterPage: FC<LayoutProps & { ref?: string; googleEnabled?: boolean; oauthError?: string }> = (props) => {
  const errMsg = props.oauthError ? (OAUTH_ERROR_MAP[props.oauthError] || OAUTH_ERROR_MAP.failed) : ''
  const googleHref = `/api/auth/google${props.ref ? '?ref=' + encodeURIComponent(props.ref) : ''}`
  const regHref = `/dang-ky${props.ref ? '?ref=' + encodeURIComponent(props.ref) : ''}`

  return (
    <Layout {...props} title="Đăng ký">
      <AuthShell title="Tạo tài khoản mới"
        subtitle="Đăng ký nhanh trong 30 giây — vào mua và nhận link tải Skill ngay."
        mode="register" loginHref="/dang-nhap" registerHref={regHref} settings={props.settings}>
        {errMsg && (
          <div role="alert" class="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs sm:text-sm text-rose-300">
            <i class="fas fa-triangle-exclamation mr-1.5" aria-hidden="true"></i>{errMsg}
          </div>
        )}

        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-300 mb-4">
          <i class="fas fa-circle-check text-[10px] shrink-0" aria-hidden="true"></i>
          <span>Không cần OTP • Vào mua Skill ngay</span>
        </div>

        {props.googleEnabled && <GoogleButton href={googleHref} label="Đăng ký nhanh với Google" />}

        <form action="/api/auth/register" method="post" data-ajax class="space-y-3.5">
          <input type="hidden" name="ref" value={props.ref || ''} />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label for="reg-name" class="block text-xs font-semibold text-[#e2e1f5] mb-1.5">Họ và tên</label>
              <div class="relative">
                <input id="reg-name" type="text" name="full_name" required autocomplete="name" placeholder="Nguyễn Văn A"
                  class={inputCls + ' pl-10 pr-3'} />
                <i class="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
              </div>
            </div>
            <div>
              <label for="reg-phone" class="block text-xs font-semibold text-[#e2e1f5] mb-1.5">Số điện thoại <span class="text-[#7c79a6] font-normal">(tuỳ chọn)</span></label>
              <div class="relative">
                <input id="reg-phone" type="tel" name="phone" autocomplete="tel" placeholder="0901 234 567"
                  class={inputCls + ' pl-10 pr-3'} />
                <i class="fas fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
              </div>
            </div>
          </div>

          <div>
            <label for="reg-email" class="block text-xs font-semibold text-[#e2e1f5] mb-1.5">Email</label>
            <div class="relative">
              <input id="reg-email" type="email" name="email" required autocomplete="email" placeholder="tenban@gmail.com"
                class={inputCls + ' pl-10 pr-4'} />
              <i class="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
            </div>
          </div>

          <PasswordField id="reg-password" name="password" label="Mật khẩu"
            autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" minLength={6} />

          <label class="flex items-start gap-2.5 pt-0.5 text-xs text-[#a6a4ca] cursor-pointer leading-relaxed">
            <input type="checkbox" required class="mt-0.5 w-4 h-4 rounded accent-indigo-500 shrink-0" />
            <span>Tôi đồng ý với <a href="/dieu-khoan" class="text-indigo-400 hover:text-indigo-300 hover:underline">Điều khoản sử dụng</a> và <a href="/chinh-sach" class="text-indigo-400 hover:text-indigo-300 hover:underline">Chính sách bảo mật</a></span>
          </label>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs sm:text-sm text-rose-300" role="alert"></div>
          <button type="submit" class={primaryBtnCls}>
            <span>Đăng ký tài khoản</span>
            <i class="fas fa-arrow-right text-xs" aria-hidden="true"></i>
          </button>
        </form>

        <p class="mt-5 text-center text-xs sm:text-sm text-[#9e9cc2]">
          Đã có tài khoản? <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">Đăng nhập</a>
        </p>
      </AuthShell>
    </Layout>
  )
}

export const ForgotPage: FC<LayoutProps & { emailEnabled?: boolean }> = (props) => (
  <Layout {...props} title="Quên mật khẩu">
    <AuthShell title="Quên mật khẩu" subtitle="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu mới." settings={props.settings}>
      {props.emailEnabled ? (
        <form action="/api/auth/forgot-password" method="post" data-ajax class="space-y-4 mb-5">
          <div>
            <label for="forgot-email" class="block text-xs font-semibold text-[#e2e1f5] mb-1.5">Email tài khoản</label>
            <div class="relative">
              <input id="forgot-email" type="email" name="email" required autocomplete="email" placeholder="tenban@gmail.com"
                class={inputCls + ' pl-10 pr-4'} />
              <i class="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
            </div>
          </div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs sm:text-sm text-rose-300" role="alert"></div>
          <button type="submit" class={primaryBtnCls}>
            <i class="fas fa-paper-plane text-xs" aria-hidden="true"></i>
            <span>Gửi link đặt lại mật khẩu</span>
          </button>
        </form>
      ) : null}

      <div class="p-4 rounded-2xl bg-[#12102a] border border-[#262258] space-y-2.5">
        <p class="text-xs text-[#a9a7ce] leading-relaxed">
          {props.emailEnabled
            ? 'Không thấy email trong hộp thư chính (hãy kiểm tra thêm mục Spam)? Bạn có thể nhắn trực tiếp hỗ trợ:'
            : 'Vui lòng liên hệ đội ngũ hỗ trợ kèm email đã đăng ký để được cấp lại mật khẩu nhanh chóng:'}
        </p>
        <div class="grid grid-cols-2 gap-2.5">
          <a href={`https://zalo.me/${props.settings?.zalo || ''}`} target="_blank" rel="noopener"
            class="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0068ff] hover:bg-blue-600 text-white font-semibold text-xs transition">
            Chat Zalo hỗ trợ
          </a>
          <a href={`mailto:${props.settings?.email || ''}`}
            class="flex items-center justify-center gap-2 h-10 rounded-xl border border-[#2a2559] text-white hover:border-indigo-400 hover:bg-white/5 font-semibold text-xs transition">
            <i class="fas fa-envelope" aria-hidden="true"></i>Gửi email
          </a>
        </div>
      </div>
      <p class="mt-5 text-center text-xs sm:text-sm text-[#9e9cc2]">
        <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i>Quay lại đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)

export const ResetPasswordPage: FC<LayoutProps & { token?: string; invalidReason?: string }> = (props) => (
  <Layout {...props} title="Đặt lại mật khẩu">
    <AuthShell title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới an toàn cho tài khoản của bạn." settings={props.settings}>
      {props.invalidReason ? (
        <div class="p-5 rounded-2xl bg-rose-500/15 border border-rose-500/35 space-y-4">
          <p class="text-sm text-rose-200 leading-relaxed">
            <i class="fas fa-circle-xmark mr-1.5" aria-hidden="true"></i>{props.invalidReason}
          </p>
          <a href="/quen-mat-khau" class="flex items-center justify-center w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition">
            Yêu cầu link mới
          </a>
        </div>
      ) : (
        <form action="/api/auth/reset-password" method="post" data-ajax class="space-y-4">
          <input type="hidden" name="token" value={props.token || ''} />
          <PasswordField id="reset-new-pw" name="new_password" label="Mật khẩu mới"
            autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" minLength={6} />
          <div>
            <label for="reset-confirm-pw" class="block text-xs font-semibold text-[#e2e1f5] mb-1.5">Nhập lại mật khẩu</label>
            <div class="relative">
              <input id="reset-confirm-pw" type="password" name="confirm_password" required minlength={6} autocomplete="new-password" placeholder="Nhập lại mật khẩu mới"
                class={inputCls + ' pl-10 pr-4'} />
              <i class="fas fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c79a6] text-xs" aria-hidden="true"></i>
            </div>
          </div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs sm:text-sm text-rose-300" role="alert"></div>
          <button type="submit" class={primaryBtnCls}>
            <span>Lưu mật khẩu mới</span>
            <i class="fas fa-check text-xs" aria-hidden="true"></i>
          </button>
        </form>
      )}
      <p class="mt-5 text-center text-xs sm:text-sm text-[#9e9cc2]">
        <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i>Quay lại đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)

export const VerifyEmailResultPage: FC<LayoutProps & { ok: boolean; email?: string; message: string }> = (props) => (
  <Layout {...props} title="Xác minh Email">
    <AuthShell title={props.ok ? 'Xác minh thành công' : 'Xác minh không thành công'}
      subtitle={props.ok ? 'Địa chỉ email tài khoản của bạn đã được xác nhận.' : 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.'}
      settings={props.settings}>
      <div class={`p-5 rounded-2xl border space-y-4 ${props.ok ? 'bg-emerald-500/15 border-emerald-500/35' : 'bg-rose-500/15 border-rose-500/35'}`}>
        <div class="flex items-start gap-3">
          <i class={`fas ${props.ok ? 'fa-circle-check text-emerald-400' : 'fa-circle-xmark text-rose-400'} text-2xl mt-0.5 shrink-0`} aria-hidden="true"></i>
          <div>
            {props.email && <div class="text-xs font-mono text-white/80 mb-1">{props.email}</div>}
            <p class="text-sm text-white leading-relaxed">{props.message}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5 pt-2">
          {props.user ? (
            <>
              <a href="/tai-khoan/affiliate" class="h-10 px-4 inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-95 transition">
                <i class="fas fa-handshake mr-1.5" aria-hidden="true"></i>Mở Affiliate
              </a>
              <a href="/tai-khoan/ho-so" class="h-10 px-4 inline-flex items-center rounded-xl bg-[#161436] border border-[#2a2559] text-white text-sm font-semibold hover:border-indigo-400 transition">
                Về Hồ sơ
              </a>
            </>
          ) : (
            <a href="/dang-nhap" class="h-10 px-5 inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-95 transition">
              Đăng nhập tài khoản
            </a>
          )}
        </div>
      </div>
    </AuthShell>
  </Layout>
)
