-- HFOS Supabase Auth + Postgres/RLS spike schema.
--
-- This file is for a disposable Supabase project only.
-- Do not run it against production data.

create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  currency text not null,
  timezone text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text not null,
  role text not null,
  status text not null default 'active',
  linked_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_memberships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid not null references public.household_members(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_member_id uuid references public.household_members(id),
  name text not null,
  account_class text not null,
  account_type text not null,
  visibility text not null default 'household',
  currency text not null,
  balance numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_member_id uuid references public.household_members(id),
  paid_by_member_id uuid references public.household_members(id),
  source_account_id uuid references public.accounts(id),
  destination_account_id uuid references public.accounts(id),
  type text not null,
  amount numeric(14, 2) not null,
  category text not null,
  description text not null default '',
  visibility text not null default 'household',
  transaction_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);

create table if not exists public.migration_drafts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete set null,
  owner_user_id uuid not null references auth.users(id),
  owner_member_id uuid not null,
  household_name text not null,
  backup_summary jsonb not null,
  status text not null default 'uploaded',
  validation_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_memberships enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.migration_drafts enable row level security;

create or replace function public.is_active_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_memberships membership
    where membership.household_id = target_household_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_memberships membership
    where membership.household_id = target_household_id
      and membership.user_id = auth.uid()
      and membership.role = 'owner'
      and membership.status = 'active'
  );
$$;

create policy "active members can read households"
on public.households
for select
using (public.is_active_household_member(id));

create policy "active members can read household members"
on public.household_members
for select
using (public.is_active_household_member(household_id));

create policy "active members can read memberships"
on public.household_memberships
for select
using (public.is_active_household_member(household_id));

create policy "active members can read household accounts"
on public.accounts
for select
using (
  public.is_active_household_member(household_id)
  and (
    visibility <> 'private'
    or exists (
      select 1
      from public.household_members member
      where member.id = owner_member_id
        and member.household_id = accounts.household_id
        and member.linked_user_id = auth.uid()
        and member.status = 'active'
    )
  )
);

create policy "active members can read household transactions"
on public.transactions
for select
using (
  public.is_active_household_member(household_id)
  and visibility <> 'private'
);

create policy "users can read own migration drafts"
on public.migration_drafts
for select
using (owner_user_id = auth.uid());

create or replace function public.claim_household_from_backup(
  draft_household_name text,
  draft_country text default 'PH',
  draft_currency text default 'PHP',
  draft_timezone text default 'Asia/Manila',
  draft_backup_summary jsonb default '{}'::jsonb
)
returns table (
  household_id uuid,
  membership_id uuid,
  member_id uuid,
  user_id uuid,
  role text,
  membership_status text,
  migration_draft_id uuid,
  migration_status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_household_id uuid;
  created_member_id uuid;
  created_membership_id uuid;
  created_migration_id uuid;
  created_timestamp timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'Sign in before claiming a household.';
  end if;

  insert into public.households (
    name,
    country,
    currency,
    timezone,
    status,
    created_at,
    updated_at
  )
  values (
    draft_household_name,
    draft_country,
    draft_currency,
    draft_timezone,
    'active',
    created_timestamp,
    created_timestamp
  )
  returning id into created_household_id;

  insert into public.household_members (
    household_id,
    display_name,
    role,
    status,
    linked_user_id,
    created_at,
    updated_at
  )
  values (
    created_household_id,
    'Household owner',
    'owner',
    'active',
    current_user_id,
    created_timestamp,
    created_timestamp
  )
  returning id into created_member_id;

  insert into public.household_memberships (
    household_id,
    member_id,
    user_id,
    role,
    status,
    created_at,
    updated_at
  )
  values (
    created_household_id,
    created_member_id,
    current_user_id,
    'owner',
    'active',
    created_timestamp,
    created_timestamp
  )
  returning id into created_membership_id;

  insert into public.migration_drafts (
    household_id,
    owner_user_id,
    owner_member_id,
    household_name,
    backup_summary,
    status,
    created_at,
    updated_at
  )
  values (
    created_household_id,
    current_user_id,
    created_member_id,
    draft_household_name,
    draft_backup_summary,
    'uploaded',
    created_timestamp,
    created_timestamp
  )
  returning id into created_migration_id;

  return query
  select
    created_household_id,
    created_membership_id,
    created_member_id,
    current_user_id,
    'owner'::text,
    'active'::text,
    created_migration_id,
    'uploaded'::text,
    created_timestamp,
    created_timestamp;
end;
$$;

revoke all on function public.claim_household_from_backup(
  text,
  text,
  text,
  text,
  jsonb
) from public;

grant execute on function public.claim_household_from_backup(
  text,
  text,
  text,
  text,
  jsonb
) to authenticated;

create or replace function public.validate_migration_draft_metadata(
  target_draft_id uuid
)
returns table (
  draft_id uuid,
  status text,
  validated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  validation_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in before validating a migration draft.';
  end if;

  select *
  into selected_draft
  from public.migration_drafts
  where id = target_draft_id
    and owner_user_id = current_user_id
  for update;

  if selected_draft.id is null then
    raise exception 'Migration draft was not found for the current user.';
  end if;

  if selected_draft.household_id is null then
    raise exception 'Migration draft is missing a linked household.';
  end if;

  if selected_draft.owner_member_id is null then
    raise exception 'Migration draft is missing an owner member.';
  end if;

  if selected_draft.status not in ('draft', 'uploaded', 'validated') then
    raise exception 'Migration draft cannot be validated from status %.',
      selected_draft.status;
  end if;

  update public.migration_drafts
  set
    status = 'validated',
    validation_summary = jsonb_build_object(
      'mode',
      'metadata-only',
      'recordCountsMatch',
      true,
      'validatedAt',
      validation_timestamp
    ),
    updated_at = validation_timestamp
  where id = selected_draft.id;

  return query
  select
    selected_draft.id,
    'validated'::text,
    validation_timestamp;
end;
$$;

revoke all on function public.validate_migration_draft_metadata(uuid)
from public;

grant execute on function public.validate_migration_draft_metadata(uuid)
to authenticated;

create or replace function public.abort_migration_draft(
  target_draft_id uuid
)
returns table (
  draft_id uuid,
  status text,
  aborted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  abort_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in before aborting a migration draft.';
  end if;

  select *
  into selected_draft
  from public.migration_drafts
  where id = target_draft_id
    and owner_user_id = current_user_id
  for update;

  if selected_draft.id is null then
    raise exception 'Migration draft was not found for the current user.';
  end if;

  if selected_draft.status = 'committed' then
    raise exception 'Committed migration drafts cannot be aborted.';
  end if;

  update public.migration_drafts
  set
    status = 'aborted',
    updated_at = abort_timestamp
  where id = selected_draft.id;

  return query
  select
    selected_draft.id,
    'aborted'::text,
    abort_timestamp;
end;
$$;

revoke all on function public.abort_migration_draft(uuid)
from public;

grant execute on function public.abort_migration_draft(uuid)
to authenticated;

-- Spike insert/update paths should be tested through RPC functions rather than
-- broad client-side table policies. That keeps migration draft creation and
-- commit/abort behavior explicit.
