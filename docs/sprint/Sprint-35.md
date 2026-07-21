# Home Finance OS Sprint 35

## UX Polish Pass

**Release:** v0.35.0-alpha
**Date:** TBD
**Branch:** sprint-35-ux-polish-pass
**Status:** Planned

---

## Sprint Objective

Sprint 35 improves the existing product experience without expanding feature scope.

The sprint should polish empty states, error states, loading states, mobile behavior, button spacing, form clarity, and beta-safety copy across the core local-first workflows.

---

## Planned Scope

* [ ] Audit Dashboard, Settings, Accounts, Transactions, Utilities, Settlements, Savings, and Analytics for empty states.
* [ ] Improve unclear error and disabled-button states.
* [ ] Run desktop and mobile visual QA for core beta workflows.
* [ ] Fix text overflow, cramped controls, and inconsistent spacing discovered during QA.
* [ ] Confirm auth and migration diagnostics remain clearly marked as prototype surfaces.
* [ ] Avoid new feature modules or large redesigns.

---

## Out Of Scope

* New dashboard widgets.
* New finance categories/modules.
* Large visual redesign.
* Production sync UI.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
