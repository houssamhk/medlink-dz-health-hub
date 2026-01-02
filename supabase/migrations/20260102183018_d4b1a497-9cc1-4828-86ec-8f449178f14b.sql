-- Add 'pharmacist' role capability to create pharmacy profiles with location
-- Update pharmacies table to support better location data
ALTER TABLE public.pharmacies 
ADD COLUMN IF NOT EXISTS clinic_latitude numeric,
ADD COLUMN IF NOT EXISTS clinic_longitude numeric;

-- Create clinics table for clinic owners (separate from doctors)
CREATE TABLE IF NOT EXISTS public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id),
  address text,
  wilaya text NOT NULL DEFAULT 'الجزائر',
  phone text,
  latitude numeric,
  longitude numeric,
  bio text,
  consultation_price numeric,
  working_hours jsonb,
  is_verified boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- RLS policies for clinics
CREATE POLICY "Anyone can view verified clinics"
ON public.clinics
FOR SELECT
USING (is_verified = true OR user_id = auth.uid());

CREATE POLICY "Clinic owners can insert their own clinic"
ON public.clinics
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clinic owners can update their own clinic"
ON public.clinics
FOR UPDATE
USING (user_id = auth.uid());

-- Add trigger for updated_at on clinics
CREATE TRIGGER update_clinics_updated_at
BEFORE UPDATE ON public.clinics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();