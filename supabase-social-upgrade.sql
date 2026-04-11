-- ============================================================
-- CC SOCIAL SYSTEM — FULL UPGRADE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── 1. ADD MISSING COLUMNS ───────────────────────────────

-- posts table additions
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposts_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposted_from UUID REFERENCES posts(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- profiles table additions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;


-- ─── 2. CREATE TABLES ─────────────────────────────────────

-- likes (post_likes may already exist — this is a clean alias)
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- reposts
CREATE TABLE IF NOT EXISTS reposts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- follows
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('like','comment','reply','repost','follow','save','mention')),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- comments (ensure exists)
CREATE TABLE IF NOT EXISTS comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT now()
);


-- ─── 3. INDEXES ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_post_likes_post    ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user    ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post       ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user       ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower   ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread      ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comments_post      ON comments(post_id);


-- ─── 4. RLS POLICIES ──────────────────────────────────────

ALTER TABLE post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;

-- post_likes
DROP POLICY IF EXISTS "read_likes"   ON post_likes;
DROP POLICY IF EXISTS "insert_likes" ON post_likes;
DROP POLICY IF EXISTS "delete_likes" ON post_likes;
CREATE POLICY "read_likes"   ON post_likes FOR SELECT USING (true);
CREATE POLICY "insert_likes" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- reposts
DROP POLICY IF EXISTS "read_reposts"   ON reposts;
DROP POLICY IF EXISTS "insert_reposts" ON reposts;
DROP POLICY IF EXISTS "delete_reposts" ON reposts;
CREATE POLICY "read_reposts"   ON reposts FOR SELECT USING (true);
CREATE POLICY "insert_reposts" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_reposts" ON reposts FOR DELETE USING (auth.uid() = user_id);

-- follows
DROP POLICY IF EXISTS "read_follows"   ON follows;
DROP POLICY IF EXISTS "insert_follows" ON follows;
DROP POLICY IF EXISTS "delete_follows" ON follows;
CREATE POLICY "read_follows"   ON follows FOR SELECT USING (true);
CREATE POLICY "insert_follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "delete_follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- notifications
DROP POLICY IF EXISTS "read_notifs"   ON notifications;
DROP POLICY IF EXISTS "insert_notifs" ON notifications;
DROP POLICY IF EXISTS "update_notifs" ON notifications;
CREATE POLICY "read_notifs"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_notifs" ON notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "update_notifs" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- comments
DROP POLICY IF EXISTS "read_comments"   ON comments;
DROP POLICY IF EXISTS "insert_comments" ON comments;
DROP POLICY IF EXISTS "delete_comments" ON comments;
CREATE POLICY "read_comments"   ON comments FOR SELECT USING (true);
CREATE POLICY "insert_comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "delete_comments" ON comments FOR DELETE USING (auth.uid() = author_id);


-- ─── 5. TRIGGER FUNCTIONS ─────────────────────────────────

-- likes_count sync
CREATE OR REPLACE FUNCTION sync_likes_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- reposts_count sync
CREATE OR REPLACE FUNCTION sync_reposts_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- comments_count sync
CREATE OR REPLACE FUNCTION sync_comments_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- followers/following counts sync
CREATE OR REPLACE FUNCTION sync_follow_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 6. ATTACH TRIGGERS ───────────────────────────────────

DROP TRIGGER IF EXISTS trg_likes_count   ON post_likes;
DROP TRIGGER IF EXISTS trg_reposts_count ON reposts;
DROP TRIGGER IF EXISTS trg_comments_count ON comments;
DROP TRIGGER IF EXISTS trg_follow_counts ON follows;

CREATE TRIGGER trg_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION sync_likes_count();

CREATE TRIGGER trg_reposts_count
  AFTER INSERT OR DELETE ON reposts
  FOR EACH ROW EXECUTE FUNCTION sync_reposts_count();

CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION sync_comments_count();

CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION sync_follow_counts();


-- ─── 7. REALTIME ──────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE reposts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;


-- ─── 8. HELPER RPCs (optional) ────────────────────────────

CREATE OR REPLACE FUNCTION increment_followers_count(target_id UUID)
RETURNS void AS $$
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = target_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_followers_count(target_id UUID)
RETURNS void AS $$
  UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = target_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_following_count(target_id UUID)
RETURNS void AS $$
  UPDATE profiles SET following_count = following_count + 1 WHERE id = target_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_following_count(target_id UUID)
RETURNS void AS $$
  UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = target_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── DONE ─────────────────────────────────────────────────
-- After running, go to Supabase > Realtime > Tables
-- and enable all tables above for realtime events.
