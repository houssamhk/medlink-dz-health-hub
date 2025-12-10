
-- جدول تقييمات الأطباء للتحاليل (للتعلم)
CREATE TABLE public.doctor_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('normal', 'moderate', 'urgent', 'critical')),
  diagnosis TEXT,
  recommendations TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, medical_record_id)
);

-- جدول سعة الأطباء اليومية
CREATE TABLE public.doctor_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  max_appointments INTEGER NOT NULL DEFAULT 20,
  max_file_reviews INTEGER NOT NULL DEFAULT 10,
  current_appointments INTEGER NOT NULL DEFAULT 0,
  current_file_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, date)
);

-- جدول بيانات التعلم للذكاء الاصطناعي
CREATE TABLE public.ai_learning_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.doctor_evaluations(id) ON DELETE CASCADE,
  symptoms TEXT[],
  lab_values JSONB,
  patient_age INTEGER,
  patient_gender TEXT,
  doctor_specialty_id UUID REFERENCES public.specialties(id),
  urgency_given TEXT NOT NULL,
  diagnosis_given TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_data ENABLE ROW LEVEL SECURITY;

-- سياسات doctor_evaluations
CREATE POLICY "Doctors can create evaluations" ON public.doctor_evaluations
  FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can view their evaluations" ON public.doctor_evaluations
  FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients can view evaluations of their records" ON public.doctor_evaluations
  FOR SELECT USING (medical_record_id IN (SELECT id FROM public.medical_records WHERE patient_id = auth.uid()));

-- سياسات doctor_capacity
CREATE POLICY "Anyone can view doctor capacity" ON public.doctor_capacity
  FOR SELECT USING (true);

CREATE POLICY "Doctors can manage their capacity" ON public.doctor_capacity
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- سياسات ai_learning_data (للقراءة فقط من النظام)
CREATE POLICY "System can read learning data" ON public.ai_learning_data
  FOR SELECT USING (true);

-- تحديث جدول medical_records لإضافة حالة المراجعة
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'reviewed'));
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID REFERENCES public.doctors(id);

-- دالة لتحديث سعة الطبيب عند الحجز
CREATE OR REPLACE FUNCTION public.update_doctor_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.doctor_capacity (doctor_id, date, current_appointments)
  VALUES (NEW.doctor_id, NEW.appointment_date, 1)
  ON CONFLICT (doctor_id, date) 
  DO UPDATE SET current_appointments = doctor_capacity.current_appointments + 1;
  RETURN NEW;
END;
$$;

-- تريغر لتحديث السعة
DROP TRIGGER IF EXISTS on_appointment_created ON public.appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_doctor_capacity();

-- دالة لحفظ بيانات التعلم
CREATE OR REPLACE FUNCTION public.save_learning_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_data RECORD;
  patient_data RECORD;
BEGIN
  -- جلب بيانات السجل الطبي
  SELECT * INTO record_data FROM public.medical_records WHERE id = NEW.medical_record_id;
  
  -- جلب بيانات المريض
  SELECT * INTO patient_data FROM public.profiles WHERE id = record_data.patient_id;
  
  -- حفظ بيانات التعلم
  INSERT INTO public.ai_learning_data (
    evaluation_id,
    symptoms,
    lab_values,
    patient_age,
    patient_gender,
    doctor_specialty_id,
    urgency_given,
    diagnosis_given
  ) VALUES (
    NEW.id,
    ARRAY[]::TEXT[],
    record_data.data,
    EXTRACT(YEAR FROM AGE(patient_data.date_of_birth))::INTEGER,
    patient_data.gender,
    (SELECT specialty_id FROM public.doctors WHERE id = NEW.doctor_id),
    NEW.urgency_level,
    NEW.diagnosis
  );
  
  RETURN NEW;
END;
$$;

-- تريغر لحفظ بيانات التعلم
DROP TRIGGER IF EXISTS on_evaluation_created ON public.doctor_evaluations;
CREATE TRIGGER on_evaluation_created
  AFTER INSERT ON public.doctor_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.save_learning_data();
