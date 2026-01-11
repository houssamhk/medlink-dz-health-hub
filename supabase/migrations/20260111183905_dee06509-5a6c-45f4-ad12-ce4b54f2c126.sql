-- Drop the overly permissive doctor access policy
DROP POLICY IF EXISTS "Doctors can view patient basic info for appointments" ON public.profiles;

-- Create a separate table for sensitive medical data that only the patient can access
CREATE TABLE IF NOT EXISTS public.patient_medical_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.patient_medical_data ENABLE ROW LEVEL SECURITY;

-- Only the patient can view their own medical data
CREATE POLICY "Patients can view their own medical data"
  ON public.patient_medical_data
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Only the patient can insert their own medical data
CREATE POLICY "Patients can insert their own medical data"
  ON public.patient_medical_data
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- Only the patient can update their own medical data
CREATE POLICY "Patients can update their own medical data"
  ON public.patient_medical_data
  FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid());

-- Migrate existing sensitive data from profiles to the new table
INSERT INTO public.patient_medical_data (patient_id, blood_type, allergies, chronic_conditions)
SELECT id, blood_type, allergies, chronic_conditions
FROM public.profiles
WHERE blood_type IS NOT NULL OR allergies IS NOT NULL OR chronic_conditions IS NOT NULL
ON CONFLICT (patient_id) DO UPDATE SET
  blood_type = EXCLUDED.blood_type,
  allergies = EXCLUDED.allergies,
  chronic_conditions = EXCLUDED.chronic_conditions;

-- Remove sensitive medical columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS blood_type,
  DROP COLUMN IF EXISTS allergies,
  DROP COLUMN IF EXISTS chronic_conditions;

-- Revoke all anon access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.patient_medical_data FROM anon;

-- Update the get_patient_basic_info function to ensure it only returns non-sensitive data
CREATE OR REPLACE FUNCTION public.get_patient_basic_info(patient_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  gender TEXT,
  age INTEGER,
  wilaya TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data if the caller is a doctor with an active appointment with this patient
  IF NOT EXISTS (
    SELECT 1 FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = $1
    AND d.user_id = auth.uid()
    AND a.status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Access denied: No active appointment with this patient';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.gender,
    CASE 
      WHEN p.date_of_birth IS NOT NULL 
      THEN EXTRACT(YEAR FROM age(p.date_of_birth))::INTEGER
      ELSE NULL
    END as age,
    p.wilaya
  FROM profiles p
  WHERE p.id = $1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_patient_basic_info(UUID) TO authenticated;