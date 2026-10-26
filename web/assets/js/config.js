// =====================================================================
// config.js — SEMUA PENGATURAN WEBSITE ADA DI SINI
// Ubah nilai di file ini saja; file lain tidak perlu disentuh.
// =====================================================================

window.APP_CONFIG = {

  // -------------------------------------------------------------------
  // KONEKSI SUPABASE
  // Ambil dari Supabase: tombol "Connect" (atas) atau Project Settings → API
  // Kunci ini AMAN untuk publik (dilindungi aturan RLS).
  // JANGAN PERNAH isi dengan kunci "service_role" / "secret".
  // Jika dikosongkan, website otomatis memakai DATA CONTOH (mode demo).
  // -------------------------------------------------------------------
  SUPABASE_URL: 'https://lfeojcxdejhcqhmwkrio.supabase.co',   // contoh: 'https://abcdefgh.supabase.co'
  SUPABASE_KEY: 'sb_publishable_8pHtZkn-mGUjgegtJsmVNg_8Y5UxjTw',   // contoh: 'sb_publishable_xxxx' atau kunci 'anon'

  STORAGE_BUCKET: 'undangan-media',

  // -------------------------------------------------------------------
  // WAKTU & BAHASA
  // -------------------------------------------------------------------
  LOCALE: 'id-ID',
  TIMEZONE: 'Asia/Jakarta',   // Asia/Makassar (WITA), Asia/Jayapura (WIT)
  TIMEZONE_LABEL: 'WIB',

  // -------------------------------------------------------------------
  // TEKS BAWAAN (dipakai jika data undangan tidak mengisinya)
  // -------------------------------------------------------------------
  TEXT: {
    coverGreeting: 'Kepada Yth.',
    coverDefaultGuest: 'Bapak/Ibu/Saudara/i',
    coverOpen: 'Buka undangan',
    openingDefault:
      'Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir ' +
      'dan memberikan doa restu pada hari pernikahan kami.',
    sonOf: 'Putra dari',
    daughterOf: 'Putri dari',
    countdownTitle: 'Menuju hari bahagia',
    eventsTitle: 'Waktu dan tempat',
    openMaps: 'Buka peta',
    galleryTitle: 'Galeri',
    giftTitle: 'Amplop digital',
    giftIntro: 'Doa restu Anda sudah sangat berarti. Jika ingin memberi tanda kasih, bisa melalui:',
    copy: 'Salin nomor',
    copied: 'Nomor disalin',
    rsvpTitle: 'Konfirmasi kehadiran',
    rsvpClosed: 'Konfirmasi kehadiran sudah ditutup.',
    rsvpSend: 'Kirim konfirmasi',
    rsvpSending: 'Mengirim…',
    rsvpThanks: 'Terima kasih, konfirmasi Anda sudah kami terima.',
    messagesTitle: 'Ucapan dan doa',
    messagesEmpty: 'Belum ada ucapan. Jadilah yang pertama mengirim doa.',
    closing: 'Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.',
    notFound: 'Undangan tidak ditemukan. Periksa kembali link yang Anda terima.',
    loadError: 'Undangan gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.',
    demoNotice: 'Mode demo: ini data contoh, konfirmasi tidak disimpan.',
  },

  ATTENDANCE_LABELS: {
    hadir: 'Hadir',
    tidak_hadir: 'Tidak hadir',
    ragu: 'Masih ragu',
  },

  MAX_GUESTS: 10,      // samakan dengan batas di database
  MAX_MESSAGE: 500,

  // -------------------------------------------------------------------
  // PANEL ADMIN (/admin/)
  // -------------------------------------------------------------------
  ADMIN: {
    // Alamat website untuk link undangan yang dibagikan ke tamu.
    // Kosongkan = otomatis memakai alamat website yang sedang dibuka.
    // contoh: 'https://digital-invitation.namakamu.workers.dev'
    SITE_URL: '',

    // Foto dikompres otomatis ke WebP sebelum di-upload (hemat kuota Supabase)
    PHOTO_MAX_SIZE: 1600,   // sisi terpanjang foto, dalam piksel
    PHOTO_TARGET_KB: 200,   // target ukuran tiap foto
    QRIS_MAX_SIZE: 1200,    // QRIS jangan terlalu kecil supaya tetap bisa dipindai
    MUSIC_MAX_MB: 5,        // samakan dengan batas di 04_storage.sql

    // Pesan WhatsApp saat membagikan link.
    // {nama}, {mempelai}, dan {link} diganti otomatis.
    SHARE_MESSAGE:
      'Kepada Yth.\n{nama}\n\n' +
      'Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i ' +
      'untuk hadir di acara pernikahan kami, {mempelai}.\n\n' +
      'Info lengkap acara:\n{link}\n\n' +
      'Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i ' +
      'berkenan hadir dan memberikan doa restu.\n\nTerima kasih.',
  },
};
