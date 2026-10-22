/**
 * Joyous Hotel — App shell
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

  /* Auth chip + modal (UI only — real auth later) */
  const authChip = $('#authChip');
  const authModal = $('#authModal');
  const authForm = $('#authForm');
  const authError = $('#authError');
  const authLabel = $('#authLabel');

  let session = null;
  try {
    session = JSON.parse(localStorage.getItem('nordic_guest_session') || 'null');
  } catch (_) {}

  function updateAuthUI() {
    if (session && session.name) {
      authLabel.textContent = session.name.split(' ')[0];
    } else {
      authLabel.textContent = 'Sign in';
    }
  }
  updateAuthUI();

  authChip?.addEventListener('click', () => {
    if (session) {
      if (confirm('Sign out?')) {
        localStorage.removeItem('nordic_guest_session');
        session = null;
        updateAuthUI();
      }
      return;
    }
    authModal.hidden = false;
    authError.hidden = true;
  });

  authModal?.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => { authModal.hidden = true; });
  });

  authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#authId')?.value.trim();
    const pass = $('#authPass')?.value;
    // Simulated validation — will fail on empty / obviously wrong
    if (!id || !pass || pass.length < 4) {
      authError.textContent = 'Invalid details. Please check and try again.';
      authError.hidden = false;
      return;
    }
    // Demo success path (replace with real auth later)
    session = { name: id.includes('@') ? id.split('@')[0] : id, id };
    localStorage.setItem('nordic_guest_session', JSON.stringify(session));
    updateAuthUI();
    authModal.hidden = true;
  });

  $('#forgotBtn')?.addEventListener('click', () => {
    alert('Password reset will be available soon. Please contact the hotel for now.');
  });

  /* Events — empty state is default; can be filled later from backend */
  // NordicAI.setEvents([...]) when live data exists

  /* Header scroll */
  const header = $('#appHeader');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();
