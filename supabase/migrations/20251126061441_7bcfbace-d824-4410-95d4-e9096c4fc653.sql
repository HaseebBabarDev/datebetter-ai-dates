-- Create enum types for various fields
CREATE TYPE public.gender_identity AS ENUM ('woman_cis', 'woman_trans', 'non_binary', 'gender_fluid', 'self_describe');
CREATE TYPE public.pronouns AS ENUM ('she_her', 'he_him', 'they_them', 'other');
CREATE TYPE public.sexual_orientation AS ENUM ('straight', 'lesbian', 'bisexual', 'pansexual', 'queer', 'asexual', 'no_label', 'self_describe');
CREATE TYPE public.relationship_goal AS ENUM ('casual', 'dating', 'serious', 'marriage', 'unsure');
CREATE TYPE public.relationship_structure AS ENUM ('monogamous', 'open', 'polyamorous', 'unsure');
CREATE TYPE public.kids_status AS ENUM ('no_kids', 'has_young_kids', 'has_adult_kids');
CREATE TYPE public.kids_desire AS ENUM ('definitely_yes', 'maybe', 'definitely_no', 'already_have');
CREATE TYPE public.religion AS ENUM ('none', 'spiritual', 'christian_catholic', 'christian_protestant', 'christian_other', 'jewish', 'muslim', 'hindu', 'buddhist', 'other');
CREATE TYPE public.politics AS ENUM ('progressive', 'liberal', 'moderate', 'conservative', 'traditional');
CREATE TYPE public.attachment_style AS ENUM ('secure', 'anxious', 'avoidant', 'disorganized');
CREATE TYPE public.social_style AS ENUM ('homebody', 'social_butterfly', 'balanced', 'mood_dependent');
CREATE TYPE public.communication_style AS ENUM ('direct', 'diplomatic', 'emotional', 'logical', 'adaptable');
CREATE TYPE public.cycle_regularity AS ENUM ('very_regular', 'somewhat_regular', 'irregular', 'pcos_endo', 'perimenopause', 'not_applicable');
CREATE TYPE public.candidate_status AS ENUM ('just_matched', 'texting', 'planning_date', 'dating', 'getting_serious', 'no_contact', 'archived');
CREATE TYPE public.interaction_type AS ENUM ('coffee', 'dinner', 'drinks', 'movie', 'facetime', 'texting', 'activity', 'home_hangout', 'group_hang', 'trip', 'event', 'intimate');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic identity (Screen 2)
  name TEXT,
  birth_date DATE,
  location TEXT,
  gender_identity gender_identity,
  pronouns pronouns,
  custom_pronouns TEXT,
  
  -- Dating preferences (Screen 3)
  sexual_orientation sexual_orientation,
  orientation_custom TEXT,
  interested_in TEXT[], -- Array of gender identities interested in
  match_specificity INTEGER DEFAULT 5, -- 1-10 scale
  
  -- Hormone/Cycle (Screen 4)
  is_trans BOOLEAN DEFAULT FALSE,
  transition_stage TEXT,
  hormone_profile TEXT,
  lgbtq_connection INTEGER DEFAULT 3, -- 1-5 scale
  track_cycle BOOLEAN DEFAULT FALSE,
  last_period_date DATE,
  cycle_length INTEGER DEFAULT 28,
  cycle_regularity cycle_regularity DEFAULT 'not_applicable',
  
  -- Relationship goals (Screen 5)
  relationship_goal relationship_goal,
  relationship_structure relationship_structure,
  monogamy_required BOOLEAN DEFAULT FALSE,
  exclusivity_before_intimacy BOOLEAN DEFAULT FALSE,
  
  -- Kids & Family (Screen 6)
  kids_status kids_status DEFAULT 'no_kids',
  kids_desire kids_desire,
  kids_timeline TEXT,
  marriage_before_kids BOOLEAN DEFAULT FALSE,
  open_to_single_parenthood BOOLEAN DEFAULT FALSE,
  
  -- Faith (Screen 7)
  religion religion,
  religion_practice_level TEXT,
  faith_importance INTEGER DEFAULT 3, -- 1-5 scale
  faith_requirements JSONB DEFAULT '[]'::JSONB,
  
  -- Politics (Screen 8)
  politics politics,
  politics_importance INTEGER DEFAULT 3, -- 1-5 scale
  political_dealbreakers JSONB DEFAULT '[]'::JSONB,
  
  -- Career (Screen 9)
  education_level TEXT,
  education_matters BOOLEAN DEFAULT FALSE,
  career_stage TEXT,
  ambition_level INTEGER DEFAULT 3, -- 1-5 scale
  financial_importance INTEGER DEFAULT 3, -- 1-5 scale
  
  -- Lifestyle (Screen 10)
  distance_preference TEXT,
  living_situation TEXT,
  open_to_moving BOOLEAN DEFAULT FALSE,
  social_style social_style,
  work_schedule_type TEXT,
  flexibility_rating INTEGER DEFAULT 3, -- 1-5 scale
  
  -- Physical preferences (Screen 11)
  attraction_importance INTEGER DEFAULT 3, -- 1-5 scale
  preferred_age_min INTEGER,
  preferred_age_max INTEGER,
  height_preference TEXT,
  chemistry_factors JSONB DEFAULT '[]'::JSONB,
  
  -- Communication (Screen 12)
  communication_style communication_style,
  response_time_preference INTEGER DEFAULT 5, -- 1-10 scale
  conflict_style TEXT,
  love_languages JSONB DEFAULT '[]'::JSONB,
  
  -- Past patterns (Screen 13)
  attachment_style attachment_style,
  longest_relationship TEXT,
  time_since_last_relationship TEXT,
  pattern_recognition JSONB DEFAULT '[]'::JSONB,
  
  -- Boundaries (Screen 14)
  dealbreakers JSONB DEFAULT '[]'::JSONB,
  safety_priorities JSONB DEFAULT '[]'::JSONB,
  boundary_strength INTEGER DEFAULT 3, -- 1-5 scale
  
  -- Safety/Intimacy (Screen 15)
  intimacy_comfort TEXT,
  safety_requirements JSONB DEFAULT '[]'::JSONB,
  post_intimacy_tendency TEXT,
  red_flag_sensitivity INTEGER DEFAULT 5, -- 1-10 scale
  love_bombing_sensitivity INTEGER DEFAULT 5, -- 1-10 scale
  behavioral_monitoring INTEGER DEFAULT 5, -- 1-10 scale
  
  -- Enhanced intake
  dating_history_text TEXT,
  dating_patterns JSONB DEFAULT '[]'::JSONB,
  trauma_experiences JSONB DEFAULT '[]'::JSONB,
  financial_situation TEXT,
  financial_vulnerability INTEGER DEFAULT 3, -- 1-5 scale
  
  -- App settings
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  nickname TEXT NOT NULL,
  photo_url TEXT,
  age INTEGER,
  gender_identity gender_identity,
  pronouns pronouns,
  
  -- How you met
  met_via TEXT,
  met_app TEXT,
  first_contact_date DATE,
  status candidate_status DEFAULT 'just_matched',
  
  -- Their profile
  their_relationship_goal relationship_goal,
  their_kids_status kids_status,
  their_kids_desire kids_desire,
  their_religion religion,
  their_politics politics,
  their_career_stage TEXT,
  their_ambition_level INTEGER,
  their_attachment_style attachment_style,
  
  -- Ratings
  physical_attraction INTEGER DEFAULT 3, -- 1-5 scale
  intellectual_connection INTEGER DEFAULT 3,
  humor_compatibility INTEGER DEFAULT 3,
  energy_match INTEGER DEFAULT 3,
  overall_chemistry INTEGER DEFAULT 3,
  
  -- Red flags & notes
  red_flags JSONB DEFAULT '[]'::JSONB,
  green_flags JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  ai_description TEXT, -- User's free-text description for AI analysis
  
  -- Compatibility scores (calculated by AI)
  compatibility_score INTEGER, -- 0-100
  score_breakdown JSONB DEFAULT '{}'::JSONB,
  last_score_update TIMESTAMP WITH TIME ZONE,
  
  -- No Contact Mode
  no_contact_active BOOLEAN DEFAULT FALSE,
  no_contact_start_date DATE,
  no_contact_day INTEGER DEFAULT 0,
  
  -- Intimacy tracking
  first_intimacy_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interactions table
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  interaction_type interaction_type NOT NULL,
  interaction_date DATE DEFAULT CURRENT_DATE,
  duration TEXT,
  who_initiated TEXT,
  who_paid TEXT,
  
  -- Text-based logging
  notes TEXT,
  gut_feeling TEXT,
  ai_analysis JSONB,
  
  -- Ratings
  overall_feeling INTEGER DEFAULT 3, -- 1-5 scale
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create behavioral_patterns table for tracking patterns
CREATE TABLE public.behavioral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  pattern_type TEXT NOT NULL, -- love_bombing, withdrawal, breadcrumbing, etc.
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB DEFAULT '{}'::JSONB,
  acknowledged BOOLEAN DEFAULT FALSE
);

-- Create advice_tracking table
CREATE TABLE public.advice_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  
  advice_text TEXT NOT NULL,
  advice_type TEXT,
  response TEXT, -- accepted, rejected, dismissed, postponed
  followed_through BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create no_contact_progress table
CREATE TABLE public.no_contact_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  day_number INTEGER NOT NULL,
  message_sent BOOLEAN DEFAULT FALSE,
  hoover_attempt BOOLEAN DEFAULT FALSE,
  broke_nc BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advice_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_contact_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for candidates
CREATE POLICY "Users can view own candidates" ON public.candidates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own candidates" ON public.candidates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own candidates" ON public.candidates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own candidates" ON public.candidates FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for interactions
CREATE POLICY "Users can view own interactions" ON public.interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON public.interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON public.interactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for behavioral_patterns
CREATE POLICY "Users can view own patterns" ON public.behavioral_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON public.behavioral_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON public.behavioral_patterns FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for advice_tracking
CREATE POLICY "Users can view own advice" ON public.advice_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own advice" ON public.advice_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own advice" ON public.advice_tracking FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for no_contact_progress
CREATE POLICY "Users can view own nc progress" ON public.no_contact_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nc progress" ON public.no_contact_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nc progress" ON public.no_contact_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();