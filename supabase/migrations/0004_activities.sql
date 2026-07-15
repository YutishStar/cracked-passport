-- Activities & certificates.
--
-- One system covers four things that are really the same shape — "something
-- happened, and the people who took part can claim a token for it":
--   hackathon   → a hackathon the fellow joined
--   luma        → a Luma event
--   house       → a house activity
--   build_post  → a fellow's daily "here's what I'm building" post, which
--                 others claim to show they were part of / saw it
--
-- On-chain each activity is one ERC-1155 token id (CrackedCertificates); every
-- claimer holds the same id. The issuer wallet mints on their behalf, so
-- fellows never pay gas.

create type activity_kind as enum ('hackathon', 'luma', 'house', 'activity', 'build_post');

-- Sequential on-chain token ids for activities (independent of fellow numbers).
create sequence if not exists activity_token_seq start 1;

create table activities (
  id             uuid primary key default gen_random_uuid(),
  token_id       int not null unique default nextval('activity_token_seq'),
  kind           activity_kind not null,
  title          text not null,
  body           text,
  image_url      text,
  link_url       text,                 -- e.g. the Luma page / repo / demo
  house_id       uuid references houses(id) on delete set null,

  -- who published it: an admin (null) or a fellow (their daily build post)
  created_by_fellow_id uuid references fellows(id) on delete set null,
  created_by     text,                 -- admin email, when admin-created

  -- claiming
  claim_code_hash text,                -- sha256 of the secret in the claim link
  is_open        boolean not null default true,
  opens_at       timestamptz not null default now(),
  closes_at      timestamptz,
  max_claims     int,                  -- null = unlimited

  -- chain mirror
  metadata_cid   text,
  chain_status   passport_status not null default 'pending',
  tx_hash        text,

  created_at     timestamptz not null default now()
);

create index idx_activities_kind on activities (kind, created_at desc);
create index idx_activities_creator on activities (created_by_fellow_id, created_at desc);

create table activity_claims (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references activities(id) on delete cascade,
  fellow_id    uuid not null references fellows(id) on delete cascade,
  claimed_at   timestamptz not null default now(),
  tx_hash      text,
  chain_status passport_status not null default 'pending',
  unique (activity_id, fellow_id)      -- one claim per fellow per activity
);

create index idx_claims_fellow on activity_claims (fellow_id);
create index idx_claims_activity on activity_claims (activity_id);

-- Timeline gains the new event kinds so claims show up in a fellow's Journey.
alter type timeline_kind add value if not exists 'certificate';
alter type timeline_kind add value if not exists 'build_post';

-- Deny-by-default, same as every other table (service-role bypasses this).
alter table activities enable row level security;
alter table activity_claims enable row level security;
