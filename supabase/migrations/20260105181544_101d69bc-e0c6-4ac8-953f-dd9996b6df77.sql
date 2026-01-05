-- Create table for tracking Devi "wins" - moments when the app helped the user
CREATE TABLE public.devi_wins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  win_type TEXT NOT NULL, -- 'saved_time', 'avoided_crash_out', 'resisted_contact', 'other'
  journal_note TEXT,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.devi_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.devi_wins ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own wins" 
ON public.devi_wins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wins" 
ON public.devi_wins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wins" 
ON public.devi_wins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_devi_wins_user_id ON public.devi_wins(user_id);
CREATE INDEX idx_devi_wins_created_at ON public.devi_wins(created_at DESC);