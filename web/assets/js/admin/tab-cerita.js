// =====================================================================
// admin/tab-cerita.js — TAB "CERITA": love story (kisah perjalanan cinta).
// Disimpan sebagai daftar di kolom invitations.love_story:
//   [{ "date": "Maret 2021", "title": "Awal bertemu", "story": "..." }, ...]
// Butuh kolom dari supabase/06_cerita_foto_penutup.sql.
// =====================================================================

(function () {
  const { db, ui } = window.Admin;
  const { el, field } = ui;

  const MAX_ITEMS = 8;   // samakan dengan batas di 06_cerita_foto_penutup.sql

  // Kolom belum ada di database → minta pemilik menjalankan SQL 06 dulu
  function needsSql() {
    return el('section', { class: 'card stack' },
      el('h2', { class: 'card-title' }, 'Perlu satu langkah di Supabase'),
      el('p', { class: 'small' },
        'Fitur cerita belum aktif di database. Buka Supabase → SQL Editor → New query, ' +
        'tempel isi file supabase/06_cerita_foto_penutup.sql, lalu tekan Run. Setelah itu muat ulang halaman ini.'),
    );
  }

  window.Admin.tabs.cerita = function (inv, body) {
    if (!('love_story' in inv)) { body.append(needsSql()); return; }

    const items = (Array.isArray(inv.love_story) ? inv.love_story : [])
      .map((s) => ({ date: s.date || '', title: s.title || '', story: s.story || '' }));
    const list = el('div', { class: 'stack' });
    const add = el('button', { class: 'btn btn--ghost btn--block', type: 'button' }, '+ Tambah cerita');
    const save = el('button', { class: 'btn btn--block', type: 'button' }, 'Simpan cerita');

    function tool(label, text, onClick, extraClass) {
      const b = el('button', { class: `icon-btn ${extraClass || ''}`, type: 'button', 'aria-label': label, title: label }, text);
      b.addEventListener('click', onClick);
      return b;
    }

    function card(item, i) {
      const date = el('input', { type: 'text', maxlength: 40, placeholder: 'Contoh: Maret 2021', value: item.date });
      const title = el('input', { type: 'text', maxlength: 100, placeholder: 'Contoh: Awal bertemu', value: item.title });
      const story = el('textarea', { rows: 4, maxlength: 600, value: item.story });
      date.addEventListener('input', () => { item.date = date.value; });
      title.addEventListener('input', () => { item.title = title.value; });
      story.addEventListener('input', () => { item.story = story.value; });

      const move = (dir) => () => {
        [items[i], items[i + dir]] = [items[i + dir], items[i]];
        draw();
      };
      const up = tool('Pindah ke atas', '↑', move(-1));
      const down = tool('Pindah ke bawah', '↓', move(1));
      up.disabled = i === 0;
      down.disabled = i === items.length - 1;
      const remove = tool('Hapus cerita ini', '✕', async () => {
        if ((item.title || item.story) && !await ui.confirmBox(`Hapus cerita "${item.title || 'tanpa judul'}"?`)) return;
        items.splice(i, 1);
        draw();
      }, 'icon-btn--danger');

      return el('div', { class: 'card stack' },
        el('div', { class: 'actions actions--split' },
          el('strong', {}, `Cerita ${i + 1}`),
          el('div', { class: 'actions' }, up, down, remove),
        ),
        field('Waktu', date, 'Bebas: tahun, bulan, atau tanggal.'),
        field('Judul', title),
        field('Cerita', story, 'Maksimal 600 huruf. Singkat saja, 2–4 kalimat.'),
      );
    }

    function draw() {
      list.replaceChildren(...items.map(card));
      if (!items.length) list.append(el('p', { class: 'muted' }, 'Belum ada cerita. Bagian "Kisah kami" tidak tampil di undangan.'));
      add.disabled = items.length >= MAX_ITEMS;
      add.textContent = items.length >= MAX_ITEMS ? `Maksimal ${MAX_ITEMS} cerita` : '+ Tambah cerita';
    }

    add.addEventListener('click', () => {
      items.push({ date: '', title: '', story: '' });
      draw();
      list.lastElementChild.querySelector('input').focus();
    });

    save.addEventListener('click', () => ui.busy(save, 'Menyimpan…', async () => {
      const clean = items
        .map((s) => ({ date: s.date.trim(), title: s.title.trim(), story: s.story.trim() }))
        .filter((s) => s.title || s.story);
      Object.assign(inv, await db.update('invitations', inv.id, { love_story: clean }));
      items.splice(0, items.length, ...clean);
      draw();
      ui.toast(clean.length ? 'Cerita disimpan.' : 'Cerita dikosongkan.');
    }));

    draw();
    body.append(
      el('p', { class: 'muted small' },
        'Kisah perjalanan cinta mempelai, tampil sebagai garis waktu di undangan. ' +
        'Urutkan dari yang paling lama. Tekan "Simpan cerita" setelah selesai.'),
      list,
      add,
      save,
    );
  };
})();
