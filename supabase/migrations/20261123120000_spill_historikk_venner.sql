-- Spillhistorikk, månedlige ledertavler, venner og duellutfordringer.
-- Alt er valgfritt for innloggede brukere; spillene fungerer fortsatt helt uten konto.
-- Delte brukere med Karrierepiloten; e-post eksponeres aldri til andre brukere.

-- 1. Offentlige visningsnavn og personlig vennekode
create table public.spill_profiler (
  user_id uuid primary key references auth.users(id) on delete cascade,
  visningsnavn text not null check (
    char_length(trim(visningsnavn)) between 2 and 24
    and visningsnavn !~ E'[\\x00-\\x1f\\x7f]'
  ),
  vennekode text not null unique check (vennekode ~ '^[BCDFGHJKLMNPQRSTVWXZ23456789]{6}$'),
  opprettet_kl timestamptz not null default now(),
  oppdatert_kl timestamptz not null default now()
);

alter table public.spill_profiler enable row level security;
revoke all on public.spill_profiler from anon, authenticated;
grant select, insert, update on public.spill_profiler to authenticated;

create policy "Les egen spillprofil" on public.spill_profiler
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Opprett egen spillprofil" on public.spill_profiler
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Oppdater egen spillprofil" on public.spill_profiler
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.spill_profiler_oppdater() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.user_id := old.user_id;
  new.vennekode := old.vennekode;
  new.opprettet_kl := old.opprettet_kl;
  new.oppdatert_kl := now();
  return new;
end;
$$;
revoke all on function public.spill_profiler_oppdater() from public;
create trigger spill_profiler_oppdater before update on public.spill_profiler
  for each row execute function public.spill_profiler_oppdater();

-- 2. Server-sporede økter for spill med server-API (starttid, forsøk, hint, fasit-sperre)
create table public.spill_okter (
  user_id uuid not null references auth.users(id) on delete cascade,
  spill_id text not null check (spill_id in (
    'anelseslos', '67-stegern', 'gjettelos', 'soket',
    'emovi', 'tilkoblinger', 'sanglos', 'heksagonal-jakt'
  )),
  dato date not null check (dato >= date '2026-10-01'),
  startet_kl timestamptz not null default now(),
  forsok integer not null default 0 check (forsok >= 0 and forsok <= 5000),
  hint_antall integer not null default 0 check (hint_antall >= 0 and hint_antall <= 500),
  fasit_hentet boolean not null default false,
  data jsonb not null default '{}'::jsonb check (
    jsonb_typeof(data) = 'object' and octet_length(data::text) <= 65536
  ),
  oppdatert_kl timestamptz not null default now(),
  primary key (user_id, spill_id, dato)
);

alter table public.spill_okter enable row level security;
revoke all on public.spill_okter from anon, authenticated;
grant select, insert, update on public.spill_okter to authenticated;

create policy "Les egne spillokter" on public.spill_okter
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Opprett egne spillokter" on public.spill_okter
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Oppdater egne spillokter" on public.spill_okter
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Økt-tellere er monotone: starttid kan ikke flyttes fram, forsøk/hint kan ikke senkes, fasit-flagg kan ikke fjernes.
create function public.spill_okter_monoton() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.user_id := old.user_id;
  new.spill_id := old.spill_id;
  new.dato := old.dato;
  new.startet_kl := old.startet_kl;
  new.forsok := greatest(old.forsok, new.forsok);
  new.hint_antall := greatest(old.hint_antall, new.hint_antall);
  new.fasit_hentet := old.fasit_hentet or new.fasit_hentet;
  new.oppdatert_kl := now();
  return new;
end;
$$;
revoke all on function public.spill_okter_monoton() from public;
create trigger spill_okter_monoton before update on public.spill_okter
  for each row execute function public.spill_okter_monoton();

-- 3. Lagrede resultater per dag og spill (uforanderlige når de først er lagret)
create table public.spill_resultater (
  user_id uuid not null references auth.users(id) on delete cascade,
  spill_id text not null check (spill_id in (
    'mer-eller-mindre', 'anelseslos', 'stavebien', 'sanglos', 'omriss',
    'canvas', 'soket', 'emovi', 'rusle', 'tilkoblinger', 'havet',
    'heksagonal-jakt', '67-stegern', 'gjettelos'
  )),
  dato date not null check (
    dato >= date '2026-10-01'
    and dato <= ((now() at time zone 'Europe/Oslo')::date + 1)
  ),
  status text not null check (status in ('vunnet', 'tapt', 'ferdig')),
  etikett text not null default '' check (char_length(etikett) <= 60),
  poeng numeric(8, 2) check (poeng is null or (poeng >= 0 and poeng <= 100000)),
  forsok integer check (forsok is null or (forsok >= 0 and forsok <= 5000)),
  hint_antall integer not null default 0 check (hint_antall >= 0 and hint_antall <= 500),
  tid_sek integer check (tid_sek is null or (tid_sek >= 1 and tid_sek <= 14400)),
  verifisert boolean not null default false,
  signatur text check (signatur is null or char_length(signatur) <= 200),
  detaljer jsonb not null default '{}'::jsonb check (
    jsonb_typeof(detaljer) = 'object' and octet_length(detaljer::text) <= 8192
  ),
  opprettet_kl timestamptz not null default now(),
  primary key (user_id, spill_id, dato)
);

