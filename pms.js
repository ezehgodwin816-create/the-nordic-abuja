/* =========================================================
   THE NORDIC ABUJA PMS
   Original Supabase Project
========================================================= */

const URL_ =
  'https://rzjvhfnizwckzbdawrb.supabase.co';

const KEY =
  'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob';

const db = supabase.createClient(
  URL_,
  KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);


/* =========================================================
   DATA
========================================================= */

let B = [];
let R = [];
let RT = [];
let G = [];
let HK = [];
let MT = [];
let P = [];
let F = [];


/* =========================================================
   HELPERS
========================================================= */

const $ = x =>
  document.getElementById(x);


const esc = x =>
  String(x ?? '').replace(
    /[&<>"']/g,
    m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m])
  );


const money = x =>
  '₦' +
  Number(x || 0).toLocaleString(
    'en-NG',
    {
      minimumFractionDigits: 2
    }
  );


async function q(x) {

  const {
    data,
    error
  } = await x;

  if (error) {
    throw error;
  }

  return data;
}


function loginError(message) {

  const el = $('loginError');

  if (el) {
    el.textContent = message || '';
  }

}


function resetError(message) {

  const el = $('resetError');

  if (el) {
    el.textContent = message || '';
  }

}


/* =========================================================
   SCREEN CONTROL
========================================================= */

function showLogin() {

  $('login').classList.remove('hidden');

  $('reset').classList.add('hidden');

  $('app').classList.add('hidden');

  loginError('');

  resetError('');

}


function showReset() {

  $('login').classList.add('hidden');

  $('app').classList.add('hidden');

  $('reset').classList.remove('hidden');

  resetError('');

}


function showApp(user) {

  $('login').classList.add('hidden');

  $('reset').classList.add('hidden');

  $('app').classList.remove('hidden');

  $('who').textContent =
    user?.email || '';

}


/* =========================================================
   PASSWORD RECOVERY
========================================================= */

async function requestPasswordReset() {

  const email =
    $('email').value.trim();

  if (!email) {

    loginError(
      'Enter your admin email first.'
    );

    $('email').focus();

    return;
  }


  loginError(
    'Sending password recovery email…'
  );


  try {

    const redirectTo =
      window.location.origin +
      window.location.pathname;


    const {
      error
    } =
      await db.auth.resetPasswordForEmail(
        email,
        {
          redirectTo
        }
      );


    if (error) {
      throw error;
    }


    loginError(
      'Recovery email sent. Check your email and open the newest reset link.'
    );


  } catch (error) {

    console.error(
      'Password recovery error:',
      error
    );

    loginError(
      error?.message ||
      'Unable to send password recovery email.'
    );

  }

}


/* =========================================================
   PASSWORD RESET FORM
========================================================= */

async function updatePassword() {

  const password =
    $('newPassword').value;

  const confirmation =
    $('confirmPassword').value;


  if (password.length < 8) {

    resetError(
      'Password must be at least 8 characters.'
    );

    return;
  }


  if (password !== confirmation) {

    resetError(
      'The passwords do not match.'
    );

    return;
  }


  resetError(
    'Updating password…'
  );


  try {

    const {
      data,
      error
    } =
      await db.auth.updateUser({
        password
      });


    if (error) {
      throw error;
    }


    if (!data?.user) {

      throw new Error(
        'Password update session was not found. Please open the newest recovery email again.'
      );

    }


    resetError(
      'Password updated successfully.'
    );


    setTimeout(
      async () => {

        await db.auth.signOut();

        $('newPassword').value = '';

        $('confirmPassword').value = '';

        showLogin();

        loginError(
          'Password updated. You can now sign in with your new password.'
        );

      },
      1200
    );


  } catch (error) {

    console.error(
      'Password update error:',
      error
    );

    resetError(
      error?.message ||
      'Unable to update password.'
    );

  }

}


/* =========================================================
   LOAD PMS DATA
========================================================= */

