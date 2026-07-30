# Sprint 102

## Public Beta Cloud Direction

**Branch:** main

---

## Intent

Sprint 102 resets the public beta direction.

HFOS public beta now requires authenticated admin access, limited member
settlement-entry access, cloud-backed household persistence, and real-time
synchronization. Local backup and restore remain required safety rails, but
browser localStorage is no longer sufficient as the primary persistence layer
for public beta.

---

## Public Beta Requirements

* Production-ready admin sign-in, sign-out, session refresh, and expired-session
  recovery.
* Limited member sign-in for settlement entry only.
* Signed-out users cannot read or mutate cloud-backed household data.
* A signed-in admin can create or claim one household.
* A signed-in member can add a settlement record only when they are the paying
  or receiving member.
* Member access cannot create, edit, or delete accounts, transactions,
  utilities, savings, settings, backups, household configuration, or migration
  state.
* Admin can review, edit, and delete member-submitted settlement records.
* Household metadata and core finance records persist to the cloud source of
  truth.
* Browser refresh reloads household data from the cloud-backed store.
* Real-time synchronization propagates cloud-backed changes into the active
  signed-in admin session.
* Cloud write failures fail closed and surface visible status.
* Local Export Backup and Import Backup continue to work as manual safety rails.

---

## Out Of Scope

* Multi-device household access.
* Shared household collaboration.
* General invite or membership onboarding flows beyond the minimum member
  settlement-access path.
* Offline merge.
* Conflict resolution.
* Additional finance modules.

---

## Verification Targets

* `npm test`
* `npm run build`
* Cloudflare Pages route smoke checks.
* Production admin auth smoke check.
* Limited member settlement-entry smoke check.
* Cloud-backed household persistence smoke check.
* Real-time active-session synchronization smoke check.
* Backup export and restore smoke check.

---

## Implementation Progress

* [x] Added reusable authorization rules for settlement records:
  owner/admin can manage settlement records, members can create or view only
  when they are the payer or receiver, and viewers or signed-out users cannot
  create settlement records.
* [x] Added focused authorization coverage for admin, involved member,
  uninvolved member, viewer, and signed-out settlement access.
* [x] Added active household membership loading for signed-in users.
* [x] Wired signed-in settlement create, view, edit, and delete actions through
  the settlement authorization rule while keeping disabled-auth local mode
  usable during the cloud transition.
* [x] Added an adapter-level remote settlement persistence contract for list,
  create, update, and delete.
* [x] Added in-memory remote settlement persistence with admin management,
  settlement-only involved-member creation, member update/delete denial, and
  disabled/Supabase fail-closed stubs.
* [x] Wired the settlement persistence contract into production Supabase RPC
  hooks for settlement list, create, update, and delete, including admin-only
  update/delete enforcement and participant-limited member create/read access.
* [x] Added signed-in settlement page bridging to the remote settlement
  contract: cloud settlement history loads through the auth adapter, creates
  and updates await the cloud mutation, cloud failures stay visible, and
  deletes show pending/error state.
* [x] Added remote settlement application-row persistence to the Supabase
  settlement create/update RPC path, including household allocation validation
  and mutation results that read back saved application rows.
* [x] Added production auth smoke route guards at the app shell boundary:
  signed-out cloud mode blocks household finance routes, Settings remains
  available for diagnostics/sign-in, admin/owner access can use the app, and
  member access is limited to settlement entry.
* [x] Added an adapter-level core household snapshot contract for cloud-backed
  accounts and transactions, with in-memory admin-only save/load coverage and
  disabled/Supabase fail-closed placeholders.
* [x] Wired the core household snapshot contract into Supabase RPC hooks and
  schema SQL for admin-only account/transaction snapshot save/load.
* [x] Added reusable core snapshot sync helpers that convert local
  account/transaction records into the remote snapshot contract and call the
  adapter save/load methods.
* [x] Added a Settings auth diagnostics core snapshot smoke panel for
  owner/admin cloud save/load checks, including local-vs-remote household id
  handling and remote count feedback.
* [x] Added an adapter-level remote household preferences contract with
  in-memory owner/admin save, active-member load, disabled fail-closed behavior,
  and Supabase RPC/schema support.
* [x] Wired Settings household preference saves to the remote household
  preferences contract when an authenticated household link exists; cloud
  failure now stops the local preference save.
