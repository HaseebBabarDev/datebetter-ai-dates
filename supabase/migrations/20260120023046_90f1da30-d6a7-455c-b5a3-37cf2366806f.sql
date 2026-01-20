-- Create admin_messages table for in-app messaging
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own admin messages"
ON public.admin_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own messages
CREATE POLICY "Users can update their own admin messages"
ON public.admin_messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert messages to any user
CREATE POLICY "Admins can insert admin messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can view all messages
CREATE POLICY "Admins can view all admin messages"
ON public.admin_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete messages
CREATE POLICY "Admins can delete admin messages"
ON public.admin_messages
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));