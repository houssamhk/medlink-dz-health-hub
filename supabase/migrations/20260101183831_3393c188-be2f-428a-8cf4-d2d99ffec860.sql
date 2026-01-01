-- Create emergency_requests table for SOS functionality
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  emergency_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responder_notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own emergency requests
CREATE POLICY "Users can create emergency requests"
ON public.emergency_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own emergency requests
CREATE POLICY "Users can view their own emergency requests"
ON public.emergency_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view and manage all emergency requests
CREATE POLICY "Admins can manage all emergency requests"
ON public.emergency_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;