// =====================================================================
// demo-data.js — DATA CONTOH untuk melihat tampilan tanpa database
// Dipakai saat link berisi ?u=demo atau saat config Supabase masih kosong.
// Bentuk datanya sama persis dengan hasil fungsi get_invitation.
// =====================================================================

(function () {
  // Acara dibuat otomatis ±45 hari dari hari ini supaya hitung mundur selalu jalan
  const d = new Date();
  d.setDate(d.getDate() + 45);
  const ymd = d.toISOString().slice(0, 10);

  window.DEMO_INVITATION = {
    slug: 'demo',
    template: 'klasik',
    groom_name: 'Raka Pradipta',
    groom_parents: 'Bapak Hendra Wijaya & Ibu Sri Lestari',
    bride_name: 'Nadia Kirana',
    bride_parents: 'Bapak Agus Santoso & Ibu Ratna Dewi',
    opening_text: null,
    cover_photo_path: null,
    music_path: null,
    rsvp_enabled: true,
    closing_photo_path: '/assets/demo/foto-3.svg',
    love_story: [
      {
        date: 'Maret 2021',
        title: 'Awal bertemu',
        story: 'Kami pertama kali bertemu di sebuah acara kampus. Obrolan singkat hari itu ternyata menjadi awal dari banyak cerita.',
      },
      {
        date: 'Agustus 2024',
        title: 'Lamaran',
        story: 'Dengan restu kedua keluarga, kami memutuskan melangkah ke jenjang yang lebih serius.',
      },
      {
        date: 'Desember 2026',
        title: 'Hari bahagia',
        story: 'Kini kami siap mengikat janji suci. Doa restu Anda adalah hadiah terindah bagi kami.',
      },
    ],
    events: [
      {
        title: 'Akad nikah',
        starts_at: ymd + 'T08:00:00+07:00',
        ends_at: ymd + 'T10:00:00+07:00',
        venue_name: 'Masjid Raya Al-Falah',
        address: 'Jl. Melati No. 12, Kota Bandung',
        maps_url: 'https://maps.google.com/?q=Bandung',
      },
      {
        title: 'Resepsi',
        starts_at: ymd + 'T11:00:00+07:00',
        ends_at: ymd + 'T14:00:00+07:00',
        venue_name: 'Gedung Sasana Budaya',
        address: 'Jl. Kenanga No. 8, Kota Bandung',
        maps_url: 'https://maps.google.com/?q=Bandung',
      },
    ],
    photos: [
      { storage_path: '/assets/demo/foto-1.svg', caption: null },
      { storage_path: '/assets/demo/foto-2.svg', caption: null },
      { storage_path: '/assets/demo/foto-3.svg', caption: null },
      { storage_path: '/assets/demo/foto-4.svg', caption: null },
      { storage_path: '/assets/demo/foto-2.svg', caption: null },
    ],
    gifts: [
      { bank_name: 'BCA', account_holder: 'Raka Pradipta', account_number: '1234567890', qris_path: null },
      { bank_name: 'QRIS', account_holder: 'Nadia Kirana', account_number: null, qris_path: '/assets/demo/qris-contoh.svg' },
    ],
    messages: [
      { guest_name: 'Dimas', attendance: 'hadir', message: 'Selamat menempuh hidup baru! Semoga jadi keluarga yang sakinah.', created_at: new Date().toISOString() },
      { guest_name: 'Putri & keluarga', attendance: 'tidak_hadir', message: 'Maaf belum bisa hadir, doa terbaik untuk kalian berdua.', created_at: new Date(Date.now() - 3600e3).toISOString() },
    ],
  };
})();
