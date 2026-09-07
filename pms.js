const URL_ =
'https://rzjvhfnizwckzbdawrbn.supabase.co';

const KEY =
'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob';

const db = supabase.createClient(URL_, KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

let B = [];
let R = [];
let RT = [];
let G = [];
let HK = [];
let MT = [];
let P = [];
let F = [];

/* =========================
BASIC HELPERS
========================= */

const $ = id => document.getElementById(id);

function show(id) {
  const el = $(id);
  if (el) el.classList.remove('hidden');
}

function hide(id) {
  const el = $(id);
  if (el) el.classList.add('hidden');
}

function text(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(value) {
  const n = Number(value || 0);

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2
  }).format(n);
}

function dateValue(value) {
  if (!value) return '-';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/* =========================
LOGIN / AUTH UI
========================= */

function showLogin() {
  hide('app');
  hide('reset');
  show('login');

  const email = $('email');
  if (email) email.focus();
}

function showApp() {
  hide('login');
  hide('reset');
  show('app');

  loadDashboard();
}

function showReset() {
  hide('login');
  hide('app');
  show('reset');

  const password = $('newPassword');
  if (password) password.focus();
}

function setLoginError(message) {
  const el = $('loginError');

  if (el) {
    el.textContent = message || '';
  }
}

function setResetError(message) {
  const el = $('resetError');

  if (el) {
    el.textContent = message || '';
  }
}

/* =========================
PASSWORD RECOVERY URL
========================= */

function isRecoveryUrl() {
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  return (
    hash.includes('type=recovery') ||
    search.includes('type=recovery')
  );
}

/* =========================
ADMIN CHECK
========================= */

async function verifyAdmin() {
  const { data, error } =
    await db.rpc('is_admin_user');

  if (error) {
    throw error;
  }

  return data === true;
}

/* =========================
LOGIN
========================= */

async function login(email, password) {
  setLoginError('');

  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    setLoginError(
      error.message || 'Invalid login credentials.'
    );

    return false;
  }

  if (!data || !data.user) {
    setLoginError(
      'Login completed but no user session was returned.'
    );

    return false;
  }

  try {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) {
      setLoginError(
        'This account does not have administrator access.'
      );

      await db.auth.signOut();

      return false;
    }

  } catch (adminError) {
    setLoginError(
      'Unable to verify administrator access: ' +
      adminError.message
    );

    await db.auth.signOut();

    return false;
  }

  showApp();

  return true;
}

/* =========================
LOGIN FORM
========================= */

const loginForm = $('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();

    const email =
      $('email')?.value.trim();

    const password =
      $('password')?.value || '';

    if (!email || !password) {
      setLoginError(
        'Please enter your email and password.'
      );

      return;
    }

    const button =
      loginForm.querySelector(
        'button[type="submit"]'
      );

    const originalText =
      button?.textContent;

    if (button) {
      button.disabled = true;
      button.textContent = 'Signing in...';
    }

    try {
      await login(email, password);

    } catch (error) {
      console.error('Login error:', error);

      setLoginError(
        error?.message ||
        'Unable to sign in.'
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          originalText || 'Sign In';
      }
    }
  });
}

/* =========================
FORGOT PASSWORD
========================= */

const forgotPassword =
  $('forgotPassword');

if (forgotPassword) {
  forgotPassword.addEventListener(
    'click',
    async event => {
      event.preventDefault();

      setLoginError('');

      const email =
        $('email')?.value.trim();

      if (!email) {
        setLoginError(
          'Enter your email address first, then tap Forgot Password.'
        );

        if ($('email')) {
          $('email').focus();
        }

        return;
      }

      const originalText =
        forgotPassword.textContent;

      forgotPassword.disabled = true;
      forgotPassword.textContent =
        'Sending...';

      try {
        const redirectTo =
          window.location.origin +
          window.location.pathname;

        console.log(
          'Password recovery redirect:',
          redirectTo
        );

        const { error } =
          await db.auth.resetPasswordForEmail(
            email,
            {
              redirectTo
            }
          );

        if (error) {
          console.error(
            'Password recovery error:',
            error
          );

          setLoginError(
            'Failed to send password recovery: ' +
            error.message
          );

          return;
        }

        setLoginError(
          'Password reset email sent. Check your email and open the new recovery link.'
        );

      } catch (error) {
        console.error(
          'Password recovery request failed:',
          error
        );

        setLoginError(
          'Failed to send password recovery: ' +
          (
            error?.message ||
            'Network error.'
          )
        );

      } finally {
        forgotPassword.disabled = false;
        forgotPassword.textContent =
          originalText;
      }
    }
  );
}

/* =========================
BACK TO LOGIN
========================= */

const backToLogin =
  $('backToLogin');

if (backToLogin) {
  backToLogin.addEventListener(
    'click',
    event => {
      event.preventDefault();

      setResetError('');

      showLogin();
    }
  );
}

/* =========================
RESET PASSWORD
========================= */

const resetForm =
  $('resetForm');

if (resetForm) {
  resetForm.addEventListener(
    'submit',
    async event => {
      event.preventDefault();

      setResetError('');

      const password =
        $('newPassword')?.value || '';

      const confirmPassword =
        $('confirmPassword')?.value || '';

      if (!password) {
        setResetError(
          'Enter your new password.'
        );

        return;
      }

      if (password.length < 6) {
        setResetError(
          'Password must be at least 6 characters.'
        );

        return;
      }

      if (password !== confirmPassword) {
        setResetError(
          'Passwords do not match.'
        );

        return;
      }

      const button =
        resetForm.querySelector(
          'button[type="submit"]'
        );

      const originalText =
        button?.textContent;

      if (button) {
        button.disabled = true;
        button.textContent =
          'Updating...';
      }

      try {
        const { data, error } =
          await db.auth.updateUser({
            password
          });

        if (error) {
          setResetError(
            error.message ||
            'Unable to update password.'
          );

          return;
        }

        if (!data || !data.user) {
          setResetError(
            'Password update completed, but the account session could not be confirmed.'
          );

          return;
        }

        setResetError('');

        alert(
          'Password updated successfully. You can now sign in with your new password.'
        );

        await db.auth.signOut();

        resetForm.reset();

        showLogin();

      } catch (error) {
        console.error(
          'Password update error:',
          error
        );

        setResetError(
          error?.message ||
          'Unable to update password.'
        );

      } finally {
        if (button) {
          button.disabled = false;
          button.textContent =
            originalText ||
            'Update Password';
        }
      }
    }
  );
}

/* =========================
LOGOUT
========================= */

async function logout() {
  await db.auth.signOut();

  B = [];
  R = [];
  RT = [];
  G = [];
  HK = [];
  MT = [];
  P = [];
  F = [];

  showLogin();
}

const logoutButton =
  $('logout');

if (logoutButton) {
  logoutButton.addEventListener(
    'click',
    async event => {
      event.preventDefault();

      try {
        await logout();
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );
      }
    }
  );
}

/* /* =========================
MOBILE MENU
========================= */

const menuButton =
  $('menu');

const sideBar =
  $('side');

if (menuButton && sideBar) {

  /*
   * The menu button already has its own
   * inline toggle in pms.html.
   *
   * We DO NOT toggle the sidebar again here.
   * Doing so would open it and immediately
   * close it on the same tap.
   */

  menuButton.addEventListener(
    'click',
    () => {

      const isOpen =
        sideBar.classList.contains('open');

      menuButton.setAttribute(
        'aria-expanded',
        isOpen ? 'true' : 'false'
      );

    }
  );

  /*
   * Close the sidebar when the user taps
   * outside it on mobile.
   */

  document.addEventListener(
    'click',
    event => {

      const clickedInsideSidebar =
        sideBar.contains(event.target);

      const clickedMenu =
        menuButton.contains(event.target);

      if (
        !clickedInsideSidebar &&
        !clickedMenu
      ) {

        sideBar.classList.remove(
          'open'
        );

        menuButton.setAttribute(
          'aria-expanded',
          'false'
        );

      }

    }
  );

}

/* =========================
DASHBOARD
========================= */

async function loadDashboard() {
  try {
    const { data, error } =
      await db.rpc(
        'pms_dashboard_stats'
      );

    if (error) {
      console.error(
        'Dashboard error:',
        error
      );

      return;
    }

    const stats = data || {};

    text(
      'roomsTotal',
      stats.rooms_total ?? 0
    );

    text(
      'roomsAvailable',
      stats.rooms_available ?? 0
    );

    text(
      'roomsOccupied',
      stats.rooms_occupied ?? 0
    );

    text(
      'roomsMaintenance',
      stats.rooms_maintenance ?? 0
    );

    text(
      'bookingsPending',
      stats.bookings_pending ?? 0
    );

    text(
      'bookingsConfirmed',
      stats.bookings_confirmed ?? 0
    );

    text(
      'revenuePaid',
      money(stats.revenue_paid ?? 0)
    );

    text(
      'openMaintenance',
      stats.open_maintenance ?? 0
    );

  } catch (error) {
    console.error(
      'Dashboard loading failed:',
      error
    );
  }
}

/* =========================
BOOKINGS
========================= */

async function loadBookings() {
  const { data, error } =
    await db
      .from('bookings')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Bookings error:',
      error
    );

    return;
  }

  B = data || [];

  renderBookings();
}

