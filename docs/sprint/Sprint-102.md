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
* [ ] Add cloud-backed persistence for household and core finance records.
* [ ] Add real-time synchronization for the active authenticated household
  session.
