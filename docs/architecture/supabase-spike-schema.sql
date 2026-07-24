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
  invited_by_user_id uuid references auth.users(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

alter table public.household_memberships
add column if not exists invited_by_user_id uuid references auth.users(id);

alter table public.household_memberships
add column if not exists invited_at timestamptz;

alter table public.household_memberships
add column if not exists accepted_at timestamptz;

alter table public.household_memberships
add column if not exists removed_at timestamptz;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text,
  owner_member_id uuid references public.household_members(id),
  name text not null,
  institution text,
  account_class text not null,
  account_type text not null,
  visibility text not null default 'household',
  currency text not null,
  base_currency text,
  exchange_rate numeric(18, 8),
  exchange_rate_effective_date date,
  exchange_rate_source text,
  exchange_rate_provider text,
  opening_balance numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  opening_base_balance numeric(14, 2),
  current_base_balance numeric(14, 2),
  account_number text,
  credit_limit numeric(14, 2),
  statement_balance numeric(14, 2),
  minimum_payment numeric(14, 2),
  payment_due_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);

alter table public.accounts
add column if not exists local_record_id text;

alter table public.accounts
add column if not exists institution text;

alter table public.accounts
add column if not exists base_currency text;

alter table public.accounts
add column if not exists exchange_rate numeric(18, 8);

alter table public.accounts
add column if not exists exchange_rate_effective_date date;

alter table public.accounts
add column if not exists exchange_rate_source text;

alter table public.accounts
add column if not exists exchange_rate_provider text;

alter table public.accounts
add column if not exists opening_balance numeric(14, 2) not null default 0;

alter table public.accounts
add column if not exists current_balance numeric(14, 2) not null default 0;

alter table public.accounts
add column if not exists opening_base_balance numeric(14, 2);

alter table public.accounts
add column if not exists current_base_balance numeric(14, 2);

alter table public.accounts
add column if not exists account_number text;

alter table public.accounts
add column if not exists credit_limit numeric(14, 2);

alter table public.accounts
add column if not exists statement_balance numeric(14, 2);

alter table public.accounts
add column if not exists minimum_payment numeric(14, 2);

alter table public.accounts
add column if not exists payment_due_date date;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text,
  created_by_member_id uuid references public.household_members(id),
  paid_by_member_id uuid references public.household_members(id),
  expense_split_method text,
  source_account_id uuid references public.accounts(id),
  destination_account_id uuid references public.accounts(id),
  type text not null,
  amount numeric(14, 2) not null,
  entered_amount numeric(14, 2),
  entered_currency text,
  base_currency text,
  base_amount numeric(14, 2),
  exchange_rate numeric(18, 8),
  exchange_rate_effective_date date,
  exchange_rate_source text,
  exchange_rate_provider text,
  category text not null,
  description text not null default '',
  notes text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  visibility text not null default 'household',
  transaction_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);

alter table public.transactions
add column if not exists local_record_id text;

alter table public.transactions
add column if not exists expense_split_method text;

alter table public.transactions
add column if not exists entered_amount numeric(14, 2);

alter table public.transactions
add column if not exists entered_currency text;

alter table public.transactions
add column if not exists base_currency text;

alter table public.transactions
add column if not exists base_amount numeric(14, 2);

alter table public.transactions
add column if not exists exchange_rate numeric(18, 8);

alter table public.transactions
add column if not exists exchange_rate_effective_date date;

alter table public.transactions
add column if not exists exchange_rate_source text;

alter table public.transactions
add column if not exists exchange_rate_provider text;

alter table public.transactions
add column if not exists notes text not null default '';

alter table public.transactions
add column if not exists attachments jsonb not null default '[]'::jsonb;

create table if not exists public.expense_allocations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text not null,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  paid_by_member_id uuid not null references public.household_members(id),
  member_id uuid not null references public.household_members(id),
  is_included boolean not null default true,
  allocated_amount numeric(14, 2) not null default 0,
  personal_amount numeric(14, 2),
  personal_items jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id),
  unique (household_id, local_record_id)
);

