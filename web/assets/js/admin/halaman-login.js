// =====================================================================
// admin/halaman-login.js — HALAMAN MASUK
// Akun admin dibuat di Supabase (Authentication → Users), bukan di sini.
// =====================================================================

(function () {
  const { auth, ui } = window.Admin;
  const { el, field } = ui;

  window.Admin.views.login = function (notice) {
    const email = el('input', { type: 'email', inputmode: 'email', autocomplete: 'username', required: true });
    const password = el('input', { type: 'password', autocomplete: 'current-password', required: true });
    const show = el('input', { type: 'checkbox' });
    show.addEventListener('change', () => { password.type = show.checked ? 'text' : 'password'; });

    const msg = el('p', { class: 'form-msg form-msg--error', role: 'alert', hidden: !notice }, notice || '');
    const btn = el('button', { class: 'btn btn--block', type: 'submit' }, 'Masuk');

    const form = el('form', { class: 'card stack', novalidate: true },
      field('Email', email),
      field('Password', password),
      ui.checkbox('Tampilkan password', show),
      msg,
      btn,
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = true;
      if (!email.value.trim() || !password.value) {
        msg.textContent = 'Isi email dan password.';
        msg.hidden = false;
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Memeriksa…';
      try {
        await auth.login(email.value.trim(), password.value);
        window.Admin.app.render();
      } catch (err) {
        msg.textContent = err.message;
        msg.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Masuk';
      }
    });

    return el('div', { class: 'login' },
      el('span', { class: 'kawung-mark', 'aria-hidden': 'true' }),
      el('h1', { class: 'page-title' }, 'Masuk admin'),
      form,
    );
  };
})();
