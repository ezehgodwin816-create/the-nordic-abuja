/**
 * Nordic Group — Unified Auth (Guest · Staff · Hotel Admin · Central Command)
 * Demo accounts work offline via localStorage. Wrong password fails.
 * Email/SMS reset UI exists but is not connected yet.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'nordic_session_v2';

  /** Demo accounts — change passwords later when real backend is connected */
  var ACCOUNTS = [
    // Central Command (Super Admin)
    { email: 'super@nordic.ng', password: 'super123', role: 'super', name: 'Central Command', hotelId: null },
    { email: 'command@nordic.ng', password: 'command123', role: 'super', name: 'Platform Admin', hotelId: null },

    // Joyous
    { email: 'admin.joyous@nordic.ng', password: 'admin123', role: 'admin', name: 'Joyous Manager', hotelId: 'joyous' },
    { email: 'staff.joyous@nordic.ng', password: 'staff123', role: 'staff', name: 'Adaeze Okonkwo', hotelId: 'joyous', staffId: 'joy-s1' },

    // DJ Annex
    { email: 'admin.annex@nordic.ng', password: 'admin123', role: 'admin', name: 'DJ Annex Manager', hotelId: 'dj-annex' },
    { email: 'staff.annex@nordic.ng', password: 'staff123', role: 'staff', name: 'Chinedu Bassey', hotelId: 'dj-annex', staffId: 'anx-s1' },

    // Jimmyland
    { email: 'admin.jimmy@nordic.ng', password: 'admin123', role: 'admin', name: 'Jimmyland Manager', hotelId: 'jimmyland' },
    { email: 'staff.jimmy@nordic.ng', password: 'staff123', role: 'staff', name: 'Blessing Musa', hotelId: 'jimmyland', staffId: 'jim-s1' }
  ];

  function normalizeEmail(v) {
    return String(v || '').trim().toLowerCase();
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function setSession(s) {
    if (!s) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    try {
      // keep legacy guest key in sync for older pages
      if (s && s.role === 'guest') {
        localStorage.setItem('nordic_guest_session', JSON.stringify({ name: s.name, id: s.email }));
      } else {
        localStorage.removeItem('nordic_guest_session');
      }
    } catch (e) {}
  }

  /**
   * Login
   * @param {string} email
   * @param {string} password
   * @param {string} [roleHint] guest|staff|admin|super — optional filter
   * @returns {{ ok: boolean, session?: object, error?: string, redirect?: string }}
   */
  function login(email, password, roleHint) {
    var e = normalizeEmail(email);
    var p = String(password || '');

    if (!e || !p) {
      return { ok: false, error: 'Enter email and password.' };
    }
    if (p.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters.' };
    }

    // Official staff / admin / super accounts
    var match = ACCOUNTS.find(function (a) {
      return a.email === e && a.password === p;
    });

    if (match) {
      if (roleHint && roleHint !== 'guest' && match.role !== roleHint) {
        return {
          ok: false,
          error: 'This account is not a ' + roleHint + ' account. Choose the correct role tab.'
        };
      }
      var session = {
        email: match.email,
        name: match.name,
        role: match.role,
        hotelId: match.hotelId,
        staffId: match.staffId || null,
        loggedInAt: Date.now()
      };
      setSession(session);
      return { ok: true, session: session, redirect: redirectFor(session) };
    }

    // Guest path: any other email + password 4+ creates / loads guest (wrong role tab still ok)
    if (roleHint && roleHint !== 'guest') {
      return { ok: false, error: 'Invalid staff/admin credentials. Check email, password and role.' };
    }

    // Reject known emails with wrong password
    var known = ACCOUNTS.find(function (a) { return a.email === e; });
    if (known) {
      return { ok: false, error: 'Wrong password.' };
    }

    var guest = {
      email: e,
      name: e.indexOf('@') > 0 ? e.split('@')[0] : e,
      role: 'guest',
      hotelId: null,
      loggedInAt: Date.now()
    };
    setSession(guest);
    return { ok: true, session: guest, redirect: null };
  }

  function logout() {
    setSession(null);
  }

  function redirectFor(session) {
    if (!session) return null;
    if (session.role === 'super') return absolutePath('super-admin/index.html');
    if (session.role === 'admin' && session.hotelId) {
      return absolutePath('admin/hotel-admin.html?hotel=' + encodeURIComponent(session.hotelId));
    }
    if (session.role === 'staff' && session.hotelId) {
      return absolutePath(session.hotelId + '/portal.html?role=staff');
    }
    return null;
  }

  function absolutePath(rel) {
    // Resolve relative to site root (works on GitHub Pages project sites)
    var base = '/';
    try {
      var parts = location.pathname.split('/');
      // e.g. /the-nordic-abuja/joyous/ → /the-nordic-abuja/
      if (parts.length >= 2 && parts[1]) {
        // detect project pages: first segment is repo name
        var repo = parts[1];
        if (location.hostname.indexOf('github.io') !== -1) {
          base = '/' + repo + '/';
        }
      }
    } catch (e) {}
    return base + rel.replace(/^\//, '');
  }

  function requireRole(roles, opts) {
    opts = opts || {};
    var s = getSession();
    var list = Array.isArray(roles) ? roles : [roles];
    if (!s || list.indexOf(s.role) === -1) {
      if (opts.redirect !== false) {
        var loginUrl = absolutePath('shared/login.html');
        if (opts.role) loginUrl += '?role=' + encodeURIComponent(opts.role);
        location.href = loginUrl;
      }
      return null;
    }
    if (opts.hotelId && s.role === 'admin' && s.hotelId !== opts.hotelId) {
      if (opts.redirect !== false) location.href = absolutePath('shared/login.html?role=admin');
      return null;
    }
    return s;
  }

  /** Public staff directory used by AI + admin demos */
  var STAFF_DIRECTORY = [
    {
      id: 'joy-s1',
      hotelId: 'joyous',
      hotelName: 'Joyous Hotel',
      name: 'Adaeze Okonkwo',
      role: 'Front Desk Manager',
      department: 'Front Office',
      shift: 'Morning · 7am–3pm',
      contact: 'Reception desk · ask for Adaeze',
      public: true,
      photo: 'images/joyous-lobby.jpg',
      bio: 'Leads the reception team. Speaks English and Igbo.'
    },
    {
      id: 'joy-s2',
      hotelId: 'joyous',
      hotelName: 'Joyous Hotel',
      name: 'Ibrahim Yusuf',
      role: 'Restaurant Supervisor',
      department: 'F&B',
      shift: 'Afternoon · 2pm–10pm',
      contact: 'Restaurant floor',
      public: true,
      photo: 'images/joyous-restaurant.jpg',
      bio: 'Oversees dining service and room-service orders.'
    },
    {
      id: 'joy-s3',
      hotelId: 'joyous',
      hotelName: 'Joyous Hotel',
      name: 'Ngozi Eze',
      role: 'Housekeeping Lead',
      department: 'Housekeeping',
      shift: 'Morning · 6am–2pm',
      contact: 'Via front desk',
      public: true,
      photo: 'images/joyous-room-standard.jpg',
      bio: 'Coordinates room cleaning and linen.'
    },
    {
      id: 'anx-s1',
      hotelId: 'dj-annex',
      hotelName: 'DJ Annex Hotel',
      name: 'Chinedu Bassey',
      role: 'Duty Manager',
      department: 'Operations',
      shift: 'Rotating',
      contact: 'Reception 24/7',
      public: true,
      photo: null,
      bio: 'On-duty manager for guest issues and check-in.'
    },
    {
      id: 'jim-s1',
      hotelId: 'jimmyland',
      hotelName: 'Jimmyland Hotel',
      name: 'Blessing Musa',
      role: 'Reception Lead',
      department: 'Front Office',
      shift: 'Evening · 2pm–10pm',
      contact: 'Reception',
      public: true,
      photo: null,
      bio: 'Welcomes guests and handles bookings at the desk.'
    }
  ];

  function findStaff(query, hotelId) {
    var q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    return STAFF_DIRECTORY.filter(function (s) {
      if (hotelId && s.hotelId !== hotelId) return false;
      if (!s.public) return false;
      var blob = (s.name + ' ' + s.role + ' ' + s.department + ' ' + (s.bio || '')).toLowerCase();
      return q.split(/\s+/).every(function (word) {
        return word.length < 2 || blob.indexOf(word) !== -1;
      });
    });
  }

  function getStaffById(id) {
    return STAFF_DIRECTORY.find(function (s) { return s.id === id; }) || null;
  }

  function listPublicStaff(hotelId) {
    return STAFF_DIRECTORY.filter(function (s) {
      return s.public && (!hotelId || s.hotelId === hotelId);
    });
  }

  global.NordicAuth = {
    login: login,
    logout: logout,
    getSession: getSession,
    requireRole: requireRole,
    redirectFor: redirectFor,
    accounts: ACCOUNTS.map(function (a) {
      return { email: a.email, role: a.role, hotelId: a.hotelId, name: a.name };
    }),
    findStaff: findStaff,
    getStaffById: getStaffById,
    listPublicStaff: listPublicStaff,
    STAFF_DIRECTORY: STAFF_DIRECTORY
  };
})(window);
