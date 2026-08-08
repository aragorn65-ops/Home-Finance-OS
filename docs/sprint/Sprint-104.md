# Sprint 104

## Public Beta Production Cutover Readiness

**Branch:** main
**Started:** 2026-08-06

---

## Intent

Sprint 104 turns the Sprint 103 production-validation prep into a cutover
readiness pass for the public beta candidate.

The goal is to verify that the deployed Cloudflare Pages build, Supabase schema,
cloud-backed core snapshots, settlement partial-payment persistence, and local
data safety guards are stable enough to move from repo-side readiness into live
tester onboarding.

---

## Planned Scope

* [x] Confirm the latest `main` deployment includes Sprint 103 closeout commit
  `3119114` or newer.
* [x] Apply the latest Supabase schema SQL and reload the PostgREST schema
  cache.
* [x] Verify Auth Diagnostics reports the expected Cloudflare build commit,
  branch, Supabase readiness probes, and RPC visibility.
* [x] Run admin sign-in, sign-out, session refresh, and expired-session
  recovery smoke checks on production.
* [x] Run linked-household restore after browser refresh with accounts,
  transactions, expense allocations, and settlements present.
* [x] Re-test the July-to-August partial settlement workflow:
  a 9,000 outstanding balance settled by a 5,000 payment that fully covers one
  allocation and partially covers the next.
* [x] Verify the settlement remains recorded in the selected payment month and
  the original July unsettled remainder remains visible until fully paid.
* [x] Verify remote settlement history appears after refresh and does not leave
  the form stuck in a saving/reset state after failures.
* [ ] Run limited member transparency and settlement-entry smoke checks.
* [ ] Run public beta route smoke checks on every first-class route.
* [ ] Record the live evidence in
  `docs/qa/Public-Beta-Launch-Evidence.md`.

---

## Out Of Scope

* Broad shared household collaboration.
* Multi-device conflict resolution.
* General invite or membership onboarding flows beyond limited member
  transparency and settlement entry.
* Full savings cloud persistence.
* New finance modules.

---

## Verification Targets

* `npm.cmd test`
* `npm.cmd run build`
* `git diff --check`
* `docs/qa/Cloudflare-Pages-Smoke-Check.md`
* `docs/qa/Public-Beta-Launch-Checklist.md`
* `docs/qa/Public-Beta-Launch-Evidence.md`
* `docs/qa/Sprint-104-Supabase-Cutover.md`
* `docs/qa/Sprint-104-Admin-Auth-Smoke.md`
* `docs/qa/Sprint-104-Member-Transparency-Smoke.md`
* `docs/qa/Sprint-104-Route-Smoke.md`
* `docs/qa/Sprint-104-Realtime-Smoke.md`
* `docs/qa/Sprint-104-Attachment-Smoke.md`

---

## Sprint Start Notes

Sprint 104 starts after Sprint 103 closeout through `3119114`.

Initial validation should focus on the settlement and allocation chain that
surfaced during Sprint 103 closeout:

* Supabase core snapshot RPCs must include expense allocations.
* Remote settlement application rows must resolve allocation local IDs within
  the same household.
* Cloud restore must not erase local allocations when an older or incomplete
  remote snapshot has transactions but no allocation rows.
* Partial settlements must preserve the unpaid remainder on the next selected
  allocation.
* Utilities payment history must stay scoped to the selected payment month so a
  July payment does not appear in August unless it was actually paid in August.
* Utilities and Savings must retain the shared reporting month selector so
  testers can keep month context visible while validating those routes.

Use `docs/qa/Sprint-104-Supabase-Cutover.md` for the schema application and
verification queries before running deployed smoke checks.

Use `docs/qa/Sprint-104-Admin-Auth-Smoke.md` for the next live production
gate: admin sign-in, sign-out, session refresh, and expired-session recovery.

Use `docs/qa/Sprint-104-Member-Transparency-Smoke.md` for the limited member
and viewer transparency pass before closing public beta route validation.

Use `docs/qa/Sprint-104-Route-Smoke.md` for the direct-open and browser-refresh
route pass across signed-out, admin, member, and viewer states.

Use `docs/qa/Sprint-104-Realtime-Smoke.md` for the two-tab active-session
sync pass across household preferences, core snapshots, utility provider
bills, and settlements.

Use `docs/qa/Sprint-104-Attachment-Smoke.md` for the expense, utility provider
bill, payment receipt, settlement receipt, metadata-only preview, and member
permissible-attachment review pass.

---

## Completed Checkpoints

