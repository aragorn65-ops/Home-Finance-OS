# Home Finance OS Sprint 33

## Data Safety Hardening

**Release:** v0.33.0-alpha
**Date:** TBD
**Branch:** sprint-33-data-safety-hardening
**Status:** Planned

---

## Sprint Objective

Sprint 33 hardens the local-first data safety path before beta testing.

The sprint focuses on backup, restore, reset, clear-test-data, migration checkpoint, and local authenticated-link behavior. It should reduce the chance that a tester loses local data or becomes confused about whether data is local-only, claimed, linked, or reset.

---

## Planned Scope

* [ ] Review backup export summaries for linked and unlinked households.
* [ ] Confirm authenticated-link metadata is included in local backups.
* [ ] Confirm restore preserves linked household metadata when present.
* [ ] Confirm reset and clear-test-data behavior is explicit about what is kept or removed.
* [ ] Add user-facing copy where local-only, claimed, and linked states may be ambiguous.
* [ ] Document manual QA for backup, restore, reset, and migration-link flows.

---

## Out Of Scope

* Production auth provider integration.
* Remote sync as source of truth.
* New finance modules.
* Multi-device conflict resolution.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
