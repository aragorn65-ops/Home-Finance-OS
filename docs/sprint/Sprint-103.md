# Sprint 103

## Public Beta Production Validation

**Branch:** main

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
