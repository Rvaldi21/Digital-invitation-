// =====================================================================
// beranda.js — ISI HALAMAN BERANDA (halaman jualan)
// Semua isinya diambil dari config.js:
//   TEMPLATES          → daftar contoh template
//   BERANDA.PAKET      → kartu paket & harga
//   BERANDA.FAQ        → tanya jawab
//   BERANDA.WHATSAPP   → tombol pesan via WhatsApp
// Jadi untuk mengubah harga/isi paket, cukup edit config.js.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const B = cfg.BERANDA;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const ikon = (nama, cls) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#ikon-${nama}`);
    svg.append(use);
    return svg;
  };
  const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
  const ribu = (n) => (n % 1000 === 0 ? `Rp${n / 1000} ribu` : rupiah(n));

  // Link WhatsApp; kosong bila nomor belum diisi di config.js
  const linkWa = (pesan) => {
    const nomor = String(B.WHATSAPP || '').replace(/\D/g, '');
    return nomor ? `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}` : '';
  };
  const pesanPaket = (nama) => B.PESAN_WA.replace('{paket}', nama);

  // ---------- Contoh template ----------
  const katalog = document.getElementById('katalog');
  for (const [key, tpl] of Object.entries(cfg.TEMPLATES)) {
    const link = el('a', 'katalog__item');
    link.href = `/undangan/?u=demo&t=${encodeURIComponent(key)}&to=${encodeURIComponent('Tamu Undangan')}`;

    const img = el('img', 'katalog__img');
    img.src = `/assets/contoh-template/${key}.jpg`;
    img.alt = `Contoh template ${tpl.label}`;
    img.loading = 'lazy';
    img.width = 390;
    img.height = 844;
    img.style.background = tpl.color;   // warna template selama gambar dimuat

    const text = el('span', 'katalog__teks');
    text.append(el('strong', null, tpl.label), el('small', null, tpl.description), el('span', 'katalog__coba', 'Coba lihat →'));
    link.append(img, text);

    const li = el('li');
    li.append(link);
    katalog.append(li);
  }

  const jumlahTemplate = Object.keys(cfg.TEMPLATES).length;
  document.getElementById('jumlah-template').textContent = jumlahTemplate;

  // ---------- Paket ----------
  const daftar = document.getElementById('daftar-paket');
  for (const p of B.PAKET) {
    const kartu = el('article', 'paket__kartu' + (p.populer ? ' paket__kartu--populer' : ''));
    if (p.populer) kartu.append(el('p', 'paket__pita', 'Paling laris'));

    kartu.append(el('h3', 'paket__nama', p.nama));
    if (p.catatan) kartu.append(el('p', 'paket__catatan', p.catatan));

    const harga = el('p', 'paket__harga');
    if (p.coret > p.harga) harga.append(el('s', 'paket__coret', rupiah(p.coret)));
    harga.append(el('strong', null, rupiah(p.harga)));
    kartu.append(harga);

    const ul = el('ul', 'paket__fitur');
    for (const f of p.fitur) {
      const li = el('li');
      li.append(ikon('centang'), el('span', null, f.replace('{jumlah}', jumlahTemplate)));
      ul.append(li);
    }
    kartu.append(ul);

    const tombol = el('a', 'tombol ' + (p.populer ? 'tombol--emas' : 'tombol--nila'), `Pesan paket ${p.nama}`);
    tombol.classList.add('js-wa');
    tombol.dataset.pesan = pesanPaket(p.nama);
    kartu.append(tombol);

    daftar.append(kartu);
  }

  // "Mulai Rp.. ribu" di bagian atas = harga paket termurah
  const termurah = Math.min(...B.PAKET.map((p) => p.harga));
  if (isFinite(termurah)) document.getElementById('harga-mulai').textContent = ribu(termurah);

  // ---------- Tanya jawab ----------
  const faq = document.getElementById('faq');
  for (const { tanya, jawab } of B.FAQ) {
    const d = el('details', 'faq__item');
    d.append(el('summary', null, tanya), el('p', null, jawab));
    faq.append(d);
  }

  // ---------- Tombol WhatsApp ----------
  // Bila nomor belum diisi, tombol pesan diarahkan ke bagian paket saja.
  const adaWa = !!linkWa('x');
  for (const a of document.querySelectorAll('.js-wa')) {
    const pesan = a.dataset.pesan === 'umum' ? B.PESAN_WA_UMUM : a.dataset.pesan;
    const href = linkWa(pesan);
    if (href) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
    } else if (a.dataset.pesan !== 'umum') {
      a.href = '#paket';
    }
  }
  document.getElementById('wa-melayang').hidden = !adaWa;
  if (!adaWa) {
    for (const a of document.querySelectorAll('.ajakan .js-wa')) a.hidden = true;
  }

  // ---------- Kaki halaman ----------
  const sosmed = document.getElementById('sosmed');
  const akun = [
    ['Instagram', B.INSTAGRAM, (u) => `https://instagram.com/${u}`],
    ['TikTok', B.TIKTOK, (u) => `https://www.tiktok.com/@${u}`],
  ];
  for (const [nama, user, url] of akun) {
    if (!user) continue;
    const a = el('a', null, `${nama} @${user}`);
    a.href = url(encodeURIComponent(user));
    a.target = '_blank';
    a.rel = 'noopener';
    sosmed.append(a);
  }
  document.getElementById('tahun').textContent = new Date().getFullYear();
})();
