/* ============ SrcTool AI - Admin ============ */
(function () {
  'use strict';

  var btn = document.getElementById('admin-menu-btn');
  if (btn) btn.onclick = function () {
    var sb = document.getElementById('admin-sidebar');
    sb.classList.toggle('hidden');
    sb.classList.toggle('flex');
  };

  document.addEventListener('click', async function (e) {
    /* Delete generic */
    var del = e.target.closest('.btn-delete');
    if (del) {
      e.preventDefault();
      if (!confirm('Bạn chắc chắn muốn xoá "' + (del.dataset.name || 'mục này') + '"?\nHành động này không thể hoàn tác.')) return;
      try {
        await axios.delete(del.dataset.url);
        toast('Đã xoá thành công', 'success');
        setTimeout(function () { location.reload(); }, 700);
      } catch (err) {
        toast((err.response && err.response.data && err.response.data.error) || 'Không thể xoá', 'error');
      }
      return;
    }

    /* Order status */
    var oa = e.target.closest('.btn-order-action');
    if (oa) {
      e.preventDefault();
      var labels = { paid: 'xác nhận đã thanh toán', cancelled: 'huỷ', refunded: 'hoàn tiền' };
      if (!confirm('Bạn chắc chắn muốn ' + labels[oa.dataset.status] + ' đơn hàng này?')) return;
      var o = oa.innerHTML; oa.disabled = true; oa.innerHTML = '<span class="spinner"></span>';
      try {
        await axios.post('/api/admin/orders/' + oa.dataset.id + '/status', { status: oa.dataset.status });
        toast('Cập nhật thành công!', 'success');
        setTimeout(function () { location.reload(); }, 700);
      } catch (err) {
        oa.disabled = false; oa.innerHTML = o;
        toast((err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra', 'error');
      }
      return;
    }

    /* User action */
    var ua = e.target.closest('.btn-user-action');
    if (ua) {
      e.preventDefault();
      if (!confirm('Xác nhận thực hiện thao tác này?')) return;
      try {
        await axios.post('/api/admin/users/' + ua.dataset.id + '/action', { action: ua.dataset.action });
        toast('Cập nhật thành công!', 'success');
        setTimeout(function () { location.reload(); }, 700);
      } catch (err) {
        toast((err.response && err.response.data && err.response.data.error) || 'Có lỗi xảy ra', 'error');
      }
      return;
    }

    /* Ticket close */
    var tc = e.target.closest('.btn-ticket-close');
    if (tc) {
      e.preventDefault();
      try {
        await axios.post('/api/admin/tickets/' + tc.dataset.id + '/close');
        toast('Đã đánh dấu xử lý', 'success');
        setTimeout(function () { location.reload(); }, 700);
      } catch (err) { toast('Có lỗi xảy ra', 'error'); }
    }
  });

  /* Auto-slug from name/title */
  function slugify(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim()
      .replace(/\s+/g, '-').replace(/-+/g, '-');
  }
  document.querySelectorAll('input[name=name], input[name=title]').forEach(function (input) {
    var form = input.closest('form');
    if (!form) return;
    var slugInput = form.querySelector('input[name=slug]');
    if (!slugInput || slugInput.value) return;
    input.addEventListener('blur', function () {
      if (!slugInput.value) slugInput.value = slugify(input.value);
    });
  });
})();

/* ============================================================
   WEBHOOK NGÂN HÀNG — đối soát thủ công & sinh lại API key
   ============================================================ */

// Gán giao dịch lạc cho 1 đơn hàng
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-tx-match');
  if (!btn) return;
  const id = btn.dataset.id;
  const amount = btn.dataset.amount;
  const code = prompt(
    'Nhập mã đơn hàng cần gán cho giao dịch này (số tiền: ' +
    Number(amount).toLocaleString('vi-VN') + 'đ):\n\nVí dụ: DHAB12CD34'
  );
  if (!code) return;

  btn.disabled = true;
  const old = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    const r = await fetch('/api/admin/banktx/' + id + '/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_code: code.trim() })
    });
    const d = await r.json();
    if (d.ok) {
      toast(d.message || 'Đã đối soát thành công', 'success');
      setTimeout(() => location.reload(), 900);
    } else {
      toast(d.error || 'Đối soát thất bại', 'error');
      btn.disabled = false;
      btn.innerHTML = old;
    }
  } catch (err) {
    toast('Lỗi kết nối', 'error');
    btn.disabled = false;
    btn.innerHTML = old;
  }
});

// Sinh lại API key webhook
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#btn-regen-key');
  if (!btn) return;
  if (!confirm(
    'Tạo API key mới?\n\nKey cũ sẽ NGỪNG hoạt động ngay. ' +
    'Bạn phải cập nhật lại key mới trong dashboard SePay/Casso, ' +
    'nếu không webhook sẽ bị từ chối (401).'
  )) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    const r = await fetch('/api/admin/webhook/regenerate-key', { method: 'POST' });
    const d = await r.json();
    if (d.ok) {
      const input = document.getElementById('webhook-key');
      if (input) input.value = d.key;
      toast(d.message, 'success');
      setTimeout(() => location.reload(), 1200);
    } else {
      toast(d.error || 'Không tạo được key', 'error');
    }
  } catch (err) {
    toast('Lỗi kết nối', 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-rotate"></i>';
});
