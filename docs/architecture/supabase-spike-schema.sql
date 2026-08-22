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
  local_record_id text,
  display_name text not null,
  color text,
  role text not null,
  status text not null default 'active',
  linked_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.household_members
add column if not exists local_record_id text;

alter table public.household_members
add column if not exists color text;

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

create unique index if not exists household_members_household_local_record_id_key
on public.household_members (household_id, local_record_id)
where local_record_id is not null;

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

create or replace function public.is_household_admin(target_household_id uuid)
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
      and membership.role in ('owner', 'admin')
      and membership.status = 'active'
  );
$$;

create or replace function public.current_household_member_id(target_household_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select membership.member_id
  from public.household_memberships membership
  where membership.household_id = target_household_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
  order by membership.created_at
  limit 1;
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
  public.is_active_household_member(transactions.household_id)
  and (
    transactions.visibility <> 'private'
    or exists (
      select 1
      from public.household_members member
      where member.household_id = transactions.household_id
        and member.linked_user_id = auth.uid()
        and member.status = 'active'
        and member.id in (
          transactions.created_by_member_id,
          transactions.paid_by_member_id
        )
    )
  )
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
using (
  public.is_household_admin(household_id)
  or public.current_household_member_id(household_id) in (
    from_member_id,
    to_member_id
  )
);

drop policy if exists "active members can read household settlement applications"
on public.settlement_applications;

create policy "active members can read household settlement applications"
on public.settlement_applications
for select
using (
  exists (
    select 1
    from public.settlements settlement
    where settlement.id = settlement_applications.settlement_id
      and settlement.household_id = settlement_applications.household_id
      and (
        public.is_household_admin(settlement.household_id)
        or public.current_household_member_id(settlement.household_id) in (
          settlement.from_member_id,
          settlement.to_member_id
        )
      )
  )
);

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

drop function if exists public.create_household_settlement(
  uuid,
  text,
  uuid,
  uuid,
  numeric,
  date,
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  jsonb
);

drop function if exists public.create_household_settlement(
  uuid,
  text,
  uuid,
  uuid,
  numeric,
  date,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
);

drop function if exists public.create_household_settlement(
  uuid,
  text,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
);

create or replace function public.create_household_settlement(
  target_household_id uuid,
  local_record_id text,
  from_member_id text,
  to_member_id text,
  settlement_amount numeric,
  settlement_date date,
  source_account_id text,
  destination_account_id text,
  application_method text,
  reference_number text,
  settlement_notes text,
  settlement_attachments jsonb,
  is_active boolean,
  settlement_applications jsonb
)
returns setof public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;
  resolved_from_member_id uuid;
  resolved_to_member_id uuid;
  resolved_source_account_id uuid;
  resolved_destination_account_id uuid;
  created_settlement public.settlements%rowtype;
  application_row jsonb;
  application_allocation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before creating a settlement.';
  end if;

  current_member_id := public.current_household_member_id(target_household_id);

  if current_member_id is null then
    raise exception 'Active household membership is required to create a settlement.';
  end if;

  if application_method not in ('oldest-first', 'manual') then
    raise exception 'Invalid settlement application method.';
  end if;

  select member.id
  into resolved_from_member_id
  from public.household_members member
  where member.household_id = target_household_id
    and (
      member.id::text = nullif(from_member_id, '')
      or member.local_record_id = nullif(from_member_id, '')
    )
  limit 1;

  if resolved_from_member_id is null then
    insert into public.household_members (
      household_id,
      local_record_id,
      display_name,
      role,
      status,
      created_at,
      updated_at
    )
    values (
      target_household_id,
      nullif(from_member_id, ''),
      coalesce(nullif(from_member_id, ''), 'Settlement payer'),
      'member',
      'active',
      now(),
      now()
    )
    returning id into resolved_from_member_id;
  end if;

  select member.id
  into resolved_to_member_id
  from public.household_members member
  where member.household_id = target_household_id
    and (
      member.id::text = nullif(to_member_id, '')
      or member.local_record_id = nullif(to_member_id, '')
    )
  limit 1;

  if resolved_to_member_id is null then
    insert into public.household_members (
      household_id,
      local_record_id,
      display_name,
      role,
      status,
      created_at,
      updated_at
    )
    values (
      target_household_id,
      nullif(to_member_id, ''),
      coalesce(nullif(to_member_id, ''), 'Settlement receiver'),
      'member',
      'active',
      now(),
      now()
    )
    returning id into resolved_to_member_id;
  end if;

  select account.id
  into resolved_source_account_id
  from public.accounts account
  where account.household_id = target_household_id
    and (
      account.id::text = nullif(source_account_id, '')
      or account.local_record_id = nullif(source_account_id, '')
    )
  limit 1;

  select account.id
  into resolved_destination_account_id
  from public.accounts account
  where account.household_id = target_household_id
    and (
      account.id::text = nullif(destination_account_id, '')
      or account.local_record_id = nullif(destination_account_id, '')
    )
  limit 1;

  if not public.is_household_admin(target_household_id)
    and current_member_id not in (resolved_from_member_id, resolved_to_member_id) then
    raise exception 'Members can create only settlement records where they are the payer or receiver.';
  end if;

  insert into public.settlements (
    household_id,
    local_record_id,
    from_member_id,
    to_member_id,
    amount,
    settlement_date,
    source_account_id,
    destination_account_id,
    application_method,
    reference_number,
    notes,
    attachments,
    is_active,
    updated_by_user_id
  )
  values (
    target_household_id,
    coalesce(local_record_id, gen_random_uuid()::text),
    resolved_from_member_id,
    resolved_to_member_id,
    settlement_amount,
    settlement_date,
    resolved_source_account_id,
    resolved_destination_account_id,
    application_method,
    reference_number,
    settlement_notes,
    coalesce(settlement_attachments, '[]'::jsonb),
    is_active,
    current_user_id
  )
  returning * into created_settlement;

  for application_row in
    select value
    from jsonb_array_elements(coalesce(settlement_applications, '[]'::jsonb))
  loop
    select allocation.id
    into application_allocation_id
    from public.expense_allocations allocation
    where allocation.household_id = target_household_id
      and (
        allocation.id::text = nullif(application_row ->> 'expense_allocation_id', '')
        or allocation.local_record_id = nullif(application_row ->> 'expense_allocation_id', '')
      )
    limit 1;

    if application_allocation_id is null then
      raise exception 'Settlement application allocation does not belong to this household.';
    end if;

    insert into public.settlement_applications (
      household_id,
      local_record_id,
      settlement_id,
      expense_allocation_id,
      applied_amount,
      updated_by_user_id
    )
    values (
      target_household_id,
      coalesce(application_row ->> 'local_record_id', gen_random_uuid()::text),
      created_settlement.id,
      application_allocation_id,
      (application_row ->> 'applied_amount')::numeric,
      current_user_id
    );
  end loop;

  return next created_settlement;
end;
$$;

revoke all on function public.create_household_settlement(
  uuid,
  text,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
) from public;

grant execute on function public.create_household_settlement(
  uuid,
  text,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
) to authenticated;

drop function if exists public.update_household_settlement(
  uuid,
  text,
  uuid,
  uuid,
  numeric,
  date,
  uuid,
  uuid,
  text,
  text,
  text,
  boolean,
  jsonb
);

drop function if exists public.update_household_settlement(
  uuid,
  text,
  uuid,
  uuid,
  numeric,
  date,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
);

drop function if exists public.update_household_settlement(
  uuid,
  text,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
);

create or replace function public.update_household_settlement(
  target_settlement_id uuid,
  local_record_id text,
  from_member_id text,
  to_member_id text,
  settlement_amount numeric,
  settlement_date date,
  source_account_id text,
  destination_account_id text,
  application_method text,
  reference_number text,
  settlement_notes text,
  settlement_attachments jsonb,
  is_active boolean,
  settlement_applications jsonb
)
returns setof public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_settlement public.settlements%rowtype;
  resolved_from_member_id uuid;
  resolved_to_member_id uuid;
  resolved_source_account_id uuid;
  resolved_destination_account_id uuid;
  updated_settlement public.settlements%rowtype;
  application_row jsonb;
  application_allocation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before updating a settlement.';
  end if;

  select *
  into existing_settlement
  from public.settlements
  where id = target_settlement_id
  for update;

  if existing_settlement.id is null then
    raise exception 'Settlement was not found.';
  end if;

  if application_method not in ('oldest-first', 'manual') then
    raise exception 'Invalid settlement application method.';
  end if;

  select member.id
  into resolved_from_member_id
  from public.household_members member
  where member.household_id = existing_settlement.household_id
    and (
      member.id::text = nullif(from_member_id, '')
      or member.local_record_id = nullif(from_member_id, '')
    )
  limit 1;

  if resolved_from_member_id is null then
    insert into public.household_members (
      household_id,
      local_record_id,
      display_name,
      role,
      status,
      created_at,
      updated_at
    )
    values (
      existing_settlement.household_id,
      nullif(from_member_id, ''),
      coalesce(nullif(from_member_id, ''), 'Settlement payer'),
      'member',
      'active',
      now(),
      now()
    )
    returning id into resolved_from_member_id;
  end if;

  select member.id
  into resolved_to_member_id
  from public.household_members member
  where member.household_id = existing_settlement.household_id
    and (
      member.id::text = nullif(to_member_id, '')
      or member.local_record_id = nullif(to_member_id, '')
    )
  limit 1;

  if resolved_to_member_id is null then
    insert into public.household_members (
      household_id,
      local_record_id,
      display_name,
      role,
      status,
      created_at,
      updated_at
    )
    values (
      existing_settlement.household_id,
      nullif(to_member_id, ''),
      coalesce(nullif(to_member_id, ''), 'Settlement receiver'),
      'member',
      'active',
      now(),
      now()
    )
    returning id into resolved_to_member_id;
  end if;

  if not public.is_household_admin(existing_settlement.household_id)
    and public.current_household_member_id(existing_settlement.household_id) not in (
      resolved_from_member_id,
      resolved_to_member_id
    ) then
    raise exception 'Members can update only settlement records where they are the payer or receiver.';
  end if;

  select account.id
  into resolved_source_account_id
  from public.accounts account
  where account.household_id = existing_settlement.household_id
    and (
      account.id::text = nullif(source_account_id, '')
      or account.local_record_id = nullif(source_account_id, '')
    )
  limit 1;

  select account.id
  into resolved_destination_account_id
  from public.accounts account
  where account.household_id = existing_settlement.household_id
    and (
      account.id::text = nullif(destination_account_id, '')
      or account.local_record_id = nullif(destination_account_id, '')
    )
  limit 1;

  update public.settlements
  set
    local_record_id = coalesce(update_household_settlement.local_record_id, existing_settlement.local_record_id),
    from_member_id = resolved_from_member_id,
    to_member_id = resolved_to_member_id,
    amount = settlement_amount,
    settlement_date = update_household_settlement.settlement_date,
    source_account_id = resolved_source_account_id,
    destination_account_id = resolved_destination_account_id,
    application_method = update_household_settlement.application_method,
    reference_number = update_household_settlement.reference_number,
    notes = update_household_settlement.settlement_notes,
    attachments = coalesce(update_household_settlement.settlement_attachments, '[]'::jsonb),
    is_active = update_household_settlement.is_active,
    updated_at = now(),
    updated_by_user_id = current_user_id
  where id = target_settlement_id
  returning * into updated_settlement;

  delete from public.settlement_applications
  where settlement_id = target_settlement_id
    and household_id = existing_settlement.household_id;

  for application_row in
    select value
    from jsonb_array_elements(coalesce(settlement_applications, '[]'::jsonb))
  loop
    select allocation.id
    into application_allocation_id
    from public.expense_allocations allocation
    where allocation.household_id = existing_settlement.household_id
      and (
        allocation.id::text = nullif(application_row ->> 'expense_allocation_id', '')
        or allocation.local_record_id = nullif(application_row ->> 'expense_allocation_id', '')
      )
    limit 1;

    if application_allocation_id is null then
      raise exception 'Settlement application allocation does not belong to this household.';
    end if;

    insert into public.settlement_applications (
      household_id,
      local_record_id,
      settlement_id,
      expense_allocation_id,
      applied_amount,
      updated_by_user_id
    )
    values (
      existing_settlement.household_id,
      coalesce(application_row ->> 'local_record_id', gen_random_uuid()::text),
      updated_settlement.id,
      application_allocation_id,
      (application_row ->> 'applied_amount')::numeric,
      current_user_id
    );
  end loop;

  return next updated_settlement;
end;
$$;

revoke all on function public.update_household_settlement(
  uuid,
  text,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
) from public;

grant execute on function public.update_household_settlement(
  uuid,
  text,
  text,
  text,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  boolean,
  jsonb
) to authenticated;

create or replace function public.delete_household_settlement(
  target_household_id uuid,
  target_settlement_id uuid
)
returns table (
  settlement_id uuid,
  deleted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sign in before deleting a settlement.';
  end if;

  if not public.is_household_admin(target_household_id) then
    raise exception 'Only a household admin can delete settlement records.';
  end if;

  delete from public.settlements
  where id = target_settlement_id
    and household_id = target_household_id;

  if not found then
    raise exception 'Settlement was not found.';
  end if;

  return query
  select
    target_settlement_id,
    now();
end;
$$;

revoke all on function public.delete_household_settlement(uuid, uuid)
from public;

grant execute on function public.delete_household_settlement(uuid, uuid)
to authenticated;

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

drop function if exists public.claim_household_from_backup(
  text,
  text,
  text,
  text,
  jsonb
);

create or replace function public.claim_household_from_backup(
  draft_household_name text,
  draft_country text default 'PH',
  draft_currency text default 'PHP',
  draft_timezone text default 'Asia/Manila',
  draft_backup_summary jsonb default '{}'::jsonb,
  owner_display_name text default null
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
      coalesce(nullif(trim(owner_display_name), ''), 'Household owner'),
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
  jsonb,
  text
) from public;

grant execute on function public.claim_household_from_backup(
  text,
  text,
  text,
  text,
  jsonb,
  text
) to authenticated;

drop function if exists public.update_household_member_profile(
  uuid,
  text,
  text
);

drop function if exists public.update_household_member_profile(
  uuid,
  text,
  text,
  text,
  text,
  text
);

create or replace function public.update_household_member_profile(
  target_household_id uuid,
  local_member_id text,
  member_display_name text,
  member_color text default null,
  member_status text default null,
  member_role text default null
)
returns setof public.household_members
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_display_name text := trim(member_display_name);
  normalized_color text := nullif(trim(coalesce(member_color, '')), '');
  normalized_status text := nullif(lower(trim(coalesce(member_status, ''))), '');
  normalized_role text := nullif(lower(trim(coalesce(member_role, ''))), '');
  updated_member_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before updating household member profiles.';
  end if;

  if not public.is_household_admin(target_household_id) then
    raise exception 'Owner or admin membership is required to update household member profiles.';
  end if;

  if normalized_display_name = '' then
    raise exception 'Member display name is required.';
  end if;

  if normalized_color is not null and normalized_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Member color must be a hex color.';
  end if;

  if normalized_status is not null and normalized_status not in ('active', 'inactive') then
    raise exception 'Member status is invalid.';
  end if;

  if normalized_role is not null and normalized_role not in ('owner', 'admin', 'member') then
    raise exception 'Member role is invalid.';
  end if;

  update public.household_members member
  set
    display_name = normalized_display_name,
    color = coalesce(normalized_color, member.color),
    status = coalesce(normalized_status, member.status),
    role = coalesce(normalized_role, member.role),
    updated_at = now()
  where member.household_id = target_household_id
    and (
      member.id::text = nullif(local_member_id, '')
      or member.local_record_id = nullif(local_member_id, '')
    )
  returning member.id into updated_member_id;

  if updated_member_id is null then
    update public.household_members member
    set
      display_name = normalized_display_name,
      color = coalesce(normalized_color, member.color),
      status = coalesce(normalized_status, member.status),
      role = coalesce(normalized_role, member.role),
      updated_at = now()
    from public.household_memberships membership
    where member.id = membership.member_id
      and member.household_id = target_household_id
      and membership.household_id = target_household_id
      and membership.user_id = current_user_id
      and membership.status = 'active'
      and membership.role in ('owner', 'admin')
    returning member.id into updated_member_id;
  end if;

  if updated_member_id is null then
    raise exception 'Household member was not found.';
  end if;

  return query
  select member.*
  from public.household_members member
  where member.id = updated_member_id;
end;
$$;

revoke all on function public.update_household_member_profile(
  uuid,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.update_household_member_profile(
  uuid,
  text,
  text,
  text,
  text,
  text
) to authenticated;

drop function if exists public.invite_household_member(
  uuid,
  text,
  text,
  text,
  text
);

create or replace function public.invite_household_member(
  target_household_id uuid,
  local_member_id text,
  member_display_name text,
  member_role text,
  invite_email text
)
returns setof public.household_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  invited_user_id uuid;
  resolved_member_id uuid;
  resolved_membership_id uuid;
  normalized_email text := lower(trim(invite_email));
  normalized_role text := lower(trim(member_role));
  created_timestamp timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'Sign in before inviting household members.';
  end if;

  if not public.is_household_admin(target_household_id) then
    raise exception 'Owner or admin membership is required to invite household members.';
  end if;

  if normalized_email = '' then
    raise exception 'Invitation email is required.';
  end if;

  if normalized_role not in ('admin', 'member', 'viewer') then
    raise exception 'Invited household role must be admin, member, or viewer.';
  end if;

  select invited_user.id
  into invited_user_id
  from auth.users invited_user
  where lower(invited_user.email) = normalized_email
  order by invited_user.created_at desc
  limit 1;

  if invited_user_id is null then
    raise exception 'No Supabase user exists for this email yet. Send the magic link first, then retry the member link.';
  end if;

  insert into public.household_members (
    household_id,
    local_record_id,
    display_name,
    role,
    status,
    linked_user_id,
    created_at,
    updated_at
  )
  values (
    target_household_id,
    nullif(local_member_id, ''),
    coalesce(nullif(trim(member_display_name), ''), normalized_email),
    normalized_role,
    'active',
    invited_user_id,
    created_timestamp,
    created_timestamp
  )
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    display_name = excluded.display_name,
    role = excluded.role,
    status = 'active',
    linked_user_id = excluded.linked_user_id,
    updated_at = excluded.updated_at
  returning public.household_members.id into resolved_member_id;

  insert into public.household_memberships (
    household_id,
    member_id,
    user_id,
    role,
    status,
    invited_by_user_id,
    invited_at,
    accepted_at,
    removed_at,
    created_at,
    updated_at
  )
  values (
    target_household_id,
    resolved_member_id,
    invited_user_id,
    normalized_role,
    'active',
    current_user_id,
    created_timestamp,
    created_timestamp,
    null,
    created_timestamp,
    created_timestamp
  )
  on conflict (household_id, user_id)
  do update set
    member_id = excluded.member_id,
    role = excluded.role,
    status = 'active',
    invited_by_user_id = excluded.invited_by_user_id,
    invited_at = excluded.invited_at,
    accepted_at = excluded.accepted_at,
    removed_at = null,
    updated_at = excluded.updated_at
  returning public.household_memberships.id into resolved_membership_id;

  return query
  select membership.*
  from public.household_memberships membership
  where membership.id = resolved_membership_id;
end;
$$;

revoke all on function public.invite_household_member(
  uuid,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.invite_household_member(
  uuid,
  text,
  text,
  text,
  text
) to authenticated;

create or replace function public.load_household_preferences(
  target_household_id uuid
)
returns table (
  household_id uuid,
  household_name text,
  country text,
  currency text,
  timezone text,
  status text,
  owner_member_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in before loading household preferences.';
  end if;

  if not public.is_active_household_member(target_household_id) then
    raise exception 'Active household membership is required to load household preferences.';
  end if;

  return query
  select
    household.id as household_id,
    household.name as household_name,
    household.country,
    household.currency,
    household.timezone,
    household.status,
    owner_member.id as owner_member_id,
    household.created_at,
    household.updated_at
  from public.households household
  left join lateral (
    select member.id
    from public.household_members member
    where member.household_id = household.id
      and member.role = 'owner'
      and member.status = 'active'
    order by member.created_at
    limit 1
  ) owner_member on true
  where household.id = target_household_id
    and household.status = 'active';
end;
$$;

revoke all on function public.load_household_preferences(
  uuid
) from public;

grant execute on function public.load_household_preferences(
  uuid
) to authenticated;

create or replace function public.save_household_preferences(
  target_household_id uuid,
  input_household_name text,
  input_household_country text,
  input_household_currency text,
  input_household_timezone text
)
returns table (
  household_id uuid,
  household_name text,
  country text,
  currency text,
  timezone text,
  status text,
  owner_member_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := btrim(input_household_name);
  normalized_country text := upper(btrim(input_household_country));
  normalized_currency text := upper(btrim(input_household_currency));
  normalized_timezone text := btrim(input_household_timezone);
begin
  if auth.uid() is null then
    raise exception 'Sign in before saving household preferences.';
  end if;

  if not public.is_household_admin(target_household_id) then
    raise exception 'Only a household admin can save household preferences.';
  end if;

  if
    normalized_name = '' or
    normalized_country = '' or
    normalized_currency = '' or
    normalized_timezone = ''
  then
    raise exception 'Household preferences are incomplete.';
  end if;

  update public.households
  set
    name = normalized_name,
    country = normalized_country,
    currency = normalized_currency,
    timezone = normalized_timezone,
    updated_at = now()
  where id = target_household_id
    and status = 'active';

  if not found then
    raise exception 'Household was not found.';
  end if;

  return query
  select *
  from public.load_household_preferences(target_household_id);
end;
$$;

revoke all on function public.save_household_preferences(
  uuid,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.save_household_preferences(
  uuid,
  text,
  text,
  text,
  text
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

drop function if exists public.save_household_core_snapshot(
  uuid,
  jsonb,
  jsonb
);

drop function if exists public.save_household_core_snapshot(
  uuid,
  jsonb,
  jsonb,
  jsonb
);

drop function if exists public.save_household_core_snapshot(
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
);

create or replace function public.save_household_core_snapshot(
  target_household_id uuid,
  core_accounts jsonb,
  core_transactions jsonb,
  core_expense_allocations jsonb,
  core_provider_bills jsonb
)
returns table (
  saved_household_id uuid,
  accounts jsonb,
  transactions jsonb,
  expense_allocations jsonb,
  provider_bills jsonb,
  saved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;
  snapshot_timestamp timestamptz := now();
  fallback_cash_account_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before saving core finance records.';
  end if;

  if not public.is_household_admin(target_household_id) then
    raise exception 'Only a household admin can save core finance records.';
  end if;

  current_member_id := public.current_household_member_id(target_household_id);

  if current_member_id is null then
    raise exception 'Active household membership is required to save core finance records.';
  end if;

  if jsonb_typeof(coalesce(core_accounts, '[]'::jsonb)) <> 'array' then
    raise exception 'Core account snapshot must be an array.';
  end if;

  if jsonb_typeof(coalesce(core_transactions, '[]'::jsonb)) <> 'array' then
    raise exception 'Core transaction snapshot must be an array.';
  end if;

  if jsonb_typeof(coalesce(core_expense_allocations, '[]'::jsonb)) <> 'array' then
    raise exception 'Core expense allocation snapshot must be an array.';
  end if;

  if jsonb_typeof(coalesce(core_provider_bills, '[]'::jsonb)) <> 'array' then
    raise exception 'Core provider bill snapshot must be an array.';
  end if;

  with provider_bill_payload as (
    select provider_bill_record.id
    from jsonb_to_recordset(coalesce(core_provider_bills, '[]'::jsonb)) as provider_bill_record(
      id text
    )
  )
  delete from public.utility_provider_bills remote_provider_bill
  where remote_provider_bill.household_id = target_household_id
    and remote_provider_bill.local_record_id is not null
    and not exists (
      select 1
      from provider_bill_payload
      where provider_bill_payload.id = remote_provider_bill.local_record_id
    );

  with allocation_payload as (
    select allocation_record.id
    from jsonb_to_recordset(coalesce(core_expense_allocations, '[]'::jsonb)) as allocation_record(
      id text
    )
  )
  delete from public.settlement_applications remote_application
  using public.expense_allocations remote_allocation
  where remote_application.household_id = target_household_id
    and remote_application.expense_allocation_id = remote_allocation.id
    and remote_allocation.household_id = target_household_id
    and remote_allocation.local_record_id is not null
    and not exists (
      select 1
      from allocation_payload
      where allocation_payload.id = remote_allocation.local_record_id
    );

  with allocation_payload as (
    select allocation_record.id
    from jsonb_to_recordset(coalesce(core_expense_allocations, '[]'::jsonb)) as allocation_record(
      id text
    )
  )
  delete from public.expense_allocations remote_allocation
  where remote_allocation.household_id = target_household_id
    and remote_allocation.local_record_id is not null
    and not exists (
      select 1
      from allocation_payload
      where allocation_payload.id = remote_allocation.local_record_id
    );

  with transaction_payload as (
    select transaction_record.id
    from jsonb_to_recordset(coalesce(core_transactions, '[]'::jsonb)) as transaction_record(
      id text
    )
  )
  delete from public.transactions remote_transaction
  where remote_transaction.household_id = target_household_id
    and remote_transaction.local_record_id is not null
    and not exists (
      select 1
      from transaction_payload
      where transaction_payload.id = remote_transaction.local_record_id
    );

  with account_payload as (
    select account_record.id
    from jsonb_to_recordset(coalesce(core_accounts, '[]'::jsonb)) as account_record(
      id text
    )
  )
  delete from public.accounts remote_account
  where remote_account.household_id = target_household_id
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
    target_household_id,
    account_record.id,
    coalesce(owner_member.id, current_member_id),
    account_record.name,
    nullif(account_record.institution, ''),
    account_record."accountClass",
    account_record.type,
    coalesce(account_record.visibility, 'household'),
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
    coalesce(nullif(account_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_accounts, '[]'::jsonb)) as account_record(
    id text,
    "ownerMemberId" text,
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
  left join public.household_members owner_member
    on owner_member.household_id = target_household_id
   and (
        owner_member.id::text = nullif(account_record."ownerMemberId", '')
        or owner_member.local_record_id = nullif(account_record."ownerMemberId", '')
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
    target_household_id,
    transaction_record.id,
    coalesce(created_by_member.id, current_member_id),
    coalesce(paid_by_member.id, created_by_member.id, current_member_id),
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
    coalesce(nullif(transaction_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_transactions, '[]'::jsonb)) as transaction_record(
    id text,
    "createdByMemberId" text,
    "paidByMemberId" text,
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
  left join public.household_members created_by_member
    on created_by_member.household_id = target_household_id
   and (
        created_by_member.id::text = nullif(transaction_record."createdByMemberId", '')
        or created_by_member.local_record_id = nullif(transaction_record."createdByMemberId", '')
   )
  left join public.household_members paid_by_member
    on paid_by_member.household_id = target_household_id
   and (
        paid_by_member.id::text = nullif(transaction_record."paidByMemberId", '')
        or paid_by_member.local_record_id = nullif(transaction_record."paidByMemberId", '')
   )
  left join public.accounts source_account
    on source_account.household_id = target_household_id
   and source_account.local_record_id = transaction_record."sourceAccountId"
  left join lateral (
    select fallback_account.id
    from public.accounts fallback_account
    where fallback_account.household_id = target_household_id
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
    on destination_account.household_id = target_household_id
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
  where fallback_account.household_id = target_household_id
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
      paid_by_member_id = coalesce(remote_transaction.paid_by_member_id, current_member_id),
      updated_at = snapshot_timestamp,
      updated_by_user_id = current_user_id
    where remote_transaction.household_id = target_household_id
      and remote_transaction.local_record_id is not null
      and lower(trim(remote_transaction.type)) = 'expense'
      and remote_transaction.source_account_id is null;
  end if;

  insert into public.expense_allocations (
    household_id,
    local_record_id,
    transaction_id,
    paid_by_member_id,
    member_id,
    is_included,
    allocated_amount,
    personal_amount,
    personal_items,
    notes,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    target_household_id,
    allocation_record.id,
    remote_transaction.id,
    coalesce(paid_by_member.id, current_member_id),
    coalesce(allocation_member.id, current_member_id),
    allocation_record."isIncluded",
    allocation_record."allocatedAmount",
    allocation_record."personalAmount",
    coalesce(allocation_record."personalItems", '[]'::jsonb),
    nullif(allocation_record.notes, ''),
    coalesce(nullif(allocation_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_expense_allocations, '[]'::jsonb)) as allocation_record(
    id text,
    "transactionId" text,
    "paidByMemberId" text,
    "memberId" text,
    "isIncluded" boolean,
    "allocatedAmount" numeric,
    "personalAmount" numeric,
    "personalItems" jsonb,
    notes text,
    "createdAt" text,
    "updatedAt" text
  )
  join public.transactions remote_transaction
    on remote_transaction.household_id = target_household_id
   and remote_transaction.local_record_id = allocation_record."transactionId"
  left join public.household_members paid_by_member
    on paid_by_member.household_id = target_household_id
   and (
        paid_by_member.id::text = nullif(allocation_record."paidByMemberId", '')
        or paid_by_member.local_record_id = nullif(allocation_record."paidByMemberId", '')
   )
  left join public.household_members allocation_member
    on allocation_member.household_id = target_household_id
   and (
        allocation_member.id::text = nullif(allocation_record."memberId", '')
        or allocation_member.local_record_id = nullif(allocation_record."memberId", '')
   )
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    transaction_id = excluded.transaction_id,
    paid_by_member_id = excluded.paid_by_member_id,
    member_id = excluded.member_id,
    is_included = excluded.is_included,
    allocated_amount = excluded.allocated_amount,
    personal_amount = excluded.personal_amount,
    personal_items = excluded.personal_items,
    notes = excluded.notes,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  insert into public.utility_provider_bills (
    household_id,
    local_record_id,
    utility_type,
    unit,
    provider_name,
    billing_date,
    due_date,
    total_bill_amount,
    rate_per_unit,
    status,
    form_snapshot,
    calculation_snapshot,
    member_share_snapshot,
    bill_attachments,
    payment_attachments,
    paid_by_member_id,
    source_account_id,
    paid_at,
    payment_reference_number,
    transaction_id,
    visibility,
    description,
    notes,
    is_active,
    created_at,
    updated_at,
    updated_by_user_id
  )
  select
    target_household_id,
    provider_bill_record.id,
    provider_bill_record."utilityType",
    provider_bill_record.unit,
    coalesce(provider_bill_record."providerName", ''),
    provider_bill_record."billingDate"::date,
    provider_bill_record."dueDate"::date,
    provider_bill_record."totalBillAmount",
    provider_bill_record."ratePerUnit",
    coalesce(provider_bill_record.status, 'unpaid'),
    coalesce(provider_bill_record."formSnapshot", '{}'::jsonb),
    coalesce(provider_bill_record."calculationSnapshot", '{}'::jsonb),
    coalesce(provider_bill_record."memberShareSnapshot", '[]'::jsonb),
    coalesce(provider_bill_record."billAttachments", '[]'::jsonb),
    coalesce(provider_bill_record."paymentAttachments", '[]'::jsonb),
    paid_by_member.id,
    source_account.id,
    nullif(provider_bill_record."paidAt", '')::timestamptz,
    nullif(provider_bill_record."paymentReferenceNumber", ''),
    linked_transaction.id,
    coalesce(provider_bill_record.visibility, 'household'),
    coalesce(provider_bill_record.description, ''),
    coalesce(provider_bill_record.notes, ''),
    provider_bill_record."isActive",
    coalesce(nullif(provider_bill_record."createdAt", '')::timestamptz, snapshot_timestamp),
    snapshot_timestamp,
    current_user_id
  from jsonb_to_recordset(coalesce(core_provider_bills, '[]'::jsonb)) as provider_bill_record(
    id text,
    "utilityType" text,
    unit text,
    "providerName" text,
    "billingDate" text,
    "dueDate" text,
    "totalBillAmount" numeric,
    "ratePerUnit" numeric,
    status text,
    "formSnapshot" jsonb,
    "calculationSnapshot" jsonb,
    "memberShareSnapshot" jsonb,
    "billAttachments" jsonb,
    "paymentAttachments" jsonb,
    "paidByMemberId" text,
    "sourceAccountId" text,
    "paidAt" text,
    "paymentReferenceNumber" text,
    "transactionId" text,
    visibility text,
    description text,
    notes text,
    "isActive" boolean,
    "createdAt" text,
    "updatedAt" text
  )
  left join public.household_members paid_by_member
    on paid_by_member.household_id = target_household_id
   and (
        paid_by_member.id::text = nullif(provider_bill_record."paidByMemberId", '')
        or paid_by_member.local_record_id = nullif(provider_bill_record."paidByMemberId", '')
   )
  left join public.accounts source_account
    on source_account.household_id = target_household_id
   and source_account.local_record_id = nullif(provider_bill_record."sourceAccountId", '')
  left join public.transactions linked_transaction
    on linked_transaction.household_id = target_household_id
   and linked_transaction.local_record_id = nullif(provider_bill_record."transactionId", '')
  on conflict (household_id, local_record_id)
  where local_record_id is not null
  do update set
    utility_type = excluded.utility_type,
    unit = excluded.unit,
    provider_name = excluded.provider_name,
    billing_date = excluded.billing_date,
    due_date = excluded.due_date,
    total_bill_amount = excluded.total_bill_amount,
    rate_per_unit = excluded.rate_per_unit,
    status = excluded.status,
    form_snapshot = excluded.form_snapshot,
    calculation_snapshot = excluded.calculation_snapshot,
    member_share_snapshot = excluded.member_share_snapshot,
    bill_attachments = excluded.bill_attachments,
    payment_attachments = excluded.payment_attachments,
    paid_by_member_id = excluded.paid_by_member_id,
    source_account_id = excluded.source_account_id,
    paid_at = excluded.paid_at,
    payment_reference_number = excluded.payment_reference_number,
    transaction_id = excluded.transaction_id,
    visibility = excluded.visibility,
    description = excluded.description,
    notes = excluded.notes,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at,
    updated_by_user_id = excluded.updated_by_user_id;

  return query
  select
    snapshot.household_id as saved_household_id,
    snapshot.accounts,
    snapshot.transactions,
    snapshot.expense_allocations,
    snapshot.provider_bills,
    snapshot.saved_at
  from public.load_household_core_snapshot(target_household_id) as snapshot;
end;
$$;

revoke all on function public.save_household_core_snapshot(
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) from public;

grant execute on function public.save_household_core_snapshot(
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) to authenticated;

drop function if exists public.load_household_core_snapshot(uuid);

create or replace function public.load_household_core_snapshot(
  target_household_id uuid
)
returns table (
  household_id uuid,
  accounts jsonb,
  transactions jsonb,
  expense_allocations jsonb,
  provider_bills jsonb,
  saved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_member_id uuid;
  snapshot_timestamp timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'Sign in before loading core finance records.';
  end if;

  current_member_id := public.current_household_member_id(target_household_id);

  if current_member_id is null then
    raise exception 'Active household membership is required to load core finance records.';
  end if;

  return query
  select
    target_household_id,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', coalesce(remote_account.local_record_id, remote_account.id::text),
            'ownerMemberId', coalesce(owner_member.local_record_id, owner_member.id::text),
            'visibility', remote_account.visibility,
            'name', remote_account.name,
            'institution', remote_account.institution,
            'accountClass', remote_account.account_class,
            'type', remote_account.account_type,
            'currency', remote_account.currency,
            'baseCurrency', remote_account.base_currency,
            'exchangeRate', remote_account.exchange_rate,
            'exchangeRateEffectiveDate', remote_account.exchange_rate_effective_date,
            'exchangeRateSource', remote_account.exchange_rate_source,
            'exchangeRateProvider', remote_account.exchange_rate_provider,
            'openingBalance', remote_account.opening_balance,
            'currentBalance', remote_account.current_balance,
            'openingBaseBalance', remote_account.opening_base_balance,
            'currentBaseBalance', remote_account.current_base_balance,
            'accountNumber', remote_account.account_number,
            'creditLimit', remote_account.credit_limit,
            'statementBalance', remote_account.statement_balance,
            'minimumPayment', remote_account.minimum_payment,
            'paymentDueDate', remote_account.payment_due_date,
            'isActive', remote_account.is_active,
            'createdAt', remote_account.created_at,
            'updatedAt', remote_account.updated_at
          )
          order by remote_account.created_at, remote_account.id
        )
        from public.accounts remote_account
        left join public.household_members owner_member
          on owner_member.id = remote_account.owner_member_id
        where remote_account.household_id = target_household_id
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', coalesce(remote_transaction.local_record_id, remote_transaction.id::text),
            'createdByMemberId', coalesce(created_by_member.local_record_id, created_by_member.id::text),
            'paidByMemberId', coalesce(paid_by_member.local_record_id, paid_by_member.id::text),
            'expenseSplitMethod', remote_transaction.expense_split_method,
            'visibility', remote_transaction.visibility,
            'type', remote_transaction.type,
            'amount', remote_transaction.amount,
            'enteredAmount', remote_transaction.entered_amount,
            'enteredCurrency', remote_transaction.entered_currency,
            'baseCurrency', remote_transaction.base_currency,
            'baseAmount', remote_transaction.base_amount,
            'exchangeRate', remote_transaction.exchange_rate,
            'exchangeRateEffectiveDate', remote_transaction.exchange_rate_effective_date,
            'exchangeRateSource', remote_transaction.exchange_rate_source,
            'exchangeRateProvider', remote_transaction.exchange_rate_provider,
            'sourceAccountId', source_account.local_record_id,
            'destinationAccountId', destination_account.local_record_id,
            'category', remote_transaction.category,
            'description', remote_transaction.description,
            'notes', remote_transaction.notes,
            'attachments', remote_transaction.attachments,
            'transactionDate', remote_transaction.transaction_date,
            'isActive', remote_transaction.is_active,
            'createdAt', remote_transaction.created_at,
            'updatedAt', remote_transaction.updated_at
          )
          order by remote_transaction.transaction_date, remote_transaction.created_at, remote_transaction.id
        )
        from public.transactions remote_transaction
        left join public.household_members created_by_member
          on created_by_member.id = remote_transaction.created_by_member_id
        left join public.household_members paid_by_member
          on paid_by_member.id = remote_transaction.paid_by_member_id
        left join public.accounts source_account
          on source_account.id = remote_transaction.source_account_id
        left join public.accounts destination_account
          on destination_account.id = remote_transaction.destination_account_id
        where remote_transaction.household_id = target_household_id
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', coalesce(remote_allocation.local_record_id, remote_allocation.id::text),
            'transactionId', remote_transaction.local_record_id,
            'paidByMemberId', coalesce(paid_by_member.local_record_id, paid_by_member.id::text),
            'memberId', coalesce(allocation_member.local_record_id, allocation_member.id::text),
            'isIncluded', remote_allocation.is_included,
            'allocatedAmount', remote_allocation.allocated_amount,
            'personalAmount', remote_allocation.personal_amount,
            'personalItems', remote_allocation.personal_items,
            'notes', remote_allocation.notes,
            'createdAt', remote_allocation.created_at,
            'updatedAt', remote_allocation.updated_at
          )
          order by remote_transaction.transaction_date, remote_allocation.created_at, remote_allocation.id
        )
        from public.expense_allocations remote_allocation
        join public.transactions remote_transaction
          on remote_transaction.id = remote_allocation.transaction_id
         and remote_transaction.household_id = remote_allocation.household_id
        join public.household_members paid_by_member
          on paid_by_member.id = remote_allocation.paid_by_member_id
        join public.household_members allocation_member
          on allocation_member.id = remote_allocation.member_id
        where remote_allocation.household_id = target_household_id
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', coalesce(remote_provider_bill.local_record_id, remote_provider_bill.id::text),
            'householdId', target_household_id::text,
            'utilityType', remote_provider_bill.utility_type,
            'unit', remote_provider_bill.unit,
            'providerName', remote_provider_bill.provider_name,
            'billingDate', remote_provider_bill.billing_date,
            'dueDate', remote_provider_bill.due_date,
            'totalBillAmount', remote_provider_bill.total_bill_amount,
            'ratePerUnit', remote_provider_bill.rate_per_unit,
            'status', remote_provider_bill.status,
            'formSnapshot', remote_provider_bill.form_snapshot,
            'calculationSnapshot', remote_provider_bill.calculation_snapshot,
            'memberShareSnapshot', remote_provider_bill.member_share_snapshot,
            'billAttachments', remote_provider_bill.bill_attachments,
            'paymentAttachments', remote_provider_bill.payment_attachments,
            'paidByMemberId', coalesce(paid_by_member.local_record_id, paid_by_member.id::text, ''),
            'sourceAccountId', coalesce(source_account.local_record_id, ''),
            'paidAt', remote_provider_bill.paid_at,
            'paymentReferenceNumber', coalesce(remote_provider_bill.payment_reference_number, ''),
            'transactionId', coalesce(linked_transaction.local_record_id, ''),
            'visibility', remote_provider_bill.visibility,
            'description', remote_provider_bill.description,
            'notes', remote_provider_bill.notes,
            'isActive', remote_provider_bill.is_active,
            'createdAt', remote_provider_bill.created_at,
            'updatedAt', remote_provider_bill.updated_at
          )
          order by remote_provider_bill.due_date, remote_provider_bill.created_at, remote_provider_bill.id
        )
        from public.utility_provider_bills remote_provider_bill
        left join public.household_members paid_by_member
          on paid_by_member.id = remote_provider_bill.paid_by_member_id
        left join public.accounts source_account
          on source_account.id = remote_provider_bill.source_account_id
        left join public.transactions linked_transaction
          on linked_transaction.id = remote_provider_bill.transaction_id
        where remote_provider_bill.household_id = target_household_id
      ),
      '[]'::jsonb
    ),
    snapshot_timestamp;
end;
$$;

revoke all on function public.load_household_core_snapshot(uuid)
from public;

grant execute on function public.load_household_core_snapshot(uuid)
to authenticated;

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
