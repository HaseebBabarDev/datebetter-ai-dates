-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', true);

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Users can upload candidate photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update own candidate photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'candidate-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete own candidate photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'candidate-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access since bucket is public
CREATE POLICY "Public can view candidate photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'candidate-photos');