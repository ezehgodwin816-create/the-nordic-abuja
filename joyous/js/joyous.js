/**
 * Joyous Hotel — App shell + multi-role login
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* Nav */
  const sideNav = $('#sideNav');
  const backdrop = $('#navBackdrop');
  const menuToggle = $('#menuToggle');
  const closeNav = $('#closeNav');

  function openNav() {
    sideNav?.classList.add('open');
    backdrop?.classList.add('show');
    sideNav?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeNavFn() {
    sideNav?.classList.remove('open');
    backdrop?.classList.remove('show');
    sideNav?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  menuToggle?.addEventListener('click', openNav);
  closeNav?.addEventListener('click', closeNavFn);
  backdrop?.addEventListener('click', closeNavFn);

  /* Auth */
  const authChip = $('#authChip');
  const authModal = $('#authModal');
  const authForm = $('#authForm');
  const authError = $('#authError');
  const authLabel = $('#authLabel');
  const roleTabs = $('#authRoles');

  let authRole = 'guest';

  function session() {
    if (window.NordicAuth) return NordicAuth.getSession();
    try { return JSON.parse(localStorage.getItem('nordic_session_v2') || 'null'); } catch (e) { return null; }
  }

  function updateAuthUI() {
    const s = session();
    if (s && s.name) {
      const tag = s.role === 'guest' ? '' : ' · ' + s.role;
      authLabel.textContent = (s.name.split(' ')[0] || s.name) + tag;
    } else {
      authLabel.textContent = 'Sign in';
    }
  }
  updateAuthUI();

  function openModal() {
    if (!authModal) return;
    authModal.hidden = false;
    authModal.style.display = 'flex';
    if (authError) { authError.hidden = true; authError.textContent = ''; }
  }
  function closeModal() {
    if (!authModal) return;
    authModal.hidden = true;
    authModal.style.display = 'none';
  }

  authChip?.addEventListener('click', () => {
    const s = session();
    if (s) {
      if (confirm('Sign out ' + (s.name || '') + '?')) {
        if (window.NordicAuth) NordicAuth.logout();
        else localStorage.removeItem('nordic_session_v2');
        updateAuthUI();
      }
      return;
    }
    openModal();
  });

  authModal?.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  roleTabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-role]');
    if (!btn) return;
    authRole = btn.getAttribute('data-role');
    roleTabs.querySelectorAll('[data-role]').forEach(b => b.classList.toggle('active', b === btn));
    const note = $('#authRoleNote');
    if (note) {
      const notes = {
        guest: 'Guests: any email + password (4+ chars).',
        staff: 'Staff demo: staff.joyous@nordic.ng / staff123',
        admin: 'Admin demo: admin.joyous@nordic.ng / admin123',
        super: 'Central Command: super@nordic.ng / super123'
      };
      note.textContent = notes[authRole] || '';
    }
  });

  authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#authId')?.value.trim();
    const pass = $('#authPass')?.value || '';
    if (!window.NordicAuth) {
      authError.textContent = 'Auth system not loaded. Refresh the page.';
      authError.hidden = false;
      return;
    }
    const result = NordicAuth.login(id, pass, authRole);
    if (!result.ok) {
      authError.textContent = result.error || 'Login failed.';
      authError.hidden = false;
      return;
    }
    updateAuthUI();
    closeModal();
    if (result.redirect) {
      location.href = result.redirect;
    }
  });

  $('#forgotBtn')?.addEventListener('click', () => {
    alert('Password reset will be available soon. Contact the hotel for now.');
  });

  $('#switchToRegister')?.addEventListener('click', () => {
    alert('Guest accounts are created automatically on first sign-in with any new email.');
  });

  /* Header scroll */
  const header = $('#appHeader');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();
