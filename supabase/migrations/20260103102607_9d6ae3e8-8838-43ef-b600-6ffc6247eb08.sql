-- Add unique constraint on user_id for upsert to work
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Allow users to update their own role during registration
DROP POLICY IF EXISTS "Users can update their role on signup" ON public.user_roles;
CREATE POLICY "Users can update their role on signup" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow inserting roles (for upsert fallback)
DROP POLICY IF EXISTS "Users can insert their role" ON public.user_roles;
CREATE POLICY "Users can insert their role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);