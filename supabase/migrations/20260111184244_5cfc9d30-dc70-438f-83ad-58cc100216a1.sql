-- Drop the SECURITY DEFINER view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.doctors_public_safe;

-- Recreate the view with SECURITY INVOKER (uses the calling user's permissions)
CREATE VIEW public.doctors_public_safe
WITH (security_invoker = true)
AS
SELECT 
  d.id,
  d.specialty_id,
  d.clinic_name,
  d.clinic_address,
  d.wilaya,
  d.consultation_price,
  d.experience_years,
  d.rating,
  d.total_reviews,
  d.is_available,
  d.telemedicine_enabled,
  d.accepts_insurance,
  d.working_hours,
  d.bio,
  -- Join with profiles to get doctor name
  p.full_name,
  p.avatar_url,
  -- Join with specialties
  s.name_ar as specialty_name_ar,
  s.name_fr as specialty_name_fr
FROM doctors d
LEFT JOIN profiles p ON d.user_id = p.id
LEFT JOIN specialties s ON d.specialty_id = s.id
WHERE d.is_verified = true;  -- Only show verified doctors

-- Grant access to authenticated users only
GRANT SELECT ON public.doctors_public_safe TO authenticated;
REVOKE ALL ON public.doctors_public_safe FROM anon;