-- THE NORDIC ABUJA — ADMIN MODULE SECURITY
-- Run this in Supabase SQL Editor after the existing admin_users/is_admin_user setup.
-- It does not insert fake rooms, reviews, requests, settings or bookings.

grant usage on schema public to authenticated;
grant select, update on table public.bookings to authenticated;
grant select, insert, update, delete on table public.rooms to authenticated;
grant select, insert, update, delete on table public.room_types to authenticated;
grant select, insert, update, delete on table public.hotel_requests to authenticated;
grant select, insert, update, delete on table public.reviews to authenticated;
grant select, insert, update, delete on table public.site_settings to authenticated;

-- Admin-only RLS for management tables.
drop policy if exists "Admins can manage rooms" on public.rooms;
create policy "Admins can manage rooms" on public.rooms for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins can manage room types" on public.room_types;
create policy "Admins can manage room types" on public.room_types for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins can manage hotel requests" on public.hotel_requests;
create policy "Admins can manage hotel requests" on public.hotel_requests for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews" on public.reviews for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

-- Keep reservation access explicit.
drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Admins can view all bookings" on public.bookings for select to authenticated using (public.is_admin_user());

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings" on public.bookings for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

-- Verify the privileges.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and grantee='authenticated'
  and table_name in ('bookings','rooms','room_types','hotel_requests','reviews','site_settings')
order by table_name, privilege_type;