function renderBookings() {
  const table =
    $('bookingsTable');

  if (!table) return;

  if (!B.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No bookings found.</td></tr>';

    return;
  }

  table.innerHTML =
    B.map(
      booking => `
        <tr>
          <td>${escapeHtml(booking.id)}</td>
          <td>${escapeHtml(
            booking.guest_name ||
            booking.full_name ||
            '-'
          )}</td>
          <td>${escapeHtml(
            booking.email || '-'
          )}</td>
          <td>${escapeHtml(
            booking.room_id ||
            booking.room_number ||
            '-'
          )}</td>
          <td>${dateValue(
            booking.check_in
          )}</td>
          <td>${dateValue(
            booking.check_out
          )}</td>
          <td>${escapeHtml(
            booking.status || '-'
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
ROOMS
========================= */

async function loadRooms() {
  const { data, error } =
    await db
      .from('rooms')
      .select('*')
      .order(
        'room_number',
        { ascending: true }
      );

  if (error) {
    console.error(
      'Rooms error:',
      error
    );

    return;
  }

  R = data || [];

  renderRooms();
}

function renderRooms() {
  const table =
    $('roomsTable');

  if (!table) return;

  if (!R.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No rooms found.</td></tr>';

    return;
  }

  table.innerHTML =
    R.map(
      room => `
        <tr>
          <td>${escapeHtml(
            room.room_number ||
            room.number ||
            '-'
          )}</td>
          <td>${escapeHtml(
            room.room_type_id ||
            room.room_type ||
            '-'
          )}</td>
          <td>${escapeHtml(
            room.status || '-'
          )}</td>
          <td>${escapeHtml(
            room.floor || '-'
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
ROOM TYPES
========================= */

async function loadRoomTypes() {
  const { data, error } =
    await db
      .from('room_types')
      .select('*')
      .order(
        'name',
        { ascending: true }
      );

  if (error) {
    console.error(
      'Room types error:',
      error
    );

    return;
  }

  RT = data || [];

  renderRoomTypes();
}

function renderRoomTypes() {
  const table =
    $('roomTypesTable');

  if (!table) return;

  if (!RT.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No room types found.</td></tr>';

    return;
  }

  table.innerHTML =
    RT.map(
      roomType => `
        <tr>
          <td>${escapeHtml(
            roomType.name || '-'
          )}</td>
          <td>${escapeHtml(
            roomType.description || '-'
          )}</td>
          <td>${money(
            roomType.base_rate ||
            roomType.price ||
            0
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
GUESTS
========================= */

async function loadGuests() {
  const { data, error } =
    await db
      .from('guest_profiles')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Guests error:',
      error
    );

    return;
  }

  G = data || [];

  renderGuests();
}

function renderGuests() {
  const table =
    $('guestsTable');

  if (!table) return;

  if (!G.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No guests found.</td></tr>';

    return;
  }

  table.innerHTML =
    G.map(
      guest => `
        <tr>
          <td>${escapeHtml(
            guest.full_name ||
            guest.name ||
            '-'
          )}</td>
          <td>${escapeHtml(
            guest.email || '-'
          )}</td>
          <td>${escapeHtml(
            guest.phone || '-'
          )}</td>
          <td>${dateValue(
            guest.created_at
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
HOUSEKEEPING
========================= */

async function loadHousekeeping() {
  const { data, error } =
    await db
      .from('housekeeping_tasks')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Housekeeping error:',
      error
    );

    return;
  }

  HK = data || [];

  renderHousekeeping();
}

function renderHousekeeping() {
  const table =
    $('housekeepingTable');

  if (!table) return;

  if (!HK.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No housekeeping tasks found.</td></tr>';

    return;
  }

  table.innerHTML =
    HK.map(
      task => `
        <tr>
          <td>${escapeHtml(
            task.room_id || '-'
          )}</td>
          <td>${escapeHtml(
            task.task_type ||
            task.type ||
            '-'
          )}</td>
          <td>${escapeHtml(
            task.status || '-'
          )}</td>
          <td>${escapeHtml(
            task.assigned_to || '-'
          )}</td>
          <td>${dateValue(
            task.created_at
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
MAINTENANCE
========================= */

async function loadMaintenance() {
  const { data, error } =
    await db
      .from('maintenance_tasks')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Maintenance error:',
      error
    );

    return;
  }

  MT = data || [];

  renderMaintenance();
}

function renderMaintenance() {
  const table =
    $('maintenanceTable');

  if (!table) return;

  if (!MT.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No maintenance tasks found.</td></tr>';

    return;
  }

  table.innerHTML =
    MT.map(
      task => `
        <tr>
          <td>${escapeHtml(
            task.room_id || '-'
          )}</td>
          <td>${escapeHtml(
            task.title ||
            task.task_type ||
            '-'
          )}</td>
          <td>${escapeHtml(
            task.status || '-'
          )}</td>
          <td>${escapeHtml(
            task.priority || '-'
          )}</td>
          <td>${dateValue(
            task.created_at
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
PAYMENTS
========================= */

async function loadPayments() {
  const { data, error } =
    await db
      .from('payments')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Payments error:',
      error
    );

    return;
  }

  P = data || [];

  renderPayments();
}

function renderPayments() {
  const table =
    $('paymentsTable');

  if (!table) return;

  if (!P.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No payments found.</td></tr>';

    return;
  }

  table.innerHTML =
    P.map(
      payment => `
        <tr>
          <td>${escapeHtml(
            payment.id
          )}</td>
          <td>${money(
            payment.amount
          )}</td>
          <td>${escapeHtml(
            payment.method ||
            payment.payment_method ||
            '-'
          )}</td>
          <td>${escapeHtml(
            payment.status || '-'
          )}</td>
          <td>${dateValue(
            payment.created_at
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
FOLIOS
========================= */

async function loadFolios() {
  const { data, error } =
    await db
      .from('folios')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Folios error:',
      error
    );

    return;
  }

  F = data || [];

  renderFolios();
}

function renderFolios() {
  const table =
    $('foliosTable');

  if (!table) return;

  if (!F.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No folios found.</td></tr>';

    return;
  }

  table.innerHTML =
    F.map(
      folio => `
        <tr>
          <td>${escapeHtml(
            folio.id
          )}</td>
          <td>${escapeHtml(
            folio.booking_id || '-'
          )}</td>
          <td>${money(
            folio.total ||
            folio.amount ||
            0
          )}</td>
          <td>${escapeHtml(
            folio.status || '-'
          )}</td>
          <td>${dateValue(
            folio.created_at
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
STAFF
========================= */

async function loadStaff() {
  const { data, error } =
    await db
      .from('staff_profiles')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
      );

  if (error) {
    console.error(
      'Staff error:',
      error
    );

    return;
  }

  renderStaff(data || []);
}

function renderStaff(staff) {
  const table =
    $('staffTable');

  if (!table) return;

  if (!staff.length) {
    table.innerHTML =
      '<tr><td colspan="100%">No staff found.</td></tr>';

    return;
  }

  table.innerHTML =
    staff.map(
      member => `
        <tr>
          <td>${escapeHtml(
            member.full_name ||
            member.name ||
            '-'
          )}</td>
          <td>${escapeHtml(
            member.role || '-'
          )}</td>
          <td>${escapeHtml(
            member.email || '-'
          )}</td>
          <td>${escapeHtml(
            member.phone || '-'
          )}</td>
          <td>${escapeHtml(
            member.status || '-'
          )}</td>
        </tr>
      `
    ).join('');
}

/* =========================
LOAD ALL
========================= */

async function loadAll() {
  await Promise.allSettled([
    loadDashboard(),
    loadBookings(),
    loadRooms(),
    loadRoomTypes(),
    loadGuests(),
    loadHousekeeping(),
    loadMaintenance(),
    loadPayments(),
    loadFolios(),
    loadStaff()
  ]);
}

/* =========================
NAVIGATION
========================= */

document
  .querySelectorAll('[data-section]')
  .forEach(button => {

    button.addEventListener(
      'click',
      async () => {

        const section =
          button.dataset.section;

        document
          .querySelectorAll('[data-section]')
          .forEach(item => {
            item.classList.remove(
              'active'
            );
          });

        button.classList.add(
          'active'
        );

        document
          .querySelectorAll('.pms-section')
          .forEach(panel => {
            panel.classList.add(
              'hidden'
            );
          });

        const target =
          $(section);

        if (target) {
          target.classList.remove(
            'hidden'
          );
        }

        /*
         * On mobile, close the sidebar
         * after selecting a section.
         */
        if (sideBar) {
          sideBar.classList.remove(
            'open'
          );
        }

        if (section === 'dashboard') {
          await loadDashboard();
        }

        if (section === 'bookings') {
          await loadBookings();
        }

        if (section === 'rooms') {
          await loadRooms();
        }

        if (section === 'guests') {
          await loadGuests();
        }

        if (section === 'housekeeping') {
          await loadHousekeeping();
        }

        if (section === 'maintenance') {
          await loadMaintenance();
        }

        if (section === 'payments') {
          await loadPayments();
        }

        if (section === 'folios') {
          await loadFolios();
        }

        if (section === 'staff') {
          await loadStaff();
        }

        if (section === 'rates') {
          await loadRoomTypes();
        }
      }
    );
  });

/* =========================
AUTH STATE LISTENER
========================= */

db.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      'Auth event:',
      event
    );

    if (
      event ===
      'PASSWORD_RECOVERY'
    ) {
      showReset();
      return;
    }

    if (
      event ===
      'SIGNED_OUT'
    ) {
      showLogin();
      return;
    }

    if (
      event === 'SIGNED_IN' &&
      session
    ) {

      if (isRecoveryUrl()) {
        showReset();
        return;
      }

      try {
        const isAdmin =
          await verifyAdmin();

        if (isAdmin) {
          showApp();
        } else {
          setLoginError(
            'This account does not have administrator access.'
          );

          await db.auth.signOut();
        }

      } catch (error) {
        console.error(
          'Admin verification error:',
          error
        );

        setLoginError(
          'Unable to verify administrator access.'
        );

        await db.auth.signOut();
      }
    }
  }
);

/* =========================
INITIALISE
========================= */

async function initialise() {

  try {

    if (isRecoveryUrl()) {
      showReset();
      return;
    }

    const {
      data,
      error
    } = await db.auth.getSession();

    if (error) {
      console.error(
        'Session error:',
        error
      );

      showLogin();
      return;
    }

    const session =
      data?.session;

    if (!session) {
      showLogin();
      return;
    }

    const isAdmin =
      await verifyAdmin();

    if (!isAdmin) {

      await db.auth.signOut();

      setLoginError(
        'This account does not have administrator access.'
      );

      return;
    }

    showApp();

  } catch (error) {

    console.error(
      'Initialisation error:',
      error
    );

    showLogin();

  }
}

/* =========================
START PMS
========================= */

initialise();
/* =========================================================
   GUESTS & CRM — EDIT / ADD / DELETE
========================================================= */

let editingGuestId = null;


/* =========================
   GUEST MODAL
========================= */

function createGuestModal() {

  if ($('guestModal')) return;

  const modal = document.createElement('div');

  modal.id = 'guestModal';

  modal.innerHTML = `
    <div class="guest-modal-backdrop">

      <div class="guest-modal-card">

        <div class="guest-modal-head">

          <div>
            <h2 id="guestModalTitle">
              Add Guest
            </h2>

            <div class="muted">
              Guest profile information
            </div>
          </div>

          <button
            type="button"
            class="secondary"
            id="closeGuestModal"
          >
            ✕
          </button>

        </div>


        <form id="guestForm">

          <div class="guest-form-grid">

            <div>
              <label>First name</label>

              <input
                id="guestFirstName"
                type="text"
                required
              >
            </div>


            <div>
              <label>Last name</label>

              <input
                id="guestLastName"
                type="text"
              >
            </div>


            <div>
              <label>Email</label>

              <input
                id="guestEmail"
                type="email"
              >
            </div>


            <div>
              <label>Phone</label>

              <input
                id="guestPhone"
                type="text"
              >
            </div>


            <div>
              <label>Address</label>

              <input
                id="guestAddress"
                type="text"
              >
            </div>


            <div>
              <label>City</label>

              <input
                id="guestCity"
                type="text"
              >
            </div>


            <div>
              <label>Country</label>

              <input
                id="guestCountry"
                type="text"
                value="Nigeria"
              >
            </div>


            <div>
              <label>Nationality</label>

              <input
                id="guestNationality"
                type="text"
              >
            </div>


            <div>
              <label>ID type</label>

              <select id="guestIdType">

                <option value="">
                  Select ID type
                </option>

                <option value="passport">
                  Passport
                </option>

                <option value="national_id">
                  National ID
                </option>

                <option value="drivers_license">
                  Driver's License
                </option>

                <option value="voters_card">
                  Voter's Card
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </div>


            <div>
              <label>ID number</label>

              <input
                id="guestIdNumber"
                type="text"
              >
            </div>


            <div class="guest-full">

              <label>Notes</label>

              <textarea
                id="guestNotes"
                rows="4"
              ></textarea>

            </div>


            <div class="guest-full">

              <label class="guest-check">

                <input
                  id="guestVip"
                  type="checkbox"
                >

                <span>
                  VIP guest
                </span>

              </label>

            </div>

          </div>


          <div
            id="guestFormError"
            class="guest-form-error"
          ></div>


          <div class="guest-modal-actions">

            <button
              type="button"
              class="secondary"
              id="cancelGuest"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="primary"
              id="saveGuest"
            >
              Save Guest
            </button>

          </div>

        </form>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  $('closeGuestModal')
    .addEventListener(
      'click',
      closeGuestModal
    );


  $('cancelGuest')
    .addEventListener(
      'click',
      closeGuestModal
    );


  $('guestForm')
    .addEventListener(
      'submit',
      saveGuest
    );

}


/* =========================
   OPEN MODAL
========================= */

function openGuestModal(guest = null) {

  createGuestModal();

  editingGuestId =
    guest?.id || null;

  $('guestModalTitle').textContent =
    guest
      ? 'Edit Guest'
      : 'Add Guest';

  $('guestFirstName').value =
    guest?.first_name || '';

  $('guestLastName').value =
    guest?.last_name || '';

  $('guestEmail').value =
    guest?.email || '';

  $('guestPhone').value =
    guest?.phone || '';

  $('guestAddress').value =
    guest?.address || '';

  $('guestCity').value =
    guest?.city || '';

  $('guestCountry').value =
    guest?.country || 'Nigeria';

  $('guestNationality').value =
    guest?.nationality || '';

  $('guestIdType').value =
    guest?.id_type || '';

  $('guestIdNumber').value =
    guest?.id_number || '';

  $('guestNotes').value =
    guest?.notes || '';

  $('guestVip').checked =
    guest?.vip === true;

  $('guestFormError').textContent =
    '';

  $('guestModal')
    .classList.add('show');

}


/* =========================
   CLOSE MODAL
========================= */

function closeGuestModal() {

  const modal =
    $('guestModal');

  if (modal) {
    modal.classList.remove('show');
  }

  editingGuestId = null;

}


/* =========================
   SAVE GUEST
========================= */

async function saveGuest(event) {

  event.preventDefault();

  const errorBox =
    $('guestFormError');

  const saveButton =
    $('saveGuest');

  errorBox.textContent = '';

  const firstName =
    $('guestFirstName')
      .value
      .trim();

  if (!firstName) {

    errorBox.textContent =
      'First name is required.';

    return;
  }


  const payload = {

    first_name:
      firstName,

    last_name:
      $('guestLastName')
        .value
        .trim() || null,

    email:
      $('guestEmail')
        .value
        .trim() || null,

    phone:
      $('guestPhone')
        .value
        .trim() || null,

    address:
      $('guestAddress')
        .value
        .trim() || null,

    city:
      $('guestCity')
        .value
        .trim() || null,

    country:
      $('guestCountry')
        .value
        .trim() ||
      'Nigeria',

    nationality:
      $('guestNationality')
        .value
        .trim() || null,

    id_type:
      $('guestIdType')
        .value || null,

    id_number:
      $('guestIdNumber')
        .value
        .trim() || null,

    notes:
      $('guestNotes')
        .value
        .trim() || null,

    vip:
      $('guestVip').checked

  };


  const originalText =
    saveButton.textContent;

  saveButton.disabled = true;

  saveButton.textContent =
    editingGuestId
      ? 'Saving...'
      : 'Creating...';


  try {

    let result;


    if (editingGuestId) {

      result =
        await db
          .from('guest_profiles')
          .update(payload)
          .eq(
            'id',
            editingGuestId
          )
          .select()
          .single();

    } else {

      result =
        await db
          .from('guest_profiles')
          .insert(payload)
          .select()
          .single();

    }


    if (result.error) {
      throw result.error;
    }


    try {

      await db.rpc(
        'pms_audit',
        {
          p_action:
            editingGuestId
              ? 'update_guest'
              : 'create_guest',

          p_entity_type:
            'guest_profile',

          p_entity_id:
            result.data?.id ||
            editingGuestId,

          p_details:
            {
              first_name:
                payload.first_name,

              last_name:
                payload.last_name,

              vip:
                payload.vip
            }
        }
      );

    } catch (auditError) {

      console.warn(
        'Guest audit log failed:',
        auditError
      );

    }


    closeGuestModal();

    await loadGuests();

    alert(
      editingGuestId
        ? 'Guest updated successfully.'
        : 'Guest added successfully.'
    );


  } catch (error) {

    console.error(
      'Guest save error:',
      error
    );

    errorBox.textContent =
      error?.message ||
      'Unable to save guest.';


  } finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      originalText;

  }

}


/* =========================
   DELETE GUEST
========================= */

async function deleteGuest(id) {

  const guest =
    G.find(
      item =>
        item.id === id
    );

  if (!guest) return;


  const name =
    [
      guest.first_name,
      guest.last_name
    ]
      .filter(Boolean)
      .join(' ');


  const confirmed =
    confirm(
      `Delete guest "${name || 'this guest'}"?\n\nThis action cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  try {

    const { error } =
      await db
        .from('guest_profiles')
        .delete()
        .eq(
          'id',
          id
        );


    if (error) {
      throw error;
    }


    try {

      await db.rpc(
        'pms_audit',
        {
          p_action:
            'delete_guest',

          p_entity_type:
            'guest_profile',

          p_entity_id:
            id,

          p_details:
            {
              first_name:
                guest.first_name,

              last_name:
                guest.last_name
            }
        }
      );

    } catch (auditError) {

      console.warn(
        'Guest audit log failed:',
        auditError
      );

    }


    await loadGuests();

    alert(
      'Guest deleted successfully.'
    );


  } catch (error) {

    console.error(
      'Guest delete error:',
      error
    );

    alert(
      'Unable to delete guest: ' +
      (
        error?.message ||
        'Unknown error.'
      )
    );

  }

}


/* =========================
   REPLACE GUEST RENDERER
========================= */

function renderGuests() {

  const table =
    $('guestsTable');

  if (!table) return;


  if (!G.length) {

    table.innerHTML = `
      <tr>
        <td colspan="100%">
          No guests found.
        </td>
      </tr>
    `;

    return;
  }


  table.innerHTML =
    G.map(
      guest => {

        const name =
          [
            guest.first_name,
            guest.last_name
          ]
            .filter(Boolean)
            .join(' ');


        return `
          <tr>

            <td>
              ${escapeHtml(
                name || '-'
              )}
            </td>

            <td>
              ${escapeHtml(
                guest.email || '-'
              )}
            </td>

            <td>
              ${escapeHtml(
                guest.phone || '-'
              )}
            </td>

            <td>
              ${escapeHtml(
                guest.country || '-'
              )}
            </td>

            <td>
              ${
                guest.vip
                  ? '⭐ VIP'
                  : '—'
              }
            </td>

            <td>

              <button
                type="button"
                class="secondary guest-edit-button"
                data-guest-id="${guest.id}"
              >
                Edit
              </button>

              <button
                type="button"
                class="secondary guest-delete-button"
                data-guest-id="${guest.id}"
              >
                Delete
              </button>

            </td>

          </tr>
        `;

      }
    ).join('');


  /*
   * Add Actions header automatically.
   */

  const header =
    table
      .closest('table')
      ?.querySelector('thead tr');


  if (header) {

    const alreadyExists =
      header.querySelector(
        '[data-guest-actions-header]'
      );

    if (!alreadyExists) {

      const th =
        document.createElement('th');

      th.textContent =
        'Actions';

      th.dataset.guestActionsHeader =
        'true';

      header.appendChild(th);

    }

  }


  table
    .querySelectorAll(
      '.guest-edit-button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const guest =
            G.find(
              item =>
                String(item.id) ===
                String(
                  button.dataset.guestId
                )
            );

          if (guest) {
            openGuestModal(guest);
          }

        }
      );

    });


  table
    .querySelectorAll(
      '.guest-delete-button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          deleteGuest(
            button.dataset.guestId
          );

        }
      );

    });

}


/* =========================
   ADD GUEST BUTTON
========================= */

function addGuest() {

  openGuestModal();

}


/* =========================
   GUEST TOOLBAR
========================= */

function addGuestToolbar() {

  const section =
    $('guests');

  if (!section) return;


  const head =
    section.querySelector(
      '.head'
    );

  if (!head) return;


  if (
    section.querySelector(
      '#addGuestButton'
    )
  ) {
    return;
  }


  const button =
    document.createElement(
      'button'
    );

  button.id =
    'addGuestButton';

  button.type =
    'button';

  button.className =
    'primary';

  button.textContent =
    '+ Add Guest';

  button.style.marginTop =
    '12px';

  button.addEventListener(
    'click',
    addGuest
  );


  head.appendChild(button);

}


/* =========================
   GUEST CSS
========================= */

(function addGuestStyles() {

  if (
    document.getElementById(
      'guestCrudStyles'
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      'style'
    );

  style.id =
    'guestCrudStyles';


  style.textContent = `

    #guestModal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
    }

    #guestModal.show {
      display: block;
    }

    .guest-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow-y: auto;
    }

    .guest-modal-card {
      width: min(760px, 96vw);
      max-height: 92vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 25px 80px rgba(0,0,0,.28);
    }

    .guest-modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 20px;
    }

    .guest-modal-head h2 {
      margin: 0 0 5px;
      font-family: Georgia, serif;
    }

    .guest-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .guest-form-grid > div {
      min-width: 0;
    }

    .guest-full {
      grid-column: 1 / -1;
    }

    .guest-form-grid label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #4d5651;
    }

    .guest-form-grid input,
    .guest-form-grid select,
    .guest-form-grid textarea {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #e2ded7;
      border-radius: 8px;
      background: #fff;
      font: inherit;
      color: #202723;
    }

    .guest-form-grid textarea {
      resize: vertical;
    }

    .guest-check {
      display: flex !important;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .guest-check input {
      width: auto;
    }

    .guest-form-error {
      color: #a33b34;
      margin-top: 12px;
      min-height: 20px;
    }

    .guest-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e2ded7;
    }

    .guest-edit-button,
    .guest-delete-button {
      margin: 2px;
    }

    @media (max-width: 600px) {

      .guest-form-grid {
        grid-template-columns: 1fr;
      }

      .guest-full {
        grid-column: auto;
      }

      .guest-modal-card {
        padding: 16px;
      }

      .guest-modal-actions {
        flex-direction: column-reverse;
      }

      .guest-modal-actions button {
        width: 100%;
      }

    }

  `;


  document.head.appendChild(style);

})();


/* =========================
   GUEST SECTION HOOK
========================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    addGuestToolbar();

  }
);


/*
 * If the PMS is already loaded when this
 * code runs, create the button immediately.
 */

addGuestToolbar();
/* =========================================================
   ROOMS MANAGEMENT — ADD / EDIT / DELETE / STATUS
========================================================= */

let editingRoomId = null;


/* =========================
   ROOM MODAL
========================= */

function createRoomModal() {

  if ($('roomModal')) return;

  const modal = document.createElement('div');

  modal.id = 'roomModal';

  modal.innerHTML = `
    <div class="room-modal-backdrop">

      <div class="room-modal-card">

        <div class="room-modal-head">

          <div>
            <h2 id="roomModalTitle">
              Add Room
            </h2>

            <div class="muted">
              Room information
            </div>
          </div>

          <button
            type="button"
            class="secondary"
            id="closeRoomModal"
          >
            ✕
          </button>

        </div>


        <form id="roomForm">

          <div class="room-form-grid">

            <div>
              <label>Room number</label>

              <input
                id="roomNumber"
                type="text"
                required
                placeholder="e.g. 101"
              >
            </div>


            <div>
              <label>Floor</label>

              <input
                id="roomFloor"
                type="text"
                placeholder="e.g. Ground Floor"
              >
            </div>


            <div>
              <label>Room type</label>

              <select
                id="roomType"
                required
              >
                <option value="">
                  Select room type
                </option>
              </select>

            </div>


            <div>
              <label>Status</label>

              <select id="roomStatus">

                <option value="available">
                  Available
                </option>

                <option value="occupied">
                  Occupied
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="out_of_service">
                  Out of Service
                </option>

              </select>

            </div>

          </div>


          <div
            id="roomFormError"
            class="room-form-error"
          ></div>


          <div class="room-modal-actions">

            <button
              type="button"
              class="secondary"
              id="cancelRoom"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="primary"
              id="saveRoom"
            >
              Save Room
            </button>

          </div>

        </form>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  $('closeRoomModal')
    .addEventListener(
      'click',
      closeRoomModal
    );


  $('cancelRoom')
    .addEventListener(
      'click',
      closeRoomModal
    );


  $('roomForm')
    .addEventListener(
      'submit',
      saveRoom
    );

}


/* =========================
   LOAD ROOM TYPE OPTIONS
========================= */

async function populateRoomTypeOptions() {

  const select = $('roomType');

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Loading room types...
    </option>
  `;

  try {

    const { data, error } = await db
      .from('room_types')
      .select('id,name,slug,price_per_night,is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    RT.length = 0;

    if (Array.isArray(data)) {
      RT.push(...data);
    }

    select.innerHTML = `
      <option value="">
        Select room type
      </option>
    `;

    RT.forEach(roomType => {

      const option =
        document.createElement('option');

      option.value =
        roomType.id;

      option.textContent =
        roomType.name ||
        'Unnamed Room Type';

      select.appendChild(option);

    });

  } catch (error) {

    console.error(
      'Room type dropdown error:',
      error
    );

    select.innerHTML = `
      <option value="">
        Unable to load room types
      </option>
    `;

  }

}


/* =========================
   OPEN ROOM MODAL
========================= */

async function openRoomModal(room = null) {

  createRoomModal();

  editingRoomId =
    room?.id || null;

  $('roomModalTitle').textContent =
    room
      ? 'Edit Room'
      : 'Add Room';

  $('roomNumber').value =
    room?.room_number || '';

  $('roomFloor').value =
    room?.floor || '';

  $('roomStatus').value =
    room?.status || 'available';

  $('roomFormError').textContent =
    '';

  $('roomModal')
    .classList.add('show');

  await populateRoomTypeOptions();

  $('roomType').value =
    room?.room_type_id || '';

}


/* =========================
   CLOSE ROOM MODAL
========================= */

function closeRoomModal() {

  const modal =
    $('roomModal');

  if (modal) {

    modal.classList.remove(
      'show'
    );

  }

  editingRoomId = null;

}


/* =========================
   SAVE ROOM
========================= */

async function saveRoom(event) {

  event.preventDefault();


  const errorBox =
    $('roomFormError');

  const saveButton =
    $('saveRoom');


  errorBox.textContent = '';


  const roomNumber =
    $('roomNumber')
      .value
      .trim();


  const roomTypeId =
    $('roomType')
      .value;


  const floor =
    $('roomFloor')
      .value
      .trim();


  const status =
    $('roomStatus')
      .value;


  if (!roomNumber) {

    errorBox.textContent =
      'Room number is required.';

    return;

  }


  if (!roomTypeId) {

    errorBox.textContent =
      'Please select a room type.';

    return;

  }


  const payload = {

    room_number:
      roomNumber,

    room_type_id:
      roomTypeId,

    floor:
      floor || null,

    status:
      status

  };


  const originalText =
    saveButton.textContent;


  saveButton.disabled = true;

  saveButton.textContent =
    editingRoomId
      ? 'Saving...'
      : 'Creating...';


  try {

    let result;


    if (editingRoomId) {

      result =
        await db
          .from('rooms')
          .update(payload)
          .eq(
            'id',
            editingRoomId
          )
          .select()
          .single();

    } else {

      result =
        await db
          .from('rooms')
          .insert(payload)
          .select()
          .single();

    }


    if (result.error) {
      throw result.error;
    }


    try {

      await db.rpc(
        'pms_audit',
        {

          p_action:
            editingRoomId
              ? 'update_room'
              : 'create_room',

          p_entity_type:
            'room',

          p_entity_id:
            result.data?.id ||
            editingRoomId,

          p_details:
            {
              room_number:
                payload.room_number,

              room_type_id:
                payload.room_type_id,

              floor:
                payload.floor,

              status:
                payload.status
            }

        }
      );

    } catch (auditError) {

      console.warn(
        'Room audit log failed:',
        auditError
      );

    }


    closeRoomModal();


    await loadRooms();


    alert(
      editingRoomId
        ? 'Room updated successfully.'
        : 'Room added successfully.'
    );


  } catch (error) {

    console.error(
      'Room save error:',
      error
    );


    errorBox.textContent =
      error?.message ||
      'Unable to save room.';


  } finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      originalText;

  }

}


/* =========================
   DELETE ROOM
========================= */

async function deleteRoom(id) {

  const room =
    R.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!room) return;


  const confirmed =
    confirm(
      `Delete room "${room.room_number}"?\n\nThis action cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  try {

    const { error } =
      await db
        .from('rooms')
        .delete()
        .eq(
          'id',
          id
        );


    if (error) {
      throw error;
    }


    try {

      await db.rpc(
        'pms_audit',
        {

          p_action:
            'delete_room',

          p_entity_type:
            'room',

          p_entity_id:
            id,

          p_details:
            {
              room_number:
                room.room_number,

              room_type_id:
                room.room_type_id
            }

        }
      );

    } catch (auditError) {

      console.warn(
        'Room audit log failed:',
        auditError
      );

    }


    await loadRooms();


    alert(
      'Room deleted successfully.'
    );


  } catch (error) {

    console.error(
      'Room delete error:',
      error
    );


    alert(
      'Unable to delete room: ' +
      (
        error?.message ||
        'Unknown error.'
      )
    );

  }

}


/* =========================
   ROOM RENDERER
========================= */

function renderRooms() {

  const table =
    $('roomsTable');

  if (!table) return;


  if (!R.length) {

    table.innerHTML = `
      <tr>
        <td colspan="100%">
          No rooms found.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    R.map(
      room => {

        const roomType =
          RT.find(
            type =>
              String(type.id) ===
              String(
                room.room_type_id
              )
          );


        const roomTypeName =
          roomType?.name ||
          'Unknown';


        const status =
          String(
            room.status ||
            'available'
          );


        return `
          <tr>

            <td>
              ${escapeHtml(
                room.room_number ||
                '-'
              )}
            </td>


            <td>
              ${escapeHtml(
                roomTypeName
              )}
            </td>


            <td>

              <span class="badge">

                ${escapeHtml(
                  status
                    .replaceAll(
                      '_',
                      ' '
                    )
                    .replace(
                      /\b\w/g,
                      char =>
                        char.toUpperCase()
                    )
                )}

              </span>

            </td>


            <td>
              ${escapeHtml(
                room.floor ||
                '-'
              )}
            </td>


            <td>

              <button
                type="button"
                class="secondary room-edit-button"
                data-room-id="${room.id}"
              >
                Edit
              </button>


              <button
                type="button"
                class="secondary room-delete-button"
                data-room-id="${room.id}"
              >
                Delete
              </button>

            </td>

          </tr>
        `;

      }
    ).join('');


  table
    .querySelectorAll(
      '.room-edit-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const room =
              R.find(
                item =>
                  String(item.id) ===
                  String(
                    button.dataset.roomId
                  )
              );


            if (room) {

              openRoomModal(
                room
              );

            }

          }
        );

      }
    );


  table
    .querySelectorAll(
      '.room-delete-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            deleteRoom(
              button.dataset.roomId
            );

          }
        );

      }
    );

}


