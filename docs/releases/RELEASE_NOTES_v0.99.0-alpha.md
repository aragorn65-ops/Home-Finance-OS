# Release Notes v0.99.0-alpha

## Commit Owner-Link Resolution

Home Finance OS v0.99.0-alpha fixes the last local commit preflight for
claimed households where Supabase created a new remote owner-member id.

---

## Changed

* Commit preflight now resolves to the local browser household owner when the
  remote checkpoint owner id is not found locally.
* The authenticated household link is saved with the local owner member after
  the Supabase commit RPC succeeds.
* The commit-unlock checklist now reports Commit control as ready once all
  gates pass.

---

## Safety

* Supabase still performs the final commit authorization and staged-data checks.
* Existing local authenticated-link conflict protection remains in place.
* Remote CRUD and automatic sync remain disabled.