* [x] Added the Sprint 104 Supabase cutover guide with the required schema
  application, cache reload, RPC signature checks, allocation table check, and
  deployed app verification steps.
* [x] Applied the latest Supabase schema SQL and reloaded the PostgREST schema
  cache for the Sprint 104 cutover pass.
* [x] Verified the deployed Auth Diagnostics, core snapshot allocation sync,
  linked-household refresh restore, August settlement history, and July
  unsettled remainder behavior after the Sprint 104 Supabase cutover.
* [x] Added the Sprint 104 admin-auth smoke guide for production sign-in,
  sign-out, session refresh, and expired-session recovery validation.
* [x] Verified production admin sign-in, signed-out route blocking, session
  refresh, and expired-session recovery behavior.
* [x] Filtered Utilities provider payment history by selected month and added
  regression coverage so July paid provider bills do not appear while August
  is selected.
* [x] Restored the shared reporting month selector in Utilities and Savings so
  the selected month remains visible on those public beta smoke routes.
* [x] Added a Household Members invite action backed by Supabase member-linking
  RPC support so limited member transparency and settlement-entry smoke testing
  has a production UI path.
* [x] Opened Household Members as a member transparency route while keeping
  roster management actions limited to owner/admin sessions.
* [x] Kept Settings available for signed-out or pre-membership auth recovery
  while limiting household preferences, backup, and reset tools to owner/admin
  sessions in production auth mode.
* [x] Clarified personal account creation and payment selectors so household
  accounts remain available to selected payers while personal accounts appear
  only for their owner.
* [x] Opened Accounts as a read-only member transparency route while keeping
  personal accounts visible only to the owning member and keeping account
  management controls owner/admin-only.
* [x] Tightened member/viewer tenant-record authorization to read-only access
  and hid settlement edit/delete controls from member transparency sessions
  while preserving involved-member settlement entry.
* [x] Added the Sprint 104 member transparency smoke guide covering member
  route review, read-only controls, personal account visibility, involved
  settlement entry, viewer restrictions, and admin review.
* [x] Added the Sprint 104 route smoke guide covering direct-open and refresh
  behavior for signed-out, admin, member, and viewer route states.
* [x] Scoped member transaction attachment review to transactions the member
  may view, and clarified provider-bill metadata-only attachment copy for
  read-only review.
* [x] Added the Sprint 104 realtime smoke guide covering active-session
  household preference, core snapshot, utility provider bill, and settlement
  sync behavior.
* [x] Added the Sprint 104 attachment smoke guide covering attachment saves,
  refresh persistence, metadata-only preview copy, and member permissible
  attachment review.
* [x] Fixed member personal account visibility after save by authorizing local
  account records against the local household id while preserving the signed-in
  member identity.
* [x] Hardened involved-member settlement entry and review checks to accept
  local member aliases for signed-in Supabase memberships.
* [x] Preserved member-created personal accounts when a linked member session
  reloads through a different local household shell.
* [x] Expanded member account-owner aliases so personal accounts remain visible
  when a signed-in member is represented by local, linked-shell, or Supabase
  member ids.
* [x] Removed the admin household owner fallback from member account creation
  so new member personal accounts default to the signed-in member only.
* [x] Added a local member-personal account archive so member-created personal
  accounts survive cloud core snapshot restore and browser refresh.
* [ ] Pending Sprint 104 live validation.

---

## Pause Note - 2026-08-06

Paused after the member account ownership retest exposed a magic-link delivery
block. Latest pushed code checkpoint is `3a7b065`; latest docs checkpoint is
`be9df1c`.

Resumed on 2026-08-08. Magic-link sign-in as Rasha succeeded, but a newly
created member personal account disappeared after browser refresh. Added
checkpoint `90b775e`, which stores member-created personal accounts in a local
archive and merges that archive back after cloud core snapshot restore.

Resume by waiting for the Cloudflare production build to show `90b775e` or
newer in Settings -> Auth Diagnostics, then sign in as Rasha/member and retest:

* Create a fresh personal account.
* Confirm the account owner is Rasha, not the admin household owner.
* Refresh Accounts and confirm the account remains visible.
* If the magic-link success message appears but no email arrives, check
  Supabase Authentication logs, spam/junk/promotions, email spelling, and avoid
  repeated sends while rate limits may be active.

After account ownership/refresh passes, continue Sprint 104 live validation
with involved-member settlement entry, full route smoke, attachment smoke, and
two-tab realtime smoke.

---

## Sprint Closeout

**Closed:** Pending

**Result:** Pending.
