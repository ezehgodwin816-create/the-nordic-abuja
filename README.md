# Step 5 — Live booking, payments, domain, RLS (no emails)

## What this pack does

| Item | Status |
|------|--------|
| Connect public booking → Supabase | SQL RPCs + RLS for `booking.html` |
| Payments (Paystack) | Client helper + webhook foundation (no emails) |
| Custom domain | Setup guide (`CUSTOM_DOMAIN.md`) |
| Tighten RLS | Admin-only management tables; public only via RPCs |
| Confirmation emails | **Skipped** (as requested) |

## Already on your site

Your live `booking.html` already calls:

- `get_available_room_count`
- `create_hotel_booking`

with the correct Supabase URL/key. Those functions often **do not exist yet** in the database — that is why booking can fail.

## Install order

### 1. Run SQL in Supabase

Open **SQL Editor** and run:

`03_public_booking_and_rls.sql`

This creates:

- `get_available_room_count(...)`
- `create_hotel_booking(...)`
- Safer RLS (admins manage data; guests book only through the RPC)

### 2. Seed rooms (required for availability)

In the **PMS** (after login):

1. Add **room types** with prices  
2. Add **physical rooms** linked to those types  

Without rooms, availability will always be 0.

### 3. Test public booking

1. Open `booking.html` on the site  
2. Pick dates + room type + guest details  
3. Submit  
4. You should get a booking reference and land on `booking-success.html`  
5. Confirm the row appears in PMS → Front Desk  

### 4. Paystack (optional until you have keys)

1. Create Paystack account → copy **public key** (`pk_test_...`)  
2. Upload `js/paystack-booking.js` to the repo `js/` folder  
3. On `booking-success.html`, before `</body>`, add:

```html
<script src="https://js.paystack.co/v1/inline.js"></script>
<script>
  window.NORDIC_PAYSTACK_PUBLIC_KEY = 'pk_test_YOUR_KEY_HERE';
</script>
<script src="js/paystack-booking.js"></script>
<button type="button" class="button button-dark" onclick="NordicPay.startFromSession()">
  Pay now
</button>
<div id="paymentStatus"></div>
```

4. For production, deploy the Edge Function `booking-payment-webhook` and set Paystack webhook URL to it.

### 5. Custom domain

Follow `CUSTOM_DOMAIN.md`.

## Security notes

- Publishable/anon key in the browser is normal  
- Guests must **not** get direct INSERT on `bookings` — only the RPC  
- Never put the **service role** key in frontend files  
- After go-live, keep only real staff in `staff_profiles`

## Files in this folder

```
03_public_booking_and_rls.sql
js/paystack-booking.js
CUSTOM_DOMAIN.md
README.md
```
