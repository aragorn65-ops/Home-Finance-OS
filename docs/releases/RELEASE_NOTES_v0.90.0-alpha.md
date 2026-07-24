# Release Notes v0.90.0-alpha

## Commit Upload-Staging Guard

Home Finance OS v0.90.0-alpha locks migration Commit until full upload staging
is implemented and verified.

---

## Changed

* Validated migration checkpoints now show Commit as locked.
* The commit action fails closed before calling the remote Commit RPC when
  upload staging is not available.
* Added test coverage for the upload-staging commit guard.

---

## Safety

* Validating a migration checkpoint still does not upload full records.
* Commit cannot mark a migration complete before remote record staging exists.
* Remote CRUD and automatic multi-device sync remain disabled.
