# Release Notes v0.103.0-alpha

## Public Beta Production Validation Prep

Home Finance OS v0.103.0-alpha prepares the public beta candidate for live
Cloudflare Pages and Supabase validation while tightening settlement
partial-payment behavior.

---

## Changed

* Added deployed build metadata and Auth Diagnostics wording so live testers
  can confirm the deployed commit, branch, build time, and current public beta
  scope before running production smoke checks.
* Added Supabase schema readiness probes for household preferences, core
  account/transaction snapshots, and settlement record mutations.
* Preserved settlement application rows in remote settlement create/update
  payloads so allocation-payment details survive cloud persistence.
* Synced expense allocation rows through the Supabase core snapshot flow and
  refreshed that snapshot before remote settlement saves, preventing household
  allocation ownership errors when recording partial settlements.
* Added a conservative restore guard so an older or incomplete cloud snapshot
  cannot wipe local expense allocations when transactions still exist.
* Updated the Supabase schema script to drop the changed
  `load_household_core_snapshot(uuid)` RPC before recreating it with allocation
  data in the return payload.
* Mapped remote settlement member UUIDs back to local household member IDs when
  Supabase returns `household_members.local_record_id`, keeping cloud-loaded
  settlement history readable after refresh or restore.
* Improved manual settlement entry so a user can enter a desired payment amount,
  check selected outstanding allocations, and have the payment automatically
  applied in order with any remainder recorded as a partial payment on the next
  checked allocation.
* Normalized `shared/types` imports to explicit `shared/types/index` paths for
  service-level Node test-runner compatibility.

---

## Verified

* `npm.cmd test` passed with 165 tests.
* `npm.cmd run build` passed.
* `git diff --check` passed with no whitespace errors.

---

## Launch Status

Public beta is not launched by this release.

Live Cloudflare Pages and Supabase validation remains required before inviting
testers, including deployment health, runtime environment, auth smoke checks,
cloud persistence, browser-refresh restore, realtime active-session sync,
limited member settlement entry, route smoke checks, and optional Google Drive
checks when configured.