/* =========================
   ADD ROOM BUTTON
========================= */

function addRoom() {

  openRoomModal();

}


/* =========================
   ROOM TOOLBAR
========================= */

function addRoomToolbar() {

  const section =
    $('rooms');

  if (!section) return;


  const head =
    section.querySelector(
      '.head'
    );

  if (!head) return;


  if (
    section.querySelector(
      '#addRoomButton'
    )
  ) {
    return;
  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'addRoomButton';


  button.type =
    'button';


  button.className =
    'primary';


  button.textContent =
    '+ Add Room';


  button.style.marginTop =
    '12px';


  button.addEventListener(
    'click',
    addRoom
  );


  head.appendChild(
    button
  );

}


/* =========================
   ROOM CSS
========================= */

(function addRoomStyles() {

  if (
    document.getElementById(
      'roomCrudStyles'
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'roomCrudStyles';


  style.textContent = `

    #roomModal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
    }

    #roomModal.show {
      display: block;
    }

    .room-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow-y: auto;
    }

    .room-modal-card {
      width: min(650px, 96vw);
      max-height: 92vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 25px 80px rgba(0,0,0,.28);
    }

    .room-modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 20px;
    }

    .room-modal-head h2 {
      margin: 0 0 5px;
      font-family: Georgia, serif;
    }

    .room-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .room-form-grid > div {
      min-width: 0;
    }

    .room-form-grid label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #4d5651;
    }

    .room-form-grid input,
    .room-form-grid select {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #e2ded7;
      border-radius: 8px;
      background: #fff;
      font: inherit;
      color: #202723;
    }

    .room-form-error {
      color: #a33b34;
      margin-top: 12px;
      min-height: 20px;
    }

    .room-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e2ded7;
    }

    .room-edit-button,
    .room-delete-button {
      margin: 2px;
    }

    @media (max-width: 600px) {

      .room-form-grid {
        grid-template-columns: 1fr;
      }

      .room-modal-card {
        padding: 16px;
      }

      .room-modal-actions {
        flex-direction: column-reverse;
      }

      .room-modal-actions button {
        width: 100%;
      }

    }

  `;


  document.head.appendChild(
    style
  );

})();


/* =========================
   ROOM SECTION HOOK
========================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    addRoomToolbar();

  }
);


addRoomToolbar();
/* =========================================================
   ROOM TYPES MANAGEMENT — ADD / EDIT / DELETE
========================================================= */

let editingRoomTypeId = null;


/* =========================
   ROOM TYPE MODAL
========================= */

function createRoomTypeModal() {

  if ($('roomTypeModal')) return;

  const modal = document.createElement('div');

  modal.id = 'roomTypeModal';

  modal.innerHTML = `
    <div class="room-type-modal-backdrop">

      <div class="room-type-modal-card">

        <div class="room-type-modal-head">

          <div>
            <h2 id="roomTypeModalTitle">
              Add Room Type
            </h2>

            <div class="muted">
              Room type information
            </div>
          </div>

          <button
            type="button"
            class="secondary"
            id="closeRoomTypeModal"
          >
            ✕
          </button>

        </div>


        <form id="roomTypeForm">

          <div class="room-type-form-grid">

            <div>
              <label>Room type name</label>

              <input
                id="roomTypeName"
                type="text"
                required
                placeholder="e.g. Deluxe Room"
              >
            </div>


            <div>
              <label>Slug</label>

              <input
                id="roomTypeSlug"
                type="text"
                required
                placeholder="e.g. deluxe-room"
              >
            </div>


            <div class="room-type-full">

              <label>Description</label>

              <textarea
                id="roomTypeDescription"
                rows="4"
                placeholder="Full room type description"
              ></textarea>

            </div>


            <div class="room-type-full">

              <label>Short description</label>

              <input
                id="roomTypeShortDescription"
                type="text"
                placeholder="Short description"
              >

            </div>


            <div>

              <label>
                Price per night (₦)
              </label>

              <input
                id="roomTypePrice"
                type="number"
                min="0"
                step="0.01"
                value="0"
                required
              >

            </div>


            <div>

              <label>
                Maximum guests
              </label>

              <input
                id="roomTypeMaxGuests"
                type="number"
                min="1"
                step="1"
                value="2"
                required
              >

            </div>


            <div>

              <label>
                Bed type
              </label>

              <input
                id="roomTypeBedType"
                type="text"
                placeholder="e.g. King Bed"
              >

            </div>


            <div>

              <label>
                Room size
              </label>

              <input
                id="roomTypeRoomSize"
                type="text"
                placeholder="e.g. 45 m²"
              >

            </div>


            <div>

              <label>
                View type
              </label>

              <input
                id="roomTypeViewType"
                type="text"
                placeholder="e.g. City View"
              >

            </div>


            <div>

              <label>
                Image URL
              </label>

              <input
                id="roomTypeImageUrl"
                type="url"
                placeholder="https://..."
              >

            </div>


            <div class="room-type-full">

              <label>
                Amenities
              </label>

              <input
                id="roomTypeAmenities"
                type="text"
                placeholder="Wi-Fi, TV, Air Conditioning, Mini Bar"
              >

              <div class="muted room-type-help">
                Separate amenities with commas.
              </div>

            </div>


            <div class="room-type-full">

              <label class="room-type-check">

                <input
                  id="roomTypeActive"
                  type="checkbox"
                  checked
                >

                <span>
                  Active room type
                </span>

              </label>

            </div>

          </div>


          <div
            id="roomTypeFormError"
            class="room-type-form-error"
          ></div>


          <div class="room-type-modal-actions">

            <button
              type="button"
              class="secondary"
              id="cancelRoomType"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="primary"
              id="saveRoomType"
            >
              Save Room Type
            </button>

          </div>

        </form>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  $('closeRoomTypeModal')
    .addEventListener(
      'click',
      closeRoomTypeModal
    );


  $('cancelRoomType')
    .addEventListener(
      'click',
      closeRoomTypeModal
    );


  $('roomTypeForm')
    .addEventListener(
      'submit',
      saveRoomType
    );

}


/* =========================
   CREATE SLUG
========================= */

function makeRoomTypeSlug(value) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );

}


/* =========================
   OPEN ROOM TYPE MODAL
========================= */

function openRoomTypeModal(
  roomType = null
) {

  createRoomTypeModal();

  editingRoomTypeId =
    roomType?.id || null;


  $('roomTypeModalTitle')
    .textContent =
      roomType
        ? 'Edit Room Type'
        : 'Add Room Type';


  $('roomTypeName').value =
    roomType?.name || '';


  $('roomTypeSlug').value =
    roomType?.slug || '';


  $('roomTypeDescription').value =
    roomType?.description || '';


  $('roomTypeShortDescription').value =
    roomType?.short_description || '';


  $('roomTypePrice').value =
    roomType?.price_per_night ?? 0;


  $('roomTypeMaxGuests').value =
    roomType?.max_guests ?? 2;


  $('roomTypeBedType').value =
    roomType?.bed_type || '';


  $('roomTypeRoomSize').value =
    roomType?.room_size || '';


  $('roomTypeViewType').value =
    roomType?.view_type || '';


  $('roomTypeImageUrl').value =
    roomType?.image_url || '';


  let amenities = [];

  if (
    Array.isArray(
      roomType?.amenities
    )
  ) {

    amenities =
      roomType.amenities;

  }


  $('roomTypeAmenities').value =
    amenities.join(', ');


  $('roomTypeActive').checked =
    roomType?.is_active !== false;


  $('roomTypeFormError').textContent =
    '';


  $('roomTypeModal')
    .classList.add('show');

}


/* =========================
   CLOSE ROOM TYPE MODAL
========================= */

function closeRoomTypeModal() {

  const modal =
    $('roomTypeModal');

  if (modal) {

    modal.classList.remove(
      'show'
    );

  }

  editingRoomTypeId = null;

}


/* =========================
   SAVE ROOM TYPE
========================= */

async function saveRoomType(event) {

  event.preventDefault();


  const errorBox =
    $('roomTypeFormError');

  const saveButton =
    $('saveRoomType');


  errorBox.textContent =
    '';


  const name =
    $('roomTypeName')
      .value
      .trim();


  let slug =
    $('roomTypeSlug')
      .value
      .trim();


  if (!slug) {

    slug =
      makeRoomTypeSlug(
        name
      );

  }


  const price =
    Number(
      $('roomTypePrice').value
    );


  const maxGuests =
    Number(
      $('roomTypeMaxGuests').value
    );


  if (!name) {

    errorBox.textContent =
      'Room type name is required.';

    return;

  }


  if (!slug) {

    errorBox.textContent =
      'A valid slug is required.';

    return;

  }


  if (
    !Number.isFinite(price) ||
    price < 0
  ) {

    errorBox.textContent =
      'Price must be zero or greater.';

    return;

  }


  if (
    !Number.isInteger(maxGuests) ||
    maxGuests < 1
  ) {

    errorBox.textContent =
      'Maximum guests must be at least 1.';

    return;

  }


  const amenitiesText =
    $('roomTypeAmenities')
      .value
      .trim();


  const amenities =
    amenitiesText
      ? amenitiesText
          .split(',')
          .map(
            item =>
              item.trim()
          )
          .filter(Boolean)
      : [];


  const payload = {

    name,

    slug,

    description:
      $('roomTypeDescription')
        .value
        .trim() || null,

    short_description:
      $('roomTypeShortDescription')
        .value
        .trim() || null,

    price_per_night:
      price,

    max_guests:
      maxGuests,

    bed_type:
      $('roomTypeBedType')
        .value
        .trim() || null,

    room_size:
      $('roomTypeRoomSize')
        .value
        .trim() || null,

    view_type:
      $('roomTypeViewType')
        .value
        .trim() || null,

    amenities,

    image_url:
      $('roomTypeImageUrl')
        .value
        .trim() || null,

    is_active:
      $('roomTypeActive').checked

  };


  const originalText =
    saveButton.textContent;


  saveButton.disabled =
    true;


  saveButton.textContent =
    editingRoomTypeId
      ? 'Saving...'
      : 'Creating...';


  try {

    let result;


    if (editingRoomTypeId) {

      result =
        await db
          .from('room_types')
          .update(payload)
          .eq(
            'id',
            editingRoomTypeId
          )
          .select()
          .single();

    } else {

      result =
        await db
          .from('room_types')
          .insert(payload)
          .select()
          .single();

    }


    if (result.error) {
      throw result.error;
    }


    try {

      await db.rpc(
        'pms_audit',
        {

          p_action:
            editingRoomTypeId
              ? 'update_room_type'
              : 'create_room_type',

          p_entity_type:
            'room_type',

          p_entity_id:
            result.data?.id ||
            editingRoomTypeId,

          p_details:
            {
              name:
                payload.name,

              slug:
                payload.slug,

              price_per_night:
                payload.price_per_night,

              is_active:
                payload.is_active
            }

        }
      );

    } catch (auditError) {

      console.warn(
        'Room type audit log failed:',
        auditError
      );

    }


    closeRoomTypeModal();


    await loadRoomTypes();


    /*
     * Refresh the room-type dropdown
     * if the Rooms modal already exists.
     */

    populateRoomTypeOptions();


    alert(
      editingRoomTypeId
        ? 'Room type updated successfully.'
        : 'Room type added successfully.'
    );


  } catch (error) {

    console.error(
      'Room type save error:',
      error
    );


    errorBox.textContent =
      error?.message ||
      'Unable to save room type.';


  } finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      originalText;

  }

}


/* =========================
   DELETE ROOM TYPE
========================= */

async function deleteRoomType(id) {

  const roomType =
    RT.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!roomType) return;


  /*
   * Prevent accidental deletion if
   * rooms are currently using this type.
   */

  const roomsUsingType =
    R.filter(
      room =>
        String(
          room.room_type_id
        ) ===
        String(id)
    );


  if (roomsUsingType.length) {

    alert(
      `This room type cannot be deleted because ${roomsUsingType.length} room${roomsUsingType.length === 1 ? '' : 's'} currently use it.\n\nEdit those rooms first, then delete the room type.`
    );

    return;

  }


  const confirmed =
    confirm(
      `Delete room type "${roomType.name}"?\n\nThis action cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  try {

    const { error } =
      await db
        .from('room_types')
        .delete()
        .eq(
          'id',
          id
        );


    if (error) {
      throw error;
    }


    try {

      await db.rpc(
        'pms_audit',
        {

          p_action:
            'delete_room_type',

          p_entity_type:
            'room_type',

          p_entity_id:
            id,

          p_details:
            {
              name:
                roomType.name,

              slug:
                roomType.slug
            }

        }
      );

    } catch (auditError) {

      console.warn(
        'Room type audit log failed:',
        auditError
      );

    }


    await loadRoomTypes();


    populateRoomTypeOptions();


    alert(
      'Room type deleted successfully.'
    );


  } catch (error) {

    console.error(
      'Room type delete error:',
      error
    );


    alert(
      'Unable to delete room type: ' +
      (
        error?.message ||
        'Unknown error.'
      )
    );

  }

}


/* =========================
   ROOM TYPE RENDERER
========================= */

function renderRoomTypes() {

  const table =
    $('roomTypesTable');

  if (!table) return;


  if (!RT.length) {

    table.innerHTML = `
      <tr>
        <td colspan="100%">
          No room types found.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    RT.map(
      roomType => {

        return `
          <tr>

            <td>
              ${escapeHtml(
                roomType.name ||
                '-'
              )}
            </td>

            <td>
              ${escapeHtml(
                roomType.description ||
                '-'
              )}
            </td>

            <td>
              ${money(
                roomType.price_per_night
              )}
            </td>

            <td>

              <span class="badge">
                ${
                  roomType.is_active
                    ? 'Active'
                    : 'Inactive'
                }
              </span>

            </td>

            <td>

              <button
                type="button"
                class="secondary room-type-edit-button"
                data-room-type-id="${roomType.id}"
              >
                Edit
              </button>

              <button
                type="button"
                class="secondary room-type-delete-button"
                data-room-type-id="${roomType.id}"
              >
                Delete
              </button>

            </td>

          </tr>
        `;

      }
    ).join('');


  table
    .querySelectorAll(
      '.room-type-edit-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const roomType =
              RT.find(
                item =>
                  String(item.id) ===
                  String(
                    button.dataset.roomTypeId
                  )
              );


            if (roomType) {

              openRoomTypeModal(
                roomType
              );

            }

          }
        );

      }
    );


  table
    .querySelectorAll(
      '.room-type-delete-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            deleteRoomType(
              button.dataset.roomTypeId
            );

          }
        );

      }
    );

}


/* =========================
   ADD ROOM TYPE BUTTON
========================= */

function addRoomType() {

  openRoomTypeModal();

}


/* =========================
   ROOM TYPE TOOLBAR
========================= */

function addRoomTypeToolbar() {

  const section =
    $('rates');

  if (!section) return;


  const head =
    section.querySelector(
      '.head'
    );

  if (!head) return;


  if (
    section.querySelector(
      '#addRoomTypeButton'
    )
  ) {
    return;
  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'addRoomTypeButton';


  button.type =
    'button';


  button.className =
    'primary';


  button.textContent =
    '+ Add Room Type';


  button.style.marginTop =
    '12px';


  button.addEventListener(
    'click',
    addRoomType
  );


  head.appendChild(
    button
  );

}


/* =========================
   ROOM TYPE CSS
========================= */

(function addRoomTypeStyles() {

  if (
    document.getElementById(
      'roomTypeCrudStyles'
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'roomTypeCrudStyles';


  style.textContent = `

    #roomTypeModal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
    }

    #roomTypeModal.show {
      display: block;
    }

    .room-type-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow-y: auto;
    }

    .room-type-modal-card {
      width: min(760px, 96vw);
      max-height: 92vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 25px 80px rgba(0,0,0,.28);
    }

    .room-type-modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 20px;
    }

    .room-type-modal-head h2 {
      margin: 0 0 5px;
      font-family: Georgia, serif;
    }

    .room-type-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .room-type-full {
      grid-column: 1 / -1;
    }

    .room-type-form-grid label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #4d5651;
    }

    .room-type-form-grid input,
    .room-type-form-grid textarea {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #e2ded7;
      border-radius: 8px;
      background: #fff;
      font: inherit;
      color: #202723;
    }

    .room-type-form-grid textarea {
      resize: vertical;
    }

    .room-type-help {
      margin-top: 5px;
      font-size: 11px;
    }

    .room-type-check {
      display: flex !important;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .room-type-check input {
      width: auto;
    }

    .room-type-form-error {
      color: #a33b34;
      margin-top: 12px;
      min-height: 20px;
    }

    .room-type-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e2ded7;
    }

    .room-type-edit-button,
    .room-type-delete-button {
      margin: 2px;
    }

    @media (max-width: 600px) {

      .room-type-form-grid {
        grid-template-columns: 1fr;
      }

      .room-type-full {
        grid-column: auto;
      }

      .room-type-modal-card {
        padding: 16px;
      }

      .room-type-modal-actions {
        flex-direction: column-reverse;
      }

      .room-type-modal-actions button {
        width: 100%;
      }

    }

  `;


  document.head.appendChild(
    style
  );

})();


/* =========================
   ROOM TYPE SECTION HOOK
========================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    addRoomTypeToolbar();

  }
);


addRoomTypeToolbar();
/* =========================================================
   PHASE 1 — RESERVATIONS / FRONT DESK
   Complete Create / Edit / Cancel + double-booking check
========================================================= */

let editingBookingId = null;
let bookingSearchTerm = '';

/* =========================
   BOOKING MODAL
========================= */

function createBookingModal() {
  if ($('bookingModal')) return;

  const modal = document.createElement('div');
  modal.id = 'bookingModal';

  modal.innerHTML = `
    <div class="booking-modal-backdrop">
      <div class="booking-modal-card">
        <div class="booking-modal-head">
          <div>
            <h2 id="bookingModalTitle">New Reservation</h2>
            <div class="muted">Reservation details</div>
          </div>
          <button type="button" class="secondary" id="closeBookingModal">✕</button>
        </div>

        <form id="bookingForm">
          <div class="booking-form-grid">

            <div class="booking-full">
              <label>Guest</label>
              <select id="bookingGuest" required>
                <option value="">Select guest</option>
              </select>
            </div>

            <div>
              <label>Room</label>
              <select id="bookingRoom" required>
                <option value="">Select room</option>
              </select>
            </div>

            <div>
              <label>Status</label>
              <select id="bookingStatus">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label>Check-in</label>
              <input id="bookingCheckIn" type="date" required>
            </div>

            <div>
              <label>Check-out</label>
              <input id="bookingCheckOut" type="date" required>
            </div>

            <div>
              <label>Adults</label>
              <input id="bookingAdults" type="number" min="1" value="1" required>
            </div>

            <div>
              <label>Children</label>
              <input id="bookingChildren" type="number" min="0" value="0">
            </div>

            <div class="booking-full">
              <label>Notes</label>
              <textarea id="bookingNotes" rows="3" placeholder="Internal notes"></textarea>
            </div>

            <div class="booking-full">
              <label>Special requests</label>
              <textarea id="bookingSpecialRequests" rows="2" placeholder="Guest special requests"></textarea>
            </div>

          </div>

          <div id="bookingFormError" class="booking-form-error"></div>

          <div class="booking-modal-actions">
            <button type="button" class="secondary" id="cancelBooking">Cancel</button>
            <button type="submit" class="primary" id="saveBooking">Save Reservation</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  $('closeBookingModal').addEventListener('click', closeBookingModal);
  $('cancelBooking').addEventListener('click', closeBookingModal);
  $('bookingForm').addEventListener('submit', saveBooking);
}

