-- Expose what API clients need without hand-parsing PostGIS payloads.
--
-- * listings.pickup_lat/lng  — PostgREST returns `geography` as EWKB hex, which is
--   awkward in JS. PostGIS stays the source of truth; these generated columns
--   project it to plain numbers for the map.
-- * posts.reaction_count      — denormalised so the feed needs one query.

alter table public.listings
  add column if not exists pickup_lat double precision
    generated always as (extensions.st_y(pickup_location::extensions.geometry)) stored,
  add column if not exists pickup_lng double precision
    generated always as (extensions.st_x(pickup_location::extensions.geometry)) stored;

alter table public.profiles
  add column if not exists home_lat double precision
    generated always as (extensions.st_y(home_location::extensions.geometry)) stored,
  add column if not exists home_lng double precision
    generated always as (extensions.st_x(home_location::extensions.geometry)) stored;

alter table public.posts
  add column if not exists reaction_count integer not null default 0;

-- Keep the reaction counter honest as likes come and go.
create or replace function public.recompute_post_reactions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if tg_op = 'DELETE' then
    target := old.post_id;
  else
    target := new.post_id;
  end if;

  update public.posts p
  set reaction_count = (select count(*) from public.reactions r where r.post_id = target)
  where p.id = target;

  return null;
end;
$$;

drop trigger if exists reactions_recompute_count on public.reactions;
create trigger reactions_recompute_count
after insert or delete on public.reactions
for each row execute function public.recompute_post_reactions();