* [x] Centralized current-browser core snapshot collection behind a reusable
  sync service and rewired the Settings smoke panel to use it.
* [x] Added a linked-household core snapshot save helper that decides when a
  cloud snapshot is required and saves local records to the authenticated
  remote household id.
* [x] Wired account create/update/delete flows to await linked-household core
  snapshot saves and keep account dialogs open with visible cloud errors when
  the snapshot save fails.
* [x] Wired transaction create/update/delete flows to await linked-household
  core snapshot saves and keep transaction dialogs open with visible cloud
  errors when the snapshot save fails.
* [x] Wired paid utility provider bill transaction creation through
  linked-household core snapshot saves so generated provider payment
  transactions surface cloud snapshot failures.
* [x] Added linked-household core snapshot restore on authenticated owner/admin
  app load so browser refresh reloads account and transaction records from the
  cloud snapshot before opening finance pages.
* [x] Added active-session real-time core snapshot subscription plumbing so
  owner/admin sessions reload the latest cloud snapshot when the remote
  household core snapshot changes.
* [x] Added linked-household preference restore on authenticated owner/admin
  app load so browser refresh reloads household metadata from the cloud before
  opening finance pages.
* [x] Added active-session settlement realtime subscription plumbing so signed
  cloud settlement pages reload when remote household settlement rows change.
* [x] Added active-session household preference realtime subscription plumbing
  so owner/admin sessions reload cloud household metadata when the remote
  household row changes.
* [x] Completed the public-beta cloud persistence baseline for household
  metadata, core account/transaction snapshots, and settlement records behind
  authenticated adapter contracts.
* [x] Completed the active authenticated session realtime baseline for core
  snapshots, settlement records, and household metadata reloads.

---

## Sprint Closeout

**Closed:** 2026-07-30

**Result:** Completed as a public beta cloud baseline sprint.

Sprint 102 moved HFOS from a local-first public beta checklist toward an
authenticated public beta candidate. The repo now has contracts, Supabase RPC
wiring, app integration, tests, and launch documentation for:

* Authenticated admin access and signed-out route blocking.
* Limited member settlement-entry access.
* Admin review, edit, and delete of member-submitted settlement records.
* Cloud-backed household metadata persistence.
* Cloud-backed account/transaction core snapshots.
* Cloud-backed settlement persistence.
* Browser-refresh restore for linked household metadata and core snapshots.
* Active-session realtime reloads for household metadata, core snapshots, and
  settlement records.
* Visible fail-closed cloud write errors for the core snapshot baseline.
* Live-test hardening for Supabase schema-cache drift, settlement history/edit
  visibility, settlement allocation id bridging, and attachment payload limits.
* Metadata-only receipt/bill handling for cloud beta snapshots and provider
  bill records, with broken preview actions replaced by visible beta copy.
* Public beta scope control that keeps multi-device household access, broad
  shared collaboration, conflict resolution, and full utility/savings cloud
  persistence outside the one-month target unless explicitly expanded.

Local backup export/import, Google Drive backup status, clear/reset safety
rails, and public beta warning copy remain part of the launch guardrails.

The public beta is **not launched** by this sprint. The repo-side baseline is
ready for the next live Cloudflare Pages and Supabase validation pass tracked in
`docs/qa/Public-Beta-Launch-Checklist.md` and
`docs/qa/Public-Beta-Launch-Evidence.md`.

### Final Verification

* `npm.cmd test`
* `npm.cmd run build`
* `git diff --check`

### Final Checkpoints

* `44e4c05` - Fixed core snapshot household return ambiguity.
* `9b4982a` - Added the Supabase drop/recreate guard for the core snapshot RPC
  return rename.
* `bc1a9c1` - Kept settlement history visible in beta mode after reload.
* `1caf15a` - Stripped transaction receipt bodies from cloud snapshots.
* `fa25bbe` - Stripped utility provider bill attachment bodies.
* `6b17f87` - Handled metadata-only attachment previews across transaction,
  utility, and settlement screens.

### Remaining Launch Gates

* Cloudflare Pages production deployment must be green.
* Cloudflare Pages must use `NODE_VERSION=22.13.0`.
* Production Supabase auth environment variables must be configured.
* Admin auth, member settlement entry, cloud persistence, browser refresh
  restore, realtime active-session sync, route smoke checks, and optional Google
  Drive checks must pass on `https://home-finance-os.pages.dev`.