async function load() {

  [
    B,
    R,
    RT,
    G,
    HK,
    MT,
    P,
    F
  ] = await Promise.all([

    q(
      db
        .from('bookings')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        )
    ),

    q(
      db
        .from('rooms')
        .select(
          '*,room_types(name)'
        )
        .order('room_number')
    ),

    q(
      db
        .from('room_types')
        .select('*')
        .order('name')
    ),

    q(
      db
        .from('guest_profiles')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        )
    ),

    q(
      db
        .from('housekeeping_tasks')
        .select(
          '*,rooms(room_number)'
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        )
    ),

    q(
      db
        .from('maintenance_tasks')
        .select(
          '*,rooms(room_number)'
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        )
    ),

    q(
      db
        .from('payments')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        )
    ),

    q(
      db
        .from('folios')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        )
    )

  ]);

}


/* =========================================================
   PAGE HEADER
========================================================= */

const head = (
  title,
  subtitle
) =>
  `<div class="head">
    <h1>${esc(title)}</h1>
    <div class="muted">
      ${esc(subtitle)}
    </div>
  </div>`;


/* =========================================================
   DASHBOARD
========================================================= */

async function dashboard() {

  let s = {};

  try {

    s =
      await q(
        db.rpc(
          'pms_dashboard_stats'
        )
      );

  } catch (error) {

    console.error(
      'Dashboard stats error:',
      error
    );

  }


  $('main').innerHTML =

    head(
      'Hotel Operations',
      'Live property overview'
    ) +

    `<div class="grid">

      ${
        [
          [
            'Rooms',
            s.rooms_total
          ],

          [
            'Available',
            s.rooms_available
          ],

          [
            'Occupied',
            s.rooms_occupied
          ],

          [
            'Maintenance',
            s.rooms_maintenance
          ],

          [
            'Pending',
            s.bookings_pending
          ],

          [
            'Confirmed',
            s.bookings_confirmed
          ],

          [
            'Paid revenue',
            money(s.revenue_paid)
          ],

          [
            'Open maintenance',
            s.open_maintenance
          ]

        ]
        .map(
          x =>
            `<div class="card">

              <div class="muted">
                ${esc(x[0])}
              </div>

              <div class="stat">
                ${x[1] ?? 0}
              </div>

            </div>`
        )
        .join('')
      }

    </div>`;

}


/* =========================================================
   FRONT DESK
========================================================= */

function frontdesk() {

  $('main').innerHTML =

    head(
      'Front Desk',
      'Arrivals, in-house guests and departures'
    ) +

    table(
      [
        'Booking',
        'Guest',
        'Stay',
        'Status',
        'Actions'
      ],

      B.map(
        b => [

          esc(
            b.booking_reference
          ),

          esc(
            b.guest_first_name +
            ' ' +
            b.guest_last_name
          ),

          `${esc(b.check_in)}
           → ${esc(b.check_out)}`,

          esc(b.status),

          `<button
            class="secondary"
            onclick="cin('${b.id}')"
          >
            Check in
          </button>

          <button
            class="secondary"
            onclick="cout('${b.id}')"
          >
            Check out
          </button>`

        ]
      )
    );

}


/* =========================================================
   CHECK IN
========================================================= */

async function cin(id) {

  const b =
    B.find(
      x => x.id === id
    );


  await q(
    db
      .from('bookings')
      .update({
        status: 'confirmed'
      })
      .eq('id', id)
  );


  if (b?.room_id) {

    await q(
      db
        .from('rooms')
        .update({
          status: 'occupied'
        })
        .eq(
          'id',
          b.room_id
        )
    );

  }


  await load();

  render('frontdesk');

}


/* =========================================================
   CHECK OUT
========================================================= */

async function cout(id) {

  const b =
    B.find(
      x => x.id === id
    );


  await q(
    db
      .from('bookings')
      .update({
        status: 'completed'
      })
      .eq('id', id)
  );


  if (b?.room_id) {

    await q(
      db
        .from('rooms')
        .update({
          status: 'available'
        })
        .eq(
          'id',
          b.room_id
        )
    );

  }


  await load();

  render('frontdesk');

}


