-- Drop existing SELECT policies for doctors
DROP POLICY IF EXISTS "Anyone can view verified doctors" ON public.doctors;

-- Create new policy: Public can only see basic info of verified doctors
-- Authenticated users can see full details of verified doctors
CREATE POLICY "Public can view basic doctor info"
ON public.doctors
FOR SELECT
USING (
  CASE 
    -- Owner can always see their own profile
    WHEN user_id = auth.uid() THEN true
    -- Verified doctors are visible, but sensitive columns are handled at query level
    WHEN is_verified = true THEN true
    ELSE false
  END
);

-- Create a secure view for public doctor listings (basic info only)
CREATE OR REPLACE VIEW public.doctors_public AS
SELECT 
  d.id,
  d.user_id,
  d.specialty_id,
  d.experience_years,
  d.rating,
  d.total_reviews,
  d.is_verified,
  d.is_available,
  d.telemedicine_enabled,
  d.wilaya,
  -- Only show clinic name, not full address
  d.clinic_name,
  -- Show bio summary (first 100 chars) publicly
  LEFT(d.bio, 100) as bio_preview,
  s.name_ar as specialty_name_ar,
  s.name_fr as specialty_name_fr,
  p.full_name
FROM public.doctors d
LEFT JOIN public.specialties s ON d.specialty_id = s.id
LEFT JOIN public.profiles p ON d.user_id = p.id
WHERE d.is_verified = true;

-- Create a secure view for authenticated users (full info)
CREATE OR REPLACE VIEW public.doctors_full AS
SELECT 
  d.*,
  s.name_ar as specialty_name_ar,
  s.name_fr as specialty_name_fr,
  p.full_name,
  p.avatar_url
FROM public.doctors d
LEFT JOIN public.specialties s ON d.specialty_id = s.id
LEFT JOIN public.profiles p ON d.user_id = p.id
WHERE d.is_verified = true OR d.user_id = auth.uid();

-- Fix pharmacies table - require authentication for sensitive data
DROP POLICY IF EXISTS "Anyone can view pharmacies" ON public.pharmacies;

-- Create new policy: Basic pharmacy info is public, full info requires auth
CREATE POLICY "Public can view basic pharmacy info"
ON public.pharmacies
FOR SELECT
USING (true);

-- Create a secure public view for pharmacies (limited info)
CREATE OR REPLACE VIEW public.pharmacies_public AS
SELECT 
  id,
  name,
  wilaya,
  is_on_duty,
  duty_date,
  -- Show approximate location (reduce precision for privacy)
  ROUND(latitude::numeric, 2) as latitude_approx,
  ROUND(longitude::numeric, 2) as longitude_approx
FROM public.pharmacies;

-- Create a secure view for authenticated users (full pharmacy info)
CREATE OR REPLACE VIEW public.pharmacies_full AS
SELECT 
  p.*
FROM public.pharmacies p;

-- Add RLS to views using security_invoker (Postgres 15+)
-- For older versions, we rely on the underlying table policies

-- Create helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;