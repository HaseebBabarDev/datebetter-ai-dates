-- Enable realtime for community direct messages (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_rel pr ON pr.prpubid = p.oid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;
