-- ============================================================
-- VILLAGE APP — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_letter text default 'V',
  avatar_color text default '135deg,#007aff,#5856d6',
  avatar_url text,
  banner_url text,
  bio text default '',
  verified boolean default false,
  followers_count integer default 0,
  following_count integer default 0,
  posts_count integer default 0,
  created_at timestamptz default now()
);

-- ── POSTS ──────────────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  media_emoji text,
  media_url text,
  chatroom_tag text,
  likes_count integer default 0,
  comments_count integer default 0,
  reposts_count integer default 0,
  created_at timestamptz default now()
);

-- ── POST LIKES ─────────────────────────────────────────────
create table if not exists post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ── POST COMMENTS ──────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ── CHATROOMS ──────────────────────────────────────────────
create table if not exists chatrooms (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text default '',
  icon text default 'chat',
  color text default '135deg,#6c47ff,#ff5c8d',
  topic text default 'General',
  members_count integer default 1,
  is_live boolean default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ── CHATROOM MESSAGES ──────────────────────────────────────
create table if not exists chatroom_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references chatrooms(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ── DIRECT MESSAGES ───────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  last_message text default '',
  last_message_at timestamptz default now(),
  user1_unread integer default 0,
  user2_unread integer default 0,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

create table if not exists direct_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ── ARTWORKS ───────────────────────────────────────────────
create table if not exists artworks (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  emoji text default 'palette',
  gradient text default '135deg,#1a0533,#2d1060',
  price_usd numeric(10,2) not null,
  category text default 'Digital',
  likes_count integer default 0,
  is_sold boolean default false,
  created_at timestamptz default now()
);

-- ── ARTWORK LIKES ──────────────────────────────────────────
create table if not exists artwork_likes (
  id uuid primary key default uuid_generate_v4(),
  artwork_id uuid references artworks(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(artwork_id, user_id)
);

-- ── FOLLOWS ────────────────────────────────────────────────
create table if not exists follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- ── NEWS (curated/static) ──────────────────────────────────
create table if not exists news_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  source text not null,
  emoji text default 'globe',
  preview text default '',
  url text default '' unique,
  image_url text,
  is_featured boolean default false,
  published_at timestamptz default now()
);

-- ── SAVED ITEMS ────────────────────────────────────────────
create table if not exists saved_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  item_type text not null check (item_type in ('post','artwork','news')),
  item_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, item_type, item_id)
);

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;
alter table chatrooms enable row level security;
alter table chatroom_messages enable row level security;
alter table conversations enable row level security;
alter table direct_messages enable row level security;
alter table artworks enable row level security;
alter table artwork_likes enable row level security;
alter table follows enable row level security;
alter table news_articles enable row level security;
alter table saved_items enable row level security;

-- Profiles: public read, own write
create policy "Profiles are public" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Posts: public read, auth write
create policy "Posts are public" on posts for select using (true);
create policy "Auth users can post" on posts for insert with check (auth.uid() = author_id);
create policy "Authors can delete posts" on posts for delete using (auth.uid() = author_id);

-- Post likes
create policy "Likes are public" on post_likes for select using (true);
create policy "Auth users can like" on post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on post_likes for delete using (auth.uid() = user_id);

-- Comments
create policy "Comments are public" on comments for select using (true);
create policy "Auth users can comment" on comments for insert with check (auth.uid() = author_id);
create policy "Authors can delete comments" on comments for delete using (auth.uid() = author_id);

-- Chatrooms: public read, auth create
create policy "Chatrooms are public" on chatrooms for select using (true);
create policy "Auth users can create rooms" on chatrooms for insert with check (auth.uid() = created_by);

-- Chatroom messages: public read, auth write
create policy "CR messages are public" on chatroom_messages for select using (true);
create policy "Auth users can send CR messages" on chatroom_messages for insert with check (auth.uid() = author_id);

-- Conversations: participants only
create policy "Conversation participants can view" on conversations for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Auth users can create conversations" on conversations for insert with check (auth.uid() = user1_id);
create policy "Participants can update conversations" on conversations for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Direct messages: participants only
create policy "DM participants can view" on direct_messages for select
  using (exists (select 1 from conversations c where c.id = conversation_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid())));
create policy "Auth users can send DMs" on direct_messages for insert with check (auth.uid() = sender_id);

-- Artworks: public read, auth write
create policy "Artworks are public" on artworks for select using (true);
create policy "Auth users can list artworks" on artworks for insert with check (auth.uid() = artist_id);
create policy "Artists can update artworks" on artworks for update using (auth.uid() = artist_id);

-- Artwork likes
create policy "Artwork likes are public" on artwork_likes for select using (true);
create policy "Auth users can like artworks" on artwork_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike artworks" on artwork_likes for delete using (auth.uid() = user_id);

-- Follows
create policy "Follows are public" on follows for select using (true);
create policy "Auth users can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);

-- News: public read, no public write
create policy "News is public" on news_articles for select using (true);

