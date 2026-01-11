-- Fix 1: Profiles table - ensure no public access and add doctor access for appointments
-- First, verify existing policies are correct (they should be)
-- Add explicit restriction to ensure anon cannot access

-- Revoke any potential anon access
REVOKE ALL ON public.profiles FROM anon;

-- Create a limited view for doctors to see patient basic info (for appointments only)
CREATE OR REPLACE VIEW public.patient_basic_info
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.gender,
  p.date_of_birth,
  p.wilaya
  -- Excluded: email, phone, address, blood_type, allergies, chronic_conditions
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.appointments a
  JOIN public.doctors d ON a.doctor_id = d.id
  WHERE a.patient_id = p.id 
  AND d.user_id = auth.uid()
);

GRANT SELECT ON public.patient_basic_info TO authenticated;

-- Fix 2: Family members - add additional security
-- Revoke any potential anon access
REVOKE ALL ON public.family_members FROM anon;

-- Ensure only the primary user can access family members
-- The existing policy is correct, but let's make it explicit
DROP POLICY IF EXISTS "Users can manage their family members" ON public.family_members;

-- Separate policies for better control
CREATE POLICY "Users can view their family members"
ON public.family_members
FOR SELECT
TO authenticated
USING (primary_user_id = auth.uid());

CREATE POLICY "Users can insert their family members"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (primary_user_id = auth.uid());

CREATE POLICY "Users can update their family members"
ON public.family_members
FOR UPDATE
TO authenticated
USING (primary_user_id = auth.uid());

CREATE POLICY "Users can delete their family members"
ON public.family_members
FOR DELETE
TO authenticated
USING (primary_user_id = auth.uid());

-- Add policy for doctors to see basic family member info for patients they treat
CREATE POLICY "Doctors can view patient family members basic info"
ON public.family_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = primary_user_id
    AND d.user_id = auth.uid()
  )
);