# Home Finance OS v0.10.0-alpha

## Durable Persistence and Payment Visibility

**Release Date:** July 16, 2026
**Status:** Alpha Release
**Sprint:** Sprint 10

---

## Overview

Home Finance OS v0.10.0-alpha introduces durable browser persistence for the single active household.

Household members, accounts, transactions, expense allocations, settlements, settlement applications, utility-generated expenses, and supporting attachments now remain available after refresh through versioned localStorage repositories.

This release also strengthens private-account ownership rules, adds receipt and bill attachments, improves utility and settlement account selection, exposes itemized unpaid obligations, and adds payment-status tags to shared expense transactions.

Savings and Reports placeholder pages are also included to reserve their application routes for future development.

---

## Key Features

### Versioned Local Persistence

HFOS now persists core application records using versioned storage keys.

Persisted data includes:

* Household setup and members
* Accounts
* Transactions
* Expense allocations
* Settlements
* Settlement applications
* Utility-generated transactions and allocations
* Receipt and bill attachments

Stored dates are serialized and restored as JavaScript Date instances when loaded.

Stored empty collections remain empty and are not automatically replaced with demo data.

Malformed or unsupported storage is not silently overwritten.

---

### Application Data Reset

Settings now includes an explicit two-step Reset All Data workflow.

The reset removes all versioned HFOS data and returns the application to household setup.

Deleted records remain removed after refresh.

---

### Receipt and Bill Attachments

Transactions now support supporting documents.

Users may:

* Upload JPEG, PNG, WebP, or PDF files
* Paste images directly from the clipboard
* Classify attachments as Receipt, Bill, or Other
* Preview uploaded images
* Open saved image and PDF attachments
* Remove attachments before or after saving
* Restore saved attachments when editing a transaction

Utility bills use the same attachment workflow, and their attachments are persisted with the generated expense transaction.

Attachment validation includes:

* Maximum of three attachments per transaction
* Maximum individual file size of 750 KB
* Maximum combined binary size of 1.5 MB
* Supported MIME-type validation
* Data URL integrity checks

---

### Private Account Ownership

Private financial accounts are restricted to their owners.

Transaction, utility, and settlement account selectors now show only active accounts owned by the selected member.

Changing the selected payer or receiver automatically clears an account that is no longer valid.

Other household members and administrators cannot view or use another member's private account details.

---

### Utility Allocation Improvements

Fixed compensation and equal participation in the remaining utility bill are now mutually exclusive.

A member may either:

* Receive a fixed compensation amount, or
* Participate in the equal division of the remaining common bill

A member cannot receive both in the same utility calculation.

Utility payment-account selection is also restricted to accounts owned by the selected paying member.

---

### Itemized Member Balances

The Settlements page now exposes the individual expenses contributing to each member balance.

Each member card may display:

* Items to Pay
* Items to Receive
* Expense description
* Transaction date
* Original allocated amount
* Amount paid or received
* Remaining amount
* Unpaid or Partially Paid status
* The other household member involved

Outstanding items remain ordered by their transaction date through the existing settlement allocation service.

---

### Partial Payment Visibility

Shared expense transactions now display a derived reimbursement status:

* Unpaid
* Partially Paid
* Paid

The status is calculated from the transaction's included expense allocations and active settlement applications.

No duplicate payment-status field is stored on the transaction.

Editing or deleting a settlement recalculates the transaction status automatically.

---

### Savings and Reports Placeholders

The application now includes working routes and placeholder pages for:

* Savings
* Reports

These pages introduce no business logic yet.

They reserve space for future savings goals, contribution tracking, financial summaries, utility trends, settlement reports, and export tools.

---

## Architecture and Persistence

Sprint 10 retains the existing feature-based architecture:

```text
UI
-> Service
-> Repository
-> Versioned localStorage
```

The persistence layer uses schema-aware envelopes and defensive model cloning.

Repository initialization follows these rules:

1. Seed only when the versioned storage key is missing.
2. Preserve intentionally stored empty arrays.
3. Hydrate serialized dates into Date objects.
4. Return failure when persistence cannot be completed.
5. Avoid silently replacing malformed or unsupported stored data.

The application remains frontend-only.

This release does not introduce:

* Backend APIs
* Cloud database storage
* Authentication
* Multi-device synchronization
* Multi-household switching

---

## Privacy Rules

HFOS remains a strictly single-household application.

All records belong to the one active household.

Account privacy follows these rules:

* Private accounts are visible only to their owners.
* Shared transaction participants may view the transaction where permitted.
* Private account details are not exposed to other members.
* Administrator status does not override private account ownership.
* Creating another household remains an explicit future workflow.

---

## Fixes

This release fixes:

* Persisted dates reopening as strings
* Empty stored collections being replaced by demo records
* Historical account corrections failing when an account is inactive
* Private accounts appearing for non-owners
* Invalid transaction and utility payment accounts remaining selected after changing payer
* Invalid settlement source or destination accounts remaining selected after changing members
* Utility members receiving both fixed compensation and an equal share of the remaining bill
* Utility attachments being omitted from generated transactions
* Outstanding settlement balances hiding their underlying expense items
* Shared expense transactions lacking reimbursement-status visibility
* Payment-status logic attempting to read a nonexistent stored allocation status field

---

## Verification

Sprint 10 was verified through production builds, lint checks, and browser testing.

Verified behavior includes:

* Household data persists after refresh
* Accounts persist after refresh
* Transactions persist after refresh
* Expense allocations persist after refresh
* Settlements and applications persist after refresh
* Utility-generated transactions and allocations persist after refresh
* Stored empty arrays do not reseed
* Uploaded and pasted attachments persist
* Invalid attachment types and sizes are rejected
* Private accounts remain owner-only
* Fixed compensation and equal remainder sharing cannot both apply to one member
* Itemized settlement obligations show correct amounts and statuses
* Partial settlements update paid and remaining amounts
* Transaction tags recalculate after settlement changes
* Reset All Data removes persisted records permanently
* Savings and Reports routes render correctly
* TypeScript and Vite production build completes with zero errors
* ESLint completes with zero errors

The Vite build continues to report a non-blocking warning for a JavaScript bundle larger than 500 KB. Code splitting remains a future optimization task.

---

## Known Limitations

HFOS v0.10.0-alpha still uses browser localStorage.

Current limitations include:

* Data is limited to one browser profile
* Data does not synchronize across devices
* Clearing browser storage removes local HFOS records
* Attachment volume is constrained by browser storage limits
* There is no user authentication
* There is no cloud backup
* Multiple household members cannot collaborate from separate devices

---

## Next Sprint

Sprint 11 should focus on local MVP stabilization and preparation for external testing.

Recommended Sprint 11 scope:

* Settlement receipt attachments
* Final attachment regression testing
* User experience cleanup
* Improved error feedback
* External alpha deployment
* Feedback collection workflow
* Product documentation
* Local MVP release preparation
