-- Holton Homes CRM Cloud
-- Run this entire file once in Supabase: SQL Editor -> New query -> Run.

create table if not exists public.crm_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.crm_state enable row level security;
alter table public.crm_state force row level security;

drop policy if exists "crm_state_select_own" on public.crm_state;
drop policy if exists "crm_state_insert_own" on public.crm_state;
drop policy if exists "crm_state_update_own" on public.crm_state;
drop policy if exists "crm_state_delete_own" on public.crm_state;

create policy "crm_state_select_own"
on public.crm_state
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "crm_state_insert_own"
on public.crm_state
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "crm_state_update_own"
on public.crm_state
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "crm_state_delete_own"
on public.crm_state
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

grant select, insert, update, delete on public.crm_state to authenticated;
revoke all on public.crm_state from anon;

create index if not exists crm_state_user_id_idx on public.crm_state(user_id);

-- Enable near-real-time updates between open devices.
do $$
begin
  alter publication supabase_realtime add table public.crm_state;
exception
  when duplicate_object then null;
end $$;
