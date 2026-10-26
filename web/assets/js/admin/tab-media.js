// =====================================================================
// admin/tab-media.js — TAB "FOTO & MUSIK": foto sampul, galeri, musik.
// Foto dikompres otomatis (lihat gambar.js) lalu disimpan di Storage
// dengan pola <id-undangan>/..., sesuai aturan 04_storage.sql.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { db, ui, gambar } = window.Admin;
  const { el } = ui;
  const A = cfg.ADMIN;

  function compressPhoto(file) {
    return gambar.compress(file, { maxSize: A.PHOTO_MAX_SIZE, targetKB: A.PHOTO_TARGET_KB });
  }

  // Upload file lalu simpan lokasinya ke database. Jika database menolak,
  // file yang baru di-upload dihapus lagi supaya tidak jadi sampah.
  async function uploadThenSave(path, blob, type, save) {
    await db.storage.upload(path, blob, type);
    try {
      return await save();
    } catch (err) {
      db.storage.forget(path);
      throw err;
    }
  }

  // ---------- Foto sampul ----------

  function coverSection(inv) {
    const box = el('div', { class: 'stack' });

    async function setCover(path) {
      const old = inv.cover_photo_path;
      Object.assign(inv, await db.update('invitations', inv.id, { cover_photo_path: path }));
      db.storage.forget(old);
      draw();
    }

    function draw() {
      const remove = inv.cover_photo_path && el('button', { class: 'btn btn--ghost btn--danger-text', type: 'button' }, 'Hapus');
      if (remove) remove.addEventListener('click', async () => {
        if (!await ui.confirmBox('Hapus foto sampul?')) return;
        await ui.busy(remove, 'Menghapus…', async () => { await setCover(null); ui.toast('Foto sampul dihapus.'); });
      });

      const picker = ui.filePicker(inv.cover_photo_path ? 'Ganti foto' : 'Pilih foto', 'image/*', async ([file], label) => {
        label('Mengompres…');
        const img = await compressPhoto(file);
        label('Mengunggah…');
        const path = `${inv.id}/sampul-${ui.uniqueName()}.${img.ext}`;
        await uploadThenSave(path, img.blob, img.type, () => setCover(path));
        ui.toast(`Foto sampul disimpan (${ui.kb(img.blob.size)}).`);
      });

      box.replaceChildren(
        inv.cover_photo_path
          ? el('img', { class: 'cover-preview', src: API.mediaUrl(inv.cover_photo_path), alt: 'Foto sampul' })
          : el('p', { class: 'muted' }, 'Belum ada foto sampul.'),
        el('div', { class: 'actions' }, remove, picker),
      );
    }

    draw();
    return el('section', { class: 'card stack' },
      el('h2', { class: 'card-title' }, 'Foto sampul'),
      el('p', { class: 'muted small' }, 'Tampil di bagian atas undangan. Foto tegak (portrait) paling bagus.'),
      box,
    );
  }

  // ---------- Galeri ----------

  async function gallerySection(inv) {
    const photos = await db.select('invitation_photos',
      `select=*&invitation_id=eq.${inv.id}&order=sort_order,created_at`);
    const grid = el('ul', { class: 'photo-grid' });
    const count = el('p', { class: 'muted small' });

    // Simpan urutan baru: hanya foto yang nomor urutnya berubah yang dikirim
    async function saveOrder() {
      await Promise.all(photos.map((p, i) => {
        if (p.sort_order === i) return null;
        p.sort_order = i;
        return db.update('invitation_photos', p.id, { sort_order: i });
      }));
    }

    function tool(label, text, onClick, extraClass) {
      const b = el('button', { class: `icon-btn ${extraClass || ''}`, type: 'button', 'aria-label': label, title: label }, text);
      b.addEventListener('click', () => ui.busy(b, null, onClick));
      return b;
    }

    function item(p, i) {
      const move = (dir) => async () => {
        [photos[i], photos[i + dir]] = [photos[i + dir], photos[i]];
        draw();
        await saveOrder();
      };
      const remove = async () => {
        if (!await ui.confirmBox('Hapus foto ini dari galeri?')) return;
        await db.remove('invitation_photos', p.id);
        db.storage.forget(p.storage_path);
        photos.splice(photos.indexOf(p), 1);
        draw();
        ui.toast('Foto dihapus.');
      };
      const prev = tool('Geser ke depan', '←', move(-1));
      const next = tool('Geser ke belakang', '→', move(1));
      prev.disabled = i === 0;
      next.disabled = i === photos.length - 1;
      return el('li', { class: 'photo' },
        el('img', { src: API.mediaUrl(p.storage_path), alt: `Foto ${i + 1}`, loading: 'lazy', decoding: 'async' }),
        el('div', { class: 'photo__tools' }, prev, next, tool('Hapus foto', '✕', remove, 'icon-btn--danger')),
      );
    }

    function draw() {
      grid.replaceChildren(...photos.map(item));
      count.textContent = photos.length
        ? `${photos.length} foto. Disarankan 6–12 foto supaya undangan tetap ringan.`
        : 'Belum ada foto. Disarankan 6–12 foto.';
    }

    const picker = ui.filePicker('+ Tambah foto', 'image/*', async (files, label) => {
      let done = 0;
      for (const file of files) {
        label(`Mengunggah ${done + 1} dari ${files.length}…`);
        const img = await compressPhoto(file);
        const path = `${inv.id}/galeri/${ui.uniqueName()}.${img.ext}`;
        const order = photos.length ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0;
        const row = await uploadThenSave(path, img.blob, img.type, () =>
          db.insert('invitation_photos', { invitation_id: inv.id, storage_path: path, sort_order: order }));
        photos.push(row);
        done++;
        draw();
      }
      ui.toast(`${done} foto ditambahkan.`);
    }, { multiple: true });

    draw();
    return el('section', { class: 'card stack' },
      el('h2', { class: 'card-title' }, 'Galeri'),
      count,
      grid,
      picker,
    );
  }

  // ---------- Musik ----------

  function musicSection(inv) {
    const box = el('div', { class: 'stack' });

    async function setMusic(path) {
      const old = inv.music_path;
      Object.assign(inv, await db.update('invitations', inv.id, { music_path: path }));
      db.storage.forget(old);
      draw();
    }

    function draw() {
      const remove = inv.music_path && el('button', { class: 'btn btn--ghost btn--danger-text', type: 'button' }, 'Hapus');
      if (remove) remove.addEventListener('click', async () => {
        if (!await ui.confirmBox('Hapus musik?')) return;
        await ui.busy(remove, 'Menghapus…', async () => { await setMusic(null); ui.toast('Musik dihapus.'); });
      });

      const picker = ui.filePicker(inv.music_path ? 'Ganti musik' : 'Pilih MP3', 'audio/mpeg,.mp3', async ([file], label) => {
        const isMp3 = file.type === 'audio/mpeg' || file.type === 'audio/mp3' || /\.mp3$/i.test(file.name);
        if (!isMp3) throw new Error('Pilih file MP3.');
        if (file.size > A.MUSIC_MAX_MB * 1024 * 1024) {
          throw new Error(`Ukuran musik maksimal ${A.MUSIC_MAX_MB} MB. Potong lagunya jadi lebih pendek.`);
        }
        label('Mengunggah…');
        const path = `${inv.id}/musik-${ui.uniqueName()}.mp3`;
        await uploadThenSave(path, file, 'audio/mpeg', () => setMusic(path));
        ui.toast('Musik disimpan.');
      });

      box.replaceChildren(
        inv.music_path
          ? el('audio', { controls: true, preload: 'none', src: API.mediaUrl(inv.music_path) })
          : el('p', { class: 'muted' }, 'Belum ada musik.'),
        el('div', { class: 'actions' }, remove, picker),
      );
    }

    draw();
    return el('section', { class: 'card stack' },
      el('h2', { class: 'card-title' }, 'Musik'),
      el('p', { class: 'muted small' },
        `MP3, maksimal ${A.MUSIC_MAX_MB} MB. Saran: potong lagu jadi 1–2 menit (±2 MB) supaya hemat kuota.`),
      box,
    );
  }

  window.Admin.tabs.media = async function (inv, body) {
    body.append(coverSection(inv), await gallerySection(inv), musicSection(inv));
  };
})();
