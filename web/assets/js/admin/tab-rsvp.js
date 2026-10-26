// =====================================================================
// admin/tab-rsvp.js — TAB "RSVP": rekap kehadiran & ucapan tamu.
// Isi ucapan tidak bisa diubah (aturan database); yang bisa hanya
// disembunyikan dari undangan atau dihapus.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { db, ui } = window.Admin;
  const { el } = ui;
  const LABELS = cfg.ATTENDANCE_LABELS;

  window.Admin.tabs.rsvp = async function (inv, body) {
    const rows = await db.select('rsvps',
      `select=*&invitation_id=eq.${inv.id}&order=created_at.desc`);
    let filter = 'semua';

    const stats = el('div', { class: 'stats' });
    const chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Saring kehadiran' });
    const list = el('ul', { class: 'rsvp-list' });

    const stat = (label, value) => el('div', { class: 'stat' }, el('strong', {}, value), el('span', {}, label));
    const countOf = (att) => rows.filter((r) => r.attendance === att).length;

    function drawStats() {
      const guests = rows
        .filter((r) => r.attendance === 'hadir')
        .reduce((sum, r) => sum + r.guest_count, 0);
      stats.replaceChildren(
        stat('RSVP masuk', rows.length),
        stat('Perkiraan tamu hadir', guests),
        stat(LABELS.hadir, countOf('hadir')),
        stat(LABELS.tidak_hadir, countOf('tidak_hadir')),
        stat(LABELS.ragu, countOf('ragu')),
      );
    }

    function drawChips() {
      const options = [['semua', 'Semua'], ...Object.entries(LABELS)];
      chips.replaceChildren(...options.map(([key, label]) => el('button', {
        class: key === filter ? 'chip is-active' : 'chip',
        type: 'button',
        'aria-pressed': String(key === filter),
        onclick: () => { filter = key; drawChips(); drawList(); },
      }, label)));
    }

    function item(r) {
      const toggle = r.message && el('button', { class: 'btn btn--ghost btn--sm', type: 'button' },
        r.is_hidden ? 'Tampilkan ucapan' : 'Sembunyikan ucapan');
      if (toggle) toggle.addEventListener('click', () => ui.busy(toggle, 'Menyimpan…', async () => {
        Object.assign(r, await db.update('rsvps', r.id, { is_hidden: !r.is_hidden }));
        drawList();
        ui.toast(r.is_hidden ? 'Ucapan disembunyikan dari undangan.' : 'Ucapan ditampilkan lagi.');
      }));

      const del = el('button', { class: 'btn btn--ghost btn--sm btn--danger-text', type: 'button' }, 'Hapus');
      del.addEventListener('click', async () => {
        if (!await ui.confirmBox(`Hapus RSVP dari "${r.guest_name}"?`)) return;
        await ui.busy(del, 'Menghapus…', async () => {
          await db.remove('rsvps', r.id);
          rows.splice(rows.indexOf(r), 1);
          drawStats();
          drawList();
          ui.toast('RSVP dihapus.');
        });
      });

      const att = LABELS[r.attendance] + (r.attendance === 'hadir' ? ` · ${r.guest_count} orang` : '');
      return el('li', { class: r.is_hidden ? 'rsvp is-hidden' : 'rsvp' },
        el('div', { class: 'rsvp__head' },
          el('strong', {}, r.guest_name),
          el('span', { class: `badge badge--${r.attendance}` }, att),
        ),
        r.message && el('p', { class: 'rsvp__msg' }, r.message),
        el('p', { class: 'muted small' },
          ui.fmtDateTime(r.created_at),
          r.is_hidden ? ' · ucapan disembunyikan' : ''),
        el('div', { class: 'actions' }, toggle, del),
      );
    }

    function drawList() {
      const shown = rows.filter((r) => filter === 'semua' || r.attendance === filter);
      if (shown.length) list.replaceChildren(...shown.map(item));
      else list.replaceChildren(el('li', { class: 'empty' }, rows.length ? 'Tidak ada di kategori ini.' : 'Belum ada RSVP masuk.'));
    }

    const reload = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, 'Muat ulang');
    reload.addEventListener('click', () => window.Admin.app.render());

    drawStats();
    drawChips();
    drawList();
    if (!inv.rsvp_enabled) {
      body.append(el('p', { class: 'form-msg form-msg--warn' },
        'RSVP sedang ditutup. Aktifkan lagi di tab Data jika tamu masih boleh mengisi.'));
    }
    body.append(stats, el('div', { class: 'page-head' }, chips, reload), list);
  };
})();
