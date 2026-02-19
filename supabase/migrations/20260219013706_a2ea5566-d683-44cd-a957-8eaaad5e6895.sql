
-- Create detachment_plans table
CREATE TABLE public.detachment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  plan_data JSONB,
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, candidate_id)
);

-- Enable RLS
ALTER TABLE public.detachment_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own detachment plans"
  ON public.detachment_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detachment plans"
  ON public.detachment_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own detachment plans"
  ON public.detachment_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all detachment plans"
  ON public.detachment_plans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_detachment_plans_updated_at
  BEFORE UPDATE ON public.detachment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
