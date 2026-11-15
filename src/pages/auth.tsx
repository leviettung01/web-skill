import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'

const AuthShell: FC<{ title: string; subtitle: string; settings?: Record<string, string>; children: any }> = ({ title, subtitle, settings = {}, children }) => {
  const siteName = settings.site_name || 'KhoSkill AI'
  return (
    <div class="min-h-[calc(100vh-64px)] grid lg:grid-cols-2 bg-[#080716]">
      {/* Left visual */}
      <div class="hidden lg:flex relative bg-[#0b0a1f] border-r border-[#1f1b4b] text-white p-12 flex-col justify-between overflow-hidden">
        <div class="absolute inset-0 hero-mesh"></div>
        <div class="absolute inset-0 hero-grid"></div>
        <div class="relative">
          <a href="/" class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-indigo-500/25">
              <i class="fas fa-wand-magic-sparkles"></i>
            </div>
            <span class="font-extrabold text-lg">{siteName}</span>
          </a>
        </div>
        <div class="relative">
          <h2 class="text-3xl xl:text-4xl font-extrabold leading-tight mb-4">
            Kho <span class="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">Skill AI Tạo Video</span> thực chiến
          </h2>
          <p class="text-[#b9b8d9] mb-8 max-w-md leading-relaxed">
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
                  <i class={`fas ${ic}`}></i>
                </div>
                <span class="text-[#e2e1f5] text-sm">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div class="relative text-xs text-slate-500">© 2026 {siteName} — Phát triển tại Việt Nam</div>
      </div>

      {/* Right form */}
      <div class="flex items-center justify-center p-6 md:p-12 bg-[#080716]">
        <div class="w-full max-w-md bg-[#0f0e26] border border-[#1f1b4b] rounded-3xl p-7 md:p-8 shadow-2xl">
          <h1 class="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
          <p class="text-[#9f9dbb] text-sm mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full h-12 px-4 rounded-xl bg-[#16143c] border border-[#28235d] text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-sm transition'

export const LoginPage: FC<LayoutProps & { next?: string; registered?: boolean }> = (props) => (
  <Layout {...props} title="Đăng nhập">
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại! Đăng nhập để truy cập Skill đã mua." settings={props.settings}>
      {props.registered && (
        <div class="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-sm text-emerald-300">
          <i class="fas fa-circle-check mr-1.5"></i>Đăng ký thành công! Vui lòng đăng nhập.
        </div>
      )}
      <form action="/api/auth/login" method="post" data-ajax class="space-y-4">
        <input type="hidden" name="next" value={props.next || ''} />
        <div>
          <label class="block text-sm font-medium text-[#d4d3eb] mb-1.5">Email</label>
          <div class="relative">
            <input type="email" name="email" required autocomplete="email" placeholder="email@example.com" class={inputCls + ' pl-11'} id="login-email" />
            <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-sm font-medium text-[#d4d3eb]">Mật khẩu</label>
            <a href="/quen-mat-khau" class="text-xs text-indigo-400 hover:underline">Quên mật khẩu?</a>
          </div>
          <div class="relative">
            <input type="password" name="password" required autocomplete="current-password" placeholder="••••••••" class={inputCls + ' pl-11'} id="login-password" />
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-sm text-rose-300"></div>
        <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-indigo-500/25 transition">
          Đăng nhập
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-[#9f9dbb]">
        Chưa có tài khoản? <a href="/dang-ky" class="font-semibold text-indigo-400 hover:underline">Đăng ký ngay</a>
      </p>
    </AuthShell>
  </Layout>
)

export const RegisterPage: FC<LayoutProps & { ref?: string }> = (props) => (
  <Layout {...props} title="Đăng ký">
    <AuthShell title="Tạo tài khoản" subtitle="Đăng ký miễn phí trong 30 giây để sở hữu các bộ Skill AI mới nhất." settings={props.settings}>
      <form action="/api/auth/register" method="post" data-ajax class="space-y-4">
        <input type="hidden" name="ref" value={props.ref || ''} />
        <div>
          <label class="block text-sm font-medium text-[#d4d3eb] mb-1.5">Họ và tên</label>
          <div class="relative">
            <input type="text" name="full_name" required placeholder="Nguyễn Văn A" class={inputCls + ' pl-11'} />
            <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-[#d4d3eb] mb-1.5">Email</label>
          <div class="relative">
            <input type="email" name="email" required autocomplete="email" placeholder="email@example.com" class={inputCls + ' pl-11'} />
            <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-[#d4d3eb] mb-1.5">Số điện thoại <span class="text-slate-500 font-normal">(tuỳ chọn)</span></label>
          <div class="relative">
            <input type="tel" name="phone" placeholder="0915967790" class={inputCls + ' pl-11'} />
            <i class="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-[#d4d3eb] mb-1.5">Mật khẩu</label>
          <div class="relative">
            <input type="password" name="password" required minlength={6} autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" class={inputCls + ' pl-11'} />
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <label class="flex items-start gap-2.5 text-sm text-[#9f9dbb] cursor-pointer">
          <input type="checkbox" required class="mt-0.5 accent-indigo-500" />
          <span>Tôi đồng ý với <a href="/dieu-khoan" class="text-indigo-400 hover:underline">Điều khoản sử dụng</a> và <a href="/chinh-sach" class="text-indigo-400 hover:underline">Chính sách bảo mật</a></span>
        </label>
        <div class="form-error hidden p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-sm text-rose-300"></div>
        <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-indigo-500/25 transition">
          Đăng ký tài khoản
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-[#9f9dbb]">
        Đã có tài khoản? <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:underline">Đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)

export const ForgotPage: FC<LayoutProps> = (props) => (
  <Layout {...props} title="Quên mật khẩu">
    <AuthShell title="Quên mật khẩu" subtitle="Liên hệ hỗ trợ để được cấp lại mật khẩu nhanh chóng." settings={props.settings}>
      <div class="p-5 rounded-2xl bg-[#16143c] border border-[#28235d] space-y-4">
        <p class="text-sm text-[#b9b8d9] leading-relaxed">
          Hiện tại việc khôi phục mật khẩu được xử lý thủ công qua đội ngũ hỗ trợ để đảm bảo an toàn tài khoản.
          Vui lòng liên hệ với chúng tôi kèm email đã đăng ký.
        </p>
        <a href={`https://zalo.me/${props.settings?.zalo || ''}`} target="_blank" rel="noopener"
          class="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#0068ff] hover:bg-blue-600 text-white font-semibold transition">
          Chat Zalo hỗ trợ
        </a>
        <a href={`mailto:${props.settings?.email || ''}`}
          class="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-[#28235d] text-white hover:border-indigo-400 hover:bg-white/5 font-semibold text-sm transition">
          <i class="fas fa-envelope"></i>Gửi email hỗ trợ
        </a>
      </div>
      <p class="mt-6 text-center text-sm text-[#9f9dbb]">
        <a href="/dang-nhap" class="font-semibold text-indigo-400 hover:underline"><i class="fas fa-arrow-left mr-1"></i>Quay lại đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)
