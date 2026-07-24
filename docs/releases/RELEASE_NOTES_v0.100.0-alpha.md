# Release Notes v0.100.0-alpha

## Post-Commit Remote Readback

Home Finance OS v0.100.0-alpha adds read-only diagnostics for committed
Supabase migration checkpoints.

---

## Changed

* Auth Diagnostics now shows Post-Commit Remote Readback checks once a migration
  checkpoint exists.
* Committed checkpoints are checked against readable remote household, account,
  transaction, and transaction-link diagnostics.
* Count checks compare remote readback data to the committed checkpoint summary.

---

## Safety

* The new checks are read-only.
* Remote CRUD and automatic multi-device sync remain disabled.
* Failed readback checks block confidence in restore/sync work without changing
  any data.
