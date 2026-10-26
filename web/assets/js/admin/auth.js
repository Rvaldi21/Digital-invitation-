// =====================================================================
// admin/auth.js — LOGIN ADMIN (Supabase Auth)
//
// Analogi: login = menukar email+password dengan "kartu akses" (token).
// Setiap permintaan ke database membawa kartu ini, sehingga aturan RLS
// tahu siapa yang meminta. Kartu berlaku ±1 jam lalu diperpanjang
// otomatis memakai "kartu cadangan" (refresh token).
//
// Kunci yang dipakai tetap kunci publishable dari config.js.
// Sesi disimpan di browser ini (localStorage) sampai tombol Keluar ditekan.
// =====================================================================

(function () {
  const cfg = window.APP_CONFIG;
  const STORE_KEY = 'undangan-admin-sesi';
  const base = cfg.SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1';

  let session = read();
  let refreshing = null;

  function read() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
  }

  function write(s) {
    session = s;
    try {
      if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s));
      else localStorage.removeItem(STORE_KEY);
    } catch { /* penyimpanan browser diblokir: sesi hanya bertahan selama halaman terbuka */ }
  }

  function friendly(data, status) {
    const code = data && (data.error_code || data.error);
    if (code === 'invalid_credentials' || code === 'invalid_grant') return 'Email atau password salah.';
    if (code === 'email_not_confirmed') return 'Email akun ini belum dikonfirmasi.';
    if (code === 'over_request_rate_limit' || status === 429) {
      return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
    }
    return (data && (data.msg || data.error_description || data.message)) || `Login gagal (${status}).`;
  }

  function expired() {
    const err = new Error('Sesi login sudah habis. Silakan masuk lagi.');
    err.sessionExpired = true;
    return err;
  }

  function endSession() {
    write(null);
    window.dispatchEvent(new Event('admin:sesi-habis'));
  }

  async function requestToken(grantType, body) {
    let res;
    try {
      res = await fetch(`${base}/token?grant_type=${grantType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.SUPABASE_KEY },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('Tidak bisa terhubung. Periksa koneksi internet.');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(friendly(data, res.status));
      err.status = res.status;
      throw err;
    }
    write({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
      user: { id: data.user.id, email: data.user.email },
    });
    return session;
  }

  function login(email, password) {
    return requestToken('password', { email, password });
  }

  // Perpanjang kartu akses. Dipanggil bersamaan pun hanya jalan sekali.
  function refresh() {
    if (!session) return Promise.reject(expired());
    if (!refreshing) {
      refreshing = requestToken('refresh_token', { refresh_token: session.refresh_token })
        .catch((err) => {
          // 4xx = kartu cadangan sudah tidak berlaku → wajib login ulang.
          // Selain itu (mis. internet putus) sesi tetap disimpan.
          if (err.status >= 400 && err.status < 500) { endSession(); throw expired(); }
          throw err;
        })
        .finally(() => { refreshing = null; });
    }
    return refreshing;
  }

  async function accessToken() {
    if (!session) throw expired();
    if (session.expires_at - 60 * 1000 < Date.now()) await refresh();
    return session.access_token;
  }

  async function logout() {
    const old = session;
    write(null);
    if (!old) return;
    try {
      await fetch(`${base}/logout`, {
        method: 'POST',
        headers: { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + old.access_token },
      });
    } catch { /* tidak apa-apa: sesi di browser ini sudah dihapus */ }
  }

  window.Admin.auth = {
    login, logout, refresh, accessToken,
    isLoggedIn: () => !!session,
    user: () => session && session.user,
  };
})();
