// =====================================================================
// admin/tab-acara.js — TAB "ACARA": Akad, Resepsi, dst.
// Acara diurutkan menurut jam mulai. Hitung mundur di undangan memakai
// acara paling awal. Jam diisi dalam zona waktu dari config.js.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { db, ui } = window.Admin;
  const { el, field } = ui;

  window.Admin.tabs.acara = async function (inv, body) {
    const events = await db.select('invitation_events',
      `select=*&invitation_id=eq.${inv.id}&order=starts_at`);
    const list = el('div', { class: 'stack' });

    function card(ev) {
      let saved = ev;   // null = acara baru, belum tersimpan
      const defaultTitle = list.children.length ? 'Resepsi' : 'Akad Nikah';
      const title = el('input', { type: 'text', maxlength: 100, value: ev ? ev.title : defaultTitle });
      const starts = el('input', { type: 'datetime-local', value: ui.toLocalInput(ev && ev.starts_at) });
      const ends = el('input', { type: 'datetime-local', value: ui.toLocalInput(ev && ev.ends_at) });
      const venue = el('input', { type: 'text', maxlength: 200, value: (ev && ev.venue_name) || '' });
      const address = el('textarea', { rows: 2, maxlength: 500, value: (ev && ev.address) || '' });
      const maps = el('input', {
        type: 'url', inputmode: 'url', maxlength: 500, placeholder: 'https://maps.app.goo.gl/…',
        value: (ev && ev.maps_url) || '',
      });
      const save = el('button', { class: 'btn', type: 'submit' }, 'Simpan');
      const del = el('button', { class: 'btn btn--ghost btn--danger-text', type: 'button' }, 'Hapus');

      const form = el('form', { class: 'card stack', novalidate: true },
        field('Nama acara', title),
        field(`Mulai (${cfg.TIMEZONE_LABEL})`, starts),
        field(`Selesai (${cfg.TIMEZONE_LABEL})`, ends, 'Kosongkan jika ditulis "selesai".'),
        field('Nama tempat', venue, 'Contoh: Gedung Serbaguna Melati'),
        field('Alamat', address),
        field('Link Google Maps', maps, 'Di Google Maps: cari tempatnya → Bagikan → Salin link.'),
        el('div', { class: 'actions actions--split' }, del, save),
      );

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const row = {
          title: title.value.trim(),
          starts_at: ui.fromLocalInput(starts.value),
          ends_at: ui.fromLocalInput(ends.value),
          venue_name: ui.orNull(venue.value),
          address: ui.orNull(address.value),
          maps_url: ui.orNull(maps.value),
        };
        if (!row.title) return ui.toast('Nama acara wajib diisi.', 'error');
        if (!row.starts_at) return ui.toast('Isi tanggal dan jam mulai.', 'error');
        if (row.ends_at && new Date(row.ends_at) <= new Date(row.starts_at)) {
          return ui.toast('Jam selesai harus setelah jam mulai.', 'error');
        }
        if (row.maps_url && !/^https:\/\//.test(row.maps_url)) {
          return ui.toast('Link peta harus diawali https://', 'error');
        }
        await ui.busy(save, 'Menyimpan…', async () => {
          saved = saved
            ? await db.update('invitation_events', saved.id, row)
            : await db.insert('invitation_events', { ...row, invitation_id: inv.id });
          ui.toast('Acara disimpan.');
        });
      });

      del.addEventListener('click', async () => {
        if (!saved) { form.remove(); return; }
        if (!await ui.confirmBox(`Hapus acara "${saved.title}"?`)) return;
        await ui.busy(del, 'Menghapus…', async () => {
          await db.remove('invitation_events', saved.id);
          form.remove();
          ui.toast('Acara dihapus.');
        });
      });

      return form;
    }

    events.forEach((ev) => list.append(card(ev)));
    if (!events.length) list.append(card(null));

    const add = el('button', { class: 'btn btn--ghost btn--block', type: 'button' }, '+ Tambah acara');
    add.addEventListener('click', () => {
      const c = card(null);
      list.append(c);
      c.querySelector('input').focus();
    });

    body.append(
      el('p', { class: 'muted small' }, 'Tekan "Simpan" di tiap kartu acara setelah mengubahnya.'),
      list,
      add,
    );
  };
})();
