-- Fix: Remove overly permissive doctor access to family members
DROP POLICY IF EXISTS "Doctors can view patient family members basic info" ON public.family_members;

-- Create a secure view for doctors that shows ONLY non-medical info
-- Doctors should only see name, relationship, gender, and age for context
CREATE OR REPLACE VIEW public.family_members_for_doctors
WITH (security_invoker = true)
AS
SELECT 
  fm.id,
  fm.primary_user_id,
  fm.member_name,
  fm.relationship,
  fm.gender,
  fm.date_of_birth
  -- EXCLUDED: blood_type, allergies, chronic_conditions (sensitive medical data)
FROM public.family_members fm
WHERE EXISTS (
  SELECT 1 FROM public.appointments a
  JOIN public.doctors d ON a.doctor_id = d.id
  WHERE a.patient_id = fm.primary_user_id
  AND d.user_id = auth.uid()
  AND a.status IN ('confirmed', 'pending') -- Only active appointments
);

GRANT SELECT ON public.family_members_for_doctors TO authenticated;

-- Also fix profiles - create a more secure approach
-- Update the patient_basic_info view to exclude sensitive data
DROP VIEW IF EXISTS public.patient_basic_info;

CREATE VIEW public.patient_basic_info
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.gender,
  EXTRACT(YEAR FROM AGE(p.date_of_birth))::integer as age,
  p.wilaya
  -- EXCLUDED: email, phone, address, blood_type, allergies, chronic_conditions, date_of_birth (exact)
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.appointments a
  JOIN public.doctors d ON a.doctor_id = d.id
  WHERE a.patient_id = p.id 
  AND d.user_id = auth.uid()
  AND a.status IN ('confirmed', 'pending', 'completed')
);

GRANT SELECT ON public.patient_basic_info TO authenticated;

-- For medical records context, doctors should access patient medical info 
-- ONLY through the medical_records table which they have explicit access to