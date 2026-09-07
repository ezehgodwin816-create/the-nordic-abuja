const URL_='https://rzjvhfnizwckzbdawrb.supabase.co',
KEY='sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob',
db=supabase.createClient(URL_,KEY);

let B=[],R=[],RT=[],G=[],HK=[],MT=[],P=[],F=[];

const $=x=>document.getElementById(x);

const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[m]));

const money=x=>'₦'+Number(x||0).toLocaleString('en-NG',{
  minimumFractionDigits:2
});

async function q(x){
  let{data,error}=await x;
  if(error)throw error;
  return data;
}

function err(x){
  $('loginError').textContent=x||'';
}

function resetErr(x){
  $('resetError').textContent=x||'';
}


/* =========================================================
   PASSWORD RECOVERY UI
========================================================= */

function showLogin(){
  $('reset').classList.add('hidden');
  $('app').classList.add('hidden');
  $('login').classList.remove('hidden');

  $('loginError').textContent='';
  $('resetError').textContent='';
}

function showReset(){
  $('login').classList.add('hidden');
  $('app').classList.add('hidden');
  $('reset').classList.remove('hidden');

  $('resetError').textContent='';
}

async function requestPasswordReset(){

  const email=$('email').value.trim();

  if(!email){
    err('Enter your admin email first.');
    $('email').focus();
    return;
  }

  err('Sending password recovery email…');

  try{

    const redirectTo=window.location.origin+window.location.pathname;

    const{error}=await db.auth.resetPasswordForEmail(email,{
      redirectTo
    });

    if(error)throw error;

    err('Recovery email sent. Check your email and open the newest reset link.');

  }catch(x){

    err(x.message||'Unable to send password recovery email.');

  }
}


/* =========================================================
   LOGIN
========================================================= */

$('loginForm').onsubmit=async e=>{

  e.preventDefault();

  err('Signing in…');

  try{

    let{error}=await db.auth.signInWithPassword({
      email:$('email').value.trim(),
      password:$('password').value
    });

    if(error)throw error;

    let{data:u}=await db.auth.getUser();

    let{data:a,error:ae}=await db.rpc('is_admin_user');

    if(ae)throw ae;

    if(!a){
      throw Error(
        'This account is not authorized as an administrator.'
      );
    }

    $('login').classList.add('hidden');
    $('reset').classList.add('hidden');
    $('app').classList.remove('hidden');

    $('who').textContent=u.user.email;

    await load();

    render('dashboard');

  }catch(x){

    err(x.message);

    await db.auth.signOut();

  }

};


/* =========================================================
   FORGOT PASSWORD
========================================================= */

$('forgotPassword').onclick=async()=>{

  await requestPasswordReset();

};


/* =========================================================
   PASSWORD UPDATE
========================================================= */

$('resetForm').onsubmit=async e=>{

  e.preventDefault();

  resetErr('Updating password…');

  const password=$('newPassword').value;
  const confirm=$('confirmPassword').value;

  if(password.length<8){

    resetErr('Password must be at least 8 characters.');

    return;
  }

  if(password!==confirm){

    resetErr('The passwords do not match.');

    return;
  }

  try{

    const{error}=await db.auth.updateUser({
      password
    });

    if(error)throw error;

    resetErr('Password updated successfully. Returning to login…');

    setTimeout(async()=>{

      await db.auth.signOut();

      $('newPassword').value='';
      $('confirmPassword').value='';

      showLogin();

      $('loginError').textContent=
        'Password updated. You can now sign in with your new password.';

    },1200);

  }catch(x){

    resetErr(
      x.message||'Unable to update password.'
    );

  }

};


/* =========================================================
   BACK TO LOGIN
========================================================= */

$('backToLogin').onclick=async()=>{

  await db.auth.signOut();

  $('newPassword').value='';
  $('confirmPassword').value='';

  showLogin();

};


/* =========================================================
   AUTH STATE
========================================================= */

db.auth.onAuthStateChange(async(event,session)=>{

  if(event==='PASSWORD_RECOVERY'){

    showReset();

    return;
  }

  if(event==='SIGNED_OUT'){

    if(!$('reset').classList.contains('hidden')){

      return;

    }

  }

});


/* =========================================================
   LOAD PMS DATA
========================================================= */

