# Release Notes v0.90.0-alpha

## Commit Upload-Staging Guard

Home Finance OS v0.90.0-alpha locks migration Commit until full upload staging
is implemented and verified, and adds a metadata-only upload manifest staging
step for validated checkpoints.

---

## Changed

* Validated migration checkpoints now show Commit as locked.
* The commit action fails closed before calling the remote Commit RPC when
  upload staging is not available.
* Validated checkpoints can stage an upload manifest that records expected
  record counts without writing full records.
* Migration checkpoint diagnostics now show the upload-staged lifecycle
  timestamp and staged record count.
* Added test coverage for the upload-staging guard and manifest RPC contract.

---

## Safety

* Validating a migration checkpoint still does not upload full records.
* Staging an upload manifest still does not upload full records.
* Commit cannot mark a migration complete before full remote record staging
  exists.
* Remote CRUD and automatic multi-device sync remain disabled.
