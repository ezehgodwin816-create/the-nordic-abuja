/* The Nordic Abuja — Property Management System
   Improved full frontend against Supabase
*/
const URL_ = 'https://rzjvhfnizwckzbdawrb.supabase.co';
const KEY  = 'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob';
const db   = supabase.createClient(URL_, KEY);

let B = [], R = [], RT = [], G = [], HK = [], MT = [], P = [], F = [];
let currentView = 'dashboard';
let loading = false;

const $ = (x) => document.getElementById(x);
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, m => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[m]));
const money = (x) => '₦' + Number(x || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('en-GB') : '—';

async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

function toast(msg, type = '') {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 3200);
}

function setLoading(on) {
  loading = on;
  document.body.style.cursor = on ? 'wait' : '';
}

/* ---------- Modal helpers ---------- */
function openModal(title, bodyHtml, footerHtml = '') {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHtml;
  $('modalFooter').innerHTML = footerHtml;
  $('modal').classList.remove('hidden');
}
function closeModal() {
  $('modal').classList.add('hidden');
  $('modalBody').innerHTML = '';
  $('modalFooter').innerHTML = '';
}
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ---------- Auth ---------- */
function err(x) { $('loginError').textContent = x || ''; }

$('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  err('Signing in…');
  try {
    const { error } = await db.auth.signInWithPassword({
      email: $('email').value.trim(),
      password: $('password').value
    });
    if (error) throw error;

    const { data: u } = await db.auth.getUser();
    const { data: a, error: ae } = await db.rpc('is_admin_user');
    if (ae) throw ae;
    if (!a) throw new Error('This account is not authorized as an administrator.');

    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('who').textContent = u.user.email;
    await load();
    render('dashboard');
  } catch (x) {
    err(x.message || String(x));
    await db.auth.signOut();
  }
};

$('logout').onclick = async () => {
  await db.auth.signOut();
  location.reload();
};

$('menu').onclick = () => $('side').classList.toggle('open');

document.querySelectorAll('#side button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('#side button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('side').classList.remove('open');
    render(b.dataset.v);
  };
});

/* ---------- Data load ---------- */
async function load() {
  setLoading(true);
  try {
    [B, R, RT, G, HK, MT, P, F] = await Promise.all([
      q(db.from('bookings').select('*').order('created_at', { ascending: false })),
      q(db.from('rooms').select('*, room_types(name)').order('room_number')),
      q(db.from('room_types').select('*').order('name')),
      q(db.from('guest_profiles').select('*').order('created_at', { ascending: false })),
      q(db.from('housekeeping_tasks').select('*, rooms(room_number)').order('created_at', { ascending: false })),
      q(db.from('maintenance_tasks').select('*, rooms(room_number)').order('created_at', { ascending: false })),
      q(db.from('payments').select('*').order('created_at', { ascending: false })),
      q(db.from('folios').select('*').order('created_at', { ascending: false }))
    ]);
  } finally {
    setLoading(false);
  }
}

/* ---------- UI helpers ---------- */
const head = (a, b) => `<div class="head"><h1>${a}</h1><div class="muted">${b}</div></div>`;

function statusBadge(s) {
  const map = {
    pending: 'warn', confirmed: 'ok', completed: 'neutral', cancelled: 'danger',
    available: 'ok', occupied: 'gold', maintenance: 'danger', dirty: 'warn', clean: 'ok',
    open: 'warn', in_progress: 'gold', done: 'ok', closed: 'neutral',
    paid: 'ok', unpaid: 'danger', partial: 'warn', failed: 'danger',
    active: 'ok', inactive: 'neutral'
  };
  const cls = map[String(s || '').toLowerCase()] || 'neutral';
  return `<span class="badge ${cls}">${esc(s || '—')}</span>`;
}

