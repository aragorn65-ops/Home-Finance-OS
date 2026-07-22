# HFOS Supabase Spike Validation Notes

## Purpose

Use these notes only with a disposable Supabase project. Do not connect real
beta household data, production credentials, or the Cloudflare Pages production
environment while validating the spike.

---

## Disposable Project Setup

1. Create a new Supabase project for disposable spike validation only.
2. Run `docs/architecture/supabase-spike-schema.sql` in the Supabase SQL editor.
   Re-run it after Sprint 61 so the disposable project has the
   `claim_household_from_backup`, `validate_migration_draft_metadata`,
   `abort_migration_draft`, and `commit_migration_draft` RPCs plus durable
   migration lifecycle timestamp columns.
3. Enable an auth method that is acceptable for the spike, such as email magic
   link.
4. Copy only the disposable project URL and anon key into local Vite env values:

```text
VITE_HFOS_AUTH_ENABLED=true
VITE_HFOS_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=<disposable-project-url>
VITE_SUPABASE_ANON_KEY=<disposable-project-anon-key>
```

5. Start the app locally from `frontend` and keep the deployed Cloudflare beta
   unchanged.

---

## Baseline Validation Path

1. Confirm the app remains local-first when `VITE_HFOS_AUTH_ENABLED=false`.
2. Confirm `VITE_HFOS_AUTH_PROVIDER=supabase` selects the Supabase adapter
   skeleton and does not create remote records before live wiring exists.
3. After a real Supabase client is intentionally added, sign in as test user A.
4. Create a household claim draft from disposable local test data.
5. Confirm the owner membership links test user A to the household owner member.
6. Sign in as unrelated test user B and confirm user B cannot read user A's
   household-scoped records.
7. Add a private account owned by user A's linked member and confirm only user A
   can read it.
8. Move a migration draft through uploaded, validated, committed, and aborted
   states using disposable records only.

---

## Migration Checkpoint UI Checks

Use disposable records only.

1. Sign in as test user A.
2. Create a local test household with at least one member, account, transaction,
   shared expense, settlement, savings goal, and provider bill when practical.
3. Create a household claim draft from the local test household.
4. Confirm Auth Diagnostics shows:
   * Session: `signed-in`.
   * Provider: `supabase`.
   * Supabase config: `configured`.
   * Migrations: at least `1`.
   * Latest migration: `uploaded`.
   * Latest migration at: a UTC timestamp or `none` only before remote draft
     timestamps are available.
5. Confirm the Migration Checkpoints panel shows the claimed household,
   checkpoint id, household id, staged record count, and `uploaded` status.
6. Select Validate.
7. Confirm the checkpoint status becomes `validated` and a `Validated` UTC
   timestamp appears.
8. Select Commit on a validated checkpoint.
9. Confirm the checkpoint status becomes `committed`, a `Committed` UTC
   timestamp appears, Auth Diagnostics shows latest migration `committed`, and
   the local household link is saved.
10. Create a second disposable claim draft in a fresh browser/profile or reset
    disposable local data, then select Abort before commit.
11. Confirm the checkpoint status becomes `aborted`, an `Aborted` UTC timestamp
    appears, and no local browser data is deleted.
12. If multiple checkpoints exist, confirm the panel orders the newest lifecycle
    activity first and Auth Diagnostics selects the newest lifecycle timestamp
    rather than the adapter return order.

Expected result: lifecycle timestamps stay visible after refresh and all
checkpoint actions remain explicit user actions.

---

## Cross-User RLS Checks

Use two disposable Supabase users.

1. Sign in as test user A and create a household claim draft.
2. Sign out, then sign in as unrelated test user B.
3. Confirm test user B cannot read user A's household membership diagnostics.
4. Confirm test user B cannot read user A's migration checkpoints.
5. Sign back in as test user A and confirm the household membership and
   migration checkpoint diagnostics return.

Expected result: user B sees no household or migration data owned by user A.

---

## Pass Conditions

* RLS prevents unaffiliated household reads.
* Private member records are hidden from other household users.
* Normal app flows do not require a service-role key in the browser.
* Migration validation can fail closed without deleting local browser data.
* Migration commit links the local household without importing records, syncing,
  or deleting local browser data.
* Migration abort marks the remote draft aborted without deleting local browser
  data.
* Auth Diagnostics and the Migration Checkpoints panel show durable lifecycle
  timestamps after refresh.
* Cloudflare Pages hosting remains compatible with the auth/session flow.

---

## Stop Conditions

Stop and reassess before production work if any normal user path requires
browser access to a service-role key, broad RLS bypass, unsafe local-data
deletion, importing full household records before explicit approval, syncing
remote records as the source of truth, or moving the frontend away from
Cloudflare Pages.
