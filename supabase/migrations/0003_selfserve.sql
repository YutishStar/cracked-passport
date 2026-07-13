-- Self-serve verification: a signed-in visitor submits a request tied to their
-- Clerk account; the admin approves; they become a fellow bound to that account
-- (no claim link needed). Auth is username-only — no email required anywhere.

-- Return type of approve_application changes below, so drop the old one first.
drop function if exists approve_application(uuid, text, text, timestamptz);

-- Username-only auth: email is optional everywhere.
alter table applications alter column email drop not null;
alter table applications drop constraint if exists applications_email_key;
alter table fellows alter column email drop not null;

alter table applications add column if not exists clerk_user_id text;

-- One open request per signed-in user.
create unique index if not exists uniq_pending_app_per_user
  on applications (clerk_user_id)
  where status = 'pending' and clerk_user_id is not null;

-- Approve now also copies the applicant's Clerk id onto the fellow, so a
-- self-serve applicant is already bound to their account on approval.
create or replace function approve_application(
  p_app_id     uuid,
  p_reviewer   text,
  p_token_hash text,
  p_expires    timestamptz
)
returns table (fellow_id uuid, fellow_number int, clerk_user_id text)
language plpgsql
as $$
declare
  v_app    applications%rowtype;
  v_number int;
  v_fellow uuid;
begin
  select * into v_app from applications where id = p_app_id for update;
  if not found then raise exception 'application % not found', p_app_id; end if;
  if v_app.status <> 'pending' then raise exception 'application % is not pending', p_app_id; end if;

  v_number := nextval('fellow_number_seq');

  insert into fellows (fellow_number, application_id, display_name, email, links, status, clerk_user_id)
  values (
    v_number, v_app.id, v_app.name, v_app.email,
    coalesce(v_app.links, '{}'::jsonb) || jsonb_build_object('github', v_app.github_url),
    'invited', v_app.clerk_user_id
  )
  returning id into v_fellow;

  update applications
    set status = 'approved', reviewed_at = now(), reviewed_by = p_reviewer, fellow_id = v_fellow
    where id = p_app_id;

  insert into claim_tokens (fellow_id, token_hash, expires_at)
  values (v_fellow, p_token_hash, p_expires);

  insert into passports (fellow_id, token_id, status)
  values (v_fellow, v_number, 'pending');

  insert into timeline_events (fellow_id, kind, title, occurred_at)
  values (v_fellow, 'accepted', 'Accepted to Cracked', now());

  return query select v_fellow, v_number, v_app.clerk_user_id;
end;
$$;

-- Finish onboarding for a self-serve fellow already bound to their Clerk account
-- (no token). Sets the handle and flips to claimed.
create or replace function complete_onboarding(
  p_clerk_user text,
  p_username   text
)
returns table (fellow_id uuid, fellow_number int)
language plpgsql
as $$
declare
  v_fellow fellows%rowtype;
begin
  select * into v_fellow from fellows where clerk_user_id = p_clerk_user for update;
  if not found then raise exception 'not_a_fellow'; end if;
  if v_fellow.status = 'revoked' then raise exception 'revoked'; end if;

  if exists (select 1 from fellows where username = p_username and id <> v_fellow.id) then
    raise exception 'username_taken';
  end if;

  update fellows
    set username = p_username, status = 'claimed', claimed_at = coalesce(claimed_at, now())
    where id = v_fellow.id;

  insert into timeline_events (fellow_id, kind, title, occurred_at)
  values (v_fellow.id, 'claimed', 'Claimed Passport', now())
  on conflict do nothing;

  return query select v_fellow.id, v_fellow.fellow_number;
end;
$$;