async function load(){

  [
    B,
    R,
    RT,
    G,
    HK,
    MT,
    P,
    F
  ]=await Promise.all([

    q(
      db.from('bookings')
        .select('*')
        .order('created_at',{ascending:false})
    ),

    q(
      db.from('rooms')
        .select('*,room_types(name)')
        .order('room_number')
    ),

    q(
      db.from('room_types')
        .select('*')
        .order('name')
    ),

    q(
      db.from('guest_profiles')
        .select('*')
        .order('created_at',{ascending:false})
    ),

    q(
      db.from('housekeeping_tasks')
        .select('*,rooms(room_number)')
        .order('created_at',{ascending:false})
    ),

    q(
      db.from('maintenance_tasks')
        .select('*,rooms(room_number)')
        .order('created_at',{ascending:false})
    ),

    q(
      db.from('payments')
        .select('*')
        .order('created_at',{ascending:false})
    ),

    q(
      db.from('folios')
        .select('*')
        .order('created_at',{ascending:false})
    )

  ]);

}


/* =========================================================
   HEADER
========================================================= */

const head=(a,b)=>
`<div class="head">
  <h1>${a}</h1>
  <div class="muted">${b}</div>
</div>`;


/* =========================================================
   DASHBOARD
========================================================= */

async function dashboard(){

  let s={};

  try{

    s=await q(
      db.rpc('pms_dashboard_stats')
    );

  }catch(e){}

  $('main').innerHTML=
    head(
      'Hotel Operations',
      'Live property overview'
    )+

    `<div class="grid">${
      [
        ['Rooms',s.rooms_total],
        ['Available',s.rooms_available],
        ['Occupied',s.rooms_occupied],
        ['Maintenance',s.rooms_maintenance],
        ['Pending',s.bookings_pending],
        ['Confirmed',s.bookings_confirmed],
        ['Paid revenue',money(s.revenue_paid)],
        ['Open maintenance',s.open_maintenance]
      ]
      .map(x=>
        `<div class="card">
          <div class="muted">${x[0]}</div>
          <div class="stat">${x[1]??0}</div>
        </div>`
      )
      .join('')
    }</div>`;

}


/* =========================================================
   FRONT DESK
========================================================= */

function frontdesk(){

  $('main').innerHTML=
    head(
      'Front Desk',
      'Arrivals, in-house guests and departures'
    )+

    table(
      [
        'Booking',
        'Guest',
        'Stay',
        'Status',
        'Actions'
      ],

      B.map(b=>[
        esc(b.booking_reference),

        esc(
          b.guest_first_name+
          ' '+
          b.guest_last_name
        ),

        `${b.check_in} → ${b.check_out}`,

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
      ])
    );

}


async function cin(id){

  let b=B.find(x=>x.id===id);

  await q(
    db.from('bookings')
      .update({
        status:'confirmed'
      })
      .eq('id',id)
  );

  if(b?.room_id){

    await q(
      db.from('rooms')
        .update({
          status:'occupied'
        })
        .eq('id',b.room_id)
    );

  }

  await load();

  render('frontdesk');

}


async function cout(id){

  let b=B.find(x=>x.id===id);

  await q(
    db.from('bookings')
      .update({
        status:'completed'
      })
      .eq('id',id)
  );

  if(b?.room_id){

    await q(
      db.from('rooms')
        .update({
          status:'available'
        })
        .eq('id',b.room_id)
    );

  }

  await load();

  render('frontdesk');

}


/* =========================================================
   CALENDAR
========================================================= */

function calendar(){

  let ds=[...Array(7)].map((_,i)=>{

    let d=new Date;

    d.setDate(
      d.getDate()+i
    );

    return d.toISOString().slice(0,10);

  });

  let cells=
    '<div class="tablewrap card">'+
    '<table class="table">'+
    '<tr><th>Room</th>'+
    ds.map(d=>`<th>${d}</th>`).join('')+
    '</tr>';

  R.forEach(r=>{

    cells+=
      `<tr>
        <td>
          <b>${esc(r.room_number)}</b><br>
          ${esc(r.room_types?.name||'')}
        </td>`+

      ds.map(d=>
        `<td>${
          B.filter(
            b=>
              b.room_id===r.id&&
              d>=b.check_in&&
              d<b.check_out
          )
          .map(b=>
            `<span class="badge">
              ${esc(b.booking_reference)}
            </span>`
          )
          .join(' ')||'—'
        }</td>`
      ).join('')+

      '</tr>';

  });

  $('main').innerHTML=
    head(
      'Reservation Calendar',
      'Room rack for the next 7 days'
    )+
    cells+
    '</table></div>';

}


/* =========================================================
   GUESTS
========================================================= */

