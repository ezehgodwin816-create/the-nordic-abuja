(function () {
  const panel = document.getElementById('panel');
  const shade = document.getElementById('shade');
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    panel?.classList.add('open');
    shade?.classList.add('show');
  });
  document.getElementById('closePanel')?.addEventListener('click', close);
  shade?.addEventListener('click', close);
  function close() {
    panel?.classList.remove('open');
    shade?.classList.remove('show');
  }

  let session = null;
  try { session = JSON.parse(localStorage.getItem('nordic_guest_session') || 'null'); } catch (_) {}
  const chip = document.getElementById('authChip');
  const modal = document.getElementById('authModal');
  const err = document.getElementById('authError');
  function update() {
    if (chip) chip.textContent = session?.name ? session.name.split(' ')[0] : 'Sign in';
  }
  update();
  chip?.addEventListener('click', () => {
    if (session) {
      if (confirm('Sign out?')) { localStorage.removeItem('nordic_guest_session'); session = null; update(); }
      return;
    }
    modal.hidden = false; err.hidden = true;
  });
  modal?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { modal.hidden = true; }));
  document.getElementById('authForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('authId')?.value.trim();
    const pass = document.getElementById('authPass')?.value;
    if (!id || !pass || pass.length < 4) {
      err.textContent = 'Invalid details. Please try again.';
      err.hidden = false;
      return;
    }
    session = { name: id.includes('@') ? id.split('@')[0] : id, id };
    localStorage.setItem('nordic_guest_session', JSON.stringify(session));
    update();
    modal.hidden = true;
  });
})();