/* =========================
   POPULATE DROPDOWNS
========================= */

async function populateBookingGuestOptions(selectedId = null) {
  const select = $('bookingGuest');
  if (!select) return;

  if (!G.length) {
    await loadGuests();
  }

  select.innerHTML = `<option value="">Select guest</option>`;

  G.forEach(guest => {
    const name = [guest.first_name, guest.last_name].filter(Boolean).join(' ') ||
                 guest.full_name || guest.name || 'Unnamed Guest';

    const option = document.createElement('option');
    option.value = guest.id;
    option.textContent = `\( {name} \){guest.email ? ' — ' + guest.email : ''}`;
    select.appendChild(option);
  });

  if (selectedId) {
    select.value = selectedId;
  }
}

async function populateBookingRoomOptions(selectedId = null) {
  const select = $('bookingRoom');
  if (!select) return;

  if (!R.length) {
    await loadRooms();
  }

  select.innerHTML = `<option value="">Select room</option>`;

  R.forEach(room => {
    const type = RT.find(t => String(t.id) === String(room.room_type_id));
    const typeName = type?.name || '';
    const status = (room.status || 'available').replaceAll('_', ' ');

    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = `${room.room_number || '—'} ${typeName ? '(' + typeName + ')' : ''} — ${status}`;
    select.appendChild(option);
  });

  if (selectedId) {
    select.value = selectedId;
  }
}