/* =========================================================
   CALENDAR
========================================================= */

function calendar() {

  const ds =
    [...Array(7)].map(
      (_, i) => {

        const d =
          new Date();

        d.setDate(
          d.getDate() + i
        );

        return d
          .toISOString()
          .slice(
            0,
            10
          );

      }
    );


  let cells =

    `<div class="tablewrap card">

      <table class="table">

        <tr>

          <th>
            Room
          </th>

          ${
            ds
              .map(
                d =>
                  `<th>${d}</th>`
              )
              .join('')
          }

        </tr>`;


  R.forEach(
    r => {

      cells +=

        `<tr>

          <td>

            <b>
              ${esc(
                r.room_number
              )}
            </b>

            <br>

            ${esc(
              r.room_types?.name ||
              ''
            )}

          </td>

          ${
            ds
              .map(
                d =>

                  `<td>

                    ${
                      B
                        .filter(
                          b =>
                            b.room_id === r.id &&
                            d >= b.check_in &&
                            d < b.check_out
                        )
                        .map(
                          b =>
                            `<span class="badge">
                              ${esc(
                                b.booking_reference
                              )}
                            </span>`
                        )
                        .join(' ') ||
                      '—'
                    }

                  </td>`
              )
              .join('')
          }

        </tr>`;

    }
  );


  cells +=

    `</table>
    </div>`;


  $('main').innerHTML =

    head(
      'Reservation Calendar',
      'Room rack for the next 7 days'
    ) +

    cells;

}


/* =========================================================
   GUESTS / CRM
========================================================= */

function guests() {

  $('main').innerHTML =

    head(
      'Guests & CRM',
      'Guest profiles and VIP information'
    ) +

    `<div class="card">

      <button
        class="primary"
        onclick="addGuest()"
      >
        Add guest
      </button>

    </div>` +

    table(
      [
        'Name',
        'Email',
        'Phone',
        'Country',
        'VIP'
      ],

      G.map(
        g => [

          esc(
            g.first_name +
            ' ' +
            (g.last_name || '')
          ),

          esc(g.email),

          esc(g.phone),

          esc(g.country),

          g.vip
            ? '⭐'
            : '—'

        ]
      )
    );

}


async function addGuest() {

  const firstName =
    prompt(
      'First name'
    );


  if (!firstName) {
    return;
  }


  await q(
    db
      .from('guest_profiles')
      .insert({
        first_name:
          firstName,

        last_name:
          prompt(
            'Last name'
          ) || null,

        email:
          prompt(
            'Email'
          ) || null,

        phone:
          prompt(
            'Phone'
          ) || null,

        vip:
          false
      })
  );


  await load();

  render('guests');

}


/* =========================================================
   HOUSEKEEPING
========================================================= */

function housekeeping() {

  $('main').innerHTML =

    head(
      'Housekeeping',
      'Cleaning and inspection tasks'
    ) +

    `<div class="card">

      <button
        class="primary"
        onclick="addHK()"
      >
        Create task
      </button>

    </div>` +

    table(
      [
        'Room',
        'Task',
        'Priority',
        'Status'
      ],

      HK.map(
        x => [

          esc(
            x.rooms?.room_number ||
            ''
          ),

          esc(
            x.task_type
          ),

          esc(
            x.priority
          ),

          esc(
            x.status
          )

        ]
      )
    );

}


async function addHK() {

  const roomId =
    prompt(
      'Room UUID'
    );


  if (!roomId) {
    return;
  }


  await q(
    db
      .from(
        'housekeeping_tasks'
      )
      .insert({
        room_id:
          roomId,

        task_type:
          'cleaning'
      })
  );


  await load();

  render(
    'housekeeping'
  );

}


/* =========================================================
   MAINTENANCE
========================================================= */

