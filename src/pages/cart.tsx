import type { FC } from 'hono/jsx'
import { Layout, type LayoutProps } from '../components/Layout'
import { Breadcrumb, EmptyState, StatusBadge } from '../components/ui'
import { formatVND, gradientFor, PRODUCT_TYPE_LABEL, formatDateTime, vietQrUrl } from '../lib/utils'
import type { Product, Order } from '../lib/types'

const CheckoutSteps: FC<{ step: 1 | 2 | 3 }> = ({ step }) => {
  const steps: [number, string][] = [
    [1, 'Giỏ hàng'],
    [2, 'Xác nhận & Mã giảm giá'],
    [3, 'Thanh toán VietQR']
  ]
  return (
    <nav aria-label="Tiến trình thanh toán" class="mb-7">
      <ol class="flex flex-wrap items-center gap-2 sm:gap-4">
        {steps.map(([n, label], idx) => {
          const done = step > n
          const cur = step === n
          return (
            <>
              <li class="flex items-center gap-2">
                <span class={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold tabular-nums ${done ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : cur ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-[#161436] border border-[#2a2559] text-[#9492b8]'}`}>
                  {done ? <i class="fas fa-check text-[10px]" aria-hidden="true"></i> : n}
                </span>
                <span class={`text-xs sm:text-sm font-semibold ${cur ? 'text-white' : done ? 'text-emerald-300' : 'text-[#9492b8]'}`}>{label}</span>
              </li>
              {idx < steps.length - 1 && <li class="text-[#5c5980]" aria-hidden="true"><i class="fas fa-chevron-right text-[10px]"></i></li>}
            </>
          )
        })}
      </ol>
    </nav>
  )
}

/* ================= CART ================= */
export const CartPage: FC<LayoutProps & { items: Product[]; subtotal: number }> = (props) => {
  const { items, subtotal } = props
  return (
    <Layout {...props} title="Giỏ hàng">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Giỏ hàng' }]} />
        <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-5">Giỏ hàng của bạn</h1>
        {items.length > 0 && <CheckoutSteps step={1} />}

        {items.length === 0 ? (
          <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54]">
            <EmptyState icon="fa-cart-shopping" title="Giỏ hàng đang trống"
              desc="Khám phá bộ 5 Skill AI làm video đang mở bán của chúng tôi."
              action={{ href: '/san-pham?type=skill', label: 'Xem 5 Skill đang bán' }} />
          </div>
        ) : (
          <div class="grid lg:grid-cols-[1fr_360px] gap-6">
            <div class="space-y-3">
              {items.map(p => (
                <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-4 flex gap-4">
                  <a href={`/san-pham/${p.slug}`} class="w-24 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 grid place-items-center text-white bg-[#070614]"
                    style={p.thumbnail ? '' : `background:${gradientFor(p.id)}`}>
                    {p.thumbnail ? <img src={p.thumbnail} alt={p.name} class="w-full h-full object-cover" />
                      : <i class={`fas ${p.product_type === 'skill' ? 'fa-wand-magic-sparkles' : p.product_type === 'chatbot' ? 'fa-robot' : p.product_type === 'combo' ? 'fa-box-open' : 'fa-code'} text-xl`} aria-hidden="true"></i>}
                  </a>
                  <div class="flex-1 min-w-0">
                    <div class="text-[11px] text-indigo-400 font-bold mb-1 uppercase">{PRODUCT_TYPE_LABEL[p.product_type]}</div>
                    <h3 class="font-bold text-white leading-snug line-clamp-2 mb-1.5">
                      <a href={`/san-pham/${p.slug}`} class="hover:text-indigo-300 transition">{p.name}</a>
                    </h3>
                    <div class="text-xs text-[#9492b8] mb-2">{p.version} · Sở hữu trọn đời</div>
                    <div class="flex items-end justify-between gap-3">
                      <div class="tabular-nums">
                        {p.original_price && p.original_price > p.price &&
                          <span class="text-xs text-[#9492b8] line-through mr-2">{formatVND(p.original_price)}</span>}
                        <span class="text-lg font-extrabold text-rose-400">{formatVND(p.price)}</span>
                      </div>
                      <button type="button" class="btn-remove-cart w-9 h-9 rounded-lg bg-white/5 hover:bg-rose-500/15 text-[#9492b8] hover:text-rose-400 grid place-items-center text-sm transition cursor-pointer"
                        data-id={p.id} aria-label={`Xoá ${p.name} khỏi giỏ hàng`} title="Xoá">
                        <i class="fas fa-trash-can" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <a href="/san-pham" class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:underline mt-2">
                <i class="fas fa-arrow-left" aria-hidden="true"></i>Tiếp tục mua sắm
              </a>
            </div>

            <aside class="lg:sticky-side">
              <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
                <h3 class="font-bold text-white mb-4">Tóm tắt đơn hàng</h3>
                <div class="space-y-2.5 text-sm pb-4 border-b border-[#221e54] tabular-nums">
                  <div class="flex justify-between"><span class="text-[#9492b8]">Số sản phẩm</span><b class="text-white">{items.length}</b></div>
                  <div class="flex justify-between"><span class="text-[#9492b8]">Tạm tính</span><b class="text-white">{formatVND(subtotal)}</b></div>
                  <div class="flex justify-between"><span class="text-[#9492b8]">Phí giao hàng</span><b class="text-emerald-400">Miễn phí</b></div>
                </div>
                <div class="flex justify-between items-end py-4 tabular-nums">
                  <span class="font-bold text-white">Tổng cộng</span>
                  <span class="text-2xl font-extrabold text-rose-400">{formatVND(subtotal)}</span>
                </div>
                <a href="/thanh-toan" class="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:opacity-95 shadow-lg shadow-indigo-500/25 transition">
                  <i class="fas fa-lock" aria-hidden="true"></i>Tiến hành thanh toán
                </a>
                <div class="mt-4 pt-4 border-t border-[#221e54] space-y-2 text-xs text-[#b8b6d9]">
                  <div><i class="fas fa-bolt text-indigo-400 w-4" aria-hidden="true"></i>Nhận link tải Skill ngay sau thanh toán</div>
                  <div><i class="fas fa-shield-halved text-indigo-400 w-4" aria-hidden="true"></i>Hoàn tiền 100% trong 7 ngày</div>
                  <div><i class="fas fa-headset text-indigo-400 w-4" aria-hidden="true"></i>Hỗ trợ kỹ thuật 1-1 qua Zalo</div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}

/* ================= CHECKOUT ================= */
export const CheckoutPage: FC<LayoutProps & { items: Product[]; subtotal: number; balance: number }> = (props) => {
  const { items, subtotal, balance } = props
  return (
    <Layout {...props} title="Thanh toán">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Giỏ hàng', href: '/gio-hang' }, { label: 'Thanh toán' }]} />
        <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-5">Thanh toán</h1>
        <CheckoutSteps step={2} />

        <form id="checkout-form" class="grid lg:grid-cols-[1fr_380px] gap-6">
          <div class="space-y-4">
            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
              <h3 class="font-bold text-white mb-4"><i class="fas fa-user mr-2 text-indigo-400" aria-hidden="true"></i>Thông tin khách hàng</h3>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label for="co-name" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Họ tên</label>
                  <input id="co-name" type="text" value={props.user?.full_name} disabled class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-sm text-[#c2c0e0]" />
                </div>
                <div>
                  <label for="co-email" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Email nhận sản phẩm</label>
                  <input id="co-email" type="email" value={props.user?.email} disabled class="w-full h-11 px-3.5 rounded-xl bg-[#161436] border border-[#221e54] text-sm text-[#c2c0e0]" />
                </div>
              </div>
              <div class="mt-4">
                <label for="checkout-note" class="block text-sm font-medium text-[#d6d4ee] mb-1.5">Ghi chú <span class="text-[#9492b8] font-normal">(tuỳ chọn)</span></label>
                <textarea name="note" id="checkout-note" rows={2} placeholder="Yêu cầu thêm cho đơn hàng..."
                  class="w-full p-3 rounded-xl bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-white placeholder-[#9492b8] outline-none text-sm resize-y"></textarea>
              </div>
            </div>

            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
              <h3 class="font-bold text-white mb-4"><i class="fas fa-credit-card mr-2 text-indigo-400" aria-hidden="true"></i>Phương thức thanh toán</h3>
              <div class="space-y-2.5">
                <label class="flex items-center gap-3.5 p-4 rounded-xl border-2 border-indigo-500 bg-indigo-500/10 cursor-pointer">
                  <input type="radio" name="payment_method" value="bank" checked class="accent-indigo-500" />
                  <div class="w-10 h-10 rounded-lg bg-[#161436] border border-indigo-500/30 grid place-items-center text-indigo-400 shrink-0"><i class="fas fa-qrcode" aria-hidden="true"></i></div>
                  <div class="flex-1">
                    <div class="font-semibold text-white text-sm">Chuyển khoản VietQR (Ngân hàng / MoMo)</div>
                    <div class="text-xs text-[#b8b6d9]">Quét mã QR bằng app ngân hàng hoặc ví điện tử — đối soát tự động 24/7</div>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">KHUYÊN DÙNG</span>
                </label>

                <label class={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition ${balance >= subtotal ? 'border-[#2a2559] bg-[#161436]/50 hover:border-indigo-500/40' : 'border-[#221e54] bg-[#070614]/40 opacity-50 cursor-not-allowed'}`}>
                  <input type="radio" name="payment_method" value="balance" disabled={balance < subtotal} class="accent-indigo-500" />
                  <div class="w-10 h-10 rounded-lg bg-emerald-500/15 grid place-items-center text-emerald-400 shrink-0"><i class="fas fa-piggy-bank" aria-hidden="true"></i></div>
                  <div class="flex-1">
                    <div class="font-semibold text-white text-sm tabular-nums">Số dư ví <span class="text-emerald-400">({formatVND(balance)})</span></div>
                    <div class="text-xs text-[#b8b6d9]">{balance >= subtotal ? 'Thanh toán tức thì, nhận link tải Skill ngay' : 'Số dư không đủ cho đơn hàng này'}</div>
                  </div>
                </label>
              </div>
            </div>

            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
              <label for="coupon-input" class="block font-bold text-white mb-4"><i class="fas fa-ticket mr-2 text-indigo-400" aria-hidden="true"></i>Mã giảm giá</label>
              <div class="flex gap-2">
                <input type="text" id="coupon-input" placeholder="Nhập mã giảm giá" style="text-transform:uppercase"
                  class="flex-1 h-11 px-3.5 rounded-xl bg-[#161436] border border-[#2a2559] focus:border-indigo-500 text-white placeholder-[#9492b8] outline-none text-sm font-mono" />
                <button type="button" id="apply-coupon" class="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer">Áp dụng</button>
              </div>
              <div id="coupon-msg" class="mt-2.5 text-sm hidden" role="status"></div>
              <div class="mt-3 flex flex-wrap gap-1.5">
                {['WELCOME10', 'SALE20', 'GIAM100K'].map(c => (
                  <button type="button" class="coupon-quick px-2.5 py-1.5 rounded-md bg-[#161436] border border-[#2a2559] hover:border-indigo-400 text-[#c2c0e0] hover:text-white text-xs font-mono font-semibold transition cursor-pointer" data-code={c}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <aside class="lg:sticky-side">
            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
              <h3 class="font-bold text-white mb-4 tabular-nums">Đơn hàng ({items.length})</h3>
              <div class="space-y-3 max-h-64 overflow-y-auto pb-4 border-b border-[#221e54]">
                {items.map(p => (
                  <div class="flex gap-3">
                    <div class="w-14 aspect-video rounded-lg shrink-0 grid place-items-center text-white text-xs bg-[#070614]"
                      style={p.thumbnail ? '' : `background:${gradientFor(p.id)}`}>
                      {p.thumbnail ? <img src={p.thumbnail} alt="" class="w-full h-full object-cover rounded-lg" /> : <i class="fas fa-code" aria-hidden="true"></i>}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-[13px] font-semibold text-white line-clamp-2 leading-snug">{p.name}</div>
                      <div class="text-xs text-rose-400 font-bold mt-0.5 tabular-nums">{formatVND(p.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div class="space-y-2.5 text-sm py-4 border-b border-[#221e54] tabular-nums">
                <div class="flex justify-between"><span class="text-[#9492b8]">Tạm tính</span><b id="sum-subtotal" class="text-white">{formatVND(subtotal)}</b></div>
                <div class="flex justify-between" id="discount-row" style="display:none">
                  <span class="text-[#9492b8]">Giảm giá</span><b class="text-emerald-400" id="sum-discount">-0đ</b>
                </div>
              </div>
              <div class="flex justify-between items-end py-4 tabular-nums">
                <span class="font-bold text-white">Tổng thanh toán</span>
                <span class="text-2xl font-extrabold text-rose-400" id="sum-total" data-subtotal={subtotal}>{formatVND(subtotal)}</span>
              </div>
              <button type="submit" id="place-order-btn"
                class="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold hover:opacity-95 shadow-lg shadow-rose-500/25 transition cursor-pointer">
                <i class="fas fa-check-circle" aria-hidden="true"></i>Đặt hàng ngay
              </button>
              <p class="mt-3 text-[11px] text-[#9492b8] text-center leading-relaxed">
                Bằng việc đặt hàng, bạn đồng ý với <a href="/dieu-khoan" class="text-indigo-400 hover:underline">Điều khoản sử dụng</a> của chúng tôi.
              </p>
            </div>
          </aside>
        </form>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
(function(){
  var subtotal = ${subtotal};
  var coupon = null, discount = 0;
  function fmt(n){ return new Intl.NumberFormat('vi-VN').format(n)+'đ'; }
  function render(){
    document.getElementById('sum-discount').textContent = '-'+fmt(discount);
    document.getElementById('discount-row').style.display = discount>0?'flex':'none';
    document.getElementById('sum-total').textContent = fmt(Math.max(0, subtotal-discount));
  }
  document.querySelectorAll('.coupon-quick').forEach(function(b){
    b.onclick=function(){ document.getElementById('coupon-input').value=b.dataset.code; document.getElementById('apply-coupon').click(); };
  });
  document.getElementById('apply-coupon').onclick=async function(){
    var code=(document.getElementById('coupon-input').value||'').trim().toUpperCase();
    var msg=document.getElementById('coupon-msg');
    if(!code){ return; }
    try{
      var r=await axios.post('/api/coupons/check',{code:code, subtotal:subtotal});
      coupon=code; discount=r.data.discount; render();
      msg.className='mt-2.5 text-sm text-emerald-400'; msg.innerHTML='<i class="fas fa-circle-check mr-1"></i>Áp dụng thành công! Giảm '+fmt(discount);
      msg.classList.remove('hidden');
    }catch(e){
      coupon=null; discount=0; render();
      msg.className='mt-2.5 text-sm text-rose-400';
      msg.innerHTML='<i class="fas fa-circle-xmark mr-1"></i>'+((e.response&&e.response.data&&e.response.data.error)||'Mã không hợp lệ');
      msg.classList.remove('hidden');
    }
  };
  document.getElementById('checkout-form').onsubmit=async function(e){
    e.preventDefault();
    var btn=document.getElementById('place-order-btn'); var o=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Đang tạo đơn...';
    try{
      var pm=document.querySelector('input[name=payment_method]:checked').value;
      var r=await axios.post('/api/orders/create',{
        payment_method: pm, coupon_code: coupon, note: document.getElementById('checkout-note').value
      });
      location.href='/don-hang/'+r.data.order_code;
    }catch(err){
      btn.disabled=false; btn.innerHTML=o;
      toast((err.response&&err.response.data&&err.response.data.error)||'Không thể tạo đơn hàng','error');
    }
  };
})();`}}></script>
    </Layout>
  )
}

/* ================= ORDER DETAIL / PAYMENT ================= */
export const OrderPage: FC<LayoutProps & {
  order: Order; items: any[]; bank: Record<string, string>; isNew?: boolean
}> = (props) => {
  const { order, items, bank } = props
  const content = order.order_code
  const qr = vietQrUrl(bank.bank_code, bank.bank_account, order.total, content, bank.bank_owner)

  return (
    <Layout {...props} title={`Đơn hàng ${order.order_code}`}>
      <div class="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Đơn hàng', href: '/tai-khoan/don-hang' }, { label: order.order_code }]} />
        {order.status === 'pending' && <CheckoutSteps step={3} />}

        {order.status === 'paid' && (
          <div class="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 p-6 mb-6 text-center">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500 text-white grid place-items-center text-2xl mx-auto mb-3 shadow-lg shadow-emerald-500/25">
              <i class="fas fa-check" aria-hidden="true"></i>
            </div>
            <h2 class="text-xl font-extrabold text-white mb-1.5">Thanh toán thành công!</h2>
            <p class="text-sm text-emerald-200 mb-4">Bộ Skill AI đã được kích hoạt trong tài khoản của bạn.</p>
            <a href="/tai-khoan/san-pham" class="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition">
              <i class="fas fa-download" aria-hidden="true"></i>Mở &amp; tải Skill ngay
            </a>
          </div>
        )}

        <div class="grid lg:grid-cols-[1fr_340px] gap-6">
          <div class="space-y-4">
            {order.status === 'pending' && (
              <div class="bg-[#0f0e24] rounded-2xl border-2 border-amber-500/45 overflow-hidden">
                <div class="bg-amber-500/15 px-5 py-3.5 border-b border-amber-500/30">
                  <h3 class="font-bold text-amber-300"><i class="fas fa-qrcode mr-2" aria-hidden="true"></i>Quét mã QR để thanh toán</h3>
                </div>
                {(!bank.bank_account || bank.bank_account === '0987654321') && (
                  <div class="mx-5 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
                    <i class="fas fa-triangle-exclamation mr-1.5 text-rose-400" aria-hidden="true"></i>
                    <b>Thông báo:</b> Tài khoản ngân hàng đang ở cấu hình mẫu. Vui lòng liên hệ Zalo <b>{props.settings?.zalo}</b> để xác nhận STK trước khi chuyển khoản.
                  </div>
                )}
                <div class="p-5 grid sm:grid-cols-[220px_1fr] gap-6">
                  <div class="text-center">
                    <img src={qr} alt="QR thanh toán VietQR" class="w-full max-w-[220px] mx-auto rounded-xl border border-[#2a2559] bg-white p-1.5" />
                    <p class="text-xs text-[#b8b6d9] mt-2">Mở app ngân hàng và quét mã</p>
                  </div>
                  <div class="space-y-3">
                    {[
                      ['Ngân hàng', bank.bank_name],
                      ['Số tài khoản', bank.bank_account],
                      ['Chủ tài khoản', bank.bank_owner],
                      ['Số tiền', formatVND(order.total)],
                      ['Nội dung CK', content]
                    ].map(([lb, val], i) => (
                      <div class="flex items-center justify-between gap-3 pb-2.5 border-b border-[#221e54]">
                        <span class="text-sm text-[#9492b8] shrink-0">{lb}</span>
                        <div class="flex items-center gap-2 min-w-0">
                          <b class={`text-sm truncate tabular-nums ${i === 3 ? 'text-rose-400 text-base' : i === 4 ? 'text-indigo-300 font-mono' : 'text-white'}`}>{val}</b>
                          {i >= 1 && (
                            <button type="button" data-copy={i === 3 ? String(order.total) : val} aria-label={`Sao chép ${lb}`} title={`Sao chép ${lb}`}
                              class="shrink-0 w-8 h-8 rounded-md bg-[#161436] hover:bg-indigo-600 text-[#c2c0e0] hover:text-white text-xs transition cursor-pointer">
                              <i class="far fa-copy" aria-hidden="true"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 leading-relaxed">
                      <i class="fas fa-triangle-exclamation mr-1 text-rose-400" aria-hidden="true"></i>
                      <b>Quan trọng:</b> Vui lòng chuyển đúng số tiền và ghi đúng nội dung <b class="text-white font-mono">{content}</b> để hệ thống tự động xác nhận.
                    </div>
                  </div>
                </div>
                <div class="px-5 pb-5">
                  <div id="pay-status" class="mb-3 p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/35 flex items-center gap-3">
                    <span class="spinner shrink-0" aria-hidden="true"></span>
                    <div class="min-w-0">
                      <div class="text-sm font-bold text-white">Đang chờ giao dịch của bạn…</div>
                      <div id="pay-status-msg" class="text-xs text-indigo-200 mt-0.5">
                        Hệ thống tự động kiểm tra ngân hàng mỗi 5 giây. Trang sẽ tự chuyển khi nhận được tiền.
                      </div>
                    </div>
                  </div>
                  <button type="button" id="confirm-paid-btn" class="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-95 shadow-lg shadow-emerald-500/25 transition cursor-pointer">
                    <i class="fas fa-check-circle mr-1.5" aria-hidden="true"></i>Tôi đã chuyển khoản
                  </button>
                  <p class="text-[11px] text-[#9492b8] text-center mt-2.5">
                    Bấm nút này sau khi chuyển khoản để hệ thống kiểm tra ngay lập tức.
                  </p>
                </div>
              </div>
            )}

            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] overflow-hidden">
              <div class="px-5 py-3.5 border-b border-[#221e54] flex items-center justify-between">
                <h3 class="font-bold text-white">Chi tiết đơn hàng</h3>
                <StatusBadge status={order.status} />
              </div>
              <div class="p-5 space-y-3">
                {items.map(it => (
                  <div class="flex gap-3.5 items-center pb-3 border-b border-[#221e54] last:border-0 last:pb-0">
                    <div class="w-16 aspect-video rounded-lg shrink-0 grid place-items-center text-white"
                      style={`background:${gradientFor(it.product_id)}`}><i class="fas fa-wand-magic-sparkles text-sm" aria-hidden="true"></i></div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-white text-sm line-clamp-2 leading-snug">{it.product_name}</div>
                      {it.slug && <a href={`/san-pham/${it.slug}`} class="text-xs text-indigo-400 hover:underline">Xem sản phẩm</a>}
                    </div>
                    <div class="font-bold text-white text-sm shrink-0 tabular-nums">{formatVND(it.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside class="space-y-4">
            <div class="bg-[#0f0e24] rounded-2xl border border-[#221e54] p-5">
              <h3 class="font-bold text-white mb-4">Thông tin đơn</h3>
              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between"><span class="text-[#9492b8]">Mã đơn</span><b class="text-indigo-300 font-mono">{order.order_code}</b></div>
                <div class="flex justify-between"><span class="text-[#9492b8]">Ngày tạo</span><b class="text-white tabular-nums">{formatDateTime(order.created_at)}</b></div>
                <div class="flex justify-between"><span class="text-[#9492b8]">Thanh toán</span><b class="text-white">{order.payment_method === 'bank' ? 'VietQR' : order.payment_method === 'momo' ? 'MoMo' : 'Số dư ví'}</b></div>
                <div class="flex justify-between"><span class="text-[#9492b8]">Trạng thái</span><StatusBadge status={order.status} /></div>
              </div>
              <div class="mt-4 pt-4 border-t border-[#221e54] space-y-2.5 text-sm tabular-nums">
                <div class="flex justify-between"><span class="text-[#9492b8]">Tạm tính</span><b class="text-white">{formatVND(order.subtotal)}</b></div>
                {order.discount > 0 && (
                  <div class="flex justify-between"><span class="text-[#9492b8]">Giảm giá {order.coupon_code && `(${order.coupon_code})`}</span><b class="text-emerald-400">-{formatVND(order.discount)}</b></div>
                )}
                <div class="flex justify-between items-end pt-2.5 border-t border-[#221e54]">
                  <span class="font-bold text-white">Tổng cộng</span>
                  <span class="text-xl font-extrabold text-rose-400">{formatVND(order.total)}</span>
                </div>
              </div>
              {order.note && (
                <div class="mt-4 pt-4 border-t border-[#221e54]">
                  <div class="text-xs text-[#9492b8] mb-1">Ghi chú</div>
                  <p class="text-sm text-[#d6d4ee]">{order.note}</p>
                </div>
              )}
            </div>

            <div class="bg-[#0f0e24] rounded-2xl border border-indigo-500/30 p-5 text-white">
              <h3 class="font-bold mb-1.5 text-sm">Cần hỗ trợ?</h3>
              <p class="text-xs text-[#b8b6d9] mb-3.5">Liên hệ ngay nếu bạn gặp vấn đề với đơn hàng.</p>
              <a href={`https://zalo.me/${props.settings?.zalo}`} target="_blank" rel="noopener"
                class="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition">Chat Zalo</a>
            </div>
          </aside>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
(function(){
  var CODE='${order.order_code}';
  var btn=document.getElementById('confirm-paid-btn');
  var box=document.getElementById('pay-status');
  var msg=document.getElementById('pay-status-msg');
  if(!btn||!box) return;

  var ticks=0, MAX=240; // 240 x 5s = 20 phút
  var timer=null;

  function onPaid(){
    if(timer) clearInterval(timer);
    box.className='mb-3 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3';
    box.innerHTML='<i class="fas fa-circle-check text-emerald-400 text-xl shrink-0"></i>'
      +'<div><div class="text-sm font-bold text-white">Đã nhận được tiền!</div>'
      +'<div class="text-xs text-emerald-200 mt-0.5">Đang kích hoạt sản phẩm và chuyển trang…</div></div>';
    btn.disabled=true;
    if(window.toast) toast('Thanh toán thành công! Sản phẩm đã được kích hoạt.','success');
    setTimeout(function(){ location.reload(); },1200);
  }

  function stopWaiting(){
    if(timer) clearInterval(timer);
    box.className='mb-3 p-3.5 rounded-xl bg-[#16143c] border border-[#28235d] flex items-center gap-3';
    box.innerHTML='<i class="fas fa-clock text-slate-400 text-xl shrink-0"></i>'
      +'<div><div class="text-sm font-bold text-white">Đã tạm dừng kiểm tra tự động</div>'
      +'<div class="text-xs text-[#9f9dbb] mt-0.5">Tải lại trang để kiểm tra tiếp, hoặc liên hệ Zalo nếu bạn đã chuyển khoản.</div></div>';
  }

  async function check(silent){
    try{
      var r=await axios.get('/api/orders/'+CODE+'/status');
      if(r.data && r.data.status==='paid'){ onPaid(); return true; }
      if(r.data && (r.data.status==='cancelled'||r.data.status==='refunded')){ stopWaiting(); return true; }
    }catch(e){ /* bỏ qua lỗi mạng tạm thời */ }
    if(!silent && msg){
      msg.textContent='Chưa thấy giao dịch. Nếu bạn vừa chuyển khoản, vui lòng đợi 10–60 giây.';
    }
    return false;
  }

  // Tự động polling mỗi 5 giây
  timer=setInterval(async function(){
    if(!document.getElementById('confirm-paid-btn')){ clearInterval(timer); return; }
    ticks++;
    if(ticks>MAX){ stopWaiting(); return; }
    await check(true);
  },5000);

  // Bấm nút -> kiểm tra ngay
  btn.onclick=async function(){
    var old=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML='<span class="spinner"></span> Đang kiểm tra…';
    try{
      var r=await axios.post('/api/orders/confirm',{order_code:CODE});
      if(r.data && r.data.status==='paid'){ onPaid(); return; }
      if(window.toast) toast(r.data.message||'Đang kiểm tra giao dịch…','info');
      var done=await check(false);
      if(!done){ btn.disabled=false; btn.innerHTML=old; }
    }catch(e){
      btn.disabled=false; btn.innerHTML=old;
      if(window.toast) toast((e.response&&e.response.data&&e.response.data.error)||'Có lỗi xảy ra','error');
    }
  };

  // Kiểm tra ngay khi tải trang
  check(true);
})();`}}></script>
    </Layout>
  )
}
