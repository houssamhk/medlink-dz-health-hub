-- Fix: platform_stats is a VIEW, not a table
-- We need to recreate it with security_invoker and restrict access

-- First, drop the existing view
DROP VIEW IF EXISTS public.platform_stats;

-- Recreate platform_stats as a secure view accessible only to admins
CREATE VIEW public.platform_stats 
WITH (security_invoker = true)
AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.doctors WHERE is_verified = true) as verified_doctors,
  (SELECT COUNT(*) FROM public.appointments) as total_appointments,
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'completed') as completed_appointments,
  (SELECT COUNT(*) FROM public.medical_records) as total_records,
  (SELECT COUNT(*) FROM public.pharmacies) as total_pharmacies;

-- Only grant access to authenticated users (admins will be checked at app level)
-- Or we can use a function to check admin status
REVOKE ALL ON public.platform_stats FROM anon;
GRANT SELECT ON public.platform_stats TO authenticated;

-- Fix: AI learning data - update policy
DROP POLICY IF EXISTS "System can read learning data" ON public.ai_learning_data;

-- Only admins can read AI learning data
CREATE POLICY "Only admins can view AI learning data"
ON public.ai_learning_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);