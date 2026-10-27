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
    coverLead: 'Undangan pernikahan',
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
    previewNotice: 'Mode pratinjau: hanya admin yang melihat halaman ini. Konfirmasi tidak disimpan.',
    previewLogin: 'Pratinjau hanya untuk admin. Buka panel admin dan login dulu, lalu tekan Pratinjau lagi.',
  },

  // -------------------------------------------------------------------
  // TEMPLATE
  // Tiap template punya file tampilan sendiri: assets/css/template-<nama>.css
  // (klasik memakai tampilan dasar undangan.css). Nama di sini harus sama
  // dengan nama file-nya. Contoh tampilan: /undangan/?u=demo&t=<nama>
  //   label        nama yang tampil di panel admin
  //   description  keterangan singkat untuk memilih
  //   color        warna bilah browser di HP
  //   TEXT         (opsional) mengganti teks bawaan di atas khusus template ini
  //   QUOTE        (opsional) kutipan di bagian pembuka
  // -------------------------------------------------------------------
  TEMPLATES: {
    klasik: {
      label: 'Klasik',
      description: 'Biru nila, hijau daun, emas, motif batik kawung.',
      color: '#1F2A44',
    },
    rustic: {
      label: 'Rustic',
      description: 'Krem & cokelat hangat, ranting daun dan bunga kering.',
      color: '#F4ECE1',
      TEXT: { coverLead: 'The Wedding of' },
    },
    islami: {
      label: 'Islami elegan',
      description: 'Hijau zamrud & emas, ornamen geometris, ayat QS Ar-Rum: 21.',
      color: '#0E3B31',
      TEXT: {
        coverLead: "Walimatul 'Ursy",
        openingDefault:
          "Assalamu'alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat dan ridha " +
          'Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.',
        closing:
          'Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i ' +
          "berkenan hadir dan memberikan doa restu. Wassalamu'alaikum Warahmatullahi Wabarakatuh.",
      },
      QUOTE: {
        arab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        text:
          'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan ' +
          'untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, ' +
          'dan Dia menjadikan di antaramu rasa kasih dan sayang.',
        source: 'QS. Ar-Rum: 21',
      },
    },
    jawa: {
      label: 'Adat Jawa',
      description: 'Cokelat sogan & emas, gunungan dan motif parang.',
      color: '#3A281B',
      TEXT: {
        coverLead: 'Pawiwahan',
        closing:
          'Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan rawuh ' +
          'dan paring pangestu. Matur nuwun.',
      },
    },
    modern: {
      label: 'Modern minimalis',
      description: 'Putih bersih & hitam, tegas, banyak ruang kosong.',
      color: '#FFFFFF',
      TEXT: { coverLead: 'We are getting married' },
    },
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
    // contoh: 'https://ayo.njagong.workers.dev'
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
