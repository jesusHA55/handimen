-- Handimen initial schema
-- Postgres + PostGIS + Row Level Security.
--
-- Conventions:
--   * Money is stored in minor units (integer cents) + ISO 4217 currency.
--   * Locations use PostGIS `geography(Point, 4326)` (metres for distance maths).
--   * Every table is RLS-enabled; the service role bypasses RLS for server-side jobs.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create schema if not exists extensions;

create extension if not exists "postgis" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
-- pg_cron manages its own `cron` schema, so it is not pinned to `extensions`.
create extension if not exists "pg_cron";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.listing_type as enum ('tool', 'equipment', 'skill', 'service');
create type public.listing_terms as enum ('free', 'rent');
create type public.listing_status as enum ('draft', 'active', 'paused', 'lent', 'archived');
create type public.price_unit as enum ('hour', 'day', 'week');
create type public.post_visibility as enum ('public', 'city', 'group', 'followers');
create type public.request_status as enum ('pending', 'approved', 'active', 'returned', 'declined', 'cancelled');
create type public.group_role as enum ('owner', 'admin', 'member');
create type public.group_member_status as enum ('invited', 'requested', 'active', 'banned');
create type public.group_visibility as enum ('public', 'private');
create type public.join_policy as enum ('invite', 'request', 'open');
create type public.reaction_kind as enum ('like', 'want', 'have');
create type public.payment_provider as enum ('mock', 'stripe');
create type public.payment_status as enum ('pending', 'authorized', 'captured', 'released', 'refunded', 'cancelled', 'failed');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.report_target as enum ('profile', 'listing', 'post', 'comment', 'message');

-- ---------------------------------------------------------------------------
-- Shared trigger helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cities (public communities)
-- ---------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  province text,
  country_code char(2) not null default 'ES',
  center extensions.geography(Point, 4326) not null,
  created_at timestamptz not null default now()
);

create index cities_center_idx on public.cities using gist (center);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  neighbourhood text,
  home_location extensions.geography(Point, 4326),
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  id_verified boolean not null default false,
  completed_handoffs integer not null default 0 check (completed_handoffs >= 0),
  vouches integer not null default 0 check (vouches >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Groups (private / invite communities)
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  city_id uuid references public.cities (id) on delete set null,
  visibility public.group_visibility not null default 'private',
  join_policy public.join_policy not null default 'invite',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_role not null default 'member',
  status public.group_member_status not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type public.listing_type not null,
  terms public.listing_terms not null default 'free',
  category text not null,
  title text not null,
  description text not null,
  photos text[] not null default '{}',
  price_cents integer check (price_cents is null or price_cents >= 0),
  deposit_cents integer check (deposit_cents is null or deposit_cents >= 0),
  price_unit public.price_unit,
  currency char(3) not null default 'EUR',
  pickup_location extensions.geography(Point, 4326),
  search_radius_meters integer not null default 3000
    check (search_radius_meters between 100 and 50000),
  city_id uuid references public.cities (id) on delete set null,
  group_id uuid references public.groups (id) on delete cascade,
  status public.listing_status not null default 'active',
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Paid listings must carry a price.
  constraint paid_listings_have_price
    check (terms = 'free' or price_cents is not null)
);

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create index listings_search_idx on public.listings using gin (search_vector);
create index listings_title_trgm_idx on public.listings using gin (title extensions.gin_trgm_ops);
create index listings_pickup_idx on public.listings using gist (pickup_location);
create index listings_owner_idx on public.listings (owner_id);
create index listings_city_status_idx on public.listings (city_id, status);
create index listings_group_idx on public.listings (group_id);

-- ---------------------------------------------------------------------------
-- Social: posts, reactions, comments, follows
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  media text[] not null default '{}',
  listing_id uuid references public.listings (id) on delete set null,
  group_id uuid references public.groups (id) on delete cascade,
  city_id uuid references public.cities (id) on delete set null,
  visibility public.post_visibility not null default 'city',
  created_at timestamptz not null default now()
);

create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_city_idx on public.posts (city_id, created_at desc);
create index posts_group_idx on public.posts (group_id, created_at desc);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reaction_kind not null default 'like',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- Requests (borrow / rent lifecycle) + payments
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null default 'pending',
  message text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  agreed_price_cents integer,
  agreed_deposit_cents integer,
  currency char(3) not null default 'EUR',
  payment_intent_id text,
  picked_up_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_dates_valid check (end_date > start_date),
  constraint request_parties_differ check (requester_id <> owner_id)
);

create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

create index requests_requester_idx on public.requests (requester_id, created_at desc);
create index requests_owner_idx on public.requests (owner_id, created_at desc);
create index requests_listing_idx on public.requests (listing_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  provider public.payment_provider not null default 'mock',
  provider_intent_id text,
  status public.payment_status not null default 'pending',
  amount_cents integer not null default 0 check (amount_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  currency char(3) not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create index transactions_request_idx on public.transactions (request_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, reviewer_id),
  constraint review_parties_differ check (reviewer_id <> reviewee_id)
);

create index reviews_reviewee_idx on public.reviews (reviewee_id);

-- ---------------------------------------------------------------------------
-- Messaging (async)
-- ---------------------------------------------------------------------------
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  request_id uuid references public.requests (id) on delete set null,
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint thread_parties_differ check (participant_a <> participant_b)
);

