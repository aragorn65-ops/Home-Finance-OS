# HFOS Supabase Spike Plan

## Purpose

This spike tests whether Supabase Auth + Postgres/RLS can satisfy HFOS
authenticated household requirements before production migration work begins.

The spike must not read or write real beta household data.

---

## Spike Questions

* Can Supabase Auth map cleanly to the existing `AuthBackendAdapter`?
* Can Postgres tables model households, memberships, private records, and
  migration drafts without awkward denormalization?
* Can RLS enforce household tenancy and private member access rules?
* Can migration draft, validate, commit, and abort states be represented
  safely?
* Can the Cloudflare Pages frontend use Supabase without changing hosting?

---

## Minimal Schema Draft

```sql
create table households (
  id uuid primary key,
  name text not null,
  country text not null,
  currency text not null,
  timezone text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key,
  household_id uuid not null references households(id),
  display_name text not null,
  role text not null,
  status text not null default 'active',
  linked_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table household_memberships (
  id uuid primary key,
  household_id uuid not null references households(id),
  member_id uuid not null references household_members(id),
  user_id uuid not null references auth.users(id),
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table accounts (
  id uuid primary key,
  household_id uuid not null references households(id),
  owner_member_id uuid references household_members(id),
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

create table transactions (
  id uuid primary key,
  household_id uuid not null references households(id),
  created_by_member_id uuid references household_members(id),
  paid_by_member_id uuid references household_members(id),
  source_account_id uuid references accounts(id),
  destination_account_id uuid references accounts(id),
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

create table migration_drafts (
  id uuid primary key,
  household_id uuid references households(id),
  owner_user_id uuid not null references auth.users(id),
  owner_member_id uuid not null,
  household_name text not null,
  backup_summary jsonb not null,
  status text not null default 'uploaded',
  validation_summary jsonb,
  validated_at timestamptz,
  committed_at timestamptz,
  aborted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

The first spike does not need every production table. It should prove the
authorization pattern with households, memberships, accounts, transactions, and
migration drafts before adding allocations, settlements, utilities, and savings.

---

## RLS Policy Sketch

Enable RLS on every household-scoped table.

Shared household record rule:

```sql
exists (
  select 1
  from household_memberships m
  where m.household_id = <record>.household_id
    and m.user_id = auth.uid()
    and m.status = 'active'
)
```

Private account rule:

```sql
visibility <> 'private'
or exists (
  select 1
  from household_members m
  where m.id = accounts.owner_member_id
    and m.household_id = accounts.household_id
    and m.linked_user_id = auth.uid()
    and m.status = 'active'
)
```

Owner-only restore/import rule:

```sql
exists (
  select 1
  from household_memberships m
  where m.household_id = <record>.household_id
    and m.user_id = auth.uid()
    and m.role = 'owner'
    and m.status = 'active'
)
```

Spike goal: prove these can be expressed and tested before adding broad record
APIs.

---

## Adapter Mapping

The existing `AuthBackendAdapter` should wrap Supabase without changing calling
UI surfaces.

The spike provider remains disabled unless these Vite variables are set:

```text
VITE_HFOS_AUTH_ENABLED=true
VITE_HFOS_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=<disposable-project-url>
VITE_SUPABASE_ANON_KEY=<disposable-project-anon-key>
```

Do not add Supabase production credentials to the Cloudflare Pages beta until
the proof criteria below pass in a disposable project.

| Adapter Method | Supabase Spike Mapping |
| --- | --- |
| `getSession` | `supabase.auth.getSession()` |
| `signIn` | Magic link or OAuth sign-in spike |
| `signOut` | `supabase.auth.signOut()` |
| `getCurrentUser` | `supabase.auth.getUser()` |
| `listMemberships` | Select active `household_memberships` for `auth.uid()` |
| `listInvitations` | Deferred for first spike or empty list |
| `createHouseholdClaimDraft` | Insert household, owner member, membership, and migration draft in a transaction/RPC |
| `listMigrationDrafts` | Select drafts owned by current user |
| `validateMigrationDraft` | Compare backup summary to draft/import staging metadata |
| `commitMigrationDraft` | Mark migration committed after validation |
| `abortMigrationDraft` | Mark draft aborted and clear staging records where present |

---

## Proof Criteria

The spike passes only if:

* A signed-in test user can create a household claim draft.
* The owner membership is created and linked to the signed-in user.
* A second unaffiliated signed-in user cannot read the household.
* Household records are visible to active members.
* Private account records are visible only to the linked owning member.
* A migration draft can move through uploaded, validated, committed, and aborted
  states without touching local browser data.
* The app can remain hosted on Cloudflare Pages.

---

## Stop Conditions

Stop the Supabase path and reassess if:

* RLS policies require broad service-role bypass for normal app flows.
* Private member access cannot be expressed without leaking owner visibility.
* Migration draft/commit flows require unsafe automatic local-data deletion.
* The frontend must move off Cloudflare Pages for basic auth/session behavior.

---

## Non-Goals

* Full production schema.
* Live beta data migration.
* Multi-device sync.
* Household invites.
* Google Drive backup enablement.
* Replacing local-first storage as the default beta path.
