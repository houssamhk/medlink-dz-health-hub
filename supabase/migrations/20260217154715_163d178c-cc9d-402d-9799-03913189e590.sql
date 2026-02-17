
-- Fix: Allow authenticated users to insert pharmacies (for signup flow)
CREATE POLICY "Authenticated users can insert pharmacies"
ON public.pharmacies
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix: Allow all authenticated users to view doctors (not just verified)
-- Drop the restrictive SELECT policy and replace with a more permissive one
DROP POLICY IF EXISTS "Authenticated users can view verified doctors" ON public.doctors;

CREATE POLICY "Authenticated users can view all doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to also view doctors for the public listing
CREATE POLICY "Public can view available doctors"
ON public.doctors
FOR SELECT
TO anon
USING (is_available = true);
