// =====================================================================
// undangan.js — MENAMPILKAN ISI UNDANGAN
// Link: /undangan/?u=<slug>&to=<nama tamu>
//   contoh: /undangan/?u=aldi-alfin&to=Budi%20Santoso
// Tambahan:
//   &t=<template>   ganti tampilan, hanya untuk demo & pratinjau
//                   (contoh katalog: /undangan/?u=demo&t=rustic)
//   &pratinjau=1    admin melihat undangan draft (butuh login di panel admin)
//
// KEAMANAN: semua teks dari database dimasukkan dengan textContent
// (bukan innerHTML), jadi ucapan tamu yang berisi kode tidak akan jalan.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  let T = cfg.TEXT;   // diganti setelah template diketahui (teks khusus template)
  const $ = (id) => document.getElementById(id);

  const params = new URLSearchParams(location.search);
  const slug = (params.get('u') || 'demo').trim().toLowerCase();
  const guestName = (params.get('to') || '').trim().slice(0, 100);
  const templateParam = (params.get('t') || '').trim().toLowerCase();
  const preview = params.get('pratinjau') === '1' && !API.isDemoMode(slug);

  // ---------- Pembantu ----------

  // Membuat elemen dengan aman: el('p', { class: 'x' }, 'teks', anakLain)
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c === null || c === undefined || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  function setText(id, value) { $(id).textContent = value || ''; }

  function firstName(full) { return (full || '').split(' ')[0]; }

  const fmtDate = new Intl.DateTimeFormat(cfg.LOCALE, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: cfg.TIMEZONE,
  });
  const fmtTime = new Intl.DateTimeFormat(cfg.LOCALE, {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: cfg.TIMEZONE,
  });

  function timeRange(ev) {
    const start = fmtTime.format(new Date(ev.starts_at));
    if (!ev.ends_at) return `${start} ${cfg.TIMEZONE_LABEL} – selesai`;
    return `${start} – ${fmtTime.format(new Date(ev.ends_at))} ${cfg.TIMEZONE_LABEL}`;
  }

  function isSafeUrl(url) {
    try { return new URL(url).protocol === 'https:'; } catch { return false; }
  }

  function showStatus(message) {
    setText('status-text', message);
    $('status').hidden = false;
  }

  // ---------- Template ----------

  // Template dari data undangan; ?t= hanya berlaku di demo & pratinjau
  function chooseTemplate(inv) {
    const wanted = (API.isDemoMode(slug) || preview) && templateParam ? templateParam : inv.template;
    return Object.prototype.hasOwnProperty.call(cfg.TEMPLATES, wanted) ? wanted : 'klasik';
  }

  // Memuat file tampilan template. Halaman baru ditampilkan setelah file
  // ini siap, supaya tamu tidak melihat tampilan berganti-ganti.
  function loadTemplate(key) {
    const tpl = cfg.TEMPLATES[key];
    T = { ...cfg.TEXT, ...(tpl.TEXT || {}) };
    document.documentElement.dataset.template = key;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && tpl.color) meta.content = tpl.color;
    if (key === 'klasik') return Promise.resolve();   // memakai undangan.css saja

    return new Promise((resolve) => {
      const link = el('link', { rel: 'stylesheet', href: `/assets/css/template-${key}.css` });
      link.addEventListener('load', resolve);
      link.addEventListener('error', resolve);   // gagal → tetap tampil dengan gaya klasik
      setTimeout(resolve, 5000);                 // internet lambat → jangan menunggu selamanya
      document.head.append(link);
    });
  }

  // ---------- Bagian-bagian halaman ----------

  function renderCover(inv) {
    setText('cover-lead', T.coverLead);
    setText('cover-groom', firstName(inv.groom_name));
    setText('cover-bride', firstName(inv.bride_name));
    setText('cover-greeting', T.coverGreeting);
    setText('cover-guest', guestName || T.coverDefaultGuest);
    setText('open-btn', T.coverOpen);
    document.title = `${firstName(inv.groom_name)} & ${firstName(inv.bride_name)} | Undangan Pernikahan`;
  }

  function renderQuote(quote) {
    if (!quote) return;
    setText('quote-arab', quote.arab);
    setText('quote-text', quote.text);
    setText('quote-source', quote.source);
    $('quote-arab').hidden = !quote.arab;
    $('quote').hidden = false;
  }

  function renderIntro(inv) {
    if (inv.cover_photo_path) {
      const img = $('cover-photo');
      img.src = API.mediaUrl(inv.cover_photo_path);
      img.alt = `${inv.groom_name} dan ${inv.bride_name}`;
      img.hidden = false;
    }
    setText('opening', inv.opening_text || T.openingDefault);
    setText('groom-name', inv.groom_name);
    setText('bride-name', inv.bride_name);
    setText('groom-parents', inv.groom_parents ? `${T.sonOf} ${inv.groom_parents}` : '');
    setText('bride-parents', inv.bride_parents ? `${T.daughterOf} ${inv.bride_parents}` : '');
    setText('closing', T.closing);
    setText('closing-names', `${firstName(inv.groom_name)} & ${firstName(inv.bride_name)}`);
  }

  function renderCountdown(inv) {
    if (!inv.events.length) return;
    const target = new Date(inv.events[0].starts_at).getTime();
    if (target <= Date.now()) return;

    $('countdown-section').hidden = false;
    setText('countdown-title', T.countdownTitle);
    setText('countdown-date', fmtDate.format(new Date(target)));

    const pad = (n) => String(n).padStart(2, '0');
    function tick() {
      const left = Math.max(0, target - Date.now());
      const s = Math.floor(left / 1000);
      setText('cd-days', Math.floor(s / 86400));
      setText('cd-hours', pad(Math.floor((s % 86400) / 3600)));
      setText('cd-mins', pad(Math.floor((s % 3600) / 60)));
      setText('cd-secs', pad(s % 60));
      if (left === 0) clearInterval(timer);
    }
    tick();
    const timer = setInterval(tick, 1000);
  }

  function renderEvents(inv) {
    if (!inv.events.length) return;
    $('events-section').hidden = false;
    setText('events-title', T.eventsTitle);
    const box = $('events');
    for (const ev of inv.events) {
      box.append(el('article', { class: 'event' },
        el('h3', { class: 'event__title' }, ev.title),
        el('p', { class: 'event__date' }, fmtDate.format(new Date(ev.starts_at))),
        el('p', { class: 'event__time' }, timeRange(ev)),
        ev.venue_name && el('p', { class: 'event__venue' }, ev.venue_name),
        ev.address && el('p', { class: 'event__address' }, ev.address),
        ev.maps_url && isSafeUrl(ev.maps_url) &&
          el('a', { class: 'btn btn--ghost', href: ev.maps_url, target: '_blank', rel: 'noopener noreferrer' }, T.openMaps),
      ));
    }
  }

  function renderGallery(inv) {
    if (!inv.photos.length) return;
    $('gallery-section').hidden = false;
    setText('gallery-title', T.galleryTitle);
    const box = $('gallery');
    box.classList.toggle('gallery--odd', inv.photos.length % 2 === 1);
    const lightbox = $('lightbox');
    inv.photos.forEach((p, i) => {
      const src = API.mediaUrl(p.storage_path);
      const alt = p.caption || `Foto ${i + 1}`;
      box.append(el('button', {
        type: 'button',
        'aria-label': `Perbesar ${alt}`,
        onclick: () => {
          $('lightbox-img').src = src;
          $('lightbox-img').alt = alt;
          lightbox.showModal();
        },
      }, el('img', { src, alt, loading: 'lazy', decoding: 'async' })));
    });
    lightbox.addEventListener('click', () => lightbox.close());
  }

  function copyText(text, button) {
    const done = () => {
      const old = button.textContent;
      button.textContent = T.copied;
      setTimeout(() => { button.textContent = old; }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();

    function fallback() {
      const ta = el('textarea', { readonly: '' }, text);
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch { /* abaikan */ }
      ta.remove();
    }
  }

  function renderGifts(inv) {
    if (!inv.gifts.length) return;
    $('gift-section').hidden = false;
    setText('gift-title', T.giftTitle);
    setText('gift-intro', T.giftIntro);
    const box = $('gifts');
    for (const g of inv.gifts) {
      const number = (g.account_number || '').replace(/[\s-]/g, '');
      const copyBtn = number && el('button', { class: 'btn btn--ghost', type: 'button' }, T.copy);
      if (copyBtn) copyBtn.addEventListener('click', () => copyText(number, copyBtn));
      box.append(el('div', { class: 'gift' },
        g.bank_name && el('p', { class: 'gift__bank' }, g.bank_name),
        g.qris_path && el('img', { class: 'gift__qris', src: API.mediaUrl(g.qris_path), alt: `QRIS ${g.account_holder || ''}`.trim(), loading: 'lazy' }),
        g.account_number && el('p', { class: 'gift__number' }, g.account_number),
        g.account_holder && el('p', { class: 'gift__holder' }, `a.n. ${g.account_holder}`),
        copyBtn,
      ));
    }
  }

  function messageItem(m) {
    return el('li', { class: 'message' },
      el('div', { class: 'message__head' },
        el('span', { class: 'message__name' }, m.guest_name),
        el('span', { class: 'message__att' }, cfg.ATTENDANCE_LABELS[m.attendance] || ''),
      ),
      el('p', { class: 'message__text' }, m.message),
    );
  }

  function renderMessages(list) {
    setText('messages-title', T.messagesTitle);
    const box = $('messages');
    box.replaceChildren();
    if (!list.length) {
      box.append(el('li', { class: 'messages__empty' }, T.messagesEmpty));
      return;
    }
    list.forEach((m) => box.append(messageItem(m)));
  }

  function renderRsvp(inv) {
    setText('rsvp-title', T.rsvpTitle);
    renderMessages(inv.messages);

    if (!inv.rsvp_enabled) {
      $('rsvp-form').hidden = true;
      $('rsvp-closed').hidden = false;
      setText('rsvp-closed', T.rsvpClosed);
      return;
    }

    const form = $('rsvp-form');
    $('rsvp-name').value = guestName;
    $('rsvp-message').maxLength = cfg.MAX_MESSAGE;
    setText('rsvp-submit', T.rsvpSend);

    // Pilihan kehadiran
    const att = $('rsvp-attendance');
    Object.entries(cfg.ATTENDANCE_LABELS).forEach(([value, label], i) => {
      att.append(el('label', {},
        el('input', { type: 'radio', name: 'attendance', value, checked: i === 0 ? '' : null }),
        el('span', {}, label),
      ));
    });

    // Jumlah tamu 1..MAX
    const count = $('rsvp-count');
    for (let n = 1; n <= cfg.MAX_GUESTS; n++) count.append(el('option', { value: n }, `${n} orang`));

    // Jumlah tamu hanya relevan jika hadir
    form.addEventListener('change', () => {
      $('rsvp-count-field').hidden = form.attendance.value === 'tidak_hadir';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = $('rsvp-error');
      const okBox = $('rsvp-ok');
      errBox.hidden = true; okBox.hidden = true;

      const data = {
        name: $('rsvp-name').value.trim(),
        attendance: form.attendance.value,
        count: form.attendance.value === 'tidak_hadir' ? 1 : Number(count.value),
        message: $('rsvp-message').value.trim(),
      };
      if (!data.name) {
        errBox.textContent = 'Isi nama Anda terlebih dahulu.';
        errBox.hidden = false;
        $('rsvp-name').focus();
        return;
      }

      const btn = $('rsvp-submit');
      btn.disabled = true;
      btn.textContent = T.rsvpSending;
      try {
        if (preview) await new Promise((r) => setTimeout(r, 400));   // pratinjau: tidak dikirim
        else await API.submitRsvp(slug, data);
        okBox.textContent = T.rsvpThanks;
        okBox.hidden = false;
        if (data.message) {
          inv.messages.unshift({ guest_name: data.name, attendance: data.attendance, message: data.message });
          renderMessages(inv.messages);
        }
        $('rsvp-message').value = '';
      } catch (err) {
        errBox.textContent = err.message || 'Konfirmasi gagal dikirim. Coba lagi.';
        errBox.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = T.rsvpSend;
      }
    });
  }

  function setupMusic(inv) {
    if (!inv.music_path) return null;
    const audio = $('music');
    const btn = $('music-btn');
    audio.src = API.mediaUrl(inv.music_path);
    btn.hidden = false;

    const sync = () => {
      const playing = !audio.paused;
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-label', playing ? 'Matikan musik' : 'Putar musik');
    };
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    btn.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
    return audio;
  }

  // ---------- Mulai ----------

  async function start() {
    let inv;
    try {
      inv = preview ? await API.getPreview(slug) : await API.getInvitation(slug);
    } catch (err) {
      console.error(err);
      showStatus(err.previewLogin ? err.message : T.loadError);
      return;
    }
    if (!inv) { showStatus(T.notFound); return; }

    inv.events = inv.events || [];
    inv.photos = inv.photos || [];
    inv.gifts = inv.gifts || [];
    inv.messages = inv.messages || [];

    const templateKey = chooseTemplate(inv);
    await loadTemplate(templateKey);

    renderCover(inv);
    renderQuote(cfg.TEMPLATES[templateKey].QUOTE);
    renderIntro(inv);
    renderCountdown(inv);
    renderEvents(inv);
    renderGallery(inv);
    renderGifts(inv);
    renderRsvp(inv);
    const audio = setupMusic(inv);

    if (API.isDemoMode(slug) || preview) {
      $('demo-notice').hidden = false;
      setText('demo-notice', preview ? T.previewNotice : T.demoNotice);
    }

    $('status').hidden = true;
    $('cover').hidden = false;
    $('main').hidden = false;

    $('open-btn').addEventListener('click', () => {
      $('cover').classList.add('is-open');
      document.body.classList.remove('is-locked');
      if (audio) audio.play().catch(() => { /* browser menolak autoplay: biarkan */ });
      setTimeout(() => { $('cover').hidden = true; }, 950);
      $('main').focus?.();
    });
  }

  start();
})();
