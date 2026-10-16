// =====================================================================
// api.js — PENGHUBUNG KE SUPABASE
// Hanya memanggil 2 "loket" publik: get_invitation dan submit_rsvp.
// Tidak butuh library tambahan; cukup fetch bawaan browser.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;

  function isDemoMode(slug) {
    return slug === 'demo' || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY;
  }

  function headers() {
    const h = { 'Content-Type': 'application/json', apikey: cfg.SUPABASE_KEY };
    // Kunci lama (anon, berbentuk JWT) juga perlu header Authorization.
    // Kunci baru (sb_publishable_...) cukup header apikey.
    if (!cfg.SUPABASE_KEY.startsWith('sb_')) {
      h.Authorization = 'Bearer ' + cfg.SUPABASE_KEY;
    }
    return h;
  }

  async function rpc(name, body) {
    const url = cfg.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/' + name;
    const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error((data && data.message) || 'Permintaan gagal (' + res.status + ')');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Mengubah lokasi file di Storage menjadi URL yang bisa dibuka browser
  function mediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('/assets/')) return path; // file contoh lokal (mode demo)
    const clean = path.split('/').map(encodeURIComponent).join('/');
    return cfg.SUPABASE_URL.replace(/\/+$/, '') +
      '/storage/v1/object/public/' + cfg.STORAGE_BUCKET + '/' + clean;
  }

  async function getInvitation(slug) {
    if (isDemoMode(slug)) return structuredClone(window.DEMO_INVITATION);
    return rpc('get_invitation', { p_slug: slug });
  }

  async function submitRsvp(slug, form) {
    if (isDemoMode(slug)) {
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true, demo: true };
    }
    return rpc('submit_rsvp', {
      p_slug: slug,
      p_guest_name: form.name,
      p_attendance: form.attendance,
      p_guest_count: form.count,
      p_message: form.message || null,
    });
  }

  window.API = { isDemoMode, getInvitation, submitRsvp, mediaUrl };
})();