function guests(){

  $('main').innerHTML=
    head(
      'Guests & CRM',
      'Guest profiles and VIP information'
    )+

    `<div class="card">
      <button
        class="primary"
        onclick="addGuest()"
      >
        Add guest
      </button>
    </div>`+

    table(
      [
        'Name',
        'Email',
        'Phone',
        'Country',
        'VIP'
      ],

      G.map(g=>[
        esc(
          g.first_name+
          ' '+
          (g.last_name||'')
        ),

        esc(g.email),

        esc(g.phone),

        esc(g.country),

        g.vip?'⭐':'—'
      ])
    );

}


async function addGuest(){

  let f=prompt('First name');

  if(!f)return;

  await q(
    db.from('guest_profiles')
      .insert({
        first_name:f,
        last_name:prompt('Last name')||null,
        email:prompt('Email')||null,
        phone:prompt('Phone')||null,
        vip:false
      })
  );

  await load();

  render('guests');

}


/* =========================================================
   HOUSEKEEPING
========================================================= */

function housekeeping(){

  $('main').innerHTML=
    head(
      'Housekeeping',
      'Cleaning and inspection tasks'
    )+

    `<div class="card">
      <button
        class="primary"
        onclick="addHK()"
      >
        Create task
      </button>
    </div>`+

    table(
      [
        'Room',
        'Task',
        'Priority',
        'Status'
      ],

      HK.map(x=>[
        esc(x.rooms?.room_number||''),
        esc(x.task_type),
        esc(x.priority),
        esc(x.status)
      ])
    );

}


async function addHK(){

  let id=prompt('Room UUID');

  if(!id)return;

  await q(
    db.from('housekeeping_tasks')
      .insert({
        room_id:id,
        task_type:'cleaning'
      })
  );

  await load();

  render('housekeeping');

}


/* =========================================================
   MAINTENANCE
========================================================= */

function maintenance(){

  $('main').innerHTML=
    head(
      'Maintenance',
      'Repairs and room out-of-service tracking'
    )+

    `<div class="card">
      <button
        class="primary"
        onclick="addMT()"
      >
        New ticket
      </button>
    </div>`+

    table(
      [
        'Title',
        'Room',
        'Priority',
        'Status',
        'Cost'
      ],

      MT.map(x=>[
        esc(x.title),
        esc(x.rooms?.room_number||''),
        esc(x.priority),
        esc(x.status),
        money(x.cost)
      ])
    );

}


async function addMT(){

  let t=prompt('Issue title');

  if(!t)return;

  await q(
    db.from('maintenance_tasks')
      .insert({
        title:t,
        description:prompt('Description')||null
      })
  );

  await load();

  render('maintenance');

}


/* =========================================================
   FOLIOS
========================================================= */

function folios(){

  $('main').innerHTML=
    head(
      'Folios & Billing',
      'Guest accounts and balances'
    )+

    table(
      [
        'Booking',
        'Status',
        'Total',
        'Paid',
        'Balance'
      ],

      F.map(x=>[
        esc(
          B.find(
            b=>b.id===x.booking_id
          )?.booking_reference||''
        ),

        esc(x.status),

        money(x.total),

        money(x.paid),

        money(x.balance)
      ])
    );

}


/* =========================================================
   PAYMENTS
========================================================= */

function payments(){

  $('main').innerHTML=
    head(
      'Payments',
      'Payment ledger and reconciliation'
    )+

    table(
      [
        'Date',
        'Booking',
        'Amount',
        'Method',
        'Status',
        'Reference'
      ],

      P.map(x=>[
        new Date(
          x.created_at
        ).toLocaleString(),

        esc(
          B.find(
            b=>b.id===x.booking_id
          )?.booking_reference||''
        ),

        money(x.amount),

        esc(x.method),

        esc(x.status),

        esc(x.provider_reference||'')
      ])
    );

}


/* =========================================================
   RATES
========================================================= */

async function rates(){

  let a=await q(
    db.from('rate_rules')
      .select('*,room_types(name)')
      .order(
        'start_date',
        {ascending:false}
      )
  );

  $('main').innerHTML=
    head(
      'Rates & Promotions',
      'Seasonal rates and minimum stays'
    )+

    table(
      [
        'Room',
        'Rule',
        'Dates',
        'Rate',
        'Min nights',
        'Active'
      ],

      a.map(x=>[
        esc(x.room_types?.name),
        esc(x.name),
        `${x.start_date} → ${x.end_date}`,
        money(x.price_per_night),
        x.minimum_nights,
        x.is_active?'Yes':'No'
      ])
    );

}


/* =========================================================
   EXTRAS
========================================================= */

