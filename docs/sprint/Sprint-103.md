# Sprint 103

## Public Beta Production Validation

**Branch:** main
**Started:** 2026-07-30

---

## Intent

Sprint 103 turns the Sprint 102 repo-side cloud baseline into a production
validation pass for the Cloudflare Pages public beta candidate.

The goal is to prove the deployed site has the right runtime configuration,
production Supabase auth, cloud-backed household persistence, limited member
settlement-entry access, browser-refresh restore, and active-session realtime
synchronization before inviting public beta testers.

---

## Planned Scope

* [ ] Verify Cloudflare Pages production deployment health.
* [ ] Confirm Settings Auth Diagnostics reports the expected deployed commit
  and branch for the latest `main` checkpoint.
* [ ] Verify Cloudflare Pages uses `NODE_VERSION=22.13.0`.
* [ ] Verify production Supabase auth environment variables are configured.
* [ ] Run production admin sign-in, sign-out, session refresh, and expired
  session recovery smoke checks.
* [ ] Run production admin household claim/create smoke checks.
* [ ] Run production cloud persistence checks for household metadata,
  account/transaction core snapshots, and settlement records.
* [ ] Run production browser-refresh restore checks for the cloud-backed
  baseline.
* [ ] Run production active-session realtime checks for the cloud-backed
  baseline.
* [ ] Run limited member settlement-entry smoke checks.
* [ ] Run signed-out and member route-access smoke checks.
* [ ] Run public beta route smoke checks on every first-class route.
* [ ] Record the production results in
  `docs/qa/Public-Beta-Launch-Evidence.md`.

---

## Out Of Scope

* Launching public beta before the launch checklist is fully satisfied.
* Multi-device household access.
* Broad shared household collaboration.
* Invite or membership onboarding beyond the minimum member settlement-entry
  validation path.
* Conflict resolution.
* Full utility/savings cloud persistence.
* New finance modules.

---

## Verification Targets

* `npm.cmd test`
* `npm.cmd run build`
* `git diff --check`
* `docs/qa/Cloudflare-Pages-Smoke-Check.md`
* `docs/qa/Public-Beta-Launch-Checklist.md`

---

## Sprint Start Notes

Sprint 103 starts after the Sprint 102 live-test hardening checkpoints through
`6b17f87`.

Initial production validation should focus on:

* Confirming the latest Cloudflare Pages deployment includes `6b17f87`.
* Re-running admin sign-in and linked-household restore after a hard refresh.
* Re-testing expense, utility provider bill, and settlement saves with
  attached files.
* Confirming metadata-only attachments remain visible without broken preview
  actions.
* Recording any production-only Supabase schema or cache issue before widening
  the beta invite list.

---

## Completed Checkpoints

* [x] Added deployed build metadata to Auth Diagnostics so live testers can
  confirm the Cloudflare Pages commit, branch, and build time before running
  public beta smoke checks.
* [x] Added production validation ledger/checklist updates for public beta
  route smoke, attachment-save evidence, metadata-only previews, and required
  Supabase RPC visibility.
* [x] Added automated coverage for Cloudflare build metadata formatting and
  local fallback display.
* [x] Added Auth Diagnostics Supabase RPC visibility probes for household
  preferences, core snapshots, and settlement record mutations.
* [x] Refreshed Auth Diagnostics wording from early spike language to the
  current public beta scope boundary.
* [x] Mapped remote settlement member UUIDs back to local household member IDs
  when Supabase returns `household_members.local_record_id`, keeping
  cloud-loaded settlement history readable after refresh or restore.
* [x] Sent locally built settlement application rows with remote settlement
  create/update RPC calls so future cloud settlement records preserve the
  allocation-payment details needed for item-balance history.
* [x] Added manual settlement auto-computation so a tester can enter the
  desired settlement amount, check the intended outstanding allocations, and
  have HFOS apply the payment in order with any remainder recorded as the next
  allocation's partial payment.
* [x] Added regression coverage for a 5,000 settlement applied against 9,000
  of outstanding July obligations, fully covering one allocation and partially
  covering the next while preserving the remaining outstanding balance.
* [x] Normalized `shared/types` imports to explicit `shared/types/index` paths
  so the Node test runner can load service-level settlement tests without
  unsupported directory-import failures.

---

## Sprint Closeout

**Closed:** 2026-08-06

**Result:** Closed as a repo-side production validation and settlement
hardening sprint.

Sprint 103 prepared the public beta candidate for live Cloudflare Pages and
Supabase validation by improving deployed build diagnostics, widening
production readiness probes, preserving settlement application details across
remote create/update calls, mapping remote settlement member ids back to local
household member ids, and hardening manual settlement entry for partial-payment
household workflows.

The public beta is **not launched** by this sprint. The live production gates
below still require validation against:

```text
https://home-finance-os.pages.dev
```

### Final Verification

* `npm.cmd test` passed with 162 tests.
* `npm.cmd run build` passed.
* `git diff --check` passed with no whitespace errors.

### Remaining Launch Gates

* Cloudflare Pages production deployment must be green.
* Settings Auth Diagnostics must report the expected deployed build commit and
  branch for the current `main` checkpoint.
* Cloudflare Pages must use `NODE_VERSION=22.13.0`.
* Production Supabase auth environment variables must be configured.
* Latest Supabase schema SQL must be applied and the PostgREST schema cache
  must be reloaded.
* Admin sign-in, sign-out, session refresh, expired-session recovery, household
  claim/create, cloud persistence, browser-refresh restore, realtime
  active-session sync, route smoke checks, and limited member settlement-entry
  smoke checks must pass on the deployed site.
* Optional Google Drive upload/list/download checks must pass when
  `VITE_GOOGLE_CLIENT_ID` is configured for the deployed build.
