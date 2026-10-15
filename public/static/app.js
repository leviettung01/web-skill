/* ============ SrcTool AI - Frontend ============ */
(function () {
  'use strict';

  /* ---------- Toast ---------- */
  const ICONS = {
    success: ['fa-circle-check', 'text-emerald-500', 'border-emerald-200'],
    error: ['fa-circle-xmark', 'text-rose-500', 'border-rose-200'],
    info: ['fa-circle-info', 'text-blue-500', 'border-blue-200'],
    warning: ['fa-triangle-exclamation', 'text-amber-500', 'border-amber-200']
  };
  window.toast = function (msg, type) {
    type = type || 'success';
    const box = document.getElementById('toast-container');
    if (!box) return alert(msg);
    const [icon, color, border] = ICONS[type] || ICONS.info;
    const el = document.createElement('div');
    el.className = 'toast bg-white rounded-xl shadow-xl border ' + border + ' px-4 py-3 flex items-start gap-3';
    el.innerHTML = '<i class="fas ' + icon + ' ' + color + ' mt-0.5"></i>' +
      '<div class="text-sm text-slate-700 flex-1 leading-snug">' + msg + '</div>' +
      '<button class="text-slate-300 hover:text-slate-500"><i class="fas fa-xmark text-xs"></i></button>';
    el.querySelector('button').onclick = () => remove(el);
    box.appendChild(el);
    setTimeout(() => remove(el), 3800);
  };
  function remove(el) {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  }

  /* ---------- Header interactions ---------- */
  document.addEventListener('click', function (e) {
    const userBtn = e.target.closest('#user-menu-btn');
    const dd = document.getElementById('user-dropdown');
    if (userBtn && dd) { dd.classList.toggle('hidden'); return; }
    if (dd && !e.target.closest('#user-menu-wrap')) dd.classList.add('hidden');
  });

  const mobBtn = document.getElementById('mobile-menu-btn');
  if (mobBtn) mobBtn.onclick = () => {
    const n = document.getElementById('mobile-nav');
    n.classList.toggle('hidden');
    mobBtn.querySelector('i').className = n.classList.contains('hidden') ? 'fas fa-bars' : 'fas fa-xmark';
  };

  /* ---------- Back to top ---------- */
  const topBtn = document.getElementById('back-to-top');
  if (topBtn) {
    topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('scroll', () => {
      const show = window.scrollY > 500;
      topBtn.style.opacity = show ? '1' : '0';
      topBtn.style.pointerEvents = show ? 'auto' : 'none';
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* ---------- Cart ---------- */
  function setCartBadge(n) {
    const b = document.getElementById('cart-badge');
    if (!b) return;
    b.textContent = n;
    b.classList.toggle('hidden', !n);
  }
  window.setCartBadge = setCartBadge;

  async function addToCart(productId, name, btn) {
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
    try {
      const res = await axios.post('/api/cart/add', { product_id: Number(productId) });
      setCartBadge(res.data.count);
      if (res.data.owned) toast('Bạn đã sở hữu sản phẩm này rồi!', 'warning');
      else if (res.data.exists) toast('Sản phẩm đã có trong giỏ hàng', 'info');
      else toast('Đã thêm <b>' + (name || 'sản phẩm') + '</b> vào giỏ!', 'success');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast('Vui lòng đăng nhập để mua hàng', 'warning');
        setTimeout(() => location.href = '/dang-nhap?next=' + encodeURIComponent(location.pathname), 900);
      } else {
        toast((err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra', 'error');
      }
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
  }
  window.addToCart = addToCart;

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) { e.preventDefault(); addToCart(btn.dataset.id, btn.dataset.name, btn); }

    const rm = e.target.closest('.btn-remove-cart');
    if (rm) {
      e.preventDefault();
      axios.post('/api/cart/remove', { product_id: Number(rm.dataset.id) })
        .then(() => location.reload())
        .catch(() => toast('Không thể xoá', 'error'));
    }

    const wish = e.target.closest('.btn-wishlist');
    if (wish) {
      e.preventDefault();
      axios.post('/api/wishlist/toggle', { product_id: Number(wish.dataset.id) })
        .then(r => {
          const on = r.data.added;
          wish.querySelector('i').className = (on ? 'fas' : 'far') + ' fa-heart';
          wish.classList.toggle('text-rose-500', on);
          toast(on ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích', 'success');
        })
        .catch(err => {
          if (err.response && err.response.status === 401) {
            toast('Vui lòng đăng nhập', 'warning');
            setTimeout(() => location.href = '/dang-nhap', 800);
          }
        });
    }

    const buy = e.target.closest('.btn-buy-now');
    if (buy) {
      e.preventDefault();
      const b = buy; const o = b.innerHTML;
      b.disabled = true; b.innerHTML = '<span class="spinner"></span> Đang xử lý...';
      axios.post('/api/cart/add', { product_id: Number(b.dataset.id) })
        .then(() => location.href = '/thanh-toan')
        .catch(err => {
          b.disabled = false; b.innerHTML = o;
          if (err.response && err.response.status === 401) {
            toast('Vui lòng đăng nhập để mua hàng', 'warning');
            setTimeout(() => location.href = '/dang-nhap?next=' + encodeURIComponent(location.pathname), 900);
          } else toast('Có lỗi xảy ra', 'error');
        });
    }

    /* copy to clipboard */
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      e.preventDefault();
      const text = cp.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        toast('Đã sao chép!', 'success');
        const i = cp.querySelector('i');
        if (i) { const old = i.className; i.className = 'fas fa-check'; setTimeout(() => i.className = old, 1500); }
      }).catch(() => toast('Không thể sao chép', 'error'));
    }

    /* tabs */
    const tab = e.target.closest('.tab-btn');
    if (tab) {
      e.preventDefault();
      const group = tab.dataset.group || 'default';
      document.querySelectorAll('.tab-btn[data-group="' + group + '"]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel[data-group="' + group + '"]').forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      const panel = document.querySelector('.tab-panel[data-tab="' + tab.dataset.tab + '"][data-group="' + group + '"]');
      if (panel) panel.classList.remove('hidden');
    }

    /* faq accordion */
    const faq = e.target.closest('.faq-q');
    if (faq) {
      const item = faq.parentElement;
      const body = item.querySelector('.faq-a');
      const icon = faq.querySelector('.faq-icon');
      const open = !body.classList.contains('hidden');
      body.classList.toggle('hidden', open);
      if (icon) icon.style.transform = open ? '' : 'rotate(45deg)';
    }
  });

  /* ---------- Form AJAX helper ---------- */
  window.submitForm = async function (form, opts) {
    opts = opts || {};
    const btn = form.querySelector('[type=submit]');
    const orig = btn ? btn.innerHTML : '';
    const errBox = form.querySelector('.form-error');
    if (errBox) { errBox.classList.add('hidden'); errBox.textContent = ''; }
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang xử lý...'; }
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await axios.post(form.action || opts.url, data);
      if (opts.onSuccess) opts.onSuccess(res.data);
      else if (res.data.redirect) location.href = res.data.redirect;
      else { toast(res.data.message || 'Thành công!', 'success'); if (opts.reload) location.reload(); }
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra, vui lòng thử lại';
      if (errBox) { errBox.textContent = msg; errBox.classList.remove('hidden'); }
      else toast(msg, 'error');
      if (opts.onError) opts.onError(err);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  };

  document.querySelectorAll('form[data-ajax]').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.submitForm(form, { reload: form.dataset.reload === 'true' });
    });
  });

  /* ---------- Countdown ---------- */
  document.querySelectorAll('[data-countdown]').forEach(el => {
    const end = new Date(el.dataset.countdown).getTime();
    function tick() {
      const d = end - Date.now();
      if (d <= 0) { el.textContent = 'Đã kết thúc'; return; }
      const h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1000);
      const dd = Math.floor(h / 24);
      el.innerHTML = (dd > 0 ? dd + 'n ' : '') + String(h % 24).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      setTimeout(tick, 1000);
    }
    tick();
  });

  /* ---------- Sidebar minimize ---------- */
  const sideToggle = document.getElementById('sidebar-toggle-btn');
  if (sideToggle) {
    sideToggle.onclick = () => {
      const sidebar = document.getElementById('sidebar');
      const content = document.getElementById('main-content-wrap');
      const header = document.getElementById('site-header');
      if (sidebar && content) {
        sidebar.classList.toggle('sidebar-minimized');
        content.classList.toggle('content-expanded');
        if (header) header.classList.toggle('content-expanded');
        localStorage.setItem('sidebar-minimized', sidebar.classList.contains('sidebar-minimized') ? '1' : '0');
      }
    };
    // Load state
    if (localStorage.getItem('sidebar-minimized') === '1') {
      const sidebar = document.getElementById('sidebar');
      const content = document.getElementById('main-content-wrap');
      const header = document.getElementById('site-header');
      if (sidebar && content) {
        sidebar.classList.add('sidebar-minimized');
        content.classList.add('content-expanded');
        if (header) header.classList.add('content-expanded');
      }
    }
  }

  /* ---------- Gallery lightbox ---------- */
  window.openVideoModal = function (url, aspect) {
    const isVertical = aspect === 'vertical' || url.includes('aspect=vertical');
    const m = document.createElement('div');
    m.className = 'fixed inset-0 z-[200] bg-black/85 grid place-items-center p-4 backdrop-blur-sm';
    
    if (isVertical) {
      m.innerHTML = '<div class="vertical-player-wrapper flex flex-col relative">' +
        '<div class="video-mockup-overlay">' +
          '<div class="video-mockup-header">' +
            '<span class="text-xs font-semibold text-white tracking-wider bg-black/40 px-2 py-1 rounded">VEO 3 SHORTS</span>' +
            '<div class="video-mockup-actions">' +
              '<button class="video-mockup-btn btn-vol" title="Âm thanh"><i class="fas fa-volume-up"></i></button>' +
              '<button class="video-mockup-btn" title="Cài đặt"><i class="fas fa-gear"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="video-mockup-play-center" id="mockup-play-btn"><i class="fas fa-pause"></i></div>' +
          '<div class="video-mockup-footer">' +
            '<div class="video-mockup-info">' +
              '<p class="text-sm font-bold">@srctool.ai</p>' +
              '<p class="text-xs text-white/80 mt-1 line-clamp-2">Video Demo mẫu tạo bằng AI cực nét</p>' +
            '</div>' +
            '<div class="video-mockup-progress"><div class="video-mockup-progress-bar"></div></div>' +
          '</div>' +
        '</div>' +
        '<iframe src="' + url + (url.includes('?') ? '&' : '?') + 'autoplay=1&mute=0" class="w-full h-full border-none" allow="autoplay; encrypted-media" allowfullscreen></iframe>' +
        '<button class="absolute top-4 right-4 z-[210] w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center border border-white/20" id="close-mockup-btn"><i class="fas fa-xmark"></i></button>' +
        '</div>';
    } else {
      m.innerHTML = '<div class="w-full max-w-4xl"><div class="relative pt-[56.25%] rounded-xl overflow-hidden bg-black border border-slate-800">' +
        '<iframe src="' + url + '?autoplay=1" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>' +
        '</div><button class="mt-3 mx-auto block px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"><i class="fas fa-xmark mr-1"></i>Đóng</button></div>';
    }
    
    m.onclick = (e) => { 
      if (e.target === m || e.target.id === 'close-mockup-btn' || e.target.closest('#close-mockup-btn') || (!isVertical && e.target.closest('button'))) {
        m.remove(); 
      }
    };
    
    if (isVertical) {
      setTimeout(() => {
        const playBtn = m.querySelector('#mockup-play-btn');
        const playIcon = playBtn ? playBtn.querySelector('i') : null;
        if (playBtn) {
          playBtn.onclick = (e) => {
            e.stopPropagation();
            if (playIcon.classList.contains('fa-pause')) {
              playIcon.className = 'fas fa-play';
              toast('Tạm dừng video', 'info');
            } else {
              playIcon.className = 'fas fa-pause';
              toast('Tiếp tục phát', 'info');
            }
          };
        }
        const volBtn = m.querySelector('.btn-vol');
        if (volBtn) {
          volBtn.onclick = (e) => {
            e.stopPropagation();
            const volIcon = volBtn.querySelector('i');
            if (volIcon.classList.contains('fa-volume-up')) {
              volIcon.className = 'fas fa-volume-mute';
              toast('Đã tắt tiếng', 'info');
            } else {
              volIcon.className = 'fas fa-volume-up';
              toast('Đã bật tiếng', 'info');
            }
          };
        }
      }, 100);
    }
    
    document.body.appendChild(m);
  };
  
  document.addEventListener('click', e => {
    const v = e.target.closest('[data-video]');
    if (v) { 
      e.preventDefault(); 
      window.openVideoModal(v.dataset.video, v.dataset.aspect); 
    }
  });

  /* ---------- Sort/filter auto submit ---------- */
  document.querySelectorAll('[data-auto-submit]').forEach(el => {
    el.addEventListener('change', () => el.closest('form').submit());
  });

})();
