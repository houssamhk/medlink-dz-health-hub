-- Drop the overly permissive doctor access policies on medical_records
DROP POLICY IF EXISTS "Doctors can view patient records for their appointments" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can create records for their patients" ON public.medical_records;

-- Create a more restrictive policy for doctors viewing medical records
-- Doctors can only view records for patients with whom they have active appointments
CREATE POLICY "Doctors can view records for patients with active appointments"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (
    -- Doctor is assigned to this record OR
    (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
    OR
    -- Doctor has an active appointment with this patient
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = medical_records.patient_id
      AND d.user_id = auth.uid()
      AND a.status IN ('pending', 'confirmed')
    )
  );

-- Doctors can only create records for patients with active appointments
CREATE POLICY "Doctors can create records for patients with active appointments"
  ON public.medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the doctor has an active appointment with this patient
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = medical_records.patient_id
      AND d.user_id = auth.uid()
      AND a.status IN ('pending', 'confirmed')
    )
    -- And the doctor_id being set is the calling doctor's ID
    AND doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- Allow doctors to update records they created for patients with active appointments
CREATE POLICY "Doctors can update their records for patients with active appointments"
  ON public.medical_records
  FOR UPDATE
  TO authenticated
  USING (
    -- Doctor created this record
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    -- And still has an active appointment with this patient
    AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = medical_records.patient_id
      AND d.user_id = auth.uid()
      AND a.status IN ('pending', 'confirmed')
    )
  );

-- Also fix patient_medical_data table - doctors with active appointments can view limited medical info
-- First, create a secure function for doctors to access patient medical data during appointments
CREATE OR REPLACE FUNCTION public.get_patient_medical_info(p_patient_id UUID)
RETURNS TABLE (
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[]
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
    WHERE a.patient_id = p_patient_id
    AND d.user_id = auth.uid()
    AND a.status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Access denied: No active appointment with this patient';
  END IF;
  
  RETURN QUERY
  SELECT 
    pmd.blood_type,
    pmd.allergies,
    pmd.chronic_conditions
  FROM patient_medical_data pmd
  WHERE pmd.patient_id = p_patient_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_patient_medical_info(UUID) TO authenticated;

-- Revoke anon access
REVOKE ALL ON public.medical_records FROM anon;
REVOKE ALL ON public.patient_medical_data FROM anon;