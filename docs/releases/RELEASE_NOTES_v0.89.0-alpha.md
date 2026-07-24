# Release Notes v0.89.0-alpha

## Migration Upload Dry-Run Contract

Home Finance OS v0.89.0-alpha adds a local dry-run migration contract before
remote validation.

---

## Added

* Added a dry-run upload contract that compares checkpoint record counts with
  the current browser data health summary.
* Added a migration checkpoint panel summary showing current versus checkpoint
  record totals.
* Added tests for count matches, local data drift, and inconsistent checkpoint
  totals.

---

## Safety

* The dry-run does not upload local records.
* Remote CRUD and automatic multi-device sync remain disabled.
* Validation stops before the Supabase RPC if local data has changed since the
  checkpoint was created.
