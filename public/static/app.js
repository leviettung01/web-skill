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
    const isMp4 = url.endsWith('.mp4') || url.includes('/videos/');
    const m = document.createElement('div');
    m.className = 'fixed inset-0 z-[200] bg-black/90 grid place-items-center p-4 backdrop-blur-md';
    
    if (isVertical) {
      const mediaHtml = isMp4
        ? '<video src="' + url + '" class="w-full h-full object-cover bg-black" playsinline controls autoplay></video>'
        : '<iframe src="' + url + (url.includes('?') ? '&' : '?') + 'autoplay=1&mute=0" class="w-full h-full border-none" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

      m.innerHTML = '<div class="vertical-player-wrapper flex flex-col relative max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden border border-white/20 shadow-2xl">' +
        mediaHtml +
        '<button class="absolute top-4 right-4 z-[210] w-9 h-9 rounded-full bg-black/70 text-white hover:bg-black/90 flex items-center justify-center border border-white/20 cursor-pointer shadow-lg" id="close-mockup-btn"><i class="fas fa-xmark"></i></button>' +
        '</div>';
    } else {
      const mediaHtml = isMp4
        ? '<video src="' + url + '" class="w-full h-full object-contain bg-black" playsinline controls autoplay></video>'
        : '<iframe src="' + url + '?autoplay=1" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

      m.innerHTML = '<div class="w-full max-w-4xl relative">' +
        '<button class="absolute -top-12 right-0 z-[210] px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center gap-1.5 text-xs font-bold border border-white/20 cursor-pointer" id="close-mockup-btn"><i class="fas fa-xmark"></i>Đóng</button>' +
        '<div class="relative pt-[56.25%] rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">' +
        mediaHtml +
        '</div></div>';
    }
    
    m.onclick = (e) => { 
      if (e.target === m || e.target.id === 'close-mockup-btn' || e.target.closest('#close-mockup-btn')) {
        const v = m.querySelector('video');
        if (v) v.pause();
        m.remove(); 
      }
    };
    
    document.body.appendChild(m);
  };
  
  document.addEventListener('click', e => {
    const v = e.target.closest('[data-video]');
    if (v) { 
      e.preventDefault(); 
      window.openVideoModal(v.dataset.video, v.dataset.aspect); 
    }
  });

  /* =========================================================================
     1CLICKVN-STYLE VIDEO HERO, WALL MARQUEE & CINEMA THEATER
     ========================================================================= */
  
  // 1. HERO FRONT PHONE CONTROLS
  const heroFrontPhone = document.getElementById('heroFrontPhone');
  const heroFrontVideo = document.getElementById('heroFrontVideo');
  const heroPlayCenterBtn = document.getElementById('heroPlayCenterBtn');
  const heroPlayCenterIcon = document.getElementById('heroPlayCenterIcon');
  const heroSoundBtn = document.getElementById('heroSoundBtn');
  const heroProgressTrack = document.getElementById('heroProgressTrack');
  const heroProgressFill = document.getElementById('heroProgressFill');
  const heroTrailerBtn = document.getElementById('heroTrailerBtn');

  if (heroFrontVideo) {
    // Autoplay when visible
    heroFrontVideo.play().catch(() => {});

    function toggleHeroPlay() {
      if (heroFrontVideo.paused) {
        heroFrontVideo.play();
        if (heroFrontPhone) heroFrontPhone.classList.remove('is-paused');
        if (heroPlayCenterIcon) heroPlayCenterIcon.className = 'fas fa-pause text-white';
      } else {
        heroFrontVideo.pause();
        if (heroFrontPhone) heroFrontPhone.classList.add('is-paused');
        if (heroPlayCenterIcon) heroPlayCenterIcon.className = 'fas fa-play text-white ml-0.5';
      }
    }

    if (heroPlayCenterBtn) heroPlayCenterBtn.onclick = (e) => { e.stopPropagation(); toggleHeroPlay(); };
    heroFrontVideo.onclick = toggleHeroPlay;

    heroFrontVideo.addEventListener('timeupdate', () => {
      if (heroFrontVideo.duration && heroProgressFill) {
        const pct = (heroFrontVideo.currentTime / heroFrontVideo.duration) * 100;
        heroProgressFill.style.width = pct + '%';
      }
    });

    if (heroProgressTrack) {
      heroProgressTrack.onclick = (e) => {
        e.stopPropagation();
        const rect = heroProgressTrack.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (heroFrontVideo.duration) {
          heroFrontVideo.currentTime = ratio * heroFrontVideo.duration;
        }
      };
    }

    if (heroSoundBtn) {
      heroSoundBtn.onclick = (e) => {
        e.stopPropagation();
        if (heroFrontVideo.muted) {
          heroFrontVideo.muted = false;
          heroSoundBtn.classList.add('is-unmuted');
          heroSoundBtn.innerHTML = '<i class="fas fa-volume-high mr-1"></i><span>Tắt tiếng</span>';
          toast('Đã bật âm thanh video', 'success');
        } else {
          heroFrontVideo.muted = true;
          heroSoundBtn.classList.remove('is-unmuted');
          heroSoundBtn.innerHTML = '<i class="fas fa-volume-xmark mr-1"></i><span>Bật tiếng</span>';
          toast('Đã tắt tiếng video', 'info');
        }
      };
    }
  }

  // 2. VIDEO WALL CARDS INTERACTION
  const wallCards = document.querySelectorAll('.wall-card');
  wallCards.forEach(card => {
    const v = card.querySelector('video');
    card.addEventListener('mouseenter', () => {
      if (v && v.paused) {
        v.play().catch(() => {});
      }
    });
    card.addEventListener('mouseleave', () => {
      if (v && !v.paused) {
        v.pause();
      }
    });

    card.addEventListener('click', () => {
      const idx = Number(card.dataset.videoIndex || 0);
      switchTheaterVideo(idx, true);
      const th = document.getElementById('theater');
      if (th) th.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 3. CINEMA THEATER SECTION
  const THEATER_PLAYLIST = [
    {
      title: 'Khóa Học Video Muse AI — Từ Prompt Đến Video 10s Chuẩn Viral',
      shortTitle: 'Khóa học Muse AI Pro 30s',
      tag: 'Khóa học',
      dur: '0:30',
      desc: 'Học làm video AI bằng Muse AI từ A-Z: viết prompt khóa nhân vật, render clip 10s có lip-sync tiếng Việt tự nhiên, ghép thành video hoàn chỉnh.',
      videoUrl: '/videos/demo-khoa-hoc-muse-ai.mp4',
      posterUrl: '/videos/posters/poster-khoa-hoc-muse-ai.jpg',
      slug: 'khoa-hoc-video-muse-ai',
      price: '599.000đ',
      origPrice: '1.299.000đ'
    },
    {
      title: 'Khóa Học Video Seedance 2.5 — One-Take 30s Build Page',
      shortTitle: 'Seedance 2.5 · One-Take 30s',
      tag: 'Khóa học',
      dur: '0:30',
      desc: 'Làm chủ Seedance 2.5: quay one-take 30 giây nhân vật giữ nguyên, âm thanh native — công thức build page Reels/TikTok lên nhanh.',
      videoUrl: '/videos/demo-khoa-hoc-seedance.mp4',
      posterUrl: '/videos/posters/poster-khoa-hoc-seedance.jpg',
      slug: 'khoa-hoc-video-seedance-25-30s',
      price: '699.000đ',
      origPrice: '1.399.000đ'
    },
    {
      title: 'Skill Video Thuỷ Sinh 30s — Build Page Reels',
      shortTitle: 'Skill Video Thuỷ Sinh 30s',
      tag: 'Skill AI',
      dur: '0:15',
      desc: 'Bộ skill làm video thuỷ sinh 30s: prompt, quy trình render và checklist đăng bài để build page Reels ngách thuỷ sinh.',
      videoUrl: '/videos/demo-skill-thuy-sinh.mp4',
      posterUrl: '/videos/posters/poster-skill-thuy-sinh.jpg',
      slug: 'skill-video-thuy-sinh-30s',
      price: '399.000đ',
      origPrice: '799.000đ'
    },
    {
      title: 'Skill Video DIY Làm Vườn 30s — Build Page Reels',
      shortTitle: 'Skill Làm Vườn DIY 30s',
      tag: 'Skill AI',
      dur: '0:25',
      desc: 'Skill làm video DIY làm vườn 30s: công thức cảnh quay, prompt mẫu và lịch đăng để build page Reels ngách làm vườn.',
      videoUrl: '/videos/demo-skill-lam-vuon.mp4',
      posterUrl: '/videos/posters/poster-skill-lam-vuon.jpg',
      slug: 'skill-video-diy-lam-vuon-30s',
      price: '399.000đ',
      origPrice: '799.000đ'
    },
    {
      title: 'Skill Video Affiliate Fitness — Video 30s Chốt Đơn',
      shortTitle: 'Skill Affiliate Fitness 30s',
      tag: 'Skill AI',
      dur: '0:20',
      desc: 'Skill làm video fitness 30s bán hàng affiliate: kịch bản chuyển đổi cao, prompt và quy trình edit tay chi tiết.',
      videoUrl: '/videos/demo-skill-fitness.mp4',
      posterUrl: '/videos/posters/poster-skill-fitness.jpg',
      slug: 'skill-video-affiliate-fitness',
      price: '449.000đ',
      origPrice: '899.000đ'
    }
  ];

  const cinemaBox = document.getElementById('cinemaScreenBox');
  const theaterVideo = document.getElementById('theaterVideoElement');
  const theaterBigPlayBtn = document.getElementById('theaterBigPlayBtn');
  const theaterPlayBtn = document.getElementById('theaterPlayBtn');
  const theaterPlayIcon = document.getElementById('theaterPlayIcon');
  const theaterProgressTrack = document.getElementById('theaterProgressTrack');
  const theaterProgressFill = document.getElementById('theaterProgressFill');
  const theaterTimecode = document.getElementById('theaterTimecode');
  const theaterSoundBtn = document.getElementById('theaterSoundBtn');
  const theaterSoundIcon = document.getElementById('theaterSoundIcon');
  const theaterFullscreenBtn = document.getElementById('theaterFullscreenBtn');
  const theaterAmbientBg = document.getElementById('theaterAmbientBg');
  const playlistItems = document.querySelectorAll('#theaterPlaylist .playlist-item');

  function fmtTime(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function toggleTheaterPlay() {
    if (!theaterVideo) return;
    if (theaterVideo.paused) {
      // Pause hero front video if playing with sound
      if (heroFrontVideo && !heroFrontVideo.muted) heroFrontVideo.muted = true;
      theaterVideo.play().then(() => {
        if (cinemaBox) cinemaBox.classList.add('is-playing');
        if (theaterPlayIcon) theaterPlayIcon.className = 'fas fa-pause';
      }).catch(() => {});
    } else {
      theaterVideo.pause();
      if (cinemaBox) cinemaBox.classList.remove('is-playing');
      if (theaterPlayIcon) theaterPlayIcon.className = 'fas fa-play';
    }
  }

  if (theaterBigPlayBtn) theaterBigPlayBtn.onclick = toggleTheaterPlay;
  if (theaterPlayBtn) theaterPlayBtn.onclick = toggleTheaterPlay;
  if (theaterVideo) {
    theaterVideo.onclick = toggleTheaterPlay;

    theaterVideo.addEventListener('timeupdate', () => {
      if (theaterProgressFill && theaterVideo.duration) {
        const pct = (theaterVideo.currentTime / theaterVideo.duration) * 100;
        theaterProgressFill.style.width = pct + '%';
      }
      if (theaterTimecode) {
        theaterTimecode.textContent = fmtTime(theaterVideo.currentTime) + ' / ' + fmtTime(theaterVideo.duration || 30);
      }
    });

    theaterVideo.addEventListener('ended', () => {
      if (cinemaBox) cinemaBox.classList.remove('is-playing');
      if (theaterPlayIcon) theaterPlayIcon.className = 'fas fa-play';
    });
  }

  if (theaterProgressTrack && theaterVideo) {
    theaterProgressTrack.onclick = (e) => {
      const rect = theaterProgressTrack.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (theaterVideo.duration) {
        theaterVideo.currentTime = pos * theaterVideo.duration;
      }
    };
  }

  if (theaterSoundBtn && theaterVideo) {
    theaterSoundBtn.onclick = () => {
      theaterVideo.muted = !theaterVideo.muted;
      if (theaterSoundIcon) {
        theaterSoundIcon.className = theaterVideo.muted
          ? 'fas fa-volume-xmark text-rose-400'
          : 'fas fa-volume-high text-white';
      }
      toast(theaterVideo.muted ? 'Đã tắt tiếng' : 'Đã bật tiếng', 'info');
    };
  }

  if (theaterFullscreenBtn && theaterVideo) {
    theaterFullscreenBtn.onclick = () => {
      if (theaterVideo.requestFullscreen) theaterVideo.requestFullscreen();
      else if (theaterVideo.webkitRequestFullscreen) theaterVideo.webkitRequestFullscreen();
    };
  }

  function switchTheaterVideo(idx, autoPlay = true) {
    const item = THEATER_PLAYLIST[idx];
    if (!item || !theaterVideo) return;

    // Update active playlist UI
    playlistItems.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    // Update video source & poster
    theaterVideo.src = item.videoUrl;
    theaterVideo.poster = item.posterUrl;
    if (theaterAmbientBg) {
      theaterAmbientBg.style.backgroundImage = 'url("' + item.posterUrl + '")';
    }

    // Update details info
    const tagEl = document.getElementById('activeVideoTag');
    const durEl = document.getElementById('activeVideoDur');
    const titleEl = document.getElementById('activeVideoTitle');
    const descEl = document.getElementById('activeVideoDesc');
    const priceEl = document.getElementById('activeVideoPrice');
    const origPriceEl = document.getElementById('activeVideoOrigPrice');
    const linkEl = document.getElementById('activeVideoLink');

    if (tagEl) tagEl.textContent = item.tag;
    if (durEl) durEl.textContent = 'Thời lượng: ' + item.dur;
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.desc;
    if (priceEl) priceEl.textContent = item.price;
    if (origPriceEl) origPriceEl.textContent = item.origPrice;
    if (linkEl) linkEl.href = '/san-pham/' + item.slug;

    // Also update front hero video if user wants preview
    if (heroFrontVideo) {
      heroFrontVideo.src = item.videoUrl;
      heroFrontVideo.poster = item.posterUrl;
      const heroTitle = document.getElementById('heroVideoTitle');
      if (heroTitle) heroTitle.textContent = item.shortTitle;
      heroFrontVideo.play().catch(() => {});
    }

    if (autoPlay) {
      theaterVideo.muted = false;
      if (theaterSoundIcon) theaterSoundIcon.className = 'fas fa-volume-high text-white';
      theaterVideo.play().then(() => {
        if (cinemaBox) cinemaBox.classList.add('is-playing');
        if (theaterPlayIcon) theaterPlayIcon.className = 'fas fa-pause';
      }).catch(() => {});
    }
  }

  playlistItems.forEach((el, i) => {
    el.addEventListener('click', () => {
      switchTheaterVideo(i, true);
    });
  });

  if (heroTrailerBtn) {
    heroTrailerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTheaterVideo(0, true);
      const th = document.getElementById('theater');
      if (th) th.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- Sort/filter auto submit ---------- */
  document.querySelectorAll('[data-auto-submit]').forEach(el => {
    el.addEventListener('change', () => el.closest('form').submit());
  });

})();

