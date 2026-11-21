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
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.className = 'toast bg-[#0f0e26] rounded-xl shadow-2xl border ' + pair[2] + ' px-4 py-3 flex items-start gap-3';
    el.innerHTML = '<i class="fas ' + pair[0] + ' ' + pair[1] + ' mt-0.5" aria-hidden="true"></i>' +
      '<div class="text-sm text-[#e2e1f5] flex-1 leading-snug">' + msg + '</div>' +
      '<button type="button" aria-label="Đóng thông báo" class="text-[#9492b8] hover:text-white transition"><i class="fas fa-xmark text-xs" aria-hidden="true"></i></button>';
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
    if (url.indexOf('drive.google.com/file/d/') !== -1) {
      var m4 = url.match(/\/file\/d\/([^/?#]+)/);
      if (m4) return 'https://drive.google.com/file/d/' + m4[1] + '/preview';
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

  /* ---------- Adaptive Video Modal (Supports Single & Multi-Video 16:9 + 9:16 Switcher) ---------- */
  window.openVideoModal = function (url, aspectHint, titleText, posterUrl, videosJson) {
    if (!url) return;
    if (typeof window.__pauseAllCardHoverVideos === 'function') window.__pauseAllCardHoverVideos();
    var prevFocus = document.activeElement;
    var modal = document.getElementById('video-modal');
    if (modal) modal.remove();

    var videoList = [];
    if (videosJson) {
      try {
        var parsed = typeof videosJson === 'string' ? JSON.parse(videosJson) : videosJson;
        if (Array.isArray(parsed)) videoList = parsed.filter(function (x) { return x && x.url; });
      } catch (e) {}
    }

    var isMp4 = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.indexOf('/videos/') !== -1;
    var isShortUrl = url.indexOf('/shorts/') !== -1 || aspectHint === 'vertical' || aspectHint === '9:16';
    var embedUrl = toEmbedUrl(url);

    modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', titleText || 'Video Demo');
    modal.className = 'fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6';

    var box = document.createElement('div');
    box.id = 'video-modal-box';
    box.className = 'relative w-full mx-auto flex flex-col gap-2.5 transition-all duration-200 ' +
      (videoList.length >= 2 ? 'max-w-3xl' : (isShortUrl ? 'max-w-[390px]' : 'max-w-4xl'));

    // Clean top bar outside video area (never blocks video corners/subtitles)
    var topBar = document.createElement('div');
    topBar.className = 'flex items-center justify-between gap-3 px-1';
    var titleEl = document.createElement('div');
    titleEl.className = 'text-xs sm:text-sm font-bold text-white/95 truncate flex items-center gap-2';
    titleEl.innerHTML = '<i class="fas fa-circle-play text-indigo-400" aria-hidden="true"></i><span></span>';
    titleEl.querySelector('span').textContent = titleText || 'Video Demo';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'w-9 h-9 shrink-0 rounded-full bg-white/10 hover:bg-rose-500 text-white grid place-items-center transition border border-white/15 cursor-pointer';
    closeBtn.setAttribute('aria-label', 'Đóng video');
    closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';

    topBar.appendChild(titleEl);
    topBar.appendChild(closeBtn);

    var frame = document.createElement('div');
    frame.id = 'video-modal-frame';
    frame.className = 'relative w-full rounded-2xl overflow-hidden bg-black border border-[#28235d] shadow-2xl flex items-center justify-center';
    frame.style.aspectRatio = videoList.length >= 2 ? '16 / 9' : (isShortUrl ? '9 / 16' : '16 / 9');
    if (isShortUrl && videoList.length < 2) frame.style.maxHeight = '82vh';
    else frame.style.maxHeight = '72vh';

    var vid = null;
    if (isMp4) {
      vid = document.createElement('video');
      vid.src = url;
      if (posterUrl) vid.poster = posterUrl;
      vid.controls = true;
      vid.autoplay = true;
      vid.loop = videoList.length >= 2;
      vid.playsInline = true;
      vid.className = 'w-full h-full object-contain bg-black';
      frame.appendChild(vid);

      if (videoList.length < 2) {
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

        vid.addEventListener('loadedmetadata', function () {
          if (vid.videoWidth && vid.videoHeight) {
            applyModalContainerSize(box, vid.videoWidth, vid.videoHeight);
            applyAdaptiveClasses(frame, vid.videoWidth, vid.videoHeight);
          }
        });
      }
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

    // Dual-video switcher bar inside modal (16:9 Ngang & 9:16 Dọc)
    if (videoList.length >= 2 && vid) {
      var strip = document.createElement('div');
      strip.className = 'flex items-center justify-center gap-2.5 pt-1 flex-wrap';
      videoList.forEach(function (item, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        var isActive = item.url === url || (idx === 0 && !videoList.some(function (x) { return x.url === url; }));
        btn.className = 'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border-2 bg-[#0d0c24] text-left transition cursor-pointer ' +
          (isActive ? 'border-cyan-400 text-white shadow-md shadow-cyan-500/20' : 'border-[#252157] text-[#b8b6d9] hover:border-indigo-400 hover:text-white');
        var thumbHtml = item.poster
          ? '<img src="' + item.poster.replace(/"/g, '&quot;') + '" alt="" class="w-12 h-8 rounded-md bg-black ' + (item.aspect === '9:16' ? 'object-contain' : 'object-cover') + ' shrink-0 border border-white/10" />'
          : '';
        btn.innerHTML = thumbHtml + '<div class="min-w-0"><div class="text-xs font-bold leading-tight"></div><div class="text-[10px] opacity-75"></div></div>';
        btn.querySelectorAll('div')[1].textContent = item.shortLabel || ('Video ' + (idx + 1));
        btn.querySelectorAll('div')[2].textContent = item.aspect === '9:16' ? 'Dọc 9:16 (Reels/TikTok)' : 'Ngang 16:9 (YouTube)';
        btn.onclick = function () {
          strip.querySelectorAll('button').forEach(function (b) {
            b.classList.remove('border-cyan-400', 'text-white', 'shadow-md', 'shadow-cyan-500/20');
            b.classList.add('border-[#252157]', 'text-[#b8b6d9]');
          });
          btn.classList.remove('border-[#252157]', 'text-[#b8b6d9]');
          btn.classList.add('border-cyan-400', 'text-white', 'shadow-md', 'shadow-cyan-500/20');
          vid.src = item.url;
          if (item.poster) vid.poster = item.poster;
          vid.currentTime = 0;
          vid.play().catch(function () {});
        };
        strip.appendChild(btn);
      });
      box.appendChild(strip);
    }

    modal.appendChild(box);
    document.body.appendChild(modal);
    closeBtn.focus();

    function closeModal() {
      document.removeEventListener('keydown', onEsc);
      var v = modal.querySelector('video');
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { } }
      modal.remove();
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    }
    function onEsc(ev) { if (ev.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', onEsc);
    closeBtn.onclick = closeModal;
    modal.onclick = function (e) { if (e.target === modal) closeModal(); };
  };

  /* ---------- Image Preview Lightbox ---------- */
  window.openImageModal = function (src, titleText) {
    if (!src) return;
    var prevFocus = document.activeElement;
    var existing = document.getElementById('image-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', titleText || 'Xem ảnh sản phẩm');
    modal.className = 'fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6';

    var box = document.createElement('div');
    box.className = 'relative max-w-4xl w-full flex flex-col gap-2.5 items-center';

    var topBar = document.createElement('div');
    topBar.className = 'w-full flex items-center justify-between gap-3 px-1';
    var titleEl = document.createElement('div');
    titleEl.className = 'text-xs sm:text-sm font-bold text-white/95 truncate flex items-center gap-2';
    titleEl.innerHTML = '<i class="far fa-image text-indigo-400" aria-hidden="true"></i><span></span>';
    titleEl.querySelector('span').textContent = titleText || 'Ảnh xem trước';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'w-9 h-9 shrink-0 rounded-full bg-white/10 hover:bg-rose-500 text-white grid place-items-center transition border border-white/15 cursor-pointer';
    closeBtn.setAttribute('aria-label', 'Đóng ảnh');
    closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';

    topBar.appendChild(titleEl);
    topBar.appendChild(closeBtn);

    var frame = document.createElement('div');
    frame.className = 'w-full rounded-2xl overflow-hidden bg-[#070614] border border-[#28235d] shadow-2xl flex items-center justify-center p-2';
    var img = document.createElement('img');
    img.src = src;
    img.alt = titleText || 'Ảnh sản phẩm';
    img.className = 'max-h-[82vh] w-auto max-w-full object-contain rounded-xl';
    frame.appendChild(img);

    box.appendChild(topBar);
    box.appendChild(frame);
    modal.appendChild(box);
    document.body.appendChild(modal);
    closeBtn.focus();

    function closeImgModal() {
      document.removeEventListener('keydown', onImgEsc);
      modal.remove();
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    }
    function onImgEsc(ev) { if (ev.key === 'Escape') closeImgModal(); }
    document.addEventListener('keydown', onImgEsc);
    closeBtn.onclick = closeImgModal;
    modal.onclick = function (e) { if (e.target === modal) closeImgModal(); };
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
    else if ((path === '/san-pham' && qType === 'mcp_skill') || path === '/danh-muc/skill-ai-agent-mcp') activeSide = 'mcp_skill';
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
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      a.className = 'sidebar-menu-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ' +
        (on
          ? 'is-active text-white bg-indigo-500/15 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
          : 'text-[#c2c0e0] border border-transparent hover:text-white hover:bg-white/5');
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
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      a.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition whitespace-nowrap ' +
        (on ? 'is-active text-indigo-300 bg-indigo-500/15' : 'text-[#b8b6d9] hover:text-white hover:bg-white/5');
    });

    document.querySelectorAll('#mobile-nav a[data-mob-nav]').forEach(function (a) {
      var on = a.dataset.mobNav === activeTop;
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      a.className = 'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ' +
        (on ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' : 'text-[#c2c0e0] hover:bg-white/5');
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
          p.indexOf('/tai-xuong/') === 0 || p.indexOf('/videos/') === 0 || p.indexOf('/oauth/') === 0 ||
          p === '/dang-xuat' || p === '/xac-minh-email' || p === '/dat-lai-mat-khau' || p.slice(-4) === '/doc') {
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

    // Close mobile nav, user dropdown & sidebar hover overlay immediately on navigation
    var mobNav = document.getElementById('mobile-nav');
    var mobBtn = document.getElementById('mobile-menu-btn');
    if (mobNav && !mobNav.classList.contains('hidden')) {
      mobNav.classList.add('hidden');
      if (mobBtn) {
        mobBtn.setAttribute('aria-expanded', 'false');
        if (mobBtn.querySelector('i')) mobBtn.querySelector('i').className = 'fas fa-bars';
      }
    }
    var userDd = document.getElementById('user-dropdown');
    var userBtn = document.getElementById('user-menu-btn');
    if (userDd && !userDd.classList.contains('hidden')) {
      userDd.classList.add('hidden');
      if (userBtn) userBtn.setAttribute('aria-expanded', 'false');
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
      if (doc.body && doc.body.className) {
        document.body.className = doc.body.className;
      }
      document.title = doc.title || document.title;

      // Sync cart & notification badges from server HTML
      var newBadge = doc.getElementById('cart-badge');
      if (newBadge) {
        setCartBadge(Number(newBadge.textContent) || 0);
      }
      var newNotif = doc.getElementById('notif-badge');
      var curNotif = document.getElementById('notif-badge');
      if (newNotif && curNotif) {
        var nc = (newNotif.textContent || '').trim();
        curNotif.textContent = nc;
        curNotif.classList.toggle('hidden', newNotif.classList.contains('hidden'));
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

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function getDemoVideos() {
    var el = document.getElementById('demo-videos-json');
    if (el && el.textContent) {
      try {
        var parsed = JSON.parse(el.textContent);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map(function (v) {
            return {
              title: v.title || '',
              studioLabel: v.studioLabel || v.shortTitle || v.tag || v.handle || 'Studio Demo',
              caption: v.caption || v.desc || v.title || '',
              desc: v.desc || v.caption || '',
              orient: v.orient === 'portrait' || v.aspect === 'portrait' ? 'portrait' : 'landscape',
              dur: v.dur || '0:30',
              videoUrl: v.videoUrl || v.video || '',
              posterUrl: v.posterUrl || v.poster || '',
              slug: v.slug || '',
              tag: v.tag || 'Skill AI',
              price: v.price || 0,
              origPrice: v.originalPrice || v.origPrice || 0,
              platform: v.platform || 'tiktok',
              handle: v.handle || '@khoskill.ai',
              music: v.music || 'Âm thanh gốc - KhoSkill AI',
              avatar: v.avatar || '/static/logo-icon.png',
              likes: v.likes || '12.4K',
              comments: v.comments || '418',
              saves: v.saves || '1.9K',
              shares: v.shares || '326'
            };
          });
        }
      } catch (e) { }
    }
    return [];
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

    var HERO_VIDEOS = getDemoVideos();
    if (!HERO_VIDEOS.length) return;

    var reducedMotion = prefersReducedMotion();
    var currentIndex = 0;
    var isMuted = true;
    var userPickedPlatform = false;
    var currentPlatform = HERO_VIDEOS[0].platform || 'tiktok';
    var likedMap = {};
    var savedMap = {};
    var followedMap = {};

    var soundBtn = document.getElementById('heroSoundBtn');
    var soundText = document.getElementById('heroSoundText');
    var playBtn = document.getElementById('heroPlayCenterBtn');
    var playIcon = document.getElementById('heroPlayCenterIcon');
    var progTrack = document.getElementById('heroProgressTrack');
    var progFill = document.getElementById('heroProgressFill');

    var guiOverlay = document.getElementById('shortGuiOverlay');
    var platformTabs = document.getElementById('heroPlatformTabs');
    var platformBadge = document.getElementById('shortPlatformBadge');
    var topModePill = document.getElementById('shortTopModePill');
    var avatarImg = document.getElementById('shortAvatarImg');
    var followPlus = document.getElementById('shortFollowPlus');
    var followPill = document.getElementById('shortFollowPill');
    var likeBtn = document.getElementById('shortLikeBtn');
    var likeIcon = document.getElementById('shortLikeIcon');
    var likeCountEl = document.getElementById('shortLikeCount');
    var commentBtn = document.getElementById('shortCommentBtn');
    var commentCountEl = document.getElementById('shortCommentCount');
    var saveBtn = document.getElementById('shortSaveBtn');
    var saveCountEl = document.getElementById('shortSaveCount');
    var shareBtn = document.getElementById('shortShareBtn');
    var shareCountEl = document.getElementById('shortShareCount');
    var discSpin = document.getElementById('shortDiscSpin');
    var handleEl = document.getElementById('shortAuthorHandle');
    var captionEl = document.getElementById('shortCaption');
    var musicEl = document.getElementById('shortMusicTitle');

    var PLATFORM_META = {
      tiktok: {
        badgeHtml: '<i class="fab fa-tiktok mr-1" aria-hidden="true"></i>LIVE',
        modeText: 'Dành cho bạn',
        followText: 'Theo dõi',
        followedText: 'Đang theo dõi',
        likeIcon: 'fas fa-heart'
      },
      reels: {
        badgeHtml: '<i class="fab fa-facebook mr-1" aria-hidden="true"></i>Reels',
        modeText: 'Khám phá',
        followText: 'Theo dõi',
        followedText: 'Đang theo dõi',
        likeIcon: 'fas fa-thumbs-up'
      },
      instagram: {
        badgeHtml: '<i class="fab fa-instagram mr-1" aria-hidden="true"></i>Reels',
        modeText: 'Đang theo dõi',
        followText: 'Theo dõi',
        followedText: 'Đang theo dõi',
        likeIcon: 'fas fa-heart'
      },
      shorts: {
        badgeHtml: '<i class="fab fa-youtube mr-1" aria-hidden="true"></i>Shorts',
        modeText: 'Xu hướng',
        followText: 'Đăng ký',
        followedText: 'Đã đăng ký',
        likeIcon: 'fas fa-thumbs-up'
      }
    };

    function syncSocialInteractiveUI() {
      var meta = PLATFORM_META[currentPlatform] || PLATFORM_META.tiktok;
      var isLiked = Boolean(likedMap[currentIndex]);
      var isSaved = Boolean(savedMap[currentIndex]);
      var isFollowed = Boolean(followedMap[currentIndex]);

      if (likeBtn) {
        likeBtn.classList.toggle('liked', isLiked);
        likeBtn.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
      }
      if (saveBtn) {
        saveBtn.classList.toggle('saved', isSaved);
        saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
      }
      if (followPill) {
        followPill.textContent = isFollowed ? meta.followedText : meta.followText;
        followPill.classList.toggle('is-followed', isFollowed);
        followPill.style.opacity = isFollowed ? '0.82' : '';
      }
      if (followPlus) {
        var fIcon = followPlus.querySelector('i');
        if (fIcon) fIcon.className = isFollowed ? 'fas fa-check' : 'fas fa-plus';
        followPlus.setAttribute('aria-pressed', isFollowed ? 'true' : 'false');
      }
    }

    function setPlatform(key) {
      var safeKey = PLATFORM_META[key] ? key : 'tiktok';
      var meta = PLATFORM_META[safeKey];
      currentPlatform = safeKey;

      if (guiOverlay) guiOverlay.setAttribute('data-platform', safeKey);
      if (platformBadge) platformBadge.innerHTML = meta.badgeHtml;
      if (topModePill) topModePill.textContent = meta.modeText;
      if (likeIcon) likeIcon.className = meta.likeIcon;

      if (platformTabs) {
        var tabs = platformTabs.querySelectorAll('.platform-pill');
        for (var i = 0; i < tabs.length; i++) {
          var isMatch = tabs[i].getAttribute('data-platform') === safeKey;
          tabs[i].classList.toggle('is-active', isMatch);
          tabs[i].setAttribute('aria-selected', isMatch ? 'true' : 'false');
        }
      }
      syncSocialInteractiveUI();
    }

    function setHeroOrientation(orient) {
      var isLand = orient !== 'portrait';
      stage.classList.toggle('frame-landscape', isLand);
      stage.classList.toggle('frame-portrait', !isLand);
      frontPhone.classList.toggle('frame-landscape', isLand);
      frontPhone.classList.toggle('frame-portrait', !isLand);
    }

    function updateStudioOverlay(v) {
      var studioEl = document.getElementById('heroStudioLabel');
      var aspectEl = document.getElementById('heroAspectPill');
      var priceEl = document.getElementById('heroActivePrice');
      var detailEl = document.getElementById('heroDetailLink');

      if (studioEl) studioEl.textContent = v.studioLabel;
      if (aspectEl) aspectEl.textContent = v.orient === 'portrait' ? '9:16 Dọc' : '16:9 Ngang';
      if (priceEl && v.price) priceEl.textContent = Number(v.price).toLocaleString('vi-VN') + 'đ';
      if (detailEl && v.slug) detailEl.href = '/san-pham/' + v.slug;

      if (handleEl) handleEl.textContent = v.handle;
      if (captionEl) captionEl.textContent = v.caption;
      if (musicEl) musicEl.textContent = v.music;
      if (avatarImg && v.avatar) avatarImg.src = v.avatar;
      if (likeCountEl) likeCountEl.textContent = v.likes;
      if (commentCountEl) commentCountEl.textContent = v.comments;
      if (saveCountEl) saveCountEl.textContent = v.saves;
      if (shareCountEl) shareCountEl.textContent = v.shares;

      if (!userPickedPlatform && v.platform) {
        setPlatform(v.platform);
      } else {
        syncSocialInteractiveUI();
      }
    }

    function syncPlayStateUI(paused) {
      frontPhone.classList.toggle('is-paused', Boolean(paused));
      if (playIcon) {
        playIcon.className = paused ? 'fas fa-play text-white ml-0.5' : 'fas fa-pause text-white';
      }
      if (playBtn) {
        playBtn.setAttribute('aria-label', paused ? 'Phát video demo' : 'Tạm dừng video demo');
      }
      if (discSpin) {
        discSpin.style.animationPlayState = paused ? 'paused' : 'running';
      }
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

      if (!instant && !reducedMotion) {
        frontPhone.style.opacity = '0.78';
        setTimeout(function () { frontPhone.style.opacity = '1'; }, 120);
      }

      frontVideo.pause();
      frontVideo.poster = vFront.posterUrl;
      frontVideo.src = vFront.videoUrl;
      frontVideo.muted = isMuted;
      if (!instant || !reducedMotion) {
        frontVideo.play().catch(function () { });
        syncPlayStateUI(false);
      } else {
        syncPlayStateUI(true);
      }
      updateStudioOverlay(vFront);
    }

    frontVideo.addEventListener('loadedmetadata', function () {
      if (frontVideo.videoWidth && frontVideo.videoHeight) {
        var isLand = frontVideo.videoWidth >= frontVideo.videoHeight;
        setHeroOrientation(isLand ? 'landscape' : 'portrait');
        var aspectEl = document.getElementById('heroAspectPill');
        if (aspectEl) aspectEl.textContent = isLand ? '16:9 Ngang' : '9:16 Dọc';
      }
    });

    frontVideo.addEventListener('timeupdate', function () {
      if (frontVideo.duration && progFill) {
        progFill.style.width = ((frontVideo.currentTime / frontVideo.duration) * 100) + '%';
      }
    });

    if (platformTabs) {
      platformTabs.onclick = function (e) {
        var btn = e.target.closest ? e.target.closest('.platform-pill') : null;
        if (!btn) return;
        userPickedPlatform = true;
        setPlatform(btn.getAttribute('data-platform') || 'tiktok');
      };
    }

    if (playBtn) {
      playBtn.onclick = function (e) {
        e.stopPropagation();
        if (frontVideo.paused) {
          frontVideo.play().catch(function () { });
          syncPlayStateUI(false);
        } else {
          frontVideo.pause();
          syncPlayStateUI(true);
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
        soundBtn.setAttribute('aria-pressed', isMuted ? 'false' : 'true');
        var ic = soundBtn.querySelector('i');
        if (ic) ic.className = 'fas ' + (isMuted ? 'fa-volume-xmark' : 'fa-volume-high') + ' mr-1';
        if (soundText) soundText.textContent = isMuted ? 'Bật tiếng' : 'Đang bật tiếng';
      };
    }

    if (likeBtn) {
      likeBtn.onclick = function (e) {
        e.stopPropagation();
        likedMap[currentIndex] = !likedMap[currentIndex];
        syncSocialInteractiveUI();
      };
    }
    if (saveBtn) {
      saveBtn.onclick = function (e) {
        e.stopPropagation();
        savedMap[currentIndex] = !savedMap[currentIndex];
        syncSocialInteractiveUI();
        if (typeof toast === 'function') {
          toast(savedMap[currentIndex] ? 'Đã lưu video demo vào bộ sưu tập!' : 'Đã bỏ lưu video demo', 'info');
        }
      };
    }
    function toggleFollow(e) {
      e.stopPropagation();
      followedMap[currentIndex] = !followedMap[currentIndex];
      syncSocialInteractiveUI();
    }
    if (followPill) followPill.onclick = toggleFollow;
    if (followPlus) followPlus.onclick = toggleFollow;
    if (commentBtn) {
      commentBtn.onclick = function (e) {
        e.stopPropagation();
        if (typeof toast === 'function') {
          toast('Bấm "Chi tiết" bên dưới để xem đánh giá thực tế của Skill này', 'info');
        }
      };
    }
    if (shareBtn) {
      shareBtn.onclick = function (e) {
        e.stopPropagation();
        var v = HERO_VIDEOS[currentIndex];
        var shareUrl = location.origin + (v && v.slug ? '/san-pham/' + v.slug : '/');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(function () {
            if (typeof toast === 'function') toast('Đã sao chép link Skill demo!', 'success');
          }).catch(function () { });
        }
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

    function bindSideTrigger(el, delta) {
      if (!el) return;
      el.onclick = function () { applyHeroIndex(currentIndex + delta); };
      el.onkeydown = function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          applyHeroIndex(currentIndex + delta);
        }
      };
    }
    bindSideTrigger(leftPhone, -1);
    bindSideTrigger(rightPhone, 1);

    setHeroOrientation(HERO_VIDEOS[0].orient);
    setPlatform(currentPlatform);
    updateStudioOverlay(HERO_VIDEOS[0]);
    if (reducedMotion) {
      frontVideo.pause();
      frontVideo.removeAttribute('autoplay');
      syncPlayStateUI(true);
    }

    registerCleanup(function () {
      try { frontVideo.pause(); } catch (e) { }
    });
  }

  function initVideoWall() {
    var cards = document.querySelectorAll('.wall-card');
    var walls = document.querySelectorAll('.wall');
    var toggleBtn = document.getElementById('wallToggleBtn');
    var canHoverPreview = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    function setWallsPaused(paused) {
      walls.forEach(function (w) { w.classList.toggle('is-paused', paused); });
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        var ic = toggleBtn.querySelector('i');
        var lbl = toggleBtn.querySelector('span');
        if (ic) ic.className = 'fas ' + (paused ? 'fa-play' : 'fa-pause');
        if (lbl) lbl.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
      }
    }

    if (prefersReducedMotion()) {
      setWallsPaused(true);
    }

    if (toggleBtn && !toggleBtn.dataset.boundWall) {
      toggleBtn.dataset.boundWall = '1';
      toggleBtn.addEventListener('click', function () {
        var paused = walls.length ? !walls[0].classList.contains('is-paused') : false;
        setWallsPaused(paused);
      });
    }

    if (!cards.length) return;
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

    var THEATER_PLAYLIST = getDemoVideos();
    if (!THEATER_PLAYLIST.length) return;

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
        soundBtn.setAttribute('aria-pressed', theaterVid.muted ? 'false' : 'true');
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

        pItems.forEach(function (x) {
          x.classList.remove('active');
          x.removeAttribute('aria-current');
        });
        item.classList.add('active');
        item.setAttribute('aria-current', 'true');

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
        if (lnkEl && d.slug) lnkEl.href = '/san-pham/' + d.slug;
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

  /* ---------- Before / After (Raw vs Edited) Synchronized Video Comparison ---------- */
  function initBeforeAfterPlayers() {
    document.querySelectorAll('[data-ba-player]').forEach(function (card) {
      var stage = card.querySelector('[data-ba-stage]');
      var rawVid = card.querySelector('.ba-vid-raw');
      var edVid = card.querySelector('.ba-vid-edited');
      var playBtn = card.querySelector('[data-ba-play]');
      var bigPlay = card.querySelector('[data-ba-bigplay]');
      var seekTrack = card.querySelector('[data-ba-seek]');
      var seekFill = card.querySelector('.ba-seek-fill');
      var seekThumb = card.querySelector('.ba-seek-thumb');
      var timeEl = card.querySelector('[data-ba-time]');
      var handle = card.querySelector('[data-ba-handle]');
      var pillRaw = card.querySelector('.ba-audio-pill-raw');
      var pillEd = card.querySelector('.ba-audio-pill-edited');
      var modeBtns = card.querySelectorAll('[data-ba-mode-btn]');
      var audioBtns = card.querySelectorAll('[data-ba-audio]');

      if (!stage || !rawVid || !edVid) return;

      var audioMode = 'edited'; // 'edited' | 'raw' | 'mute'
      var isScrubbing = false;
      var isDraggingWipe = false;
      var wipePct = 50;

      function fmtSec(sec) {
        if (!sec || !isFinite(sec)) return '00:00';
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }

      function applyAudioMode(mode) {
        audioMode = mode;
        if (mode === 'edited') {
          edVid.muted = false;
          rawVid.muted = true;
        } else if (mode === 'raw') {
          edVid.muted = true;
          rawVid.muted = false;
        } else {
          edVid.muted = true;
          rawVid.muted = true;
        }
        audioBtns.forEach(function (b) {
          b.classList.toggle('active', b.dataset.baAudio === mode);
        });
        if (pillRaw) pillRaw.classList.toggle('hidden', mode !== 'raw');
        if (pillEd) pillEd.classList.toggle('hidden', mode !== 'edited');
      }

      function setWipePos(pct) {
        wipePct = Math.max(2, Math.min(98, pct));
        stage.style.setProperty('--ba-pos', wipePct.toFixed(2) + '%');
        if (handle) handle.setAttribute('aria-valuenow', String(Math.round(wipePct)));
      }

      function syncPlayState() {
        var playing = !edVid.paused && !edVid.ended;
        card.classList.toggle('is-playing', playing);
        if (playBtn) {
          playBtn.innerHTML = playing
            ? '<i class="fas fa-pause text-xs" aria-hidden="true"></i>'
            : '<i class="fas fa-play text-xs ml-0.5" aria-hidden="true"></i>';
        }
      }

      function updateTimeline() {
        var dur = edVid.duration || rawVid.duration || 0;
        var cur = edVid.currentTime || 0;
        var pct = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
        if (seekFill) seekFill.style.width = pct + '%';
        if (seekThumb) seekThumb.style.left = pct + '%';
        if (seekTrack) seekTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
        if (timeEl) timeEl.textContent = fmtSec(cur) + ' / ' + fmtSec(dur);
      }

      function playBoth() {
        applyAudioMode(audioMode);
        if (edVid.ended || (edVid.duration && edVid.currentTime >= edVid.duration - 0.15)) {
          edVid.currentTime = 0;
          rawVid.currentTime = 0;
        } else if (Math.abs(rawVid.currentTime - edVid.currentTime) > 0.12) {
          try { rawVid.currentTime = edVid.currentTime; } catch (e) { }
        }
        var p1 = edVid.play();
        var p2 = rawVid.play();
        if (p1 && typeof p1.catch === 'function') p1.catch(function () { });
        if (p2 && typeof p2.catch === 'function') p2.catch(function () { });
        syncPlayState();
      }

      function pauseBoth() {
        edVid.pause();
        rawVid.pause();
        syncPlayState();
      }

      function toggleBoth() {
        if (edVid.paused || edVid.ended) playBoth();
        else pauseBoth();
      }

      function seekToRatio(ratio) {
        var dur = edVid.duration || rawVid.duration || 0;
        if (!dur) return;
        var target = Math.max(0, Math.min(dur, ratio * dur));
        try {
          edVid.currentTime = target;
          rawVid.currentTime = Math.min(rawVid.duration || dur, target);
        } catch (e) { }
        updateTimeline();
      }

      // Initial state
      applyAudioMode('edited');
      setWipePos(50);

      // Mode switching (Split <-> Wipe) without stopping video
      modeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var mode = btn.dataset.baModeBtn || 'split';
          card.dataset.mode = mode;
          modeBtns.forEach(function (b) {
            var act = b === btn;
            b.classList.toggle('active', act);
            b.setAttribute('aria-selected', act ? 'true' : 'false');
          });
        });
      });

      // Audio source switching live during playback
      audioBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          applyAudioMode(btn.dataset.baAudio || 'edited');
        });
      });

      // Play triggers
      if (playBtn) playBtn.addEventListener('click', toggleBoth);
      if (bigPlay) bigPlay.addEventListener('click', function (e) { e.stopPropagation(); playBoth(); });

      // Click video panes in Split mode toggles play/pause
      [rawVid, edVid].forEach(function (v) {
        v.addEventListener('click', function () {
          if (card.dataset.mode === 'split') toggleBoth();
        });
      });

      // Pause comparison player when opening fullscreen modal button
      card.querySelectorAll('[data-video]').forEach(function (btn) {
        btn.addEventListener('click', pauseBoth);
      });

      // Sync drift guard & timeline updates
      edVid.addEventListener('loadedmetadata', updateTimeline);
      rawVid.addEventListener('loadedmetadata', updateTimeline);
      edVid.addEventListener('play', syncPlayState);
      edVid.addEventListener('pause', syncPlayState);
      edVid.addEventListener('ended', function () {
        rawVid.pause();
        syncPlayState();
      });
      edVid.addEventListener('timeupdate', function () {
        if (!isScrubbing) updateTimeline();
        if (!edVid.paused && !rawVid.paused && rawVid.readyState >= 2) {
          var drift = Math.abs(rawVid.currentTime - edVid.currentTime);
          if (drift > 0.18 && (!rawVid.duration || edVid.currentTime < rawVid.duration - 0.1)) {
            try { rawVid.currentTime = edVid.currentTime; } catch (e) { }
          }
        }
      });

      // Keep both waiting smoothly if one buffers
      edVid.addEventListener('waiting', function () { if (!rawVid.paused) rawVid.pause(); });
      edVid.addEventListener('playing', function () {
        if (!edVid.paused && rawVid.paused && (!rawVid.duration || edVid.currentTime < rawVid.duration - 0.1)) {
          try { rawVid.currentTime = edVid.currentTime; } catch (e) { }
          var pr = rawVid.play();
          if (pr && typeof pr.catch === 'function') pr.catch(function () { });
        }
      });

      // Scrub bar pointer interaction
      if (seekTrack) {
        function ratioFromEvent(ev) {
          var rect = seekTrack.getBoundingClientRect();
          if (!rect.width) return 0;
          return Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        }
        seekTrack.addEventListener('pointerdown', function (ev) {
          isScrubbing = true;
          try { seekTrack.setPointerCapture(ev.pointerId); } catch (e) { }
          seekToRatio(ratioFromEvent(ev));
        });
        seekTrack.addEventListener('pointermove', function (ev) {
          if (!isScrubbing) return;
          seekToRatio(ratioFromEvent(ev));
        });
        var stopScrub = function () { isScrubbing = false; };
        seekTrack.addEventListener('pointerup', stopScrub);
        seekTrack.addEventListener('pointercancel', stopScrub);
        seekTrack.addEventListener('keydown', function (ev) {
          var dur = edVid.duration || 0;
          if (!dur) return;
          if (ev.key === 'ArrowRight') { ev.preventDefault(); seekToRatio((edVid.currentTime + 5) / dur); }
          if (ev.key === 'ArrowLeft') { ev.preventDefault(); seekToRatio((edVid.currentTime - 5) / dur); }
        });
      }

      // Wipe Slider pointer + keyboard interaction
      function wipeFromClientX(clientX) {
        var rect = stage.getBoundingClientRect();
        if (!rect.width) return;
        setWipePos(((clientX - rect.left) / rect.width) * 100);
      }
      stage.addEventListener('pointerdown', function (ev) {
        if (card.dataset.mode !== 'wipe') return;
        if (ev.target && ev.target.closest && ev.target.closest('[data-ba-bigplay]')) return;
        isDraggingWipe = true;
        try { stage.setPointerCapture(ev.pointerId); } catch (e) { }
        wipeFromClientX(ev.clientX);
      });
      stage.addEventListener('pointermove', function (ev) {
        if (!isDraggingWipe || card.dataset.mode !== 'wipe') return;
        wipeFromClientX(ev.clientX);
      });
      var stopWipe = function () { isDraggingWipe = false; };
      stage.addEventListener('pointerup', stopWipe);
      stage.addEventListener('pointercancel', stopWipe);

      if (handle) {
        handle.addEventListener('keydown', function (ev) {
          if (ev.key === 'ArrowLeft') { ev.preventDefault(); setWipePos(wipePct - 5); }
          if (ev.key === 'ArrowRight') { ev.preventDefault(); setWipePos(wipePct + 5); }
        });
      }

      registerCleanup(function () {
        pauseBoth();
      });
    });
  }

  /* ---------- Product Card Hover / Touch-Hold Video Preview ---------- */
  var activeHoverMedia = null;
  function stopCardHoverVideo(media) {
    if (!media) return;
    if (media._hoverTimer) {
      clearTimeout(media._hoverTimer);
      media._hoverTimer = null;
    }
    media.classList.remove('is-hover-playing');
    var v = media.querySelector('video.product-card-hover-video');
    if (v) {
      try { v.pause(); } catch (e) {}
    }
    if (activeHoverMedia === media) activeHoverMedia = null;
  }

  window.__pauseAllCardHoverVideos = function () {
    document.querySelectorAll('.product-card-media.is-hover-playing').forEach(stopCardHoverVideo);
    if (activeHoverMedia) stopCardHoverVideo(activeHoverMedia);
  };

  function startCardHoverVideo(media) {
    if (!media || prefersReducedMotion()) return;
    var url = media.getAttribute('data-hover-video');
    if (!url) return;
    if (activeHoverMedia && activeHoverMedia !== media) {
      stopCardHoverVideo(activeHoverMedia);
    }
    activeHoverMedia = media;

    var vid = media.querySelector('video.product-card-hover-video');
    if (!vid) {
      vid = document.createElement('video');
      vid.className = 'product-card-hover-video object-cover';
      vid.muted = true;
      vid.defaultMuted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.setAttribute('muted', '');
      vid.setAttribute('playsinline', '');
      vid.preload = 'auto';
      vid.src = url;
      vid.addEventListener('loadedmetadata', function () {
        var amb = media.querySelector('.product-card-ambient');
        if (vid.videoHeight > vid.videoWidth * 1.05) {
          vid.classList.remove('object-cover');
          vid.classList.add('object-contain');
          if (amb) { amb.classList.remove('opacity-0'); amb.classList.add('opacity-50'); }
        } else {
          vid.classList.remove('object-contain');
          vid.classList.add('object-cover');
        }
      });
      vid.addEventListener('playing', function () {
        if (activeHoverMedia === media) {
          media.classList.add('is-hover-playing');
        }
      });
      media.appendChild(vid);
    }

    var playPromise = vid.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(function () {
        if (activeHoverMedia === media) media.classList.add('is-hover-playing');
      }).catch(function () {});
    } else {
      media.classList.add('is-hover-playing');
    }
  }

  function initCardHoverVideos() {
    document.querySelectorAll('.product-card-media[data-hover-video]').forEach(function (media) {
      if (media._hoverBound) return;
      media._hoverBound = true;

      media.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        if (media._hoverTimer) clearTimeout(media._hoverTimer);
        media._hoverTimer = setTimeout(function () {
          startCardHoverVideo(media);
        }, 80);
      });

      media.addEventListener('pointerleave', function () {
        stopCardHoverVideo(media);
      });

      // Touch hold (>220ms) plays inline preview smoothly on mobile without hijacking scroll
      var touchStartY = 0;
      media.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches.length) return;
        touchStartY = e.touches[0].clientY;
        if (media._hoverTimer) clearTimeout(media._hoverTimer);
        media._hoverTimer = setTimeout(function () {
          startCardHoverVideo(media);
        }, 220);
      }, { passive: true });

      media.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches.length && Math.abs(e.touches[0].clientY - touchStartY) > 10) {
          if (media._hoverTimer) { clearTimeout(media._hoverTimer); media._hoverTimer = null; }
        }
      }, { passive: true });

      media.addEventListener('touchend', function () {
        if (media._hoverTimer) { clearTimeout(media._hoverTimer); media._hoverTimer = null; }
      }, { passive: true });

      media.addEventListener('touchcancel', function () {
        stopCardHoverVideo(media);
      }, { passive: true });
    });
  }

  /* ---------- Dual Demo Video Gallery Switcher (16:9 & 9:16 on Product Detail) ---------- */
  function initDemoGalleryPlayers() {
    document.querySelectorAll('[data-demo-gallery]').forEach(function (gallery) {
      if (gallery._dgBound) return;
      gallery._dgBound = true;

      var video = gallery.querySelector('[data-dg-video]');
      var ambient = gallery.querySelector('[data-dg-ambient]');
      var badge = gallery.querySelector('[data-dg-badge]');
      var expandBtn = gallery.querySelector('[data-dg-expand]');
      var thumbs = gallery.querySelectorAll('[data-dg-thumb]');
      if (!video || !thumbs.length) return;

      thumbs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var nextUrl = btn.getAttribute('data-url');
          var nextPoster = btn.getAttribute('data-poster') || '';
          var nextLabel = btn.getAttribute('data-label') || 'VIDEO DEMO';
          var nextAspect = btn.getAttribute('data-aspect') || '16:9';
          if (!nextUrl) return;

          thumbs.forEach(function (t) {
            t.classList.remove('is-active', 'border-cyan-400', 'shadow-lg', 'shadow-cyan-500/20');
            t.classList.add('border-[#221e54]', 'opacity-80');
            t.setAttribute('aria-selected', 'false');
          });
          btn.classList.remove('border-[#221e54]', 'opacity-80');
          btn.classList.add('is-active', 'border-cyan-400', 'shadow-lg', 'shadow-cyan-500/20');
          btn.setAttribute('aria-selected', 'true');

          if (ambient && nextPoster) {
            ambient.style.backgroundImage = "url('" + nextPoster.replace(/'/g, "\\'") + "')";
          }
          if (badge) badge.textContent = nextLabel;
          if (expandBtn) {
            expandBtn.setAttribute('data-video', nextUrl);
            expandBtn.setAttribute('data-poster', nextPoster);
            expandBtn.setAttribute('data-aspect', nextAspect === '9:16' ? 'vertical' : 'landscape');
          }

          if (video.getAttribute('src') !== nextUrl) {
            video.src = nextUrl;
            if (nextPoster) video.poster = nextPoster;
            video.load();
          }
          video.currentTime = 0;
          video.play().catch(function () {});
        });
      });
    });
  }

  function reinitPage() {
    if (typeof window.__pauseAllCardHoverVideos === 'function') window.__pauseAllCardHoverVideos();
    reinitMediaFrames();
    initCardHoverVideos();
    initDemoGalleryPlayers();
    initBeforeAfterPlayers();
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
    if (userBtn && dd) {
      dd.classList.toggle('hidden');
      userBtn.setAttribute('aria-expanded', dd.classList.contains('hidden') ? 'false' : 'true');
      return;
    }
    if (dd && !e.target.closest('#user-menu-wrap')) {
      dd.classList.add('hidden');
      var ub = document.getElementById('user-menu-btn');
      if (ub) ub.setAttribute('aria-expanded', 'false');
    }

    var mobBtn = e.target.closest('#mobile-menu-btn');
    if (mobBtn) {
      var n = document.getElementById('mobile-nav');
      if (n) {
        n.classList.toggle('hidden');
        var isMobOpen = !n.classList.contains('hidden');
        mobBtn.setAttribute('aria-expanded', isMobOpen ? 'true' : 'false');
        var ic = mobBtn.querySelector('i');
        if (ic) ic.className = isMobOpen ? 'fas fa-xmark' : 'fas fa-bars';
      }
      return;
    }

    // Password visibility toggle
    var pwBtn = e.target.closest('.toggle-password-btn');
    if (pwBtn) {
      e.preventDefault();
      var targetId = pwBtn.dataset.target;
      var pwInput = targetId ? document.getElementById(targetId) : pwBtn.parentElement && pwBtn.parentElement.querySelector('input');
      if (pwInput) {
        var reveal = pwInput.type === 'password';
        pwInput.type = reveal ? 'text' : 'password';
        pwBtn.setAttribute('aria-pressed', reveal ? 'true' : 'false');
        pwBtn.setAttribute('aria-label', reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        var pwIc = pwBtn.querySelector('i');
        if (pwIc) pwIc.className = 'far ' + (reveal ? 'fa-eye-slash' : 'fa-eye') + ' text-sm';
      }
      return;
    }

    // Image Preview Lightbox trigger
    var imgBtn = e.target.closest('[data-image-preview]');
    if (imgBtn && imgBtn.dataset.imagePreview) {
      e.preventDefault();
      openImageModal(imgBtn.dataset.imagePreview, imgBtn.dataset.title || '');
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
        vidBtn.dataset.poster || '',
        vidBtn.dataset.videos || ''
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
        if (i) {
          var old = i.className;
          i.className = 'fas fa-check';
          setTimeout(function () { i.className = old; }, 1500);
        } else {
          var oldTxt = cpBtn.textContent;
          cpBtn.textContent = 'Đã chép';
          setTimeout(function () { cpBtn.textContent = oldTxt; }, 1500);
        }
      }).catch(function () { toast('Không thể sao chép', 'error'); });
      return;
    }

    // Copy multi-line content from element ID (MCP configs / sample prompts)
    var cpTargetBtn = e.target.closest('[data-copy-target]');
    if (cpTargetBtn) {
      e.preventDefault();
      var targetNode = document.getElementById(cpTargetBtn.dataset.copyTarget);
      var txt = targetNode ? (targetNode.textContent || '').trim() : '';
      if (!txt) return;
      navigator.clipboard.writeText(txt).then(function () {
        toast('Đã sao chép!', 'success');
        var i = cpTargetBtn.querySelector('i');
        if (i) {
          var old = i.className;
          i.className = 'fas fa-check';
          setTimeout(function () { i.className = old; }, 1500);
        } else {
          var oldTxt = cpTargetBtn.textContent;
          cpTargetBtn.textContent = 'Đã chép';
          setTimeout(function () { cpTargetBtn.textContent = oldTxt; }, 1500);
        }
      }).catch(function () { toast('Không thể sao chép', 'error'); });
      return;
    }

    // Revoke single OAuth AI connection
    var revokeBtn = e.target.closest('.btn-revoke-mcp-conn');
    if (revokeBtn) {
      e.preventDefault();
      var connId = Number(revokeBtn.dataset.connId);
      var connName = revokeBtn.dataset.connName || 'ứng dụng AI này';
      if (!connId) return;
      if (!confirm('Bạn muốn ngắt kết nối với "' + connName + '"?')) return;
      var origLabel = revokeBtn.textContent;
      revokeBtn.disabled = true;
      revokeBtn.textContent = 'Đang ngắt...';
      axios.post('/api/account/mcp/connections/' + connId + '/revoke')
        .then(function () {
          toast('Đã ngắt kết nối ' + connName, 'success');
          var row = revokeBtn.closest('[data-conn-row]');
          var list = document.getElementById('mcp-connections-list');
          if (row) row.remove();
          if (list && list.children.length === 0) {
            list.outerHTML = '<p class="text-xs text-[#9492b8]">Chưa có AI nào đang kết nối. Làm theo các bước ở trên để kết nối Claude hoặc ChatGPT.</p>';
          }
        })
        .catch(function (err) {
          revokeBtn.disabled = false;
          revokeBtn.textContent = origLabel;
          toast((err.response && err.response.data && err.response.data.error) || 'Không thể ngắt kết nối', 'error');
        });
      return;
    }

    // Revoke ALL AI connections + rotate personal MCP token
    var revokeAllBtn = e.target.closest('.btn-revoke-all-mcp');
    if (revokeAllBtn) {
      e.preventDefault();
      if (!confirm('Ngắt toàn bộ kết nối AI và tạo mã bảo mật mới? Tất cả Claude, ChatGPT, Claude Code, Codex, Antigravity đang kết nối sẽ cần nối lại.')) return;
      var origAll = revokeAllBtn.textContent;
      revokeAllBtn.disabled = true;
      revokeAllBtn.textContent = 'Đang ngắt tất cả...';
      axios.post('/api/account/mcp/revoke-all')
        .then(function (r) {
          toast((r.data && r.data.message) || 'Đã ngắt mọi kết nối AI!', 'success');
          setTimeout(function () { location.reload(); }, 650);
        })
        .catch(function (err) {
          revokeAllBtn.disabled = false;
          revokeAllBtn.textContent = origAll;
          toast((err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra', 'error');
        });
      return;
    }

    // Skill Scope Picker inside "Kết nối AI của bạn" (All active skills vs 1 specific skill)
    var scopeChip = e.target.closest('.ai-scope-chip');
    if (scopeChip) {
      e.preventDefault();
      var card = document.getElementById('ai-connect-card');
      if (!card) return;
      var origin = (card.dataset.origin || location.origin).replace(/\/+$/, '');
      var token = card.dataset.mcpToken || '';
      var slug = scopeChip.dataset.scopeSlug || '';
      var scopeName = scopeChip.dataset.scopeName || 'Tất cả Skill đang bật';
      var serverName = scopeChip.dataset.scopeServer || 'khoskill';

      document.querySelectorAll('.ai-scope-chip').forEach(function (btn) {
        var on = btn === scopeChip;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
      });

      var endpointUrl = slug ? (origin + '/api/mcp/' + slug) : (origin + '/api/mcp');
      card.querySelectorAll('.ai-mcp-url').forEach(function (el) { el.textContent = endpointUrl; });
      card.querySelectorAll('.ai-mcp-copy-url').forEach(function (btn) { btn.dataset.copy = endpointUrl; });

      var ccCli = 'claude mcp add --transport http --scope user ' + serverName + ' "' + endpointUrl + '" --header "Authorization: Bearer ' + token + '"';
      var ccEl = document.getElementById('unified-claude-code');
      if (ccEl) ccEl.textContent = ccCli;
      var ccPromptEl = document.getElementById('unified-claude-code-prompt');
      if (ccPromptEl) {
        ccPromptEl.textContent = 'Hãy tự cài kết nối KhoSkill AI giúp tôi vào Claude Code bằng cách chạy đúng lệnh này:\n' + ccCli;
      }

      var codexToml = '[mcp_servers.' + serverName + ']\nurl = "' + endpointUrl + '"\nhttp_headers = { Authorization = "Bearer ' + token + '" }';
      var codexEl = document.getElementById('unified-codex-toml');
      if (codexEl) codexEl.textContent = codexToml;
      var codexPromptEl = document.getElementById('unified-codex-prompt');
      if (codexPromptEl) {
        codexPromptEl.textContent = 'Hãy tự cài kết nối KhoSkill AI giúp tôi vào Codex: mở file ~/.codex/config.toml (tạo mới nếu chưa có) và thêm đoạn sau vào cuối file (không xoá cấu hình cũ):\n\n' + codexToml + '\n\nLưu file xong hãy báo tôi mở lại Codex để bắt đầu dùng Skill.';
      }

      var agyObj = { mcpServers: {} };
      agyObj.mcpServers[serverName] = { serverUrl: endpointUrl, headers: { Authorization: 'Bearer ' + token } };
      var agyEl = document.getElementById('unified-agy-json');
      if (agyEl) agyEl.textContent = JSON.stringify(agyObj, null, 2);
      var agyPromptEl = document.getElementById('unified-agy-prompt');
      if (agyPromptEl) {
        agyPromptEl.textContent = 'Hãy tự cài kết nối KhoSkill AI giúp tôi vào Antigravity trong 1 bước:\n1. Mở file ~/.gemini/config/mcp_config.json (nếu máy dùng bản cũ chưa có thì kiểm tra ~/.gemini/antigravity/mcp_config.json; chưa có thì tạo mới).\n2. Gộp thêm server "' + serverName + '" vào bên trong "mcpServers" (GIỮ NGUYÊN các server khác đang có):\n   "' + serverName + '": { "serverUrl": "' + endpointUrl + '", "headers": { "Authorization": "Bearer ' + token + '" } }\n3. Lưu file lại rồi báo tôi biết đã xong (nhắc tôi bấm Refresh ở mục MCP Servers hoặc mở đoạn chat mới là dùng được ngay).';
      }

      var noteEl = document.getElementById('ai-scope-note');
      if (noteEl) {
        var escName = scopeName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        noteEl.innerHTML = slug
          ? 'Đang chọn riêng Skill <b class="text-cyan-300">' + escName + '</b> — địa chỉ và lệnh bên dưới chỉ kết nối đúng Skill này.'
          : 'Đang nối <b class="text-white">toàn bộ Skill đang bật</b> — mua thêm Skill mới AI sẽ tự dùng ngay.';
      }
      return;
    }

    // Toggle specific MCP Skill ON/OFF for AI
    var toggleSkillBtn = e.target.closest('.btn-toggle-mcp-skill');
    if (toggleSkillBtn) {
      e.preventDefault();
      var licId = Number(toggleSkillBtn.dataset.licenseId);
      if (!licId || toggleSkillBtn.disabled) return;
      var curOn = toggleSkillBtn.dataset.enabled === '1';
      var nextOn = !curOn;
      toggleSkillBtn.disabled = true;
      axios.post('/api/account/mcp/skills/' + licId + '/toggle', { enabled: nextOn })
        .then(function (r) {
          var d = r.data || {};
          var isOn = Number(d.enabled) === 1;
          toggleSkillBtn.dataset.enabled = isOn ? '1' : '0';
          toggleSkillBtn.setAttribute('aria-checked', isOn ? 'true' : 'false');
          toggleSkillBtn.title = isOn ? 'Bấm để tạm tắt Skill này khỏi AI' : 'Bấm để bật lại Skill này cho AI';
          toggleSkillBtn.className = 'btn-toggle-mcp-skill inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold transition cursor-pointer ' +
            (isOn
              ? 'is-on bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              : 'bg-[#161436] border-[#2e2968] text-[#9492b8]');
          var lbl = toggleSkillBtn.querySelector('.skill-toggle-label');
          if (lbl) lbl.textContent = isOn ? 'Đang bật cho AI' : 'Đang tắt';

          var rowCard = document.querySelector('[data-skill-card="' + licId + '"]');
          if (rowCard) rowCard.classList.toggle('opacity-75', !isOn);

          var dot = document.querySelector('[data-scope-dot="' + licId + '"]');
          if (dot) {
            dot.classList.toggle('bg-emerald-400', isOn);
            dot.classList.toggle('bg-slate-500', !isOn);
          }

          var counter = document.getElementById('mcp-enabled-counter');
          if (counter && d.total_mcp_count != null) {
            counter.textContent = 'Đang bật ' + d.enabled_count + '/' + d.total_mcp_count + ' Skill cho AI';
          }
          var scopeCnt = document.getElementById('ai-scope-enabled-count');
          if (scopeCnt && d.enabled_count != null) {
            scopeCnt.textContent = String(d.enabled_count);
          }
          toast(d.message || (isOn ? 'Đã bật Skill cho AI' : 'Đã tạm tắt Skill khỏi AI'), 'success');
        })
        .catch(function (err) {
          toast((err.response && err.response.data && err.response.data.error) || 'Không thể cập nhật trạng thái Skill', 'error');
        })
        .finally(function () {
          toggleSkillBtn.disabled = false;
        });
      return;
    }

    // Open 1-click "Dùng Skill này" modal for a specific Skill
    var useSkillBtn = e.target.closest('.btn-use-skill');
    if (useSkillBtn) {
      e.preventDefault();
      var modal = document.getElementById('use-skill-modal');
      if (!modal) return;
      var slug = useSkillBtn.dataset.slug || '';
      var shortName = useSkillBtn.dataset.shortName || useSkillBtn.dataset.name || slug;
      var inputLabel = useSkillBtn.dataset.inputLabel || 'Chủ đề hoặc đường dẫn video của bạn (tuỳ chọn)';
      var placeholder = useSkillBtn.dataset.placeholder || 'Nhập yêu cầu của bạn...';
      var tmpl = useSkillBtn.dataset.promptTemplate || '';
      var dlHref = useSkillBtn.dataset.downloadHref || '';

      modal.dataset.activeSlug = slug;
      modal.dataset.promptTemplate = tmpl;

      var titleEl = document.getElementById('use-skill-modal-title');
      if (titleEl) titleEl.textContent = 'Dùng ngay: ' + shortName;
      var lblEl = document.getElementById('use-skill-input-label');
      if (lblEl) lblEl.textContent = '1. ' + inputLabel + ':';
      var inp = document.getElementById('use-skill-user-input');
      var preview = document.getElementById('use-skill-prompt-preview');
      if (inp) {
        inp.value = '';
        inp.placeholder = placeholder;
      }
      if (preview) {
        preview.textContent = tmpl.replace('{{INPUT}}', '[nhập chủ đề hoặc đường dẫn video của bạn]');
      }
      var driveLink = document.getElementById('use-skill-drive-link');
      if (driveLink) {
        if (dlHref) {
          driveLink.href = dlHref;
          driveLink.classList.remove('hidden');
        } else {
          driveLink.classList.add('hidden');
        }
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (inp) setTimeout(function () { inp.focus(); }, 50);
      return;
    }

    // Close / copy / select-only actions inside "Dùng Skill này" modal
    var useModal = document.getElementById('use-skill-modal');
    if (useModal && !useModal.classList.contains('hidden')) {
      if (e.target === useModal || e.target.closest('#use-skill-close-btn')) {
        e.preventDefault();
        useModal.classList.add('hidden');
        useModal.classList.remove('flex');
        return;
      }
      var copyPromptBtn = e.target.closest('#use-skill-copy-btn');
      if (copyPromptBtn) {
        e.preventDefault();
        var prev = document.getElementById('use-skill-prompt-preview');
        var promptTxt = prev ? (prev.textContent || '').trim() : '';
        if (!promptTxt) return;
        navigator.clipboard.writeText(promptTxt).then(function () {
          toast('Đã chép câu nhắn! Dán vào Claude / ChatGPT / Antigravity để chạy ngay.', 'success');
          var sp = copyPromptBtn.querySelector('span');
          if (sp) {
            var old = sp.textContent;
            sp.textContent = 'Đã chép!';
            setTimeout(function () { sp.textContent = old; }, 1600);
          }
        }).catch(function () { toast('Không thể sao chép', 'error'); });
        return;
      }
      var selectOnlyBtn = e.target.closest('#use-skill-select-only');
      if (selectOnlyBtn) {
        e.preventDefault();
        var sSlug = useModal.dataset.activeSlug || '';
        useModal.classList.add('hidden');
        useModal.classList.remove('flex');
        var targetChip = document.querySelector('.ai-scope-chip[data-scope-slug="' + sSlug + '"]');
        if (targetChip) targetChip.click();
        var head = document.getElementById('ai-connect-heading');
        if (head && head.scrollIntoView) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Test MCP Connection button in My Products
    var mcpTestBtn = e.target.closest('.btn-test-mcp');
    if (mcpTestBtn) {
      e.preventDefault();
      var licId = Number(mcpTestBtn.dataset.licenseId);
      var outBox = document.getElementById('mcp-test-result-' + licId);
      var origHtml = mcpTestBtn.innerHTML;
      mcpTestBtn.disabled = true;
      mcpTestBtn.innerHTML = '<span class="spinner"></span> Đang kiểm tra MCP...';
      axios.post('/api/account/mcp/test', { license_id: licId })
        .then(function (r) {
          var d = r.data || {};
          var esc = function (s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          };
          if (outBox) {
            outBox.className = 'rounded-xl p-3.5 text-xs bg-emerald-500/15 border border-emerald-500/35 text-emerald-100 space-y-2';
            var toolsHtml = (d.tools || []).map(function (t) {
              return '<span class="inline-block px-2 py-0.5 rounded bg-black/35 border border-emerald-400/30 font-mono text-[11px] text-cyan-200">' + esc(t && t.name) + '</span>';
            }).join(' ');
            var srvName = esc(d.serverInfo && d.serverInfo.name ? d.serverInfo.name : 'MCP Server');
            var protoVer = esc(d.protocolVersion || '2025-03-26');
            outBox.innerHTML =
              '<div class="font-bold text-emerald-300 flex items-center gap-1.5"><i class="fas fa-circle-check"></i>Kết nối MCP thành công! (' + srvName + ' · Protocol ' + protoVer + ')</div>' +
              '<div class="text-[#d6d4ee]">Endpoint: <code class="font-mono text-cyan-200 break-all">' + esc(d.endpoint) + '</code></div>' +
              (toolsHtml ? '<div class="flex flex-wrap gap-1.5 items-center"><span class="text-emerald-200 font-semibold">Tools sẵn sàng (' + (d.tools || []).length + '):</span> ' + toolsHtml + '</div>' : '');
            outBox.classList.remove('hidden');
          }
          toast('Kết nối MCP hoạt động tốt!', 'success');
        })
        .catch(function (err) {
          var msg = (err.response && err.response.data && err.response.data.error) || 'Không thể kết nối MCP Server';
          if (outBox) {
            outBox.className = 'rounded-xl p-3 text-xs bg-rose-500/15 border border-rose-500/35 text-rose-200';
            outBox.textContent = 'Lỗi kiểm tra MCP: ' + msg;
            outBox.classList.remove('hidden');
          }
          toast(msg, 'error');
        })
        .finally(function () {
          mcpTestBtn.disabled = false;
          mcpTestBtn.innerHTML = origHtml;
        });
      return;
    }

    // Smooth Tabs (with ARIA state sync)
    var tabBtn = e.target.closest('.tab-btn');
    if (tabBtn) {
      e.preventDefault();
      var group = tabBtn.dataset.group || 'default';
      document.querySelectorAll('.tab-btn[data-group="' + group + '"]').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel[data-group="' + group + '"]').forEach(function (p) {
        p.classList.add('hidden');
      });
      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
      var panel = document.querySelector('.tab-panel[data-tab="' + tabBtn.dataset.tab + '"][data-group="' + group + '"]');
      if (panel) panel.classList.remove('hidden');
      return;
    }

    // FAQ accordion (with ARIA state sync)
    var faq = e.target.closest('.faq-q');
    if (faq) {
      var item = faq.parentElement;
      var body = item.querySelector('.faq-a');
      var icon = faq.querySelector('.faq-icon');
      var open = !body.classList.contains('hidden');
      body.classList.toggle('hidden', open);
      faq.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (icon) icon.style.transform = open ? '' : 'rotate(45deg)';
      return;
    }

    // PJAX internal link interception
    var a = e.target.closest('a[href]');
    if (a) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-pjax')) return;
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
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-pjax')) return;
    if (!canPjaxUrl(a.href)) return;
    clearTimeout(hoverPrefetchTimer);
    hoverPrefetchTimer = setTimeout(function () { prefetchUrl(a.href); }, 35);
  }, true);

  document.addEventListener('touchstart', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    var a = e.target.closest('a[href]');
    if (a && a.target !== '_blank' && !a.hasAttribute('data-no-pjax') && canPjaxUrl(a.href)) prefetchUrl(a.href);
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

  // Live prompt update when user types custom topic/video path in "Dùng Skill này" modal
  document.addEventListener('input', function (e) {
    if (!e.target || e.target.id !== 'use-skill-user-input') return;
    var modal = document.getElementById('use-skill-modal');
    var preview = document.getElementById('use-skill-prompt-preview');
    if (!modal || !preview) return;
    var tmpl = modal.dataset.promptTemplate || '';
    var val = (e.target.value || '').trim();
    preview.textContent = tmpl.replace('{{INPUT}}', val || '[nhập chủ đề hoặc đường dẫn video của bạn]');
  });

  // Global Keyboard Shortcuts: "/" or "Ctrl+K" focuses header search; "Escape" closes menus
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var useM = document.getElementById('use-skill-modal');
      if (useM && !useM.classList.contains('hidden')) {
        useM.classList.add('hidden');
        useM.classList.remove('flex');
        return;
      }
      var dd = document.getElementById('user-dropdown');
      var ub = document.getElementById('user-menu-btn');
      if (dd && !dd.classList.contains('hidden')) {
        dd.classList.add('hidden');
        if (ub) { ub.setAttribute('aria-expanded', 'false'); ub.focus(); }
      }
      var mn = document.getElementById('mobile-nav');
      var mb = document.getElementById('mobile-menu-btn');
      if (mn && !mn.classList.contains('hidden')) {
        mn.classList.add('hidden');
        if (mb) {
          mb.setAttribute('aria-expanded', 'false');
          var mic = mb.querySelector('i');
          if (mic) mic.className = 'fas fa-bars';
          mb.focus();
        }
      }
      return;
    }

    var isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
    var isCmdK = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey);
    if (!isSlash && !isCmdK) return;

    var active = document.activeElement;
    var tag = active ? active.tagName.toLowerCase() : '';
    if (isSlash && (tag === 'input' || tag === 'textarea' || tag === 'select' || (active && active.isContentEditable))) return;

    var searchInput = document.getElementById('header-search');
    if (searchInput) {
      e.preventDefault();
      searchInput.focus();
      if (searchInput.select) searchInput.select();
    }
  });

  // Back to top button scroll visibility
  var topBtn = document.getElementById('back-to-top');
  if (topBtn) {
    topBtn.onclick = function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };
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
