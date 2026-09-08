# The Nordic Abuja — Complete PMS Pack (Improved)

This pack turns the original PMS skeleton into a usable Property Management System.

## What improved

- Proper modal forms instead of browser `prompt()`
- Create / edit for bookings, rooms, room types, guests, housekeeping, maintenance, payments, rates, extras
- Check-in / check-out workflow that updates room status and optionally creates housekeeping tasks
- Filters, search, status badges, toasts, loading states
- 14-day calendar rack
- Dashboard with real (or fallback) stats
- CSV export
- Complete Supabase schema + RPCs
- Edge function foundations for email + payment webhooks

## Files

```
pms.html
pms.css
pms.js
supabase/
  01_pms_schema.sql
  02_pms_functions.sql
  functions/
    send-booking-email/index.ts
    booking-payment-webhook/index.ts
docs/
  FEATURE_MATRIX.md
README.md
```

## Install / setup

### 1. Deploy frontend
Copy `pms.html`, `pms.css`, `pms.js` into your GitHub Pages repo (alongside the marketing site).  
Do **not** delete existing marketing files or images.

### 2. Database
In Supabase → SQL Editor:

1. Run `supabase/01_pms_schema.sql`
2. Run `supabase/02_pms_functions.sql`

### 3. Create an admin user
1. Supabase → Authentication → Users → Add user (email + password).
2. Copy the user’s UUID.
3. Run:

```sql
INSERT INTO public.staff_profiles (id, full_name, role, is_active)
VALUES ('PASTE-USER-UUID-HERE', 'Hotel Manager', 'admin', true);
```

> During first setup the `is_admin_user()` function also allows any authenticated user.  
> After you populate `staff_profiles`, you can tighten the function (see comments in the SQL).

### 4. Open the PMS
Visit `…/pms.html` and sign in with the admin account.

### 5. Seed basic data (optional)
Add room types and rooms from the **Rooms** screen, or via SQL.

## Important notes

- The Supabase **publishable** key is used in the browser (normal). Security relies on **RLS** + the admin check.
- Before real guest data goes live: tighten RLS policies and remove the “any authenticated user is admin” fallback.
- Payment and email edge functions are foundations — configure provider API keys before production use.
- This pack does **not** invent hotel prices, room inventory, tax rules, or live payment credentials.

## Support / next work

See `docs/FEATURE_MATRIX.md` for the full checklist and recommended next steps (channel manager, public booking engine, night audit, etc.).
