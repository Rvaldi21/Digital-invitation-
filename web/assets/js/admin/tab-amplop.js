// =====================================================================
// admin/tab-amplop.js — TAB "AMPLOP": rekening bank / e-wallet / QRIS.
// Aturan database: minimal (bank + nomor) ATAU gambar QRIS.
// Gambar QRIS baru di-upload saat tombol Simpan ditekan.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { db, ui, gambar } = window.Admin;
  const { el, field } = ui;
  const A = cfg.ADMIN;

  window.Admin.tabs.amplop = async function (inv, body) {
    const gifts = await db.select('gift_accounts',
      `select=*&invitation_id=eq.${inv.id}&order=sort_order`);
    const list = el('div', { class: 'stack' });

    function card(g) {
      let saved = g;             // null = belum tersimpan
      let newQris = null;        // gambar QRIS baru yang menunggu disimpan
      let dropQris = false;      // QRIS lama akan dihapus saat disimpan

      const bank = el('input', { type: 'text', maxlength: 50, placeholder: 'BCA, Mandiri, DANA, …', value: (g && g.bank_name) || '' });
      const holder = el('input', { type: 'text', maxlength: 100, value: (g && g.account_holder) || '' });
      const number = el('input', { type: 'text', inputmode: 'numeric', maxlength: 30, value: (g && g.account_number) || '' });
      const qrisBox = el('div', { class: 'stack' });
      const save = el('button', { class: 'btn', type: 'submit' }, 'Simpan');
      const del = el('button', { class: 'btn btn--ghost btn--danger-text', type: 'button' }, 'Hapus');

      const currentQris = () => (!dropQris && saved && saved.qris_path) || null;

      async function drawQris() {
        const has = newQris || currentQris();
        let preview;
        if (newQris) {
          preview = el('div', { class: 'stack' },
            el('img', { class: 'qris-preview', src: await gambar.toDataUrl(newQris.blob), alt: 'QRIS baru' }),
            el('p', { class: 'muted small' }, `QRIS baru (${ui.kb(newQris.blob.size)}). Tekan Simpan untuk menyimpan.`));
        } else if (has) {
          preview = el('img', { class: 'qris-preview', src: API.mediaUrl(has), alt: 'QRIS' });
        } else {
          preview = el('p', { class: 'muted small' }, 'Belum ada gambar QRIS.');
        }

        const remove = has && el('button', { class: 'btn btn--ghost btn--danger-text', type: 'button' }, 'Buang QRIS');
        if (remove) remove.addEventListener('click', () => { newQris = null; dropQris = true; drawQris(); });

        const picker = ui.filePicker(has ? 'Ganti QRIS' : 'Pilih gambar QRIS', 'image/*', async ([file], label) => {
          label('Memproses…');
          newQris = await gambar.compress(file, { maxSize: A.QRIS_MAX_SIZE, targetKB: 300, minQuality: 0.85 });
          await drawQris();
        }, { ghost: true });

        qrisBox.replaceChildren(preview, el('div', { class: 'actions' }, remove, picker));
      }

      const form = el('form', { class: 'card stack', novalidate: true },
        field('Bank / e-wallet', bank),
        field('Nomor rekening / nomor HP', number, 'Hanya angka, spasi, atau tanda -.'),
        field('Atas nama', holder),
        el('div', { class: 'field' }, el('span', {}, 'QRIS (opsional)'), qrisBox),
        el('div', { class: 'actions actions--split' }, del, save),
      );

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const row = {
          bank_name: ui.orNull(bank.value),
          account_holder: ui.orNull(holder.value),
          account_number: ui.orNull(number.value),
        };
        if (row.account_number && !/^[0-9 -]{4,30}$/.test(row.account_number)) {
          return ui.toast('Nomor hanya boleh angka, spasi, atau tanda - (minimal 4 digit).', 'error');
        }
        if (!(row.bank_name && row.account_number) && !newQris && !currentQris()) {
          return ui.toast('Isi nama bank + nomor, atau pilih gambar QRIS.', 'error');
        }

        await ui.busy(save, 'Menyimpan…', async () => {
          const oldQris = saved && saved.qris_path;
          let uploaded = null;
          if (newQris) {
            uploaded = `${inv.id}/qris-${ui.uniqueName()}.${newQris.ext}`;
            await db.storage.upload(uploaded, newQris.blob, newQris.type);
          }
          row.qris_path = uploaded || currentQris();
          try {
            saved = saved
              ? await db.update('gift_accounts', saved.id, row)
              : await db.insert('gift_accounts', {
                ...row, invitation_id: inv.id, sort_order: [...list.children].indexOf(form),
              });
          } catch (err) {
            if (uploaded) db.storage.forget(uploaded);
            throw err;
          }
          if (oldQris && oldQris !== saved.qris_path) db.storage.forget(oldQris);
          newQris = null;
          dropQris = false;
          await drawQris();
          ui.toast('Amplop disimpan.');
        });
      });

      del.addEventListener('click', async () => {
        if (!saved) { form.remove(); return; }
        if (!await ui.confirmBox('Hapus rekening/QRIS ini?')) return;
        await ui.busy(del, 'Menghapus…', async () => {
          await db.remove('gift_accounts', saved.id);
          db.storage.forget(saved.qris_path);
          form.remove();
          ui.toast('Dihapus.');
        });
      });

      drawQris();
      return form;
    }

    gifts.forEach((g) => list.append(card(g)));

    const add = el('button', { class: 'btn btn--ghost btn--block', type: 'button' }, '+ Tambah rekening / QRIS');
    add.addEventListener('click', () => {
      const c = card(null);
      list.append(c);
      c.querySelector('input').focus();
    });

    body.append(
      el('p', { class: 'muted small' },
        'Untuk e-wallet (DANA, OVO, GoPay): isi nama aplikasinya di kolom Bank dan nomor HP di kolom Nomor. ' +
        'Kosongkan semua jika undangan tidak memakai amplop digital.'),
      list,
      add,
    );
  };
})();