async function extras(){

  let a=await q(
    db.from('booking_extras_catalog')
      .select('*')
      .order('name')
  );

  $('main').innerHTML=
    head(
      'Extras & Add-ons',
      'Breakfast, transfers, laundry and services'
    )+

    table(
      [
        'Name',
        'Price',
        'Pricing',
        'Active'
      ],

      a.map(x=>[
        esc(x.name),
        money(x.price),
        esc(x.pricing_type),
        x.is_active?'Yes':'No'
      ])
    );

}


/* =========================================================
   REPORTS
========================================================= */

function reports(){

  let total=B.length;

  let c=B.filter(
    x=>x.status==='confirmed'
  ).length;

  $('main').innerHTML=
    head(
      'Reports & Analytics',
      'Operational KPIs and exports'
    )+

    `<div class="grid">

      <div class="card">
        <div class="muted">Bookings</div>
        <div class="stat">${total}</div>
      </div>

      <div class="card">
        <div class="muted">Confirmed</div>
        <div class="stat">${c}</div>
      </div>

      <div class="card">
        <div class="muted">Confirmation rate</div>
        <div class="stat">
          ${total?Math.round(c/total*100):0}%
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


function csv(){

  let keys=[
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

  let out=[
    keys.join(','),

    ...B.map(
      b=>
        keys.map(
          k=>
            `"${String(
              b[k]??''
            ).replaceAll('"','""')}"`
        ).join(',')
    )

  ].join('\n');

  let a=document.createElement('a');

  a.href=
    URL.createObjectURL(
      new Blob(
        [out],
        {type:'text/csv'}
      )
    );

  a.download='nordic-bookings.csv';

  a.click();

}


/* =========================================================
   STAFF
========================================================= */

async function staff(){

  let a=await q(
    db.from('staff_profiles')
      .select('*')
  );

  $('main').innerHTML=
    head(
      'Staff & Permissions',
      'Role foundation'
    )+

    table(
      [
        'User',
        'Name',
        'Role',
        'Active'
      ],

      a.map(x=>[
        esc(x.id),
        esc(x.full_name),
        esc(x.role),
        x.is_active?'Yes':'No'
      ])
    );

}


/* =========================================================
   AUDIT
========================================================= */

async function audit(){

  let a=await q(
    db.from('audit_logs')
      .select('*')
      .order(
        'created_at',
        {ascending:false}
      )
      .limit(100)
  );

  $('main').innerHTML=
    head(
      'Audit Log',
      'Administrative activity trail'
    )+

    table(
      [
        'Date',
        'Action',
        'Entity',
        'Details'
      ],

      a.map(x=>[
        new Date(
          x.created_at
        ).toLocaleString(),

        esc(x.action),

        esc(x.entity_type),

        esc(
          JSON.stringify(x.details)
        )
      ])
    );

}


/* =========================================================
   TABLE HELPER
========================================================= */

function table(h,r){

  return `
    <div class="card tablewrap">

      <table class="table">

        <thead>
          <tr>
            ${h.map(x=>`<th>${x}</th>`).join('')}
          </tr>
        </thead>

        <tbody>

          ${
            r.map(x=>
              `<tr>
                ${x.map(y=>`<td>${y}</td>`).join('')}
              </tr>`
            ).join('')

            ||

            `<tr>
              <td colspan="${h.length}">
                No records.
              </td>
            </tr>`
          }

        </tbody>

      </table>

    </div>`;
}


/* =========================================================
   NAVIGATION
========================================================= */

function render(v){

  let m={
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

  (m[v]||dashboard)();

}


/* =========================================================
   LOGOUT / MENU
========================================================= */

$('logout').onclick=async()=>{

  await db.auth.signOut();

  location.reload();

};


$('menu').onclick=()=>
  $('side').classList.toggle('open');


document
  .querySelectorAll('#side button')
  .forEach(
    b=>
      b.onclick=()=>
        render(b.dataset.v)
  );


/* =========================================================
   EXISTING SESSION
========================================================= */

db.auth.getSession().then(
  async({data})=>{

    if(!data.session)return;

    /*
      If this session is the special password-recovery
      session, let the PASSWORD_RECOVERY event handle it.
    */

    if(
      window.location.hash.includes(
        'type=recovery'
      )
    ){

      showReset();

      return;

    }

    try{

      let{data:u}=await db.auth.getUser();

      let{
        data:a,
        error:ae
      }=await db.rpc('is_admin_user');

      if(ae)throw ae;

      if(u?.user&&a){

        $('login').classList.add('hidden');

        $('reset').classList.add('hidden');

        $('app').classList.remove('hidden');

        $('who').textContent=
          u.user.email;

        await load();

        render('dashboard');

      }

    }catch(e){

      await db.auth.signOut();

    }

  }
);
