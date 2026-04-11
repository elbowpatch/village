-- ============================================================
-- RENDEZVOUS — COMPLETE SUPABASE SCHEMA
-- Run each numbered block one at a time in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- ============================================================
-- BLOCK 1: EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast text search


-- ============================================================
-- BLOCK 2: DROP ALL EXISTING POLICIES (safe re-run)
-- ============================================================
do $$ declare
  r record;
begin
  for r in (select policyname, tablename from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Post images are publicly accessible" on storage.objects;
drop policy if exists "Artwork images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can upload post images" on storage.objects;
drop policy if exists "Users can upload artwork images" on storage.objects;
drop policy if exists "Banner images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload banners" on storage.objects;


-- ============================================================
-- BLOCK 3: PROFILES TABLE
-- ============================================================
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique not null,
  display_name     text not null,
  avatar_letter    text default 'R',
  avatar_color     text default '135deg,#7c3aed,#db2777',
  avatar_url       text,
  banner_url       text,
  bio              text default '',
  website          text default '',
  location         text default '',
  verified         boolean default false,
  followers_count  integer default 0,
  following_count  integer default 0,
  posts_count      integer default 0,
  created_at       timestamptz default now()
);

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists banner_url text;
alter table profiles add column if not exists website text default '';
alter table profiles add column if not exists location text default '';

alter table profiles enable row level security;

