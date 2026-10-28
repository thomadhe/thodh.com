-- Run with the Supabase SQL tool. Uses two account IDs without reading user data.
-- All synthetic progress is rolled back, including on connection closure.
begin;
do $$
declare
  users uuid[];
  changed integer;
begin
  select array_agg(id) into users from (
    select id from auth.users where id not in (select user_id from public.otsjoba_progress) limit 2
  ) candidates;
  if array_length(users, 1) <> 2 then raise exception 'Need two accounts without progress'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', users[1], 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.otsjoba_progress(user_id, state) values (users[1], '{"version":1,"test":"a"}');
  begin
    insert into public.otsjoba_progress(user_id, state) values (users[2], '{"version":1}');
    raise exception 'Cross-user insert was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.otsjoba_progress set user_id = users[2] where user_id = users[1];
    raise exception 'Ownership transfer was allowed';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', users[2], 'role', 'authenticated')::text, true);
  if exists(select 1 from public.otsjoba_progress) then raise exception 'Other user progress visible'; end if;
  update public.otsjoba_progress set state = '{"version":1}' where user_id = users[1];
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Cross-user update allowed'; end if;
  insert into public.otsjoba_progress(user_id, state) values (users[2], '{"version":1,"test":"b"}');
  update public.otsjoba_progress set state = '{"version":1,"test":"b2"}' where user_id = users[2] and revision = 1;
  if (select revision from public.otsjoba_progress where user_id = users[2]) <> 2 then raise exception 'Revision trigger failed'; end if;
  update public.otsjoba_progress set state = '{"version":1}' where user_id = users[2] and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Stale revision allowed'; end if;
  reset role;
  set local role anon;
  begin
    perform 1 from public.otsjoba_progress;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
  reset role;
end;
$$;
rollback;
select 'PASS: owner read/write, foreign read/insert/update, ownership transfer, anonymous access, revisions; all rolled back' as verification;
