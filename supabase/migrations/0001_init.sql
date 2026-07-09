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
