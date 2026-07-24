# Release Notes v0.101.0-alpha

## Cloud Restore Preview

Home Finance OS v0.101.0-alpha adds a read-only restore preview for committed
Supabase migration checkpoints.

---

## Changed

* Auth Diagnostics now shows a Cloud Restore Preview section after post-commit
  readback checks.
* The preview summarizes household name, account count, transaction count,
  currencies, and transaction date range.
* Restore-readiness checks verify the committed household, account totals,
  transaction totals, and transaction account links are visible.

---

## Safety

* The preview is read-only.
* Browser restore, remote CRUD, and automatic multi-device sync remain disabled.
* A committed checkpoint is required before the preview reports ready.
