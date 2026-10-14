-- Keep `profiles.email_verified` in sync with the auth record.
--
-- `handle_new_user` only fires on INSERT into auth.users. With a magic link the
-- user is created when the link is *requested* (email not yet confirmed) and the
-- confirmation lands as a later UPDATE, so the profile flag stayed false and the
-- publish gate blocked the member forever.

create or replace function public.sync_profile_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email_verified = (new.email_confirmed_at is not null)
  where id = new.id
    and email_verified is distinct from (new.email_confirmed_at is not null);
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update of email_confirmed_at on auth.users
for each row execute function public.sync_profile_email_verified();

-- Backfill anyone whose email is already confirmed.
update public.profiles p
set email_verified = true
from auth.users u
where u.id = p.id
  and u.email_confirmed_at is not null
  and p.email_verified = false;
