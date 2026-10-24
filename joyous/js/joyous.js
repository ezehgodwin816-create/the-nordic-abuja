/**
 * Joyous — shell + Supabase login (no local passwords)
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  const sideNav = $('#sideNav');
  const backdrop = $('#navBackdrop');
  const menuToggle = $('#menuToggle');
  const closeNav = $('#closeNav');

  function openNav() {
    sideNav?.classList.add('open');
    backdrop?.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeNavFn() {
    sideNav?.classList.remove('open');
    backdrop?.classList.remove('show');
    document.body.style.overflow = '';
  }
  menuToggle?.addEventListener('click', openNav);
  closeNav?.addEventListener('click', closeNavFn);
  backdrop?.addEventListener('click', closeNavFn);

  const authChip = $('#authChip');
  const authModal = $('#authModal');
  const authForm = $('#authForm');
  const authError = $('#authError');
  const authLabel = $('#authLabel');
  const roleTabs = $('#authRoles');
  let authRole = 'guest';

  async function refreshAuthUI() {
    if (!window.NordicAuth) {
      if (authLabel) authLabel.textContent = 'Sign in';
      return;
    }
    const s = await NordicAuth.getSession();
    if (s && s.name) {
      authLabel.textContent = s.name.split(' ')[0] + (s.role !== 'guest' ? ' · ' + s.role : '');
    } else {
      authLabel.textContent = 'Sign in';
    }
  }
  // Non-blocking — do not delay first tap
  setTimeout(function () {
    refreshAuthUI();
    if (window.NordicAuth && NordicAuth.loadStaffCache) {
      NordicAuth.loadStaffCache('joyous');
    }
  }, 50);

  function openModal() {
    if (!authModal) {
      location.href = '../shared/login.html';
      return;
    }
    authModal.hidden = false;
    authModal.style.display = 'flex';
    if (authError) { authError.hidden = true; authError.textContent = ''; }
  }
  function closeModal() {
    if (!authModal) return;
    authModal.hidden = true;
    authModal.style.display = 'none';
  }

  authChip?.addEventListener('click', async () => {
    const s = window.NordicAuth ? await NordicAuth.getSession() : null;
    if (s) {
      if (confirm('Sign out ' + (s.email || s.name) + '?')) {
        await NordicAuth.logout();
        await refreshAuthUI();
      }
      return;
    }
    openModal();
  });

  authModal?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));

  roleTabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-role]');
    if (!btn) return;
    authRole = btn.getAttribute('data-role');
    roleTabs.querySelectorAll('[data-role]').forEach(b => b.classList.toggle('active', b === btn));
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#authId')?.value.trim();
    const pass = $('#authPass')?.value || '';
    if (!window.NordicAuth) {
      authError.textContent = 'Auth not loaded. Refresh page.';
      authError.hidden = false;
      return;
    }
    const submitBtn = authForm.querySelector('[type=submit]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }
    const result = await NordicAuth.login(id, pass, authRole);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Continue'; }
    if (!result.ok) {
      authError.textContent = result.error || 'Login failed';
      authError.hidden = false;
      return;
    }
    await refreshAuthUI();
    closeModal();
    if (result.redirect) location.href = result.redirect;
  });

  $('#forgotBtn')?.addEventListener('click', () => {
    alert('Password reset uses Supabase. Enable email reset in your Supabase Auth settings, or reset from the Supabase dashboard.');
  });

  $('#switchToRegister')?.addEventListener('click', async () => {
    const id = $('#authId')?.value.trim();
    const pass = $('#authPass')?.value || '';
    const r = await NordicAuth.register(id, pass);
    authError.hidden = false;
    authError.style.color = r.ok ? '#3ecf8e' : '';
    authError.textContent = r.ok ? (r.message || 'Registered') : (r.error || 'Failed');
    if (r.ok && r.session) {
      await refreshAuthUI();
      closeModal();
    }
  });

  const header = $('#appHeader');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();
