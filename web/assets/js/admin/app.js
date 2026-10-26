// =====================================================================
// admin/app.js — PENGATUR HALAMAN PANEL ADMIN
//
// Alamat halaman ditulis setelah tanda #:
//   /admin/#/                  daftar undangan
//   /admin/#/baru              buat undangan baru
//   /admin/#/u/<id>/<tab>      edit satu undangan (tab: data, acara, ...)
// Belum login → selalu tampil halaman masuk.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { auth, db, ui, views } = window.Admin;
  const { el } = ui;

  const app = document.getElementById('app');
  const logoutBtn = document.getElementById('logout-btn');

  let role = null;        // dicek sekali setelah login
  let notice = null;      // pesan untuk halaman masuk (mis. sesi habis)
  let ticket = 0;         // mencegah halaman lama menimpa halaman baru
  let lastPage = '';

  function route() {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  }

  function errorView(err) {
    const retry = el('button', { class: 'btn', type: 'button', onclick: render }, 'Coba lagi');
    return el('div', { class: 'card stack' },
      el('p', { class: 'form-msg form-msg--error' }, err.message || 'Terjadi kesalahan.'),
      retry,
    );
  }

  async function render() {
    const my = ++ticket;
    const mount = (node) => { if (my === ticket) app.replaceChildren(node); };

    logoutBtn.hidden = !auth.isLoggedIn();

    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) {
      return mount(el('p', { class: 'card' },
        'Panel admin butuh koneksi Supabase. Isi SUPABASE_URL dan SUPABASE_KEY di config.js.'));
    }

    if (!auth.isLoggedIn()) {
      role = null;
      mount(views.login(notice));
      notice = null;
      return;
    }

    // Tampilkan "Memuat…" hanya jika lama, supaya tidak berkedip
    const loading = setTimeout(() => mount(el('p', { class: 'loading' }, 'Memuat…')), 300);
    try {
      if (!role) {
        const me = await db.select('profiles', `select=role&id=eq.${auth.user().id}`);
        role = me[0] && me[0].role;
        if (role !== 'admin') {
          await auth.logout();
          notice = 'Akun ini bukan admin. Masuk dengan akun admin.';
          return render();
        }
      }

      const [page, id, tab] = route();
      let node;
      if (page === 'baru') node = await views.baru();
      else if (page === 'u' && id) node = await views.edit(id, tab);
      else node = await views.daftar();

      clearTimeout(loading);
      mount(node);

      // Pindah halaman → gulir ke atas; ganti tab di undangan yang sama → tetap
      const pageKey = `${page || ''}/${id || ''}`;
      if (pageKey !== lastPage && my === ticket) window.scrollTo(0, 0);
      lastPage = pageKey;
    } catch (err) {
      clearTimeout(loading);
      console.error(err);
      if (err.sessionExpired || !auth.isLoggedIn()) return render();
      mount(errorView(err));
    }
  }

  logoutBtn.addEventListener('click', async () => {
    await auth.logout();
    location.hash = '#/';
    render();
  });

  window.addEventListener('admin:sesi-habis', () => {
    notice = 'Sesi login sudah habis. Silakan masuk lagi.';
    render();
  });
  window.addEventListener('hashchange', render);

  window.Admin.app = { render };
  render();
})();
