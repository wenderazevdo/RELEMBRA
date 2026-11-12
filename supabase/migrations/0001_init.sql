-- Relembra: tabelas, RLS e funções. Cole no SQL Editor do Supabase.
create table public.decks(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(trim(name))>0),
  created_at timestamptz not null default now());
create table public.cards(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  deck_id uuid not null references public.decks on delete cascade,
  question text not null check (length(trim(question))>0),
  answer text not null check (length(trim(answer))>0),
  subject text, topic text, tags text[] not null default '{}', source text,
  favorite boolean not null default false, suspended boolean not null default false,
  due_at timestamptz, ease real not null default 2.5, interval_days int not null default 0,
  reps int not null default 0, lapses int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reviews(
  id uuid primary key, -- gerado no app: impede revisão duplicada ao sincronizar
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  card_id uuid not null references public.cards on delete cascade,
  deck_id uuid not null,
  rating smallint not null check (rating between 0 and 3),
  reviewed_at timestamptz not null,
  active_ms int not null default 0 check (active_ms >= 0),
  topic text, prev jsonb);
create index on public.cards(user_id, deck_id);
create index on public.cards(user_id, due_at);
create index on public.reviews(user_id, reviewed_at);
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.reviews enable row level security;
create policy "decks do dono" on public.decks for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "cards do dono" on public.cards for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "revisoes do dono" on public.reviews for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create or replace function public.registrar_revisao(p_id uuid,p_card uuid,p_rating smallint,p_at timestamptz,p_ms int,p_ease real,p_ivl int,p_reps int,p_lapses int,p_due timestamptz)
returns boolean language plpgsql security invoker set search_path=public as $$
declare c public.cards;
begin
  select * into c from cards where id=p_card for update;
  if not found then raise exception 'card não encontrado'; end if;
  insert into reviews(id,card_id,deck_id,rating,reviewed_at,active_ms,topic,prev)
  values(p_id,p_card,c.deck_id,p_rating,p_at,p_ms,coalesce(c.topic,c.subject),
    jsonb_build_object('ease',c.ease,'ivl',c.interval_days,'reps',c.reps,'lapses',c.lapses,'due',c.due_at))
  on conflict (id) do nothing;
  if not found then return false; end if;
  update cards set ease=p_ease,interval_days=p_ivl,reps=p_reps,lapses=p_lapses,due_at=p_due,updated_at=now() where id=p_card;
  return true;
end $$;

create or replace function public.desfazer_revisao(p_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare r public.reviews;
begin
  select * into r from reviews where id=p_id for update;
  if not found then return; end if;
  update cards set ease=(r.prev->>'ease')::real, interval_days=(r.prev->>'ivl')::int, reps=(r.prev->>'reps')::int,
    lapses=(r.prev->>'lapses')::int, due_at=nullif(r.prev->>'due','')::timestamptz, updated_at=now() where id=r.card_id;
  delete from reviews where id=p_id;
end $$;

create or replace function public.heatmap_diario(p_tz text default 'America/Sao_Paulo', p_dias int default 365)
returns table(dia date, revisoes bigint, cards_unicos bigint, tempo_ms bigint)
language sql stable security invoker set search_path=public as $$
  select (reviewed_at at time zone p_tz)::date, count(*), count(distinct card_id), coalesce(sum(active_ms),0)::bigint
  from reviews where reviewed_at >= now() - make_interval(days => p_dias) group by 1 order by 1 $$;

create or replace function public.resgate_cards(p_limite int default 8)
returns table(card_id uuid, pontos int) language sql stable security invoker set search_path=public as $$
  with r as (select card_id,
      count(*) filter (where rating=0 and reviewed_at>now()-interval '7 days')*3 as erros,
      case when count(*) filter (where rating=1 and reviewed_at>now()-interval '14 days')>=2 then 2 else 0 end as dificeis
    from reviews group by card_id),
  s as (select c.id, (coalesce(r.erros,0)+coalesce(r.dificeis,0)+case when c.due_at<now()-interval '1 day' then 1 else 0 end)::int as pts
    from cards c left join r on r.card_id=c.id where not c.suspended and c.due_at is not null)
  select id, pts from s where pts>0 order by pts desc limit p_limite $$;
