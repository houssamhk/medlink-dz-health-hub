-- Fix security definer view by dropping and recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.platform_stats;

CREATE VIEW public.platform_stats 
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM doctors WHERE is_verified = true) as verified_doctors,
  (SELECT COUNT(*) FROM appointments) as total_appointments,
  (SELECT COUNT(*) FROM appointments WHERE status = 'completed') as completed_appointments,
  (SELECT COUNT(*) FROM medical_records) as total_records,
  (SELECT COUNT(*) FROM pharmacies) as total_pharmacies;