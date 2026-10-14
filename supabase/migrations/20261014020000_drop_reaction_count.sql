-- Drop the denormalised reaction counter.
--
-- Real counts are derived from `reactions` rows (the repository fetches them
-- alongside the feed and counts in the client). A denormalised column would
-- need seeding and could drift from the rows it claims to summarise.

drop trigger if exists reactions_recompute_count on public.reactions;
drop function if exists public.recompute_post_reactions();
alter table public.posts drop column if exists reaction_count;