create table if not exists public.utility_provider_bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text not null,
  utility_type text not null,
  unit text not null,
  provider_name text not null,
  billing_date date not null,
  due_date date not null,
  total_bill_amount numeric(14, 2) not null default 0,
  rate_per_unit numeric(18, 8) not null default 0,
  status text not null default 'unpaid',
  form_snapshot jsonb not null default '{}'::jsonb,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  member_share_snapshot jsonb not null default '[]'::jsonb,
  bill_attachments jsonb not null default '[]'::jsonb,
  payment_attachments jsonb not null default '[]'::jsonb,
  paid_by_member_id uuid references public.household_members(id),
  source_account_id uuid references public.accounts(id),
  paid_at timestamptz,
  payment_reference_number text,
  transaction_id uuid references public.transactions(id),
  visibility text not null default 'household',
  description text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id),
  unique (household_id, local_record_id)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text not null,
  from_member_id uuid not null references public.household_members(id),
  to_member_id uuid not null references public.household_members(id),
  amount numeric(14, 2) not null,
  settlement_date date not null,
  source_account_id uuid references public.accounts(id),
  destination_account_id uuid references public.accounts(id),
  application_method text not null,
  reference_number text,
  notes text,
  attachments jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id),
  unique (household_id, local_record_id)
);

create table if not exists public.settlement_applications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text not null,
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  expense_allocation_id uuid not null references public.expense_allocations(id),
  applied_amount numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id),
  unique (household_id, local_record_id)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text not null,
  name text not null,
  description text,
  goal_type text not null,
  target_amount numeric(14, 2) not null,
  goal_currency text not null,
  base_currency text not null,
  target_base_amount numeric(14, 2) not null,
  exchange_rate numeric(18, 8) not null,
  exchange_rate_effective_date date not null,
  exchange_rate_source text,
  exchange_rate_provider text,
  target_date date,
  linked_account_id uuid references public.accounts(id),
  priority text not null,
  status text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id),
  unique (household_id, local_record_id)
);

create table if not exists public.savings_activities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  local_record_id text not null,
  savings_goal_id uuid not null references public.savings_goals(id) on delete cascade,
  member_id uuid not null references public.household_members(id),
  activity_type text not null,
  amount numeric(14, 2) not null,
  entered_amount numeric(14, 2) not null,
  entered_currency text not null,
  goal_currency_amount numeric(14, 2) not null,
  goal_currency text not null,
  base_currency text not null,
  base_amount numeric(14, 2) not null,
  exchange_rate numeric(18, 8) not null,
  exchange_rate_effective_date date not null,
  exchange_rate_source text,
  exchange_rate_provider text,
  activity_date date not null,
  account_id uuid references public.accounts(id),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id),
  unique (household_id, local_record_id)
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
  validated_at timestamptz,
  upload_manifest jsonb,
  upload_staged_record_count integer,
  upload_staged_at timestamptz,
  account_upload_staged_count integer,
  account_upload_staged_at timestamptz,
  transaction_upload_staged_count integer,
  transaction_upload_staged_at timestamptz,
  committed_at timestamptz,
  aborted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.migration_drafts
add column if not exists validated_at timestamptz;

alter table public.migration_drafts
add column if not exists upload_manifest jsonb;

alter table public.migration_drafts
add column if not exists upload_staged_record_count integer;

alter table public.migration_drafts
add column if not exists upload_staged_at timestamptz;

alter table public.migration_drafts
add column if not exists account_upload_staged_count integer;

alter table public.migration_drafts
add column if not exists account_upload_staged_at timestamptz;

alter table public.migration_drafts
add column if not exists transaction_upload_staged_count integer;

alter table public.migration_drafts
add column if not exists transaction_upload_staged_at timestamptz;

alter table public.migration_drafts
add column if not exists committed_at timestamptz;

alter table public.migration_drafts
add column if not exists aborted_at timestamptz;

create table if not exists public.migration_upload_manifests (
  id uuid primary key default gen_random_uuid(),
  migration_draft_id uuid not null references public.migration_drafts(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id),
  expected_record_count integer not null,
  manifest jsonb not null,
  status text not null default 'staged',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (migration_draft_id)
);

create unique index if not exists accounts_household_local_record_id_key
on public.accounts (household_id, local_record_id)
where local_record_id is not null;

create unique index if not exists transactions_household_local_record_id_key
on public.transactions (household_id, local_record_id)
where local_record_id is not null;

create index if not exists expense_allocations_transaction_id_idx
on public.expense_allocations (transaction_id);

create index if not exists utility_provider_bills_transaction_id_idx
on public.utility_provider_bills (transaction_id);

create index if not exists settlements_household_id_idx
on public.settlements (household_id);

create index if not exists settlement_applications_settlement_id_idx
on public.settlement_applications (settlement_id);

