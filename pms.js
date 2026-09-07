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
booking => "<tr> <td>${escapeHtml(booking.id)}</td> <td>${escapeHtml( booking.guest_name || booking.full_name || '-' )}</td> <td>${escapeHtml( booking.email || '-' )}</td> <td>${escapeHtml( booking.room_id || booking.room_number || '-' )}</td> <td>${dateValue( booking.check_in )}</td> <td>${dateValue( booking.check_out )}</td> <td>${escapeHtml( booking.status || '-' )}</td> </tr>"
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
room => "<tr> <td>${escapeHtml( room.room_number || room.number || '-' )}</td> <td>${escapeHtml( room.room_type_id || room.room_type || '-' )}</td> <td>${escapeHtml( room.status || '-' )}</td> <td>${escapeHtml( room.floor || '-' )}</td> </tr>"
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
roomType => "<tr> <td>${escapeHtml( roomType.name || '-' )}</td> <td>${escapeHtml( roomType.description || '-' )}</td> <td>${money( roomType.base_rate || roomType.price || 0 )}</td> </tr>"
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
guest => "<tr> <td>${escapeHtml( guest.full_name || guest.name || '-' )}</td> <td>${escapeHtml( guest.email || '-' )}</td> <td>${escapeHtml( guest.phone || '-' )}</td> <td>${dateValue( guest.created_at )}</td> </tr>"
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
task => "<tr> <td>${escapeHtml( task.room_id || '-' )}</td> <td>${escapeHtml( task.task_type || task.type || '-' )}</td> <td>${escapeHtml( task.status || '-' )}</td> <td>${escapeHtml( task.assigned_to || '-' )}</td> <td>${dateValue( task.created_at )}</td> </tr>"
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
task => "<tr> <td>${escapeHtml( task.room_id || '-' )}</td> <td>${escapeHtml( task.title || task.task_type || '-' )}</td> <td>${escapeHtml( task.status || '-' )}</td> <td>${escapeHtml( task.priority || '-' )}</td> <td>${dateValue( task.created_at )}</td> </tr>"
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
payment => "<tr> <td>${escapeHtml( payment.id )}</td> <td>${money( payment.amount )}</td> <td>${escapeHtml( payment.method || payment.payment_method || '-' )}</td> <td>${escapeHtml( payment.status || '-' )}</td> <td>${dateValue( payment.created_at )}</td> </tr>"
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
folio => "<tr> <td>${escapeHtml( folio.id )}</td> <td>${escapeHtml( folio.booking_id || '-' )}</td> <td>${money( folio.total || folio.amount || 0 )}</td> <td>${escapeHtml( folio.status || '-' )}</td> <td>${dateValue( folio.created_at )}</td> </tr>"
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
member => "<tr> <td>${escapeHtml( member.full_name || member.name || '-' )}</td> <td>${escapeHtml( member.role || '-' )}</td> <td>${escapeHtml( member.email || '-' )}</td> <td>${escapeHtml( member.phone || '-' )}</td> <td>${escapeHtml( member.status || '-' )}</td> </tr>"
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
