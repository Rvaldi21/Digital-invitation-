// =====================================================================
// admin/gambar.js — KOMPRES FOTO SEBELUM UPLOAD
//
// Foto dari HP bisa 3–8 MB. Di sini foto diperkecil dan diubah ke WebP
// (±100–200 KB) langsung di browser, sebelum dikirim. Hasilnya: kuota
// Supabase gratis lebih awet dan undangan lebih cepat dibuka tamu.
// Ukuran & target diatur di config.js → ADMIN.
// =====================================================================

(function () {
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

  function toBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  // maxSize: sisi terpanjang (px). targetKB: target ukuran file.
  // minQuality: kualitas terendah yang boleh dipakai (QRIS perlu tinggi).
  async function compress(file, { maxSize, targetKB, minQuality = 0.5 }) {
    if (!IMAGE_TYPES.includes(file.type)) {
      throw new Error('Pilih file gambar JPG, PNG, atau WebP.');
    }
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error('Gambar tidak bisa dibaca. Coba file lain.');
    }

    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';   // latar putih untuk gambar transparan (mis. QRIS PNG)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (bitmap.close) bitmap.close();

    // Browser lama yang tidak bisa membuat WebP otomatis memakai JPG
    const probe = await toBlob(canvas, 'image/webp', QUALITY_STEPS[0]);
    const type = probe && probe.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

    // Turunkan kualitas sedikit demi sedikit sampai ukurannya masuk target
    let blob = null;
    for (const q of QUALITY_STEPS) {
      if (q < minQuality) break;
      blob = q === QUALITY_STEPS[0] && type === 'image/webp' ? probe : await toBlob(canvas, type, q);
      if (!blob || blob.size <= targetKB * 1024) break;
    }
    if (!blob) throw new Error('Gambar gagal diproses. Coba file lain.');
    return { blob, type, ext: type === 'image/webp' ? 'webp' : 'jpg' };
  }

  // Pratinjau gambar sebelum di-upload (data: diizinkan oleh aturan keamanan website)
  function toDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Pratinjau gagal dibuat.'));
      reader.readAsDataURL(blob);
    });
  }

  window.Admin.gambar = { compress, toDataUrl };
})();
