// =====================================================================
// admin/ui.js — PEMBANTU TAMPILAN PANEL ADMIN
// Membuat elemen, pesan singkat (toast), dialog konfirmasi, tombol pilih
// file, format tanggal & zona waktu, dan link undangan.
//
// KEAMANAN: semua teks dimasukkan lewat textContent, bukan innerHTML.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const $ = (id) => document.getElementById(id);

  // Wadah bersama semua file admin
  window.Admin = { views: {}, tabs: {} };

  // ---------- Membuat elemen ----------

  // el('p', { class: 'x', onclick: fn }, 'teks', anakLain, [daftar anak])
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    const props = {};
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'value' || k === 'checked') props[k] = v;   // diisi setelah anak-anaknya ada
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    Object.assign(node, props);
    return node;
  }

  // Kolom isian berlabel: field('Nama', input, 'petunjuk kecil')
  function field(label, control, hint) {
    return el('label', { class: 'field' },
      el('span', {}, label),
      control,
      hint && el('small', {}, hint),
    );
  }

  // Kotak centang berlabel
  function checkbox(label, input) {
    return el('label', { class: 'check' }, input, el('span', {}, label));
  }

  function statusBadge(status) {
    const labels = { draft: 'Draft', published: 'Terbit', archived: 'Arsip' };
    return el('span', { class: `badge badge--${status}` }, labels[status] || status);
  }

  // ---------- Pesan & dialog ----------

  let toastTimer;
  function toast(message, type = 'ok') {
    const box = $('toast');
    box.textContent = message;
    box.className = `toast toast--${type}`;
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, type === 'error' ? 6000 : 2500);
  }

  // Dialog konfirmasi → Promise<true/false>.
  // mustType: pengguna harus mengetik teks ini dulu (untuk aksi berbahaya).
  function confirmBox(message, { okLabel = 'Ya, hapus', danger = true, mustType } = {}) {
    return new Promise((resolve) => {
      const dlg = $('confirm');
      const input = mustType && el('input', {
        type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      });
      const ok = el('button', { class: danger ? 'btn btn--danger' : 'btn', type: 'button', disabled: !!mustType }, okLabel);
      const cancel = el('button', { class: 'btn btn--ghost', type: 'button' }, 'Batal');
      if (input) input.addEventListener('input', () => { ok.disabled = input.value.trim() !== mustType; });

      const finish = (answer) => { dlg.close(); resolve(answer); };
      ok.addEventListener('click', () => finish(true));
      cancel.addEventListener('click', () => finish(false));
      dlg.oncancel = (e) => { e.preventDefault(); finish(false); };   // tombol Esc / kembali

      dlg.replaceChildren(
        el('p', { class: 'confirm__text' }, message),
        input && field(`Ketik "${mustType}" untuk melanjutkan`, input),
        el('div', { class: 'actions' }, cancel, ok),
      );
      dlg.showModal();
      (input || cancel).focus();
    });
  }

  // Menjalankan tugas sambil menonaktifkan tombol. Error tampil sebagai toast.
  async function busy(button, label, task) {
    const old = button.textContent;
    button.disabled = true;
    if (label) button.textContent = label;
    try {
      return await task();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Terjadi kesalahan. Coba lagi.', 'error');
      return undefined;
    } finally {
      button.disabled = false;
      button.textContent = old;
    }
  }

  // Tombol "pilih file". onFiles(files, setLabel) dipanggil setelah file dipilih.
  function filePicker(label, accept, onFiles, { multiple = false, ghost = false } = {}) {
    const text = document.createTextNode(label);
    const input = el('input', { type: 'file', accept, multiple, class: 'visually-hidden' });
    const btn = el('label', { class: ghost ? 'btn btn--ghost' : 'btn' }, text, input);
    input.addEventListener('change', async () => {
      const files = [...input.files];
      input.value = '';
      if (!files.length) return;
      btn.classList.add('is-busy');
      try {
        await onFiles(files, (t) => { text.textContent = t; });
      } catch (err) {
        console.error(err);
        toast(err.message || 'Upload gagal. Coba lagi.', 'error');
      } finally {
        btn.classList.remove('is-busy');
        text.textContent = label;
      }
    });
    return btn;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    return Promise.resolve(fallback());

    function fallback() {
      const ta = el('textarea', { readonly: true }, text);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      try { document.execCommand('copy'); } finally { ta.remove(); }
    }
  }

  // ---------- Teks & angka ----------

  function orNull(value) {
    const v = (value || '').trim();
    return v ? v : null;
  }

  function firstName(full) { return (full || '').trim().split(/\s+/)[0] || ''; }

  // "Aldi Pratama & Alfin" → "aldi-pratama-alfin"
  function slugify(text) {
    return (text || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '');
  }

  function isValidSlug(slug) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
  }

  function kb(bytes) { return `${Math.max(1, Math.round(bytes / 1024))} KB`; }

  // Nama file unik supaya file lama tidak tertimpa & tidak tersangkut cache
  function uniqueName() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Link undangan untuk tamu
  function publicLink(slug, guest) {
    const base = (cfg.ADMIN.SITE_URL || location.origin).replace(/\/+$/, '');
    let link = `${base}/undangan/?u=${encodeURIComponent(slug)}`;
    if (guest) link += `&to=${encodeURIComponent(guest)}`;
    return link;
  }

  // ---------- Tanggal & zona waktu ----------
  // Jam acara diisi & ditampilkan dalam zona config (TIMEZONE), bukan zona HP.

  const fmtDate = new Intl.DateTimeFormat(cfg.LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: cfg.TIMEZONE,
  });
  const fmtDateTime = new Intl.DateTimeFormat(cfg.LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: cfg.TIMEZONE,
  });
  const zoneParts = new Intl.DateTimeFormat('en-US', {
    timeZone: cfg.TIMEZONE, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // Selisih zona TIMEZONE terhadap UTC (milidetik) pada waktu tertentu
  function zoneOffset(ms) {
    const p = Object.fromEntries(zoneParts.formatToParts(new Date(ms)).map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  }

  // Waktu database (UTC) → isi kolom <input type="datetime-local">
  function toLocalInput(iso) {
    if (!iso) return '';
    const ms = new Date(iso).getTime();
    return new Date(ms + zoneOffset(ms)).toISOString().slice(0, 16);
  }

  // Isi kolom <input type="datetime-local"> → waktu database (UTC)
  function fromLocalInput(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
    if (!m) return null;
    const asUtc = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
    let ms = asUtc - zoneOffset(asUtc);
    ms = asUtc - zoneOffset(ms);   // koreksi jika zona punya pergantian jam musim panas
    return new Date(ms).toISOString();
  }

  window.Admin.ui = {
    el, field, checkbox, statusBadge,
    toast, confirmBox, busy, filePicker, copyText,
    orNull, firstName, slugify, isValidSlug, kb, uniqueName, publicLink,
    fmtDate: (iso) => fmtDate.format(new Date(iso)),
    fmtDateTime: (iso) => fmtDateTime.format(new Date(iso)),
    toLocalInput, fromLocalInput,
  };
})();
