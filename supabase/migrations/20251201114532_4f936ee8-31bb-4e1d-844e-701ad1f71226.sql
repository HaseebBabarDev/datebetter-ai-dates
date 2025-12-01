-- Studios table
CREATE TABLE public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  area_sqm DECIMAL(10,2) NOT NULL,
  description TEXT,
  cover_image TEXT,
  amenities JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  base_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Studio images gallery
CREATE TABLE public.studio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly availability patterns (recurring schedule)
CREATE TABLE public.studio_availability_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(studio_id, day_of_week)
);

-- Time slots with custom pricing
CREATE TABLE public.studio_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  slot_type TEXT DEFAULT 'regular' CHECK (slot_type IN ('regular', 'peak', 'discounted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Specific date overrides (holidays, special closures, etc.)
CREATE TABLE public.studio_date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(studio_id, override_date)
);

-- Bookings
CREATE TABLE public.studio_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE public.studio_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.studio_bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_studios_owner ON public.studios(owner_user_id);
CREATE INDEX idx_studio_images_studio ON public.studio_images(studio_id);
CREATE INDEX idx_availability_patterns_studio ON public.studio_availability_patterns(studio_id);
CREATE INDEX idx_time_slots_studio ON public.studio_time_slots(studio_id);
CREATE INDEX idx_date_overrides_studio_date ON public.studio_date_overrides(studio_id, override_date);
CREATE INDEX idx_bookings_studio_date ON public.studio_bookings(studio_id, booking_date);
CREATE INDEX idx_bookings_user ON public.studio_bookings(user_id);
CREATE INDEX idx_reviews_studio ON public.studio_reviews(studio_id);

-- Enable RLS
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_availability_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for studios
CREATE POLICY "Studios are viewable by everyone" ON public.studios FOR SELECT USING (true);
CREATE POLICY "Owners can insert own studios" ON public.studios FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owners can update own studios" ON public.studios FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Owners can delete own studios" ON public.studios FOR DELETE USING (auth.uid() = owner_user_id);

-- RLS Policies for studio_images
CREATE POLICY "Studio images viewable by everyone" ON public.studio_images FOR SELECT USING (true);
CREATE POLICY "Studio owners can manage images" ON public.studio_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.studios WHERE studios.id = studio_images.studio_id AND studios.owner_user_id = auth.uid())
);

-- RLS Policies for availability patterns
CREATE POLICY "Availability patterns viewable by everyone" ON public.studio_availability_patterns FOR SELECT USING (true);
CREATE POLICY "Studio owners can manage patterns" ON public.studio_availability_patterns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.studios WHERE studios.id = studio_availability_patterns.studio_id AND studios.owner_user_id = auth.uid())
);

-- RLS Policies for time slots
CREATE POLICY "Time slots viewable by everyone" ON public.studio_time_slots FOR SELECT USING (true);
CREATE POLICY "Studio owners can manage time slots" ON public.studio_time_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.studios WHERE studios.id = studio_time_slots.studio_id AND studios.owner_user_id = auth.uid())
);

-- RLS Policies for date overrides
CREATE POLICY "Date overrides viewable by everyone" ON public.studio_date_overrides FOR SELECT USING (true);
CREATE POLICY "Studio owners can manage overrides" ON public.studio_date_overrides FOR ALL USING (
  EXISTS (SELECT 1 FROM public.studios WHERE studios.id = studio_date_overrides.studio_id AND studios.owner_user_id = auth.uid())
);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.studio_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Studio owners can view studio bookings" ON public.studio_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studios WHERE studios.id = studio_bookings.studio_id AND studios.owner_user_id = auth.uid())
);
CREATE POLICY "Users can insert own bookings" ON public.studio_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.studio_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Studio owners can update studio bookings" ON public.studio_bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.studios WHERE studios.id = studio_bookings.studio_id AND studios.owner_user_id = auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Reviews viewable by everyone" ON public.studio_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.studio_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.studio_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.studio_reviews FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.studio_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();