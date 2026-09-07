# The Nordic Abuja — Complete PMS Add-on Pack

This pack is additive: it does not replace the working website/admin.html and does not touch images/.

## Includes
- pms.html / pms.css / pms.js — operations console
- supabase/01_pms_schema.sql — guests, housekeeping, maintenance, folios, folio items, payments, rates, extras, staff, audit logs
- supabase/02_pms_functions.sql — dashboard stats, folio creation, audit helper, room workflow helpers
- supabase/functions/send-booking-email/index.ts — email provider edge-function foundation
- supabase/functions/booking-payment-webhook/index.ts — payment webhook foundation
- docs/FEATURE_MATRIX.md — comprehensive feature checklist and roadmap

## Install
1. Upload the files/folders to the GitHub repository without deleting existing files.
2. Run 01_pms_schema.sql, then 02_pms_functions.sql in Supabase SQL Editor.
3. Open pms.html after deployment.
4. Configure real hotel prices, taxes, payment provider and email provider only when the hotel supplies them.

The pack intentionally does not invent payment credentials, hotel prices, taxes, real room inventory or contact information.
