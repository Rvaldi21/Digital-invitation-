// =====================================================================
// admin/halaman-edit.js — HALAMAN SATU UNDANGAN
// Berisi kartu status (draft/terbit) dan tab-tab: Data, Acara, Foto &
// musik, Amplop, RSVP, Bagikan. Isi tiap tab ada di file tab-*.js.
// =====================================================================

(function () {
  const { db, ui } = window.Admin;
  const { el } = ui;

  const TABS = [
    ['data', 'Data'],
    ['acara', 'Acara'],
    ['media', 'Foto & musik'],
    ['amplop', 'Amplop'],
    ['rsvp', 'RSVP'],
    ['bagikan', 'Bagikan'],
  ];

  const STATUS_INFO = {
    draft: 'Tamu belum bisa membuka undangan ini.',
    published: 'Tamu sudah bisa membuka undangan ini.',
    archived: 'Undangan ditutup, tamu tidak bisa membukanya.',
  };

  function statusCard(inv) {
    const publish = inv.status !== 'published';
    const btn = el('button', { class: publish ? 'btn btn--sm' : 'btn btn--ghost btn--sm', type: 'button' },
      publish ? 'Terbitkan' : 'Jadikan draft');
    btn.addEventListener('click', () => ui.busy(btn, 'Menyimpan…', async () => {
      await db.update('invitations', inv.id, { status: publish ? 'published' : 'draft' });
      ui.toast(publish ? 'Undangan diterbitkan. Tamu sudah bisa membukanya.' : 'Undangan dijadikan draft.');
      window.Admin.app.render();
    }));

    return el('div', { class: `status-card status-card--${inv.status}` },
      el('div', {},
        el('p', {}, el('strong', {}, 'Status: '), ui.statusBadge(inv.status)),
        el('p', { class: 'muted small' }, STATUS_INFO[inv.status]),
      ),
      el('div', { class: 'actions' },
        inv.status === 'published' && el('a', {
          class: 'btn btn--ghost btn--sm', href: ui.publicLink(inv.slug), target: '_blank', rel: 'noopener',
        }, 'Lihat'),
        btn,
      ),
    );
  }

  window.Admin.views.edit = async function (id, tab) {
    const rows = /^[0-9a-f-]{36}$/.test(id)
      ? await db.select('invitations', `select=*&id=eq.${id}`)
      : [];
    const inv = rows[0];
    if (!inv) {
      return el('div', { class: 'stack' },
        el('a', { class: 'back', href: '#/' }, '← Semua undangan'),
        el('p', { class: 'card' }, 'Undangan tidak ditemukan. Mungkin sudah dihapus.'),
      );
    }

    const current = TABS.some(([key]) => key === tab) ? tab : 'data';
    const body = el('div', { class: 'tab-body stack' });

    await window.Admin.tabs[current](inv, body);

    return el('div', { class: 'stack' },
      el('a', { class: 'back', href: '#/' }, '← Semua undangan'),
      el('div', {},
        el('h1', { class: 'page-title' }, `${inv.groom_name} & ${inv.bride_name}`),
        el('p', { class: 'muted small' }, `/${inv.slug}`),
      ),
      statusCard(inv),
      el('nav', { class: 'tabs', 'aria-label': 'Bagian undangan' },
        TABS.map(([key, label]) => el('a', {
          class: key === current ? 'tab is-active' : 'tab',
          href: `#/u/${inv.id}/${key}`,
          'aria-current': key === current ? 'page' : null,
        }, label)),
      ),
      body,
    );
  };
})();
