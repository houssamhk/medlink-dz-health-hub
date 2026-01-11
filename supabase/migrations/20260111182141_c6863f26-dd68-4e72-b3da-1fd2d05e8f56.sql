-- Drop the security definer views and recreate with security_invoker
DROP VIEW IF EXISTS public.doctors_public;
DROP VIEW IF EXISTS public.doctors_full;
DROP VIEW IF EXISTS public.pharmacies_public;
DROP VIEW IF EXISTS public.pharmacies_full;

-- Recreate doctors_public view with security_invoker
CREATE VIEW public.doctors_public 
WITH (security_invoker = true)
AS
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
  d.clinic_name,
  LEFT(d.bio, 100) as bio_preview,
  s.name_ar as specialty_name_ar,
  s.name_fr as specialty_name_fr,
  p.full_name
FROM public.doctors d
LEFT JOIN public.specialties s ON d.specialty_id = s.id
LEFT JOIN public.profiles p ON d.user_id = p.id
WHERE d.is_verified = true;

-- Recreate doctors_full view with security_invoker
CREATE VIEW public.doctors_full 
WITH (security_invoker = true)
AS
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

-- Recreate pharmacies_public view with security_invoker
CREATE VIEW public.pharmacies_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  wilaya,
  is_on_duty,
  duty_date,
  ROUND(latitude::numeric, 2) as latitude_approx,
  ROUND(longitude::numeric, 2) as longitude_approx
FROM public.pharmacies;

-- Recreate pharmacies_full view with security_invoker
CREATE VIEW public.pharmacies_full 
WITH (security_invoker = true)
AS
SELECT * FROM public.pharmacies;

-- Grant appropriate permissions
GRANT SELECT ON public.doctors_public TO anon, authenticated;
GRANT SELECT ON public.doctors_full TO authenticated;
GRANT SELECT ON public.pharmacies_public TO anon, authenticated;
GRANT SELECT ON public.pharmacies_full TO authenticated;