create index spill_resultater_ledertavle_idx
  on public.spill_resultater (spill_id, dato, verifisert)
  where verifisert = true;
create index spill_resultater_user_dato_idx
  on public.spill_resultater (user_id, dato desc);

alter table public.spill_resultater enable row level security;
revoke all on public.spill_resultater from anon, authenticated;
-- Bare SELECT og INSERT: et lagret dagsresultat kan ikke overskrives eller slettes i etterkant.
grant select, insert on public.spill_resultater to authenticated;

create policy "Les egne spillresultater" on public.spill_resultater
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Lagre egne spillresultater" on public.spill_resultater
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- 4. Vennskap og venneforespørsler (synlig kun for de to partene)
create table public.spill_vennskap (
  id uuid primary key default gen_random_uuid(),
  avsender_id uuid not null references auth.users(id) on delete cascade,
  mottaker_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'venter' check (status in ('venter', 'godtatt')),
  opprettet_kl timestamptz not null default now(),
  oppdatert_kl timestamptz not null default now(),
  check (avsender_id <> mottaker_id)
);

create unique index spill_vennskap_par_unik
  on public.spill_vennskap (least(avsender_id, mottaker_id), greatest(avsender_id, mottaker_id));
create index spill_vennskap_mottaker_idx on public.spill_vennskap (mottaker_id, status);
create index spill_vennskap_avsender_idx on public.spill_vennskap (avsender_id, status);

alter table public.spill_vennskap enable row level security;
revoke all on public.spill_vennskap from anon, authenticated;
grant select, insert, update, delete on public.spill_vennskap to authenticated;

create policy "Les egne vennskap" on public.spill_vennskap
  for select to authenticated using ((select auth.uid()) in (avsender_id, mottaker_id));
create policy "Send venneforesporsel" on public.spill_vennskap
  for insert to authenticated with check (
    (select auth.uid()) = avsender_id and status = 'venter'
  );
create policy "Godta mottatt venneforesporsel" on public.spill_vennskap
  for update to authenticated using (
    (select auth.uid()) = mottaker_id and status = 'venter'
  )
  with check (
    (select auth.uid()) = mottaker_id and status = 'godtatt'
  );
create policy "Fjern eller avslå vennskap" on public.spill_vennskap
  for delete to authenticated using ((select auth.uid()) in (avsender_id, mottaker_id));

create function public.spill_vennskap_oppdater() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.id := old.id;
  new.avsender_id := old.avsender_id;
  new.mottaker_id := old.mottaker_id;
  new.opprettet_kl := old.opprettet_kl;
  new.oppdatert_kl := now();
  return new;
end;
$$;
revoke all on function public.spill_vennskap_oppdater() from public;
create trigger spill_vennskap_oppdater before update on public.spill_vennskap
  for each row execute function public.spill_vennskap_oppdater();

-- 5. Duellutfordringer mellom venner (synlig kun for de to partene)
create table public.spill_duell_utfordringer (
  id uuid primary key default gen_random_uuid(),
  avsender_id uuid not null references auth.users(id) on delete cascade,
  mottaker_id uuid not null references auth.users(id) on delete cascade,
  spill_id text not null check (spill_id in ('67-stegern', 'gjettelos')),
  modus text not null default 'runder' check (
    (spill_id = '67-stegern' and modus in ('runder', 'pistol'))
    or (spill_id = 'gjettelos' and modus = 'runder')
  ),
  romkode text not null check (romkode ~ '^[BCDFGHJKLMNPQRSTVWXZ]{4}$'),
  status text not null default 'venter' check (status in ('venter', 'godtatt', 'avslatt', 'avbrutt')),
  opprettet_kl timestamptz not null default now(),
  utloper_kl timestamptz not null default (now() + interval '24 hours'),
  oppdatert_kl timestamptz not null default now(),
  check (avsender_id <> mottaker_id)
);

create index spill_duell_utfordringer_mottaker_idx
  on public.spill_duell_utfordringer (mottaker_id, status, utloper_kl desc);
create index spill_duell_utfordringer_avsender_idx
  on public.spill_duell_utfordringer (avsender_id, status, utloper_kl desc);

alter table public.spill_duell_utfordringer enable row level security;
revoke all on public.spill_duell_utfordringer from anon, authenticated;
grant select, insert, update on public.spill_duell_utfordringer to authenticated;

