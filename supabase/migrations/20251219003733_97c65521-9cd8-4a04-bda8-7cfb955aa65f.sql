-- Add screen_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS screen_name text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS screen_name_set_at timestamp with time zone;

-- Create forum categories enum
CREATE TYPE public.forum_category AS ENUM ('dating_advice', 'red_flag_warnings', 'success_stories', 'self_care_healing');

-- Create forum posts table
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category forum_category NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_approved boolean DEFAULT true,
  moderation_status text DEFAULT 'approved',
  moderation_reason text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create forum comments table
CREATE TABLE public.forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_approved boolean DEFAULT true,
  moderation_status text DEFAULT 'approved',
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.forum_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment likes table
CREATE TABLE public.forum_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create direct messages table
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  moderation_status text DEFAULT 'approved',
  created_at timestamp with time zone DEFAULT now()
);

-- Create user blocks table
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Forum posts policies
CREATE POLICY "Anyone can view approved posts" ON public.forum_posts
  FOR SELECT USING (is_approved = true AND moderation_status = 'approved');

CREATE POLICY "Users can view own posts" ON public.forum_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Forum comments policies
CREATE POLICY "Anyone can view approved comments" ON public.forum_comments
  FOR SELECT USING (is_approved = true AND moderation_status = 'approved');

CREATE POLICY "Users can view own comments" ON public.forum_comments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comments" ON public.forum_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.forum_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Anyone can view post likes" ON public.forum_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON public.forum_post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes" ON public.forum_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comment likes" ON public.forum_comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Direct messages policies
CREATE POLICY "Users can view own messages" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update read status" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- User blocks policies
CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage own blocks" ON public.user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- Create function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON public.forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();