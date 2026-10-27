// =====================================================================
// katalog.js — DAFTAR CONTOH TEMPLATE DI HALAMAN BERANDA
// Isinya diambil dari config.js → TEMPLATES, jadi template baru otomatis
// ikut tampil di sini. Gambar contoh: assets/contoh-template/<nama>.jpg
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const list = document.getElementById('katalog');

  for (const [key, tpl] of Object.entries(cfg.TEMPLATES)) {
    const link = document.createElement('a');
    link.className = 'katalog__item';
    link.href = `/undangan/?u=demo&t=${encodeURIComponent(key)}&to=${encodeURIComponent('Tamu Undangan')}`;

    const img = document.createElement('img');
    img.className = 'katalog__img';
    img.src = `/assets/contoh-template/${key}.jpg`;
    img.alt = `Contoh template ${tpl.label}`;
    img.loading = 'lazy';
    img.width = 390;
    img.height = 844;
    img.style.background = tpl.color;   // warna template selama gambar dimuat

    const name = document.createElement('strong');
    name.textContent = tpl.label;
    const desc = document.createElement('small');
    desc.textContent = tpl.description;

    const text = document.createElement('span');
    text.className = 'katalog__text';
    text.append(name, desc);
    link.append(img, text);

    const li = document.createElement('li');
    li.append(link);
    list.append(li);
  }
})();
