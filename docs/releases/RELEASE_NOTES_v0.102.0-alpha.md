# Release Notes v0.102.0-alpha

## Public Beta Cloud Baseline

Home Finance OS v0.102.0-alpha resets the public beta target around
authenticated admin access, limited member settlement entry, cloud-backed
household persistence, and real-time synchronization.

---

## Changed

* Added authenticated adapter contracts and Supabase RPC wiring for household
  metadata, account/transaction core snapshots, and settlement records.
* Added app integration so signed-in owner/admin sessions restore linked
  household metadata and core snapshots from the cloud after browser refresh.
* Added active-session realtime reload plumbing for household metadata, core
  snapshots, and settlement records.
* Added limited member settlement-entry behavior while keeping member access out
  of accounts, transactions, utilities, savings, settings, backups, household
  configuration, and migration state.
* Updated launch, deployment, smoke-test, README, user guide, and in-app help
  wording to match the one-month public beta scope.

---

## Safety

* Public beta is not launched by this release note.
* Local export/import backup remains a required safety rail.
* Cloud write failures must stay visible and fail closed.
* Multi-device household access, broad shared collaboration, conflict
  resolution, and full utility/savings cloud persistence remain out of scope
  unless explicitly expanded.
