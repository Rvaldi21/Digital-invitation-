-- =====================================================================
-- 04_storage.sql — PENYIMPANAN FILE (foto, QRIS, musik)
--
-- Semua file disimpan di bucket "undangan-media" dengan aturan folder:
--     <id-undangan>/<nama-file>
--   contoh: 3f2a...c91/cover.jpg
--           3f2a...c91/galeri/foto-1.webp
--           3f2a...c91/qris-bca.png
--
-- Folder pertama = id undangan → dipakai untuk mengecek siapa yang
-- boleh upload/hapus di folder itu.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PENGATURAN BUCKET (ubah di sini kalau perlu)
--   public = true  → file bisa dibuka lewat URL publik (dibutuhkan agar
--                    tamu bisa melihat foto). Isi folder TIDAK bisa
--                    di-list oleh tamu.
--   5242880        → batas ukuran 5 MB per file
--   allowed_mime_types → hanya gambar & mp3 yang boleh di-upload
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'undangan-media',
  'undangan-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ---------------------------------------------------------------------
-- Cek: apakah user ini boleh mengelola file di path ini?
-- Folder pertama harus berupa id undangan yang valid.
-- ---------------------------------------------------------------------
create or replace function public.can_manage_media(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_folder text := split_part(coalesce(p_object_name, ''), '/', 1);
begin
  if v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_manage_invitation(v_folder::uuid);
end;
$$;


-- ---------------------------------------------------------------------
-- POLICY STORAGE
-- Tamu: hanya membuka file via URL publik (tidak perlu policy).
-- Pemilik undangan & admin: lihat daftar, upload, ganti, hapus
-- di folder undangannya sendiri.
-- ---------------------------------------------------------------------
create policy "media: lihat daftar oleh pemilik atau admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'undangan-media' and public.can_manage_media(name));

create policy "media: upload oleh pemilik atau admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'undangan-media' and public.can_manage_media(name));

create policy "media: ganti oleh pemilik atau admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'undangan-media' and public.can_manage_media(name))
  with check (bucket_id = 'undangan-media' and public.can_manage_media(name));

create policy "media: hapus oleh pemilik atau admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'undangan-media' and public.can_manage_media(name));
