-- Create table for D.E.V.I. conversations
CREATE TABLE public.devi_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create table for D.E.V.I. messages
CREATE TABLE public.devi_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.devi_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devi_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devi_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view own conversations" ON public.devi_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.devi_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.devi_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.devi_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for messages
CREATE POLICY "Users can view own messages" ON public.devi_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.devi_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_devi_conversations_user_id ON public.devi_conversations(user_id);
CREATE INDEX idx_devi_conversations_candidate_id ON public.devi_conversations(candidate_id);
CREATE INDEX idx_devi_messages_conversation_id ON public.devi_messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_devi_conversations_updated_at
  BEFORE UPDATE ON public.devi_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();