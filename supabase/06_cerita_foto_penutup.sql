-- =====================================================================
-- 06_cerita_foto_penutup.sql — TAMBAHAN: LOVE STORY & FOTO PENUTUP
--
-- Jalankan SEKALI di database yang sudah berjalan (01–04 sudah pernah
-- dijalankan): Supabase → SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang. Hasil yang benar: "Success. No rows returned".
--
-- Isinya:
--   1. Kolom love_story (cerita cinta) & closing_photo_path (foto mempelai
--      di layar terima kasih) di tabel invitations
--   2. Fungsi get_invitation diperbarui supaya ikut mengirim kedua kolom itu
--      (isinya sama dengan versi di 03_fungsi_publik.sql)
-- =====================================================================

alter table public.invitations
  add column if not exists love_story jsonb not null default '[]'::jsonb
    check (jsonb_typeof(love_story) = 'array'
           and jsonb_array_length(love_story) <= 8
           and char_length(love_story::text) <= 8000),
  add column if not exists closing_photo_path text
    check (char_length(closing_photo_path) <= 300);


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
