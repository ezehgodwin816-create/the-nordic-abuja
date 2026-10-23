/**
 * Nordic Group — Floating AI Concierge (full fixed version)
 */
(function (global) {
  'use strict';

  var HOTEL = global.NORDIC_HOTEL || { id: 'joyous', name: 'Hotel', location: 'Abuja' };

  var KB = {
    joyous: {
      name: 'Joyous Hotel',
      location: 'Nyanya, Abuja',
      rooms: 'Standard from ₦15,000 · Deluxe from ₦22,000 · Suite from ₦35,000',
      directions: 'Located in Nyanya, Abuja. Use Bolt/Uber or ask reception for the gate landmark.',
      checkIn: '2:00 PM',
      checkOut: '12:00 PM'
    },
    'dj-annex': {
      name: 'DJ Annex Hotel',
      location: 'Abacha Road',
      rooms: 'Classic from ₦18,000 · Executive from ₦28,000 · Premium from ₦40,000',
      directions: 'On Abacha Road (Mararaba side). Easy access from Abuja–Keffi expressway.',
      checkIn: '2:00 PM',
      checkOut: '12:00 PM'
    },
    jimmyland: {
      name: 'Jimmyland Hotel',
      location: 'Abacha Road, Mararaba',
      rooms: 'Standard from ₦16,000 · Deluxe from ₦25,000 · Family from ₦38,000',
      directions: 'On Abacha Road in Mararaba. Ask reception for the exact gate.',
      checkIn: '2:00 PM',
      checkOut: '12:00 PM'
    }
  };

  var knowledge = KB[HOTEL.id] || KB.joyous;

  function reply(text) {
    var q = (text || '').toLowerCase();
    if (/hello|hi|hey|good morning|good evening/.test(q)) {
      return 'Hello! Welcome to <strong>' + knowledge.name + '</strong> in ' + knowledge.location + '. How can I help?';
    }
    if (/room|price|rate|how much/.test(q)) {
      return '<strong>Rooms:</strong> ' + knowledge.rooms + '<br><br>You can book on the Book page.';
    }
    if (/where|location|direction|address|map/.test(q)) {
      return knowledge.directions;
    }
    if (/check.?in|check.?out|time/.test(q)) {
      return 'Check-in: <strong>' + knowledge.checkIn + '</strong><br>Check-out: <strong>' + knowledge.checkOut + '</strong>';
    }
    if (/book|reserv/.test(q)) {
      return 'Open the <strong>Book</strong> page, choose dates and room, then confirm. You can pay with Paystack after.';
    }
    if (/event/.test(q)) {
      return 'There are no published events right now. Check the Events page later or ask reception.';
    }
    if (/thank/.test(q)) {
      return 'You\'re welcome! Anything else about ' + knowledge.name + '?';
    }
    return 'I can help with <strong>rooms, prices, location, check-in times, booking and events</strong> at ' + knowledge.name + '. What do you need?';
  }

  function createUI() {
    var root = document.getElementById('aiRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'aiRoot';
      document.body.appendChild(root);
    }
    if (document.getElementById('aiFab')) return;

    root.innerHTML =
      '<button type="button" class="ai-fab" id="aiFab" aria-label="Open AI">✦</button>' +
      '<div class="ai-panel" id="aiPanel" hidden>' +
      '  <div class="ai-head">' +
      '    <strong id="aiTitle">' + knowledge.name + ' AI</strong>' +
      '    <button type="button" class="ai-close" id="aiClose">×</button>' +
      '  </div>' +
      '  <div class="ai-messages" id="aiMessages"></div>' +
      '  <div class="ai-quick">' +
      '    <button type="button" data-q="What rooms do you have?">Rooms</button>' +
      '    <button type="button" data-q="Where are you located?">Location</button>' +
      '    <button type="button" data-q="How do I book?">Book</button>' +
      '  </div>' +
      '  <form class="ai-form" id="aiForm">' +
      '    <input type="text" id="aiInput" placeholder="Ask me anything…" autocomplete="off" />' +
      '    <button type="submit">➤</button>' +
      '  </form>' +
      '</div>';

    injectStyles();

    var fab = document.getElementById('aiFab');
    var panel = document.getElementById('aiPanel');
    var closeBtn = document.getElementById('aiClose');
    var form = document.getElementById('aiForm');
    var input = document.getElementById('aiInput');
    var messages = document.getElementById('aiMessages');

    function openPanel() {
      panel.hidden = false;
      panel.style.display = 'flex';
      if (!messages.children.length) {
        addBot('Hello! I\'m the AI for <strong>' + knowledge.name + '</strong>. Ask about rooms, location or booking.');
      }
      setTimeout(function () { input.focus(); }, 150);
    }

    function closePanel(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      panel.hidden = true;
      panel.style.display = 'none';
    }

    fab.onclick = function (e) {
      e.stopPropagation();
      if (panel.hidden || panel.style.display === 'none') openPanel();
      else closePanel(e);
    };
    closeBtn.onclick = closePanel;

    form.onsubmit = function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addUser(text);
      input.value = '';
      var thinking = addBot('…');
      setTimeout(function () {
        thinking.remove();
        addBot(reply(text));
      }, 400);
    };

    document.querySelector('.ai-quick').onclick = function (e) {
      var btn = e.target.closest('[data-q]');
      if (!btn) return;
      input.value = btn.getAttribute('data-q');
      form.requestSubmit ? form.requestSubmit() : form.onsubmit(new Event('submit'));
    };

    function addUser(text) {
      var el = document.createElement('div');
      el.className = 'ai-msg user';
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    function addBot(html) {
      var el = document.createElement('div');
      el.className = 'ai-msg bot';
      el.innerHTML = html;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      return el;
    }
  }

  function injectStyles() {
    if (document.getElementById('aiEngineStyles')) return;
    var s = document.createElement('style');
    s.id = 'aiEngineStyles';
    s.textContent =
      '#aiRoot{z-index:99999;position:relative}' +
      '.ai-fab{position:fixed!important;right:16px!important;bottom:calc(20px + env(safe-area-inset-bottom,0px))!important;' +
      'width:60px!important;height:60px!important;border-radius:50%!important;border:none!important;' +
      'background:linear-gradient(135deg,#d4a574,#c4894a)!important;color:#1a120b!important;' +
      'font-size:24px!important;font-weight:700!important;cursor:pointer!important;' +
      'box-shadow:0 8px 28px rgba(196,137,74,.55)!important;z-index:99999!important;' +
      'display:grid!important;place-items:center!important;opacity:1!important;visibility:visible!important}' +
      '.ai-panel{position:fixed!important;right:12px!important;bottom:calc(88px + env(safe-area-inset-bottom,0px))!important;' +
      'width:min(360px,calc(100vw - 24px));height:min(480px,68vh);background:#1e1610;border:1px solid rgba(212,165,116,.25);' +
      'border-radius:20px;display:flex;flex-direction:column;z-index:99999!important;overflow:hidden;' +
      'box-shadow:0 20px 50px rgba(0,0,0,.45)}' +
      '.ai-panel[hidden]{display:none!important}' +
      '.ai-head{display:flex;align-items:center;justify-content:space-between;padding:14px;background:#241a12;' +
      'border-bottom:1px solid rgba(212,165,116,.15);color:#f7f0e6;font-size:14px}' +
      '.ai-close{width:40px;height:40px;border:none;border-radius:10px;background:#2c2118;color:#f7f0e6;' +
      'font-size:22px;cursor:pointer;line-height:1}' +
      '.ai-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}' +
      '.ai-msg{max-width:88%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.45}' +
      '.ai-msg.user{align-self:flex-end;background:#d4a574;color:#1a120b}' +
      '.ai-msg.bot{align-self:flex-start;background:#2c2118;color:#f7f0e6;border:1px solid rgba(212,165,116,.12)}' +
      '.ai-quick{display:flex;gap:6px;padding:0 12px 8px;overflow-x:auto}' +
      '.ai-quick button{flex-shrink:0;padding:6px 12px;border-radius:999px;border:1px solid rgba(212,165,116,.3);' +
      'background:transparent;color:#e8c9a0;font-size:12px;cursor:pointer}' +
      '.ai-form{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(212,165,116,.12)}' +
      '.ai-form input{flex:1;padding:11px 14px;border-radius:12px;border:1px solid rgba(212,165,116,.2);' +
      'background:#2c2118;color:#f7f0e6;outline:none;font-size:14px}' +
      '.ai-form button{width:44px;border:none;border-radius:12px;background:#d4a574;color:#1a120b;font-size:16px;cursor:pointer}';
    document.head.appendChild(s);
  }

  function boot() {
    createUI();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(function () {
    if (!document.getElementById('aiFab')) boot();
  }, 600);
})(window);
