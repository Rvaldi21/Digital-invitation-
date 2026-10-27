// =====================================================================
// katalog.js — DAFTAR CONTOH TEMPLATE DI HALAMAN BERANDA
// Isinya diambil dari config.js → TEMPLATES, jadi template baru otomatis
// ikut tampil di sini.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const list = document.getElementById('katalog');

  for (const [key, tpl] of Object.entries(cfg.TEMPLATES)) {
    const link = document.createElement('a');
    link.className = 'katalog__item';
    link.href = `/undangan/?u=demo&t=${encodeURIComponent(key)}&to=${encodeURIComponent('Tamu Undangan')}`;

    const swatch = document.createElement('span');
    swatch.className = 'katalog__swatch';
    swatch.style.background = tpl.color;

    const name = document.createElement('strong');
    name.textContent = tpl.label;
    const desc = document.createElement('small');
    desc.textContent = tpl.description;

    const text = document.createElement('span');
    text.append(name, desc);
    link.append(swatch, text);

    const li = document.createElement('li');
    li.append(link);
    list.append(li);
  }
})();