function table(headers, rows) {
  if (!rows.length) {
    return `<div class="card empty">No records found.</div>`;
  }
  return `<div class="card tablewrap"><table class="table">
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function roomOptions(selected = '') {
  return R.map(r =>
    `<option value="${r.id}" ${r.id === selected ? 'selected' : ''}>${esc(r.room_number)} — ${esc(r.room_types?.name || '')}</option>`
  ).join('');
}
function roomTypeOptions(selected = '') {
  return RT.map(t =>
    `<option value="${t.id}" ${t.id === selected ? 'selected' : ''}>${esc(t.name)}</option>`
  ).join('');
}

/* ---------- Views ---------- */
async function dashboard() {
  let s = {};
  try { s = await q(db.rpc('pms_dashboard_stats')); } catch (e) { console.warn(e); }

  // Fallback stats if RPC missing
  if (!s || Object.keys(s).length === 0) {
    s = {
      rooms_total: R.length,
      rooms_available: R.filter(r => r.status === 'available').length,
      rooms_occupied: R.filter(r => r.status === 'occupied').length,
      rooms_maintenance: R.filter(r => r.status === 'maintenance').length,
      bookings_pending: B.filter(b => b.status === 'pending').length,
      bookings_confirmed: B.filter(b => b.status === 'confirmed').length,
      revenue_paid: P.filter(p => p.status === 'paid' || p.status === 'success').reduce((a, p) => a + Number(p.amount || 0), 0),
      open_maintenance: MT.filter(m => m.status === 'open' || m.status === 'in_progress').length
    };
  }

  $('main').innerHTML = head('Hotel Operations', 'Live property overview') +
    `<div class="grid">
      ${[
        ['Total Rooms', s.rooms_total],
        ['Available', s.rooms_available],
        ['Occupied', s.rooms_occupied],
        ['Maintenance', s.rooms_maintenance],
        ['Pending Bookings', s.bookings_pending],
        ['Confirmed', s.bookings_confirmed],
        ['Paid Revenue', money(s.revenue_paid)],
        ['Open Maintenance', s.open_maintenance]
      ].map(([label, val]) =>
        `<div class="card"><div class="muted">${label}</div><div class="stat">${val ?? 0}</div></div>`
      ).join('')}
    </div>
    <div class="card">
      <div class="muted" style="margin-bottom:8px">Quick actions</div>
      <div class="btn-row">
        <button class="primary" onclick="render('frontdesk')">Front Desk</button>
        <button class="secondary" onclick="openNewBooking()">New Booking</button>
        <button class="secondary" onclick="render('housekeeping')">Housekeeping</button>
        <button class="secondary" onclick="render('maintenance')">Maintenance</button>
      </div>
    </div>`;
}

function frontdesk() {
  const filter = (window._fdFilter || 'all');
  let list = B;
  if (filter === 'pending') list = B.filter(b => b.status === 'pending');
  if (filter === 'confirmed') list = B.filter(b => b.status === 'confirmed');
  if (filter === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    list = B.filter(b => b.check_in === today || b.check_out === today);
  }

  $('main').innerHTML = head('Front Desk', 'Arrivals, in-house guests and departures') +
    `<div class="toolbar">
      <select id="fdFilter" onchange="window._fdFilter=this.value;render('frontdesk')">
        <option value="all" ${filter==='all'?'selected':''}>All bookings</option>
        <option value="pending" ${filter==='pending'?'selected':''}>Pending</option>
        <option value="confirmed" ${filter==='confirmed'?'selected':''}>Confirmed / In-house</option>
        <option value="today" ${filter==='today'?'selected':''}>Today (in/out)</option>
      </select>
      <div class="spacer"></div>
      <button class="primary" onclick="openNewBooking()">+ New Booking</button>
      <button class="secondary" onclick="load().then(()=>render('frontdesk'))">Refresh</button>
    </div>` +
    table(
      ['Ref', 'Guest', 'Stay', 'Room', 'Status', 'Payment', 'Actions'],
      list.map(b => {
        const room = R.find(r => r.id === b.room_id);
        return [
          esc(b.booking_reference || b.id?.slice(0, 8)),
          esc(`${b.guest_first_name || ''} ${b.guest_last_name || ''}`.trim() || '—'),
          `${esc(b.check_in)} → ${esc(b.check_out)}`,
          esc(room?.room_number || '—'),
          statusBadge(b.status),
          statusBadge(b.payment_status || 'unpaid'),
          `<div class="btn-row">
            ${b.status !== 'confirmed' && b.status !== 'completed' ? `<button class="secondary" onclick="cin('${b.id}')">Check in</button>` : ''}
            ${b.status === 'confirmed' ? `<button class="secondary" onclick="cout('${b.id}')">Check out</button>` : ''}
            <button class="secondary" onclick="viewBooking('${b.id}')">View</button>
          </div>`
        ];
      })
    );
}

async function cin(id) {
  if (!confirm('Check this guest in?')) return;
  try {
    setLoading(true);
    const b = B.find(x => x.id === id);
    await q(db.from('bookings').update({ status: 'confirmed' }).eq('id', id));
    if (b?.room_id) {
      await q(db.from('rooms').update({ status: 'occupied' }).eq('id', b.room_id));
    }
    // Try create folio if function exists
    try { await q(db.rpc('create_folio_for_booking', { p_booking_id: id })); } catch (_) {}
    toast('Guest checked in', 'ok');
    await load();
    render('frontdesk');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    setLoading(false);
  }
}

async function cout(id) {
  if (!confirm('Check this guest out? Room will be marked available (or dirty).')) return;
  try {
    setLoading(true);
    const b = B.find(x => x.id === id);
    await q(db.from('bookings').update({ status: 'completed' }).eq('id', id));
    if (b?.room_id) {
      await q(db.from('rooms').update({ status: 'available' }).eq('id', b.room_id));
      // Optional: create housekeeping task
      try {
        await q(db.from('housekeeping_tasks').insert({
          room_id: b.room_id,
          task_type: 'checkout_clean',
          priority: 'high',
          status: 'open'
        }));
      } catch (_) {}
    }
    toast('Guest checked out', 'ok');
    await load();
    render('frontdesk');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    setLoading(false);
  }
}

function viewBooking(id) {
  const b = B.find(x => x.id === id);
  if (!b) return;
  const room = R.find(r => r.id === b.room_id);
  openModal('Booking ' + (b.booking_reference || id.slice(0, 8)), `
    <div class="form-grid">
      <div class="field"><label>Guest</label><div>${esc(b.guest_first_name)} ${esc(b.guest_last_name)}</div></div>
      <div class="field"><label>Email</label><div>${esc(b.guest_email || '—')}</div></div>
      <div class="field"><label>Phone</label><div>${esc(b.guest_phone || '—')}</div></div>
      <div class="field"><label>Room</label><div>${esc(room?.room_number || '—')} (${esc(room?.room_types?.name || '')})</div></div>
      <div class="field"><label>Check-in</label><div>${esc(b.check_in)}</div></div>
      <div class="field"><label>Check-out</label><div>${esc(b.check_out)}</div></div>
      <div class="field"><label>Nights</label><div>${esc(b.nights || '—')}</div></div>
      <div class="field"><label>Total</label><div>${money(b.total_amount)}</div></div>
      <div class="field"><label>Status</label><div>${statusBadge(b.status)}</div></div>
      <div class="field"><label>Payment</label><div>${statusBadge(b.payment_status || 'unpaid')}</div></div>
      <div class="field full"><label>Notes</label><div>${esc(b.notes || '—')}</div></div>
    </div>
  `, `<button class="secondary" data-close>Close</button>`);
}

function openNewBooking() {
  openModal('New Booking', `
    <div class="form-grid">
      <div class="field"><label>First name *</label><input id="nb_fn" required></div>
      <div class="field"><label>Last name</label><input id="nb_ln"></div>
      <div class="field"><label>Email</label><input id="nb_email" type="email"></div>
      <div class="field"><label>Phone</label><input id="nb_phone" type="tel"></div>
      <div class="field"><label>Check-in *</label><input id="nb_in" type="date" required></div>
      <div class="field"><label>Check-out *</label><input id="nb_out" type="date" required></div>
      <div class="field full"><label>Room</label>
        <select id="nb_room"><option value="">— Select room —</option>${roomOptions()}</select>
      </div>
      <div class="field"><label>Room price / night</label><input id="nb_price" type="number" min="0" step="100" value="0"></div>
      <div class="field"><label>Status</label>
        <select id="nb_status">
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>
      <div class="field full"><label>Notes</label><textarea id="nb_notes"></textarea></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveNewBooking()">Create booking</button>
  `);
}

async function saveNewBooking() {
  const fn = $('nb_fn').value.trim();
  const cin = $('nb_in').value;
  const cout = $('nb_out').value;
  if (!fn || !cin || !cout) {
    toast('First name, check-in and check-out are required', 'error');
    return;
  }
  if (cout <= cin) {
    toast('Check-out must be after check-in', 'error');
    return;
  }
  const nights = Math.round((new Date(cout) - new Date(cin)) / 86400000);
  const price = Number($('nb_price').value || 0);
  const roomId = $('nb_room').value || null;

  const ref = 'NA-' + Date.now().toString(36).toUpperCase().slice(-6);

  try {
    setLoading(true);
    await q(db.from('bookings').insert({
      booking_reference: ref,
      guest_first_name: fn,
      guest_last_name: $('nb_ln').value.trim() || null,
      guest_email: $('nb_email').value.trim() || null,
      guest_phone: $('nb_phone').value.trim() || null,
      check_in: cin,
      check_out: cout,
      nights,
      room_id: roomId,
      room_price: price,
      total_amount: price * nights,
      status: $('nb_status').value,
      payment_status: 'unpaid',
      notes: $('nb_notes').value.trim() || null
    }));
    if (roomId && $('nb_status').value === 'confirmed') {
      await q(db.from('rooms').update({ status: 'occupied' }).eq('id', roomId));
    }
    toast('Booking created: ' + ref, 'ok');
    closeModal();
    await load();
    render('frontdesk');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    setLoading(false);
  }
}

function calendar() {
  const days = [...Array(14)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  let html = `<div class="card tablewrap"><table class="table"><thead><tr><th>Room</th>${
    days.map(d => `<th>${d.slice(5)}</th>`).join('')
  }</tr></thead><tbody>`;

  R.forEach(r => {
    html += `<tr><td><b>${esc(r.room_number)}</b><br><span class="muted">${esc(r.room_types?.name || '')}</span><br>${statusBadge(r.status)}</td>`;
    days.forEach(d => {
      const hits = B.filter(b =>
        b.room_id === r.id &&
        b.status !== 'cancelled' &&
        d >= b.check_in && d < b.check_out
      );
      html += `<td>${hits.map(b =>
        `<span class="badge gold" title="${esc(b.guest_first_name)}">${esc(b.booking_reference || '•')}</span>`
      ).join(' ') || '—'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  $('main').innerHTML = head('Reservation Calendar', 'Room rack — next 14 days') + html;
}

function rooms() {
  $('main').innerHTML = head('Rooms', 'Inventory and status') +
    `<div class="toolbar">
      <button class="primary" onclick="openRoomForm()">+ Add room</button>
      <button class="secondary" onclick="openRoomTypeForm()">+ Room type</button>
      <div class="spacer"></div>
      <button class="secondary" onclick="load().then(()=>render('rooms'))">Refresh</button>
    </div>` +
    table(
      ['Room', 'Type', 'Floor', 'Status', 'Actions'],
      R.map(r => [
        `<b>${esc(r.room_number)}</b>`,
        esc(r.room_types?.name || '—'),
        esc(r.floor ?? '—'),
        statusBadge(r.status),
        `<div class="btn-row">
          <button class="secondary" onclick="setRoomStatus('${r.id}','available')">Available</button>
          <button class="secondary" onclick="setRoomStatus('${r.id}','occupied')">Occupied</button>
          <button class="secondary" onclick="setRoomStatus('${r.id}','maintenance')">Maint.</button>
          <button class="secondary" onclick="openRoomForm('${r.id}')">Edit</button>
        </div>`
      ])
    ) +
    (RT.length ? `<div class="head" style="margin-top:24px"><h1 style="font-size:1.2rem">Room Types</h1></div>` +
      table(['Name', 'Base rate', 'Capacity', 'Active'], RT.map(t => [
        esc(t.name),
        money(t.base_rate),
        esc(t.capacity ?? '—'),
        t.is_active === false ? statusBadge('inactive') : statusBadge('active')
      ])) : '');
}

async function setRoomStatus(id, status) {
  try {
    await q(db.from('rooms').update({ status }).eq('id', id));
    toast('Room status updated', 'ok');
    await load();
    render('rooms');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function openRoomForm(id) {
  const r = id ? R.find(x => x.id === id) : null;
  openModal(r ? 'Edit Room' : 'Add Room', `
    <div class="form-grid">
      <div class="field"><label>Room number *</label><input id="rm_num" value="${esc(r?.room_number || '')}" required></div>
      <div class="field"><label>Floor</label><input id="rm_floor" type="number" value="${esc(r?.floor ?? '')}"></div>
      <div class="field full"><label>Room type</label>
        <select id="rm_type"><option value="">—</option>${roomTypeOptions(r?.room_type_id)}</select>
      </div>
      <div class="field full"><label>Status</label>
        <select id="rm_status">
          ${['available','occupied','maintenance','dirty'].map(s =>
            `<option value="${s}" ${r?.status===s?'selected':''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveRoom('${id || ''}')">Save</button>
  `);
}

async function saveRoom(id) {
  const num = $('rm_num').value.trim();
  if (!num) { toast('Room number required', 'error'); return; }
  const payload = {
    room_number: num,
    floor: $('rm_floor').value ? Number($('rm_floor').value) : null,
    room_type_id: $('rm_type').value || null,
    status: $('rm_status').value
  };
  try {
    if (id) await q(db.from('rooms').update(payload).eq('id', id));
    else await q(db.from('rooms').insert(payload));
    toast('Room saved', 'ok');
    closeModal();
    await load();
    render('rooms');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function openRoomTypeForm() {
  openModal('Add Room Type', `
    <div class="form-grid">
      <div class="field full"><label>Name *</label><input id="rt_name" required></div>
      <div class="field"><label>Base rate (₦)</label><input id="rt_rate" type="number" min="0" step="100" value="0"></div>
      <div class="field"><label>Capacity</label><input id="rt_cap" type="number" min="1" value="2"></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveRoomType()">Save</button>
  `);
}

async function saveRoomType() {
  const name = $('rt_name').value.trim();
  if (!name) { toast('Name required', 'error'); return; }
  try {
    await q(db.from('room_types').insert({
      name,
      base_rate: Number($('rt_rate').value || 0),
      capacity: Number($('rt_cap').value || 2),
      is_active: true
    }));
    toast('Room type created', 'ok');
    closeModal();
    await load();
    render('rooms');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function guests() {
  $('main').innerHTML = head('Guests & CRM', 'Guest profiles and VIP information') +
    `<div class="toolbar">
      <button class="primary" onclick="openGuestForm()">+ Add guest</button>
      <div class="spacer"></div>
      <input type="search" id="guestSearch" placeholder="Search name / email / phone" oninput="filterGuests()">
    </div>
    <div id="guestTable"></div>`;
  filterGuests();
}

function filterGuests() {
  const q = ($('guestSearch')?.value || '').toLowerCase();
  const list = !q ? G : G.filter(g =>
    `${g.first_name} ${g.last_name} ${g.email} ${g.phone}`.toLowerCase().includes(q)
  );
  $('guestTable').innerHTML = table(
    ['Name', 'Email', 'Phone', 'Country', 'VIP', 'Actions'],
    list.map(g => [
      esc(`${g.first_name || ''} ${g.last_name || ''}`.trim()),
      esc(g.email || '—'),
      esc(g.phone || '—'),
      esc(g.country || '—'),
      g.vip ? '⭐' : '—',
      `<button class="secondary" onclick="openGuestForm('${g.id}')">Edit</button>
       <button class="secondary" onclick="toggleVip('${g.id}', ${!g.vip})">${g.vip ? 'Unmark VIP' : 'Mark VIP'}</button>`
    ])
  );
}

function openGuestForm(id) {
  const g = id ? G.find(x => x.id === id) : null;
  openModal(g ? 'Edit Guest' : 'Add Guest', `
    <div class="form-grid">
      <div class="field"><label>First name *</label><input id="g_fn" value="${esc(g?.first_name || '')}"></div>
      <div class="field"><label>Last name</label><input id="g_ln" value="${esc(g?.last_name || '')}"></div>
      <div class="field"><label>Email</label><input id="g_email" type="email" value="${esc(g?.email || '')}"></div>
      <div class="field"><label>Phone</label><input id="g_phone" value="${esc(g?.phone || '')}"></div>
      <div class="field"><label>Country</label><input id="g_country" value="${esc(g?.country || '')}"></div>
      <div class="field"><label>VIP</label>
        <select id="g_vip">
          <option value="false" ${!g?.vip?'selected':''}>No</option>
          <option value="true" ${g?.vip?'selected':''}>Yes</option>
        </select>
      </div>
      <div class="field full"><label>Notes</label><textarea id="g_notes">${esc(g?.notes || '')}</textarea></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveGuest('${id || ''}')">Save</button>
  `);
}

async function saveGuest(id) {
  const fn = $('g_fn').value.trim();
  if (!fn) { toast('First name required', 'error'); return; }
  const payload = {
    first_name: fn,
    last_name: $('g_ln').value.trim() || null,
    email: $('g_email').value.trim() || null,
    phone: $('g_phone').value.trim() || null,
    country: $('g_country').value.trim() || null,
    vip: $('g_vip').value === 'true',
    notes: $('g_notes').value.trim() || null
  };
  try {
    if (id) await q(db.from('guest_profiles').update(payload).eq('id', id));
    else await q(db.from('guest_profiles').insert(payload));
    toast('Guest saved', 'ok');
    closeModal();
    await load();
    render('guests');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function toggleVip(id, vip) {
  try {
    await q(db.from('guest_profiles').update({ vip }).eq('id', id));
    await load();
    render('guests');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function housekeeping() {
  $('main').innerHTML = head('Housekeeping', 'Cleaning and inspection tasks') +
    `<div class="toolbar">
      <button class="primary" onclick="openHKForm()">+ Create task</button>
      <div class="spacer"></div>
      <button class="secondary" onclick="load().then(()=>render('housekeeping'))">Refresh</button>
    </div>` +
    table(
      ['Room', 'Task', 'Priority', 'Status', 'Created', 'Actions'],
      HK.map(x => [
        esc(x.rooms?.room_number || '—'),
        esc(x.task_type || '—'),
        statusBadge(x.priority || 'normal'),
        statusBadge(x.status),
        fmtDT(x.created_at),
        `<div class="btn-row">
          ${x.status !== 'done' ? `<button class="secondary" onclick="setHKStatus('${x.id}','done')">Mark done</button>` : ''}
          ${x.status === 'open' ? `<button class="secondary" onclick="setHKStatus('${x.id}','in_progress')">Start</button>` : ''}
        </div>`
      ])
    );
}

function openHKForm() {
  openModal('New Housekeeping Task', `
    <div class="form-grid">
      <div class="field full"><label>Room *</label>
        <select id="hk_room"><option value="">— Select —</option>${roomOptions()}</select>
      </div>
      <div class="field"><label>Task type</label>
        <select id="hk_type">
          <option value="cleaning">Cleaning</option>
          <option value="checkout_clean">Checkout clean</option>
          <option value="inspection">Inspection</option>
          <option value="turndown">Turndown</option>
          <option value="deep_clean">Deep clean</option>
        </select>
      </div>
      <div class="field"><label>Priority</label>
        <select id="hk_pri">
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="field full"><label>Notes</label><textarea id="hk_notes"></textarea></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveHK()">Create</button>
  `);
}

async function saveHK() {
  const roomId = $('hk_room').value;
  if (!roomId) { toast('Select a room', 'error'); return; }
  try {
    await q(db.from('housekeeping_tasks').insert({
      room_id: roomId,
      task_type: $('hk_type').value,
      priority: $('hk_pri').value,
      status: 'open',
      notes: $('hk_notes').value.trim() || null
    }));
    toast('Task created', 'ok');
    closeModal();
    await load();
    render('housekeeping');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function setHKStatus(id, status) {
  try {
    await q(db.from('housekeeping_tasks').update({ status }).eq('id', id));
    toast('Updated', 'ok');
    await load();
    render('housekeeping');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function maintenance() {
  $('main').innerHTML = head('Maintenance', 'Repairs and out-of-service tracking') +
    `<div class="toolbar">
      <button class="primary" onclick="openMTForm()">+ New ticket</button>
      <div class="spacer"></div>
      <button class="secondary" onclick="load().then(()=>render('maintenance'))">Refresh</button>
    </div>` +
    table(
      ['Title', 'Room', 'Priority', 'Status', 'Cost', 'Actions'],
      MT.map(x => [
        esc(x.title),
        esc(x.rooms?.room_number || '—'),
        statusBadge(x.priority || 'normal'),
        statusBadge(x.status),
        money(x.cost),
        `<div class="btn-row">
          ${x.status !== 'closed' && x.status !== 'done' ?
            `<button class="secondary" onclick="setMTStatus('${x.id}','in_progress')">Start</button>
             <button class="secondary" onclick="setMTStatus('${x.id}','closed')">Close</button>` : ''}
        </div>`
      ])
    );
}

function openMTForm() {
  openModal('New Maintenance Ticket', `
    <div class="form-grid">
      <div class="field full"><label>Title *</label><input id="mt_title" required></div>
      <div class="field full"><label>Room (optional)</label>
        <select id="mt_room"><option value="">— None —</option>${roomOptions()}</select>
      </div>
      <div class="field"><label>Priority</label>
        <select id="mt_pri">
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="field"><label>Estimated cost (₦)</label><input id="mt_cost" type="number" min="0" step="100" value="0"></div>
      <div class="field full"><label>Description</label><textarea id="mt_desc"></textarea></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveMT()">Create</button>
  `);
}

async function saveMT() {
  const title = $('mt_title').value.trim();
  if (!title) { toast('Title required', 'error'); return; }
  try {
    await q(db.from('maintenance_tasks').insert({
      title,
      room_id: $('mt_room').value || null,
      priority: $('mt_pri').value,
      cost: Number($('mt_cost').value || 0),
      description: $('mt_desc').value.trim() || null,
      status: 'open'
    }));
    toast('Ticket created', 'ok');
    closeModal();
    await load();
    render('maintenance');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function setMTStatus(id, status) {
  try {
    await q(db.from('maintenance_tasks').update({ status }).eq('id', id));
    toast('Updated', 'ok');
    await load();
    render('maintenance');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function folios() {
  $('main').innerHTML = head('Folios & Billing', 'Guest accounts and balances') +
    table(
      ['Booking', 'Status', 'Total', 'Paid', 'Balance'],
      F.map(x => {
        const b = B.find(b => b.id === x.booking_id);
        return [
          esc(b?.booking_reference || x.booking_id?.slice(0, 8) || '—'),
          statusBadge(x.status),
          money(x.total),
          money(x.paid),
          money(x.balance)
        ];
      })
    );
}

function payments() {
  $('main').innerHTML = head('Payments', 'Payment ledger') +
    `<div class="toolbar">
      <button class="primary" onclick="openPaymentForm()">+ Record payment</button>
    </div>` +
    table(
      ['Date', 'Booking', 'Amount', 'Method', 'Status', 'Reference'],
      P.map(x => {
        const b = B.find(b => b.id === x.booking_id);
        return [
          fmtDT(x.created_at),
          esc(b?.booking_reference || '—'),
          money(x.amount),
          esc(x.method || '—'),
          statusBadge(x.status),
          esc(x.provider_reference || '—')
        ];
      })
    );
}

function openPaymentForm() {
  const bookingOpts = B.map(b =>
    `<option value="${b.id}">${esc(b.booking_reference || b.id.slice(0,8))} — ${esc(b.guest_first_name)} (${money(b.total_amount)})</option>`
  ).join('');
  openModal('Record Payment', `
    <div class="form-grid">
      <div class="field full"><label>Booking *</label>
        <select id="pay_booking"><option value="">— Select —</option>${bookingOpts}</select>
      </div>
      <div class="field"><label>Amount (₦) *</label><input id="pay_amount" type="number" min="0" step="100"></div>
      <div class="field"><label>Method</label>
        <select id="pay_method">
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Bank transfer</option>
          <option value="pos">POS</option>
          <option value="online">Online</option>
        </select>
      </div>
      <div class="field full"><label>Reference</label><input id="pay_ref" placeholder="Receipt / transaction ID"></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="savePayment()">Save</button>
  `);
}

async function savePayment() {
  const bookingId = $('pay_booking').value;
  const amount = Number($('pay_amount').value || 0);
  if (!bookingId || amount <= 0) {
    toast('Booking and amount required', 'error');
    return;
  }
  try {
    await q(db.from('payments').insert({
      booking_id: bookingId,
      amount,
      method: $('pay_method').value,
      status: 'paid',
      provider_reference: $('pay_ref').value.trim() || null
    }));
    // Mark booking payment status
    await q(db.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId));
    toast('Payment recorded', 'ok');
    closeModal();
    await load();
    render('payments');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function rates() {
  let a = [];
  try {
    a = await q(db.from('rate_rules').select('*, room_types(name)').order('start_date', { ascending: false }));
  } catch (e) {
    console.warn(e);
  }
  $('main').innerHTML = head('Rates & Promotions', 'Seasonal rates and minimum stays') +
    `<div class="toolbar">
      <button class="primary" onclick="openRateForm()">+ Add rate rule</button>
    </div>` +
    table(
      ['Room type', 'Rule', 'Dates', 'Rate / night', 'Min nights', 'Active'],
      a.map(x => [
        esc(x.room_types?.name || '—'),
        esc(x.name),
        `${esc(x.start_date)} → ${esc(x.end_date)}`,
        money(x.price_per_night),
        esc(x.minimum_nights ?? 1),
        x.is_active ? statusBadge('active') : statusBadge('inactive')
      ])
    );
}

function openRateForm() {
  openModal('New Rate Rule', `
    <div class="form-grid">
      <div class="field full"><label>Name *</label><input id="rr_name" placeholder="e.g. Weekend rate, Christmas"></div>
      <div class="field full"><label>Room type</label>
        <select id="rr_type"><option value="">— Any / All —</option>${roomTypeOptions()}</select>
      </div>
      <div class="field"><label>Start date</label><input id="rr_start" type="date"></div>
      <div class="field"><label>End date</label><input id="rr_end" type="date"></div>
      <div class="field"><label>Price per night (₦)</label><input id="rr_price" type="number" min="0" step="100"></div>
      <div class="field"><label>Minimum nights</label><input id="rr_min" type="number" min="1" value="1"></div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveRate()">Save</button>
  `);
}

async function saveRate() {
  const name = $('rr_name').value.trim();
  if (!name) { toast('Name required', 'error'); return; }
  try {
    await q(db.from('rate_rules').insert({
      name,
      room_type_id: $('rr_type').value || null,
      start_date: $('rr_start').value || null,
      end_date: $('rr_end').value || null,
      price_per_night: Number($('rr_price').value || 0),
      minimum_nights: Number($('rr_min').value || 1),
      is_active: true
    }));
    toast('Rate rule created', 'ok');
    closeModal();
    render('rates');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function extras() {
  let a = [];
  try {
    a = await q(db.from('booking_extras_catalog').select('*').order('name'));
  } catch (e) {
    console.warn(e);
  }
  $('main').innerHTML = head('Extras & Add-ons', 'Breakfast, transfers, laundry and services') +
    `<div class="toolbar">
      <button class="primary" onclick="openExtraForm()">+ Add extra</button>
    </div>` +
    table(
      ['Name', 'Price', 'Pricing type', 'Active', 'Actions'],
      a.map(x => [
        esc(x.name),
        money(x.price),
        esc(x.pricing_type || 'fixed'),
        x.is_active === false ? statusBadge('inactive') : statusBadge('active'),
        `<button class="secondary" onclick="toggleExtra('${x.id}', ${x.is_active === false})">${x.is_active === false ? 'Activate' : 'Deactivate'}</button>`
      ])
    );
}

function openExtraForm() {
  openModal('New Extra', `
    <div class="form-grid">
      <div class="field full"><label>Name *</label><input id="ex_name" placeholder="e.g. Airport transfer, Breakfast"></div>
      <div class="field"><label>Price (₦)</label><input id="ex_price" type="number" min="0" step="100" value="0"></div>
      <div class="field"><label>Pricing type</label>
        <select id="ex_type">
          <option value="fixed">Fixed</option>
          <option value="per_night">Per night</option>
          <option value="per_person">Per person</option>
        </select>
      </div>
    </div>
  `, `
    <button class="secondary" data-close>Cancel</button>
    <button class="primary" onclick="saveExtra()">Save</button>
  `);
}

async function saveExtra() {
  const name = $('ex_name').value.trim();
  if (!name) { toast('Name required', 'error'); return; }
  try {
    await q(db.from('booking_extras_catalog').insert({
      name,
      price: Number($('ex_price').value || 0),
      pricing_type: $('ex_type').value,
      is_active: true
    }));
    toast('Extra created', 'ok');
    closeModal();
    render('extras');
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function toggleExtra(id, activate) {
  try {
    await q(db.from('booking_extras_catalog').update({ is_active: activate }).eq('id', id));
    render('extras');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function reports() {
  const total = B.length;
  const confirmed = B.filter(x => x.status === 'confirmed' || x.status === 'completed').length;
  const revenue = P.filter(p => p.status === 'paid' || p.status === 'success')
    .reduce((a, p) => a + Number(p.amount || 0), 0);

  $('main').innerHTML = head('Reports & Analytics', 'Operational KPIs and exports') +
    `<div class="grid">
      <div class="card"><div class="muted">Total bookings</div><div class="stat">${total}</div></div>
      <div class="card"><div class="muted">Confirmed / Completed</div><div class="stat">${confirmed}</div></div>
      <div class="card"><div class="muted">Confirmation rate</div><div class="stat">${total ? Math.round(confirmed / total * 100) : 0}%</div></div>
      <div class="card"><div class="muted">Recorded revenue</div><div class="stat">${money(revenue)}</div></div>
    </div>
    <div class="card">
      <button class="primary" onclick="csv()">Export bookings CSV</button>
    </div>`;
}

function csv() {
  const keys = [
    'booking_reference', 'guest_first_name', 'guest_last_name', 'guest_email',
    'guest_phone', 'check_in', 'check_out', 'nights', 'room_price',
    'total_amount', 'status', 'payment_status'
  ];
  const out = [
    keys.join(','),
    ...B.map(b => keys.map(k => `"${String(b[k] ?? '').replaceAll('"', '""')}"`).join(','))
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv' }));
  a.download = 'nordic-bookings.csv';
  a.click();
  toast('CSV downloaded', 'ok');
}

async function staff() {
  let a = [];
  try {
    a = await q(db.from('staff_profiles').select('*'));
  } catch (e) {
    console.warn(e);
  }
  $('main').innerHTML = head('Staff & Permissions', 'Role foundation') +
    table(
      ['User ID', 'Name', 'Role', 'Active'],
      a.map(x => [
        esc(x.id?.slice(0, 8) || '—'),
        esc(x.full_name || '—'),
        esc(x.role || '—'),
        x.is_active === false ? statusBadge('inactive') : statusBadge('active')
      ])
    );
}

async function audit() {
  let a = [];
  try {
    a = await q(db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100));
  } catch (e) {
    console.warn(e);
  }
  $('main').innerHTML = head('Audit Log', 'Administrative activity trail') +
    table(
      ['Date', 'Action', 'Entity', 'Details'],
      a.map(x => [
        fmtDT(x.created_at),
        esc(x.action),
        esc(x.entity_type),
        `<code style="font-size:12px">${esc(JSON.stringify(x.details || {}))}</code>`
      ])
    );
}

/* ---------- Router ---------- */
function render(v) {
  currentView = v;
  const map = {
    dashboard, frontdesk, calendar, rooms, guests,
    housekeeping, maintenance, folios, payments,
    rates, extras, reports, staff, audit
  };
  (map[v] || dashboard)();
}

/* ---------- Session restore ---------- */
db.auth.getSession().then(async ({ data }) => {
  if (data.session) {
    const { data: u } = await db.auth.getUser();
    const { data: a } = await db.rpc('is_admin_user');
    if (u?.user && a) {
      $('login').classList.add('hidden');
      $('app').classList.remove('hidden');
      $('who').textContent = u.user.email;
      await load();
      render('dashboard');
    }
  }
});

/* Expose functions needed by inline onclick handlers */
Object.assign(window, {
  render, cin, cout, viewBooking, openNewBooking, saveNewBooking,
  openRoomForm, saveRoom, openRoomTypeForm, saveRoomType, setRoomStatus,
  openGuestForm, saveGuest, toggleVip, filterGuests,
  openHKForm, saveHK, setHKStatus,
  openMTForm, saveMT, setMTStatus,
  openPaymentForm, savePayment,
  openRateForm, saveRate,
  openExtraForm, saveExtra, toggleExtra,
  csv
});
