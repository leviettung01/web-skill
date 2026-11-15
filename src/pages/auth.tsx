import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'

const AuthShell: FC<{ title: string; subtitle: string; settings?: Record<string, string>; children: any }> = ({ title, subtitle, settings = {}, children }) => {
  const siteName = settings.site_name || 'KhoSkill AI'
  return (
    <div class="min-h-[calc(100vh-64px)] grid lg:grid-cols-2 bg-[#070614]">
      {/* Left visual */}
      <div class="hidden lg:flex relative bg-[#0a091b] border-r border-[#221e54] text-white p-12 flex-col justify-between overflow-hidden">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="absolute inset-0 hero-grid"></div>
        <div class="relative">
          <a href="/" class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-indigo-500/25">
              <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
            </div>
            <span class="font-extrabold text-lg">{siteName}</span>
          </a>
        </div>
        <div class="relative">
          <h2 class="text-3xl xl:text-4xl font-extrabold leading-tight mb-4">
            Kho <span class="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">Skill AI Tạo Video</span> thực chiến
          </h2>
          <p class="text-[#c2c0e0] mb-8 max-w-md leading-relaxed">
            Tham gia cùng hàng nghìn creator đang dùng bộ Skill AI chuẩn hóa để sản xuất video bán hàng triệu view mỗi ngày.
          </p>
          <ul class="space-y-3.5">
            {[
              ['fa-bolt', 'Giao hàng tự động 24/7'],
              ['fa-infinity', 'Sở hữu trọn đời, cập nhật miễn phí'],
              ['fa-headset', 'Hỗ trợ kỹ thuật 1-1 qua Zalo'],
              ['fa-shield-halved', 'Hoàn tiền 100% trong 7 ngày']
            ].map(([ic, t]) => (
              <li class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-indigo-300 shrink-0">
                  <i class={`fas ${ic}`} aria-hidden="true"></i>
                </div>
                <span class="text-[#f4f4fc] text-sm">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div class="relative text-xs text-[#9492b8]">© 2026 {siteName} — Phát triển tại Việt Nam</div>
      </div>

      {/* Right form */}
      <div class="flex items-center justify-center p-6 md:p-12 bg-[#070614]">
        <div class="w-full max-w-md bg-[#0f0e24] border border-[#221e54] rounded-3xl p-7 md:p-8 shadow-2xl">
          <h1 class="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
          <p class="text-[#b8b6d9] text-sm mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full h-12 px-4 rounded-xl bg-[#161436] border border-[#2a2559] text-white placeholder-[#9492b8] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-sm transition'

const OAUTH_ERROR_MAP: Record<string, string> = {
  banned: 'Tài khoản của bạn đã bị khoá.',
  unverified: 'Email Google của bạn chưa được Google xác minh.',
  cancelled: 'Bạn đã huỷ đăng nhập Google.',
  not_configured: 'Đăng nhập Google hiện chưa được kích hoạt.',
  state_invalid: 'Phiên đăng nhập Google đã hết hạn, vui lòng thử lại.',
  failed: 'Không thể kết nối Google lúc này, vui lòng thử lại.'
}

const GoogleButton: FC<{ href: string; label: string }> = ({ href, label }) => (
  <div class="mb-5">
    <a href={href} data-no-pjax
      class="cta-white flex items-center justify-center gap-3 w-full h-12 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition">
      <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
        <path fill="#34A853" d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.73-2.46 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.13H1.03v3.14C3.04 21.15 7.2 24 12 24Z"/>
        <path fill="#FBBC05" d="M5.03 14.02c-.25-.73-.39-1.51-.39-2.32s.14-1.59.39-2.32V6.24H1.03A11.98 11.98 0 0 0 0 11.7c0 1.94.46 3.77 1.03 5.46l4-3.14Z"/>
        <path fill="#EA4335" d="M12 4.65c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.09 15.3 0 12 0 7.2 0 3.04 2.85 1.03 7.14l4 3.14C6.01 6.84 8.76 4.65 12 4.65Z"/>
      </svg>
      <span>{label}</span>
    </a>
    <div class="relative flex items-center justify-center my-5">
      <div class="w-full border-t border-[#221e54]"></div>
      <span class="px-3 bg-[#0f0e24] text-xs text-[#9492b8] uppercase tracking-wider shrink-0">Hoặc bằng email</span>
      <div class="w-full border-t border-[#221e54]"></div>
    </div>
  </div>
)

export const LoginPage: FC<LayoutProps & { next?: string; registered?: boolean; resetSuccess?: boolean; oauthError?: string; googleEnabled?: boolean }> = (props) => {
  const errMsg = props.oauthError ? (OAUTH_ERROR_MAP[props.oauthError] || OAUTH_ERROR_MAP.failed) : ''
  const googleHref = `/api/auth/google${props.next ? '?next=' + encodeURIComponent(props.next) : ''}`
  return (
    <Layout {...props} title="Đăng nhập">
      <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại! Đăng nhập để truy cập Skill đã mua." settings={props.settings}>
        {props.registered && (
          <div class="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-sm text-emerald-300">
            <i class="fas fa-circle-check mr-1.5" aria-hidden="true"></i>Đăng ký thành công! Vui lòng đăng nhập.
          </div>
        )}
        {props.resetSuccess && (
          <div class="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-sm text-emerald-300">
            <i class="fas fa-circle-check mr-1.5" aria-hidden="true"></i>Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.
          </div>
        )}
        {errMsg && (
          <div role="alert" class="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-sm text-rose-300">
            <i class="fas fa-triangle-exclamation mr-1.5" aria-hidden="true"></i>{errMsg}
          </div>
        )}
        {props.googleEnabled && <GoogleButton href={googleHref} label="Tiếp tục với Google" />}
        <form action="/api/auth/login" method="post" data-ajax class="space-y-4">
          <input type="hidden" name="next" value={props.next || ''} />
          <div>
            <label for="login-email" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Email</label>
            <div class="relative">
              <input type="email" name="email" required autocomplete="email" placeholder="email@example.com" class={inputCls + ' pl-11'} id="login-email" />
              <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="login-password" class="block text-sm font-medium text-[#d6d4ee]">Mật khẩu</label>
              <a href="/quen-mat-khau" class="text-xs text-indigo-400 hover:underline">Quên mật khẩu?</a>
            </div>
            <div class="relative">
              <input type="password" name="password" required autocomplete="current-password" placeholder="••••••••" class={inputCls + ' pl-11 pr-11'} id="login-password" />
              <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
              <button type="button" class="toggle-password-btn absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#9492b8] hover:text-white grid place-items-center cursor-pointer"
                aria-label="Hiện mật khẩu" title="Hiện / ẩn mật khẩu">
                <i class="far fa-eye text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-sm text-rose-300" role="alert"></div>
          <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-95 shadow-lg shadow-indigo-500/25 transition cursor-pointer">
            Đăng nhập
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-[#b8b6d9]">
          Chưa có tài khoản? <a href="/dang-ky" class="font-semibold text-indigo-400 hover:underline">Đăng ký ngay</a>
        </p>
      </AuthShell>
    </Layout>
  )
}

export const RegisterPage: FC<LayoutProps & { ref?: string; googleEnabled?: boolean; oauthError?: string }> = (props) => {
  const errMsg = props.oauthError ? (OAUTH_ERROR_MAP[props.oauthError] || OAUTH_ERROR_MAP.failed) : ''
  const googleHref = `/api/auth/google${props.ref ? '?ref=' + encodeURIComponent(props.ref) : ''}`
  return (
    <Layout {...props} title="Đăng ký">
      <AuthShell title="Tạo tài khoản" subtitle="Đăng ký miễn phí trong 30 giây — không cần chờ OTP, mua và nhận Skill ngay." settings={props.settings}>
        {errMsg && (
          <div role="alert" class="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-sm text-rose-300">
            <i class="fas fa-triangle-exclamation mr-1.5" aria-hidden="true"></i>{errMsg}
          </div>
        )}
        {props.googleEnabled && <GoogleButton href={googleHref} label="Đăng ký nhanh với Google" />}
        <form action="/api/auth/register" method="post" data-ajax class="space-y-4">
          <input type="hidden" name="ref" value={props.ref || ''} />
          <div>
            <label for="reg-name" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Họ và tên</label>
            <div class="relative">
              <input id="reg-name" type="text" name="full_name" required autocomplete="name" placeholder="Nguyễn Văn A" class={inputCls + ' pl-11'} />
              <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
            </div>
          </div>
          <div>
            <label for="reg-email" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Email</label>
            <div class="relative">
              <input id="reg-email" type="email" name="email" required autocomplete="email" placeholder="email@gmail.com" class={inputCls + ' pl-11'} />
              <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
            </div>
            <p class="text-[11px] text-[#9492b8] mt-1">Vào mua ngay không cần OTP. Có thể xác minh email trong Hồ sơ để bật Affiliate &amp; nhận thông báo cập nhật.</p>
          </div>
          <div>
            <label for="reg-phone" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Số điện thoại <span class="text-[#9492b8] font-normal">(tuỳ chọn)</span></label>
            <div class="relative">
              <input id="reg-phone" type="tel" name="phone" autocomplete="tel" placeholder="0915967790" class={inputCls + ' pl-11'} />
              <i class="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
            </div>
          </div>
          <div>
            <label for="reg-password" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Mật khẩu</label>
            <div class="relative">
              <input id="reg-password" type="password" name="password" required minlength={6} autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" class={inputCls + ' pl-11 pr-11'} />
              <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
              <button type="button" class="toggle-password-btn absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#9492b8] hover:text-white grid place-items-center cursor-pointer"
                aria-label="Hiện mật khẩu" title="Hiện / ẩn mật khẩu">
                <i class="far fa-eye text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <label class="flex items-start gap-2.5 text-sm text-[#b8b6d9] cursor-pointer">
            <input type="checkbox" required class="mt-0.5 accent-indigo-500" />
            <span>Tôi đồng ý với <a href="/dieu-khoan" class="text-indigo-400 hover:underline">Điều khoản sử dụng</a> và <a href="/chinh-sach" class="text-indigo-400 hover:underline">Chính sách bảo mật</a></span>
          </label>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-sm text-rose-300" role="alert"></div>
          <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-95 shadow-lg shadow-indigo-500/25 transition cursor-pointer">
            Đăng ký tài khoản
          </button>
        </form>
        <p class="mt-6 text-center text-sm text-[#b8b6d9]">
          Đã có tài khoản? <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:underline">Đăng nhập</a>
        </p>
      </AuthShell>
    </Layout>
  )
}

export const ForgotPage: FC<LayoutProps & { emailEnabled?: boolean }> = (props) => (
  <Layout {...props} title="Quên mật khẩu">
    <AuthShell title="Quên mật khẩu" subtitle="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu mới." settings={props.settings}>
      {props.emailEnabled ? (
        <form action="/api/auth/forgot-password" method="post" data-ajax class="space-y-4 mb-6">
          <div>
            <label for="forgot-email" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Email tài khoản</label>
            <div class="relative">
              <input id="forgot-email" type="email" name="email" required autocomplete="email" placeholder="email@gmail.com" class={inputCls + ' pl-11'} />
              <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
            </div>
          </div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-sm text-rose-300" role="alert"></div>
          <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-95 shadow-lg shadow-indigo-500/25 transition cursor-pointer">
            <i class="fas fa-paper-plane mr-2" aria-hidden="true"></i>Gửi link đặt lại mật khẩu
          </button>
        </form>
      ) : null}

      <div class="p-5 rounded-2xl bg-[#161436] border border-[#2a2559] space-y-3">
        <p class="text-xs text-[#c2c0e0] leading-relaxed">
          {props.emailEnabled
            ? 'Không thấy email trong hộp thư chính (hãy kiểm tra thêm mục Spam)? Bạn có thể liên hệ trực tiếp đội ngũ hỗ trợ:'
            : 'Vui lòng liên hệ đội ngũ hỗ trợ kèm email đã đăng ký để được cấp lại mật khẩu nhanh chóng:'}
        </p>
        <a href={`https://zalo.me/${props.settings?.zalo || ''}`} target="_blank" rel="noopener"
          class="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#0068ff] hover:bg-blue-600 text-white font-semibold text-sm transition">
          Chat Zalo hỗ trợ
        </a>
        <a href={`mailto:${props.settings?.email || ''}`}
          class="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[#2a2559] text-white hover:border-indigo-400 hover:bg-white/5 font-semibold text-sm transition">
          <i class="fas fa-envelope" aria-hidden="true"></i>Gửi email hỗ trợ
        </a>
      </div>
      <p class="mt-6 text-center text-sm text-[#b8b6d9]">
        <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:underline"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i>Quay lại đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)

export const ResetPasswordPage: FC<LayoutProps & { token?: string; invalidReason?: string }> = (props) => (
  <Layout {...props} title="Đặt lại mật khẩu">
    <AuthShell title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản của bạn." settings={props.settings}>
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
          <div>
            <label for="reset-new-pw" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Mật khẩu mới</label>
            <div class="relative">
              <input id="reset-new-pw" type="password" name="new_password" required minlength={6} autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" class={inputCls + ' pl-11 pr-11'} />
              <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
              <button type="button" class="toggle-password-btn absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#9492b8] hover:text-white grid place-items-center cursor-pointer"
                aria-label="Hiện mật khẩu">
                <i class="far fa-eye text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div>
            <label for="reset-confirm-pw" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Nhập lại mật khẩu</label>
            <div class="relative">
              <input id="reset-confirm-pw" type="password" name="confirm_password" required minlength={6} autocomplete="new-password" placeholder="Nhập lại mật khẩu mới" class={inputCls + ' pl-11 pr-11'} />
              <i class="fas fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-[#9492b8] text-sm" aria-hidden="true"></i>
            </div>
          </div>
          <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-sm text-rose-300" role="alert"></div>
          <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-95 shadow-lg shadow-indigo-500/25 transition cursor-pointer">
            Lưu mật khẩu mới
          </button>
        </form>
      )}
      <p class="mt-6 text-center text-sm text-[#b8b6d9]">
        <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:underline"><i class="fas fa-arrow-left mr-1" aria-hidden="true"></i>Quay lại đăng nhập</a>
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
