# Home Finance OS Sprint 37

## Private Beta Test Pack

**Release:** v0.37.0-alpha
**Date:** 2026-07-21
**Branch:** sprint-37-private-beta-test-pack
**Status:** Completed

---

## Sprint Objective

Sprint 37 turns the Sprint 36 beta readiness decision into a repeatable guided
private beta process.

The sprint keeps product scope frozen and adds tester-facing operating material:
what to test, how to protect data, how to report issues, and what remains out of
scope for the local-first beta candidate.

---

## Completed Scope

* [x] Created a private beta test runbook.
* [x] Added a structured beta feedback issue template.
* [x] Updated the README status from early architecture framing to the current
      guided private beta candidate state.
* [x] Added release notes for the private beta test pack.
* [x] Confirmed manual settlement Apply Full behavior during private beta
      closure.
* [x] Kept production auth, cloud sync, and new finance modules out of scope.

---

## Out Of Scope

* Public beta launch.
* Production cloud sync.
* Production auth provider onboarding.
* Multi-household collaboration.
* New finance modules.

---

## Verification Targets

```text
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
```

## Closure Notes

Sprint 37 is closed after the private beta runbook functional pass, manual
settlement Apply Full verification, and clean automated validation.

Final closure validation:

```text
npm.cmd test
npm.cmd run build
```
