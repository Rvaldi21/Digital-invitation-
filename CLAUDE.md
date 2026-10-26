# CLAUDE.md — Catatan Proyek Undangan Digital

File ini dibaca otomatis oleh Claude. Isinya: tujuan proyek, keputusan yang
sudah diambil, status terakhir, dan aturan kerja. **Perbarui bagian "Status"
setiap kali ada langkah besar yang selesai.**

---

## 1. Tujuan proyek

Usaha sampingan: **jasa website undangan digital** (utamanya pernikahan) yang
dijual ke banyak pelanggan dari satu sistem.

- Satu template dipakai ulang untuk banyak pelanggan; data tiap pelanggan
  (nama, tanggal, foto, lokasi, rekening) disimpan di database.
- Pemilik mengelola semua undangan lewat **panel admin**.
- Pemilik juga akan memakainya untuk undangan pernikahannya sendiri sebagai
  contoh portofolio pertama.
- Nanti bisa diperluas ke: undangan ulang tahun, aqiqah, khitanan, syukuran;
  menu digital QR untuk kafe; halaman link-in-bio UMKM.
- Strategi jualan: 2–3 template, contoh nyata, promosi lewat Instagram/TikTok.
  Bisa jadi pembeda: desain unik, harga terjangkau, layanan cepat.
  Tentukan batas revisi ke pelanggan sejak awal.

### Fitur undangan yang dibutuhkan
Nama tamu personal di link, sampul, hitung mundur, acara + peta, galeri foto,
musik, RSVP + ucapan, amplop digital (nomor rekening + QRIS).

### Siapa mengedit undangan (keputusan penting)
- **Opsi 1 (SEKARANG):** hanya admin yang mengedit. Pelanggan kirim data/foto
  lewat WhatsApp, admin memasukkan lewat panel admin.
- **Opsi 2 (NANTI):** pelanggan punya login sendiri dan bisa mengedit undangan
  miliknya (foto, rekening, QRIS, lihat RSVP). Database SUDAH dirancang untuk
  ini: cukup isi kolom `owner_id` undangan dengan akun pelanggan.
- Jalan tengah yang pernah dibahas: form isian untuk pelanggan, admin menyetujui.

---

## 2. Tentang pemilik & cara bekerja dengannya

- Pemula di web development. Belajar sambil membangun (project-first).
- Bahasa percakapan: **Bahasa Indonesia**, sederhana, tanpa istilah berlebihan.
- Suka **analogi** dan pengecekan bertahap ("sudah jalan? kirim screenshot").
- Mau output **siap copy-paste**, langkah demi langkah.
- Semua nilai yang bisa diubah harus **terkumpul di satu tempat dan diberi label
  jelas** (lihat `web/assets/js/config.js`, bagian PENGATURAN di file SQL).
- Kode dipisah ke **file-file terpisah yang rapi**, bukan satu file besar.
- Sering bekerja **hanya dari HP**: panel admin harus **mobile-first**
  (tombol besar, form satu kolom). Langkah di dashboard (Supabase, Cloudflare,
  GitHub) perlu dijelaskan untuk browser HP (mode "Situs desktop" membantu).
- Pengguna Windows.

---

## 3. Batasan: modal Rp0

Semua harus memakai paket gratis sampai ada pemasukan.

| Kebutuhan | Pilihan | Catatan |
|---|---|---|
| Database, login, file | Supabase Free | 500 MB DB, 1 GB file, **5 GB bandwidth/bulan**, project dijeda setelah ~1 minggu tidak aktif (bisa di-resume) |
| Hosting | Cloudflare (Workers/Pages) | Gratis dan boleh komersial |
| Kode | GitHub (repo public) | |
| Domain | subdomain gratis dulu | domain `.my.id`/`.com` dibeli setelah ada pemasukan |

- **JANGAN pakai Vercel Hobby**: ketentuannya melarang penggunaan komersial.
- Bandwidth foto paling cepat habis. Wajib: **kompres foto ke WebP ±100–200 KB
  saat upload (di browser, otomatis di panel admin)** dan `loading="lazy"`.

---

## 4. Keputusan teknis

- Website **statis** HTML/CSS/JS tanpa framework dan tanpa build step.
- Halaman tamu memanggil Supabase lewat `fetch` langsung (tanpa library).
- Link undangan: `/undangan/?u=<slug>&to=<nama tamu>`
  (query string dipilih karena pasti jalan di semua hosting; link "cantik"
  seperti `/aldi-alfin` belum diuji).
