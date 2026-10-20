# Sprint 105

## Release Verification And Access Hardening

**Branch:** main
**Started:** 2026-09-25
**Status:** Closed with explicit carry-forward
**Closed:** 2026-10-20 (Asia/Manila)
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

## First Task

Member/viewer read filtering is now prepared and tested in disposable PostgreSQL
for snapshots and direct RLS reads. Production application remains pending.
Admin snapshot access is deliberately unchanged to avoid omitted-row deletion
through existing saves. Private-cache retention/admin privacy remain explicit
follow-up items, not completed gates.

Progress: deployed definitions received. Settlement write guard repair prepared
and verified in disposable PostgreSQL; production application pending. Snapshot
privacy and participant-only read-policy remediation remain open. Details:
`docs/qa/Sprint-105-Access-Audit.md`.

Compare the route/access QA guides with the current implementation and tests.
Document discrepancies and prioritize access-control risks before UI polish.
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

Closed at the user's request on 2026-10-20. The receipt-storage fix was accepted
on 2026-10-17: Admin and Rasha could view saved receipts; a fresh backup restored
in the local test preview with receipts viewable in Settlements, Transactions,
and Utilities, and balances and payment links matching. Closure evidence is in
`docs/qa/Private-Storage-Redeploy-Gate.md`.

Accepted releases: `231b642` (dark-theme popup fixes) and `22fd49b`
(receipt-capacity fix). The latter passed 307 automated tests, build, targeted
lint, and the subsequently reported manual acceptance checks. No financial data
was changed for sprint closeout.

Unchecked scope items above are NOT recorded as passed. Their disposition:

- Server-side access boundaries and session-switch data checks carry into the
  Sprint 106 login release gate; previous evidence must be reconciled, not
  assumed complete or discarded.
- Remaining route, reconnect, concurrent-edit, deployed-configuration, and
  launch-evidence checks remain open release-readiness work.
- Private-storage isolation remains disabled and separately tracked in
  `docs/qa/Private-Storage-Redeploy-Gate.md`. Generalized conflict resolution and
  full savings cloud persistence remain out of scope.

No public beta launch approval is implied by this administrative closeout.
Next active sprint: `docs/sprint/Sprint-106.md`.
