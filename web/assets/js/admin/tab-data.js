// =====================================================================
// admin/tab-data.js — TAB "DATA": nama mempelai, orang tua, teks
// pembuka, RSVP aktif/tidak, link (slug), status, dan hapus undangan.
// Batas panjang isian mengikuti 01_tabel.sql.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { db, ui } = window.Admin;
  const { el, field } = ui;

  function dangerZone(inv) {
    const btn = el('button', { class: 'btn btn--danger btn--block', type: 'button' }, 'Hapus undangan ini');
    btn.addEventListener('click', async () => {
      const ok = await ui.confirmBox(
        'Undangan beserta semua acara, foto, amplop, dan RSVP-nya akan dihapus permanen. Tidak bisa dibatalkan.',
        { okLabel: 'Hapus permanen', mustType: inv.slug },
      );
      if (!ok) return;
      await ui.busy(btn, 'Menghapus…', async () => {
        await db.remove('invitations', inv.id);
        db.storage.removeFolder(inv.id).catch((err) => console.warn('File undangan gagal dihapus:', err));
        ui.toast('Undangan dihapus.');
        location.hash = '#/';
      });
    });
    return el('section', { class: 'card card--danger stack' },
      el('h2', { class: 'card-title' }, 'Zona berbahaya'),
      el('p', { class: 'muted small' }, 'Hapus hanya jika undangan sudah tidak dipakai.'),
      btn,
    );
  }

  // Pilihan template bergambar (daftar dari config.js → TEMPLATES).
  // Tiap kartu: gambar contoh sampul + nama + keterangan. Geser ke samping.
  function templatePicker(inv, onChange) {
    const current = cfg.TEMPLATES[inv.template] ? inv.template : 'klasik';
    const chosenName = el('strong', {});
    const demoLink = el('a', { class: 'btn btn--ghost btn--sm', target: '_blank', rel: 'noopener' },
      'Lihat contoh lengkap');
    const previewLink = el('a', { class: 'btn btn--ghost btn--sm', target: '_blank', rel: 'noopener' },
      'Pratinjau dengan data ini');

    function select(key) {
      chosenName.textContent = cfg.TEMPLATES[key].label;
      demoLink.href = `/undangan/?u=demo&t=${encodeURIComponent(key)}&to=${encodeURIComponent('Tamu Undangan')}`;
      previewLink.href = `/undangan/?u=${encodeURIComponent(inv.slug)}&pratinjau=1&t=${encodeURIComponent(key)}`;
    }

    const cards = Object.entries(cfg.TEMPLATES).map(([key, tpl]) => {
      const radio = el('input', { type: 'radio', name: 'template', value: key, checked: key === current, class: 'visually-hidden' });
      radio.addEventListener('change', () => { select(key); onChange(key); });
      const thumb = el('img', {
        class: 'tpl__img', src: `/assets/contoh-template/${key}.jpg`, alt: `Contoh template ${tpl.label}`,
        loading: 'lazy', decoding: 'async', width: 390, height: 844,
      });
      thumb.style.background = tpl.color;   // warna template selama gambar dimuat
      return el('label', { class: 'tpl' },
        radio,
        thumb,
        el('span', { class: 'tpl__text' },
          el('strong', {}, tpl.label),
          el('small', {}, tpl.description),
        ),
        el('span', { class: 'tpl__check', 'aria-hidden': 'true' }, '✓'),
      );
    });

    select(current);
    const list = el('div', { class: 'tpl-list', role: 'radiogroup', 'aria-label': 'Template' }, cards);
    // Gulir supaya template yang sedang dipakai terlihat
    requestAnimationFrame(() => {
      const checked = list.querySelector('input:checked');
      if (checked) list.scrollLeft = checked.parentElement.offsetLeft - 16;
    });

    return {
      node: el('section', { class: 'card stack' },
        el('h2', { class: 'card-title' }, 'Template'),
        el('p', { class: 'muted small' }, 'Geser untuk melihat semua template, ketuk untuk memilih.'),
        list,
        el('p', { class: 'small' }, 'Terpilih: ', chosenName),
        el('div', { class: 'actions' }, demoLink, previewLink),
        el('small', { class: 'muted' }, 'Tekan Simpan di bawah untuk memakai template terpilih.'),
      ),
      value: () => list.querySelector('input:checked').value,
    };
  }

  window.Admin.tabs.data = function (inv, body) {
    const input = (value, maxlength) => el('input', { type: 'text', maxlength, value: value || '' });

    const groom = input(inv.groom_name, 100);
    const groomParents = input(inv.groom_parents, 200);
    const bride = input(inv.bride_name, 100);
    const brideParents = input(inv.bride_parents, 200);
    const opening = el('textarea', { rows: 5, maxlength: 2000, placeholder: cfg.TEXT.openingDefault, value: inv.opening_text || '' });
    const rsvp = el('input', { type: 'checkbox', checked: inv.rsvp_enabled });
    const slug = el('input', {
      type: 'text', maxlength: 60, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: inv.slug,
    });
    const status = el('select', { value: inv.status },
      el('option', { value: 'draft' }, 'Draft (belum bisa dibuka tamu)'),
      el('option', { value: 'published' }, 'Terbit (bisa dibuka tamu)'),
      el('option', { value: 'archived' }, 'Arsip (ditutup)'),
    );
    const save = el('button', { class: 'btn btn--block', type: 'submit' }, 'Simpan');

    // Teks pembuka bawaan bisa berbeda per template (mis. salam di template Islami)
    const openingFor = (key) => ((cfg.TEMPLATES[key] || {}).TEXT || {}).openingDefault || cfg.TEXT.openingDefault;
    const template = templatePicker(inv, (key) => { opening.placeholder = openingFor(key); });
    opening.placeholder = openingFor(template.value());

    const form = el('form', { class: 'stack', novalidate: true },
      template.node,
      el('section', { class: 'card stack' },
        el('h2', { class: 'card-title' }, 'Mempelai'),
        field('Nama lengkap mempelai pria', groom),
        field('Orang tua mempelai pria', groomParents, 'Contoh: Bapak Ahmad & Ibu Siti'),
        field('Nama lengkap mempelai wanita', bride),
        field('Orang tua mempelai wanita', brideParents),
      ),
      el('section', { class: 'card stack' },
        el('h2', { class: 'card-title' }, 'Teks & RSVP'),
        field('Teks pembuka', opening, 'Kosongkan untuk memakai teks bawaan.'),
        ui.checkbox('Tamu boleh mengisi RSVP & ucapan', rsvp),
      ),
      el('section', { class: 'card stack' },
        el('h2', { class: 'card-title' }, 'Link & status'),
        field('Link undangan', slug, 'Jika diubah, link lama yang sudah dibagikan tidak bisa dibuka lagi.'),
        field('Status', status),
      ),
      save,
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const row = {
        groom_name: groom.value.trim(),
        groom_parents: ui.orNull(groomParents.value),
        bride_name: bride.value.trim(),
        bride_parents: ui.orNull(brideParents.value),
        opening_text: ui.orNull(opening.value),
        rsvp_enabled: rsvp.checked,
        slug: ui.slugify(slug.value),
        status: status.value,
        template: template.value(),
      };
      if (!row.groom_name || !row.bride_name) return ui.toast('Nama kedua mempelai wajib diisi.', 'error');
      if (!ui.isValidSlug(row.slug)) return ui.toast('Link minimal 3 karakter: huruf kecil, angka, tanda -.', 'error');
      if (row.slug !== inv.slug && inv.status === 'published') {
        const ok = await ui.confirmBox(
          `Link akan berubah dari /${inv.slug} menjadi /${row.slug}. Link lama yang sudah dibagikan ke tamu tidak bisa dibuka lagi.`,
          { okLabel: 'Ya, ubah link', danger: false },
        );
        if (!ok) return;
      }
      await ui.busy(save, 'Menyimpan…', async () => {
        await db.update('invitations', inv.id, row);
        ui.toast('Data disimpan.');
        window.Admin.app.render();
      });
    });

    body.append(form, dangerZone(inv));
  };
})();
