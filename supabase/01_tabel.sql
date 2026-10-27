-- =====================================================================
-- 01_tabel.sql — STRUKTUR TABEL
-- Urutan jalan: 01 → 02 → 03 → 04 (di Supabase: SQL Editor → New query → Run)
--
-- Analogi: tiap tabel = satu "laci" lemari arsip.
--   profiles            → data akun (kamu sebagai admin, pelanggan)
--   invitations         → satu baris = satu undangan
--   invitation_events   → acara di undangan itu (Akad, Resepsi, ...)
--   invitation_photos   → foto galeri
--   gift_accounts       → rekening / QRIS untuk amplop digital
--   rsvps               → konfirmasi kehadiran + ucapan dari tamu
-- =====================================================================


-- ---------------------------------------------------------------------
-- PENGATURAN BATAS (ubah angka di sini kalau perlu)
-- Dipakai oleh CHECK di bawah supaya data aneh/terlalu panjang ditolak.
-- ---------------------------------------------------------------------
--   Nama orang ............ maks 100 karakter
--   Nama orang tua ........ maks 200 karakter
--   Teks pembuka/catatan .. maks 2000 karakter
--   Ucapan tamu ........... maks 500 karakter
--   Jumlah tamu per RSVP .. 1 sampai 10 orang


-- ---------------------------------------------------------------------
-- PROFIL PENGGUNA
-- Satu baris per akun login. Dibuat OTOMATIS saat ada user baru
-- (lihat trigger di 02_keamanan.sql). Role default = 'customer'.
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text check (char_length(full_name) <= 100),
  role        text not null default 'customer'
              check (role in ('admin', 'customer')),
  created_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- UNDANGAN
-- owner_id KOSONG  → hanya admin yang bisa mengedit (Opsi 1)
-- owner_id DIISI   → pelanggan itu juga bisa mengedit (Opsi 2, nanti)
-- ---------------------------------------------------------------------
create table public.invitations (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid references public.profiles(id) on delete set null,

  -- Bagian link: undanganmu.com/<slug>, contoh: aldi-alfin
  slug              text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                           and char_length(slug) between 3 and 60),

  template          text not null default 'klasik'
                    check (char_length(template) <= 50),

  -- draft = belum tampil, published = bisa dibuka tamu, archived = ditutup
  status            text not null default 'draft'
                    check (status in ('draft', 'published', 'archived')),

  groom_name        text not null check (char_length(groom_name) <= 100),
  groom_parents     text check (char_length(groom_parents) <= 200),
  bride_name        text not null check (char_length(bride_name) <= 100),
  bride_parents     text check (char_length(bride_parents) <= 200),
  opening_text      text check (char_length(opening_text) <= 2000),

  -- Lokasi file di Storage (bukan URL penuh), contoh: <id-undangan>/cover.jpg
  cover_photo_path  text check (char_length(cover_photo_path) <= 300),
  music_path        text check (char_length(music_path) <= 300),

  -- Cerita cinta: daftar [{ "title": "...", "date": "...", "story": "..." }]
  love_story        jsonb not null default '[]'::jsonb
                    check (jsonb_typeof(love_story) = 'array'
                           and jsonb_array_length(love_story) <= 8
                           and char_length(love_story::text) <= 8000),
  -- Foto mempelai di layar penutup (terima kasih)
  closing_photo_path text check (char_length(closing_photo_path) <= 300),

  rsvp_enabled      boolean not null default true,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index invitations_owner_idx on public.invitations (owner_id);


-- ---------------------------------------------------------------------
-- ACARA (Akad, Resepsi, Ngunduh Mantu, ...)
-- ---------------------------------------------------------------------
create table public.invitation_events (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  title          text not null check (char_length(title) <= 100),
  starts_at      timestamptz not null,
  ends_at        timestamptz check (ends_at is null or ends_at > starts_at),
  venue_name     text check (char_length(venue_name) <= 200),
  address        text check (char_length(address) <= 500),
  maps_url       text check (maps_url ~ '^https://' and char_length(maps_url) <= 500),
  sort_order     smallint not null default 0
);
create index invitation_events_inv_idx on public.invitation_events (invitation_id);


-- ---------------------------------------------------------------------
-- FOTO GALERI
-- ---------------------------------------------------------------------
create table public.invitation_photos (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  storage_path   text not null check (char_length(storage_path) <= 300),
  caption        text check (char_length(caption) <= 200),
  sort_order     smallint not null default 0,
  created_at     timestamptz not null default now()
);
create index invitation_photos_inv_idx on public.invitation_photos (invitation_id);


-- ---------------------------------------------------------------------
-- AMPLOP DIGITAL (rekening dan/atau QRIS)
-- Minimal harus ada: (bank + nomor rekening) ATAU gambar QRIS.
-- ---------------------------------------------------------------------
create table public.gift_accounts (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references public.invitations(id) on delete cascade,
  bank_name       text check (char_length(bank_name) <= 50),      -- contoh: BCA, Dana
  account_holder  text check (char_length(account_holder) <= 100),
  account_number  text check (account_number ~ '^[0-9 -]{4,30}$'),
  qris_path       text check (char_length(qris_path) <= 300),
  sort_order      smallint not null default 0,
  check (
    (bank_name is not null and account_number is not null)
    or qris_path is not null
  )
);
create index gift_accounts_inv_idx on public.gift_accounts (invitation_id);


-- ---------------------------------------------------------------------
-- RSVP + UCAPAN TAMU
-- Tamu TIDAK menulis langsung ke tabel ini; harus lewat fungsi
-- submit_rsvp() di 03_fungsi_publik.sql yang memvalidasi isinya.
-- ---------------------------------------------------------------------
create table public.rsvps (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  guest_name     text not null check (char_length(guest_name) between 1 and 100),
  attendance     text not null check (attendance in ('hadir', 'tidak_hadir', 'ragu')),
  guest_count    smallint not null default 1 check (guest_count between 1 and 10),
  message        text check (char_length(message) <= 500),
  is_hidden      boolean not null default false,  -- untuk menyembunyikan ucapan tidak pantas
  created_at     timestamptz not null default now()
);
create index rsvps_inv_created_idx on public.rsvps (invitation_id, created_at desc);


-- ---------------------------------------------------------------------
-- Otomatis memperbarui kolom updated_at setiap undangan diedit
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();
