/**
 * The Nordic Group — Intelligent Floating AI Concierge
 * Context-aware per hotel. Conversational. Knows rooms, staff (public), events,
 * services, policies, directions, promos, and can show public photos.
 * Extremely rich knowledge base + multi-turn conversation memory.
 */
(function (global) {
  'use strict';

  const HOTEL = global.NORDIC_HOTEL || { id: 'unknown', name: 'Hotel', location: 'Abuja' };

  /* ========== KNOWLEDGE BASE (per hotel) ========== */
  const KB = {
    joyous: {
      name: 'Joyous Hotel',
      location: 'Nyanya, Abuja',
      fullAddress: 'Nyanya, Abuja Municipal Area Council, FCT',
      phone: '+234 XXX XXX XXXX',
      whatsapp: '+234 XXX XXX XXXX',
      email: 'hello@joyoushotel.ng',
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      description: 'Joyous Hotel is a warm, welcoming mid-range hotel in the heart of Nyanya. We focus on clean rooms, friendly service and making every guest feel at home.',
      rooms: [
        { name: 'Standard', price: 'From ₦15,000', guests: 2, amenities: ['AC', 'Wi-Fi', 'TV', 'En-suite'] },
        { name: 'Deluxe', price: 'From ₦22,000', guests: 2, amenities: ['AC', 'Wi-Fi', 'TV', 'En-suite', 'Work desk'] },
        { name: 'Suite', price: 'From ₦35,000', guests: 3, amenities: ['AC', 'Wi-Fi', 'TV', 'Living area', 'Mini fridge'] }
      ],
      facilities: ['Restaurant', 'Lounge', 'Secure parking', '24-hour front desk', 'Laundry', 'Power backup'],
      services: ['Room service', 'Airport transfer (on request)', 'Laundry', 'Meeting space', 'Event hosting'],
      policies: {
        cancellation: 'Free cancellation up to 24 hours before check-in. Later cancellations may attract one-night charge.',
        children: 'Children of all ages are welcome. Extra bed available on request.',
        pets: 'Pets are not allowed.',
        smoking: 'Non-smoking rooms. Designated outdoor smoking areas only.',
        id: 'Valid government-issued photo ID required at check-in (NIN, Driver’s Licence, Passport or Voter’s Card).'
      },
      staffPublic: [
        { name: 'Adaeze Okonkwo', role: 'Front Desk Manager', contact: 'Reception · ask for Adaeze', department: 'Front Office' },
        { name: 'Ibrahim Yusuf', role: 'Restaurant Supervisor', contact: 'Restaurant floor', department: 'F&B' },
        { name: 'Ngozi Eze', role: 'Housekeeping Lead', contact: 'Via front desk', department: 'Housekeeping' }
      ],
      directions: 'Joyous Hotel is located in Nyanya. From the city centre, take the Nyanya expressway. Landmarks include Nyanya Market and nearby hospitals. Share your location with reception for precise directions or use ride-hailing (Bolt/Uber).',
      nearby: ['Nyanya Market', 'Nyanya General Hospital', 'Local eateries and shops'],
      events: [], // filled dynamically
      promos: []
    },
    'dj-annex': {
      name: 'DJ Annex Hotel',
      location: 'Abacha Road, Abuja / Mararaba axis',
      fullAddress: 'Abacha Road, Mararaba area, FCT / Nasarawa border',
      phone: '+234 XXX XXX XXXX',
      whatsapp: '+234 XXX XXX XXXX',
      email: 'stay@djannex.ng',
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      description: 'DJ Annex Hotel is a modern, business-friendly property on the Abacha Road corridor. Clean contemporary rooms, reliable power and convenient access for travellers and professionals.',
      rooms: [
        { name: 'Classic', price: 'From ₦18,000', guests: 2, amenities: ['AC', 'Wi-Fi', 'Smart TV', 'En-suite'] },
        { name: 'Executive', price: 'From ₦28,000', guests: 2, amenities: ['AC', 'Wi-Fi', 'Smart TV', 'Work desk', 'Mini fridge'] },
        { name: 'Premium', price: 'From ₦40,000', guests: 3, amenities: ['AC', 'Wi-Fi', 'Lounge area', 'Enhanced amenities'] }
      ],
      facilities: ['Restaurant', 'Bar', 'Secure parking', '24-hour front desk', 'Business corner', 'Power backup'],
      services: ['Room service', 'Laundry', 'Airport pickup (on request)', 'Meeting room', 'Event space'],
      policies: {
        cancellation: 'Free cancellation up to 24 hours before arrival. Late cancellation may incur charges.',
        children: 'Children welcome. Extra bedding on request.',
        pets: 'No pets allowed.',
        smoking: 'Non-smoking property. Outdoor areas only.',
        id: 'Valid photo ID required at check-in.'
      },
      staffPublic: [
        { name: 'Duty Manager', role: 'Front Desk', contact: 'Reception 24/7' },
        { name: 'Operations Lead', role: 'Operations', contact: 'Via front desk' }
      ],
      directions: 'Located on Abacha Road (Mararaba side). Easy access from Abuja–Keffi expressway. Share your live location with our front desk for the fastest route.',
      nearby: ['Abacha Road commercial area', 'Mararaba markets', 'Transport links to Abuja city'],
      events: [],
      promos: []
    },
    jimmyland: {
      name: 'Jimmyland Hotel',
      location: 'Abacha Road, Mararaba',
      fullAddress: 'Abacha Road, Mararaba, Nasarawa State (Abuja outskirts)',
      phone: '+234 XXX XXX XXXX',
      whatsapp: '+234 XXX XXX XXXX',
      email: 'info@jimmyland.ng',
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      description: 'Jimmyland Hotel (also known as Jemiland / Jimmy Land) is a lively, well-known hotel on Abacha Road in Mararaba. Popular for comfortable stays, restaurant service and events.',
      rooms: [
        { name: 'Standard', price: 'From ₦16,000', guests: 2, amenities: ['AC', 'Wi-Fi', 'TV', 'En-suite'] },
        { name: 'Deluxe', price: 'From ₦25,000', guests: 2, amenities: ['AC', 'Wi-Fi', 'TV', 'En-suite', 'Sitting area'] },
        { name: 'Family', price: 'From ₦38,000', guests: 4, amenities: ['AC', 'Wi-Fi', 'TV', 'Spacious layout'] }
      ],
      facilities: ['Restaurant', 'Bar / Lounge', 'Secure parking', '24-hour front desk', 'Event hall', 'Power backup'],
      services: ['Room service', 'Laundry', 'Event hosting', 'Catering', 'Airport transfer (on request)'],
      policies: {
        cancellation: 'Free cancellation up to 24 hours before check-in where applicable.',
        children: 'Family-friendly. Extra beds available.',
        pets: 'Pets not permitted.',
        smoking: 'Non-smoking rooms available. Please observe designated areas.',
        id: 'Valid government photo ID required at check-in.'
      },
      staffPublic: [
        { name: 'Reception Team', role: 'Front Desk', contact: '24/7 at reception' },
        { name: 'Events Coordinator', role: 'Events', contact: 'Ask at front desk' }
      ],
      directions: 'Jimmyland Hotel is on Abacha Road, Mararaba. From Abuja, take the route toward Mararaba / Keffi. The hotel is a known landmark on Abacha Road. Call or WhatsApp reception for live directions.',
      nearby: ['Abacha Road', 'Mararaba town', 'Local restaurants and shops'],
      events: [],
      promos: []
    }
  };

  const knowledge = KB[HOTEL.id] || KB.joyous;

  /* ========== CONVERSATION MEMORY ========== */
  const memory = {
    turns: [],
    lastTopic: null,
    guestName: null
  };

  /* ========== INTENT + REPLY ENGINE ========== */
  function normalize(text) {
    return (text || '').toLowerCase().trim()
      .replace(/[’']/g, "'")
      .replace(/[^\w\s'₦]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function matchAny(text, words) {
    return words.some(w => text.includes(w));
  }

  function buildReply(userText) {
    const t = normalize(userText);
    memory.turns.push({ role: 'user', text: userText });

    // Greetings
    if (matchAny(t, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how far', 'how are you'])) {
      memory.lastTopic = 'greeting';
      return greet();
    }

    // Rooms & prices
    if (matchAny(t, ['room', 'rooms', 'suite', 'standard', 'deluxe', 'price', 'how much', 'cost', 'rate', 'booking', 'book', 'availability', 'available'])) {
      memory.lastTopic = 'rooms';
      return roomsReply(t);
    }

    // Check-in / out
    if (matchAny(t, ['check in', 'check-in', 'checkin', 'check out', 'check-out', 'checkout', 'arrival', 'departure'])) {
      memory.lastTopic = 'times';
      return `At ${knowledge.name}, check-in starts from <strong>${knowledge.checkIn}</strong> and check-out is by <strong>${knowledge.checkOut}</strong>. Early check-in or late check-out may be possible depending on availability — just ask the front desk or book through our site.`;
    }

    // Location / directions
    if (matchAny(t, ['where', 'location', 'address', 'direction', 'how to get', 'map', 'find you', 'near'])) {
      memory.lastTopic = 'location';
      return locationReply();
    }

    // Facilities & amenities
    if (matchAny(t, ['facility', 'facilities', 'amenity', 'amenities', 'wifi', 'wi-fi', 'parking', 'restaurant', 'food', 'bar', 'gym', 'pool', 'power', 'light', 'generator'])) {
      memory.lastTopic = 'facilities';
      return facilitiesReply(t);
    }

    // Services
    if (matchAny(t, ['service', 'services', 'laundry', 'transfer', 'airport', 'room service', 'meeting', 'event space'])) {
      memory.lastTopic = 'services';
      return servicesReply();
    }

    // Events
    if (matchAny(t, ['event', 'events', 'programme', 'show', 'party', 'wedding', 'conference', 'ticket'])) {
      memory.lastTopic = 'events';
      return eventsReply();
    }

    // Staff (public only)
    if (matchAny(t, ['staff', 'manager', 'who is', "who's", 'receptionist', 'contact person', 'front desk', 'list staff', 'adaeze', 'ibrahim', 'ngozi', 'team', 'housekeep'])) {
      memory.lastTopic = 'staff';
      return staffReply(t);
    }

    // Policies
    if (matchAny(t, ['cancel', 'cancellation', 'policy', 'policies', 'pet', 'pets', 'child', 'children', 'smoke', 'smoking', 'id', 'document'])) {
      memory.lastTopic = 'policies';
      return policiesReply(t);
    }

    // Contact
    if (matchAny(t, ['phone', 'call', 'whatsapp', 'email', 'contact', 'reach'])) {
      memory.lastTopic = 'contact';
      return contactReply();
    }

    // Promos
    if (matchAny(t, ['promo', 'promotion', 'discount', 'offer', 'deal', 'special'])) {
      memory.lastTopic = 'promos';
      return promosReply();
    }

    // Report / complaint
    if (matchAny(t, ['report', 'complaint', 'complain', 'issue', 'problem', 'damage', 'bad service'])) {
      memory.lastTopic = 'report';
      return `I'm sorry you're having an issue. You can submit a formal report from the <strong>Report an Issue</strong> page — it goes straight to the hotel admin team (and is also visible to Central Command). Would you like me to guide you there, or tell me more so I can help right away?`;
    }

    // Payment
    if (matchAny(t, ['pay', 'payment', 'paystack', 'card', 'transfer', 'receipt'])) {
      memory.lastTopic = 'payment';
      return `Payments are processed securely via <strong>Paystack</strong> (cards, bank transfer, USSD and more). After you complete a booking you’ll see a “Pay now” option on the confirmation page. Receipts appear in your portal and can be downloaded. Need help with a specific payment?`;
    }

    // AI identity
    if (matchAny(t, ['who are you', 'what are you', 'your name', 'are you ai', 'bot'])) {
      return `I'm the official AI concierge for <strong>${knowledge.name}</strong>. I know our rooms, prices, facilities, events, public staff contacts, policies and how to get here. I can keep chatting, guide you to book, or point you to the right page. What would you like to know?`;
    }

    // Thanks
    if (matchAny(t, ['thank', 'thanks', 'appreciate', 'well done', 'nice one'])) {
      return `You're very welcome! Anything else I can help with at ${knowledge.name}?`;
    }

    // Fallback with context
    return fallback(t);
  }

  function greet() {
    const hour = new Date().getHours();
    let time = 'Hello';
    if (hour < 12) time = 'Good morning';
    else if (hour < 17) time = 'Good afternoon';
    else time = 'Good evening';
    return `${time}! Welcome to <strong>${knowledge.name}</strong> in ${knowledge.location}. I'm your AI concierge — I can help with rooms, prices, booking, events, directions, facilities and more. What would you like to know?`;
  }

  function roomsReply(t) {
    let html = `<strong>Rooms at ${knowledge.name}:</strong><ul style="margin:8px 0 0 18px">`;
    knowledge.rooms.forEach(r => {
      html += `<li><strong>${r.name}</strong> — ${r.price}/night · up to ${r.guests} guests · ${r.amenities.join(', ')}</li>`;
    });
    html += `</ul><p style="margin-top:10px">You can check live availability and book on the <a href="booking.html" style="color:inherit;text-decoration:underline">Book a Stay</a> page. Want me to highlight a particular room type?</p>`;
    return html;
  }

  function locationReply() {
    return `<strong>Location:</strong> ${knowledge.fullAddress}.<br><br>${knowledge.directions}<br><br><strong>Nearby:</strong> ${knowledge.nearby.join(', ')}.<br><br>Would you like the phone/WhatsApp so reception can guide you live?`;
  }

  function facilitiesReply(t) {
    return `Our facilities include: <strong>${knowledge.facilities.join(', ')}</strong>. We also offer reliable power backup so your stay stays comfortable. Anything specific you’re looking for (Wi-Fi, parking, restaurant)?`;
  }

  function servicesReply() {
    return `Services available: <strong>${knowledge.services.join(', ')}</strong>. Some are on request — just ask at reception or book through the Services page.`;
  }

  function eventsReply() {
    if (!knowledge.events || knowledge.events.length === 0) {
      return `There are currently <strong>no published events</strong> at ${knowledge.name}. When new programmes or shows are scheduled they’ll appear on the homepage and Events page. You can also ask the front desk about private event hosting.`;
    }
    let html = `Upcoming events at ${knowledge.name}:<ul style="margin:8px 0 0 18px">`;
    knowledge.events.forEach(e => {
      html += `<li><strong>${e.title}</strong> — ${e.date}${e.price ? ' · ' + e.price : ''}</li>`;
    });
    html += `</ul>`;
    return html;
  }

  function staffReply(t) {
    // Prefer NordicAuth directory
    if (window.NordicAuth && NordicAuth.findStaff) {
      var hits = NordicAuth.findStaff(t, (window.NORDIC_HOTEL || {}).id);
      if (!hits.length) hits = NordicAuth.findStaff(t, null);
      if (hits.length) {
        return hits.map(function (s) {
          var ph = s.photo ? '<img src="' + s.photo + '" style="max-width:180px;border-radius:10px;display:block;margin:6px 0" onerror="this.style.display=\'none\'" />' : '';
          return ph + '<strong>' + s.name + '</strong><br>' + s.role + ' · ' + s.department + '<br>Shift: ' + s.shift + '<br>Contact: ' + s.contact + (s.bio ? '<br><em>' + s.bio + '</em>' : '');
        }).join('<br><br>');
      }
      if (/list staff|all staff|who works|team/.test(t)) {
        var all = NordicAuth.listPublicStaff((window.NORDIC_HOTEL || {}).id) || [];
        if (all.length) return 'Public team:<br><br>' + all.map(function (s) {
          return '<strong>' + s.name + '</strong> — ' + s.role + ' · ' + s.contact;
        }).join('<br>');
      }
    }

    let html = `Public contacts at ${knowledge.name}:<ul style="margin:8px 0 0 18px">`;
    knowledge.staffPublic.forEach(s => {
      html += `<li><strong>${s.role}</strong>${s.name ? ' — ' + s.name : ''} · ${s.contact}</li>`;
    });
    html += `</ul><p style="margin-top:8px;font-size:13px;opacity:0.85">For privacy, detailed personal staff records are only visible to authorised administrators. Guests can always reach the right person through reception.</p>`;
    return html;
  }

  function policiesReply(t) {
    const p = knowledge.policies;
    if (matchAny(t, ['cancel'])) return p.cancellation;
    if (matchAny(t, ['pet'])) return p.pets;
    if (matchAny(t, ['child'])) return p.children;
    if (matchAny(t, ['smoke'])) return p.smoking;
    if (matchAny(t, ['id', 'document'])) return p.id;
    return `<strong>Key policies:</strong><br>• Cancellation: ${p.cancellation}<br>• Children: ${p.children}<br>• Pets: ${p.pets}<br>• Smoking: ${p.smoking}<br>• ID: ${p.id}`;
  }

  function contactReply() {
    return `You can reach ${knowledge.name}:<br>• Phone: ${knowledge.phone}<br>• WhatsApp: ${knowledge.whatsapp}<br>• Email: ${knowledge.email}<br><br>Or use the Contact page for a quick message. Front desk is available 24/7.`;
  }

  function promosReply() {
    if (!knowledge.promos || knowledge.promos.length === 0) {
      return `There are no active public promotions at the moment. The best available rates are always shown on the booking page. Follow us or check the homepage for future offers.`;
    }
    return knowledge.promos.map(p => `• <strong>${p.title}</strong>: ${p.detail}`).join('<br>');
  }

  function fallback(t) {
    const suggestions = [
      'rooms and prices',
      'how to get here',
      'check-in time',
      'current events',
      'facilities',
      'how to book'
    ];
    return `I’m not 100% sure I caught that, but I’m here to help with anything about <strong>${knowledge.name}</strong>. Try asking about ${suggestions.slice(0, 3).join(', ')}, or rephrase and I’ll do my best. You can also say “menu” for quick options.`;
  }

  /* ========== UI: Floating widget ========== */
  function createUI() {
    const root = document.getElementById('aiRoot');
    if (!root) return;

    root.innerHTML = `
      <button type="button" class="ai-fab" id="aiFab" aria-label="Open AI Concierge">
        <span class="ai-fab-icon">✦</span>
        <span class="ai-fab-pulse"></span>
      </button>
      <div class="ai-panel" id="aiPanel" hidden>
        <div class="ai-head">
          <div class="ai-avatar">✦</div>
          <div class="ai-head-text">
            <strong>${knowledge.name} Concierge</strong>
            <small>Always here to help</small>
          </div>
          <button type="button" class="ai-close" id="aiClose">×</button>
        </div>
        <div class="ai-messages" id="aiMessages"></div>
        <div class="ai-quick" id="aiQuick">
          <button type="button" data-q="What rooms do you have?">Rooms</button>
          <button type="button" data-q="Where are you located?">Location</button>
          <button type="button" data-q="Any events happening?">Events</button>
          <button type="button" data-q="How do I book?">Book</button>
        </div>
        <form class="ai-input-row" id="aiForm">
          <label class="ai-upload" title="Upload photo">📷<input type="file" id="aiPhoto" accept="image/*" hidden /></label>
          <input type="text" id="aiInput" placeholder="Ask or name a staff…" autocomplete="off" />
          <button type="submit" aria-label="Send">➤</button>
        </form>
      </div>
    `;

    injectStyles();

    const fab = document.getElementById('aiFab');
    const panel = document.getElementById('aiPanel');
    const close = document.getElementById('aiClose');
    const form = document.getElementById('aiForm');
    const input = document.getElementById('aiInput');
    const messages = document.getElementById('aiMessages');

    function open() {
      panel.hidden = false;
      panel.removeAttribute('hidden');
      panel.style.display = 'flex';
      fab.classList.add('open');
      if (messages.children.length === 0) {
        addBot(greet());
      }
      setTimeout(function () { input.focus(); }, 200);
    }
    function closePanel(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      panel.hidden = true;
      panel.setAttribute('hidden', '');
      panel.style.display = 'none';
      fab.classList.remove('open');
    }

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.hidden || panel.style.display === 'none') {
        open();
      } else {
        closePanel(e);
      }
    });
    close.addEventListener('click', closePanel);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addUser(text);
      input.value = '';
      // Simulate thinking
      const thinking = addBot('…', true);
      setTimeout(() => {
        thinking.remove();
        addBot(buildReply(text));
      }, 450 + Math.random() * 400);
    });

    
    var photoInput = document.getElementById('aiPhoto');
    if (photoInput) {
      photoInput.addEventListener('change', function () {
        var file = photoInput.files && photoInput.files[0];
        photoInput.value = '';
        if (!file || !file.type || file.type.indexOf('image/') !== 0) {
          addBot('Please upload an image file.');
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          var el = document.createElement('div');
          el.className = 'ai-msg user';
          el.innerHTML = '<img src="' + reader.result + '" style="max-width:100%;border-radius:10px" />';
          messages.appendChild(el);
          messages.scrollTop = messages.scrollHeight;
          var thinking = addBot('Looking at your photo…', true);
          setTimeout(function () {
            thinking.remove();
            var staff = (window.NordicAuth && NordicAuth.listPublicStaff)
              ? NordicAuth.listPublicStaff((window.NORDIC_HOTEL || {}).id)
              : [];
            var withPhoto = staff.filter(function (s) { return s.photo; });
            var html;
            if (withPhoto.length) {
              html = 'Photo received. Public staff with photos on file — say a name if one matches:<br><br>' +
                withPhoto.map(function (s) {
                  return '<strong>' + s.name + '</strong> — ' + s.role + ' · ' + s.contact;
                }).join('<br>');
            } else {
              html = 'Photo received. Type a <strong>staff name</strong> or say <strong>list staff</strong>.';
            }
            addBot(html);
          }, 600);
        };
        reader.readAsDataURL(file);
      });
    }

    document.getElementById('aiQuick').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-q]');
      if (!btn) return;
      input.value = btn.dataset.q;
      form.dispatchEvent(new Event('submit'));
    });

    function addUser(text) {
      const el = document.createElement('div');
      el.className = 'ai-msg user';
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }
    function addBot(html, isThinking) {
      const el = document.createElement('div');
      el.className = 'ai-msg bot' + (isThinking ? ' thinking' : '');
      el.innerHTML = html;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      return el;
    }
  }

  function injectStyles() {
    if (document.getElementById('aiEngineStyles')) return;
    const s = document.createElement('style');
    s.id = 'aiEngineStyles';
    s.textContent = `
      #aiRoot {
        position: relative;
        z-index: 99999;
      }
      .ai-fab {
        position: fixed !important;
        right: 16px !important;
        bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
        left: auto !important;
        top: auto !important;
        width: 60px !important;
        height: 60px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #d4a574, #c4894a) !important;
        color: #1a120b !important;
        border: none !important;
        cursor: pointer !important;
        box-shadow: 0 8px 28px rgba(196,137,74,0.55) !important;
        display: grid !important;
        place-items: center !important;
        z-index: 99999 !important;
        transition: transform 0.25s;
        margin: 0 !important;
        padding: 0 !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
      .ai-fab:active { transform: scale(0.94); }
      .ai-fab-icon { font-size: 24px; font-weight: 700; line-height: 1; }
      .ai-fab-pulse {
        position: absolute; inset: -4px; border-radius: 50%;
        border: 2px solid rgba(212,165,116,0.5);
        animation: aiPulse 2s ease-out infinite;
        pointer-events: none;
      }
      @keyframes aiPulse {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.35); opacity: 0; }
      }
      .ai-panel {
        position: fixed !important;
        right: 12px !important;
        bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important;
        left: auto !important;
        top: auto !important;
        width: min(360px, calc(100vw - 24px));
        height: min(520px, 70vh);
        background: #1e1610;
        border: 1px solid rgba(212,165,116,0.25);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 50px rgba(0,0,0,0.45);
        z-index: 99999 !important;
        overflow: hidden;
        animation: aiSlide 0.3s ease;
        margin: 0 !important;
      }
      .ai-panel[hidden] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      @keyframes aiSlide {
        from { opacity: 0; transform: translateY(16px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .ai-head {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 14px 12px; border-bottom: 1px solid rgba(212,165,116,0.15);
        background: #241a12;
      }
      .ai-avatar {
        width: 36px; height: 36px; border-radius: 10px;
        background: linear-gradient(135deg, #d4a574, #c4894a);
        color: #1a120b; display: grid; place-items: center; font-weight: 700;
      }
      .ai-head-text { flex: 1; line-height: 1.2; }
      .ai-head-text strong { display: block; font-size: 14px; }
      .ai-head-text small { font-size: 11px; color: #b9a890; }
      .ai-close {
        width: 40px; height: 40px; border-radius: 10px; border: none;
        background: #2c2118; color: #f7f0e6; font-size: 22px; cursor: pointer;
        flex-shrink: 0; line-height: 1; z-index: 2;
      }
      .ai-close:active { background: #3d2e22; }
      .ai-messages {
        flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
      }
      .ai-msg {
        max-width: 88%; padding: 10px 13px; border-radius: 14px;
        font-size: 13.5px; line-height: 1.45;
      }
      .ai-msg.user {
        align-self: flex-end; background: #d4a574; color: #1a120b;
        border-bottom-right-radius: 4px;
      }
      .ai-msg.bot {
        align-self: flex-start; background: #2c2118; color: #f7f0e6;
        border-bottom-left-radius: 4px; border: 1px solid rgba(212,165,116,0.12);
      }
      .ai-msg.thinking { opacity: 0.6; }
      .ai-quick {
        display: flex; gap: 6px; padding: 0 12px 8px; overflow-x: auto;
      }
      .ai-quick button {
        flex-shrink: 0; padding: 6px 12px; border-radius: 999px;
        border: 1px solid rgba(212,165,116,0.3); background: transparent;
        color: #e8c9a0; font-size: 12px; cursor: pointer;
      }
      .ai-input-row {
        display: flex; gap: 8px; padding: 10px 12px 12px;
        border-top: 1px solid rgba(212,165,116,0.12);
      }
      .ai-input-row input {
        flex: 1; padding: 11px 14px; border-radius: 12px;
        border: 1px solid rgba(212,165,116,0.2); background: #2c2118;
        color: #f7f0e6; outline: none; font-size: 14px;
      }
      .ai-upload{flex-shrink:0;width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:#2c2118;border:1px solid rgba(212,165,116,.2);cursor:pointer;font-size:18px}
      .ai-input-row button {
        width: 44px; border-radius: 12px; border: none;
        background: #d4a574; color: #1a120b; font-size: 16px; cursor: pointer;
      }
    `;
    document.head.appendChild(s);
  }

  /* ========== BOOT ========== */
  function bootAI() {
    if (!document.getElementById('aiRoot')) {
      var root = document.createElement('div');
      root.id = 'aiRoot';
      document.body.appendChild(root);
    }
    createUI();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAI);
  } else {
    bootAI();
  }
  // Retry once if first pass missed
  setTimeout(function () {
    if (!document.getElementById('aiFab')) bootAI();
  }, 800);

  // Expose for hotel pages to push live events/promos
  global.NordicAI = {
    setEvents(list) { knowledge.events = list || []; },
    setPromos(list) { knowledge.promos = list || []; },
    knowledge
  };
})(window);
