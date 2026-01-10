-- 1. Create prescriptions table
CREATE TABLE public.prescriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE SET NULL,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view their prescriptions"
ON public.prescriptions
FOR SELECT
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view prescriptions they created"
ON public.prescriptions
FOR SELECT
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create prescriptions"
ON public.prescriptions
FOR INSERT
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their prescriptions"
ON public.prescriptions
FOR UPDATE
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Pharmacists can view sent prescriptions"
ON public.prescriptions
FOR SELECT
USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE user_id = auth.uid()));

CREATE POLICY "Pharmacists can update prescription status"
ON public.prescriptions
FOR UPDATE
USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE user_id = auth.uid()));

-- 2. Create pharmacy_inventory table
CREATE TABLE public.pharmacy_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'قطعة',
    min_quantity INTEGER DEFAULT 10,
    price NUMERIC DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Pharmacists can manage their inventory"
ON public.pharmacy_inventory
FOR ALL
USING (pharmacy_id IN (SELECT id FROM public.pharmacies WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view pharmacy inventory"
ON public.pharmacy_inventory
FOR SELECT
USING (true);

-- 3. Create messages table for chat system
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (receiver_id = auth.uid());

-- 4. Create clinic_capacity table
CREATE TABLE public.clinic_capacity (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    total_rooms INTEGER DEFAULT 0,
    available_rooms INTEGER DEFAULT 0,
    total_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(clinic_id, date)
);

-- Enable RLS
ALTER TABLE public.clinic_capacity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinic capacity
CREATE POLICY "Clinic owners can manage their capacity"
ON public.clinic_capacity
FOR ALL
USING (clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view clinic capacity"
ON public.clinic_capacity
FOR SELECT
USING (true);

-- 5. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;