/* =========================
   OPEN / CLOSE MODAL
========================= */

async function openBookingModal(booking = null) {
  createBookingModal();

  editingBookingId = booking?.id || null;

  $('bookingModalTitle').textContent = booking ? 'Edit Reservation' : 'New Reservation';

  await Promise.all([
    populateBookingGuestOptions(booking?.guest_id || null),
    populateBookingRoomOptions(booking?.room_id || null)
  ]);

  $('bookingCheckIn').value = booking?.check_in ? String(booking.check_in).slice(0, 10) : '';
  $('bookingCheckOut').value = booking?.check_out ? String(booking.check_out).slice(0, 10) : '';
  $('bookingStatus').value = booking?.status || 'pending';
  $('bookingAdults').value = booking?.adults ?? 1;
  $('bookingChildren').value = booking?.children ?? 0;
  $('bookingNotes').value = booking?.notes || '';
  $('bookingSpecialRequests').value = booking?.special_requests || '';

  $('bookingFormError').textContent = '';
  $('bookingModal').classList.add('show');
}

function closeBookingModal() {
  const modal = $('bookingModal');
  if (modal) modal.classList.remove('show');
  editingBookingId = null;
}

/* =========================
   DOUBLE-BOOKING CHECK (client-side)
========================= */

function isRoomAvailableClient(roomId, checkIn, checkOut, excludeId = null) {
  const overlaps = B.filter(b => {
    if (String(b.room_id) !== String(roomId)) return false;
    if (['cancelled', 'checked_out'].includes(String(b.status || '').toLowerCase())) return false;
    if (excludeId && String(b.id) === String(excludeId)) return false;

    const bIn = new Date(b.check_in);
    const bOut = new Date(b.check_out);
    const nIn = new Date(checkIn);
    const nOut = new Date(checkOut);

    return nIn < bOut && nOut > bIn;
  });

  return overlaps.length === 0;
}

