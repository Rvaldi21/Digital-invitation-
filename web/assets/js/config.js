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
  SUPABASE_URL: '',   // contoh: 'https://abcdefgh.supabase.co'
  SUPABASE_KEY: '',   // contoh: 'sb_publishable_xxxx' atau kunci 'anon'

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
};
