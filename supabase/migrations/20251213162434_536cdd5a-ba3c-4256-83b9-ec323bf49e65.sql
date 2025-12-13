-- إنشاء الدوال أولاً ثم التريقرات
CREATE OR REPLACE FUNCTION public.notify_patient_on_evaluation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  patient_id_val UUID;
  record_title TEXT;
BEGIN
  SELECT mr.patient_id, mr.title INTO patient_id_val, record_title
  FROM public.medical_records mr
  WHERE mr.id = NEW.medical_record_id;

  INSERT INTO public.notifications (user_id, title, message, type, related_id, related_type)
  VALUES (
    patient_id_val,
    'تم تقييم ملفك الطبي',
    'قام الطبيب بتقييم ملفك: ' || record_title || ' - مستوى الإلحاح: ' || NEW.urgency_level,
    CASE 
      WHEN NEW.urgency_level = 'critical' THEN 'critical'
      WHEN NEW.urgency_level = 'urgent' THEN 'warning'
      ELSE 'success'
    END,
    NEW.id,
    'evaluation'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_doctor_on_new_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doctor_user_id UUID;
  patient_name TEXT;
BEGIN
  IF NEW.assigned_doctor_id IS NOT NULL AND (OLD.assigned_doctor_id IS NULL OR OLD.assigned_doctor_id <> NEW.assigned_doctor_id) THEN
    SELECT d.user_id INTO doctor_user_id
    FROM public.doctors d
    WHERE d.id = NEW.assigned_doctor_id;

    SELECT p.full_name INTO patient_name
    FROM public.profiles p
    WHERE p.id = NEW.patient_id;

    INSERT INTO public.notifications (user_id, title, message, type, related_id, related_type)
    VALUES (
      doctor_user_id,
      'ملف جديد للمراجعة',
      'لديك ملف جديد من المريض: ' || COALESCE(patient_name, 'مريض') || ' - ' || NEW.title,
      'info',
      NEW.id,
      'medical_record'
    );
  END IF;

  RETURN NEW;
END;
$$;