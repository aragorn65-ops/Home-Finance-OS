# HFOS Beta Hardening Plan

## Purpose

Sprints 33-36 are reserved for hardening, tests, and UX polish before any beta test.

This track intentionally avoids major new feature scope. The goal is to make the existing local-first product safer, easier to evaluate, and clearer about its current auth and sync boundaries.

---

## Beta Target

The near-term target is a local-first beta candidate.

HFOS should be safe enough for guided private testing when:

* Local data can be exported and restored confidently.
* Existing household setup, finance workflows, and settings have smoke coverage.
* Auth prototype surfaces clearly distinguish local-only, claimed, linked, and remote-migration states.
* Critical empty, error, loading, and mobile states have been visually checked.
* Release notes and user-facing warnings make beta limitations clear.

This track does not make production cloud sync or multi-device shared households a beta requirement.

---

## Sprint Track

| Sprint | Theme | Outcome |
| --- | --- | --- |
| Sprint 33 | Data Safety Hardening | Backup, restore, reset, and migration-link behavior are safer and better documented. |
| Sprint 34 | Storage And Auth Tests | Storage migration, auth diagnostics, claim, migration, and local-link flows have focused automated coverage. |
| Sprint 35 | UX Polish Pass | Core workflows receive empty/error/loading/mobile polish without adding large new features. |
| Sprint 36 | Beta Readiness Review | Private beta checklist, release notes, known limitations, and final smoke QA are complete. |

---

## Guardrails

During Sprints 33-36:

* Prefer bug fixes, tests, accessibility, copy clarity, and visual polish.
* Avoid new finance modules.
* Avoid production auth provider integration unless it directly supports beta readiness.
* Avoid background sync, multi-device conflict resolution, and provider-specific storage schemas.
* Keep local-first mode the default and safest path.

---

## Exit Criteria

Before calling HFOS beta-ready:

* `npm.cmd run build` passes.
* `npm.cmd run lint` passes.
* `git diff --check` passes.
* Backup export and restore pass manual QA.
* Reset and clear-test-data flows pass manual QA.
* Core pages have desktop and mobile visual QA notes.
* Known limitations are documented for beta testers.
* Release notes clearly state beta scope and data-safety expectations.
