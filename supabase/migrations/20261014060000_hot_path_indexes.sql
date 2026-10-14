-- Indexes for the queries that actually run on every page.
--
-- Found by walking the repository reads: browse lists order by created_at with
-- a status/category/terms filter, the feed orders posts by created_at, and the
-- messages RLS policy looks threads up by participant for every row scanned.

-- Listings browse ------------------------------------------------------------
create index if not exists listings_created_idx
  on public.listings (created_at desc);

create index if not exists listings_status_created_idx
  on public.listings (status, created_at desc);

create index if not exists listings_category_created_idx
  on public.listings (category, created_at desc);

create index if not exists listings_terms_created_idx
  on public.listings (terms, created_at desc);

-- Free-text search matches description too; title already has a trigram index.
create index if not exists listings_description_trgm_idx
  on public.listings using gin (description extensions.gin_trgm_ops);

-- Bulletin board -------------------------------------------------------------
create index if not exists posts_created_idx
  on public.posts (created_at desc);

-- Chat -----------------------------------------------------------------------
-- `participants update/select messages` filter threads by participant; without
-- these the policy subquery is a sequential scan per candidate row.
create index if not exists threads_participant_a_idx
  on public.threads (participant_a);

create index if not exists threads_participant_b_idx
  on public.threads (participant_b);

-- Reviews --------------------------------------------------------------------
create index if not exists reviews_reviewer_idx
  on public.reviews (reviewer_id);