function maintenance() {

  $('main').innerHTML =

    head(
      'Maintenance',
      'Repairs and room out-of-service tracking'
    ) +

    `<div class="card">

      <button
        class="primary"
        onclick="addMT()"
      >
        New ticket
      </button>

    </div>` +

    table(
      [
        'Title',
        'Room',
        'Priority',
        'Status',
        'Cost'
      ],

      MT.map(
        x => [

          esc(x.title),

          esc(
            x.rooms?.room_number ||
            ''
          ),

          esc(x.priority),

          esc(x.status),

          money(x.cost)

        ]
      )
    );

}


async function addMT() {

  const title =
    prompt(
      'Issue title'
    );


  if (!title) {
    return;
  }


  await q(
    db
      .from(
        'maintenance_tasks'
      )
      .insert({
        title,

        description:
          prompt(
            'Description'
          ) || null
      })
  );


  await load();

  render(
    'maintenance'
  );

}


/* =========================================================
   FOLIOS
========================================================= */

function folios() {

  $('main').innerHTML =

    head(
      'Folios & Billing',
      'Guest accounts and balances'
    ) +

    table(
      [
        'Booking',
        'Status',
        'Total',
        'Paid',
        'Balance'
      ],

      F.map(
        x => [

          esc(
            B.find(
              b =>
                b.id ===
                x.booking_id
            )
            ?.booking_reference ||
            ''
          ),

          esc(x.status),

          money(x.total),

          money(x.paid),

          money(x.balance)

        ]
      )
    );

}


/* =========================================================
   PAYMENTS
========================================================= */

function payments() {

  $('main').innerHTML =

    head(
      'Payments',
      'Payment ledger and reconciliation'
    ) +

    table(
      [
        'Date',
        'Booking',
        'Amount',
        'Method',
        'Status',
        'Reference'
      ],

      P.map(
        x => [

          new Date(
            x.created_at
          ).toLocaleString(),

          esc(
            B.find(
              b =>
                b.id ===
                x.booking_id
            )
            ?.booking_reference ||
            ''
          ),

          money(x.amount),

          esc(x.method),

          esc(x.status),

          esc(
            x.provider_reference ||
            ''
          )

        ]
      )
    );

}


/* =========================================================
   RATES
========================================================= */

async function rates() {

  const a =
    await q(
      db
        .from('rate_rules')
        .select(
          '*,room_types(name)'
        )
        .order(
          'start_date',
          {
            ascending: false
          }
        )
    );


  $('main').innerHTML =

    head(
      'Rates & Promotions',
      'Seasonal rates and minimum stays'
    ) +

    table(
      [
        'Room',
        'Rule',
        'Dates',
        'Rate',
        'Min nights',
        'Active'
      ],

      a.map(
        x => [

          esc(
            x.room_types?.name
          ),

          esc(x.name),

          `${x.start_date}
           → ${x.end_date}`,

          money(
            x.price_per_night
          ),

          x.minimum_nights,

          x.is_active
            ? 'Yes'
            : 'No'

        ]
      )
    );

}


/* =========================================================
   EXTRAS
========================================================= */

async function extras() {

  const a =
    await q(
      db
        .from(
          'booking_extras_catalog'
        )
        .select('*')
        .order('name')
    );


  $('main').innerHTML =

    head(
      'Extras & Add-ons',
      'Breakfast, transfers, laundry and services'
    ) +

    table(
      [
        'Name',
        'Price',
        'Pricing',
        'Active'
      ],

      a.map(
        x => [

          esc(x.name),

          money(x.price),

          esc(
            x.pricing_type
          ),

          x.is_active
            ? 'Yes'
            : 'No'

        ]
      )
    );

}


/* =========================================================
   REPORTS
========================================================= */

