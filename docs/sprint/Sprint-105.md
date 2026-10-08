# Sprint 105

## Release Verification And Access Hardening

**Branch:** main
**Started:** 2026-09-25
**Status:** Active
**Baseline:** `e88b523`, accepted at Sprint 104 closeout.

## Intent

Complete the remaining release evidence without changing verified expense,
allocation, settlement, credit-offset, or carryover calculations. Sprint 104
acceptance does not by itself authorize public beta launch.

## Scope

* [x] Carry forward the accepted finance, sync, attachment, and backup baseline
  from Sprint 104 and record the remaining checks.
* [x] Audit current route and authorization behavior against the older QA
  guides; correct stale expectations before asking for more manual testing.
  Findings and corrected expectations: `docs/qa/Sprint-105-Access-Audit.md`.
* [ ] Verify server-side access boundaries for signed-out, owner/admin, member,
  and viewer sessions where supported. Hidden buttons are not authorization
  evidence. Include cross-household and private-record access.
* [ ] Complete direct-open and refresh checks on all public beta routes.
* [ ] Verify save-failure reporting, reconnect behavior, and concurrent-edit
  boundaries without changing financial calculations or using destructive
  production tests.
* [ ] Record deployed commit/branch, Cloudflare configuration, and Supabase
  readiness evidence. Do not reapply schema or migrations without a specific
  identified need.
* [ ] Reconcile the launch checklist and record remaining blockers or an
  evidence-backed launch recommendation.

## Current Progress

2026-10-04: per-authenticated-user browser storage, user-bound backups, isolated
reset operations, and session-switch reload guards are implemented locally.
320 frontend tests and production build pass. Deployment and real-browser
account-switch smoke remain pending. See
`docs/architecture/Private-Storage-Isolation.md`; no production data was reset.

Updated 2026-10-01 from user-reported production tests. The targeted settlement
write guard and member read privacy migrations returned success. Legitimate
settlement edits, private and participant-only visibility, signed-out route
blocking, sign-in without record loss, and finance-page checks passed.
Reconnect cleared the warning and delivered updated notes without refresh.
Background updates preserved unsaved entries in an open edit form. A fresh
backup export also passed. See `docs/qa/Public-Beta-Launch-Evidence.md`.

These UI checks do not complete direct server authorization verification.
Admin snapshot access is deliberately unchanged to avoid omitted-row deletion
through existing saves. Private-cache retention/admin privacy remain explicit
follow-up items. Same-record concurrent writes and failed-save behavior are not
proven by the open-form test. Details: `docs/qa/Sprint-105-Access-Audit.md`.

Next: capture the production build/branch and Cloudflare deployment/settings
evidence, then finish outstanding access, failure, and route checks.
Use disposable fixtures for negative authorization and failure tests; retain the
current July/August/September dataset and the latest backup.

## Guardrails

* No new finance modules, identity migrations, resets, or broad refactoring.
* Any proposed calculation change requires a separately demonstrated defect
  and an exact-amount regression test before implementation.
* Do not mark a production gate passed from unit tests or user UI checks alone.
* Keep metadata-only attachment recovery and restricted-file sharing limitations
  explicit. Do not promise files absent from the backup can be restored.
* Full savings cloud persistence and generalized multi-writer conflict
  resolution remain outside this sprint unless explicitly approved.

## Verification

For code changes: `npm.cmd test`, `npm.cmd run build`, focused regression tests,
and `git diff --check`. Record production evidence separately in
`docs/qa/Public-Beta-Launch-Evidence.md`. Consult
`docs/qa/Public-Beta-Launch-Checklist.md` for the release decision.

## Closeout

Pending completion or explicit disposition of every scoped gate. No public
beta launch decision has been made.
