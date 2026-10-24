/**
 * Multi-hotel booking — same Supabase create_hotel_booking RPC as original Nordic
 */
(function (global) {
  'use strict';

  function getConfig() {
    return global.NORDIC_CONFIG || {
      supabaseUrl: 'https://rzjvhfnizwckzbdawrbn.supabase.co',
      supabaseAnonKey: 'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob',
      hotels: {}
    };
  }

  function getHotel(hotelId) {
    var c = getConfig();
    return (c.hotels && c.hotels[hotelId]) || null;
  }

  function nightsBetween(checkIn, checkOut) {
    var a = new Date(checkIn);
    var b = new Date(checkOut);
    var n = Math.round((b - a) / 86400000);
    return n > 0 ? n : 0;
  }

  function money(n) {
    return '\u20a6' + Number(n || 0).toLocaleString('en-NG');
  }

  async function getClient() {
    var c = getConfig();
    if (global.NordicAuth && NordicAuth.getClient) {
      try { return NordicAuth.getClient(); } catch (e) {}
    }
    if (!global.supabase || !c.supabaseUrl || !c.supabaseAnonKey) return null;
    return global.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
  }

  /**
   * payload: { hotel_id, room_type, check_in, check_out, first_name, last_name, email, phone, guests, special_requests }
   */
  async function createBooking(payload) {
    var hotel = getHotel(payload.hotel_id);
    if (!hotel) throw new Error('Unknown hotel');

    var nights = nightsBetween(payload.check_in, payload.check_out);
    if (nights < 1) throw new Error('Check-out must be after check-in');

    var room = hotel.rooms.find(function (r) { return r.id === payload.room_type; }) || hotel.rooms[0];
    var total = (room.price || 0) * nights;

    var db = await getClient();
    if (!db) throw new Error('Supabase is not available. Check config.js and network.');

    // Match original Nordic booking.html RPC argument names
    var rpcPayload = {
      p_room_type_id: payload.room_type_id || room.supabase_id || room.id,
      p_check_in: payload.check_in,
      p_check_out: payload.check_out,
      p_guest_first_name: payload.first_name,
      p_guest_last_name: payload.last_name,
      p_guest_email: payload.email,
      p_guest_phone: payload.phone,
      p_adults: payload.guests || 1,
      p_children: payload.children || 0,
      p_special_requests: payload.special_requests || null
    };

    var result = await db.rpc('create_hotel_booking', rpcPayload);
    if (result.error) {
      console.error('create_hotel_booking', result.error);
      throw new Error(result.error.message || 'Booking failed in Supabase');
    }

    var booking = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!booking) throw new Error('The booking system did not return a reservation.');

    var confirmation = Object.assign({}, booking, {
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      room_type: room.id,
      room_name: room.name,
      rate_per_night: room.price,
      nights: nights,
      total_amount: booking.total_amount || booking.amount || total,
      guest_first_name: payload.first_name,
      guest_last_name: payload.last_name,
      guest_email: payload.email,
      guest_phone: payload.phone,
      check_in: payload.check_in,
      check_out: payload.check_out,
      guests: payload.guests || 1,
      booking_reference: booking.booking_reference || booking.reference || booking.id
    });

    try {
      sessionStorage.setItem('nordic_booking_confirmation', JSON.stringify(confirmation));
    } catch (e) {}

    return confirmation;
  }

  global.NordicBooking = {
    getHotel: getHotel,
    getConfig: getConfig,
    nightsBetween: nightsBetween,
    money: money,
    createBooking: createBooking,
    getClient: getClient
  };
})(window);
