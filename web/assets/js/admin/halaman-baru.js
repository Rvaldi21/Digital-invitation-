// =====================================================================
// admin/halaman-baru.js — BUAT UNDANGAN BARU
// Cukup isi nama mempelai & link. Detail lain diisi di halaman edit.
// Undangan baru selalu berstatus draft (belum bisa dibuka tamu).
// =====================================================================

(function () {
  const { db, ui } = window.Admin;
  const { el, field } = ui;

  window.Admin.views.baru = function () {
    const groom = el('input', { type: 'text', maxlength: 100, autocomplete: 'off', required: true });
    const bride = el('input', { type: 'text', maxlength: 100, autocomplete: 'off', required: true });
    const groomNick = el('input', { type: 'text', maxlength: 40, autocomplete: 'off' });
    const brideNick = el('input', { type: 'text', maxlength: 40, autocomplete: 'off' });
    const slug = el('input', {
      type: 'text', maxlength: 60, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    });
    const preview = el('small', { class: 'link-preview' });
    const btn = el('button', { class: 'btn btn--block', type: 'submit' }, 'Buat undangan');

    // Link dibuat otomatis dari nama panggilan (kalau kosong: nama depan),
    // sampai pengguna mengubahnya sendiri
    let slugEdited = false;
    function sync() {
      groomNick.placeholder = ui.firstName(groom.value);
      brideNick.placeholder = ui.firstName(bride.value);
      if (!slugEdited) {
        slug.value = ui.slugify(`${ui.callName(groomNick.value, groom.value)} ${ui.callName(brideNick.value, bride.value)}`);
      }
      preview.textContent = ui.publicLink(slug.value || '…');
    }
    [groom, bride, groomNick, brideNick].forEach((i) => i.addEventListener('input', sync));
    slug.addEventListener('input', () => {
      slugEdited = true;
      slug.value = slug.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-');
      preview.textContent = ui.publicLink(slug.value || '…');
    });
    slug.addEventListener('change', () => { slug.value = ui.slugify(slug.value); sync(); });

    const form = el('form', { class: 'card stack', novalidate: true },
      field('Nama lengkap mempelai pria', groom),
      field('Nama panggilan mempelai pria', groomNick, 'Opsional. Kosongkan untuk memakai nama depan.'),
      field('Nama lengkap mempelai wanita', bride),
      field('Nama panggilan mempelai wanita', brideNick, 'Opsional.'),
      field('Link undangan', slug, 'Huruf kecil, angka, dan tanda - saja. Contoh: aldi-alfin'),
      preview,
      btn,
    );

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const row = {
        groom_name: groom.value.trim(),
        bride_name: bride.value.trim(),
        slug: ui.slugify(slug.value),
      };
      const nick = { groom_nickname: ui.orNull(groomNick.value), bride_nickname: ui.orNull(brideNick.value) };
      if (nick.groom_nickname || nick.bride_nickname) Object.assign(row, nick);
      if (!row.groom_name || !row.bride_name) return ui.toast('Isi nama kedua mempelai.', 'error');
      if (!ui.isValidSlug(row.slug)) return ui.toast('Link minimal 3 karakter: huruf kecil, angka, tanda -.', 'error');

      ui.busy(btn, 'Membuat…', async () => {
        let inv;
        try {
          inv = await db.insert('invitations', row);
          ui.toast('Undangan dibuat (masih draft).');
        } catch (err) {
          // Kolom nama panggilan belum ada (SQL 07 belum dijalankan) → simpan tanpa nama panggilan
          if (!/nickname/i.test(err.message)) throw err;
          delete row.groom_nickname;
          delete row.bride_nickname;
          inv = await db.insert('invitations', row);
          ui.toast('Undangan dibuat, tapi nama panggilan belum tersimpan: jalankan supabase/07_nama_panggilan.sql dulu.', 'error');
        }
        location.hash = `#/u/${inv.id}/data`;
      });
    });

    sync();
    return el('div', { class: 'stack' },
      el('a', { class: 'back', href: '#/' }, '← Semua undangan'),
      el('h1', { class: 'page-title' }, 'Undangan baru'),
      form,
    );
  };
})();
