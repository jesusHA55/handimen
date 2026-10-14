-- Comments inherited `using (true)` from the initial migration, which leaked
-- comments on group/followers posts to everyone. Mirror the post's visibility.

drop policy if exists "comments readable" on public.comments;
drop policy if exists "comments readable with their post" on public.comments;

create policy "comments readable with their post" on public.comments for select
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
        and (
          p.author_id = auth.uid()
          or p.visibility in ('public', 'city')
          or (
            p.visibility = 'group'
            and p.group_id is not null
            and public.is_group_member(p.group_id, auth.uid())
          )
          or (
            p.visibility = 'followers'
            and exists (
              select 1 from public.follows f
              where f.follower_id = auth.uid() and f.following_id = p.author_id
            )
          )
        )
    )
  );
