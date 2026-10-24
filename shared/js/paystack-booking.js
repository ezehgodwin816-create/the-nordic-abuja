/**
 * The Nordic Abuja — Paystack payment helper (no emails)
 *
 * How to use:
 * 1. Create a Paystack account → get PUBLIC key (pk_test_... or pk_live_...)
 * 2. In booking-success.html (or after reservation is created), include:
 *      <script src="https://js.paystack.co/v1/inline.js"></script>
 *      <script src="js/paystack-booking.js"></script>
 * 3. Set window.NORDIC_PAYSTACK_PUBLIC_KEY = 'pk_...'
 * 4. Call NordicPay.startFromSession() or NordicPay.start({...})
 *
 * Webhook: point Paystack to your Supabase Edge Function
 *   booking-payment-webhook  (already in the PMS pack)
 * and set PAYMENT_WEBHOOK_SECRET / service role in function secrets.
 */
(function (global) {
  'use strict';

  const SUPABASE_URL = 'https://rzjvhfnizwckzbdawrbn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob';

  function moneyToKobo(naira) {
    return Math.round(Number(naira || 0) * 100);
  }

  function loadConfirmation() {
    try {
      return JSON.parse(sessionStorage.getItem('nordic_booking_confirmation') || 'null');
    } catch (_) {
      return null;
    }
  }

  function getPublicKey() {
    return global.NORDIC_PAYSTACK_PUBLIC_KEY || '';
  }

  /**
   * @param {object} opts
   * @param {string} opts.email
   * @param {number} opts.amountNaira
   * @param {string} opts.reference  booking_reference
   * @param {string} [opts.bookingId]
   * @param {function} [opts.onSuccess]
   * @param {function} [opts.onClose]
   */
  function start(opts) {
    const key = getPublicKey();
    if (!key) {
      alert('Payment is not configured yet. Add your Paystack public key.');
      return;
    }
    if (typeof global.PaystackPop === 'undefined') {
      alert('Paystack script not loaded. Add https://js.paystack.co/v1/inline.js');
      return;
    }

    const handler = global.PaystackPop.setup({
      key: key,
      email: opts.email,
      amount: moneyToKobo(opts.amountNaira),
      currency: 'NGN',
      ref: opts.reference + '-' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: 'Booking', variable_name: 'booking_reference', value: opts.reference }
        ],
        booking_id: opts.bookingId || null,
        booking_reference: opts.reference
      },
      callback: function (response) {
        // Client-side success — webhook should still confirm server-side
        markPaidLocally(opts, response);
        if (typeof opts.onSuccess === 'function') opts.onSuccess(response);
      },
      onClose: function () {
        if (typeof opts.onClose === 'function') opts.onClose();
      }
    });

    handler.openIframe();
  }

  function startFromSession() {
    const c = loadConfirmation();
    if (!c) {
      alert('No booking found in this session. Complete a reservation first.');
      return;
    }
    start({
      email: c.guest_email,
      amountNaira: c.total_amount,
      reference: c.booking_reference,
      bookingId: c.id,
      onSuccess: function (res) {
        const el = document.getElementById('paymentStatus');
        if (el) {
          el.textContent = 'Payment successful. Ref: ' + (res.reference || '');
        }
      }
    });
  }

  async function markPaidLocally(opts, paystackResponse) {
    // Best-effort client update; production should rely on webhook + service role
    try {
      if (!global.supabase) return;
      const db = global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      // This will only work if RLS allows it — prefer webhook for production
      await db.from('payments').insert({
        booking_id: opts.bookingId || null,
        amount: opts.amountNaira,
        method: 'online',
        status: 'paid',
        provider_reference: paystackResponse.reference || null
      });
    } catch (e) {
      console.warn('Local payment record skipped (use webhook):', e);
    }
  }

  global.NordicPay = { start, startFromSession, loadConfirmation };
})(window);