- `?u=demo`, atau config Supabase kosong → **mode demo** dengan data contoh.
- Desain template "klasik": biru nila `#1F2A44`, kertas hijau pucat `#EEF1EC`,
  hijau daun `#3E5C4A`, emas prada `#B08D57`, motif batik **kawung**;
  huruf Instrument Serif (judul) + Plus Jakarta Sans (teks). Diatur di `:root`
  pada `web/assets/css/undangan.css`.

### Struktur
```
supabase/01_tabel.sql          tabel
supabase/02_keamanan.sql       RLS, trigger penjaga kolom, hak akses
supabase/03_fungsi_publik.sql  get_invitation, submit_rsvp (+ anti-spam)
supabase/04_storage.sql        bucket "undangan-media" + aturan upload
supabase/05_contoh_data.sql    (opsional) undangan contoh slug "contoh"
web/undangan/index.html        halaman tamu
web/assets/js/config.js        ★ semua pengaturan
web/assets/js/api.js           penghubung Supabase
web/assets/js/undangan.js      render halaman (pakai textContent, anti-XSS)
web/assets/js/demo-data.js     data contoh
web/assets/css/undangan.css    tampilan
web/_headers                   header keamanan (CSP, dll.)
wrangler.jsonc                 pengaturan Cloudflare Workers (folder "web")
jalankan-lokal.bat             tes lokal di Windows (klik dua kali)
```

---

## 5. Aturan keamanan (WAJIB)

1. **Kunci `service_role`/secret Supabase TIDAK PERNAH masuk ke kode atau GitHub.**
   Di website hanya kunci publishable/anon.
2. RLS harus aktif di semua tabel. Tabel baru → langsung RLS + policy.
3. Tamu (anon) tidak boleh menyentuh tabel; hanya lewat `get_invitation` dan
   `submit_rsvp`.
4. Pelanggan tidak boleh mengubah `slug`, `status`, `owner_id`, atau `role`
   (dijaga trigger). Admin hanya bisa diangkat lewat SQL Editor.
5. Semua teks dari database ditampilkan dengan `textContent`, bukan `innerHTML`.
6. File di storage memakai pola `<id-undangan>/<nama-file>`, maksimal 5 MB,
   hanya JPG/PNG/WebP/MP3.
7. Pendaftaran akun bebas di Supabase **dimatikan**; akun pelanggan dibuat admin.

---

## 6. Status (terakhir diperbarui: 26 Okt 2026)

**Selesai**
- [x] Skema database + keamanan; diuji 45 skenario akses di Postgres lokal (semua lulus)
- [x] Database terpasang di Supabase milik pemilik (cek: 6 tabel RLS, 13 fungsi,
      12 policy tabel, 4 policy storage, 1 bucket, 1 trigger — semua lengkap)
- [x] Akun admin dibuat & role `admin` diset; pendaftaran bebas dimatikan
- [x] Halaman undangan tamu + mode demo; diuji 23 skenario di layar HP (Playwright,
      Supabase disimulasikan) — semua lulus
- [x] Kode di GitHub: Rvaldi21/Digital-invitation- (public)

**Belum / sedang dikerjakan**
- [ ] **Deploy ke Cloudflare** — jalur Pages tidak ketemu di dashboard (HP).
      Sudah ditambah `wrangler.jsonc` untuk jalur **Workers**:
      Create application → Import a repository → nama project **`digital-invitation`**
      (harus sama dengan `name` di wrangler.jsonc). Belum dicoba/diverifikasi.
- [x] `SUPABASE_URL` dan `SUPABASE_KEY` (publishable) diisi di `config.js`;
      dites: `get_invitation` menjawab, baca tabel langsung oleh anon ditolak (401).
      Belum di-commit/push ke GitHub.
- [ ] (Opsional) jalankan `05_contoh_data.sql` untuk tes dengan database asli.

**Berikutnya**
1. Website online + tersambung ke Supabase, tes `?u=contoh` dari HP.
2. **Panel admin** (mobile-first, login Supabase Auth): daftar undangan, tambah/edit,
   acara, upload foto (kompres WebP otomatis), rekening/QRIS, publish/draft,
   lihat & sembunyikan RSVP, generator link per nama tamu.
3. Template kedua/ketiga.
4. Halaman beranda untuk promosi jasa (`web/index.html` masih sementara).
5. Opsi 2: dashboard pelanggan.

---

## 7. Cara tes lokal

- Windows: klik dua kali `jalankan-lokal.bat`, atau di folder `web` jalankan
  `python -m http.server 8000`, lalu buka http://localhost:8000/undangan/?u=demo&to=Aldi
- Jangan membuka file HTML dengan klik dua kali (path `/assets/...` butuh server).
