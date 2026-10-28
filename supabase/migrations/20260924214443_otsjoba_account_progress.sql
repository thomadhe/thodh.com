-- Shared identity with Karrierepiloten; app data is isolated by table and user.
create table public.otsjoba_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and state @> '{"version":1}'::jsonb and octet_length(state::text) <= 1000000),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.otsjoba_progress enable row level security;
revoke all on public.otsjoba_progress from anon, authenticated;
grant select, insert, update on public.otsjoba_progress to authenticated;

create policy "Read own Otsjoba progress" on public.otsjoba_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own Otsjoba progress" on public.otsjoba_progress
  for insert to authenticated with check ((select auth.uid()) = user_id and revision = 1);
create policy "Update own Otsjoba progress" on public.otsjoba_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.otsjoba_progress_version() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.otsjoba_progress_version() from public;
create trigger otsjoba_progress_version before update on public.otsjoba_progress
  for each row execute function public.otsjoba_progress_version();
