# Release Notes v0.97.0-alpha

## Commit-Unlock Checklist

Home Finance OS v0.97.0-alpha adds a visible checklist for the final remote
migration commit-unlock review.

---

## Added

* Migration Checkpoints now shows a **Commit unlock checklist**.
* The checklist covers dry-run counts, upload manifest staging, account
  staging, transaction staging, pre-commit audit readiness, and the intentional
  commit lock.
* The app remembers the latest in-browser pre-commit audit result for checklist
  display.
* Focused tests cover ready, missing-audit, and drift states.

---

## Safety

* Commit remains locked.
* Remote CRUD and automatic sync remain disabled.
* The checklist is display-only and does not mutate local or remote data.
