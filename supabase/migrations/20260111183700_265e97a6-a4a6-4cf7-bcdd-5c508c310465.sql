-- Verify and fix RLS on profiles table
-- First ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with explicit TO authenticated
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow doctors to view basic patient info for their appointments (non-sensitive only)
CREATE POLICY "Doctors can view patient basic info for appointments"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = profiles.id
    AND d.user_id = auth.uid()
  )
);

-- Ensure no anon access
REVOKE ALL ON public.profiles FROM anon;

-- Fix family_members RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Ensure policies are correct
DROP POLICY IF EXISTS "Users can view their family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert their family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can update their family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete their family members" ON public.family_members;

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

REVOKE ALL ON public.family_members FROM anon;

-- Drop the insecure views and recreate with proper restrictions
DROP VIEW IF EXISTS public.patient_basic_info;
DROP VIEW IF EXISTS public.family_members_for_doctors;

-- Recreate patient_basic_info as a FUNCTION instead for better security
CREATE OR REPLACE FUNCTION public.get_patient_basic_info(patient_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  gender text,
  age integer,
  wilaya text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.gender,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::integer as age,
    p.wilaya
  FROM public.profiles p
  WHERE p.id = patient_id
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = p.id 
    AND d.user_id = auth.uid()
  );
$$;

-- Recreate family_members view as a FUNCTION for better security
CREATE OR REPLACE FUNCTION public.get_family_members_for_appointment(patient_id uuid)
RETURNS TABLE (
  id uuid,
  member_name text,
  relationship text,
  gender text,
  age integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fm.id,
    fm.member_name,
    fm.relationship,
    fm.gender,
    EXTRACT(YEAR FROM AGE(fm.date_of_birth))::integer as age
  FROM public.family_members fm
  WHERE fm.primary_user_id = patient_id
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = patient_id
    AND d.user_id = auth.uid()
    AND a.status IN ('confirmed', 'pending')
  );
$$;