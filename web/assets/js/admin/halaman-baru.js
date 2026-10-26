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
    const slug = el('input', {
      type: 'text', maxlength: 60, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    });
    const preview = el('small', { class: 'link-preview' });
    const btn = el('button', { class: 'btn btn--block', type: 'submit' }, 'Buat undangan');

    // Link dibuat otomatis dari nama depan, sampai pengguna mengubahnya sendiri
    let slugEdited = false;
    function sync() {
      if (!slugEdited) slug.value = ui.slugify(`${ui.firstName(groom.value)} ${ui.firstName(bride.value)}`);
      preview.textContent = ui.publicLink(slug.value || '…');
    }
    groom.addEventListener('input', sync);
    bride.addEventListener('input', sync);
    slug.addEventListener('input', () => {
      slugEdited = true;
      slug.value = slug.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-');
      preview.textContent = ui.publicLink(slug.value || '…');
    });
    slug.addEventListener('change', () => { slug.value = ui.slugify(slug.value); sync(); });

    const form = el('form', { class: 'card stack', novalidate: true },
      field('Nama lengkap mempelai pria', groom),
      field('Nama lengkap mempelai wanita', bride),
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
      if (!row.groom_name || !row.bride_name) return ui.toast('Isi nama kedua mempelai.', 'error');
      if (!ui.isValidSlug(row.slug)) return ui.toast('Link minimal 3 karakter: huruf kecil, angka, tanda -.', 'error');

      ui.busy(btn, 'Membuat…', async () => {
        const inv = await db.insert('invitations', row);
        ui.toast('Undangan dibuat (masih draft).');
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