/* =========================
   SAVE BOOKING
========================= */

async function saveBooking(event) {
  event.preventDefault();

  const errorBox = $('bookingFormError');
  const saveButton = $('saveBooking');
  errorBox.textContent = '';

  const guestId = $('bookingGuest').value;
  const roomId = $('bookingRoom').value;
  const checkIn = $('bookingCheckIn').value;
  const checkOut = $('bookingCheckOut').value;
  const status = $('bookingStatus').value;
  const adults = Number($('bookingAdults').value) || 1;
  const children = Number($('bookingChildren').value) || 0;
  const notes = $('bookingNotes').value.trim() || null;
  const specialRequests = $('bookingSpecialRequests').value.trim() || null;

  if (!guestId) {
    errorBox.textContent = 'Please select a guest.';
    return;
  }
  if (!roomId) {
    errorBox.textContent = 'Please select a room.';
    return;
  }
  if (!checkIn || !checkOut) {
    errorBox.textContent = 'Check-in and check-out dates are required.';
    return;
  }
  if (new Date(checkOut) <= new Date(checkIn)) {
    errorBox.textContent = 'Check-out must be after check-in.';
    return;
  }

  // Double-booking protection
  if (status !== 'cancelled') {
    const available = isRoomAvailableClient(roomId, checkIn, checkOut, editingBookingId);
    if (!available) {
      errorBox.textContent = 'This room is not available for the selected dates (overlapping reservation).';
      return;
    }
  }

  // Resolve denormalized fields
  const guest = G.find(g => String(g.id) === String(guestId));
  const room = R.find(r => String(r.id) === String(roomId));

  const guestName = guest
    ? [guest.first_name, guest.last_name].filter(Boolean).join(' ') || guest.full_name || guest.name || null
    : null;

  const payload = {
    guest_id: guestId,
    room_id: roomId,
    check_in: checkIn,
    check_out: checkOut,
    status,
    adults,
    children,
    notes,
    special_requests: specialRequests,
    guest_name: guestName,
    email: guest?.email || null,
    room_number: room?.room_number || null,
    updated_at: new Date().toISOString()
  };

  const originalText = saveButton.textContent;
  saveButton.disabled = true;
  saveButton.textContent = editingBookingId ? 'Saving...' : 'Creating...';

  try {
    let result;

    if (editingBookingId) {
      result = await db
        .from('bookings')
        .update(payload)
        .eq('id', editingBookingId)
        .select()
        .single();
    } else {
      result = await db
        .from('bookings')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Audit
    try {
      await db.rpc('pms_audit', {
        p_action: editingBookingId ? 'update_booking' : 'create_booking',
        p_entity_type: 'booking',
        p_entity_id: result.data?.id || editingBookingId,
        p_details: {
          guest_id: payload.guest_id,
          room_id: payload.room_id,
          check_in: payload.check_in,
          check_out: payload.check_out,
          status: payload.status
        }
      });
    } catch (auditError) {
      console.warn('Booking audit failed:', auditError);
    }

    closeBookingModal();
    await loadBookings();
    await loadDashboard();

    alert(editingBookingId ? 'Reservation updated successfully.' : 'Reservation created successfully.');
  } catch (error) {
    console.error('Booking save error:', error);
    errorBox.textContent = error?.message || 'Unable to save reservation.';
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = originalText;
  }
}

/* =========================
   CANCEL BOOKING
========================= */

async function cancelBooking(id) {
  const booking = B.find(b => String(b.id) === String(id));
  if (!booking) return;

  const name = booking.guest_name || booking.full_name || 'this reservation';

  const confirmed = confirm(
    `Cancel reservation for "${name}"?\n\nThis will mark the booking as cancelled.`
  );
  if (!confirmed) return;

  try {
    const { error } = await db
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    try {
      await db.rpc('pms_audit', {
        p_action: 'cancel_booking',
        p_entity_type: 'booking',
        p_entity_id: id,
        p_details: {
          guest_name: booking.guest_name,
          room_id: booking.room_id,
          check_in: booking.check_in,
          check_out: booking.check_out
        }
      });
    } catch (auditError) {
      console.warn('Cancel audit failed:', auditError);
    }

    await loadBookings();
    await loadDashboard();
    alert('Reservation cancelled.');
  } catch (error) {
    console.error('Cancel booking error:', error);
    alert('Unable to cancel reservation: ' + (error?.message || 'Unknown error'));
  }
}

/* =========================
   REPLACE renderBookings
========================= */

function renderBookings() {
  const table = $('bookingsTable');
  if (!table) return;

  // Ensure Actions header exists
  const header = table.closest('table')?.querySelector('thead tr');
  if (header && !header.querySelector('[data-booking-actions-header]')) {
    const th = document.createElement('th');
    th.textContent = 'Actions';
    th.dataset.bookingActionsHeader = 'true';
    header.appendChild(th);
  }

  let list = B;

  if (bookingSearchTerm) {
    const term = bookingSearchTerm.toLowerCase();
    list = B.filter(b => {
      const guest = (b.guest_name || b.full_name || '').toLowerCase();
      const email = (b.email || '').toLowerCase();
      const room = (b.room_number || b.room_id || '').toString().toLowerCase();
      const status = (b.status || '').toLowerCase();
      return guest.includes(term) || email.includes(term) || room.includes(term) || status.includes(term);
    });
  }

  if (!list.length) {
    table.innerHTML = `<tr><td colspan="100%">No bookings found.</td></tr>`;
    return;
  }

  table.innerHTML = list.map(booking => {
    let guestDisplay = booking.guest_name || booking.full_name || '-';
    if (booking.guest_id && G.length) {
      const g = G.find(item => String(item.id) === String(booking.guest_id));
      if (g) {
        guestDisplay = [g.first_name, g.last_name].filter(Boolean).join(' ') || g.full_name || guestDisplay;
      }
    }

    let roomDisplay = booking.room_number || booking.room_id || '-';
    if (booking.room_id && R.length) {
      const r = R.find(item => String(item.id) === String(booking.room_id));
      if (r) roomDisplay = r.room_number || roomDisplay;
    }

    const statusLabel = String(booking.status || '-')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return `
      <tr>
        <td>${escapeHtml(String(booking.id).slice(0, 8))}…</td>
        <td>${escapeHtml(guestDisplay)}</td>
        <td>${escapeHtml(booking.email || '-')}</td>
        <td>${escapeHtml(roomDisplay)}</td>
        <td>${dateValue(booking.check_in)}</td>
        <td>${dateValue(booking.check_out)}</td>
        <td><span class="badge">${escapeHtml(statusLabel)}</span></td>
        <td>
          <button type="button" class="secondary booking-edit-button" data-booking-id="${booking.id}">
            Edit
          </button>
          ${booking.status !== 'cancelled' ? `
            <button type="button" class="secondary booking-cancel-button" data-booking-id="${booking.id}">
              Cancel
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  table.querySelectorAll('.booking-edit-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const booking = B.find(b => String(b.id) === String(btn.dataset.bookingId));
      if (booking) openBookingModal(booking);
    });
  });

  table.querySelectorAll('.booking-cancel-button').forEach(btn => {
    btn.addEventListener('click', () => {
      cancelBooking(btn.dataset.bookingId);
    });
  });
}

