# Release Notes v0.87.0-alpha

## Cloud Data Schema Groundwork

Home Finance OS v0.87.0-alpha adds the next cautious step toward authenticated
storage by extending the disposable Supabase schema target.

---

## Added

* Added remote schema targets for expense allocations, provider bills,
  settlements, settlement applications, savings goals, and savings activities.
* Expanded account and transaction schema columns to cover local balance,
  currency, attachment, notes, and migration id mapping needs.
* Added per-household `local_record_id` mapping so migration can preserve
  browser record identifiers without making them backend primary keys.
* Added household-scoped RLS read policies for the new remote data tables.

---

## Safety

* Remote CRUD and automatic sync remain disabled.
* The schema remains intended for disposable or beta Supabase validation only.
* Existing app behavior remains local-first until later migration/upload
  sprints deliberately add remote write paths.
