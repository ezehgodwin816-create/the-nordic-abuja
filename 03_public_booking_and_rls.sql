-- =============================================================================
-- The Nordic Abuja — Public booking RPCs + tightened RLS
-- Run in Supabase SQL Editor AFTER testing live booking.
-- Does NOT set up emails.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ensure columns used by the public booking form exist
-- (safe if already present)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS adults int DEFAULT 2,
  ADD COLUMN IF NOT EXISTS children int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS room_type_id uuid REFERENCES public.room_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_per_night numeric(12,2);

ALTER TABLE public.room_types
  ADD COLUMN IF NOT EXISTS price_per_night numeric(12,2),
  ADD COLUMN IF NOT EXISTS slug text;

-- Prefer price_per_night; fall back to base_rate if you use that column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='room_types' AND column_name='base_rate'
  ) THEN
    UPDATE public.room_types
    SET price_per_night = COALESCE(price_per_night, base_rate)
    WHERE price_per_night IS NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Availability: count free rooms of a type for a date range
-- A room is free if it has no overlapping non-cancelled booking
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_room_count(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_rooms int;
  busy_rooms int;
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
    RETURN 0;
  END IF;

  SELECT count(*) INTO total_rooms
  FROM rooms
  WHERE room_type_id = p_room_type_id
    AND status IS DISTINCT FROM 'maintenance';

  SELECT count(DISTINCT r.id) INTO busy_rooms
  FROM rooms r
  JOIN bookings b ON b.room_id = r.id
  WHERE r.room_type_id = p_room_type_id
    AND b.status IN ('pending', 'confirmed')
    AND b.check_in < p_check_out
    AND b.check_out > p_check_in;

  RETURN GREATEST(COALESCE(total_rooms, 0) - COALESCE(busy_rooms, 0), 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_room_count(uuid, date, date) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Create booking: pick one free room, insert booking, return confirmation row
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_hotel_booking(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_first_name text,
  p_guest_last_name text,
  p_guest_email text,
  p_guest_phone text,
  p_adults int DEFAULT 2,
  p_children int DEFAULT 0,
  p_special_requests text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room record;
  v_type record;
  v_nights int;
  v_price numeric(12,2);
  v_total numeric(12,2);
  v_ref text;
  v_booking_id uuid;
  v_row public.bookings%ROWTYPE;
BEGIN
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'Invalid stay dates';
  END IF;

  IF coalesce(trim(p_guest_first_name), '') = '' OR coalesce(trim(p_guest_last_name), '') = '' THEN
    RAISE EXCEPTION 'Guest name is required';
  END IF;

  IF coalesce(trim(p_guest_email), '') = '' THEN
    RAISE EXCEPTION 'Guest email is required';
  END IF;

  SELECT * INTO v_type FROM room_types WHERE id = p_room_type_id AND coalesce(is_active, true) = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room type not found or inactive';
  END IF;

  v_nights := (p_check_out - p_check_in);
  v_price := coalesce(v_type.price_per_night, v_type.base_rate, 0);
  v_total := v_price * v_nights;

  -- Pick one available physical room
  SELECT r.* INTO v_room
  FROM rooms r
  WHERE r.room_type_id = p_room_type_id
    AND r.status IS DISTINCT FROM 'maintenance'
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.room_id = r.id
        AND b.status IN ('pending', 'confirmed')
        AND b.check_in < p_check_out
        AND b.check_out > p_check_in
    )
  ORDER BY r.room_number
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No rooms available for the selected dates';
  END IF;

  v_ref := 'NA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO bookings (
    booking_reference,
    guest_first_name,
    guest_last_name,
    guest_email,
    guest_phone,
    room_id,
    room_type_id,
    check_in,
    check_out,
    nights,
    room_price,
    price_per_night,
    total_amount,
    status,
    payment_status,
    adults,
    children,
    special_requests,
    notes
  ) VALUES (
    v_ref,
    trim(p_guest_first_name),
    trim(p_guest_last_name),
    trim(p_guest_email),
    nullif(trim(p_guest_phone), ''),
    v_room.id,
    p_room_type_id,
    p_check_in,
    p_check_out,
    v_nights,
    v_price,
    v_price,
    v_total,
    'pending',
    'unpaid',
    coalesce(p_adults, 2),
    coalesce(p_children, 0),
    nullif(trim(p_special_requests), ''),
    nullif(trim(p_special_requests), '')
  )
  RETURNING * INTO v_row;

  -- Optional: mark room occupied only when confirmed/checked-in (keep available while pending)
  -- UPDATE rooms SET status = 'occupied' WHERE id = v_room.id;

  RETURN json_build_object(
    'id', v_row.id,
    'booking_reference', v_row.booking_reference,
    'room_id', v_row.room_id,
    'room_number', v_room.room_number,
    'room_type_id', p_room_type_id,
    'room_type_name', v_type.name,
    'check_in', v_row.check_in,
    'check_out', v_row.check_out,
    'nights', v_row.nights,
    'price_per_night', v_price,
    'total_amount', v_row.total_amount,
    'status', v_row.status,
    'payment_status', v_row.payment_status,
    'guest_first_name', v_row.guest_first_name,
    'guest_last_name', v_row.guest_last_name,
    'guest_email', v_row.guest_email,
    'guest_phone', v_row.guest_phone
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_hotel_booking(uuid, date, date, text, text, text, text, int, int, text)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public read: active room types (for booking dropdown)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_room_types" ON public.room_types;
CREATE POLICY "public_read_room_types"
  ON public.room_types
  FOR SELECT
  TO anon, authenticated
  USING (coalesce(is_active, true) = true);

DROP POLICY IF EXISTS "public_read_rooms" ON public.rooms;
CREATE POLICY "public_read_rooms"
  ON public.rooms
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Bookings: public cannot SELECT all rows; only create via SECURITY DEFINER RPC
-- Admins manage via is_admin_user()
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_all_bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "anon_insert_bookings" ON public.bookings;

CREATE POLICY "Admins can manage bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- Tighten other management tables (admins only)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guest_profiles','housekeeping_tasks','maintenance_tasks',
    'folios','folio_items','payments','rate_rules',
    'booking_extras_catalog','staff_profiles','audit_logs'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name=t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "Admins manage %s" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "Admins manage %s" ON public.%I FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- Rooms / room_types: admin write
DROP POLICY IF EXISTS "Admins can manage rooms" ON public.rooms;
CREATE POLICY "Admins can manage rooms"
  ON public.rooms FOR ALL TO authenticated
  USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage room types" ON public.room_types;
CREATE POLICY "Admins can manage room types"
  ON public.room_types FOR ALL TO authenticated
  USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Keep is_admin_user aligned with your real roles
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE id = auth.uid()
      AND coalesce(is_active, true) = true
      AND role IN (
        'super_admin','manager','reception','finance',
        'admin','staff','front_desk'
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated;

COMMENT ON FUNCTION public.create_hotel_booking IS 'Public booking entry point used by booking.html';
COMMENT ON FUNCTION public.get_available_room_count IS 'Public availability check used by booking.html';