create policy "Les egne duellutfordringer" on public.spill_duell_utfordringer
  for select to authenticated using ((select auth.uid()) in (avsender_id, mottaker_id));
create policy "Utfordre en godkjent venn" on public.spill_duell_utfordringer
  for insert to authenticated with check (
    (select auth.uid()) = avsender_id
    and status = 'venter'
    and exists (
      select 1 from public.spill_vennskap v
      where v.status = 'godtatt'
        and (
          (v.avsender_id = avsender_id and v.mottaker_id = mottaker_id)
          or (v.avsender_id = mottaker_id and v.mottaker_id = avsender_id)
        )
    )
  );
create policy "Svar på mottatt utfordring" on public.spill_duell_utfordringer
  for update to authenticated using (
    (select auth.uid()) = mottaker_id and status = 'venter'
  )
  with check (
    (select auth.uid()) = mottaker_id and status in ('godtatt', 'avslatt')
  );
create policy "Avbryt sendt utfordring" on public.spill_duell_utfordringer
  for update to authenticated using (
    (select auth.uid()) = avsender_id and status = 'venter'
  )
  with check (
    (select auth.uid()) = avsender_id and status = 'avbrutt'
  );

create function public.spill_duell_utfordringer_oppdater() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.id := old.id;
  new.avsender_id := old.avsender_id;
  new.mottaker_id := old.mottaker_id;
  new.spill_id := old.spill_id;
  new.modus := old.modus;
  new.romkode := old.romkode;
  new.opprettet_kl := old.opprettet_kl;
  new.utloper_kl := old.utloper_kl;
  new.oppdatert_kl := now();
  return new;
end;
$$;
revoke all on function public.spill_duell_utfordringer_oppdater() from public;
create trigger spill_duell_utfordringer_oppdater before update on public.spill_duell_utfordringer
  for each row execute function public.spill_duell_utfordringer_oppdater();

-- 6. SECURITY DEFINER-funksjoner: eksponerer aldri e-post, kun visningsnavn og tillatte data.

