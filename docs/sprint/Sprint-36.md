# Home Finance OS Sprint 36

## Beta Readiness Review

**Release:** v0.36.0-alpha
**Date:** TBD
**Branch:** sprint-36-beta-readiness-review
**Status:** Planned

---

## Sprint Objective

Sprint 36 prepares HFOS for a private local-first beta decision.

The sprint should consolidate hardening work, verify the main workflows, document known limitations, and decide whether HFOS is ready for guided private beta testing.

---

## Planned Scope

* [ ] Create a beta readiness checklist.
* [ ] Document known limitations and data-safety expectations for testers.
* [ ] Verify backup export and restore from a beta tester perspective.
* [ ] Verify reset, clear-test-data, and local-first fallback behavior.
* [ ] Confirm auth prototype limitations are clearly documented.
* [ ] Run final build, lint, whitespace, and manual smoke QA.
* [ ] Decide whether the next release is private beta candidate or another hardening alpha.

---

## Out Of Scope

* Public beta launch.
* Production cloud sync.
* Production auth provider onboarding.
* Multi-household collaboration.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
