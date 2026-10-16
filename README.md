# Undangan Digital

## Struktur folder

```
supabase/   ← file SQL database (jalankan di Supabase SQL Editor)
web/        ← website (yang di-online-kan lewat Cloudflare Pages)
  undangan/index.html       halaman undangan untuk tamu
  assets/js/config.js       ★ SEMUA PENGATURAN (koneksi Supabase, teks, zona waktu)
  assets/js/undangan.js     logika tampilan undangan
  assets/js/api.js          penghubung ke Supabase
  assets/js/demo-data.js    data contoh untuk mode demo
  assets/css/undangan.css   tampilan (warna & huruf di bagian :root)
  _headers                  header keamanan Cloudflare
```

## Link undangan

```
https://<website>/undangan/?u=<slug>&to=<nama tamu>
contoh: /undangan/?u=aldi-alfin&to=Budi%20Santoso
```

- `?u=demo` → tampilkan data contoh (tanpa database)
- Spasi pada nama tamu ditulis `%20`

## Online-kan website (Cloudflare Pages, gratis)

1. Buka dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**
2. Pilih repositori ini
3. Pengaturan build:
   - Framework preset: **None**
   - Build command: *(kosongkan)*
   - Build output directory: **web**
4. **Save and Deploy**. Setiap ada perubahan di GitHub, website otomatis diperbarui.

---

# Database (Supabase)

Database untuk website undangan dengan panel admin, siap dipakai untuk
**Opsi 1** (hanya kamu yang mengedit) dan bisa langsung naik ke **Opsi 2**
(pelanggan mengedit sendiri) tanpa membangun ulang.

## Isi folder

| File | Isi |
|---|---|
| `supabase/01_tabel.sql` | Struktur tabel: profil, undangan, acara, foto, rekening/QRIS, RSVP |
| `supabase/02_keamanan.sql` | Aturan akses (RLS) dan penjaga kolom penting |
| `supabase/03_fungsi_publik.sql` | 2 fungsi untuk tamu: buka undangan & kirim RSVP (+ anti-spam) |
| `supabase/04_storage.sql` | Tempat file foto/QRIS/musik dan aturan upload |
| `supabase/05_contoh_data.sql` | (Opsional) satu undangan contoh dengan slug `contoh` |

Angka-angka yang bisa diatur (batas karakter, anti-spam, ukuran file)
ada di bagian **PENGATURAN** di atas tiap file.

---

## Cara pasang (sekali saja)

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor → New query**.
3. Salin isi `01_tabel.sql`, tempel, klik **Run**.
4. Ulangi untuk `02`, `03`, lalu `04` **sesuai urutan**.

### Jadikan dirimu admin

1. **Authentication → Users → Add user**, isi email & password kamu.
2. Di SQL Editor, jalankan (ganti emailnya):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'emailkamu@contoh.com');
```

### Matikan pendaftaran bebas (penting)

**Authentication → Sign In / Providers → matikan "Allow new users to sign up"**.
Akun pelanggan nanti kamu buatkan sendiri (atau lewat undangan email),
jadi orang asing tidak bisa daftar seenaknya.

---

## Siapa boleh apa

| | Tamu (tanpa login) | Pelanggan | Admin (kamu) |
|---|---|---|---|
| Buka undangan **published** | ✅ lewat `get_invitation` | ✅ | ✅ |
| Buka undangan **draft** | ❌ | ✅ miliknya | ✅ |
| Kirim RSVP & ucapan | ✅ lewat `submit_rsvp` | ✅ | ✅ |
| Edit nama, teks, acara, foto, rekening, QRIS | ❌ | ✅ miliknya | ✅ semua |
| Lihat daftar RSVP & jumlah tamu | ❌ | ✅ miliknya | ✅ semua |
| Sembunyikan / hapus ucapan | ❌ | ✅ miliknya | ✅ semua |
| Ubah isi ucapan tamu | ❌ | ❌ | ❌ |
| Buat / hapus undangan | ❌ | ❌ | ✅ |
| Ganti link (slug), status publish, pemilik | ❌ | ❌ | ✅ |
| Jadikan seseorang admin | ❌ | ❌ | hanya lewat SQL Editor |

## Opsi 1 → Opsi 2

- **Sekarang (Opsi 1):** biarkan `owner_id` undangan **kosong**. Hanya kamu yang bisa mengedit.
- **Nanti (Opsi 2):** buatkan akun untuk pelanggan, lalu isi `owner_id` undangannya
  dengan id akun itu. Pelanggan langsung bisa login dan mengedit undangannya sendiri.

## Aturan file (Storage)

Simpan semua file dengan pola `<id-undangan>/<nama-file>`, misalnya
`3f2a...c91/galeri/foto-1.webp`. Pelanggan hanya bisa upload ke folder
undangannya sendiri. Batas 5 MB, hanya JPG/PNG/WebP/MP3.

## Contoh pemanggilan dari JavaScript

```js
// Halaman undangan (tamu)
const { data } = await supabase.rpc('get_invitation', { p_slug: 'aldi-alfin' });

// Form RSVP
const { error } = await supabase.rpc('submit_rsvp', {
  p_slug: 'aldi-alfin',
  p_guest_name: 'Budi',
  p_attendance: 'hadir',      // 'hadir' | 'tidak_hadir' | 'ragu'
  p_guest_count: 2,
  p_message: 'Selamat menempuh hidup baru!'
});
```

---

## ⚠️ Aturan keamanan yang wajib diingat

1. **Di website, hanya pakai `anon` key.** Kunci `service_role` melewati SEMUA
   aturan keamanan. Jangan pernah taruh di kode frontend atau GitHub.
2. Jangan mematikan RLS di tabel mana pun, walau sedang "cuma mau tes".
3. Kalau menambah tabel baru nanti, langsung nyalakan RLS dan buat policy-nya.
