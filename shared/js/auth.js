/**
 * Nordic Group — Supabase Auth (same project as original Nordic Abuja)
 * NO local demo passwords. Real signInWithPassword + is_admin_user + staff_profiles.
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
      throw new Error('Supabase library not loaded. Include @supabase/supabase-js');
    }
    if (!client) {
      var c = cfg();
      client = global.supabase.createClient(c.url, c.key);
    }
    return client;
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

    try {
      var adminRes = await db.rpc('is_admin_user');
      isAdmin = adminRes.data === true;
    } catch (e) {
      console.warn('is_admin_user', e);
    }

    try {
      var sp = await db.from('staff_profiles').select('*').eq('id', user.id).maybeSingle();
      if (!sp.error && sp.data) staff = sp.data;
    } catch (e) {
      console.warn('staff_profiles', e);
    }

    var role = mapRole(staff, isAdmin);
    var hotelId = staff && (staff.hotel_id || staff.hotelId || staff.property_id) || null;

    return {
      id: user.id,
      email: user.email,
      name: (staff && (staff.full_name || staff.name || staff.display_name)) ||
        (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
        (user.email ? user.email.split('@')[0] : 'User'),
      role: role,
      hotelId: hotelId,
      staff: staff,
      isAdmin: isAdmin,
      user: user
    };
  }

  async function getSession() {
    try {
      var db = getClient();
      var res = await db.auth.getSession();
      if (res.error) throw res.error;
      var sess = res.data && res.data.session;
      if (!sess || !sess.user) {
        cachedSession = null;
        return null;
      }
      cachedSession = await loadProfile(sess.user);
      return cachedSession;
    } catch (e) {
      console.error('getSession', e);
      return null;
    }
  }

  /**
   * Real Supabase login
   * @param {string} email
   * @param {string} password
   * @param {string} [roleHint] guest|staff|admin|super — validates after login
   */
  async function login(email, password, roleHint) {
    email = String(email || '').trim().toLowerCase();
    password = String(password || '');
    if (!email || !password) {
      return { ok: false, error: 'Enter email and password.' };
    }

    try {
      var db = getClient();
      var result = await db.auth.signInWithPassword({ email: email, password: password });
      if (result.error) {
        return { ok: false, error: result.error.message || 'Unable to sign in.' };
      }
      if (!result.data || !result.data.session || !result.data.user) {
        return { ok: false, error: 'Sign-in did not create a valid session.' };
      }

      var profile = await loadProfile(result.data.user);

      // Role gate (same accounts as your Supabase staff_profiles / admin users)
      if (roleHint === 'super' && profile.role !== 'super' && !(profile.isAdmin && profile.role === 'admin' && !profile.hotelId)) {
        // allow is_admin_user without hotel as central if super_admin missing
        if (profile.role !== 'super' && profile.staff && String(profile.staff.role).toLowerCase() !== 'super_admin') {
          if (roleHint === 'super' && profile.role !== 'super') {
            // still allow any is_admin_user into super for single-hotel legacy
            if (!profile.isAdmin) {
              await db.auth.signOut();
              return { ok: false, error: 'This account is not Central Command (super_admin).' };
            }
            profile.role = 'super';
          }
        }
      }
      if (roleHint === 'admin') {
        if (!profile.isAdmin && profile.role !== 'admin' && profile.role !== 'super') {
          await db.auth.signOut();
          return { ok: false, error: 'This account is not a hotel administrator.' };
        }
        if (profile.role === 'staff') {
          await db.auth.signOut();
          return { ok: false, error: 'Staff accounts use the Staff tab.' };
        }
      }
      if (roleHint === 'staff') {
        if (profile.role === 'guest') {
          await db.auth.signOut();
          return { ok: false, error: 'No staff profile found for this user in Supabase.' };
        }
      }
      if (roleHint === 'guest') {
        // Guests may also be staff — still OK to use guest areas
      }

      cachedSession = profile;
      return { ok: true, session: profile, redirect: redirectFor(profile) };
    } catch (e) {
      console.error(e);
      return { ok: false, error: e.message || 'Sign-in failed. Check connection.' };
    }
  }

  /**
   * Guest register via Supabase Auth (optional for portal)
   */
  async function register(email, password, fullName) {
    email = String(email || '').trim().toLowerCase();
    password = String(password || '');
    if (!email || password.length < 6) {
      return { ok: false, error: 'Email and password (6+ characters) required.' };
    }
    try {
      var db = getClient();
      var result = await db.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: fullName || email.split('@')[0] } }
      });
      if (result.error) return { ok: false, error: result.error.message };
      if (result.data && result.data.session && result.data.user) {
        cachedSession = await loadProfile(result.data.user);
        return { ok: true, session: cachedSession, message: 'Account created and signed in.' };
      }
      return {
        ok: true,
        session: null,
        message: 'Check your email to confirm the account (if confirmations are enabled), then sign in.'
      };
    } catch (e) {
      return { ok: false, error: e.message || 'Registration failed.' };
    }
  }

  async function logout() {
    try {
      var db = getClient();
      await db.auth.signOut();
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
    if (!s || list.indexOf(s.role) === -1) {
      // also allow isAdmin for admin pages
      if (s && s.isAdmin && (list.indexOf('admin') !== -1 || list.indexOf('super') !== -1)) {
        return s;
      }
      if (opts.redirect !== false) {
        location.href = absolutePath('shared/login.html') + (opts.role ? '?role=' + opts.role : '');
      }
      return null;
    }
    return s;
  }

  // Staff directory for AI — from Supabase when possible
  async function fetchPublicStaff(hotelId) {
    try {
      var db = getClient();
      var q = db.from('staff_profiles').select('id, full_name, name, role, department, phone, is_active, hotel_id').eq('is_active', true);
      var res = await q.limit(50);
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

  function findStaffSync() { return []; }

  global.NordicAuth = {
    getClient: getClient,
    login: login,
    register: register,
    logout: logout,
    getSession: getSession,
    requireRole: requireRole,
    redirectFor: redirectFor,
    fetchPublicStaff: fetchPublicStaff,
    findStaff: function (query, hotelId) {
      // sync stub — AI should use async path; keep empty until loaded
      return [];
    },
    listPublicStaff: function () { return global.__NORDIC_STAFF_CACHE || []; },
    loadStaffCache: async function (hotelId) {
      global.__NORDIC_STAFF_CACHE = await fetchPublicStaff(hotelId);
      return global.__NORDIC_STAFF_CACHE;
    }
  };
})(window);
