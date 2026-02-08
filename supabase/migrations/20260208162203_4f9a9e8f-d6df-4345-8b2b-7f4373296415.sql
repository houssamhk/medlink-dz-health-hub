-- Allow authenticated users to insert notifications (for system-generated notifications)
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow service role and triggers to insert notifications for any user
CREATE POLICY "Service role can insert any notification"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create a function to safely insert notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_type, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;