create trigger threads_set_updated_at
before update on public.threads
for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_thread_idx on public.messages (thread_id, created_at);

-- ---------------------------------------------------------------------------
-- Notifications, moderation
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_status_idx on public.reports (status, created_at desc);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------------
-- RLS helper
-- ---------------------------------------------------------------------------
create or replace function public.is_group_member(g uuid, u uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = g and m.user_id = u and m.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.listings enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.requests enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- cities: world-readable.
create policy "cities are public" on public.cities for select using (true);

-- profiles: public read; owner writes.
create policy "profiles are public" on public.profiles for select using (true);
create policy "owners update their profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- groups: visible if public, or you are owner/member.
create policy "groups visible when public or joined" on public.groups for select
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or public.is_group_member(id, auth.uid())
  );
create policy "owners create groups" on public.groups for insert
  with check (owner_id = auth.uid());
create policy "owners update their groups" on public.groups for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete their groups" on public.groups for delete
  using (owner_id = auth.uid());

-- group_members: see members of groups you belong to (or public groups); manage own row.
create policy "members visible to members" on public.group_members for select
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
    or exists (select 1 from public.groups g where g.id = group_id and g.visibility = 'public')
  );
create policy "join or be added" on public.group_members for insert
  with check (user_id = auth.uid() or public.is_group_member(group_id, auth.uid()));
create policy "leave or manage own row" on public.group_members for delete
  using (user_id = auth.uid() or public.is_group_member(group_id, auth.uid()));

-- listings: active listings are public; otherwise only the owner or group members.
create policy "listings readable when active or owned" on public.listings for select
  using (
    status = 'active'
    or owner_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );
create policy "owners insert listings" on public.listings for insert
  with check (owner_id = auth.uid());
create policy "owners update listings" on public.listings for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete listings" on public.listings for delete
  using (owner_id = auth.uid());

-- posts: honour visibility.
create policy "posts readable per visibility" on public.posts for select
  using (
    author_id = auth.uid()
    or visibility in ('public', 'city')
    or (visibility = 'group' and group_id is not null and public.is_group_member(group_id, auth.uid()))
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = author_id
      )
    )
  );
create policy "authors insert posts" on public.posts for insert
  with check (author_id = auth.uid());
create policy "authors update posts" on public.posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete posts" on public.posts for delete
  using (author_id = auth.uid());

-- reactions: readable, self-managed.
create policy "reactions readable" on public.reactions for select using (true);
create policy "users react" on public.reactions for insert with check (user_id = auth.uid());
create policy "users unreact" on public.reactions for delete using (user_id = auth.uid());

-- comments: readable, self-managed.
create policy "comments readable" on public.comments for select using (true);
create policy "users comment" on public.comments for insert with check (author_id = auth.uid());
create policy "authors delete comments" on public.comments for delete using (author_id = auth.uid());

-- follows: readable, self-managed.
create policy "follows readable" on public.follows for select using (true);
create policy "users follow" on public.follows for insert with check (follower_id = auth.uid());
create policy "users unfollow" on public.follows for delete using (follower_id = auth.uid());

-- requests: visible to the two parties.
create policy "requests visible to parties" on public.requests for select
  using (requester_id = auth.uid() or owner_id = auth.uid());
create policy "requesters create requests" on public.requests for insert
  with check (requester_id = auth.uid());
create policy "parties update requests" on public.requests for update
  using (requester_id = auth.uid() or owner_id = auth.uid())
  with check (requester_id = auth.uid() or owner_id = auth.uid());

-- transactions: parties of the related request can read; writes go through the service role.
create policy "transactions visible to parties" on public.transactions for select
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_id and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
    )
  );

-- reviews: readable; only request participants may write.
create policy "reviews readable" on public.reviews for select using (true);
create policy "participants review" on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
        and r.status = 'returned'
    )
  );

-- threads: visible to participants.
create policy "threads visible to participants" on public.threads for select
  using (participant_a = auth.uid() or participant_b = auth.uid());
create policy "users start threads" on public.threads for insert
  with check (participant_a = auth.uid() or participant_b = auth.uid());

-- messages: participants of the thread.
create policy "messages visible to thread" on public.messages for select
  using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );
create policy "participants send messages" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.threads t
      where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );

-- notifications: own only.
create policy "users read own notifications" on public.notifications for select
  using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: anyone reports; reporters see their own.
create policy "users file reports" on public.reports for insert
  with check (reporter_id = auth.uid());
create policy "reporters see their reports" on public.reports for select
  using (reporter_id = auth.uid());

-- blocks: self-managed.
create policy "users see their blocks" on public.blocks for select
  using (blocker_id = auth.uid());
create policy "users block" on public.blocks for insert with check (blocker_id = auth.uid());
create policy "users unblock" on public.blocks for delete using (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage buckets: public read, owner-scoped writes (folder = user id)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "media is public" on storage.objects for select
  using (bucket_id in ('avatars', 'listing-photos'));

create policy "owners upload media" on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'listing-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update media" on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'listing-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete media" on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'listing-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Anti-pause: Supabase free tier sleeps after 7 days of inactivity.
-- Enable once the project URL is known (keep secrets in Vault, not in SQL):
--
--   select cron.schedule('handimen-keepalive', '0 6 * * *',
--     $$ select net.http_get('https://<project-ref>.supabase.co/rest/v1/') $$);
-- ---------------------------------------------------------------------------
