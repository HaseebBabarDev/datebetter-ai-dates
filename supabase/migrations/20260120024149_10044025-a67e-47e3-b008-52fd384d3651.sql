-- Add reply tracking to admin_messages
ALTER TABLE public.admin_messages 
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.admin_messages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'admin' CHECK (sender_type IN ('admin', 'user'));

-- Update RLS to allow users to insert replies
DROP POLICY IF EXISTS "Users can create replies to admin messages" ON public.admin_messages;
CREATE POLICY "Users can create replies to admin messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id AND sender_type = 'user' AND reply_to IS NOT NULL) OR
  (has_role(auth.uid(), 'admin'))
);

-- Ensure admin can read all messages
DROP POLICY IF EXISTS "Admins can read all messages" ON public.admin_messages;
CREATE POLICY "Admins can read all messages"
ON public.admin_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Admins can update all, users can update their own
DROP POLICY IF EXISTS "Users and admins can update messages" ON public.admin_messages;
CREATE POLICY "Users and admins can update messages"
ON public.admin_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Admin can delete any, users can delete their own replies
DROP POLICY IF EXISTS "Admins can delete messages" ON public.admin_messages;
CREATE POLICY "Admins can delete messages"
ON public.admin_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR (auth.uid() = user_id AND sender_type = 'user'));