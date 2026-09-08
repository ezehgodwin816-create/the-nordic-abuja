# The Nordic Abuja — PMS Feature Matrix

## Implemented (this pack)

| Module | Features | Status |
|--------|----------|--------|
| **Auth** | Email/password login, admin gate via `is_admin_user` | Done |
| **Dashboard** | Live stats (rooms, bookings, revenue, maintenance) | Done |
| **Front Desk** | List bookings, filter, check-in / check-out, create booking, view detail | Done |
| **Calendar** | 14-day room rack with booking badges | Done |
| **Rooms** | List, status change, add/edit room, add room type | Done |
| **Guests & CRM** | List, search, add/edit, VIP flag | Done |
| **Housekeeping** | Create tasks, status workflow (open → in progress → done) | Done |
| **Maintenance** | Tickets with priority, cost, status workflow | Done |
| **Folios** | View folio totals / paid / balance | Done (basic) |
| **Payments** | Ledger + manual record payment | Done |
| **Rates** | Rate rules list + create | Done |
| **Extras** | Catalogue list + create + activate/deactivate | Done |
| **Reports** | KPI cards + CSV export of bookings | Done |
| **Staff** | View staff profiles | Done (read) |
| **Audit** | View recent audit log entries | Done (read) |

## Backend

| Item | Status |
|------|--------|
| Full SQL schema (rooms, types, bookings, guests, HK, maintenance, folios, payments, rates, extras, staff, audit) | Done |
| `is_admin_user()` RPC | Done |
| `pms_dashboard_stats()` RPC | Done |
| `create_folio_for_booking()` RPC | Done |
| `log_audit()` helper | Done |
| Edge function: send-booking-email (stub + Resend example) | Foundation |
| Edge function: booking-payment-webhook (Paystack/Flutterwave ready) | Foundation |
| RLS policies (authenticated full access + public read on rooms) | Basic — tighten before go-live |

## Recommended next steps (roadmap)

1. **Tighten RLS** — replace open authenticated policies with role-based checks using `staff_profiles.role`.
2. **Populate staff_profiles** for every admin user after Auth signup.
3. **Channel manager / OTA sync** (optional) if the hotel uses Booking.com / Expedia.
4. **Real payment provider** — wire Paystack or Flutterwave and point webhook to the edge function.
5. **Email confirmations** — call `send-booking-email` on booking create / check-in.
6. **Public booking engine** on the marketing site that writes into the same `bookings` table.
7. **Housekeeping mobile view** (simpler UI for room attendants).
8. **Night audit / end-of-day report**.
9. **Inventory of minibar / extras charged to folio**.
10. **Custom domain + production hosting** (not GitHub Pages for the PMS if it holds real guest data).

## Data the hotel must supply

- Real room numbers and types
- Base rates and seasonal rules
- Tax / service charge rules (not yet modelled)
- Payment provider keys
- Email sender domain / API key
- Staff accounts
