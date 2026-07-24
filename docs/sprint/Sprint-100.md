# Sprint 100

## Post-Commit Remote Readback

**Branch:** main

---

## Intent

Sprint 100 adds read-only smoke checks after a migration checkpoint is
committed.

The goal is to prove the committed remote household, accounts, transactions,
and transaction account links can be read back before any restore, remote CRUD,
or automatic sync behavior is enabled.

---

## Planned Scope

* [x] Add a post-commit diagnostics section under Auth Diagnostics.
* [x] Verify the latest migration checkpoint is committed.
* [x] Verify the committed remote household is readable.
* [x] Compare readable remote account and transaction counts to the checkpoint.
* [x] Verify staged transaction account-link diagnostics remain clean.
* [x] Keep the checks read-only and keep automatic sync disabled.

---

## Out Of Scope

* Cloud restore.
* Remote CRUD.
* Automatic multi-device sync.
* Conflict resolution.
* Additional migration domains.

---

## Verification Targets

* `npm test`
* `npm run build`
* Production Auth Diagnostics shows Post-Commit Remote Readback checks after a
  committed checkpoint.
