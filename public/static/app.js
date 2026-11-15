/* ============ KhoSkill AI - Frontend BigUpdate ============ */
(function () {
  'use strict';

  var pageCleanups = [];
  function registerCleanup(fn) {
    if (typeof fn === 'function') pageCleanups.push(fn);
  }
  function runCleanups() {
    while (pageCleanups.length) {
      try { pageCleanups.pop()(); } catch (e) { }
    }
  }

  /* ---------- Toast ---------- */
  var ICONS = {
    success: ['fa-circle-check', 'text-emerald-400', 'border-emerald-500/40'],
    error: ['fa-circle-xmark', 'text-rose-400', 'border-rose-500/40'],
    info: ['fa-circle-info', 'text-indigo-400', 'border-indigo-500/40'],
    warning: ['fa-triangle-exclamation', 'text-amber-400', 'border-amber-500/40']
  };
  window.toast = function (msg, type) {
    type = type || 'success';
    var box = document.getElementById('toast-container');
    if (!box) return alert(msg);
    var pair = ICONS[type] || ICONS.info;
    var el = document.createElement('div');
    el.className = 'toast bg-[#0f0e26] rounded-xl shadow-2xl border ' + pair[2] + ' px-4 py-3 flex items-start gap-3';
    el.innerHTML = '<i class="fas ' + pair[0] + ' ' + pair[1] + ' mt-0.5"></i>' +
      '<div class="text-sm text-[#e2e1f5] flex-1 leading-snug">' + msg + '</div>' +
      '<button type="button" class="text-slate-500 hover:text-white"><i class="fas fa-xmark text-xs"></i></button>';
    el.querySelector('button').onclick = function () { removeToast(el); };
    box.appendChild(el);
    setTimeout(function () { removeToast(el); }, 3800);
  };
  function removeToast(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.remove(); }, 250);
  }

  /* ---------- Top Progress Bar ---------- */
  var navProgTimer = null;
  function progressStart() {
    var bar = document.getElementById('nav-progress');
    if (!bar) return;
    clearTimeout(navProgTimer);
    bar.style.transition = 'none';
    bar.style.width = '18%';
    bar.style.opacity = '1';
    bar.offsetWidth;
    bar.style.transition = 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease';
    bar.style.width = '76%';
  }
  function progressDone() {
    var bar = document.getElementById('nav-progress');
    if (!bar) return;
    clearTimeout(navProgTimer);
    bar.style.transition = 'width 0.16s ease-out, opacity 0.22s ease 0.1s';
    bar.style.width = '100%';
    navProgTimer = setTimeout(function () {
      bar.style.opacity = '0';
      setTimeout(function () {
        if (bar.style.opacity === '0') bar.style.width = '0';
      }, 220);
    }, 140);
  }

  /* ---------- Smooth Collapsible + Auto-Hover Sidebar ---------- */
  function initSidebar() {
    var sidebar = document.getElementById('sidebar');
    var toggleBtn = document.getElementById('sidebar-toggle-btn');
    var toggleIcon = document.getElementById('sidebar-toggle-icon');
    var toggleLabel = document.getElementById('sidebar-toggle-label');
    var pinBtn = document.getElementById('sidebar-pin-btn');
    var backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    var STORAGE_KEY = 'khoskill_sidebar_state';
    var suppressHover = false;
    var hoverTimer = null;

    function isDesktop() { return window.innerWidth >= 1024; }
    function isPinned() { return document.documentElement.classList.contains('sb-pinned'); }
    function isOpenNow() { return isPinned() || sidebar.classList.contains('sb-hover-open'); }

    function syncButtonUI() {
      var pinned = isPinned();
      var expanded = isOpenNow();
      if (toggleIcon) {
        toggleIcon.className = 'fas ' + (expanded ? 'fa-angles-left' : 'fa-angles-right') + ' w-5 shrink-0 text-center';
      }
      if (toggleLabel) {
        toggleLabel.textContent = expanded ? 'Thu gọn' : 'Mở rộng';
      }
      if (toggleBtn) {
        toggleBtn.title = expanded ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên';
      }
      if (pinBtn) {
        pinBtn.title = pinned ? 'Bỏ ghim cố định' : 'Ghim mở rộng cố định';
        pinBtn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
      }
    }

    function openHoverPreview() {
      if (!isDesktop() || isPinned() || suppressHover) return;
      sidebar.classList.add('sb-hover-open');
      syncButtonUI();
    }

    function closeHoverPreview() {
      clearTimeout(hoverTimer);
      sidebar.classList.remove('sb-hover-open');
      syncButtonUI();
    }

    function collapseImmediately() {
      suppressHover = true;
      document.documentElement.classList.remove('sb-pinned');
      try { localStorage.setItem(STORAGE_KEY, 'collapsed'); } catch (e) { }
      closeHoverPreview();
      if (!isDesktop()) {
        sidebar.classList.remove('sb-mobile-open');
        if (backdrop) backdrop.classList.add('hidden');
      }
      syncButtonUI();
    }

    function pinExpanded() {
      suppressHover = false;
      document.documentElement.classList.add('sb-pinned');
      sidebar.classList.remove('sb-hover-open');
      try { localStorage.setItem(STORAGE_KEY, 'expanded'); } catch (e) { }
      syncButtonUI();
    }

    // Remove legacy .content-expanded if present
    document.querySelectorAll('.content-expanded, .sidebar-minimized').forEach(function (el) {
      el.classList.remove('content-expanded', 'sidebar-minimized');
    });

    sidebar.addEventListener('mouseenter', function () {
      if (!isDesktop() || isPinned() || suppressHover) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(openHoverPreview, 25);
    });

    sidebar.addEventListener('mouseleave', function () {
      clearTimeout(hoverTimer);
      suppressHover = false;
      if (!isPinned()) closeHoverPreview();
    });

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (isOpenNow()) {
          collapseImmediately();
        } else {
          pinExpanded();
        }
      });
    }

    if (pinBtn) {
      pinBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (isPinned()) {
          collapseImmediately();
        } else {
          pinExpanded();
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('sb-mobile-open');
        backdrop.classList.add('hidden');
      });
    }

    window.addEventListener('resize', function () {
      if (isDesktop() && backdrop) backdrop.classList.add('hidden');
      syncButtonUI();
    }, { passive: true });

    syncButtonUI();
  }

  /* ---------- Adaptive Media & Aspect Ratio Helpers ---------- */
  function toEmbedUrl(url) {
    if (!url) return '';
    if (url.indexOf('youtube.com/watch') !== -1) {
      var m1 = url.match(/[?&]v=([^&]+)/);
      if (m1) return 'https://www.youtube.com/embed/' + m1[1] + '?autoplay=1&rel=0';
    }
    if (url.indexOf('youtu.be/') !== -1) {
      var m2 = url.match(/youtu\.be\/([^?&]+)/);
      if (m2) return 'https://www.youtube.com/embed/' + m2[1] + '?autoplay=1&rel=0';
    }
    if (url.indexOf('youtube.com/shorts/') !== -1) {
      var m3 = url.match(/shorts\/([^?&/]+)/);
      if (m3) return 'https://www.youtube.com/embed/' + m3[1] + '?autoplay=1&rel=0';
    }
    return url;
  }

  function applyAdaptiveClasses(el, w, h, maxPortraitWidth) {
    if (!el || !w || !h) return;
    var ratio = w / h;
    el.classList.remove('is-landscape', 'is-portrait', 'is-square', 'aspect-video', 'aspect-square', 'aspect-[9/16]');
    if (ratio >= 1.15) {
      el.classList.add('is-landscape');
      el.style.aspectRatio = w + ' / ' + h;
      if (el.id === 'video-modal-frame') {
        el.style.maxHeight = '80vh';
      }
    } else if (ratio < 0.85) {
      el.classList.add('is-portrait');
      el.style.aspectRatio = w + ' / ' + h;
      if (maxPortraitWidth) el.style.maxWidth = maxPortraitWidth + 'px';
      el.style.maxHeight = '80vh';
    } else {
      el.classList.add('is-square');
      el.style.aspectRatio = w + ' / ' + h;
      el.style.maxHeight = '80vh';
    }
  }

  function applyModalContainerSize(box, w, h) {
    if (!box || !w || !h) return;
    var ratio = w / h;
    box.className = 'relative w-full mx-auto flex flex-col gap-2.5 transition-all duration-200 ';
    if (ratio >= 1.15) {
      box.className += 'max-w-4xl';
    } else if (ratio < 0.85) {
      box.className += 'max-w-[390px]';
    } else {
      box.className += 'max-w-[540px]';
    }
  }

  /* ---------- Adaptive Video Modal ---------- */
  window.openVideoModal = function (url, aspectHint, titleText, posterUrl) {
    if (!url) return;
    var modal = document.getElementById('video-modal');
    if (modal) modal.remove();

    var isMp4 = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.indexOf('/videos/') !== -1;
    var isShortUrl = url.indexOf('/shorts/') !== -1 || aspectHint === 'vertical';
    var embedUrl = toEmbedUrl(url);

    modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.className = 'fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6';

    var box = document.createElement('div');
    box.id = 'video-modal-box';
    box.className = 'relative w-full mx-auto flex flex-col gap-2.5 transition-all duration-200 ' +
      (isShortUrl ? 'max-w-[390px]' : 'max-w-4xl');

    // Clean top bar outside video area (never blocks video corners/subtitles)
    var topBar = document.createElement('div');
    topBar.className = 'flex items-center justify-between gap-3 px-1';
    var titleEl = document.createElement('div');
    titleEl.className = 'text-xs sm:text-sm font-bold text-white/95 truncate flex items-center gap-2';
    titleEl.innerHTML = '<i class="fas fa-circle-play text-indigo-400"></i><span></span>';
    titleEl.querySelector('span').textContent = titleText || 'Video Demo';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'w-9 h-9 shrink-0 rounded-full bg-white/10 hover:bg-rose-500 text-white grid place-items-center transition border border-white/15 cursor-pointer';
    closeBtn.setAttribute('aria-label', 'Đóng video');
    closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';

    topBar.appendChild(titleEl);
    topBar.appendChild(closeBtn);

    var frame = document.createElement('div');
    frame.id = 'video-modal-frame';
    frame.className = 'relative w-full rounded-2xl overflow-hidden bg-black border border-[#28235d] shadow-2xl flex items-center justify-center';
    frame.style.aspectRatio = isShortUrl ? '9 / 16' : '16 / 9';
    if (isShortUrl) frame.style.maxHeight = '82vh';

    if (isMp4) {
      var vid = document.createElement('video');
      vid.src = url;
      if (posterUrl) vid.poster = posterUrl;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.className = 'w-full h-full object-contain bg-black';
      frame.appendChild(vid);

      // Probe poster aspect immediately so modal opens at right size before MP4 header arrives
      if (posterUrl && aspectHint !== 'vertical' && aspectHint !== 'landscape') {
        var pre = new Image();
        pre.onload = function () {
          if (pre.naturalWidth && pre.naturalHeight) {
            applyModalContainerSize(box, pre.naturalWidth, pre.naturalHeight);
            applyAdaptiveClasses(frame, pre.naturalWidth, pre.naturalHeight);
          }
        };
        pre.src = posterUrl;
      }

      // Exact source of truth once MP4 metadata loads
      vid.addEventListener('loadedmetadata', function () {
        if (vid.videoWidth && vid.videoHeight) {
          applyModalContainerSize(box, vid.videoWidth, vid.videoHeight);
          applyAdaptiveClasses(frame, vid.videoWidth, vid.videoHeight);
        }
      });
    } else {
      var ifr = document.createElement('iframe');
      ifr.src = embedUrl;
      ifr.className = 'w-full h-full border-none';
      ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      ifr.setAttribute('allowfullscreen', '');
      frame.appendChild(ifr);
    }

    box.appendChild(topBar);
    box.appendChild(frame);
    modal.appendChild(box);
    document.body.appendChild(modal);

    function closeModal() {
      document.removeEventListener('keydown', onEsc);
      var v = modal.querySelector('video');
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { } }
      modal.remove();
    }
    function onEsc(ev) { if (ev.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', onEsc);
    closeBtn.onclick = closeModal;
    modal.onclick = function (e) { if (e.target === modal) closeModal(); };
  };

  /* ---------- Cart & Wishlist ---------- */
  function setCartBadge(n) {
    var b = document.getElementById('cart-badge');
    if (!b) return;
    b.textContent = n;
    b.classList.toggle('hidden', !n);
  }
  window.setCartBadge = setCartBadge;

  async function addToCart(productId, name, btn) {
    var original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
    try {
      var res = await axios.post('/api/cart/add', { product_id: Number(productId) });
      setCartBadge(res.data.count);
      if (res.data.owned) toast('Bạn đã sở hữu sản phẩm này rồi!', 'warning');
      else if (res.data.exists) toast('Sản phẩm đã có trong giỏ hàng', 'info');
      else toast('Đã thêm <b>' + (name || 'sản phẩm') + '</b> vào giỏ!', 'success');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast('Vui lòng đăng nhập để mua hàng', 'warning');
        setTimeout(function () { location.href = '/dang-nhap?next=' + encodeURIComponent(location.pathname); }, 900);
      } else {
        toast((err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra', 'error');
      }
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
  }
  window.addToCart = addToCart;

  /* ---------- Form AJAX helper ---------- */
  window.submitForm = async function (form, opts) {
    opts = opts || {};
    var btn = form.querySelector('[type=submit]');
    var orig = btn ? btn.innerHTML : '';
    var errBox = form.querySelector('.form-error');
    if (errBox) { errBox.classList.add('hidden'); errBox.textContent = ''; }
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang xử lý...'; }
    try {
      var data = Object.fromEntries(new FormData(form).entries());
      var res = await axios.post(form.action || opts.url, data);
      if (opts.onSuccess) opts.onSuccess(res.data);
      else if (res.data.redirect) location.href = res.data.redirect;
      else { toast(res.data.message || 'Thành công!', 'success'); if (opts.reload) location.reload(); }
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra, vui lòng thử lại';
      if (errBox) { errBox.textContent = msg; errBox.classList.remove('hidden'); }
      else toast(msg, 'error');
      if (opts.onError) opts.onError(err);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  };

  /* ---------- Active Nav Sync ---------- */
  function syncActiveLinks(urlObj) {
    var path = urlObj.pathname || '/';
    var qType = urlObj.searchParams.get('type') || '';
    var qSort = urlObj.searchParams.get('sort') || '';

    var activeSide = '';
    if (path === '/') activeSide = 'home';
    else if (path === '/san-pham' && !qType && !qSort) activeSide = 'all';
    else if (path === '/san-pham' && (qSort === 'bestseller' || qSort === 'hot')) activeSide = 'bestseller';
    else if ((path === '/san-pham' && qType === 'skill') || path === '/danh-muc/skill-video-ai') activeSide = 'skill';
    else if ((path === '/san-pham' && qType === 'course') || path === '/danh-muc/khoa-hoc-video-ai') activeSide = 'course';
    else if ((path === '/san-pham' && qType === 'chatbot') || path === '/danh-muc/chatbot-kich-ban') activeSide = 'chatbot';
    else if ((path === '/san-pham' && qType === 'app') || path === '/danh-muc/app-video-ai') activeSide = 'app';
    else if (path === '/combo' || qType === 'combo' || path === '/danh-muc/combo-tiet-kiem') activeSide = 'combo';
    else if (path === '/bang-gia') activeSide = 'pricing';
    else if (path.indexOf('/blog') === 0) activeSide = 'blog';
    else if (path === '/affiliate') activeSide = 'affiliate';
    else if (path === '/gioi-thieu') activeSide = 'about';
    else if (path === '/lien-he') activeSide = 'contact';

    document.querySelectorAll('#sidebar a[data-nav]').forEach(function (a) {
      var on = a.dataset.nav === activeSide;
      a.className = 'sidebar-menu-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ' +
        (on
          ? 'is-active text-white bg-indigo-500/15 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
          : 'text-[#b9b8d9] border border-transparent hover:text-white hover:bg-white/5');
    });

    var activeTop = '';
    if (path === '/') activeTop = 'home';
    else if (path.indexOf('/san-pham') === 0 || path.indexOf('/danh-muc') === 0) activeTop = 'products';
    else if (path === '/combo') activeTop = 'combo';
    else if (path === '/bang-gia') activeTop = 'pricing';
    else if (path.indexOf('/blog') === 0) activeTop = 'blog';
    else if (path === '/affiliate') activeTop = 'affiliate';
    else if (path === '/lien-he') activeTop = 'contact';

    document.querySelectorAll('#main-nav a[data-top-nav]').forEach(function (a) {
      var on = a.dataset.topNav === activeTop;
      a.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ' +
        (on ? 'is-active text-indigo-400 bg-indigo-500/10' : 'text-[#9f9dbb] hover:text-white hover:bg-white/5');
    });

    document.querySelectorAll('#mobile-nav a[data-mob-nav]').forEach(function (a) {
      var on = a.dataset.mobNav === activeTop;
      a.className = 'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ' +
        (on ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' : 'text-[#b9b8d9] hover:bg-white/5');
    });
  }

  /* ---------- PJAX + Prefetch Engine ---------- */
  var prefetchCache = new Map();
  var inflightPrefetch = new Map();
  var navAbort = null;
  var PREFETCH_TTL = 20000;

  function canPjaxUrl(rawUrl) {
    try {
      var u = new URL(rawUrl, location.origin);
      if (u.origin !== location.origin) return false;
      var p = u.pathname;
      if (p.indexOf('/admin') === 0 || p.indexOf('/api/') === 0 || p.indexOf('/static/') === 0 ||
          p.indexOf('/tai-xuong/') === 0 || p.indexOf('/videos/') === 0 || p === '/dang-xuat') {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function fetchHtml(url, signal) {
    var cached = prefetchCache.get(url);
    if (cached && (Date.now() - cached.ts < PREFETCH_TTL)) {
      return Promise.resolve(cached);
    }
    return fetch(url, {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'pjax' },
      signal: signal
    }).then(function (res) {
      var ct = res.headers.get('content-type') || '';
      if (!res.ok || ct.indexOf('text/html') === -1) {
        return { fallbackUrl: res.url || url };
      }
      return res.text().then(function (html) {
        var entry = { html: html, finalUrl: res.url || url, ts: Date.now() };
        if (prefetchCache.size > 24) prefetchCache.clear();
        prefetchCache.set(url, entry);
        return entry;
      });
    });
  }

  function prefetchUrl(url) {
    if (!canPjaxUrl(url)) return;
    if (navigator.connection && navigator.connection.saveData) return;
    var cached = prefetchCache.get(url);
    if ((cached && (Date.now() - cached.ts < PREFETCH_TTL)) || inflightPrefetch.has(url)) return;
    var p = fetchHtml(url).catch(function () { }).finally(function () {
      inflightPrefetch.delete(url);
    });
    inflightPrefetch.set(url, p);
  }

  function executeInlineScripts(container) {
    container.querySelectorAll('script').forEach(function (oldScript) {
      if (oldScript.src) return;
      var s = document.createElement('script');
      s.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(s, oldScript);
    });
  }

  async function pjaxNavigate(rawUrl, opts) {
    opts = opts || {};
    var u = new URL(rawUrl, location.origin);
    var fullUrl = u.pathname + u.search;

    if (!canPjaxUrl(u.href)) {
      location.href = u.href;
      return;
    }

    // Close mobile nav & sidebar hover overlay immediately on navigation
    var mobNav = document.getElementById('mobile-nav');
    var mobBtn = document.getElementById('mobile-menu-btn');
    if (mobNav && !mobNav.classList.contains('hidden')) {
      mobNav.classList.add('hidden');
      if (mobBtn && mobBtn.querySelector('i')) mobBtn.querySelector('i').className = 'fas fa-bars';
    }
    var sb = document.getElementById('sidebar');
    var bd = document.getElementById('sidebar-backdrop');
    if (sb) {
      sb.classList.remove('sb-hover-open', 'sb-mobile-open');
      if (bd) bd.classList.add('hidden');
    }

    // Instant visual feedback
    syncActiveLinks(u);
    progressStart();

    if (navAbort) { try { navAbort.abort(); } catch (e) { } }
    navAbort = new AbortController();

    try {
      var res = await fetchHtml(fullUrl, navAbort.signal);
      if (!res || res.fallbackUrl || !res.html) {
        location.href = (res && res.fallbackUrl) || u.href;
        return;
      }

      var parser = new DOMParser();
      var doc = parser.parseFromString(res.html, 'text/html');
      var newMain = doc.getElementById('main-content');
      var curMain = document.getElementById('main-content');
      if (!newMain || !curMain) {
        location.href = u.href;
        return;
      }

      // Sync final redirected URL (e.g. auth redirect to /dang-nhap)
      var finalUrl = res.finalUrl ? new URL(res.finalUrl, location.origin) : u;
      if (finalUrl.pathname !== u.pathname && !canPjaxUrl(finalUrl.href)) {
        location.href = finalUrl.href;
        return;
      }

      runCleanups();
      curMain.innerHTML = newMain.innerHTML;
      document.title = doc.title || document.title;

      // Sync cart badge from server HTML
      var newBadge = doc.getElementById('cart-badge');
      if (newBadge) {
        setCartBadge(Number(newBadge.textContent) || 0);
      }

      var destHref = finalUrl.pathname + finalUrl.search + u.hash;
      if (!opts.replace && opts.push !== false) {
        history.pushState({ pjax: true }, '', destHref);
      } else if (opts.replace) {
        history.replaceState({ pjax: true }, '', destHref);
      }

      syncActiveLinks(finalUrl);
      executeInlineScripts(curMain);
      reinitPage();

      if (u.hash) {
        var targetEl = document.getElementById(u.hash.slice(1));
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      } else if (!opts.preserveScroll) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      progressDone();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      progressDone();
      location.href = u.href;
    }
  }
  window.pjaxNavigate = pjaxNavigate;

  /* ---------- Per-Page Initializers (Run on load & PJAX swap) ---------- */
  function reinitMediaFrames() {
    // 1. Product Cards (auto-detect vertical posters cleanly inside aspect-video container)
    document.querySelectorAll('.product-card-img').forEach(function (img) {
      function fit() {
        if (!img.naturalWidth || !img.naturalHeight) return;
        var wrap = img.closest('.product-card-media');
        var amb = wrap ? wrap.querySelector('.product-card-ambient') : null;
        if (img.naturalHeight > img.naturalWidth * 1.05) {
          img.classList.remove('object-cover');
          img.classList.add('object-contain');
          if (amb) amb.classList.remove('opacity-0'), amb.classList.add('opacity-45');
        } else {
          img.classList.remove('object-contain');
          img.classList.add('object-cover');
          if (amb) amb.classList.add('opacity-0'), amb.classList.remove('opacity-45');
        }
      }
      if (img.complete) fit();
      else img.addEventListener('load', fit, { once: true });
    });

    // 2. Product Detail Adaptive Player & Thumb
    document.querySelectorAll('.adaptive-player-wrapper').forEach(function (wrap) {
      var poster = wrap.dataset.poster;
      var url = wrap.dataset.url || '';
      var vid = wrap.querySelector('video');
      if (url.indexOf('/shorts/') !== -1) {
        applyAdaptiveClasses(wrap, 9, 16, 370);
      } else if (poster) {
        var pre = new Image();
        pre.onload = function () {
          if (pre.naturalWidth && pre.naturalHeight) {
            applyAdaptiveClasses(wrap, pre.naturalWidth, pre.naturalHeight, 370);
          }
        };
        pre.src = poster;
      }
      if (vid) {
        var syncVid = function () {
          if (vid.videoWidth && vid.videoHeight) {
            applyAdaptiveClasses(wrap, vid.videoWidth, vid.videoHeight, 370);
          }
        };
        if (vid.readyState >= 1) syncVid();
        vid.addEventListener('loadedmetadata', syncVid);
      }
    });

    document.querySelectorAll('.adaptive-thumb-wrapper').forEach(function (wrap) {
      var img = wrap.querySelector('img');
      if (!img) return;
      var fitThumb = function () {
        if (img.naturalWidth && img.naturalHeight) {
          applyAdaptiveClasses(wrap, img.naturalWidth, img.naturalHeight, 370);
        }
      };
      if (img.complete) fitThumb();
      else img.addEventListener('load', fitThumb, { once: true });
    });

    // 3. Activate Reviews Tab automatically if URL has #reviews
    if (location.hash === '#reviews') {
      var revBtn = document.querySelector('.tab-btn[data-tab="rev"][data-group="pd"]');
      if (revBtn) revBtn.click();
    }
  }

  function initHeroShowcase() {
    var stage = document.getElementById('heroStage');
    var frontPhone = document.getElementById('heroFrontPhone');
    var leftPhone = document.getElementById('heroLeftPhone');
    var rightPhone = document.getElementById('heroRightPhone');
    var leftImg = document.getElementById('heroLeftImg');
    var rightImg = document.getElementById('heroRightImg');
    var frontVideo = document.getElementById('heroFrontVideo');
    var frontAmbient = document.getElementById('heroFrontAmbient');
    if (!stage || !frontPhone || !frontVideo) return;

    var R2_BASE = 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev';
    var HERO_VIDEOS = [
      {
        title: 'Skill Muse AI Pro 30s',
        handle: '@museai.skill',
        caption: 'Bộ Skill AI làm video 30s chuẩn viral từ prompt đến clip hoàn chỉnh #MuseAI #AIVideo #SkillAI',
        music: '♫ KhoSkill AI - Muse AI Sound',
        platform: 'tiktok',
        orient: 'landscape',
        likes: '142.8K', comments: '2.5K', saves: '18.4K', shares: '3.9K',
        videoUrl: R2_BASE + '/videos/demo-khoa-hoc-muse-ai.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-khoa-hoc-muse-ai.jpg',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=museai1'
      },
      {
        title: 'Skill Seedance 2.5 · 30s',
        handle: '@seedance.pro',
        caption: 'One-take 30 giây nhân vật giữ nguyên & âm thanh native trên Seedance 2.5 #Seedance25 #BuildPage',
        music: '♫ Seedance Official - Trending Beat',
        platform: 'reels',
        orient: 'portrait',
        likes: '189.2K', comments: '3.2K', saves: '24.6K', shares: '6.8K',
        videoUrl: R2_BASE + '/videos/demo-khoa-hoc-seedance.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-khoa-hoc-seedance.jpg',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=seedance'
      },
      {
        title: 'Skill Thuỷ Sinh 30s',
        handle: '@thuysinh.ai',
        caption: 'Công thức dựng video thuỷ sinh AI mượt mà build page Reels triệu view #ThuySinh #AIReels',
        music: '♫ Zen Water Studio - Lo-Fi Ambient',
        platform: 'instagram',
        orient: 'landscape',
        likes: '98.5K', comments: '1.1K', saves: '14.2K', shares: '2.8K',
        videoUrl: R2_BASE + '/videos/demo-skill-thuy-sinh.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-skill-thuy-sinh.jpg',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aquatic'
      },
      {
        title: 'Skill Làm Vườn DIY 30s',
        handle: '@lamvuondiy.ai',
        caption: 'Kịch bản làm vườn DIY 30s cuốn hút từng khung hình #LamVuon #DIY #SkillAI',
        music: '♫ Morning Garden - Acoustic Warm',
        platform: 'tiktok',
        orient: 'landscape',
        likes: '115.6K', comments: '1.8K', saves: '19.3K', shares: '4.1K',
        videoUrl: R2_BASE + '/videos/demo-skill-lam-vuon.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-skill-lam-vuon.jpg',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=garden'
      },
      {
        title: 'Skill Affiliate Fitness 30s',
        handle: '@fitness.affiliate',
        caption: 'Skill dựng video Fitness chốt đơn Affiliate TikTok Shop chuyển đổi cao #FitnessAI #Affiliate',
        music: '♫ Fitness Power - EDM Tempo',
        platform: 'reels',
        orient: 'landscape',
        likes: '214.0K', comments: '4.9K', saves: '32.1K', shares: '9.4K',
        videoUrl: R2_BASE + '/videos/demo-skill-fitness.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-skill-fitness.jpg',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=fitness'
      }
    ];

    var currentIndex = 0;
    var isMuted = true;
    var soundBtn = document.getElementById('heroSoundBtn');
    var soundText = document.getElementById('heroSoundText');
    var playBtn = document.getElementById('heroPlayCenterBtn');
    var playIcon = document.getElementById('heroPlayCenterIcon');
    var progTrack = document.getElementById('heroProgressTrack');
    var progFill = document.getElementById('heroProgressFill');
    var guiOverlay = document.getElementById('shortGuiOverlay');

    function setHeroOrientation(orient) {
      var isLand = orient !== 'portrait';
      stage.classList.toggle('frame-landscape', isLand);
      stage.classList.toggle('frame-portrait', !isLand);
      frontPhone.classList.toggle('frame-landscape', isLand);
      frontPhone.classList.toggle('frame-portrait', !isLand);
    }

    function updateGui(v) {
      var hEl = document.getElementById('shortAuthorHandle');
      var cEl = document.getElementById('shortCaption');
      var mEl = document.getElementById('shortMusicTitle');
      var aEl = document.getElementById('shortAvatarImg');
      var lEl = document.getElementById('shortLikeCount');
      var cmEl = document.getElementById('shortCommentCount');
      var svEl = document.getElementById('shortSaveCount');
      var shEl = document.getElementById('shortShareCount');
      if (guiOverlay) guiOverlay.setAttribute('data-platform', v.platform);
      if (hEl) hEl.textContent = v.handle;
      if (cEl) cEl.textContent = v.caption;
      if (mEl) mEl.textContent = v.music;
      if (aEl) aEl.src = v.avatar;
      if (lEl) lEl.textContent = v.likes;
      if (cmEl) cmEl.textContent = v.comments;
      if (svEl) svEl.textContent = v.saves;
      if (shEl) shEl.textContent = v.shares;
    }

    function applyHeroIndex(idx, instant) {
      currentIndex = (idx + HERO_VIDEOS.length) % HERO_VIDEOS.length;
      var vFront = HERO_VIDEOS[currentIndex];
      var vRight = HERO_VIDEOS[(currentIndex + 1) % HERO_VIDEOS.length];
      var vLeft = HERO_VIDEOS[(currentIndex - 1 + HERO_VIDEOS.length) % HERO_VIDEOS.length];

      setHeroOrientation(vFront.orient);
      if (frontAmbient) frontAmbient.style.backgroundImage = "url('" + vFront.posterUrl + "')";
      if (leftImg) { leftImg.src = vLeft.posterUrl; leftImg.alt = vLeft.title; }
      if (rightImg) { rightImg.src = vRight.posterUrl; rightImg.alt = vRight.title; }

      if (!instant) {
        frontPhone.style.opacity = '0.78';
        setTimeout(function () { frontPhone.style.opacity = '1'; }, 120);
      }

      frontVideo.pause();
      frontVideo.poster = vFront.posterUrl;
      frontVideo.src = vFront.videoUrl;
      frontVideo.muted = isMuted;
      frontVideo.play().catch(function () { });
      updateGui(vFront);
      if (playIcon) playIcon.className = 'fas fa-pause text-white';
    }

    frontVideo.addEventListener('loadedmetadata', function () {
      if (frontVideo.videoWidth && frontVideo.videoHeight) {
        setHeroOrientation(frontVideo.videoWidth >= frontVideo.videoHeight ? 'landscape' : 'portrait');
      }
    });

    frontVideo.addEventListener('timeupdate', function () {
      if (frontVideo.duration && progFill) {
        progFill.style.width = ((frontVideo.currentTime / frontVideo.duration) * 100) + '%';
      }
    });

    if (playBtn) {
      playBtn.onclick = function (e) {
        e.stopPropagation();
        if (frontVideo.paused) {
          frontVideo.play().catch(function () { });
          if (playIcon) playIcon.className = 'fas fa-pause text-white';
        } else {
          frontVideo.pause();
          if (playIcon) playIcon.className = 'fas fa-play text-white ml-0.5';
        }
      };
    }

    frontVideo.onclick = function () { if (playBtn) playBtn.click(); };

    if (soundBtn) {
      soundBtn.onclick = function (e) {
        e.stopPropagation();
        isMuted = !isMuted;
        frontVideo.muted = isMuted;
        soundBtn.classList.toggle('is-unmuted', !isMuted);
        var ic = soundBtn.querySelector('i');
        if (ic) ic.className = 'fas ' + (isMuted ? 'fa-volume-xmark' : 'fa-volume-high') + ' mr-1';
        if (soundText) soundText.textContent = isMuted ? 'Bật tiếng' : 'Đang bật tiếng';
      };
    }

    if (progTrack) {
      progTrack.onclick = function (e) {
        e.stopPropagation();
        if (!frontVideo.duration) return;
        var rect = progTrack.getBoundingClientRect();
        frontVideo.currentTime = ((e.clientX - rect.left) / rect.width) * frontVideo.duration;
      };
    }

    var prevBtn = document.getElementById('heroPrevPhoneBtn');
    var nextBtn = document.getElementById('heroNextPhoneBtn');
    if (prevBtn) prevBtn.onclick = function (e) { e.stopPropagation(); applyHeroIndex(currentIndex - 1); };
    if (nextBtn) nextBtn.onclick = function (e) { e.stopPropagation(); applyHeroIndex(currentIndex + 1); };
    if (leftPhone) leftPhone.onclick = function () { applyHeroIndex(currentIndex - 1); };
    if (rightPhone) rightPhone.onclick = function () { applyHeroIndex(currentIndex + 1); };

    var likeBtn = document.getElementById('shortLikeBtn');
    if (likeBtn) likeBtn.onclick = function (e) { e.stopPropagation(); likeBtn.classList.toggle('liked'); };
    var saveBtn = document.getElementById('shortSaveBtn');
    if (saveBtn) saveBtn.onclick = function (e) { e.stopPropagation(); saveBtn.classList.toggle('saved'); };
    var followPill = document.getElementById('shortFollowPill');
    var followPlus = document.getElementById('shortFollowPlus');
    if (followPill) followPill.onclick = function (e) { e.stopPropagation(); followPill.textContent = followPill.textContent === 'Theo dõi' ? 'Đã follow ✓' : 'Theo dõi'; };
    if (followPlus) followPlus.onclick = function (e) { e.stopPropagation(); followPlus.style.display = 'none'; toast('Đã theo dõi kênh!', 'success'); };
    var shareBtn = document.getElementById('shortShareBtn');
    if (shareBtn) {
      shareBtn.onclick = function (e) {
        e.stopPropagation();
        if (navigator.share) navigator.share({ title: 'KhoSkill AI', url: location.href }).catch(function () { });
        else { navigator.clipboard.writeText(location.href).catch(function () { }); toast('Đã sao chép link video!', 'success'); }
      };
    }

    setHeroOrientation('landscape');

    registerCleanup(function () {
      try { frontVideo.pause(); } catch (e) { }
    });
  }

  function initVideoWall() {
    var cards = document.querySelectorAll('.wall-card');
    if (!cards.length) return;
    var canHoverPreview = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    cards.forEach(function (card) {
      var hoverVid = null;
      var hoverDelay = null;

      if (canHoverPreview) {
        card.addEventListener('mouseenter', function () {
          hoverDelay = setTimeout(function () {
            if (hoverVid || !card.dataset.src) return;
            hoverVid = document.createElement('video');
            hoverVid.src = card.dataset.src;
            hoverVid.muted = true;
            hoverVid.loop = true;
            hoverVid.playsInline = true;
            hoverVid.className = 'absolute inset-0 w-full h-full object-cover z-[1]';
            card.insertBefore(hoverVid, card.firstChild);
            hoverVid.play().catch(function () { });
          }, 180);
        });
        card.addEventListener('mouseleave', function () {
          clearTimeout(hoverDelay);
          if (hoverVid) {
            try { hoverVid.pause(); hoverVid.removeAttribute('src'); hoverVid.load(); hoverVid.remove(); } catch (e) { }
            hoverVid = null;
          }
        });
      }

      card.addEventListener('click', function () {
        var aspectHint = card.dataset.orient === 'portrait' ? 'vertical' : 'landscape';
        openVideoModal(card.dataset.src, aspectHint, card.dataset.title, card.dataset.poster);
      });
    });
  }

  function initTheater() {
    var theaterPlaylistEl = document.getElementById('theaterPlaylist');
    var theaterVid = document.getElementById('theaterVideoElement');
    var cinemaBox = document.getElementById('cinemaScreenBox');
    if (!theaterPlaylistEl || !theaterVid || !cinemaBox) return;

    var R2_BASE = 'https://pub-f4217cb984184329a6951a68b9bd0b7c.r2.dev';
    var THEATER_PLAYLIST = [
      {
        title: 'Skill Video Muse AI Pro — Từ Prompt Đến Video 10s Chuẩn Viral',
        tag: 'Skill AI', dur: '0:30',
        desc: 'Bộ Skill làm video AI bằng Muse AI từ A-Z: công thức prompt khóa nhân vật, render clip 10s lip-sync tiếng Việt tự nhiên.',
        videoUrl: R2_BASE + '/videos/demo-khoa-hoc-muse-ai.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-khoa-hoc-muse-ai.jpg',
        slug: 'khoa-hoc-video-muse-ai', price: '599.000đ', origPrice: '1.299.000đ'
      },
      {
        title: 'Skill Video Seedance 2.5 — One-Take 30s Build Page',
        tag: 'Skill AI', dur: '0:30',
        desc: 'Bộ Skill làm chủ Seedance 2.5: quay one-take 30 giây nhân vật giữ nguyên, âm thanh native — build page Reels/TikTok.',
        videoUrl: R2_BASE + '/videos/demo-khoa-hoc-seedance.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-khoa-hoc-seedance.jpg',
        slug: 'khoa-hoc-video-seedance-25-30s', price: '699.000đ', origPrice: '1.399.000đ'
      },
      {
        title: 'Skill Video Thuỷ Sinh 30s — Build Page Reels',
        tag: 'Skill AI', dur: '0:15',
        desc: 'Bộ skill làm video thuỷ sinh 30s: prompt, quy trình render và checklist đăng bài để build page Reels ngách thuỷ sinh.',
        videoUrl: R2_BASE + '/videos/demo-skill-thuy-sinh.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-skill-thuy-sinh.jpg',
        slug: 'skill-video-thuy-sinh-30s', price: '399.000đ', origPrice: '799.000đ'
      },
      {
        title: 'Skill Video DIY Làm Vườn 30s — Build Page Reels',
        tag: 'Skill AI', dur: '0:25',
        desc: 'Skill làm video DIY làm vườn 30s: công thức cảnh quay, prompt mẫu và lịch đăng để build page Reels ngách làm vườn.',
        videoUrl: R2_BASE + '/videos/demo-skill-lam-vuon.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-skill-lam-vuon.jpg',
        slug: 'skill-video-diy-lam-vuon-30s', price: '399.000đ', origPrice: '799.000đ'
      },
      {
        title: 'Skill Video Affiliate Fitness — Video 30s Chốt Đơn',
        tag: 'Skill AI', dur: '0:20',
        desc: 'Skill làm video fitness 30s bán hàng affiliate: kịch bản chuyển đổi cao, prompt và quy trình edit tay chi tiết.',
        videoUrl: R2_BASE + '/videos/demo-skill-fitness.mp4',
        posterUrl: R2_BASE + '/videos/posters/poster-skill-fitness.jpg',
        slug: 'skill-video-affiliate-fitness', price: '449.000đ', origPrice: '899.000đ'
      }
    ];

    var playBtn = document.getElementById('theaterPlayBtn');
    var playIcon = document.getElementById('theaterPlayIcon');
    var bigPlayBtn = document.getElementById('theaterBigPlayBtn');
    var progTrack = document.getElementById('theaterProgressTrack');
    var progFill = document.getElementById('theaterProgressFill');
    var timeEl = document.getElementById('theaterTimecode');
    var soundBtn = document.getElementById('theaterSoundBtn');
    var soundIcon = document.getElementById('theaterSoundIcon');
    var fsBtn = document.getElementById('theaterFullscreenBtn');
    var ambBg = document.getElementById('theaterAmbientBg');

    function fmtT(s) {
      s = Math.floor(s || 0);
      return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    function togglePlay() {
      if (theaterVid.paused) theaterVid.play().catch(function () { });
      else theaterVid.pause();
    }

    theaterVid.onplay = function () {
      cinemaBox.classList.add('is-playing');
      if (playIcon) playIcon.className = 'fas fa-pause';
    };
    theaterVid.onpause = function () {
      cinemaBox.classList.remove('is-playing');
      if (playIcon) playIcon.className = 'fas fa-play';
    };
    theaterVid.ontimeupdate = function () {
      if (theaterVid.duration && progFill) {
        progFill.style.width = ((theaterVid.currentTime / theaterVid.duration) * 100) + '%';
        if (timeEl) timeEl.textContent = fmtT(theaterVid.currentTime) + ' / ' + fmtT(theaterVid.duration);
      }
    };

    if (bigPlayBtn) bigPlayBtn.onclick = togglePlay;
    if (playBtn) playBtn.onclick = togglePlay;
    theaterVid.onclick = togglePlay;

    if (soundBtn) {
      soundBtn.onclick = function () {
        theaterVid.muted = !theaterVid.muted;
        if (soundIcon) soundIcon.className = 'fas ' + (theaterVid.muted ? 'fa-volume-xmark' : 'fa-volume-high');
      };
    }
    if (fsBtn) {
      fsBtn.onclick = function () {
        var f = document.getElementById('theaterPlayerFrame');
        if (f && f.requestFullscreen) f.requestFullscreen().catch(function () { });
      };
    }
    if (progTrack) {
      progTrack.onclick = function (e) {
        if (!theaterVid.duration) return;
        var rect = progTrack.getBoundingClientRect();
        theaterVid.currentTime = ((e.clientX - rect.left) / rect.width) * theaterVid.duration;
      };
    }

    var pItems = theaterPlaylistEl.querySelectorAll('.playlist-item');
    pItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = Number(item.dataset.index || 0);
        var d = THEATER_PLAYLIST[idx];
        if (!d) return;

        pItems.forEach(function (x) { x.classList.remove('active'); });
        item.classList.add('active');

        if (ambBg) ambBg.style.backgroundImage = "url('" + d.posterUrl + "')";
        theaterVid.poster = d.posterUrl;
        theaterVid.src = d.videoUrl;
        theaterVid.play().catch(function () { });

        var tagEl = document.getElementById('activeVideoTag');
        var durEl = document.getElementById('activeVideoDur');
        var titEl = document.getElementById('activeVideoTitle');
        var dscEl = document.getElementById('activeVideoDesc');
        var prcEl = document.getElementById('activeVideoPrice');
        var orgEl = document.getElementById('activeVideoOrigPrice');
        var lnkEl = document.getElementById('activeVideoLink');
        if (tagEl) tagEl.textContent = d.tag;
        if (durEl) durEl.textContent = 'Thời lượng: ' + d.dur;
        if (titEl) titEl.textContent = d.title;
        if (dscEl) dscEl.textContent = d.desc;
        if (prcEl) prcEl.textContent = d.price;
        if (orgEl) orgEl.textContent = d.origPrice;
        if (lnkEl) lnkEl.href = '/san-pham/' + d.slug;
      });
    });

    registerCleanup(function () {
      try { theaterVid.pause(); } catch (e) { }
    });
  }

  function initRevealAndTimers() {
    var reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
          });
        }, { threshold: 0.04, rootMargin: '80px 0px' });
        reveals.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 1.15) el.classList.add('in');
          else io.observe(el);
        });
        registerCleanup(function () { io.disconnect(); });
      } else {
        reveals.forEach(function (el) { el.classList.add('in'); });
      }
    }

    document.querySelectorAll('form[data-ajax]').forEach(function (form) {
      if (form.dataset.boundAjax) return;
      form.dataset.boundAjax = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        window.submitForm(form, { reload: form.dataset.reload === 'true' });
      });
    });

    document.querySelectorAll('[data-auto-submit]').forEach(function (el) {
      if (el.dataset.boundAuto) return;
      el.dataset.boundAuto = '1';
      el.addEventListener('change', function () {
        if (!el.form) return;
        var act = el.form.getAttribute('action') || location.pathname;
        if ((el.form.method || 'get').toLowerCase() === 'get' && canPjaxUrl(act)) {
          var params = new URLSearchParams(new FormData(el.form));
          pjaxNavigate(act + '?' + params.toString());
        } else {
          el.form.submit();
        }
      });
    });

    document.querySelectorAll('[data-countdown]').forEach(function (el) {
      var end = new Date(el.dataset.countdown).getTime();
      var timerId = null;
      function tick() {
        var d = end - Date.now();
        if (d <= 0) { el.textContent = 'Đã kết thúc'; return; }
        var h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1000);
        var dd = Math.floor(h / 24);
        el.innerHTML = (dd > 0 ? dd + 'n ' : '') + String(h % 24).padStart(2, '0') + ':' +
          String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        timerId = setTimeout(tick, 1000);
      }
      tick();
      registerCleanup(function () { clearTimeout(timerId); });
    });
  }

  function reinitPage() {
    reinitMediaFrames();
    initHeroShowcase();
    initVideoWall();
    initTheater();
    initRevealAndTimers();
  }

  /* ---------- Global Document Listeners (Initialized Once) ---------- */
  document.addEventListener('click', function (e) {
    // Dropdown & Mobile Menu
    var userBtn = e.target.closest('#user-menu-btn');
    var dd = document.getElementById('user-dropdown');
    if (userBtn && dd) { dd.classList.toggle('hidden'); return; }
    if (dd && !e.target.closest('#user-menu-wrap')) dd.classList.add('hidden');

    var mobBtn = e.target.closest('#mobile-menu-btn');
    if (mobBtn) {
      var n = document.getElementById('mobile-nav');
      if (n) {
        n.classList.toggle('hidden');
        var ic = mobBtn.querySelector('i');
        if (ic) ic.className = n.classList.contains('hidden') ? 'fas fa-bars' : 'fas fa-xmark';
      }
      return;
    }

    // Video Demo trigger
    var vidBtn = e.target.closest('[data-video]');
    if (vidBtn && vidBtn.dataset.video) {
      e.preventDefault();
      e.stopPropagation();
      openVideoModal(
        vidBtn.dataset.video,
        vidBtn.dataset.aspect || 'auto',
        vidBtn.dataset.title || '',
        vidBtn.dataset.poster || ''
      );
      return;
    }

    // Cart & Wishlist actions
    var addBtn = e.target.closest('.btn-add-cart');
    if (addBtn) { e.preventDefault(); addToCart(addBtn.dataset.id, addBtn.dataset.name, addBtn); return; }

    var rmBtn = e.target.closest('.btn-remove-cart');
    if (rmBtn) {
      e.preventDefault();
      axios.post('/api/cart/remove', { product_id: Number(rmBtn.dataset.id) })
        .then(function () { pjaxNavigate(location.href, { replace: true, preserveScroll: true }); })
        .catch(function () { toast('Không thể xoá', 'error'); });
      return;
    }

    var wishBtn = e.target.closest('.btn-wishlist');
    if (wishBtn) {
      e.preventDefault();
      axios.post('/api/wishlist/toggle', { product_id: Number(wishBtn.dataset.id) })
        .then(function (r) {
          var on = r.data.added;
          var icon = wishBtn.querySelector('i');
          if (icon) icon.className = (on ? 'fas' : 'far') + ' fa-heart';
          wishBtn.classList.toggle('text-rose-500', on);
          toast(on ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích', 'success');
        })
        .catch(function (err) {
          if (err.response && err.response.status === 401) {
            toast('Vui lòng đăng nhập', 'warning');
            setTimeout(function () { location.href = '/dang-nhap'; }, 800);
          }
        });
      return;
    }

    var buyBtn = e.target.closest('.btn-buy-now');
    if (buyBtn) {
      e.preventDefault();
      var o = buyBtn.innerHTML;
      buyBtn.disabled = true; buyBtn.innerHTML = '<span class="spinner"></span> Đang xử lý...';
      axios.post('/api/cart/add', { product_id: Number(buyBtn.dataset.id) })
        .then(function () { pjaxNavigate('/thanh-toan'); })
        .catch(function (err) {
          buyBtn.disabled = false; buyBtn.innerHTML = o;
          if (err.response && err.response.status === 401) {
            toast('Vui lòng đăng nhập để mua hàng', 'warning');
            setTimeout(function () { location.href = '/dang-nhap?next=' + encodeURIComponent(location.pathname); }, 900);
          } else toast((err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra', 'error');
        });
      return;
    }

    // Copy to clipboard
    var cpBtn = e.target.closest('[data-copy]');
    if (cpBtn) {
      e.preventDefault();
      navigator.clipboard.writeText(cpBtn.dataset.copy).then(function () {
        toast('Đã sao chép!', 'success');
        var i = cpBtn.querySelector('i');
        if (i) { var old = i.className; i.className = 'fas fa-check'; setTimeout(function () { i.className = old; }, 1500); }
      }).catch(function () { toast('Không thể sao chép', 'error'); });
      return;
    }

    // Smooth Tabs
    var tabBtn = e.target.closest('.tab-btn');
    if (tabBtn) {
      e.preventDefault();
      var group = tabBtn.dataset.group || 'default';
      document.querySelectorAll('.tab-btn[data-group="' + group + '"]').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel[data-group="' + group + '"]').forEach(function (p) { p.classList.add('hidden'); });
      tabBtn.classList.add('active');
      var panel = document.querySelector('.tab-panel[data-tab="' + tabBtn.dataset.tab + '"][data-group="' + group + '"]');
      if (panel) panel.classList.remove('hidden');
      return;
    }

    // FAQ accordion
    var faq = e.target.closest('.faq-q');
    if (faq) {
      var item = faq.parentElement;
      var body = item.querySelector('.faq-a');
      var icon = faq.querySelector('.faq-icon');
      var open = !body.classList.contains('hidden');
      body.classList.toggle('hidden', open);
      if (icon) icon.style.transform = open ? '' : 'rotate(45deg)';
      return;
    }

    // PJAX internal link interception
    var a = e.target.closest('a[href]');
    if (a) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0 ||
          href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (!canPjaxUrl(a.href)) return;
      // Same-page hash link
      var targetUrl = new URL(a.href, location.origin);
      if (targetUrl.pathname === location.pathname && targetUrl.search === location.search && targetUrl.hash) {
        if (targetUrl.hash === '#reviews') {
          var rb = document.querySelector('.tab-btn[data-tab="rev"][data-group="pd"]');
          if (rb) rb.click();
        }
        return;
      }
      e.preventDefault();
      pjaxNavigate(a.href);
    }
  });

  // PJAX hover / touchstart prefetch
  var hoverPrefetchTimer = null;
  document.addEventListener('pointerenter', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    var a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    if (!canPjaxUrl(a.href)) return;
    clearTimeout(hoverPrefetchTimer);
    hoverPrefetchTimer = setTimeout(function () { prefetchUrl(a.href); }, 35);
  }, true);

  document.addEventListener('touchstart', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    var a = e.target.closest('a[href]');
    if (a && a.target !== '_blank' && canPjaxUrl(a.href)) prefetchUrl(a.href);
  }, { passive: true });

  // Intercept GET forms (search, product filter form, blog search)
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.hasAttribute('data-ajax')) return;
    if ((form.method || 'get').toLowerCase() !== 'get') return;
    var action = form.getAttribute('action') || location.pathname;
    if (!canPjaxUrl(action)) return;
    e.preventDefault();
    var params = new URLSearchParams(new FormData(form));
    pjaxNavigate(action + (params.toString() ? '?' + params.toString() : ''));
  });

  window.addEventListener('popstate', function () {
    if (canPjaxUrl(location.href)) {
      pjaxNavigate(location.href, { push: false });
    }
  });

  // Back to top button scroll visibility
  var topBtn = document.getElementById('back-to-top');
  if (topBtn) {
    topBtn.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 500;
      topBtn.style.opacity = show ? '1' : '0';
      topBtn.style.pointerEvents = show ? 'auto' : 'none';
    }, { passive: true });
  }

  /* ---------- Boot ---------- */
  initSidebar();
  reinitPage();
})();
