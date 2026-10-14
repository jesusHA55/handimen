-- Give reviews their own `listing_id`.
--
-- A listing page needs "reviews for this listing", but deriving that through
-- `requests` doesn't work for visitors: the requests RLS policy only exposes a
-- borrow to its two parties, so an anonymous reader sees no request rows and
-- therefore no reviews. Denormalising the listing onto the review keeps the read
-- to a single, publicly readable table.

alter table public.reviews
  add column if not exists listing_id uuid references public.listings(id) on delete cascade;

-- Backfill from the borrow each review belongs to.
update public.reviews r
set listing_id = req.listing_id
from public.requests req
where req.id = r.request_id
  and r.listing_id is null;

-- Keep it filled for new reviews without trusting the client.
create or replace function public.set_review_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.listing_id is null then
    select listing_id into new.listing_id
    from public.requests
    where id = new.request_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_set_listing on public.reviews;
create trigger reviews_set_listing
before insert on public.reviews
for each row execute function public.set_review_listing();

create index if not exists reviews_listing_idx on public.reviews (listing_id);