/* =========================
   TOOLBAR + SEARCH
========================= */

function addBookingToolbar() {
  const section = $('bookings');
  if (!section) return;

  const head = section.querySelector('.head');
  if (!head) return;

  if (section.querySelector('#addBookingButton')) return;

  const searchWrap = document.createElement('div');
  searchWrap.style.display = 'flex';
  searchWrap.style.gap = '10px';
  searchWrap.style.marginTop = '12px';
  searchWrap.style.flexWrap = 'wrap';
  searchWrap.style.alignItems = 'center';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search guest, email, room, status…';
  searchInput.style.padding = '10px 12px';
  searchInput.style.border = '1px solid #e2ded7';
  searchInput.style.borderRadius = '8px';
  searchInput.style.minWidth = '220px';
  searchInput.id = 'bookingSearch';

  searchInput.addEventListener('input', () => {
    bookingSearchTerm = searchInput.value.trim();
    renderBookings();
  });

  const addBtn = document.createElement('button');
  addBtn.id = 'addBookingButton';
  addBtn.type = 'button';
  addBtn.className = 'primary';
  addBtn.textContent = '+ New Reservation';
  addBtn.addEventListener('click', () => openBookingModal());

  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(addBtn);
  head.appendChild(searchWrap);
}

/* =========================
   STYLES
========================= */

