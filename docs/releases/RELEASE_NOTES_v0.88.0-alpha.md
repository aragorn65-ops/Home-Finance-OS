# Release Notes v0.88.0-alpha

## Cloud Schema Readiness Diagnostics

Home Finance OS v0.88.0-alpha adds a production-visible schema readiness check
for the Supabase cloud data tables introduced in Sprint 87.

---

## Added

* Added read-only Supabase table probes for account, transaction, allocation,
  provider bill, settlement, settlement application, savings goal, and savings
  activity tables.
* Added a Cloud Schema Readiness section to Auth Diagnostics.
* Added adapter test coverage for passing and blocked schema readiness checks.

---

## Safety

* The checks do not upload local records.
* Remote CRUD and automatic multi-device sync remain disabled.
* Missing schema objects are reported as blocked readiness items instead of
  hiding the rest of Auth Diagnostics.
