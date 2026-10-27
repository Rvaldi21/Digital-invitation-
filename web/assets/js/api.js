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

  // ---------- Pratinjau untuk admin (?pratinjau=1) ----------
  // Membaca undangan apa pun statusnya (draft juga), memakai sesi login
  // panel admin di browser yang sama. Aturan RLS tetap berlaku: tanpa
  // login admin, data tidak akan keluar.

  const SESSION_KEY = 'undangan-admin-sesi';   // sama dengan admin/auth.js

  function previewLoginError() {
    const err = new Error(cfg.TEXT.previewLogin);
    err.previewLogin = true;
    return err;
  }

  async function adminToken() {
    let s;
    try { s = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { s = null; }
    if (!s) throw previewLoginError();
    if (s.expires_at - 60 * 1000 > Date.now()) return s.access_token;

    // Token hampir habis: perpanjang memakai refresh token
    const res = await fetch(cfg.SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.SUPABASE_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw previewLoginError();
    s = { ...s, access_token: data.access_token, refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000 };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* tidak apa-apa */ }
    return s.access_token;
  }

  const bySort = (a, b) => (a.sort_order - b.sort_order) || String(a.created_at || a.starts_at)
    .localeCompare(String(b.created_at || b.starts_at));

  async function getPreview(slug) {
    const token = await adminToken();
    const select = [
      '*',
      'events:invitation_events(title,starts_at,ends_at,venue_name,address,maps_url,sort_order)',
      'photos:invitation_photos(storage_path,caption,sort_order,created_at)',
      'gifts:gift_accounts(bank_name,account_holder,account_number,qris_path,sort_order)',
      'messages:rsvps(guest_name,attendance,message,created_at,is_hidden)',
    ].join(',');
    const url = cfg.SUPABASE_URL.replace(/\/+$/, '') +
      `/rest/v1/invitations?slug=eq.${encodeURIComponent(slug)}&select=${select}`;
    const res = await fetch(url, { headers: { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + token } });
    if (res.status === 401) throw previewLoginError();
    if (!res.ok) throw new Error('Pratinjau gagal dimuat (' + res.status + ')');
    const inv = (await res.json())[0];
    if (!inv) return null;

    // Samakan bentuk & urutan dengan hasil get_invitation
    inv.events.sort(bySort);
    inv.photos.sort(bySort);
    inv.gifts.sort(bySort);
    inv.messages = inv.messages
      .filter((m) => !m.is_hidden && m.message)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 100);
    return inv;
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

  window.API = { isDemoMode, getInvitation, getPreview, submitRsvp, mediaUrl };
})();
