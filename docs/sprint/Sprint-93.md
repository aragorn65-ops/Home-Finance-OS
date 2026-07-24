# Sprint 93

## Transaction Link Diagnostics

**Branch:** main

---

## Intent

Sprint 93 adds read-only diagnostics for staged transaction account-link gaps.
Sprint 92 can stage transactions even when a local source or destination account
reference cannot be resolved remotely. Before staging allocations or enabling
more cloud behavior, HFOS should make those gaps visible.

---

## Planned Scope

* [x] Extend Supabase transaction diagnostics to read staged source and
      destination account links.
* [x] Count transactions with linked source accounts.
* [x] Count transactions with linked destination accounts.
* [x] Count transactions with no account link.
* [x] Count expense transactions missing a source account link.
* [x] Surface the counts in Auth Diagnostics.

---

## Out Of Scope

* Mutating staged transactions.
* Re-linking account references.
* Expense allocation upload staging.
* Remote CRUD.
* Automatic multi-device sync.
* Commit unlock.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Auth Diagnostics check: after transaction staging, Transaction
  Visibility shows account-link counts for the staged remote rows.

---

## Notes For Next Step

If link gaps are present, the next sprint should decide whether to fix local
source-account normalization before allocation staging or proceed with nullable
links and record a reconciliation task.
