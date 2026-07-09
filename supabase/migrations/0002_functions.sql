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
