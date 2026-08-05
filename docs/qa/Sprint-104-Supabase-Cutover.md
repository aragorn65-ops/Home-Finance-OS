# Sprint 104 Supabase Cutover

## Purpose

Use this before the Sprint 104 production smoke pass.

This cutover applies the schema needed for partial settlements whose
applications reference expense allocation rows. Without it, settlement saves can
fail with allocation ownership errors or refresh can reload an incomplete core
snapshot.

---

## Required SQL

Run the full current schema file in the Supabase SQL editor:

```text
docs/architecture/supabase-spike-schema.sql
```

The file must include these Sprint 104-critical changes:

* `save_household_core_snapshot(uuid, jsonb, jsonb, jsonb)` accepts
  `core_expense_allocations`.
* `save_household_core_snapshot` returns `expense_allocations`.
* `load_household_core_snapshot(uuid)` is dropped before it is recreated.
* `load_household_core_snapshot(uuid)` returns `expense_allocations`.
* `public.expense_allocations` rows are upserted from local allocation IDs and
  joined to remote transactions by `transactions.local_record_id`.

After the schema finishes, reload the PostgREST schema cache:

```sql
notify pgrst, 'reload schema';
```

Wait a few seconds, then refresh the deployed app.

---

## Verification Queries

Run these in Supabase SQL editor after the schema and cache reload.

```sql
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'save_household_core_snapshot',
    'load_household_core_snapshot',
    'create_household_settlement',
    'update_household_settlement'
  )
order by p.proname, arguments;
```

Expected result includes:

```text
save_household_core_snapshot | target_household_id uuid, core_accounts jsonb, core_transactions jsonb, core_expense_allocations jsonb
load_household_core_snapshot | target_household_id uuid
```

Then verify the allocation table exists:

```sql
select to_regclass('public.expense_allocations') as expense_allocations_table;
```

Expected result:

```text
public.expense_allocations
```

---

## App Verification

On the deployed site:

```text
https://home-finance-os.pages.dev
```

1. Open Settings.
2. Open Auth Diagnostics.
3. Confirm Cloud Schema Readiness passes for household preferences, core
   snapshots, and settlement mutations.
4. Confirm the Build value is the intended `main` commit.
5. Run the partial settlement carryover check from
   `docs/qa/Cloudflare-Pages-Smoke-Check.md`.

---

## Expected Settlement Result

For the July-to-August test:

* July has 9,000 of outstanding obligations across at least two allocation
  rows.
* August settlement amount is 5,000.
* Manual selection applies the payment to checked rows in order.
* One row can be fully covered and the next row can be partially paid.
* The August settlement appears in settlement history after refresh.
* The unpaid July remainder remains visible as unsettled.
* No save error says the settlement application allocation does not belong to
  the household.
