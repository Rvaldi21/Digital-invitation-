// =====================================================================
// admin/tab-bagikan.js — TAB "BAGIKAN": buat link per nama tamu
// + pesan WhatsApp siap kirim. Teks pesan diatur di config.js →
// ADMIN.SHARE_MESSAGE. Daftar nama diingat di browser ini saja.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { ui } = window.Admin;
  const { el, field } = ui;

  window.Admin.tabs.bagikan = function (inv, body) {
    const storeKey = `undangan-admin-tamu-${inv.id}`;
    const couple = `${ui.firstName(inv.groom_name)} & ${ui.firstName(inv.bride_name)}`;

    const names = el('textarea', {
      rows: 6,
      placeholder: 'Budi Santoso\nKeluarga Bapak Ahmad\nRina & pasangan',
      value: (() => { try { return localStorage.getItem(storeKey) || ''; } catch { return ''; } })(),
    });
    const out = el('ul', { class: 'share-list' });

    function message(name, link) {
      return cfg.ADMIN.SHARE_MESSAGE
        .replaceAll('{nama}', name || cfg.TEXT.coverDefaultGuest)
        .replaceAll('{mempelai}', couple)
        .replaceAll('{link}', link);
    }

    function copyButton(label, text, done) {
      const b = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, label);
      b.addEventListener('click', () => ui.copyText(text).then(() => ui.toast(done)));
      return b;
    }

    function row(name) {
      const link = ui.publicLink(inv.slug, name);
      const text = message(name, link);
      return el('li', { class: 'share' },
        el('strong', {}, name || 'Link umum (tanpa nama)'),
        el('p', { class: 'share__link' }, link),
        el('div', { class: 'actions' },
          copyButton('Salin link', link, 'Link disalin.'),
          copyButton('Salin pesan', text, 'Pesan disalin.'),
          el('a', {
            class: 'btn btn--sm btn--wa',
            href: `https://wa.me/?text=${encodeURIComponent(text)}`,
            target: '_blank',
            rel: 'noopener noreferrer',
          }, 'Kirim WA'),
        ),
      );
    }

    function draw() {
      const list = [...new Set(names.value.split('\n')
        .map((s) => s.trim().replace(/\s+/g, ' ').slice(0, 100))
        .filter(Boolean))];
      out.replaceChildren(...(list.length ? list : ['']).map(row));
      try { localStorage.setItem(storeKey, names.value); } catch { /* tidak apa-apa */ }
    }

    names.addEventListener('input', draw);
    draw();

    if (inv.status !== 'published') {
      body.append(el('p', { class: 'form-msg form-msg--warn' },
        'Undangan masih belum terbit. Tamu baru bisa membuka link setelah Anda menekan "Terbitkan".'));
    }
    body.append(
      el('div', { class: 'card stack' },
        field('Nama tamu (satu nama per baris)', names,
          'Link dan pesan WhatsApp dibuat otomatis untuk tiap nama.'),
      ),
      out,
      el('p', { class: 'muted small' }, 'Teks pesan bisa diubah di config.js → ADMIN.SHARE_MESSAGE.'),
    );
  };
})();
