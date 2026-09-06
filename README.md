# The Nordic Abuja — Website Upgrade

This package is a frontend-first upgrade for the existing GitHub Pages site. It adds a real booking-flow interface, FAQ, privacy and terms pages, better mobile behavior, faster loading behavior, gallery/lightbox, concierge panel and forms prepared for a Supabase backend.

## Upload
Upload the contents of this folder to the root of `ezehgodwin816-create/the-nordic-abuja`. Keep the `images`, `css`, and `js` folders.

## Important
The booking flow is intentionally frontend-only for now. Do not advertise it as live availability or live payment until Supabase and a payment gateway are connected.

## Next backend phase
Recommended Supabase tables: `rooms`, `room_rates`, `room_inventory`, `bookings`, `guests`, `booking_guests`, `offers`, `restaurant_reservations`, `event_enquiries`, `contact_messages`, `airport_transfers`, `admin_users`.
