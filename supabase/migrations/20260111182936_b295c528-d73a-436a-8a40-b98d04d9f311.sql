-- Fix 1: Pharmacy Inventory - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view pharmacy inventory" ON public.pharmacy_inventory;

-- Only authenticated users can view inventory
CREATE POLICY "Authenticated users can view pharmacy inventory"
ON public.pharmacy_inventory
FOR SELECT
TO authenticated
USING (true);

-- Create a public view showing only availability (not quantities/prices)
CREATE OR REPLACE VIEW public.pharmacy_inventory_public 
WITH (security_invoker = true)
AS
SELECT 
  pi.id,
  pi.pharmacy_id,
  pi.medication_name,
  CASE WHEN pi.quantity > 0 THEN true ELSE false END as in_stock,
  p.name as pharmacy_name,
  p.wilaya
FROM public.pharmacy_inventory pi
JOIN public.pharmacies p ON pi.pharmacy_id = p.id;

GRANT SELECT ON public.pharmacy_inventory_public TO anon, authenticated;

-- Fix 2: Doctors table - ensure sensitive data is protected
DROP POLICY IF EXISTS "Public can view basic doctor info" ON public.doctors;

-- Only authenticated users can view full doctor profiles
CREATE POLICY "Authenticated users can view verified doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (is_verified = true OR user_id = auth.uid());

-- Doctors can always see their own profile
CREATE POLICY "Doctors can view own profile"
ON public.doctors
FOR SELECT
USING (user_id = auth.uid());

-- Update the public doctors view to show minimal info
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public 
WITH (security_invoker = true)
AS
SELECT 
  d.id,
  d.specialty_id,
  d.rating,
  d.total_reviews,
  d.is_available,
  d.telemedicine_enabled,
  d.wilaya,
  d.clinic_name,
  s.name_ar as specialty_name_ar,
  s.name_fr as specialty_name_fr,
  p.full_name
  -- Excluded: license_number, clinic_address, consultation_price, bio, experience_years
FROM public.doctors d
LEFT JOIN public.specialties s ON d.specialty_id = s.id
LEFT JOIN public.profiles p ON d.user_id = p.id
WHERE d.is_verified = true;

GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- Fix 3: Pharmacies - already fixed but ensure the policy is correct
DROP POLICY IF EXISTS "Authenticated users can view pharmacies" ON public.pharmacies;

-- Only authenticated users can view full pharmacy details
CREATE POLICY "Authenticated users can view full pharmacy info"
ON public.pharmacies
FOR SELECT
TO authenticated
USING (true);

-- Update pharmacies_public view to show only wilaya-level location
DROP VIEW IF EXISTS public.pharmacies_public;

CREATE VIEW public.pharmacies_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  wilaya,
  is_on_duty,
  duty_date
  -- Excluded: address, phone, exact coordinates
FROM public.pharmacies;

GRANT SELECT ON public.pharmacies_public TO anon, authenticated;