create index if not exists savings_goals_household_id_idx
on public.savings_goals (household_id);

create index if not exists savings_activities_savings_goal_id_idx
on public.savings_activities (savings_goal_id);

create index if not exists migration_upload_manifests_household_id_idx
on public.migration_upload_manifests (household_id);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_memberships enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.expense_allocations enable row level security;
alter table public.utility_provider_bills enable row level security;
alter table public.settlements enable row level security;
alter table public.settlement_applications enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_activities enable row level security;
alter table public.migration_drafts enable row level security;
alter table public.migration_upload_manifests enable row level security;

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

drop policy if exists "active members can read households"
on public.households;

create policy "active members can read households"
on public.households
for select
using (public.is_active_household_member(id));

drop policy if exists "active members can read household members"
on public.household_members;

create policy "active members can read household members"
on public.household_members
for select
using (public.is_active_household_member(household_id));

drop policy if exists "active members can read memberships"
on public.household_memberships;

create policy "active members can read memberships"
on public.household_memberships
for select
using (public.is_active_household_member(household_id));

drop policy if exists "active members can read household accounts"
on public.accounts;

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

drop policy if exists "active members can read household transactions"
on public.transactions;

create policy "active members can read household transactions"
on public.transactions
for select
using (
  public.is_active_household_member(household_id)
  and visibility <> 'private'
);

drop policy if exists "active members can read household expense allocations"
on public.expense_allocations;

create policy "active members can read household expense allocations"
on public.expense_allocations
for select
using (
  public.is_active_household_member(household_id)
  and exists (
    select 1
    from public.transactions remote_transaction
    where remote_transaction.id = expense_allocations.transaction_id
      and remote_transaction.household_id = expense_allocations.household_id
      and remote_transaction.visibility <> 'private'
  )
);

drop policy if exists "active members can read household utility provider bills"
on public.utility_provider_bills;

create policy "active members can read household utility provider bills"
on public.utility_provider_bills
for select
using (
  public.is_active_household_member(household_id)
  and visibility <> 'private'
);

drop policy if exists "active members can read household settlements"
on public.settlements;

create policy "active members can read household settlements"
on public.settlements
for select
using (public.is_active_household_member(household_id));

drop policy if exists "active members can read household settlement applications"
on public.settlement_applications;

create policy "active members can read household settlement applications"
on public.settlement_applications
for select
using (public.is_active_household_member(household_id));

drop policy if exists "active members can read household savings goals"
on public.savings_goals;

create policy "active members can read household savings goals"
on public.savings_goals
for select
using (public.is_active_household_member(household_id));

drop policy if exists "active members can read household savings activities"
on public.savings_activities;

create policy "active members can read household savings activities"
on public.savings_activities
for select
using (public.is_active_household_member(household_id));

drop policy if exists "users can read own migration drafts"
on public.migration_drafts;

create policy "users can read own migration drafts"
on public.migration_drafts
for select
using (owner_user_id = auth.uid());

drop policy if exists "users can read own migration upload manifests"
on public.migration_upload_manifests;

create policy "users can read own migration upload manifests"
on public.migration_upload_manifests
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
    validated_at = validation_timestamp,
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

