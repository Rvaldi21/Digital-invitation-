// =====================================================================
// admin/halaman-daftar.js — DAFTAR SEMUA UNDANGAN
// =====================================================================

(function () {
  const { db, ui } = window.Admin;
  const { el } = ui;

  window.Admin.views.daftar = async function () {
    const rows = await db.select('invitations',
      'select=id,slug,status,groom_name,bride_name,updated_at,invitation_events(starts_at),rsvps(count)' +
      '&order=updated_at.desc');

    const search = el('input', {
      type: 'search', placeholder: 'Cari nama atau link…', 'aria-label': 'Cari undangan',
    });
    const list = el('ul', { class: 'inv-list' });

    function card(r) {
      const firstEvent = (r.invitation_events || []).map((e) => e.starts_at).sort()[0];
      const rsvpCount = r.rsvps && r.rsvps[0] ? r.rsvps[0].count : 0;
      return el('li', {},
        el('a', { class: 'inv-card', href: `#/u/${r.id}` },
          el('div', { class: 'inv-card__top' },
            el('strong', {}, `${r.groom_name} & ${r.bride_name}`),
            ui.statusBadge(r.status),
          ),
          el('p', { class: 'muted small' }, `/${r.slug}`),
          el('p', { class: 'small' },
            firstEvent ? ui.fmtDate(firstEvent) : 'Belum ada acara',
            ` · ${rsvpCount} RSVP`,
          ),
        ),
      );
    }

    function draw() {
      const q = search.value.trim().toLowerCase();
      const shown = rows.filter((r) =>
        !q || `${r.groom_name} ${r.bride_name} ${r.slug}`.toLowerCase().includes(q));
      if (shown.length) list.replaceChildren(...shown.map(card));
      else list.replaceChildren(el('li', { class: 'empty' },
        rows.length ? 'Tidak ada yang cocok.' : 'Belum ada undangan. Tekan "+ Buat" untuk mulai.'));
    }

    search.addEventListener('input', draw);
    draw();

    return el('div', { class: 'stack' },
      el('div', { class: 'page-head' },
        el('h1', { class: 'page-title' }, 'Undangan'),
        el('a', { class: 'btn', href: '#/baru' }, '+ Buat'),
      ),
      rows.length > 3 && search,
      list,
    );
  };
})();
