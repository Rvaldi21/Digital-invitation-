-- =====================================================================
-- 03_fungsi_publik.sql — "LOKET" UNTUK TAMU UNDANGAN
--
-- Tamu tidak boleh masuk ke "gudang" (tabel). Mereka hanya dilayani
-- lewat 2 loket ini:
--   1. get_invitation(slug)  → ambil isi undangan yang sudah published
--   2. submit_rsvp(...)      → kirim konfirmasi kehadiran + ucapan
--
-- Cara memanggil dari JavaScript (supabase-js):
--   await supabase.rpc('get_invitation', { p_slug: 'aldi-alfin' })
--   await supabase.rpc('submit_rsvp', {
--     p_slug: 'aldi-alfin', p_guest_name: 'Budi',
--     p_attendance: 'hadir', p_guest_count: 2, p_message: 'Selamat!'
--   })
-- =====================================================================


-- ---------------------------------------------------------------------
-- PENGATURAN ANTI-SPAM (ubah angka di sini kalau perlu)
-- ---------------------------------------------------------------------
create or replace function public.rsvp_settings()
returns table (
  max_per_minute   int,   -- maks RSVP masuk per undangan per menit
  max_total        int,   -- maks total RSVP per undangan
  max_messages     int    -- jumlah ucapan terbaru yang ditampilkan
)
language sql
immutable
set search_path = ''
as $$
  select 30, 3000, 100;
$$;


-- ---------------------------------------------------------------------
-- 1. AMBIL ISI UNDANGAN
-- Hanya mengembalikan data jika status = 'published'.
-- Draft/arsip → null (seolah tidak ada), jadi link yang belum siap
-- tidak bisa diintip.
-- ---------------------------------------------------------------------
create or replace function public.get_invitation(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inv     public.invitations%rowtype;
  v_max_msg int;
begin
  select * into v_inv
  from public.invitations
  where slug = lower(trim(p_slug)) and status = 'published';

  if not found then
    return null;
  end if;

  select max_messages into v_max_msg from public.rsvp_settings();

  return jsonb_build_object(
    'slug',             v_inv.slug,
    'template',         v_inv.template,
    'groom_name',       v_inv.groom_name,
    'groom_parents',    v_inv.groom_parents,
    'bride_name',       v_inv.bride_name,
    'bride_parents',    v_inv.bride_parents,
    'opening_text',     v_inv.opening_text,
    'cover_photo_path', v_inv.cover_photo_path,
    'music_path',       v_inv.music_path,
    'rsvp_enabled',     v_inv.rsvp_enabled,
    'love_story',       v_inv.love_story,
    'closing_photo_path', v_inv.closing_photo_path,

    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'title', e.title, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
               'venue_name', e.venue_name, 'address', e.address, 'maps_url', e.maps_url
             ) order by e.sort_order, e.starts_at)
      from public.invitation_events e
      where e.invitation_id = v_inv.id
    ), '[]'::jsonb),

    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'storage_path', p.storage_path, 'caption', p.caption
             ) order by p.sort_order, p.created_at)
      from public.invitation_photos p
      where p.invitation_id = v_inv.id
    ), '[]'::jsonb),

    'gifts', coalesce((
      select jsonb_agg(jsonb_build_object(
               'bank_name', g.bank_name, 'account_holder', g.account_holder,
               'account_number', g.account_number, 'qris_path', g.qris_path
             ) order by g.sort_order)
      from public.gift_accounts g
      where g.invitation_id = v_inv.id
    ), '[]'::jsonb),

    -- Ucapan publik: hanya nama, status hadir, pesan, waktu.
    -- Jumlah tamu (guest_count) TIDAK ditampilkan ke publik.
    'messages', coalesce((
      select jsonb_agg(m order by m.created_at desc)
      from (
        select r.guest_name, r.attendance, r.message, r.created_at
        from public.rsvps r
        where r.invitation_id = v_inv.id
          and r.is_hidden = false
          and r.message is not null
        order by r.created_at desc
        limit v_max_msg
      ) m
    ), '[]'::jsonb)
  );
end;
$$;


-- ---------------------------------------------------------------------
-- 2. KIRIM RSVP
-- Validasi: undangan harus published & RSVP aktif, isian dirapikan,
-- panjang dibatasi, dan ada rem anti-spam.
-- ---------------------------------------------------------------------
create or replace function public.submit_rsvp(
  p_slug         text,
  p_guest_name   text,
  p_attendance   text,
  p_guest_count  int  default 1,
  p_message      text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_inv_id   uuid;
  v_enabled  boolean;
  v_name     text := nullif(btrim(regexp_replace(coalesce(p_guest_name, ''), '\s+', ' ', 'g')), '');
  v_message  text := nullif(btrim(coalesce(p_message, '')), '');
  v_recent   int;
  v_total    int;
  v_set      record;
begin
  select * into v_set from public.rsvp_settings();

  select id, rsvp_enabled into v_inv_id, v_enabled
  from public.invitations
  where slug = lower(trim(p_slug)) and status = 'published';

  if v_inv_id is null then
    raise exception 'Undangan tidak ditemukan' using errcode = 'P0002';
  end if;
  if not v_enabled then
    raise exception 'RSVP untuk undangan ini sudah ditutup' using errcode = 'P0001';
  end if;
  if v_name is null or char_length(v_name) > 100 then
    raise exception 'Nama wajib diisi (maks 100 karakter)' using errcode = '22023';
  end if;
  if p_attendance is null or p_attendance not in ('hadir', 'tidak_hadir', 'ragu') then
    raise exception 'Status kehadiran tidak valid' using errcode = '22023';
  end if;
  if p_guest_count is null or p_guest_count not between 1 and 10 then
    raise exception 'Jumlah tamu harus 1 sampai 10' using errcode = '22023';
  end if;
  if char_length(v_message) > 500 then
    raise exception 'Ucapan maksimal 500 karakter' using errcode = '22023';
  end if;

  -- Kunci per undangan supaya hitungan anti-spam akurat saat ramai
  perform pg_advisory_xact_lock(hashtext('rsvp:' || v_inv_id::text));

  select count(*) filter (where created_at > now() - interval '1 minute'),
         count(*)
    into v_recent, v_total
  from public.rsvps
  where invitation_id = v_inv_id;

  if v_recent >= v_set.max_per_minute then
    raise exception 'Terlalu banyak RSVP, coba lagi sebentar lagi' using errcode = 'P0001';
  end if;
  if v_total >= v_set.max_total then
    raise exception 'Kuota RSVP undangan ini sudah penuh' using errcode = 'P0001';
  end if;

  insert into public.rsvps (invitation_id, guest_name, attendance, guest_count, message)
  values (v_inv_id, v_name, p_attendance, p_guest_count, v_message);

  return jsonb_build_object('ok', true);
end;
$$;


-- ---------------------------------------------------------------------
-- HAK EKSEKUSI
-- Secara bawaan Postgres mengizinkan SEMUA orang memanggil fungsi,
-- jadi kita cabut dulu, lalu buka hanya yang perlu.
-- ---------------------------------------------------------------------
revoke execute on function public.get_invitation(text) from public;
revoke execute on function public.submit_rsvp(text, text, text, int, text) from public;
revoke execute on function public.rsvp_settings() from public, anon, authenticated;

grant execute on function public.get_invitation(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text, int, text) to anon, authenticated;
