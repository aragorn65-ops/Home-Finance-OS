# Home Finance OS Sprint 36

## Beta Readiness Review

**Release:** v0.36.0-alpha
**Date:** 2026-07-21
**Branch:** sprint-36-beta-readiness-review
**Status:** Completed

---

## Sprint Objective

Sprint 36 prepares HFOS for a private local-first beta decision.

The sprint should consolidate hardening work, verify the main workflows, document known limitations, and decide whether HFOS is ready for guided private beta testing.

---

## Completed Scope

* [x] Created a beta readiness checklist.
* [x] Documented known limitations and data-safety expectations for testers.
* [x] Verified backup export and restore expectations through docs and existing backup tests.
* [x] Added automated coverage for reset and clear-test-data behavior.
* [x] Confirmed auth prototype limitations are documented for beta testers.
* [x] Ran final build, lint, test, and whitespace checks.
* [x] Decided HFOS is a guided private local-first beta candidate.

---

## Sprint Notes

Sprint 36 closes the Sprint 33-36 hardening track. The product is ready for
guided private beta testing with sample or low-risk data, local backups before
meaningful sessions, and clear tester expectations around prototype auth,
browser-local persistence, and missing production sync.

Browser-based visual QA remains a known environment limitation until a repeatable
browser session or end-to-end test harness is available.

---

## Out Of Scope

* Public beta launch.
* Production cloud sync.
* Production auth provider onboarding.
* Multi-household collaboration.

---

## Verification Targets

```text
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
```
