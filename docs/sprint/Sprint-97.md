# Sprint 97

## Commit-Unlock Checklist

**Branch:** main

---

## Intent

Sprint 97 adds a visible checklist for the final commit-unlock review. The app
can now show whether dry-run counts, upload manifest staging, account staging,
transaction staging, and the pre-commit audit are all ready.

The actual Commit action remains locked. This sprint creates the review surface
for the next decision, not the unlock itself.

---

## Planned Scope

* [x] Add a deterministic commit-unlock checklist helper.
* [x] Surface checklist state inside Migration Checkpoints.
* [x] Remember the latest in-browser pre-commit audit result for checklist
  display.
* [x] Keep Commit locked even when the checklist is ready for review.
* [x] Add focused tests for ready, missing-audit, and drift states.

---

## Out Of Scope

* Commit unlock.
* Remote CRUD.
* Automatic sync.
* Multi-device source-of-truth switch.
* Additional staging domains.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual app check: after **Audit commit** succeeds, the checklist shows ready
  for review while the Commit button remains locked.