create or replace function public.stage_migration_upload_manifest(
  target_draft_id uuid,
  expected_record_count integer,
  draft_upload_manifest jsonb
)
returns table (
  draft_id uuid,
  staged_record_count integer,
  staged_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  staging_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in before staging a migration upload manifest.';
  end if;

  if expected_record_count < 1 then
    raise exception 'Upload manifest expected record count must be positive.';
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

  if selected_draft.status <> 'validated' then
    raise exception 'Validate the migration draft before staging upload.';
  end if;

  insert into public.migration_upload_manifests (
    migration_draft_id,
    household_id,
    owner_user_id,
    expected_record_count,
    manifest,
    status,
    created_at,
    updated_at
  )
  values (
    selected_draft.id,
    selected_draft.household_id,
    current_user_id,
    expected_record_count,
    draft_upload_manifest,
    'staged',
    staging_timestamp,
    staging_timestamp
  )
  on conflict (migration_draft_id)
  do update set
    expected_record_count = excluded.expected_record_count,
    manifest = excluded.manifest,
    status = 'staged',
    updated_at = staging_timestamp;

  update public.migration_drafts
  set
    upload_manifest = draft_upload_manifest,
    upload_staged_record_count = expected_record_count,
    upload_staged_at = staging_timestamp,
    updated_at = staging_timestamp
  where id = selected_draft.id;

  return query
  select
    selected_draft.id,
    expected_record_count,
    staging_timestamp;
end;
$$;

revoke all on function public.stage_migration_upload_manifest(
  uuid,
  integer,
  jsonb
) from public;

grant execute on function public.stage_migration_upload_manifest(
  uuid,
  integer,
  jsonb
) to authenticated;

create or replace function public.stage_migration_accounts(
  target_draft_id uuid,
  expected_account_count integer,
  staged_accounts jsonb
)
returns table (
  draft_id uuid,
  staged_account_count integer,
  staged_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  staging_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
  expected_checkpoint_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in before staging migration accounts.';
  end if;

  if expected_account_count < 0 then
    raise exception 'Account upload expected count cannot be negative.';
  end if;

  if jsonb_typeof(staged_accounts) <> 'array' then
    raise exception 'Account upload payload must be an array.';
  end if;

  if jsonb_array_length(staged_accounts) <> expected_account_count then
    raise exception 'Account upload payload count does not match expected count.';
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

  if selected_draft.status <> 'validated' then
    raise exception 'Validate the migration draft before staging accounts.';
  end if;

  if selected_draft.upload_staged_at is null then
    raise exception 'Stage the migration upload manifest before staging accounts.';
  end if;

  expected_checkpoint_count :=
    coalesce((selected_draft.backup_summary ->> 'accountCount')::integer, 0);

  if expected_account_count <> expected_checkpoint_count then
    raise exception 'Account upload count does not match the migration checkpoint.';
  end if;

  with account_payload as (
    select account_record.id
    from jsonb_to_recordset(staged_accounts) as account_record(
      id text
    )
  )
  delete from public.accounts remote_account
  where remote_account.household_id = selected_draft.household_id
    and remote_account.local_record_id is not null
    and not exists (
      select 1
      from account_payload
      where account_payload.id = remote_account.local_record_id
    );

  insert into public.accounts (
    household_id,
    local_record_id,
    owner_member_id,
    name,
    institution,
    account_class,
    account_type,
    visibility,
    currency,
    base_currency,
    exchange_rate,
    exchange_rate_effective_date,
    exchange_rate_source,
    exchange_rate_provider,
    opening_balance,
    current_balance,
    opening_base_balance,
    current_base_balance,
    account_number,
    credit_limit,
    statement_balance,
    minimum_payment,
    payment_due_date,
    is_active,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    selected_draft.household_id,
    account_record.id,
    selected_draft.owner_member_id,
    account_record.name,
    nullif(account_record.institution, ''),
    account_record."accountClass",
    account_record.type,
    account_record.visibility,
    account_record.currency,
    nullif(account_record."baseCurrency", ''),
    account_record."exchangeRate",
    nullif(account_record."exchangeRateEffectiveDate", '')::date,
    account_record."exchangeRateSource",
    nullif(account_record."exchangeRateProvider", ''),
    account_record."openingBalance",
    account_record."currentBalance",
    account_record."openingBaseBalance",
    account_record."currentBaseBalance",
    nullif(account_record."accountNumber", ''),
    account_record."creditLimit",
    account_record."statementBalance",
    account_record."minimumPayment",
    nullif(account_record."paymentDueDate", '')::date,
    account_record."isActive",
    coalesce(nullif(account_record."createdAt", '')::timestamptz, staging_timestamp),
    coalesce(nullif(account_record."updatedAt", '')::timestamptz, staging_timestamp),
    current_user_id
  from jsonb_to_recordset(staged_accounts) as account_record(
    id text,
    visibility text,
    name text,
    institution text,
    "accountClass" text,
    type text,
    currency text,
    "baseCurrency" text,
    "exchangeRate" numeric,
    "exchangeRateEffectiveDate" text,
    "exchangeRateSource" text,
    "exchangeRateProvider" text,
    "openingBalance" numeric,
    "currentBalance" numeric,
    "openingBaseBalance" numeric,
    "currentBaseBalance" numeric,
    "accountNumber" text,
    "creditLimit" numeric,
    "statementBalance" numeric,
    "minimumPayment" numeric,
    "paymentDueDate" text,
    "isActive" boolean,
    "createdAt" text,
    "updatedAt" text
  )
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    owner_member_id = excluded.owner_member_id,
    name = excluded.name,
    institution = excluded.institution,
    account_class = excluded.account_class,
    account_type = excluded.account_type,
    visibility = excluded.visibility,
    currency = excluded.currency,
    base_currency = excluded.base_currency,
    exchange_rate = excluded.exchange_rate,
    exchange_rate_effective_date = excluded.exchange_rate_effective_date,
    exchange_rate_source = excluded.exchange_rate_source,
    exchange_rate_provider = excluded.exchange_rate_provider,
    opening_balance = excluded.opening_balance,
    current_balance = excluded.current_balance,
    opening_base_balance = excluded.opening_base_balance,
    current_base_balance = excluded.current_base_balance,
    account_number = excluded.account_number,
    credit_limit = excluded.credit_limit,
    statement_balance = excluded.statement_balance,
    minimum_payment = excluded.minimum_payment,
    payment_due_date = excluded.payment_due_date,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  update public.migration_drafts
  set
    account_upload_staged_count = expected_account_count,
    account_upload_staged_at = staging_timestamp,
    updated_at = staging_timestamp
  where id = selected_draft.id;

  return query
  select
    selected_draft.id,
    expected_account_count,
    staging_timestamp;
end;
$$;

revoke all on function public.stage_migration_accounts(
  uuid,
  integer,
  jsonb
) from public;

grant execute on function public.stage_migration_accounts(
  uuid,
  integer,
  jsonb
) to authenticated;

create or replace function public.stage_migration_transactions(
  target_draft_id uuid,
  expected_transaction_count integer,
  staged_transactions jsonb
)
returns table (
  draft_id uuid,
  staged_transaction_count integer,
  staged_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  staging_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
  expected_checkpoint_count integer;
  fallback_cash_account_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before staging migration transactions.';
  end if;

  if expected_transaction_count < 0 then
    raise exception 'Transaction upload expected count cannot be negative.';
  end if;

  if jsonb_typeof(staged_transactions) <> 'array' then
    raise exception 'Transaction upload payload must be an array.';
  end if;

  if jsonb_array_length(staged_transactions) <> expected_transaction_count then
    raise exception 'Transaction upload payload count does not match expected count.';
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

  if selected_draft.status <> 'validated' then
    raise exception 'Validate the migration draft before staging transactions.';
  end if;

  if selected_draft.account_upload_staged_at is null then
    raise exception 'Stage migration accounts before staging transactions.';
  end if;

  expected_checkpoint_count :=
    coalesce((selected_draft.backup_summary ->> 'transactionCount')::integer, 0);

  if expected_transaction_count <> expected_checkpoint_count then
    raise exception 'Transaction upload count does not match the migration checkpoint.';
  end if;

  with transaction_payload as (
    select transaction_record.id
    from jsonb_to_recordset(staged_transactions) as transaction_record(
      id text
    )
  )
  delete from public.transactions remote_transaction
  where remote_transaction.household_id = selected_draft.household_id
    and remote_transaction.local_record_id is not null
    and not exists (
      select 1
      from transaction_payload
      where transaction_payload.id = remote_transaction.local_record_id
    );

  insert into public.transactions (
    household_id,
    local_record_id,
    created_by_member_id,
    paid_by_member_id,
    expense_split_method,
    source_account_id,
    destination_account_id,
    type,
    amount,
    entered_amount,
    entered_currency,
    base_currency,
    base_amount,
    exchange_rate,
    exchange_rate_effective_date,
    exchange_rate_source,
    exchange_rate_provider,
    category,
    description,
    notes,
    attachments,
    visibility,
    transaction_date,
    is_active,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    selected_draft.household_id,
    transaction_record.id,
    selected_draft.owner_member_id,
    case
      when lower(trim(transaction_record.type)) = 'expense' then selected_draft.owner_member_id
      else null
    end,
    nullif(transaction_record."expenseSplitMethod", ''),
    case
      when lower(trim(transaction_record.type)) = 'expense' then
        coalesce(source_account.id, cash_account.id)
      else source_account.id
    end,
    destination_account.id,
    transaction_record.type,
    transaction_record.amount,
    transaction_record."enteredAmount",
    nullif(transaction_record."enteredCurrency", ''),
    nullif(transaction_record."baseCurrency", ''),
    transaction_record."baseAmount",
    transaction_record."exchangeRate",
    nullif(transaction_record."exchangeRateEffectiveDate", '')::date,
    transaction_record."exchangeRateSource",
    nullif(transaction_record."exchangeRateProvider", ''),
    transaction_record.category,
    coalesce(transaction_record.description, ''),
    coalesce(transaction_record.notes, ''),
    coalesce(transaction_record.attachments, '[]'::jsonb),
    coalesce(transaction_record.visibility, 'household'),
    transaction_record."transactionDate"::date,
    transaction_record."isActive",
    coalesce(nullif(transaction_record."createdAt", '')::timestamptz, staging_timestamp),
    coalesce(nullif(transaction_record."updatedAt", '')::timestamptz, staging_timestamp),
    current_user_id
  from jsonb_to_recordset(staged_transactions) as transaction_record(
    id text,
    "expenseSplitMethod" text,
    visibility text,
    type text,
    amount numeric,
    "enteredAmount" numeric,
    "enteredCurrency" text,
    "baseCurrency" text,
    "baseAmount" numeric,
    "exchangeRate" numeric,
    "exchangeRateEffectiveDate" text,
    "exchangeRateSource" text,
    "exchangeRateProvider" text,
    "sourceAccountId" text,
    "destinationAccountId" text,
    category text,
    description text,
    notes text,
    attachments jsonb,
    "transactionDate" text,
    "isActive" boolean,
    "createdAt" text,
    "updatedAt" text
  )
  left join public.accounts source_account
    on source_account.household_id = selected_draft.household_id
   and source_account.local_record_id = transaction_record."sourceAccountId"
  left join lateral (
    select fallback_account.id
    from public.accounts fallback_account
    where fallback_account.household_id = selected_draft.household_id
      and fallback_account.account_type = 'cash'
      and fallback_account.account_class = 'asset'
      and fallback_account.is_active = true
    order by
      case
        when lower(fallback_account.name) = 'cash' then 0
        else 1
      end,
      fallback_account.created_at,
      fallback_account.id
    limit 1
  ) cash_account on true
  left join public.accounts destination_account
    on destination_account.household_id = selected_draft.household_id
   and destination_account.local_record_id = transaction_record."destinationAccountId"
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    created_by_member_id = excluded.created_by_member_id,
    paid_by_member_id = excluded.paid_by_member_id,
    expense_split_method = excluded.expense_split_method,
    source_account_id = excluded.source_account_id,
    destination_account_id = excluded.destination_account_id,
    type = excluded.type,
    amount = excluded.amount,
    entered_amount = excluded.entered_amount,
    entered_currency = excluded.entered_currency,
    base_currency = excluded.base_currency,
    base_amount = excluded.base_amount,
    exchange_rate = excluded.exchange_rate,
    exchange_rate_effective_date = excluded.exchange_rate_effective_date,
    exchange_rate_source = excluded.exchange_rate_source,
    exchange_rate_provider = excluded.exchange_rate_provider,
    category = excluded.category,
    description = excluded.description,
    notes = excluded.notes,
    attachments = excluded.attachments,
    visibility = excluded.visibility,
    transaction_date = excluded.transaction_date,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  select fallback_account.id
  into fallback_cash_account_id
  from public.accounts fallback_account
  where fallback_account.household_id = selected_draft.household_id
    and fallback_account.account_type = 'cash'
    and fallback_account.account_class = 'asset'
    and fallback_account.is_active = true
  order by
    case
      when lower(fallback_account.name) = 'cash' then 0
      else 1
    end,
    fallback_account.created_at,
    fallback_account.id
  limit 1;

  if fallback_cash_account_id is not null then
    update public.transactions remote_transaction
    set
      source_account_id = fallback_cash_account_id,
      paid_by_member_id = coalesce(
        remote_transaction.paid_by_member_id,
        selected_draft.owner_member_id
      ),
      updated_at = staging_timestamp,
      updated_by_user_id = current_user_id
    where remote_transaction.household_id = selected_draft.household_id
      and remote_transaction.local_record_id is not null
      and lower(trim(remote_transaction.type)) = 'expense'
      and remote_transaction.source_account_id is null;
  end if;

  update public.migration_drafts
  set
    transaction_upload_staged_count = expected_transaction_count,
    transaction_upload_staged_at = staging_timestamp,
    updated_at = staging_timestamp
  where id = selected_draft.id;

  return query
  select
    selected_draft.id,
    expected_transaction_count,
    staging_timestamp;
end;
$$;

revoke all on function public.stage_migration_transactions(
  uuid,
  integer,
  jsonb
) from public;

grant execute on function public.stage_migration_transactions(
  uuid,
  integer,
  jsonb
) to authenticated;

create or replace function public.audit_migration_precommit(
  target_draft_id uuid
)
returns table (
  draft_id uuid,
  is_ready boolean,
  blocker_count integer,
  warning_count integer,
  blockers text[],
  warnings text[],
  account_count integer,
  transaction_count integer,
  missing_expense_source_account_count integer,
  missing_transaction_account_link_count integer,
  audited_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  audit_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
  expected_record_count integer;
  expected_account_count integer;
  expected_transaction_count integer;
  staged_account_count integer;
  staged_transaction_count integer;
  missing_expense_source_count integer;
  missing_transaction_link_count integer;
  audit_blockers text[] := array[]::text[];
  audit_warnings text[] := array[]::text[];
begin
  if current_user_id is null then
    raise exception 'Sign in before auditing a migration commit.';
  end if;

  select *
  into selected_draft
  from public.migration_drafts
  where id = target_draft_id
    and owner_user_id = current_user_id;

  if selected_draft.id is null then
    raise exception 'Migration draft was not found for the current user.';
  end if;

  expected_account_count :=
    coalesce((selected_draft.backup_summary ->> 'accountCount')::integer, 0);
  expected_transaction_count :=
    coalesce((selected_draft.backup_summary ->> 'transactionCount')::integer, 0);

  select count(*)::integer
  into staged_account_count
  from public.accounts
  where household_id = selected_draft.household_id
    and local_record_id is not null;

  select
    count(*)::integer,
    count(*) filter (
      where lower(trim(type)) = 'expense'
        and source_account_id is null
    )::integer,
    count(*) filter (
      where source_account_id is null
        and destination_account_id is null
    )::integer
  into
    staged_transaction_count,
    missing_expense_source_count,
    missing_transaction_link_count
  from public.transactions
  where household_id = selected_draft.household_id
    and local_record_id is not null;

  if selected_draft.household_id is null then
    audit_blockers := array_append(
      audit_blockers,
      'Migration draft is missing a linked household.'
    );
  end if;

  if selected_draft.owner_member_id is null then
    audit_blockers := array_append(
      audit_blockers,
      'Migration draft is missing an owner member.'
    );
  end if;

  if selected_draft.status <> 'validated' then
    audit_blockers := array_append(
      audit_blockers,
      'Validate the migration draft before commit audit.'
    );
  end if;

  if selected_draft.upload_staged_at is null then
    audit_blockers := array_append(
      audit_blockers,
      'Stage the migration upload manifest before commit audit.'
    );
  end if;

  if selected_draft.account_upload_staged_at is null then
    audit_blockers := array_append(
      audit_blockers,
      'Stage migration accounts before commit audit.'
    );
  end if;

  if selected_draft.transaction_upload_staged_at is null then
    audit_blockers := array_append(
      audit_blockers,
      'Stage migration transactions before commit audit.'
    );
  end if;

  if selected_draft.account_upload_staged_count <> expected_account_count then
    audit_blockers := array_append(
      audit_blockers,
      'Staged account count does not match the migration checkpoint.'
    );
  end if;

  if staged_account_count <> expected_account_count then
    audit_blockers := array_append(
      audit_blockers,
      'Remote account row count does not match the migration checkpoint.'
    );
  end if;

  if selected_draft.transaction_upload_staged_count <> expected_transaction_count then
    audit_blockers := array_append(
      audit_blockers,
      'Staged transaction count does not match the migration checkpoint.'
    );
  end if;

  if staged_transaction_count <> expected_transaction_count then
    audit_blockers := array_append(
      audit_blockers,
      'Remote transaction row count does not match the migration checkpoint.'
    );
  end if;

  if missing_expense_source_count > 0 then
    audit_blockers := array_append(
      audit_blockers,
      missing_expense_source_count::text ||
        ' staged expense(s) must have a source account before commit.'
    );
  end if;

  if missing_transaction_link_count > 0 then
    audit_warnings := array_append(
      audit_warnings,
      'Some staged transactions have no source or destination account link.'
    );
  end if;

  return query
  select
    selected_draft.id,
    cardinality(audit_blockers) = 0,
    cardinality(audit_blockers),
    cardinality(audit_warnings),
    audit_blockers,
    audit_warnings,
    staged_account_count,
    staged_transaction_count,
    missing_expense_source_count,
    missing_transaction_link_count,
    audit_timestamp;
end;
$$;

revoke all on function public.audit_migration_precommit(uuid)
from public;

grant execute on function public.audit_migration_precommit(uuid)
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

  delete from public.transactions
  where household_id = selected_draft.household_id
    and local_record_id is not null;

  delete from public.accounts
  where household_id = selected_draft.household_id
    and local_record_id is not null;

  update public.migration_drafts
  set
    status = 'aborted',
    aborted_at = abort_timestamp,
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

create or replace function public.commit_migration_draft(
  target_draft_id uuid
)
returns table (
  draft_id uuid,
  household_id uuid,
  status text,
  committed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  commit_timestamp timestamptz := now();
  selected_draft public.migration_drafts%rowtype;
  expected_record_count integer;
  expected_account_count integer;
  expected_transaction_count integer;
  staged_account_count integer;
  staged_transaction_count integer;
  missing_expense_source_count integer;
  missing_transaction_link_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in before committing a migration draft.';
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

  if selected_draft.status <> 'validated' then
    raise exception 'Validate the migration draft before committing it.';
  end if;

  if selected_draft.upload_staged_at is null then
    raise exception 'Stage the migration upload manifest before committing.';
  end if;

  if selected_draft.account_upload_staged_at is null then
    raise exception 'Stage migration accounts before committing.';
  end if;

  if selected_draft.transaction_upload_staged_at is null then
    raise exception 'Stage migration transactions before committing.';
  end if;

  expected_record_count :=
    1 +
    coalesce((selected_draft.backup_summary ->> 'accountCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'transactionCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'expenseAllocationCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'settlementCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'settlementApplicationCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'savingsGoalCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'savingsActivityCount')::integer, 0) +
    coalesce((selected_draft.backup_summary ->> 'providerBillCount')::integer, 0);
  expected_account_count :=
    coalesce((selected_draft.backup_summary ->> 'accountCount')::integer, 0);
  expected_transaction_count :=
    coalesce((selected_draft.backup_summary ->> 'transactionCount')::integer, 0);

  if selected_draft.upload_staged_record_count <> expected_record_count then
    raise exception 'Migration upload manifest count does not match the checkpoint.';
  end if;

  if selected_draft.account_upload_staged_count <> expected_account_count then
    raise exception 'Migration account staging count does not match the checkpoint.';
  end if;

  if selected_draft.transaction_upload_staged_count <> expected_transaction_count then
    raise exception 'Migration transaction staging count does not match the checkpoint.';
  end if;

  select count(*)::integer
  into staged_account_count
  from public.accounts remote_account
  where remote_account.household_id = selected_draft.household_id
    and remote_account.local_record_id is not null;

  select
    count(*)::integer,
    count(*) filter (
      where lower(trim(type)) = 'expense'
        and source_account_id is null
    )::integer,
    count(*) filter (
      where source_account_id is null
        and destination_account_id is null
    )::integer
  into
    staged_transaction_count,
    missing_expense_source_count,
    missing_transaction_link_count
  from public.transactions remote_transaction
  where remote_transaction.household_id = selected_draft.household_id
    and remote_transaction.local_record_id is not null;

  if staged_account_count <> expected_account_count then
    raise exception 'Remote account row count does not match the migration checkpoint.';
  end if;

  if staged_transaction_count <> expected_transaction_count then
    raise exception 'Remote transaction row count does not match the migration checkpoint.';
  end if;

  if missing_expense_source_count > 0 then
    raise exception '% staged expense(s) must have a source account before commit.',
      missing_expense_source_count;
  end if;

  if missing_transaction_link_count > 0 then
    raise exception '% staged transaction(s) must have a source or destination account before commit.',
      missing_transaction_link_count;
  end if;

  update public.migration_drafts
  set
    status = 'committed',
    committed_at = commit_timestamp,
    updated_at = commit_timestamp
  where id = selected_draft.id;

  return query
  select
    selected_draft.id,
    selected_draft.household_id,
    'committed'::text,
    commit_timestamp;
end;
$$;

revoke all on function public.commit_migration_draft(uuid)
from public;

grant execute on function public.commit_migration_draft(uuid)
to authenticated;

-- Spike insert/update paths should be tested through RPC functions rather than
-- broad client-side table policies. That keeps migration draft creation and
-- commit/abort behavior explicit.