create policy "Profiles are public"          on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, avatar_letter)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    upper(substr(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1, 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
-- BLOCK 4: FOLLOWS TABLE
-- ============================================================
create table if not exists follows (
  id          uuid primary key default uuid_generate_v4(),
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(follower_id, following_id)
);

create index if not exists follows_follower_idx  on follows(follower_id);
create index if not exists follows_following_idx on follows(following_id);

alter table follows enable row level security;
create policy "Follows are public"    on follows for select using (true);
create policy "Auth users can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow"    on follows for delete using (auth.uid() = follower_id);

-- Triggers: keep followers_count / following_count accurate
create or replace function update_follow_counts()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update profiles set followers_count  = followers_count  + 1 where id = new.following_id;
    update profiles set following_count  = following_count  + 1 where id = new.follower_id;
  elsif tg_op = 'DELETE' then
    update profiles set followers_count  = greatest(followers_count  - 1, 0) where id = old.following_id;
    update profiles set following_count  = greatest(following_count  - 1, 0) where id = old.follower_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follow_counts_trigger on follows;
create trigger follow_counts_trigger
  after insert or delete on follows
  for each row execute function update_follow_counts();


-- ============================================================
-- BLOCK 5: POSTS TABLE
-- ============================================================
create sequence if not exists posts_slug_seq start 1;

create table if not exists posts (
  id             uuid primary key default uuid_generate_v4(),
  slug           integer unique,
  author_id      uuid references profiles(id) on delete cascade not null,
  content        text not null,
  media_emoji    text,
  media_url      text,
  media_urls     text[],
  chatroom_tag   text,
  likes_count    integer default 0,
  comments_count integer default 0,
  reposts_count  integer default 0,
  saves_count    integer default 0,
  created_at     timestamptz default now()
);

alter table posts add column if not exists media_url  text;
alter table posts add column if not exists media_urls text[];
alter table posts add column if not exists saves_count integer default 0;
alter table posts add column if not exists slug integer unique;

create index if not exists posts_author_idx    on posts(author_id);
create index if not exists posts_created_idx   on posts(created_at desc);
create index if not exists posts_slug_idx      on posts(slug);
create index if not exists posts_content_trgm  on posts using gin(content gin_trgm_ops);

alter table posts enable row level security;
create policy "Posts are public"      on posts for select using (true);
create policy "Auth users can post"   on posts for insert with check (auth.uid() = author_id);
create policy "Authors can update posts" on posts for update using (auth.uid() = author_id);
create policy "Authors can delete posts" on posts for delete using (auth.uid() = author_id);

-- Auto-assign sequential slug
create or replace function assign_post_slug()
returns trigger language plpgsql as $$
begin
  new.slug := nextval('posts_slug_seq');
  return new;
end;
$$;

drop trigger if exists assign_post_slug_trigger on posts;
create trigger assign_post_slug_trigger
  before insert on posts
  for each row when (new.slug is null)
  execute function assign_post_slug();

-- Trigger: keep posts_count on profiles accurate
create or replace function update_posts_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update profiles set posts_count = posts_count + 1 where id = new.author_id;
  elsif tg_op = 'DELETE' then
    update profiles set posts_count = greatest(posts_count - 1, 0) where id = old.author_id;
  end if;
  return null;
end;
$$;

drop trigger if exists posts_count_trigger on posts;
create trigger posts_count_trigger
  after insert or delete on posts
  for each row execute function update_posts_count();

-- Backfill slugs for existing posts (safe to re-run)
do $$
declare r record; n integer := 1;
begin
  for r in select id from posts where slug is null order by created_at asc loop
    update posts set slug = nextval('posts_slug_seq') where id = r.id;
  end loop;
end;
$$;


-- ============================================================
-- BLOCK 6: POST LIKES
-- ============================================================
create table if not exists post_likes (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid references posts(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create index if not exists post_likes_post_idx on post_likes(post_id);
create index if not exists post_likes_user_idx on post_likes(user_id);

alter table post_likes enable row level security;
create policy "Likes are public"     on post_likes for select using (true);
create policy "Auth users can like"  on post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike"     on post_likes for delete using (auth.uid() = user_id);

create or replace function update_post_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_count_trigger on post_likes;
create trigger post_likes_count_trigger
  after insert or delete on post_likes
  for each row execute function update_post_likes_count();


-- ============================================================
-- BLOCK 7: REPOSTS
-- ============================================================
create table if not exists reposts (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid references posts(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create index if not exists reposts_post_idx on reposts(post_id);
create index if not exists reposts_user_idx on reposts(user_id);

alter table reposts enable row level security;
create policy "Reposts are public"      on reposts for select using (true);
create policy "Auth users can repost"   on reposts for insert with check (auth.uid() = user_id);
create policy "Users can un-repost"     on reposts for delete using (auth.uid() = user_id);

create or replace function update_reposts_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set reposts_count = reposts_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set reposts_count = greatest(reposts_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists reposts_count_trigger on reposts;
create trigger reposts_count_trigger
  after insert or delete on reposts
  for each row execute function update_reposts_count();


-- ============================================================
-- BLOCK 8: COMMENTS
-- ============================================================
create table if not exists comments (
  id                uuid primary key default uuid_generate_v4(),
  post_id           uuid references posts(id) on delete cascade not null,
  author_id         uuid references profiles(id) on delete cascade not null,
  content           text not null,
  parent_comment_id uuid references comments(id) on delete cascade,
  quoted_content    text,
  quoted_author     text,
  likes_count       integer default 0,
  created_at        timestamptz default now()
);

alter table comments add column if not exists parent_comment_id uuid references comments(id) on delete cascade;
alter table comments add column if not exists quoted_content text;
alter table comments add column if not exists quoted_author text;
alter table comments add column if not exists likes_count integer default 0;

create index if not exists comments_post_idx    on comments(post_id);
create index if not exists comments_author_idx  on comments(author_id);
create index if not exists comments_parent_idx  on comments(parent_comment_id);

alter table comments enable row level security;
create policy "Comments are public"         on comments for select using (true);
create policy "Auth users can comment"      on comments for insert with check (auth.uid() = author_id);
create policy "Authors can delete comments" on comments for delete using (auth.uid() = author_id);
create policy "Authors can update comments" on comments for update using (auth.uid() = author_id);

create or replace function update_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_count_trigger on comments;
create trigger comments_count_trigger
  after insert or delete on comments
  for each row execute function update_comments_count();


-- ============================================================
-- BLOCK 9: SAVED ITEMS (Bookmarks)
-- ============================================================
create table if not exists saved_items (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade not null,
  item_type  text not null check (item_type in ('post','artwork','news')),
  item_id    uuid not null,
  created_at timestamptz default now(),
  unique(user_id, item_type, item_id)
);

create index if not exists saved_items_user_idx on saved_items(user_id);
create index if not exists saved_items_item_idx on saved_items(item_id);

alter table saved_items enable row level security;
create policy "Users can view own saves" on saved_items for select using (auth.uid() = user_id);
create policy "Users can save items"     on saved_items for insert with check (auth.uid() = user_id);
create policy "Users can unsave items"   on saved_items for delete using (auth.uid() = user_id);

-- Keep saves_count on posts accurate
create or replace function update_post_saves_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.item_type = 'post' then
    update posts set saves_count = saves_count + 1 where id = new.item_id;
  elsif tg_op = 'DELETE' and old.item_type = 'post' then
    update posts set saves_count = greatest(saves_count - 1, 0) where id = old.item_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_saves_count_trigger on saved_items;
create trigger post_saves_count_trigger
  after insert or delete on saved_items
  for each row execute function update_post_saves_count();


-- ============================================================
-- BLOCK 10: NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade not null,  -- recipient
  actor_id   uuid references profiles(id) on delete cascade,           -- who triggered it
  type       text not null check (type in ('like','comment','reply','follow','save','mention','repost')),
  post_id    uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  is_read    boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx    on notifications(user_id, is_read, created_at desc);
create index if not exists notifications_actor_idx   on notifications(actor_id);

alter table notifications enable row level security;
create policy "Users see own notifications"   on notifications for select using (auth.uid() = user_id);
create policy "System can insert notifs"      on notifications for insert with check (true);
create policy "Users can mark read"           on notifications for update using (auth.uid() = user_id);
create policy "Users can delete own notifs"   on notifications for delete using (auth.uid() = user_id);

-- Auto-notify on like
create or replace function notify_on_like()
returns trigger language plpgsql as $$
declare post_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into notifications(user_id, actor_id, type, post_id)
    values (post_author, new.user_id, 'like', new.post_id)
    on conflict do nothing;
  end if;
  return null;
end;
$$;

drop trigger if exists notify_like_trigger on post_likes;
create trigger notify_like_trigger
  after insert on post_likes
  for each row execute function notify_on_like();

-- Auto-notify on comment
create or replace function notify_on_comment()
returns trigger language plpgsql as $$
declare post_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into notifications(user_id, actor_id, type, post_id, comment_id)
    values (post_author, new.author_id, 'comment', new.post_id, new.id);
  end if;
  -- notify parent comment author if this is a reply
  if new.parent_comment_id is not null then
    declare parent_author uuid;
    begin
      select author_id into parent_author from comments where id = new.parent_comment_id;
      if parent_author is not null and parent_author <> new.author_id then
        insert into notifications(user_id, actor_id, type, post_id, comment_id)
        values (parent_author, new.author_id, 'reply', new.post_id, new.id);
      end if;
    end;
  end if;
  return null;
end;
$$;

drop trigger if exists notify_comment_trigger on comments;
create trigger notify_comment_trigger
  after insert on comments
  for each row execute function notify_on_comment();

-- Auto-notify on follow
create or replace function notify_on_follow()
returns trigger language plpgsql as $$
begin
  insert into notifications(user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow')
  on conflict do nothing;
  return null;
end;
$$;

drop trigger if exists notify_follow_trigger on follows;
create trigger notify_follow_trigger
  after insert on follows
  for each row execute function notify_on_follow();

-- Auto-notify on repost
create or replace function notify_on_repost()
returns trigger language plpgsql as $$
declare post_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into notifications(user_id, actor_id, type, post_id)
    values (post_author, new.user_id, 'repost', new.post_id)
    on conflict do nothing;
  end if;
  return null;
end;
$$;

drop trigger if exists notify_repost_trigger on reposts;
create trigger notify_repost_trigger
  after insert on reposts
  for each row execute function notify_on_repost();

-- Auto-notify on save
create or replace function notify_on_save()
returns trigger language plpgsql as $$
declare post_author uuid;
begin
  if new.item_type = 'post' then
    select author_id into post_author from posts where id = new.item_id;
    if post_author is not null and post_author <> new.user_id then
      insert into notifications(user_id, actor_id, type, post_id)
      values (post_author, new.user_id, 'save', new.item_id)
      on conflict do nothing;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists notify_save_trigger on saved_items;
create trigger notify_save_trigger
  after insert on saved_items
  for each row execute function notify_on_save();


-- ============================================================
-- BLOCK 11: CHATROOMS (Group Chat / Chambers)
-- ============================================================
create table if not exists chatrooms (
  id           uuid primary key default uuid_generate_v4(),
  name         text unique not null,
  description  text default '',
  icon         text default 'chat',
  color        text default '135deg,#7c3aed,#db2777',
  topic        text default 'General',
  members_count integer default 1,
  is_live      boolean default false,
  photo_url    text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz default now()
);

alter table chatrooms add column if not exists photo_url text;

alter table chatrooms enable row level security;
create policy "Chatrooms are public"       on chatrooms for select using (true);
create policy "Auth users can create rooms" on chatrooms for insert with check (auth.uid() = created_by);
create policy "Room creators can update"   on chatrooms for update using (auth.uid() = created_by);
create policy "Room creators can delete"   on chatrooms for delete using (auth.uid() = created_by);


-- ============================================================
-- BLOCK 12: CHATROOM MEMBERS
-- ============================================================
create table if not exists chatroom_members (
  id        uuid primary key default uuid_generate_v4(),
  room_id   uuid references chatrooms(id) on delete cascade not null,
  user_id   uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

create index if not exists chatroom_members_room_idx on chatroom_members(room_id);
create index if not exists chatroom_members_user_idx on chatroom_members(user_id);

alter table chatroom_members enable row level security;
create policy "Members are public"   on chatroom_members for select using (true);
create policy "Auth users can join"  on chatroom_members for insert with check (auth.uid() = user_id);
create policy "Users can leave"      on chatroom_members for delete using (auth.uid() = user_id);

-- Keep members_count accurate
create or replace function update_room_member_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update chatrooms set members_count = members_count + 1 where id = new.room_id;
  elsif tg_op = 'DELETE' then
    update chatrooms set members_count = greatest(members_count - 1, 0) where id = old.room_id;
  end if;
  return null;
end;
$$;

drop trigger if exists room_member_count_trigger on chatroom_members;
create trigger room_member_count_trigger
  after insert or delete on chatroom_members
  for each row execute function update_room_member_count();


-- ============================================================
-- BLOCK 13: CHATROOM MESSAGES
-- ============================================================
create table if not exists chatroom_messages (
  id         uuid primary key default uuid_generate_v4(),
  room_id    uuid references chatrooms(id) on delete cascade not null,
  author_id  uuid references profiles(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz default now()
);

create index if not exists chatroom_messages_room_idx     on chatroom_messages(room_id, created_at desc);
create index if not exists chatroom_messages_author_idx   on chatroom_messages(author_id);

alter table chatroom_messages enable row level security;
create policy "CR messages are public"       on chatroom_messages for select using (true);
create policy "Auth users can send CR msgs"  on chatroom_messages for insert with check (auth.uid() = author_id);
create policy "Authors can delete CR msgs"   on chatroom_messages for delete using (auth.uid() = author_id);


-- ============================================================
-- BLOCK 14: DIRECT MESSAGES
-- ============================================================
create table if not exists conversations (
  id              uuid primary key default uuid_generate_v4(),
  user1_id        uuid references profiles(id) on delete cascade not null,
  user2_id        uuid references profiles(id) on delete cascade not null,
  last_message    text default '',
  last_message_at timestamptz default now(),
  user1_unread    integer default 0,
  user2_unread    integer default 0,
  created_at      timestamptz default now(),
  unique(user1_id, user2_id)
);

create index if not exists conversations_user1_idx on conversations(user1_id);
create index if not exists conversations_user2_idx on conversations(user2_id);

alter table conversations enable row level security;
create policy "Conversation participants can view"   on conversations for select  using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Auth users can create conversations"  on conversations for insert  with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Participants can update conversations" on conversations for update  using (auth.uid() = user1_id or auth.uid() = user2_id);

create table if not exists direct_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id       uuid references profiles(id) on delete cascade not null,
  content         text not null,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

alter table direct_messages add column if not exists is_read boolean default false;

create index if not exists dm_convo_idx  on direct_messages(conversation_id, created_at desc);
create index if not exists dm_sender_idx on direct_messages(sender_id);

alter table direct_messages enable row level security;
create policy "DM participants can view" on direct_messages for select
  using (exists (
    select 1 from conversations c
    where c.id = direct_messages.conversation_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  ));
create policy "Auth users can send DMs" on direct_messages for insert
  with check (auth.uid() = sender_id);
create policy "Senders can delete DMs"  on direct_messages for delete using (auth.uid() = sender_id);

-- Auto-update conversation on new DM
create or replace function update_conversation_on_dm()
returns trigger language plpgsql as $$
begin
  update conversations
  set
    last_message = new.content,
    last_message_at = new.created_at,
    user1_unread = case when user2_id = new.sender_id then user1_unread + 1 else user1_unread end,
    user2_unread = case when user1_id = new.sender_id then user2_unread + 1 else user2_unread end
  where id = new.conversation_id;
  return null;
end;
$$;

drop trigger if exists update_conversation_trigger on direct_messages;
create trigger update_conversation_trigger
  after insert on direct_messages
  for each row execute function update_conversation_on_dm();


-- ============================================================
-- BLOCK 15: ARTWORKS & ARTWORK LIKES
-- ============================================================
create table if not exists artworks (
  id          uuid primary key default uuid_generate_v4(),
  artist_id   uuid references profiles(id) on delete cascade not null,
  title       text not null,
  description text default '',
  emoji       text default 'palette',
  gradient    text default '135deg,#1a0533,#2d1060',
  image_url   text,
  price_usd   numeric(10,2) not null,
  category    text default 'Digital',
  likes_count integer default 0,
  is_sold     boolean default false,
  created_at  timestamptz default now()
);

alter table artworks add column if not exists image_url text;

create index if not exists artworks_artist_idx   on artworks(artist_id);
create index if not exists artworks_created_idx  on artworks(created_at desc);

alter table artworks enable row level security;
create policy "Artworks are public"          on artworks for select using (true);
create policy "Auth users can list artworks" on artworks for insert with check (auth.uid() = artist_id);
create policy "Artists can update artworks"  on artworks for update using (auth.uid() = artist_id);
create policy "Artists can delete artworks"  on artworks for delete using (auth.uid() = artist_id);

create table if not exists artwork_likes (
  id         uuid primary key default uuid_generate_v4(),
  artwork_id uuid references artworks(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(artwork_id, user_id)
);

create index if not exists artwork_likes_art_idx  on artwork_likes(artwork_id);
create index if not exists artwork_likes_user_idx on artwork_likes(user_id);

alter table artwork_likes enable row level security;
create policy "Artwork likes are public"      on artwork_likes for select using (true);
create policy "Auth users can like artworks"  on artwork_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike artworks"     on artwork_likes for delete using (auth.uid() = user_id);

create or replace function update_artwork_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update artworks set likes_count = likes_count + 1 where id = new.artwork_id;
  elsif tg_op = 'DELETE' then
    update artworks set likes_count = greatest(likes_count - 1, 0) where id = old.artwork_id;
  end if;
  return null;
end;
$$;

drop trigger if exists artwork_likes_count_trigger on artwork_likes;
create trigger artwork_likes_count_trigger
  after insert or delete on artwork_likes
  for each row execute function update_artwork_likes_count();


-- ============================================================
-- BLOCK 16: NEWS ARTICLES
-- ============================================================
create table if not exists news_articles (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  category     text not null,
  source       text default '',
  emoji        text default 'globe',
  preview      text default '',
  url          text unique default '',
  image_url    text,
  is_featured  boolean default false,
  published_at timestamptz default now()
);

alter table news_articles add column if not exists image_url text;
alter table news_articles add column if not exists url text default '';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'news_articles_url_key') then
    alter table news_articles add constraint news_articles_url_key unique (url);
  end if;
end $$;

create index if not exists news_category_idx    on news_articles(category);
create index if not exists news_published_idx   on news_articles(published_at desc);
create index if not exists news_featured_idx    on news_articles(is_featured);
create index if not exists news_title_trgm      on news_articles using gin(title gin_trgm_ops);

alter table news_articles enable row level security;
create policy "News is public"           on news_articles for select using (true);
create policy "Service role can upsert"  on news_articles for insert with check (true);
create policy "Service role can update"  on news_articles for update using (true);


-- ============================================================
-- BLOCK 17: GLOBAL SEARCH VIEW (posts + profiles)
-- ============================================================
create or replace view search_results as
  select
    'post'      as type,
    p.id        as id,
    p.content   as text,
    p.created_at,
    pr.display_name as author_name,
    pr.username     as author_username,
    pr.avatar_url   as author_avatar,
    p.likes_count   as score
  from posts p
  join profiles pr on pr.id = p.author_id
  union all
  select
    'profile'       as type,
    pr.id           as id,
    pr.display_name as text,
    pr.created_at,
    pr.display_name as author_name,
    pr.username     as author_username,
    pr.avatar_url   as author_avatar,
    pr.followers_count as score
  from profiles pr;


-- ============================================================
-- BLOCK 18: REALTIME — ENABLE FOR ALL KEY TABLES
-- (Run in Supabase Dashboard → Database → Replication too)
-- ============================================================
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table post_likes;
alter publication supabase_realtime add table reposts;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table saved_items;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table chatroom_messages;
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table follows;
alter publication supabase_realtime add table profiles;


-- ============================================================
-- BLOCK 19: STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 5242880,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images',    'post-images',    true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','video/mp4']),
  ('artwork-images', 'artwork-images', true, 20971520, array['image/jpeg','image/png','image/webp','image/gif']),
  ('banners',        'banners',        true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Public read
create policy "Avatar images are publicly accessible"  on storage.objects for select using (bucket_id = 'avatars');
create policy "Post images are publicly accessible"    on storage.objects for select using (bucket_id = 'post-images');
create policy "Artwork images are publicly accessible" on storage.objects for select using (bucket_id = 'artwork-images');
create policy "Banner images are publicly accessible"  on storage.objects for select using (bucket_id = 'banners');

-- Auth write
create policy "Users can upload their own avatar"
  on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own avatar"
  on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can upload post images"
  on storage.objects for insert with check (bucket_id = 'post-images' and auth.uid() is not null);
create policy "Users can upload artwork images"
  on storage.objects for insert with check (bucket_id = 'artwork-images' and auth.uid() is not null);
create policy "Users can upload banners"
  on storage.objects for insert with check (bucket_id = 'banners' and auth.uid() is not null);


-- ============================================================
-- BLOCK 20: SEED DATA — CHATROOMS
-- ============================================================
insert into chatrooms (name, description, icon, color, topic, members_count, is_live, created_by) values
  ('TechFuture',    'Emerging technology and innovation',          'rocket',    '135deg,#7c3aed,#00c8a0', 'Technology',   2800, true,  null),
  ('ArtHouse',      'Share and critique digital artwork',          'palette',   '135deg,#db2777,#ff8c42', 'Art',          4100, true,  null),
  ('GlobalMind',    'World news, politics and geopolitical takes', 'globe',     '135deg,#00c8a0,#7c3aed', 'Politics',     6300, true,  null),
  ('StartupLounge', 'Founders, investors, and builders',           'briefcase', '135deg,#ff8c42,#db2777', 'Business',     1900, false, null),
  ('SoundWave',     'Music discovery, production tips and collabs','music',     '135deg,#7c3aed,#db2777', 'Entertainment',3400, false, null),
  ('SportsPulse',   'Live match discussions and hot takes',        'trophy',    '135deg,#db2777,#7c3aed', 'Sports',       8700, true,  null)
on conflict (name) do nothing;


-- ============================================================
-- BLOCK 21: SEED DATA — NEWS ARTICLES (fallback)
-- ============================================================
insert into news_articles (title, category, source, emoji, preview, is_featured, published_at) values
  ('AI Models Now Outperform Doctors on Complex Diagnostic Tasks',  'Technology',    'TechCrunch', 'zap',       'New benchmarks show LLMs scoring above 90% on medical board exams.', true,  now() - interval '2 hours'),
  ('Nairobi Ranked Top Tech Hub in Sub-Saharan Africa 2025',        'Technology',    'TechAfrica', 'zap',       'Silicon Savannah attracts record $1.2B in VC funding this quarter.',  false, now() - interval '1 hour'),
  ('Global Markets Hit All-Time Highs as Tech Sector Leads Rally',  'Business',      'Bloomberg',  'briefcase', 'Investors remain bullish despite ongoing geopolitical tensions.',      false, now() - interval '2 hours'),
  ('AFCON 2025 Ticket Sales Break All Previous Records',            'Sports',        'ESPN Africa','trophy',    'Over 3 million tickets sold in first 48 hours of release.',           false, now() - interval '3 hours'),
  ('Streaming Wars Intensify as Three Major Platforms Merge',       'Entertainment', 'Variety',    'tv',        'Combined entity will have access to over 500 million subscribers.',   false, now() - interval '4 hours'),
  ('AU Summit Reaches Landmark Digital Economy Agreement',          'Politics',      'Reuters',    'globe',     'All 55 member states sign the historic tech regulatory framework.',    false, now() - interval '5 hours'),
  ('Solid-State Battery Breakthrough Promises 1000-Mile EV Range',  'Science',       'TechCrunch', 'rocket',    'Startup claims new chemistry is 3x more energy-dense than Li-ion.',   false, now() - interval '6 hours'),
  ('WHO Approves First African-Developed Malaria Vaccine',          'Health',        'WHO',        'heart',     'Vaccine developed at Kenyan research institute enters Phase 3 trials.',false, now() - interval '7 hours'),
  ('Generative Art Piece Sells for $18 Million at Nairobi Auction', 'Art',           'ArtNet',     'palette',   'Record sale signals growing African art market on global stage.',      false, now() - interval '8 hours')
on conflict do nothing;


-- ============================================================
-- DONE — All tables, triggers, policies, realtime, and seed data
-- installed. Your .env.local needs:
--   NEXT_PUBLIC_SUPABASE_URL=
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=
--   SUPABASE_SERVICE_ROLE_KEY=
-- ============================================================
