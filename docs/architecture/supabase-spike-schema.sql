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

-- Spike insert/update paths should be tested through RPC functions rather than
-- broad client-side table policies. That keeps migration draft creation and
-- commit/abort behavior explicit.