-- Saved items: own only
create policy "Users can view own saves" on saved_items for select using (auth.uid() = user_id);
create policy "Users can save items" on saved_items for insert with check (auth.uid() = user_id);
create policy "Users can unsave items" on saved_items for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, display_name, avatar_letter)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(substr(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1, 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Update post like count
create or replace function update_post_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;
create or replace trigger post_likes_count_trigger
  after insert or delete on post_likes
  for each row execute procedure update_post_likes_count();

-- Update post comment count
create or replace function update_comment_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comments_count = comments_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;
create or replace trigger comment_count_trigger
  after insert or delete on comments
  for each row execute procedure update_comment_count();

-- Update artwork like count
create or replace function update_artwork_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update artworks set likes_count = likes_count + 1 where id = new.artwork_id;
  elsif tg_op = 'DELETE' then
    update artworks set likes_count = likes_count - 1 where id = old.artwork_id;
  end if;
  return null;
end;
$$;
create or replace trigger artwork_likes_count_trigger
  after insert or delete on artwork_likes
  for each row execute procedure update_artwork_likes_count();

-- ─────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────

insert into chatrooms (name, description, icon, color, topic, members_count, is_live, created_by) values
  ('TechFuture','Discussions on emerging technology and innovation','rocket','135deg,#6c47ff,#00c8a0','Technology',2800,true,null),
  ('ArtVillage','Share and critique digital artwork from the community','palette','135deg,#ff5c8d,#ff8c42','Art',4100,true,null),
  ('GlobalMind','World news, politics and geopolitical analysis','globe','135deg,#00c8a0,#6c47ff','Politics',6300,true,null),
  ('StartupLounge','Founders, investors, and builders talking shop','briefcase','135deg,#ff8c42,#ff5c8d','Business',1900,false,null),
  ('SoundWave','Music discovery, production tips, and collabs','music','135deg,#6c47ff,#ff5c8d','Entertainment',3400,false,null),
  ('SportsPulse','Live match discussions, stats, and hot takes','trophy','135deg,#ff5c8d,#6c47ff','Sports',8700,true,null)
on conflict (name) do nothing;

-- ─────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────
-- Run these to create storage buckets for images

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images', 'post-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('artwork-images', 'artwork-images', true, 20971520, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- Storage policies: public read
create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "Post images are publicly accessible"
  on storage.objects for select using (bucket_id = 'post-images');
create policy "Artwork images are publicly accessible"
  on storage.objects for select using (bucket_id = 'artwork-images');

-- Storage policies: auth write (own folder)
create policy "Users can upload their own avatar"
  on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own avatar"
  on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can upload post images"
  on storage.objects for insert with check (bucket_id = 'post-images' and auth.uid() is not null);
create policy "Users can upload artwork images"
  on storage.objects for insert with check (bucket_id = 'artwork-images' and auth.uid() is not null);

-- ─────────────────────────────────────────────────────────
-- MIGRATION: Add columns if upgrading from v1
-- (safe to run even if columns already exist)
-- ─────────────────────────────────────────────────────────
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists banner_url text;
alter table posts add column if not exists media_url text;
alter table news_articles add column if not exists image_url text;
alter table news_articles add column if not exists url text default '';
-- Add unique constraint on news url (needed for upsert)
do $$ begin
  alter table news_articles add constraint news_articles_url_key unique (url);
exception when duplicate_object then null;
end $$;

insert into news_articles (title, category, source, emoji, preview, is_featured, published_at) values
  ('AI Surpasses Human Experts in Complex Medical Diagnoses Worldwide','Technology','TechCrunch','robot','The latest models demonstrate near-human performance across all tested domains.',true, now() - interval '2 hours'),
  ('OpenAI Releases GPT-7 with Unprecedented Reasoning Capabilities','Technology','The Verge','zap','The latest model demonstrates near-human performance across all tested domains.',false, now() - interval '1 hour'),
  ('Global Markets Hit Record Highs as Tech Sector Leads Rally','Business','Bloomberg','trending','Investors remain bullish despite ongoing geopolitical tensions worldwide.',false, now() - interval '2 hours'),
  ('Digital Art Sales Surpass Traditional Art Auction Records','Art','Artnet','palette','A single generative art piece sold for $28 million at a major auction.',false, now() - interval '3 hours'),
  ('World Cup 2026 Ticket Prices Announced, Demand Overwhelms Servers','Sports','ESPN','trophy','Record interest from 200 countries as the USA, Mexico, Canada host.',false, now() - interval '4 hours'),
  ('Streaming Wars Intensify as Three Major Platforms Merge','Entertainment','Variety','film','The combined entity will have access to over 500 million subscribers.',false, now() - interval '5 hours'),
  ('UN Climate Summit Reaches Historic 150-Nation Agreement','Politics','Reuters','globe','The binding accord sets net-zero targets for 2040, five years ahead of schedule.',false, now() - interval '6 hours'),
  ('Solid-State Battery Breakthrough Promises 1000-Mile EV Range','Technology','TechCrunch','zap','A startup claims their new battery chemistry is 3x more energy-dense.',false, now() - interval '7 hours'),
  ('Remote Work Becomes Standard at Fortune 500 Companies','Business','WSJ','briefcase','Survey shows 78% of major corporations now offer fully remote positions.',false, now() - interval '8 hours')
on conflict do nothing;
