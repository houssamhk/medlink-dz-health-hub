-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

-- Storage policies for medical files
CREATE POLICY "Users can upload their own medical files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own medical files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own medical files"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add AI analysis columns to medical_records
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS urgency_level TEXT CHECK (urgency_level IN ('normal', 'attention', 'urgent', 'critical')),
ADD COLUMN IF NOT EXISTS ai_recommendations TEXT[],
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS lab_id UUID,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

-- Allow patients to create their own records
CREATE POLICY "Patients can create their own records"
ON public.medical_records FOR INSERT
WITH CHECK (patient_id = auth.uid());