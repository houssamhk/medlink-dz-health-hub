-- إنشاء جدول الإشعارات أولاً
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  related_type TEXT,
  sms_sent BOOLEAN DEFAULT false,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- دالة لإنشاء تذكيرات المواعيد تلقائياً
CREATE OR REPLACE FUNCTION public.create_appointment_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تذكير قبل 24 ساعة
  INSERT INTO public.appointment_reminders (appointment_id, reminder_time, reminder_type)
  VALUES (NEW.id, (NEW.appointment_date || ' ' || NEW.appointment_time)::TIMESTAMP - INTERVAL '24 hours', 'notification');
  
  -- تذكير قبل ساعة واحدة
  INSERT INTO public.appointment_reminders (appointment_id, reminder_time, reminder_type)
  VALUES (NEW.id, (NEW.appointment_date || ' ' || NEW.appointment_time)::TIMESTAMP - INTERVAL '1 hour', 'notification');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appointment_created ON public.appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_appointment_reminders();