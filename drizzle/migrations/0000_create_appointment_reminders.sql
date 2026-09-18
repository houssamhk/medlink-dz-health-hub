CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'notification',
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON public.appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_pending ON public.appointment_reminders(reminder_time) WHERE is_sent = false;

GRANT SELECT ON public.appointment_reminders TO authenticated;
GRANT ALL ON public.appointment_reminders TO service_role;

ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own appointment reminders"
ON public.appointment_reminders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    LEFT JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.id = appointment_reminders.appointment_id
      AND (a.patient_id = auth.uid() OR d.user_id = auth.uid())
  )
);