-- Slå opp en bruker via eksakt 6-tegns vennekode
create function public.spill_finn_profil_ved_kode(p_kode text)
returns table (user_id uuid, visningsnavn text)
language plpgsql security definer set search_path = '' as $$
declare
  v_meg uuid := auth.uid();
  v_kode text := upper(regexp_replace(coalesce(p_kode, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if v_meg is null or char_length(v_kode) <> 6 then
    return;
  end if;
  return query
    select p.user_id, p.visningsnavn
    from public.spill_profiler p
    where p.vennekode = v_kode
      and p.user_id <> v_meg
    limit 1;
end;
$$;
revoke all on function public.spill_finn_profil_ved_kode(text) from public, anon;
grant execute on function public.spill_finn_profil_ved_kode(text) to authenticated;

-- Hent egne venner og ventende forespørsler med visningsnavn (kun for de to partene)
create function public.spill_mine_venner()
returns table (
  vennskap_id uuid,
  bruker_id uuid,
  visningsnavn text,
  status text,
  retning text,
  opprettet_kl timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_meg uuid := auth.uid();
begin
  if v_meg is null then
    return;
  end if;
  return query
    select
      v.id as vennskap_id,
      case when v.avsender_id = v_meg then v.mottaker_id else v.avsender_id end as bruker_id,
      coalesce(p.visningsnavn, 'Spiller') as visningsnavn,
      v.status,
      case when v.avsender_id = v_meg then 'sendt' else 'mottatt' end as retning,
      v.opprettet_kl
    from public.spill_vennskap v
    left join public.spill_profiler p
      on p.user_id = case when v.avsender_id = v_meg then v.mottaker_id else v.avsender_id end
    where v_meg in (v.avsender_id, v.mottaker_id)
    order by
      case when v.status = 'venter' and v.mottaker_id = v_meg then 0
           when v.status = 'godtatt' then 1
           else 2 end,
      v.opprettet_kl desc;
end;
$$;
revoke all on function public.spill_mine_venner() from public, anon;
grant execute on function public.spill_mine_venner() to authenticated;

-- Hent aktive/nylige duellutfordringer med visningsnavn (kun for avsender og mottaker)
create function public.spill_mine_utfordringer()
returns table (
  id uuid,
  avsender_id uuid,
  avsender_navn text,
  mottaker_id uuid,
  mottaker_navn text,
  spill_id text,
  modus text,
  romkode text,
  status text,
  opprettet_kl timestamptz,
  utloper_kl timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_meg uuid := auth.uid();
begin
  if v_meg is null then
    return;
  end if;
  return query
    select
      u.id,
      u.avsender_id,
      coalesce(pa.visningsnavn, 'Spiller') as avsender_navn,
      u.mottaker_id,
      coalesce(pm.visningsnavn, 'Spiller') as mottaker_navn,
      u.spill_id,
      u.modus,
      u.romkode,
      u.status,
      u.opprettet_kl,
      u.utloper_kl
    from public.spill_duell_utfordringer u
    left join public.spill_profiler pa on pa.user_id = u.avsender_id
    left join public.spill_profiler pm on pm.user_id = u.mottaker_id
    where v_meg in (u.avsender_id, u.mottaker_id)
      and u.utloper_kl > now() - interval '2 hours'
      and u.status in ('venter', 'godtatt')
    order by u.opprettet_kl desc
    limit 40;
end;
$$;
revoke all on function public.spill_mine_utfordringer() from public, anon;
grant execute on function public.spill_mine_utfordringer() to authenticated;

-- Aggregert månedlig ledertavle (kun visningsnavn + aggregater, kun verifiserte resultater)
create function public.spill_ledertavle(
  p_spill_id text,
  p_fra date,
  p_til date,
  p_omfang text default 'global'
)
returns table (
  bruker_id uuid,
  visningsnavn text,
  vunnet integer,
  fullfort integer,
  snitt_tid numeric,
  snitt_hint numeric,
  snitt_forsok numeric,
  snitt_poeng numeric
)
language plpgsql security definer set search_path = '' as $$
declare
  v_meg uuid := auth.uid();
begin
  if v_meg is null or p_omfang not in ('global', 'venner') then
    return;
  end if;
  return query
    with tillatte as (
      select p.user_id, p.visningsnavn
      from public.spill_profiler p
      where p_omfang = 'global'
        or p.user_id = v_meg
        or exists (
          select 1 from public.spill_vennskap v
          where v.status = 'godtatt'
            and (
              (v.avsender_id = v_meg and v.mottaker_id = p.user_id)
              or (v.mottaker_id = v_meg and v.avsender_id = p.user_id)
            )
        )
    )
    select
      t.user_id as bruker_id,
      t.visningsnavn,
      count(*) filter (where r.status = 'vunnet')::integer as vunnet,
      count(*) filter (where r.status in ('vunnet', 'ferdig'))::integer as fullfort,
      round(avg(r.tid_sek) filter (where r.status = 'vunnet' and r.tid_sek is not null), 1) as snitt_tid,
      round(avg(r.hint_antall) filter (where r.status = 'vunnet'), 2) as snitt_hint,
      round(avg(r.forsok) filter (where r.status = 'vunnet' and r.forsok is not null), 2) as snitt_forsok,
      round(avg(r.poeng) filter (where r.status in ('vunnet', 'ferdig') and r.poeng is not null), 2) as snitt_poeng
    from public.spill_resultater r
    join tillatte t on t.user_id = r.user_id
    where r.spill_id = p_spill_id
      and r.dato >= p_fra
      and r.dato <= p_til
      and r.verifisert = true
    group by t.user_id, t.visningsnavn;
end;
$$;
revoke all on function public.spill_ledertavle(text, date, date, text) from public, anon;
grant execute on function public.spill_ledertavle(text, date, date, text) to authenticated;

-- Signerte rader for server-side signatursjekk før aggregering i API-et (kun visningsnavn + resultatfelter, aldri e-post)
create function public.spill_ledertavle_rader(
  p_spill_id text,
  p_fra date,
  p_til date,
  p_omfang text default 'global'
)
returns table (
  bruker_id uuid,
  visningsnavn text,
  dato date,
  status text,
  poeng numeric,
  forsok integer,
  hint_antall integer,
  tid_sek integer,
  signatur text
)
language plpgsql security definer set search_path = '' as $$
declare
  v_meg uuid := auth.uid();
begin
  if v_meg is null or p_omfang not in ('global', 'venner') then
    return;
  end if;
  return query
    with tillatte as (
      select p.user_id, p.visningsnavn
      from public.spill_profiler p
      where p_omfang = 'global'
        or p.user_id = v_meg
        or exists (
          select 1 from public.spill_vennskap v
          where v.status = 'godtatt'
            and (
              (v.avsender_id = v_meg and v.mottaker_id = p.user_id)
              or (v.mottaker_id = v_meg and v.avsender_id = p.user_id)
            )
        )
    )
    select
      t.user_id as bruker_id,
      t.visningsnavn,
      r.dato,
      r.status,
      r.poeng,
      r.forsok,
      r.hint_antall,
      r.tid_sek,
      r.signatur
    from public.spill_resultater r
    join tillatte t on t.user_id = r.user_id
    where r.spill_id = p_spill_id
      and r.dato >= p_fra
      and r.dato <= p_til
      and r.verifisert = true;
end;
$$;
revoke all on function public.spill_ledertavle_rader(text, date, date, text) from public, anon;
grant execute on function public.spill_ledertavle_rader(text, date, date, text) to authenticated;
