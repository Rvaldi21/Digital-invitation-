-- =====================================================================
-- 05_contoh_data.sql — SATU UNDANGAN CONTOH (opsional)
-- Untuk mengetes website dengan database sungguhan.
-- Setelah dijalankan, buka: /undangan/?u=contoh&to=Nama%20Tamu
-- Hapus kapan saja dengan: delete from public.invitations where slug = 'contoh';
-- =====================================================================

with inv as (
  insert into public.invitations
    (slug, status, groom_name, groom_parents, bride_name, bride_parents, rsvp_enabled)
  values
    ('contoh', 'published',
     'Raka Pradipta', 'Bapak Hendra Wijaya & Ibu Sri Lestari',
     'Nadia Kirana',  'Bapak Agus Santoso & Ibu Ratna Dewi',
     true)
  returning id
),
ev as (
  insert into public.invitation_events
    (invitation_id, title, starts_at, ends_at, venue_name, address, maps_url, sort_order)
  select id, 'Akad nikah', '2026-12-20 08:00+07', '2026-12-20 10:00+07',
         'Masjid Raya Al-Falah', 'Jl. Melati No. 12, Kota Bandung', 'https://maps.google.com/?q=Bandung', 1
  from inv
  union all
  select id, 'Resepsi', '2026-12-20 11:00+07', '2026-12-20 14:00+07',
         'Gedung Sasana Budaya', 'Jl. Kenanga No. 8, Kota Bandung', 'https://maps.google.com/?q=Bandung', 2
  from inv
  returning 1
)
insert into public.gift_accounts (invitation_id, bank_name, account_holder, account_number)
select id, 'BCA', 'Raka Pradipta', '1234567890' from inv;