function reports() {

  const total =
    B.length;

  const confirmed =
    B.filter(
      x =>
        x.status ===
        'confirmed'
    ).length;


  $('main').innerHTML =

    head(
      'Reports & Analytics',
      'Operational KPIs and exports'
    ) +

    `<div class="grid">

      <div class="card">

        <div class="muted">
          Bookings
        </div>

        <div class="stat">
          ${total}
        </div>

      </div>

      <div class="card">

        <div class="muted">
          Confirmed
        </div>

        <div class="stat">
          ${confirmed}
        </div>

      </div>

      <div class="card">

        <div class="muted">
          Confirmation rate
        </div>

        <div class="stat">

          ${
            total
              ? Math.round(
                  confirmed /
                  total *
                  100
                )
              : 0
          }%

        </div>

      </div>

    </div>

    <div class="card">

      <button
        class="primary"
        onclick="csv()"
      >
        Export bookings CSV
      </button>

    </div>`;

}


/* =========================================================
   CSV EXPORT
========================================================= */

function csv() {

  const keys = [

    'booking_reference',
    'guest_first_name',
    'guest_last_name',
    'guest_email',
    'guest_phone',
    'check_in',
    'check_out',
    'nights',
    'room_price',
    'total_amount',
    'status',
    'payment_status'

  ];


  const out = [

    keys.join(','),

    ...B.map(
      b =>

        keys
          .map(
            k =>
              `"${String(
                b[k] ?? ''
              ).replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(',')
    )

  ].join('\n');


  const a =
    document.createElement(
      'a'
    );


  a.href =
    URL.createObjectURL(
      new Blob(
        [out],
        {
          type:
            'text/csv'
        }
      )
    );


  a.download =
    'nordic-bookings.csv';


  a.click();

}


/* =========================================================
   STAFF
========================================================= */

async function staff() {

  const a =
    await q(
      db
        .from(
          'staff_profiles'
        )
        .select('*')
    );


  $('main').innerHTML =

    head(
      'Staff & Permissions',
      'Role foundation'
    ) +

    table(
      [
        'User',
        'Name',
        'Role',
        'Active'
      ],

      a.map(
        x => [

          esc(x.id),

          esc(
            x.full_name
          ),

          esc(x.role),

          x.is_active
            ? 'Yes'
            : 'No'

        ]
      )
    );

}


/* =========================================================
   AUDIT LOG
========================================================= */

async function audit() {

  const a =
    await q(
      db
        .from(
          'audit_logs'
        )
        .select('*')
        .order(
          'created_at',
          {
            ascending:
              false
          }
        )
        .limit(100)
    );


  $('main').innerHTML =

    head(
      'Audit Log',
      'Administrative activity trail'
    ) +

    table(
      [
        'Date',
        'Action',
        'Entity',
        'Details'
      ],

      a.map(
        x => [

          new Date(
            x.created_at
          ).toLocaleString(),

          esc(x.action),

          esc(
            x.entity_type
          ),

          esc(
            JSON.stringify(
              x.details
            )
          )

        ]
      )
    );

}


/* =========================================================
   TABLE
========================================================= */

function table(
  headers,
  rows
) {

  return `

    <div class="card tablewrap">

      <table class="table">

        <thead>

          <tr>

            ${
              headers
                .map(
                  x =>
                    `<th>${esc(x)}</th>`
                )
                .join('')
            }

          </tr>

        </thead>

        <tbody>

          ${
            rows
              .map(
                row =>
                  `<tr>
                    ${
                      row
                        .map(
                          cell =>
                            `<td>${cell}</td>`
                        )
                        .join('')
                    }
                  </tr>`
              )
              .join('')

            ||

            `<tr>

              <td
                colspan="${headers.length}"
              >
                No records.
              </td>

            </tr>`
          }

        </tbody>

      </table>

    </div>`;

}


/* =========================================================
   RENDER
========================================================= */

function render(view) {

  const pages = {

    dashboard,

    frontdesk,

    calendar,

    guests,

    housekeeping,

    maintenance,

    folios,

    payments,

    rates,

    extras,

    reports,

    staff,

    audit

  };


  (
    pages[view] ||
    dashboard
  )();

}


/* =========================================================
   LOGIN
========================================================= */

$('loginForm').onsubmit =
  async event => {

    event.preventDefault();

    loginError(
      'Signing in…'
    );


    try {

      const {
        error
      } =
        await db.auth.signInWithPassword({

          email:
            $('email')
              .value
              .trim(),

          password:
            $('password')
              .value

        });


      if (error) {
        throw error;
      }


      const {
        data: userData,
        error: userError
      } =
        await db.auth.getUser();


      if (userError) {
        throw userError;
      }


      const user =
        userData?.user;


      if (!user) {

        throw new Error(
          'Unable to identify the signed-in user.'
        );

      }


      const {
        data: admin,
        error: adminError
      } =
        await db.rpc(
          'is_admin_user'
        );


      if (adminError) {
        throw adminError;
      }


      if (!admin) {

        throw new Error(
          'This account is not authorized as an administrator.'
        );

      }


      showApp(user);

      await load();

      render(
        'dashboard'
      );


    } catch (error) {

      console.error(
        'Login error:',
        error
      );

      loginError(
        error?.message ||
        'Unable to sign in.'
      );

      await db.auth.signOut();

    }

  };


/* =========================================================
   FORGOT PASSWORD BUTTON
========================================================= */

$('forgotPassword').onclick =
  requestPasswordReset;


/* =========================================================
   RESET PASSWORD FORM
========================================================= */

$('resetForm').onsubmit =
  async event => {

    event.preventDefault();

    await updatePassword();

  };


/* =========================================================
   BACK TO LOGIN
========================================================= */

$('backToLogin').onclick =
  async () => {

    await db.auth.signOut();

    $('newPassword').value = '';

    $('confirmPassword').value = '';

    showLogin();

  };


/* =========================================================
   LOGOUT
========================================================= */

$('logout').onclick =
  async () => {

    await db.auth.signOut();

    location.reload();

  };


/* =========================================================
   MOBILE MENU
========================================================= */

$('menu').onclick =
  () => {

    $('side')
      .classList
      .toggle('open');

  };


/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

document
  .querySelectorAll(
    '#side button'
  )
  .forEach(
    button => {

      button.onclick =
        () =>
          render(
            button.dataset.v
          );

    }
  );


/* =========================================================
   AUTH STATE CHANGE
========================================================= */

db.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      'Supabase auth event:',
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

      if (
        $('reset')
          .classList
          .contains(
            'hidden'
          )
      ) {

        showLogin();

      }

    }

  }
);


/* =========================================================
   INITIAL SESSION CHECK
========================================================= */

async function initialise() {

  try {

    /*
      Supabase automatically processes
      the recovery URL because
      detectSessionInUrl is enabled.
    */

    const {
      data,
      error
    } =
      await db.auth.getSession();


    if (error) {
      throw error;
    }


    const session =
      data?.session;


    /*
      If this is a recovery URL,
      wait for Supabase's
      PASSWORD_RECOVERY event.
    */

    const hash =
      window.location.hash || '';


    const search =
      window.location.search || '';


    const isRecovery =
      hash.includes(
        'type=recovery'
      ) ||
      search.includes(
        'type=recovery'
      );


    if (isRecovery) {

      showReset();

      return;
    }


    if (!session) {

      showLogin();

      return;

    }


    const {
      data: userData,
      error: userError
    } =
      await db.auth.getUser();


    if (userError) {
      throw userError;
    }


    const user =
      userData?.user;


    if (!user) {

      await db.auth.signOut();

      showLogin();

      return;

    }


    const {
      data: admin,
      error: adminError
    } =
      await db.rpc(
        'is_admin_user'
      );


    if (adminError) {
      throw adminError;
    }


    if (!admin) {

      await db.auth.signOut();

      showLogin();

      loginError(
        'This account is not authorized as an administrator.'
      );

      return;

    }


    showApp(user);

    await load();

    render(
      'dashboard'
    );


  } catch (error) {

    console.error(
      'PMS initialization error:',
      error
    );

    await db.auth.signOut();

    showLogin();

  }

}


/* =========================================================
   START PMS
========================================================= */

initialise();