(function addBookingStyles() {
  if (document.getElementById('bookingCrudStyles')) return;

  const style = document.createElement('style');
  style.id = 'bookingCrudStyles';
  style.textContent = `
    #bookingModal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
    }
    #bookingModal.show { display: block; }

    .booking-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow-y: auto;
    }

    .booking-modal-card {
      width: min(720px, 96vw);
      max-height: 92vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 25px 80px rgba(0,0,0,.28);
    }

    .booking-modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 20px;
    }

    .booking-modal-head h2 {
      margin: 0 0 5px;
      font-family: Georgia, serif;
    }

    .booking-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .booking-full { grid-column: 1 / -1; }

    .booking-form-grid label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #4d5651;
    }

    .booking-form-grid input,
    .booking-form-grid select,
    .booking-form-grid textarea {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #e2ded7;
      border-radius: 8px;
      background: #fff;
      font: inherit;
      color: #202723;
    }

    .booking-form-grid textarea { resize: vertical; }

    .booking-form-error {
      color: #a33b34;
      margin-top: 12px;
      min-height: 20px;
    }

    .booking-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e2ded7;
    }

    .booking-edit-button,
    .booking-cancel-button {
      margin: 2px;
    }

    @media (max-width: 600px) {
      .booking-form-grid { grid-template-columns: 1fr; }
      .booking-full { grid-column: auto; }
      .booking-modal-card { padding: 16px; }
      .booking-modal-actions { flex-direction: column-reverse; }
      .booking-modal-actions button { width: 100%; }
    }
  `;
  document.head.appendChild(style);
})();

/* =========================
   HOOKS
========================= */

document.addEventListener('DOMContentLoaded', () => {
  addBookingToolbar();
});

addBookingToolbar();

// Make sure guests + rooms are available when opening bookings
const originalLoadBookings = loadBookings;
loadBookings = async function () {
  await Promise.allSettled([
    originalLoadBookings(),
    G.length ? Promise.resolve() : loadGuests(),
    R.length ? Promise.resolve() : loadRooms(),
    RT.length ? Promise.resolve() : loadRoomTypes()
  ]);
};
