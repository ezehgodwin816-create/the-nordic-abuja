/**
 * Nordic Group — Supabase Auth (same project as original Nordic)
 * Faster login + clear errors for "Failed to fetch"
 */
(function (global) {
  'use strict';

  var URL = 'https://rzjvhfnizwckzbdawrbn.supabase.co';
  var KEY = 'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob';
  var client = null;
  var cachedSession = null;

  function cfg() {
    var c = global.NORDIC_CONFIG || {};
    return {
      url: c.supabaseUrl || URL,
      key: c.supabaseAnonKey || KEY
    };
  }

  function getClient() {
    if (!global.supabase || !global.supabase.createClient) {
      throw new Error('Supabase library not loaded. Check your internet connection and refresh.');
    }
    if (!client) {
      var c = cfg();
      client = global.supabase.createClient(c.url, c.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return client;
  }

  function withTimeout(promise, ms, msg) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error(msg || ('Request timed out after ' + ms + 'ms')));
      }, ms);
      promise.then(function (v) {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(v);
      }, function (e) {
        if (done) return;
        done = true;
        clearTimeout(t);
        reject(e);
      });
    });
  }

  function humanError(e) {
    var m = (e && e.message) ? e.message : String(e || 'Unknown error');
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(m)) {
      return 'Cannot reach Supabase (Failed to fetch). Check: 1) internet 2) project not paused in supabase.com 3) URL/key in config.js match your dashboard.';
    }
    if (/timed out/i.test(m)) {
      return m + ' — network may be slow. Try again.';
    }
    if (/invalid login|invalid credentials|email not confirmed/i.test(m)) {
      return m;
    }
    return m;
  }

  function absolutePath(rel) {
    var base = '/';
    try {
      if (location.hostname.indexOf('github.io') !== -1) {
        var parts = location.pathname.split('/');
        if (parts[1]) base = '/' + parts[1] + '/';
      }
    } catch (e) {}
    return base + String(rel || '').replace(/^\//, '');
  }

  function mapRole(staffRow, isAdminRpc) {
    if (!staffRow && !isAdminRpc) return 'guest';
    var role = (staffRow && staffRow.role) ? String(staffRow.role).toLowerCase() : '';
    if (role === 'super_admin' || role === 'super') return 'super';
    if (role === 'admin' || role === 'manager' || role === 'finance') return 'admin';
    if (role === 'staff' || role === 'reception' || role === 'front_desk' || role === 'housekeeping') return 'staff';
    if (isAdminRpc) return 'admin';
    if (staffRow) return 'staff';
    return 'guest';
  }

  async function loadProfile(user) {
    var db = getClient();
    var staff = null;
    var isAdmin = false;

    // Run checks in parallel with short timeouts so UI is not stuck
    var adminP = withTimeout(db.rpc('is_admin_user'), 8000, 'Admin check timed out').then(
      function (r) { isAdmin = r.data === true; },
      function () { isAdmin = false; }
    );
    var staffP = withTimeout(
      db.from('staff_profiles').select('*').eq('id', user.id).maybeSingle(),
      8000,
      'Staff profile timed out'
    ).then(
      function (sp) { if (sp && !sp.error && sp.data) staff = sp.data; },
      function () {}
    );
    await Promise.all([adminP, staffP]);

    var role = mapRole(staff, isAdmin);
    if (role === 'admin' && staff && String(staff.role).toLowerCase() === 'super_admin') {
      role = 'super';
    }

    return {
      id: user.id,
      email: user.email,
      name:
        (staff && (staff.full_name || staff.name || staff.display_name)) ||
        (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
        (user.email ? user.email.split('@')[0] : 'User'),
      role: role,
      hotelId: (staff && (staff.hotel_id || staff.hotelId || staff.property_id)) || null,
      staff: staff,
      isAdmin: isAdmin,
      user: user
    };
  }

  async function getSession() {
    try {
      var db = getClient();
      var res = await withTimeout(db.auth.getSession(), 10000, 'Session check timed out');
      if (res.error) throw res.error;
      var sess = res.data && res.data.session;
      if (!sess || !sess.user) {
        cachedSession = null;
        return null;
      }
      cachedSession = await loadProfile(sess.user);
      return cachedSession;
    } catch (e) {
      console.warn('getSession', e);
      return null;
    }
  }

  async function login(email, password, roleHint) {
    email = String(email || '').trim().toLowerCase();
    password = String(password || '');
    if (!email || !password) {
      return { ok: false, error: 'Enter email and password.' };
    }
    if (!global.supabase) {
      return { ok: false, error: 'Supabase script not loaded. Refresh the page or check your connection.' };
    }

    try {
      var db = getClient();
      var result = await withTimeout(
        db.auth.signInWithPassword({ email: email, password: password }),
        15000,
        'Sign-in timed out. Check internet or try again.'
      );

      if (result.error) {
        return { ok: false, error: humanError(result.error) };
      }
      if (!result.data || !result.data.session || !result.data.user) {
        return { ok: false, error: 'Sign-in did not create a valid session.' };
      }

      var profile = await loadProfile(result.data.user);

      if (roleHint === 'admin' || roleHint === 'super') {
        if (!profile.isAdmin && profile.role !== 'admin' && profile.role !== 'super') {
          await db.auth.signOut();
          return { ok: false, error: 'This account is not an administrator in staff_profiles / is_admin_user.' };
        }
      }
      if (roleHint === 'staff') {
        if (profile.role === 'guest' && !profile.staff) {
          await db.auth.signOut();
          return { ok: false, error: 'No staff_profiles row found for this user.' };
        }
      }
      if (roleHint === 'super') {
        var sr = profile.staff && String(profile.staff.role || '').toLowerCase();
        if (sr === 'super_admin') profile.role = 'super';
        else if (profile.isAdmin) profile.role = 'super'; // legacy single-hotel admin → command
      }

      cachedSession = profile;
      return { ok: true, session: profile, redirect: redirectFor(profile) };
    } catch (e) {
      console.error(e);
      return { ok: false, error: humanError(e) };
    }
  }

  async function register(email, password, fullName) {
    email = String(email || '').trim().toLowerCase();
    password = String(password || '');
    if (!email || password.length < 6) {
      return { ok: false, error: 'Email and password (6+ characters) required.' };
    }
    try {
      var db = getClient();
      var result = await withTimeout(
        db.auth.signUp({
          email: email,
          password: password,
          options: { data: { full_name: fullName || email.split('@')[0] } }
        }),
        15000,
        'Registration timed out.'
      );
      if (result.error) return { ok: false, error: humanError(result.error) };
      if (result.data && result.data.session && result.data.user) {
        cachedSession = await loadProfile(result.data.user);
        return { ok: true, session: cachedSession, message: 'Account created and signed in.' };
      }
      return {
        ok: true,
        session: null,
        message: 'Account created. If email confirmation is on, confirm then sign in.'
      };
    } catch (e) {
      return { ok: false, error: humanError(e) };
    }
  }

  async function logout() {
    try {
      await getClient().auth.signOut();
    } catch (e) {}
    cachedSession = null;
  }

  function redirectFor(session) {
    if (!session) return null;
    if (session.role === 'super') return absolutePath('super-admin/index.html');
    if (session.role === 'admin' || (session.isAdmin && session.role !== 'staff')) {
      var hid = session.hotelId || 'joyous';
      return absolutePath('admin/hotel-admin.html?hotel=' + encodeURIComponent(hid));
    }
    if (session.role === 'staff') {
      var h = session.hotelId || 'joyous';
      return absolutePath(h + '/portal.html?role=staff');
    }
    return null;
  }

  async function requireRole(roles, opts) {
    opts = opts || {};
    var list = Array.isArray(roles) ? roles : [roles];
    var s = await getSession();
    if (!s || (list.indexOf(s.role) === -1 && !(s.isAdmin && (list.indexOf('admin') !== -1 || list.indexOf('super') !== -1)))) {
      if (opts.redirect !== false) {
        location.href = absolutePath('shared/login.html') + (opts.role ? '?role=' + opts.role : '');
      }
      return null;
    }
    return s;
  }

  async function fetchPublicStaff(hotelId) {
    try {
      var db = getClient();
      var res = await withTimeout(
        db.from('staff_profiles').select('id, full_name, name, role, department, phone, is_active, hotel_id').eq('is_active', true).limit(50),
        8000,
        'Staff list timed out'
      );
      if (res.error || !res.data) return [];
      return res.data.map(function (row) {
        return {
          id: row.id,
          hotelId: row.hotel_id || hotelId || null,
          hotelName: '',
          name: row.full_name || row.name || 'Staff',
          role: row.role || 'Staff',
          department: row.department || '',
          shift: '',
          contact: row.phone || 'Ask reception',
          public: true,
          photo: null,
          bio: ''
        };
      });
    } catch (e) {
      return [];
    }
  }

  /** Quick ping so UI can show connection status */
  async function ping() {
    try {
      var c = cfg();
      var res = await withTimeout(
        fetch(c.url + '/auth/v1/health', {
          headers: { apikey: c.key, Authorization: 'Bearer ' + c.key }
        }),
        8000,
        'Ping timed out'
      );
      return { ok: res.ok || res.status === 200, status: res.status };
    } catch (e) {
      return { ok: false, error: humanError(e) };
    }
  }

  global.NordicAuth = {
    getClient: getClient,
    login: login,
    register: register,
    logout: logout,
    getSession: getSession,
    requireRole: requireRole,
    redirectFor: redirectFor,
    fetchPublicStaff: fetchPublicStaff,
    findStaff: function () { return []; },
    listPublicStaff: function () { return global.__NORDIC_STAFF_CACHE || []; },
    loadStaffCache: async function (hotelId) {
      global.__NORDIC_STAFF_CACHE = await fetchPublicStaff(hotelId);
      return global.__NORDIC_STAFF_CACHE;
    },
    ping: ping
  };
})(window);
