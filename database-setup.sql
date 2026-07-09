-- ============================================
-- W&L WORDS — SUPABASE DATABASE SETUP
-- Paste this entire file into your Supabase
-- SQL Editor and click Run
-- ============================================

-- 1. PROFILES (one per user, extends Supabase auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  pen_name text,
  email text,
  account_type text default 'reader', -- 'reader' or 'writer'
  coin_balance integer default 0,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, account_type)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'account_type', 'reader')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. STORIES
create table public.stories (
  id uuid default gen_random_uuid() primary key,
  writer_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  language text default 'English',
  cover_url text,
  tags text[],
  pricing_type text default 'free', -- 'free', 'coins', 'mixed'
  coins_per_chapter integer default 8,
  status text default 'draft', -- 'draft', 'live', 'paused'
  total_reads integer default 0,
  avg_rating numeric(3,1) default 0,
  ratings_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);


-- 3. CHAPTERS
create table public.chapters (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.stories(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  content text,
  word_count integer default 0,
  is_free boolean default false,
  coins_required integer default 8,
  status text default 'draft', -- 'draft', 'published'
  created_at timestamp with time zone default now()
);


-- 4. UNLOCKED CHAPTERS (tracks what each reader has paid for)
create table public.unlocked_chapters (
  id uuid default gen_random_uuid() primary key,
  reader_id uuid references public.profiles(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  coins_spent integer,
  unlocked_at timestamp with time zone default now(),
  unique(reader_id, chapter_id)
);


-- 5. COIN TRANSACTIONS (every coin purchase and spend)
create table public.coin_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null, -- 'purchase' or 'spend'
  coins integer not null,
  amount_usd numeric(10,2), -- only for purchases
  paystack_reference text, -- payment reference from Paystack
  description text,
  created_at timestamp with time zone default now()
);


-- 6. WRITER EARNINGS (tracks money earned per story per month)
create table public.writer_earnings (
  id uuid default gen_random_uuid() primary key,
  writer_id uuid references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  month text not null, -- e.g. '2025-06'
  gross_earned numeric(10,2) default 0,
  writer_share numeric(10,2) default 0, -- 80%
  platform_share numeric(10,2) default 0, -- 20%
  payout_status text default 'pending', -- 'pending', 'paid'
  paid_at timestamp with time zone
);


-- 7. BOOKMARKS
create table public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  reader_id uuid references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(reader_id, story_id)
);


-- 8. RATINGS
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  reader_id uuid references public.profiles(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default now(),
  unique(reader_id, story_id)
);


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- This makes sure users can only see/edit
-- their own data
-- ============================================

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.unlocked_chapters enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.writer_earnings enable row level security;
alter table public.bookmarks enable row level security;
alter table public.ratings enable row level security;

-- Profiles: users can read all, edit only their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Stories: everyone can read live stories, writers manage their own
create policy "Live stories are viewable by everyone" on public.stories for select using (status = 'live' or writer_id = auth.uid());
create policy "Writers can insert stories" on public.stories for insert with check (writer_id = auth.uid());
create policy "Writers can update own stories" on public.stories for update using (writer_id = auth.uid());

-- Chapters: free chapters visible to all, locked chapters only to those who unlocked
create policy "Published chapters viewable" on public.chapters for select using (status = 'published');
create policy "Writers manage own chapters" on public.chapters for insert with check (
  story_id in (select id from public.stories where writer_id = auth.uid())
);

-- Unlocked chapters: users see only their own
create policy "Users see own unlocks" on public.unlocked_chapters for select using (reader_id = auth.uid());
create policy "Users can unlock chapters" on public.unlocked_chapters for insert with check (reader_id = auth.uid());

-- Coin transactions: users see only their own
create policy "Users see own transactions" on public.coin_transactions for select using (user_id = auth.uid());
create policy "Users can insert own transactions" on public.coin_transactions for insert with check (user_id = auth.uid());

-- Bookmarks: users see and manage their own
create policy "Users see own bookmarks" on public.bookmarks for select using (reader_id = auth.uid());
create policy "Users manage own bookmarks" on public.bookmarks for insert with check (reader_id = auth.uid());
create policy "Users delete own bookmarks" on public.bookmarks for delete using (reader_id = auth.uid());

-- Ratings: users see all, manage their own
create policy "Ratings viewable by everyone" on public.ratings for select using (true);
create policy "Users manage own ratings" on public.ratings for insert with check (reader_id = auth.uid());

-- Writer earnings: writers see only their own
create policy "Writers see own earnings" on public.writer_earnings for select using (writer_id = auth.uid());

-- ============================================
-- ALL DONE! Your database is ready.
-- ============================================
