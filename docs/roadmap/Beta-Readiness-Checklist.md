# HFOS Beta Readiness Checklist

## Decision

HFOS is ready to be treated as a guided private local-first beta candidate.

This is not a public beta decision. Beta testers should use sample or low-risk
household data, export backups before meaningful testing sessions, and report
any restore, reset, attachment, currency, or mobile layout issue immediately.

---

## Ready For Private Beta

* Local-first household setup is available and remains the default path.
* Core modules are present for accounts, transactions, utilities, settlements,
  savings, dashboard review, analytics, and settings.
* Local backup export and restore are available, including optional
  password-protected backup files.
* Backup summaries and restore previews identify linked versus local-only
  household state.
* Clear Test Data keeps household setup, authenticated link state, app lock, and
  preferences while clearing financial records.
* Reset All Application Data removes the household and authenticated link state
  from the browser.
* Prototype auth and migration diagnostics are marked as prototype surfaces.
* Focused automated tests cover backup summary validation, malformed
  authenticated-link rejection, local authenticated-link loading, migration
  checkpoint commit, Clear Test Data, and full reset behavior.

---

## Tester Expectations

* Use test data or data that can be recreated.
* Export a local backup before and after each meaningful testing session.
* Keep backup passwords in a separate password manager; HFOS cannot recover
  forgotten backup passwords.
* Treat Google Drive backup as optional and configuration-dependent.
* Treat app lock as local browser privacy only, not account authentication.
* Expect prototype auth diagnostics to be resettable test surfaces rather than
  production cloud persistence.
* Include screenshots, selected month, theme, browser, and exact error copy when
  reporting issues.

---

## Known Limitations

* No production login provider.
* No production cloud sync.
* No multi-device shared household collaboration.
* No invite or household membership onboarding flow.
* No automatic backup schedule.
* No account recovery from backup password or app-lock PIN.
* Browser localStorage remains the primary persistence layer.
* Browser-based visual QA could not be completed in the Sprint 36 environment
  because no browser connector session was available.

---

## Final Gate

The current gate is public beta cloud readiness.

HFOS should not be opened to public beta testers until authenticated admin
access, limited member transparency and settlement-entry access, cloud-backed
household persistence, and real-time synchronization pass the public beta
launch checklist against the current Cloudflare Pages production deployment.

Multi-device household access, broad shared household collaboration, general
invite onboarding, offline merge, and conflict resolution remain explicitly out
of scope for public beta.
