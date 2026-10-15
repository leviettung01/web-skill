import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'

const AuthShell: FC<{ title: string; subtitle: string; children: any }> = ({ title, subtitle, children }) => (
  <div class="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
    {/* Left visual */}
    <div class="hidden lg:flex relative bg-slate-950 text-white p-12 flex-col justify-between overflow-hidden">
      <div class="absolute inset-0 hero-mesh"></div>
      <div class="absolute inset-0 hero-grid"></div>
      <div class="relative">
        <a href="/" class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center">
            <i class="fas fa-wand-magic-sparkles"></i>
          </div>
          <span class="font-extrabold text-lg">SrcTool AI</span>
        </a>
      </div>
      <div class="relative">
        <h2 class="text-3xl xl:text-4xl font-extrabold leading-tight mb-4">
          Kho <span class="bg-gradient-to-r from-brand-400 to-fuchsia-400 bg-clip-text text-transparent">Source Code &amp; Tool AI</span> tạo video
        </h2>
        <p class="text-slate-300 mb-8 max-w-md leading-relaxed">
          Tham gia cùng hàng nghìn creator đang dùng công cụ của chúng tôi để sản xuất video bán hàng mỗi ngày.
        </p>
        <ul class="space-y-3.5">
          {[
            ['fa-bolt', 'Giao source code tự động 24/7'],
            ['fa-infinity', 'Sở hữu trọn đời, cập nhật miễn phí'],
            ['fa-headset', 'Hỗ trợ kỹ thuật 1-1 qua Zalo'],
            ['fa-shield-halved', 'Hoàn tiền 100% trong 7 ngày']
          ].map(([ic, t]) => (
            <li class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/20 grid place-items-center text-brand-300 shrink-0">
                <i class={`fas ${ic}`}></i>
              </div>
              <span class="text-slate-200 text-sm">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div class="relative text-xs text-slate-500">© 2026 SrcTool AI — Phát triển tại Việt Nam</div>
    </div>

    {/* Right form */}
    <div class="flex items-center justify-center p-6 md:p-12 bg-slate-50">
      <div class="w-full max-w-md">
        <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{title}</h1>
        <p class="text-slate-500 mb-7">{subtitle}</p>
        {children}
      </div>
    </div>
  </div>
)

const inputCls = 'w-full h-12 px-4 rounded-xl bg-white border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none text-sm transition'

export const LoginPage: FC<LayoutProps & { next?: string; registered?: boolean }> = (props) => (
  <Layout {...props} title="Đăng nhập" bodyClass="bg-slate-50">
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại! Đăng nhập để truy cập sản phẩm đã mua.">
      {props.registered && (
        <div class="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          <i class="fas fa-circle-check mr-1.5"></i>Đăng ký thành công! Vui lòng đăng nhập.
        </div>
      )}
      <form action="/api/auth/login" method="post" data-ajax class="space-y-4">
        <input type="hidden" name="next" value={props.next || ''} />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div class="relative">
            <input type="email" name="email" required autocomplete="email" placeholder="email@example.com" class={inputCls + ' pl-11'} id="login-email" />
            <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-sm font-medium text-slate-700">Mật khẩu</label>
            <a href="/quen-mat-khau" class="text-xs text-brand-600 hover:underline">Quên mật khẩu?</a>
          </div>
          <div class="relative">
            <input type="password" name="password" required autocomplete="current-password" placeholder="••••••••" class={inputCls + ' pl-11'} id="login-password" />
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
        <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition">
          Đăng nhập
        </button>
      </form>

      <div class="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm">
        <div class="font-semibold text-blue-900 mb-1.5"><i class="fas fa-flask mr-1.5"></i>Tài khoản demo</div>
        <div class="text-blue-800 space-y-0.5 text-xs">
          <div>👤 User: <code class="bg-white px-1.5 py-0.5 rounded">demo@srctool.ai</code> / <code class="bg-white px-1.5 py-0.5 rounded">123456</code></div>
          <div>🛡️ Admin: <code class="bg-white px-1.5 py-0.5 rounded">admin@srctool.ai</code> / <code class="bg-white px-1.5 py-0.5 rounded">123456</code></div>
        </div>
      </div>

      <p class="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản? <a href="/dang-ky" class="font-semibold text-brand-600 hover:underline">Đăng ký ngay</a>
      </p>
    </AuthShell>
  </Layout>
)

export const RegisterPage: FC<LayoutProps & { ref?: string }> = (props) => (
  <Layout {...props} title="Đăng ký" bodyClass="bg-slate-50">
    <AuthShell title="Tạo tài khoản" subtitle="Đăng ký miễn phí trong 30 giây để bắt đầu mua sắm.">
      <form action="/api/auth/register" method="post" data-ajax class="space-y-4">
        <input type="hidden" name="ref" value={props.ref || ''} />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
          <div class="relative">
            <input type="text" name="full_name" required placeholder="Nguyễn Văn A" class={inputCls + ' pl-11'} />
            <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div class="relative">
            <input type="email" name="email" required autocomplete="email" placeholder="email@example.com" class={inputCls + ' pl-11'} />
            <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại <span class="text-slate-400 font-normal">(tuỳ chọn)</span></label>
          <div class="relative">
            <input type="tel" name="phone" placeholder="0987654321" class={inputCls + ' pl-11'} />
            <i class="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
          <div class="relative">
            <input type="password" name="password" required minlength={6} autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" class={inputCls + ' pl-11'} />
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          </div>
        </div>
        <label class="flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" required class="mt-0.5 accent-brand-600" />
          <span>Tôi đồng ý với <a href="/dieu-khoan" class="text-brand-600 hover:underline">Điều khoản sử dụng</a> và <a href="/chinh-sach" class="text-brand-600 hover:underline">Chính sách bảo mật</a></span>
        </label>
        <div class="form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"></div>
        <button type="submit" class="w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition">
          Đăng ký tài khoản
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-slate-600">
        Đã có tài khoản? <a href="/dang-nhap" class="font-semibold text-brand-600 hover:underline">Đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)

export const ForgotPage: FC<LayoutProps> = (props) => (
  <Layout {...props} title="Quên mật khẩu" bodyClass="bg-slate-50">
    <AuthShell title="Quên mật khẩu" subtitle="Liên hệ hỗ trợ để được cấp lại mật khẩu nhanh chóng.">
      <div class="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
        <p class="text-sm text-slate-600 leading-relaxed">
          Hiện tại việc khôi phục mật khẩu được xử lý thủ công qua đội ngũ hỗ trợ để đảm bảo an toàn tài khoản.
          Vui lòng liên hệ với chúng tôi kèm email đã đăng ký.
        </p>
        <a href={`https://zalo.me/${props.settings?.zalo}`} target="_blank" rel="noopener"
          class="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition">
          Chat Zalo hỗ trợ
        </a>
        <a href={`mailto:${props.settings?.email}`}
          class="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-slate-200 hover:border-brand-400 font-semibold text-sm transition">
          <i class="fas fa-envelope"></i>Gửi email hỗ trợ
        </a>
      </div>
      <p class="mt-6 text-center text-sm text-slate-600">
        <a href="/dang-nhap" class="font-semibold text-brand-600 hover:underline"><i class="fas fa-arrow-left mr-1"></i>Quay lại đăng nhập</a>
      </p>
    </AuthShell>
  </Layout>
)
