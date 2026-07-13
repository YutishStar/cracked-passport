-- ============================================================
-- Cracked Passport — full setup. Paste ALL of this into the
-- Supabase SQL editor and hit Run. Safe to run once.
-- ============================================================

-- ===== 0001_init.sql =====
-- Cracked Passport — initial schema
-- Auth is Clerk; this DB is accessed ONLY via the service-role key from server
-- code. RLS is enabled with no policies (deny-by-default) so a leaked anon key
-- can read nothing. Authorization lives in lib/auth.ts.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type application_status as enum ('pending', 'approved', 'rejected');
create type fellow_status      as enum ('invited', 'claimed', 'revoked');
create type passport_status    as enum ('pending', 'issued', 'deferred', 'failed');
create type chain_name         as enum ('fuji', 'avalanche');
create type stamp_kind         as enum ('house', 'special');
create type timeline_kind      as enum (
  'accepted', 'claimed', 'house_arrival', 'house_departure',
  'stamp', 'achievement', 'perk', 'custom'
);

-- Sequential fellow numbers (#001, #002 …). Consumed inside the approve tx.
create sequence if not exists fellow_number_seq start 1;

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table applications (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        citext not null unique,
  github_url   text,
  links        jsonb not null default '{}'::jsonb,
  answers      jsonb not null default '{}'::jsonb,
  status       application_status not null default 'pending',
  reviewed_at  timestamptz,
  reviewed_by  text,
  fellow_id    uuid,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fellows (core identity)
-- ---------------------------------------------------------------------------
create table fellows (
  id               uuid primary key default gen_random_uuid(),
  fellow_number    int not null unique,
  application_id   uuid references applications(id) on delete set null,
  clerk_user_id    text unique,
  username         citext unique,
  display_name     text not null,
  email            citext not null,
  bio              text,
  avatar_url       text,
  links            jsonb not null default '{}'::jsonb, -- {github,linkedin,x,portfolio}
  current_startup  text,
  current_house_id uuid,
  status           fellow_status not null default 'invited',
  claimed_at       timestamptz,
  created_at       timestamptz not null default now()
);

alter table applications
  add constraint applications_fellow_fk
  foreign key (fellow_id) references fellows(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Claim tokens (single-use, hashed at rest)
-- ---------------------------------------------------------------------------
create table claim_tokens (
  id          uuid primary key default gen_random_uuid(),
  fellow_id   uuid not null references fellows(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Wallets (never shown in UI — ownership proof only)
-- ---------------------------------------------------------------------------
create table wallets (
  id           uuid primary key default gen_random_uuid(),
  fellow_id    uuid not null references fellows(id) on delete cascade,
  address      text not null unique,
  chain        chain_name not null default 'fuji',
  is_primary   boolean not null default true,
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Passports (mirror of on-chain state)
-- ---------------------------------------------------------------------------
create table passports (
  id                uuid primary key default gen_random_uuid(),
  fellow_id         uuid not null unique references fellows(id) on delete cascade,
  token_id          int, -- equals fellow_number
  contract_address  text,
  chain             chain_name,
  tx_hash           text,
  metadata_cid      text,
  status            passport_status not null default 'pending',
  issued_at         timestamptz,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Houses + residencies
-- ---------------------------------------------------------------------------
create table houses (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  city       text,
  country    text,
  flag       text,
  starts_on  date,
  ends_on    date,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table fellows
  add constraint fellows_current_house_fk
  foreign key (current_house_id) references houses(id) on delete set null;

create table house_residencies (
  id          uuid primary key default gen_random_uuid(),
  fellow_id   uuid not null references fellows(id) on delete cascade,
  house_id    uuid not null references houses(id) on delete cascade,
  arrived_on  date not null,
  departed_on date,
  created_at  timestamptz not null default now(),
  unique (fellow_id, house_id, arrived_on)
);

-- ---------------------------------------------------------------------------
-- Stamps
-- ---------------------------------------------------------------------------
create table stamp_types (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  house_id    uuid references houses(id) on delete set null,
  artwork_url text,
  kind        stamp_kind not null default 'house',
  created_at  timestamptz not null default now()
);

create table fellow_stamps (
  id            uuid primary key default gen_random_uuid(),
  fellow_id     uuid not null references fellows(id) on delete cascade,
  stamp_type_id uuid not null references stamp_types(id) on delete cascade,
  issued_by     text,
  note          text,
  seen_at       timestamptz, -- null => animate as "new" on next open
  issued_at     timestamptz not null default now(),
  unique (fellow_id, stamp_type_id)
);

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
create table achievement_types (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon_url    text,
  created_at  timestamptz not null default now()
);

create table fellow_achievements (
  id                  uuid primary key default gen_random_uuid(),
  fellow_id           uuid not null references fellows(id) on delete cascade,
  achievement_type_id uuid not null references achievement_types(id) on delete cascade,
  issued_by           text,
  note                text,
  seen_at             timestamptz,
  issued_at           timestamptz not null default now(),
  unique (fellow_id, achievement_type_id)
);

-- ---------------------------------------------------------------------------
-- Sponsors + perks
-- ---------------------------------------------------------------------------
create table sponsors (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  logo_url   text,
  url        text,
  created_at timestamptz not null default now()
);

create table perks (
  id             uuid primary key default gen_random_uuid(),
  sponsor_id     uuid references sponsors(id) on delete set null,
  name           text not null,
  description    text,
  redemption_url text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table fellow_perks (
  id           uuid primary key default gen_random_uuid(),
  fellow_id    uuid not null references fellows(id) on delete cascade,
  perk_id      uuid not null references perks(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  redeemed_at  timestamptz,
  unique (fellow_id, perk_id)
);

-- ---------------------------------------------------------------------------
-- Timeline (the Journey)
-- ---------------------------------------------------------------------------
create table timeline_events (
  id          uuid primary key default gen_random_uuid(),
  fellow_id   uuid not null references fellows(id) on delete cascade,
  kind        timeline_kind not null,
  title       text not null,
  subtitle    text,
  occurred_at timestamptz not null default now(),
  ref_id      uuid,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_timeline_fellow on timeline_events (fellow_id, occurred_at);
create index idx_residencies_fellow on house_residencies (fellow_id);
create index idx_stamps_fellow on fellow_stamps (fellow_id);
create index idx_achievements_fellow on fellow_achievements (fellow_id);
create index idx_perks_fellow on fellow_perks (fellow_id);

-- ---------------------------------------------------------------------------
-- RLS: enable everywhere, add NO policies. Service-role bypasses RLS, so all
-- server access works; anon/authenticated clients are denied by default.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ===== 0002_functions.sql =====
-- Atomic application approval. The claim token is generated in JS (crypto) and
-- its sha256 hash is passed in; everything else happens in one transaction:
--   assign fellow_number → create fellow → link + close application →
--   store claim token → write the "Accepted to Cracked" timeline event.

create or replace function approve_application(
  p_app_id     uuid,
  p_reviewer   text,
  p_token_hash text,
  p_expires    timestamptz
)
returns table (fellow_id uuid, fellow_number int)
language plpgsql
as $$
declare
  v_app      applications%rowtype;
  v_number   int;
  v_fellow   uuid;
begin
  select * into v_app from applications where id = p_app_id for update;
  if not found then
    raise exception 'application % not found', p_app_id;
  end if;
  if v_app.status <> 'pending' then
    raise exception 'application % is not pending', p_app_id;
  end if;

  v_number := nextval('fellow_number_seq');

  insert into fellows (fellow_number, application_id, display_name, email, links, status)
  values (
    v_number,
    v_app.id,
    v_app.name,
    v_app.email,
    coalesce(v_app.links, '{}'::jsonb)
      || jsonb_build_object('github', v_app.github_url),
    'invited'
  )
  returning id into v_fellow;

  update applications
    set status = 'approved', reviewed_at = now(),
        reviewed_by = p_reviewer, fellow_id = v_fellow
    where id = p_app_id;

  insert into claim_tokens (fellow_id, token_hash, expires_at)
  values (v_fellow, p_token_hash, p_expires);

  insert into passports (fellow_id, token_id, status)
  values (v_fellow, v_number, 'pending');

  insert into timeline_events (fellow_id, kind, title, occurred_at)
  values (v_fellow, 'accepted', 'Accepted to Cracked', now());

  return query select v_fellow, v_number;
end;
$$;

-- Bind a Clerk user to a fellow at claim time. Validates the token (unused,
-- unexpired), enforces one-fellow-per-Clerk-user, sets the username, flips the
-- fellow to 'claimed', and writes the "Claimed Passport" timeline event.
create or replace function complete_claim(
  p_token_hash   text,
  p_clerk_user   text,
  p_username     text
)
returns table (fellow_id uuid, fellow_number int)
language plpgsql
as $$
declare
  v_tok    claim_tokens%rowtype;
  v_fellow fellows%rowtype;
begin
  select * into v_tok from claim_tokens where token_hash = p_token_hash for update;
  if not found then raise exception 'invalid_token'; end if;
  if v_tok.used_at is not null then raise exception 'token_used'; end if;
  if v_tok.expires_at < now() then raise exception 'token_expired'; end if;

  select * into v_fellow from fellows where id = v_tok.fellow_id for update;
  if v_fellow.status = 'revoked' then raise exception 'revoked'; end if;

  -- One fellow per Clerk user.
  if exists (
    select 1 from fellows
    where clerk_user_id = p_clerk_user and id <> v_fellow.id
  ) then
    raise exception 'clerk_user_taken';
  end if;

  -- Username uniqueness (case-insensitive via citext).
  if exists (
    select 1 from fellows where username = p_username and id <> v_fellow.id
  ) then
    raise exception 'username_taken';
  end if;

  update fellows
    set clerk_user_id = p_clerk_user,
        username = p_username,
        status = 'claimed',
        claimed_at = coalesce(claimed_at, now())
    where id = v_fellow.id;

  update claim_tokens set used_at = now() where id = v_tok.id;

  insert into timeline_events (fellow_id, kind, title, occurred_at)
  values (v_fellow.id, 'claimed', 'Claimed Passport', now())
  on conflict do nothing;

  return query select v_fellow.id, v_fellow.fellow_number;
end;
$$;

-- ===== seed.sql =====
-- Seed catalogs. Idempotent: safe to re-run.

insert into houses (slug, name, city, country, flag, is_active) values
  ('bangalore', 'Cracked Bangalore', 'Bangalore', 'India',    '🇮🇳', false),
  ('vietnam',   'Cracked Da Nang',   'Da Nang',   'Vietnam',  '🇻🇳', true),
  ('dubai',     'Cracked Dubai',     'Dubai',     'UAE',      '🇦🇪', false),
  ('bali',      'Cracked Bali',      'Bali',      'Indonesia','🇮🇩', false)
on conflict (slug) do nothing;

insert into stamp_types (slug, name, house_id, kind)
select h.slug, h.name, h.id, 'house'
from houses h
on conflict (slug) do nothing;

insert into achievement_types (slug, name, description) values
  ('hosted-workshop',  'Hosted Workshop',        'Ran a session for the house.'),
  ('demo-day-winner',  'Demo Day Winner',        'Won a Cracked demo day.'),
  ('mentor',           'Mentor',                 'Mentored other Fellows.'),
  ('open-source',      'Open Source Contributor','Shipped meaningful open source.'),
  ('speaker',          'Speaker',                'Spoke at a Cracked event.'),
  ('builder-grant',    'Builder Grant',          'Received a Cracked builder grant.')
on conflict (slug) do nothing;

insert into sponsors (slug, name) values
  ('boardy', 'Boardy'),
  ('team1',  'Team1'),
  ('aws',    'AWS'),
  ('linear', 'Linear')
on conflict (slug) do nothing;

insert into perks (sponsor_id, name, description)
select s.id, p.name, p.description
from (values
  ('boardy', 'Boardy Pro',     'Pro access to Boardy.'),
  ('team1',  'Team1 Credits',  'Content credits from Team1.'),
  ('aws',    'AWS Credits',    'Cloud credits from AWS.'),
  ('linear', 'Linear',         'Linear for your team.')
) as p(sponsor_slug, name, description)
join sponsors s on s.slug = p.sponsor_slug
on conflict do nothing;
