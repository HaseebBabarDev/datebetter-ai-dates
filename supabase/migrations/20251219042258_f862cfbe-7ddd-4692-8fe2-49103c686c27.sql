-- Add image_url and city_tag columns to forum_posts
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS city_tag text;

-- Create index for city_tag filtering
CREATE INDEX IF NOT EXISTS idx_forum_posts_city_tag ON public.forum_posts(city_tag);

-- Create storage bucket for community photos (20MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('community-photos', 'community-photos', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community photos
CREATE POLICY "Anyone can view community photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-photos');

CREATE POLICY "Authenticated users can upload community photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own community photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);