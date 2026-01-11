-- Create a public-safe view for doctors that hides sensitive information
-- This view will be used by the application to display doctor listings
CREATE OR REPLACE VIEW public.doctors_public_safe AS
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

-- Revoke anon access to doctors table
REVOKE ALL ON public.doctors FROM anon;

-- Create a secure function for admins to view license numbers
CREATE OR REPLACE FUNCTION public.get_doctor_license_number(doctor_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  license TEXT;
BEGIN
  -- Only admins can view license numbers
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  SELECT d.license_number INTO license
  FROM doctors d
  WHERE d.id = doctor_id;
  
  RETURN license;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_doctor_license_number(UUID) TO authenticated;

-- Create a function for doctors to view their own complete profile including license
CREATE OR REPLACE FUNCTION public.get_my_doctor_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  specialty_id UUID,
  license_number TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  wilaya TEXT,
  consultation_price NUMERIC,
  experience_years INTEGER,
  rating NUMERIC,
  total_reviews INTEGER,
  is_verified BOOLEAN,
  is_available BOOLEAN,
  telemedicine_enabled BOOLEAN,
  accepts_insurance BOOLEAN,
  working_hours JSONB,
  bio TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.user_id,
    d.specialty_id,
    d.license_number,
    d.clinic_name,
    d.clinic_address,
    d.wilaya,
    d.consultation_price,
    d.experience_years,
    d.rating,
    d.total_reviews,
    d.is_verified,
    d.is_available,
    d.telemedicine_enabled,
    d.accepts_insurance,
    d.working_hours,
    d.bio,
    d.created_at,
    d.updated_at
  FROM doctors d
  WHERE d.user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_doctor_profile() TO authenticated;