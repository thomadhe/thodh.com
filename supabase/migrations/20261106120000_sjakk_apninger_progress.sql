-- Opening trainer progress for signed-in players. Optional: the trainer works from localStorage without an account.
create table public.sjakk_apninger_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and state @> '{"versjon":1}'::jsonb and octet_length(state::text) <= 1000000),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.sjakk_apninger_progress enable row level security;
revoke all on public.sjakk_apninger_progress from anon, authenticated;
grant select, insert, update on public.sjakk_apninger_progress to authenticated;

create policy "Read own opening progress" on public.sjakk_apninger_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own opening progress" on public.sjakk_apninger_progress
  for insert to authenticated with check ((select auth.uid()) = user_id and revision = 1);
create policy "Update own opening progress" on public.sjakk_apninger_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.sjakk_apninger_progress_version() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.sjakk_apninger_progress_version() from public;
create trigger sjakk_apninger_progress_version before update on public.sjakk_apninger_progress
  for each row execute function public.sjakk_apninger_progress_version();
