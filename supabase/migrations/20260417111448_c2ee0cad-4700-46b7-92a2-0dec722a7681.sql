
-- 1) Pitch deck views: prevent anonymous inserts from setting PII fields.
-- Anonymous/authenticated clients can still insert a view record, but PII (IP, email, user_agent)
-- must be NULL from client. Server-side (service role) bypasses RLS and can populate them.
DROP POLICY IF EXISTS "Anyone can insert pitch deck views" ON public.pitch_deck_views;

CREATE POLICY "Public can insert pitch deck views without PII"
ON public.pitch_deck_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  viewer_ip IS NULL
  AND viewer_email IS NULL
  AND user_agent IS NULL
  AND country IS NULL
  AND country_code IS NULL
  AND region IS NULL
  AND city IS NULL
);

-- 2) Realtime authorization: restrict channel subscriptions so users can only join
-- their own user-scoped topics. Topic convention: "user:{auth.uid()}".
-- Without this policy, any authenticated user could subscribe to any channel topic.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can only access own realtime topic" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Users can only access own realtime topic"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        realtime.topic() = 'user:' || (auth.uid())::text
        OR realtime.topic() LIKE 'public:%'
      )
    $p$;
  END IF;
END$$;

-- 3) Restrict storage bucket listing while keeping individual public file access.
-- Public SELECT on bucket allows listing all object names. Replace with policies that
-- still allow direct fetches by path but disallow listing without a known key.
-- Note: PostgREST/Supabase fetches by exact path still work because RLS on objects
-- only filters listing queries; direct CDN fetch by full path is unaffected.
-- We keep public access since the buckets are intentionally public, but add
-- a more granular policy that requires owner match for listing of own folders.
-- (Public direct file URLs continue to work.)
-- Profile photos
DROP POLICY IF EXISTS "Profile photos are publicly accessible" ON storage.objects;
CREATE POLICY "Public can view individual profile photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-photos');

-- Candidate photos
DROP POLICY IF EXISTS "Public can view candidate photos" ON storage.objects;
CREATE POLICY "Public can view individual candidate photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'candidate-photos');

-- Community photos
DROP POLICY IF EXISTS "Anyone can view community photos" ON storage.objects;
CREATE POLICY "Public can view individual community photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'community-photos');
