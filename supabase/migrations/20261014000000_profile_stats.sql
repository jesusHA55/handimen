-- Profile rating aggregates + handoff stats.
-- The demo layer kept `rating`/`reviewCount` in memory; in Postgres we derive
-- them from `reviews` via trigger so reads stay a single-column lookup.

alter table public.profiles
  add column if not exists rating numeric(2, 1) not null default 0,
  add column if not exists review_count integer not null default 0;

-- Recompute a member's rating whenever their reviews change.
create or replace function public.recompute_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if tg_op = 'DELETE' then
    target := old.reviewee_id;
  else
    target := new.reviewee_id;
  end if;

  update public.profiles p
  set rating = coalesce(
        (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.reviewee_id = target),
        0
      ),
      review_count = (
        select count(*) from public.reviews r where r.reviewee_id = target
      )
  where p.id = target;

  return null;
end;
$$;

drop trigger if exists reviews_recompute_rating on public.reviews;
create trigger reviews_recompute_rating
after insert or update or delete on public.reviews
for each row execute function public.recompute_profile_rating();

-- Bump completed-handoff counters for both parties when a borrow is returned.
create or replace function public.on_request_returned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'returned' and old.status is distinct from 'returned' then
    update public.profiles
    set completed_handoffs = completed_handoffs + 1
    where id in (new.requester_id, new.owner_id);
  end if;
  return new;
end;
$$;

drop trigger if exists requests_on_returned on public.requests;
create trigger requests_on_returned
after update on public.requests
for each row execute function public.on_request_returned();
