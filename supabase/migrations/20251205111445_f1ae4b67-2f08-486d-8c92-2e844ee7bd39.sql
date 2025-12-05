
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'pharmacist', 'lab_admin', 'admin');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create enum for medical record type
CREATE TYPE public.record_type AS ENUM ('prescription', 'lab_result', 'imaging', 'consultation', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  wilaya TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  UNIQUE (user_id, role)
);

-- Create specialties table
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specialty_id UUID REFERENCES public.specialties(id),
  license_number TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  wilaya TEXT NOT NULL,
  consultation_price DECIMAL(10,2),
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  working_hours JSONB,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  telemedicine_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  is_telemedicine BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pharmacies table
CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  phone TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_on_duty BOOLEAN DEFAULT FALSE,
  duty_date DATE,
  opening_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  record_type record_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  data JSONB,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (patient_id, doctor_id, appointment_id)
);

-- Create AI triage sessions table
CREATE TABLE public.ai_triage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  recommended_specialty_id UUID REFERENCES public.specialties(id),
  urgency_level TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_triage_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for specialties (public read)
CREATE POLICY "Anyone can view specialties" ON public.specialties FOR SELECT USING (true);

-- RLS Policies for doctors (public read for available doctors)
CREATE POLICY "Anyone can view verified doctors" ON public.doctors FOR SELECT USING (is_verified = true OR user_id = auth.uid());
CREATE POLICY "Doctors can update their own profile" ON public.doctors FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Doctors can insert their own profile" ON public.doctors FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Users can update their appointments" ON public.appointments FOR UPDATE USING (patient_id = auth.uid() OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- RLS Policies for pharmacies (public read)
CREATE POLICY "Anyone can view pharmacies" ON public.pharmacies FOR SELECT USING (true);
CREATE POLICY "Pharmacists can update their pharmacy" ON public.pharmacies FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for medical_records
CREATE POLICY "Patients can view their own records" ON public.medical_records FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors can view patient records for their appointments" ON public.medical_records FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));
CREATE POLICY "Doctors can create records for their patients" ON public.medical_records FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Patients can create reviews" ON public.reviews FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Patients can update their reviews" ON public.reviews FOR UPDATE USING (patient_id = auth.uid());

-- RLS Policies for AI triage sessions
CREATE POLICY "Users can view their own triage sessions" ON public.ai_triage_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create triage sessions" ON public.ai_triage_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update doctor rating
CREATE OR REPLACE FUNCTION public.update_doctor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.doctors
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM public.reviews WHERE doctor_id = NEW.doctor_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE doctor_id = NEW.doctor_id)
  WHERE id = NEW.doctor_id;
  RETURN NEW;
END;
$$;

-- Trigger to update doctor rating on new review
CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_doctor_rating();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert initial specialties
INSERT INTO public.specialties (name_ar, name_fr, icon) VALUES
  ('طب عام', 'Médecine Générale', 'stethoscope'),
  ('طب الأطفال', 'Pédiatrie', 'baby'),
  ('طب القلب', 'Cardiologie', 'heart'),
  ('طب الأسنان', 'Dentisterie', 'tooth'),
  ('طب العيون', 'Ophtalmologie', 'eye'),
  ('طب الأعصاب', 'Neurologie', 'brain'),
  ('طب النساء والتوليد', 'Gynécologie', 'users'),
  ('الأمراض الجلدية', 'Dermatologie', 'hand'),
  ('جراحة العظام', 'Orthopédie', 'bone'),
  ('الطب النفسي', 'Psychiatrie', 'brain'),
  ('أنف وأذن وحنجرة', 'ORL', 'ear'),
  ('طب الباطنية', 'Médecine Interne', 'activity');
