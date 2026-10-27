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
    storyTitle: 'Kisah kami',
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
  //   SCRIPT       (opsional) tulisan khas di sampul: kaligrafi Arab / aksara Jawa
  // Gambar contoh untuk panel admin & beranda: assets/contoh-template/<nama>.jpg
  // -------------------------------------------------------------------
  TEMPLATES: {
    klasik: {
      label: 'Klasik',
      description: 'Biru nila & emas, bingkai dan sudut batik kawung.',
      color: '#1F2A44',
    },
    rustic: {
      label: 'Rustic',
      description: 'Krem & cokelat hangat, buket mawar dan daun kering di sudut.',
      color: '#F4ECE1',
      TEXT: { coverLead: 'The Wedding of' },
    },
    islami: {
      label: 'Islami elegan',
      description: 'Hijau zamrud & emas, gapura, lentera, kaligrafi, QS Ar-Rum: 21.',
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
      // Kaligrafi "Barakallahu lakuma" (semoga Allah memberkahi kalian berdua)
      SCRIPT: { text: 'بارك الله لكما', lang: 'ar' },
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
      description: 'Cokelat sogan & emas, gunungan, pita parang, aksara Jawa.',
      color: '#3A281B',
      // "Pawiwahan" (pernikahan) dalam aksara Jawa
      SCRIPT: { text: 'ꦥꦮꦶꦮꦲꦤ꧀', lang: 'jv' },
      TEXT: {
        coverLead: 'Pawiwahan',
        closing:
          'Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan rawuh ' +
          'dan paring pangestu. Matur nuwun.',
      },
    },
    modern: {
      label: 'Modern minimalis',
      description: 'Putih & hitam, monogram inisial, bingkai garis tipis.',
      color: '#FFFFFF',
      TEXT: { coverLead: 'We are getting married' },
    },
    taman: {
      label: 'Taman bunga',
      description: 'Biru kabut & krem, bunga cat air, gapura taman, kelopak berjatuhan.',
      color: '#F4F1EA',
      TEXT: { coverLead: 'The Wedding of' },
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

  // -------------------------------------------------------------------
  // PROMOSI DI BAGIAN PALING BAWAH SETIAP UNDANGAN
  // Tamu yang tertarik bisa langsung ke website atau WhatsApp Njagong.
  // Nomor WA & akun IG/TikTok diambil dari BERANDA di bawah.
  // -------------------------------------------------------------------
  PROMO: {
    TAMPIL: true,                        // false = promosi tidak ditampilkan
    TEKS: 'Undangan digital oleh',
    NAMA: 'Njagong',
    AJAKAN: 'Mau undangan seperti ini? Mulai Rp49 ribu.',
    PESAN_WA: 'Halo Njagong, saya lihat undangan digital buatan Njagong dan tertarik pesan.',
  },

  // -------------------------------------------------------------------
  // HALAMAN BERANDA (halaman jualan di alamat utama website)
  // -------------------------------------------------------------------
  BERANDA: {
    // Nomor WhatsApp untuk pesanan: format internasional TANPA "+", spasi, atau "0"
    // di depan. Contoh: 0812-3456-7890 → '6281234567890'.
    // Kosong = tombol WhatsApp tidak tampil.
    WHATSAPP: '817092336911',   // sementara: nomor Jepang 070-9233-6911 (kode negara 81)

    // Nama akun (tanpa @). Kosong = tidak ditampilkan.
    INSTAGRAM: '',
    TIKTOK: '',

    // Pesan otomatis saat calon pembeli menekan tombol pesan.
    // {paket} diganti nama paket yang dipilih.
    PESAN_WA: 'Halo Njagong, saya mau pesan undangan digital paket {paket}.',
    PESAN_WA_UMUM: 'Halo Njagong, saya mau tanya-tanya soal undangan digital.',

    // Daftar paket. Ubah nama, harga, dan isinya sesuka Anda.
    //   harga  : angka saja (tanpa titik), mis. 89000
    //   coret  : harga sebelum diskon (0 = tidak ada coretan)
    //   populer: true = diberi tanda "Paling laris" (cukup satu paket)
    PAKET: [
      {
        nama: 'Hemat',
        harga: 49000,
        coret: 0,
        catatan: 'Cukup untuk acara sederhana',
        populer: false,
        fitur: [
          'Pilih 1 dari {jumlah} template',   // {jumlah} = jumlah template, otomatis
          'Nama tamu di setiap link',
          'Info acara + petunjuk lokasi (Maps)',
          'Hitung mundur hari-H',
          'Konfirmasi kehadiran (RSVP) & ucapan',
          'Aktif 3 bulan',
          '1x revisi',
        ],
      },
      {
        nama: 'Lengkap',
        harga: 89000,
        coret: 129000,
        catatan: 'Pilihan kebanyakan pasangan',
        populer: true,
        fitur: [
          'Semua isi paket Hemat',
          'Galeri foto (hingga 10 foto)',
          'Musik latar',
          'Amplop digital: rekening & QRIS',
          'Aktif 6 bulan',
          '3x revisi',
        ],
      },
      {
        nama: 'Eksklusif',
        harga: 149000,
        coret: 0,
        catatan: 'Untuk hari yang paling istimewa',
        populer: false,
        fitur: [
          'Semua isi paket Lengkap',
          'Galeri foto (hingga 20 foto)',
          'Dibantu menyusun kata-kata undangan',
          'Dikerjakan paling dulu (prioritas)',
          'Aktif 12 bulan',
          'Revisi sepuasnya sebelum disebar',
        ],
      },
    ],

    // Pertanyaan yang sering ditanyakan
    FAQ: [
      {
        tanya: 'Berapa lama undangan jadi?',
        jawab: 'Biasanya 1–2 hari kerja setelah semua data dan foto kami terima.',
      },
      {
        tanya: 'Data apa saja yang perlu dikirim?',
        jawab: 'Nama lengkap mempelai & orang tua, tanggal dan lokasi acara, foto (bila ada), ' +
          'lagu pilihan, serta nomor rekening/QRIS bila memakai amplop digital. Cukup kirim lewat WhatsApp.',
      },
      {
        tanya: 'Bisa dikirim ke banyak tamu dengan nama berbeda?',
        jawab: 'Bisa, tanpa batas. Setiap tamu mendapat link dengan namanya sendiri, ' +
          'lengkap dengan pesan WhatsApp yang siap dikirim.',
      },
      {
        tanya: 'Apakah tamu perlu memasang aplikasi?',
        jawab: 'Tidak. Undangan dibuka langsung dari browser HP, cukup tekan link-nya.',
      },
      {
        tanya: 'Bagaimana cara bayarnya?',
        jawab: 'Lewat transfer bank atau QRIS. Pembayaran setelah contoh undangan Anda kami tunjukkan.',
      },
    ],
  },
};
