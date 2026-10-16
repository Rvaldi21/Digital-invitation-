-- =====================================================================
-- 02_keamanan.sql — ATURAN AKSES (Row Level Security / RLS)
--
-- Analogi: RLS = satpam di depan tiap laci. Setiap kali ada yang mau
-- membaca/mengubah data, satpam mengecek "kamu siapa?" dulu.
--
-- Ringkasan siapa boleh apa:
--   Tamu (belum login)  → TIDAK bisa menyentuh tabel sama sekali.
--                         Hanya lewat 2 fungsi aman di 03_fungsi_publik.sql
--   Pelanggan (login)   → hanya undangan MILIKNYA (owner_id = dirinya):
--                         edit isi, acara, foto, rekening/QRIS, lihat RSVP.
--                         TIDAK bisa: ganti slug/link, ganti status
--                         (publish), pindah pemilik, ubah role sendiri.
--   Admin (kamu)        → semuanya.
-- =====================================================================


-- ---------------------------------------------------------------------
-- FUNGSI BANTUAN
-- security definer = berjalan dengan hak pembuat fungsi, supaya bisa
-- membaca tabel profiles tanpa terhalang RLS (dan tanpa loop).
-- set search_path = '' = mencegah trik pembajakan nama tabel.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.owns_invitation(p_invitation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invitations
    where id = p_invitation_id and owner_id = auth.uid()
  );
$$;

-- Boleh mengelola undangan ini? (admin, atau pemiliknya)
create or replace function public.can_manage_invitation(p_invitation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or public.owns_invitation(p_invitation_id);
$$;

-- "Pemanggil dari dalam aplikasi" = role anon/authenticated.
-- SQL Editor Supabase & service_role dianggap tepercaya.
create or replace function public.is_app_caller()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;


-- ---------------------------------------------------------------------
-- PROFIL OTOMATIS untuk setiap user baru (selalu role 'customer')
-- Role admin hanya bisa diberikan lewat SQL Editor (lihat README).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100),
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- PENJAGA KOLOM PENTING
-- RLS menjaga BARIS mana yang boleh diubah; trigger ini menjaga KOLOM.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_app_caller() and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Tidak diizinkan mengubah role' using errcode = '42501';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Tidak diizinkan mengubah id' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();


create or replace function public.protect_invitation_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_app_caller() and not public.is_admin() then
    if new.owner_id   is distinct from old.owner_id
       or new.slug    is distinct from old.slug
       or new.status  is distinct from old.status
       or new.created_at is distinct from old.created_at
       or new.id      is distinct from old.id then
      raise exception 'Hanya admin yang boleh mengubah pemilik, link, atau status undangan'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger invitations_protect_fields
  before update on public.invitations
  for each row execute function public.protect_invitation_fields();


-- Mencegah data acara/foto/rekening/RSVP "dipindah" ke undangan lain
create or replace function public.protect_invitation_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.invitation_id is distinct from old.invitation_id then
    raise exception 'invitation_id tidak boleh diubah' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger invitation_events_protect_inv before update on public.invitation_events
  for each row execute function public.protect_invitation_id();
create trigger invitation_photos_protect_inv before update on public.invitation_photos
  for each row execute function public.protect_invitation_id();
create trigger gift_accounts_protect_inv before update on public.gift_accounts
  for each row execute function public.protect_invitation_id();
create trigger rsvps_protect_inv before update on public.rsvps
  for each row execute function public.protect_invitation_id();


-- ---------------------------------------------------------------------
-- NYALAKAN RLS di semua tabel
-- Begitu RLS aktif: tanpa policy = tidak ada yang boleh apa-apa.
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.invitations       enable row level security;
alter table public.invitation_events enable row level security;
alter table public.invitation_photos enable row level security;
alter table public.gift_accounts     enable row level security;
alter table public.rsvps             enable row level security;


-- ---------------------------------------------------------------------
-- HAK DASAR (lapisan kedua di luar RLS)
-- Tamu (anon) dicabut total dari tabel; hanya user login yang dapat hak.
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.invitations, public.invitation_events,
              public.invitation_photos, public.gift_accounts, public.rsvps
  from anon;

grant select, update            on public.profiles          to authenticated;
grant select, insert, update, delete on public.invitations  to authenticated;
grant select, insert, update, delete on public.invitation_events to authenticated;
grant select, insert, update, delete on public.invitation_photos to authenticated;
grant select, insert, update, delete on public.gift_accounts to authenticated;

-- RSVP: user login hanya boleh membaca, menghapus, dan mengubah kolom is_hidden.
revoke all on public.rsvps from authenticated;
grant select, delete on public.rsvps to authenticated;
grant update (is_hidden) on public.rsvps to authenticated;

-- Fungsi bantuan tidak perlu dipanggil langsung oleh tamu
revoke execute on function public.handle_new_user() from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- POLICY: PROFILES
-- ---------------------------------------------------------------------
create policy "profil: lihat milik sendiri atau admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profil: edit milik sendiri atau admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());


-- ---------------------------------------------------------------------
-- POLICY: INVITATIONS
-- ---------------------------------------------------------------------
create policy "undangan: lihat milik sendiri atau admin"
  on public.invitations for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "undangan: hanya admin yang membuat"
  on public.invitations for insert to authenticated
  with check (public.is_admin());

create policy "undangan: edit milik sendiri atau admin"
  on public.invitations for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "undangan: hanya admin yang menghapus"
  on public.invitations for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- POLICY: ACARA, FOTO, REKENING/QRIS
-- Pemilik undangan & admin boleh lihat/tambah/edit/hapus.
-- ---------------------------------------------------------------------
create policy "acara: kelola oleh pemilik atau admin"
  on public.invitation_events for all to authenticated
  using (public.can_manage_invitation(invitation_id))
  with check (public.can_manage_invitation(invitation_id));

create policy "foto: kelola oleh pemilik atau admin"
  on public.invitation_photos for all to authenticated
  using (public.can_manage_invitation(invitation_id))
  with check (public.can_manage_invitation(invitation_id));

create policy "rekening: kelola oleh pemilik atau admin"
  on public.gift_accounts for all to authenticated
  using (public.can_manage_invitation(invitation_id))
  with check (public.can_manage_invitation(invitation_id));


-- ---------------------------------------------------------------------
-- POLICY: RSVP
-- Pemilik & admin: lihat, sembunyikan (is_hidden), hapus.
-- Tidak ada policy INSERT → tamu wajib lewat submit_rsvp().
-- ---------------------------------------------------------------------
create policy "rsvp: lihat oleh pemilik atau admin"
  on public.rsvps for select to authenticated
  using (public.can_manage_invitation(invitation_id));

create policy "rsvp: sembunyikan oleh pemilik atau admin"
  on public.rsvps for update to authenticated
  using (public.can_manage_invitation(invitation_id))
  with check (public.can_manage_invitation(invitation_id));

create policy "rsvp: hapus oleh pemilik atau admin"
  on public.rsvps for delete to authenticated
  using (public.can_manage_invitation(invitation_id));
