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
* [ ] Run limited member settlement-entry smoke checks.
* [ ] Run public beta route smoke checks on every first-class route.
* [ ] Record the live evidence in
  `docs/qa/Public-Beta-Launch-Evidence.md`.

---

## Out Of Scope

* Broad shared household collaboration.
* Multi-device conflict resolution.
* General invite or membership onboarding flows beyond limited member
  settlement entry.
* Full utility and savings cloud persistence.
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

Use `docs/qa/Sprint-104-Supabase-Cutover.md` for the schema application and
verification queries before running deployed smoke checks.

Use `docs/qa/Sprint-104-Admin-Auth-Smoke.md` for the next live production
gate: admin sign-in, sign-out, session refresh, and expired-session recovery.

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
* [ ] Pending Sprint 104 live validation.

---

## Sprint Closeout

**Closed:** Pending

**Result:** Pending.
