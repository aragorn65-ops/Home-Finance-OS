# Release Notes v0.93.0-alpha

## Transaction Link Diagnostics

Home Finance OS v0.93.0-alpha adds read-only diagnostics for staged transaction
account-link gaps.

---

## Changed

* Auth Diagnostics now reads source and destination account link presence for
  staged remote transactions.
* Transaction Visibility now shows source-linked transaction count.
* Transaction Visibility now shows destination-linked transaction count.
* Transaction Visibility now shows transactions with no account link.
* Transaction Visibility now shows expense transactions missing a source account
  link.

---

## Safety

* This sprint is diagnostics-only.
* No staged transactions are mutated.
* Expense allocation staging, remote CRUD, automatic sync, and Commit remain
  disabled.
