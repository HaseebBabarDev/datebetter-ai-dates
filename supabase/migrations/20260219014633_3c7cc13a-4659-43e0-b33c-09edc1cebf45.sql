
ALTER TABLE public.detachment_plans 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS current_phase integer NOT NULL DEFAULT 1;

ALTER TABLE public.detachment_plans 
ADD CONSTRAINT detachment_plans_status_check CHECK (status IN ('active', 'completed', 'quit'));
