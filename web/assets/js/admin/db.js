// =====================================================================
// admin/db.js — BACA/TULIS DATABASE & FILE (setelah login)
//
// Setiap permintaan membawa token login, jadi aturan RLS di database
// tetap berlaku: database sendiri yang memutuskan boleh atau tidak.
// Panel admin TIDAK PERNAH memakai kunci service_role/secret.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const { auth } = window.Admin;
  const base = cfg.SUPABASE_URL.replace(/\/+$/, '');
  const bucket = encodeURIComponent(cfg.STORAGE_BUCKET);
  const JSON_TYPE = { 'Content-Type': 'application/json' };

  // Pesan error teknis → bahasa sehari-hari
  function friendly(data, status) {
    const code = data && data.code;
    const msg = (data && (data.message || data.error)) || '';
    const st = Number((data && data.statusCode) || status);   // Storage menaruh status di isi pesan
    if (code === '23505') return 'Link (slug) itu sudah dipakai undangan lain. Pilih yang lain.';
    if (code === '23514' || code === '22001') return 'Ada isian yang terlalu panjang atau formatnya tidak sesuai.';
    if (code === '23502') return 'Ada isian wajib yang masih kosong.';
    // Pesan dari penjaga kolom di 02_keamanan.sql sudah berbahasa Indonesia
    if (code === '42501' && !/permission denied/i.test(msg)) return msg;
    if (code === '42501' || st === 403 || /row-level security/i.test(msg)) {
      return 'Akun ini tidak punya izin untuk melakukan itu.';
    }
    if (st === 413 || /maximum allowed size|too large/i.test(msg)) return 'File terlalu besar.';
    if (/mime type/i.test(msg)) return 'Jenis file tidak didukung.';
    return msg || `Permintaan gagal (${status}).`;
  }

  async function request(path, { method = 'GET', headers = {}, body } = {}, retried = false) {
    const token = await auth.accessToken();
    let res;
    try {
      res = await fetch(base + path, {
        method,
        body,
        headers: { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + token, ...headers },
      });
    } catch {
      throw new Error('Tidak bisa terhubung. Periksa koneksi internet.');
    }
    // Token ditolak (mis. HP baru bangun dari tidur): perpanjang lalu ulangi sekali
    if (res.status === 401 && !retried) {
      await auth.refresh();
      return request(path, { method, headers, body }, true);
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!res.ok) throw new Error(friendly(data, res.status));
    return data;
  }

  const eqId = (id) => `id=eq.${encodeURIComponent(id)}`;
  const returning = { ...JSON_TYPE, Prefer: 'return=representation' };

  // ---------- Tabel ----------

  function select(table, query) {
    return request(`/rest/v1/${table}?${query}`);
  }

  async function insert(table, row) {
    const rows = await request(`/rest/v1/${table}`, {
      method: 'POST', headers: returning, body: JSON.stringify(row),
    });
    return rows[0];
  }

  async function update(table, id, patch) {
    const rows = await request(`/rest/v1/${table}?${eqId(id)}`, {
      method: 'PATCH', headers: returning, body: JSON.stringify(patch),
    });
    if (!rows || !rows.length) throw new Error('Data tidak ditemukan atau akun ini tidak punya izin.');
    return rows[0];
  }

  function remove(table, id) {
    return request(`/rest/v1/${table}?${eqId(id)}`, { method: 'DELETE' });
  }

  // ---------- File (Storage) ----------
  // Pola lokasi file: <id-undangan>/<nama-file>  (wajib, lihat 04_storage.sql)

  const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

  function upload(path, blob, contentType) {
    return request(`/storage/v1/object/${bucket}/${encodePath(path)}`, {
      method: 'POST',
      headers: { 'Content-Type': contentType, 'cache-control': 'max-age=31536000', 'x-upsert': 'false' },
      body: blob,
    });
  }

  async function removeFiles(paths) {
    const list = [].concat(paths).filter(Boolean);
    if (!list.length) return;
    await request(`/storage/v1/object/${bucket}`, {
      method: 'DELETE', headers: JSON_TYPE, body: JSON.stringify({ prefixes: list }),
    });
  }

  // Hapus file lama tanpa mengganggu pengguna jika gagal (sisa file tidak berbahaya)
  function forget(paths) {
    removeFiles(paths).catch((err) => console.warn('File lama gagal dihapus:', err));
  }

  function listFiles(prefix) {
    return request(`/storage/v1/object/list/${bucket}`, {
      method: 'POST', headers: JSON_TYPE, body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
    });
  }

  // Semua file satu undangan: folder <id>/ dan <id>/galeri/
  async function removeFolder(invitationId) {
    const paths = [];
    for (const folder of [invitationId, `${invitationId}/galeri`]) {
      const items = (await listFiles(folder)) || [];
      for (const it of items) if (it.id) paths.push(`${folder}/${it.name}`);   // id kosong = subfolder
    }
    await removeFiles(paths);
  }

  window.Admin.db = {
    select, insert, update, remove,
    storage: { upload, remove: removeFiles, forget, removeFolder },
  };
})();
