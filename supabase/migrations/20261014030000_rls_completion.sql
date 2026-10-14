-- Complete the RLS surface for flows added after the initial migration:
-- chat read receipts / thread activity, and the mock escrow ledger.

-- Chat -----------------------------------------------------------------------
drop policy if exists "participants update messages" on public.messages;
create policy "participants update messages" on public.messages for update
  using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.threads t
      where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );

drop policy if exists "participants update threads" on public.threads;
create policy "participants update threads" on public.threads for update
  using (participant_a = auth.uid() or participant_b = auth.uid())
  with check (participant_a = auth.uid() or participant_b = auth.uid());

-- Escrow ledger ---------------------------------------------------------------
drop policy if exists "parties insert transactions" on public.transactions;
create policy "parties insert transactions" on public.transactions for insert
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
    )
  );

drop policy if exists "parties update transactions" on public.transactions;
create policy "parties update transactions" on public.transactions for update
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_id and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id and (r.requester_id = auth.uid() or r.owner_id = auth.uid())
    )
  );
