# Sprint 10 - Durable Local Persistence and Application Stabilization

**Release:** v0.10.0-alpha
**Status:** Complete
**Completed:** July 16, 2026

---

## Sprint Goal

Introduce durable local persistence for the single active household and stabilize the application around saved data, privacy, account ownership, attachments, settlements, and recovery workflows.

Sprint 10 replaces development-oriented in-memory repositories with versioned browser persistence while preserving the existing HFOS feature-based architecture.

The sprint also improves financial privacy, adds supporting-document attachments, exposes itemized settlement obligations, and adds transaction reimbursement-status visibility.

---

## Delivered Features

### 1. Versioned Storage Foundation

Implemented a shared localStorage persistence layer using schema-aware envelopes.

The storage layer provides:

* Versioned storage keys
* Schema version validation
* Structured load results
* Missing-key detection
* Malformed-data detection
* Unsupported-version detection
* Safe JSON parsing
* Explicit save and remove operations

Versioned keys include:

```text
hfos.v1.household
hfos.v1.accounts
hfos.v1.transactions
hfos.v1.expense-allocations
hfos.v1.settlements
hfos.v1.settlement-applications
```

---

### 2. Repository Persistence Rules

Repositories now follow consistent initialization and recovery rules.

The implemented rules are:

1. Seed demo data only when the versioned storage key is missing.
2. Preserve intentionally stored empty arrays.
3. Do not silently overwrite malformed data.
4. Do not silently replace unsupported schema versions.
5. Serialize Date values before saving.
6. Hydrate stored date strings back into Date instances.
7. Return persistence failure when localStorage cannot be updated.

This prevents deleted or intentionally empty data from unexpectedly returning after refresh.

---

### 3. Household Persistence Migration

Household storage was migrated from the legacy key:

```text
hfos.household
```

to the versioned key:

```text
hfos.v1.household
```

The migration preserves the existing household when valid legacy data is found.

Household members are also persisted with the active household.

---

### 4. Account Persistence

AccountRepository now persists account records through the shared storage layer.

Persisted account data includes:

* Household ownership
* Member ownership
* Account class
* Account type
* Currency
* Opening balance
* Current balance
* Credit limits and liability fields
* Visibility
* Active status
* Created and updated dates

Account service operations return persistence-aware results.

---

### 5. Account Management Improvements

The Accounts page now:

* Displays active and inactive accounts
* Excludes inactive accounts from active balance totals
* Preserves historical account records
* Allows historical corrections to update inactive account balances
* Enforces private-account ownership

Private accounts remain visible and usable only to their owners.

---

### 6. Transaction Persistence

TransactionRepository now persists transactions using versioned storage.

Persisted transaction data includes:

* Household identifier
* Recording member
* Paying member
* Type
* Amount
* Source and destination accounts
* Category
* Description
* Notes
* Visibility
* Expense split method
* Transaction date
* Attachments
* Active status
* Created and updated dates

Stored transactions are hydrated into defensive copies.

---

### 7. Expense Allocation Persistence

ExpenseAllocationRepository now persists allocation records.

Persisted allocation data includes:

* Transaction reference
* Household reference
* Paying member
* Participating member
* Inclusion status
* Allocated amount
* Personal amount
* Personal items
* Notes
* Created and updated dates

Personal-item arrays are deep-cloned to avoid shared mutable references.

Atomic replacement behavior is retained when editing expense transactions.

---

### 8. Settlement Persistence

SettlementRepository now persists settlement records.

Persisted settlement data includes:

* Household
* Paying member
* Receiving member
* Amount
* Settlement date
* Source account
* Destination account
* Application method
* Reference number
* Notes
* Active status
* Created and updated dates

Settlement account effects and rollback protection remain active.

---

### 9. Settlement Application Persistence

SettlementApplicationRepository now persists settlement-to-allocation applications.

Persisted application data includes:

* Settlement reference
* Expense allocation reference
* Applied amount
* Created and updated dates

Settlement creation, editing, and deletion preserve atomic behavior across:

* Settlement records
* Settlement applications
* Allocation payment state
* Linked account balance effects

---

### 10. Utility Persistence Through Transactions

Utility bills continue to persist through the existing transaction and allocation infrastructure.

A completed utility calculation creates:

```text
Transaction Type: Expense
Split Method: Exact
```

Utility-generated records now survive refresh because:

* Transactions persist
* Expense allocations persist
* Attachments persist
* Settlement obligations are derived from persisted allocations

No separate utility repository was introduced in Sprint 10.

---

### 11. Application Data Reset

Added a shared application reset service.

The reset removes all versioned HFOS storage keys, including:

* Household
* Accounts
* Transactions
* Expense allocations
* Settlements
* Settlement applications

Settings now provides an explicit two-step Reset All Data workflow.

The first action activates confirmation.

The second action removes the saved data and reloads the application.

After reset, HFOS returns to household setup.

---

### 12. Receipt and Bill Attachments

Added a shared StoredAttachment model.

Supported attachment categories are:

* Receipt
* Bill
* Other

Supported file types are:

* JPEG
* PNG
* WebP
* PDF

Users may:

* Upload one or more files
* Paste an image from the clipboard
* Preview image files
* Open image and PDF attachments
* Change the attachment category
* Remove an attachment
* Restore attachments when editing a saved transaction

---

### 13. Attachment Validation

Transaction attachment validation includes:

* Maximum of three attachments
* Maximum individual binary size of 750 KB
* Maximum combined binary size of 1.5 MB
* Supported MIME-type validation
* Unique attachment identifiers
* Valid filenames
* Positive file sizes
* Valid Base64 data URLs
* MIME and data URL consistency
* Valid attachment creation dates

Attachments are deep-cloned during transaction create and update operations.

---

### 14. Utility Bill Attachments

The Utilities form now supports provider bills and receipts.

Users may upload or paste supporting documents before saving the utility calculation.

The utility persistence service copies those attachments into the generated expense transaction.

The documents are then available through standard transaction details.

---

### 15. Transaction Attachment Display

Transaction details now include a Receipts and Bills section.

The section displays:

* Image preview or PDF marker
* Filename
* Attachment category
* File size
* Open Attachment action
* Empty state when no document exists

The transaction summary wording was also generalized so it is no longer grocery-specific.

---

### 16. Private Account Ownership Enforcement

HFOS now treats private accounts as strictly owner-only.

Private account rules include:

* Another member cannot view the account details.
* Another member cannot select the account in a transaction.
* Another member cannot use the account for a utility payment.
* Another member cannot use the account as a settlement source.
* Another member cannot use the account as a settlement destination.
* Administrator status does not bypass ownership.

The current unauthenticated application still requires manual member selection.

---

### 17. Payer-Owned Transaction Accounts

Transaction account selectors now depend on the selected member.

The form:

* Starts with no payer selected
* Disables applicable account selectors until a member is selected
* Shows only active accounts owned by that member
* Clears an invalid account after the member changes

TransactionService validates the same ownership rules before saving.

---

### 18. Payer-Owned Utility Accounts

Utility payment-account selection now:

* Requires a selected paying member
* Shows only active accounts owned by that member
* Clears the selected account when the paying member changes
* Validates ownership before transaction persistence

The Utilities page also scrolls save feedback into view and resets the form after a successful save.

---

### 19. Settlement Account Ownership

Settlement source and destination account selectors now enforce member ownership.

Source account rules:

* Disabled until the paying member is selected
* Shows only active accounts owned by the paying member
* Clears when the paying member changes to an incompatible owner

Destination account rules:

* Disabled until the receiving member is selected
* Shows only active accounts owned by the receiving member
* Clears when the receiving member changes to an incompatible owner

---

### 20. Utility Fixed Compensation Rule

Fixed compensation and equal participation in the remaining bill are now mutually exclusive.

For each member:

```text
Fixed Compensation
OR
Equal Share of Remaining Bill
```

A member cannot receive both in the same utility calculation.

The form automatically:

* Disables equal remainder participation when fixed compensation is entered
* Clears fixed compensation when equal remainder participation is enabled

The calculator and validator enforce the same rule.

---

### 21. Itemized Member Balances

Member balance cards now include expandable itemized sections.

Each member may view:

* Items to Pay
* Items to Receive

Each item displays:

* Expense description
* Transaction date
* Other household member
* Original allocated amount
* Amount paid or received
* Remaining amount
* Unpaid or Partially Paid tag

The itemized data comes from SettlementAllocationService.

No duplicate obligation calculation path was introduced.

---

### 22. Partial Settlement Visibility

The existing settlement engine continues to support:

* Full payments
* Partial payments
* Oldest-first application
* Manual allocation

After a partial settlement, the itemized member balance reflects:

* Increased paid amount
* Reduced remaining amount
* Partially Paid status

After full settlement, the allocation no longer appears in the outstanding itemized list.

---

### 23. Transaction Reimbursement Tags

Shared expense transactions now display a derived status:

* Unpaid
* Partially Paid
* Paid

TransactionService derives the status from payable expense allocations and their active settlement applications.

Status is not stored on Transaction.

Income, transfers, and expenses with no reimbursement obligation show no payment tag.

---

### 24. Savings Placeholder

Added a Savings page at:

```text
/app/savings
```

The placeholder reserves future space for:

* Savings goals
* Target amounts
* Member contributions
* Deadlines
* Progress tracking

No savings business logic or persistence was introduced.

---

### 25. Reports Placeholder

Added a Reports page at:

```text
/app/reports
```

The placeholder reserves future space for:

* Spending summaries
* Utility trends
* Settlement activity
* Export tools
* Private member financial summaries

No reporting calculations were introduced.

---

## Architecture Delivered

Sprint 10 continues the feature-based HFOS architecture:

```text
UI
|
v
Service
|
v
Repository
|
v
Versioned localStorage
```

Shared persistence infrastructure was added under:

```text
shared/storage/
```

Shared attachment models were added under:

```text
shared/models/
```

The implementation preserves:

* Repository abstraction
* Service-layer validation and business rules
* OperationResult error handling
* Feature-based modules
* Single-household boundaries
* Private account ownership
* Transactional rollback behavior

---

## Key Files Added

### Shared Storage

```text
frontend/src/shared/storage/localStorageStore.ts
```

### Shared Models

```text
frontend/src/shared/models/StoredAttachment.ts
```

### Reset Service

```text
frontend/src/features/startup/services/applicationDataReset.ts
```

### Savings

```text
frontend/src/features/savings/pages/SavingsPage.tsx
```

### Reports

```text
frontend/src/features/reports/pages/ReportsPage.tsx
```

### Documentation

```text
docs/releases/RELEASE_NOTES_v0.10.0-alpha.md
docs/sprint/Sprint-10.md
```

---

## Major Files Updated

```text
frontend/src/app/router/AppRouter.tsx
frontend/src/features/accounts/hooks/useAccounts.ts
frontend/src/features/accounts/repositories/AccountRepository.ts
frontend/src/features/accounts/services/AccountService.ts
frontend/src/features/household/services/householdStorage.ts
frontend/src/features/settings/pages/SettingsPage.tsx
frontend/src/features/settlements/components/MemberBalanceSummary.tsx
frontend/src/features/settlements/components/SettlementForm.tsx
frontend/src/features/settlements/pages/SettlementsPage.tsx
frontend/src/features/settlements/repositories/SettlementApplicationRepository.ts
frontend/src/features/settlements/repositories/SettlementRepository.ts
frontend/src/features/settlements/services/SettlementService.ts
frontend/src/features/transactions/components/TransactionDetails.tsx
frontend/src/features/transactions/components/TransactionForm.tsx
frontend/src/features/transactions/components/TransactionList.tsx
frontend/src/features/transactions/components/TransactionListItem.tsx
frontend/src/features/transactions/models/Transaction.ts
frontend/src/features/transactions/models/TransactionForm.ts
frontend/src/features/transactions/pages/TransactionsPage.tsx
frontend/src/features/transactions/repositories/ExpenseAllocationRepository.ts
frontend/src/features/transactions/repositories/TransactionRepository.ts
frontend/src/features/transactions/services/ExpenseAllocationService.ts
frontend/src/features/transactions/services/TransactionService.ts
frontend/src/features/transactions/validators/TransactionValidator.ts
frontend/src/features/utilities/components/UtilityBillForm.tsx
frontend/src/features/utilities/models/UtilityBillForm.ts
frontend/src/features/utilities/pages/UtilitiesPage.tsx
frontend/src/features/utilities/services/UtilityBillPersistenceService.ts
frontend/src/features/utilities/services/UtilityBillShareCalculator.ts
frontend/src/features/utilities/validators/UtilityBillValidator.ts
```

---

## Verified Workflows

The following workflows were verified during Sprint 10:

* Run the production TypeScript and Vite build
* Run ESLint with zero errors
* Load persisted household data after refresh
* Preserve intentionally empty stored collections
* Enforce private account ownership in transaction selectors
* Enforce private account ownership in utility selectors
* Enforce payer-owned settlement source accounts
* Enforce receiver-owned settlement destination accounts
* Prevent fixed compensation and equal remainder sharing for the same utility member
* Compile transaction and utility attachment workflows
* Display saved attachments in transaction details
* Display itemized member settlement balances
* Compile derived transaction payment-status tags
* Render Savings through `/app/savings`
* Render Reports through `/app/reports`
* Reset all versioned data
* Confirm deleted data does not return after refresh

Additional browser regression testing remains recommended before distributing the external alpha.

---

## Build Verification

Commands:

```powershell
npm run build
npm run lint
```

Results:

```text
TypeScript Build: PASS
Vite Production Build: PASS
Build Errors: 0

ESLint: PASS
ESLint Errors: 0
```

Vite reported a non-blocking warning that the main JavaScript bundle exceeds 500 kB after minification.

The final observed build transformed:

```text
2110 modules
```

---

## Git Verification

Branch:

```text
sprint-10-persistence
```

Before the final commit, run:

```powershell
git diff --check
git status --short
git diff --stat
```

LF-to-CRLF notices may appear on Windows and are not whitespace errors.

The final implementation commit and remote push are recorded after documentation is staged.

---

## Known Limitations

### Browser-Only Persistence

HFOS still uses localStorage as its primary data store.

Data is limited to the current browser profile.

There is no:

* Cloud database
* Cross-device synchronization
* Shared multi-user session
* Cloud backup
* Server-side authorization

---

### Browser Storage Capacity

Attachments use Base64 data URLs and consume more space than their original binary files.

Although per-transaction attachment limits are enforced, a large number of saved transactions may eventually reach browser storage limits.

A future SaaS version should move documents to private object storage.

---

### No Authentication

HFOS does not yet know which household member is currently signed in.

Member selection remains manual.

Owner-only account privacy is enforced through selected-member validation, but true security requires authenticated user identity and database-level authorization.

---

### No Dedicated Utility Bill Repository

Utility bills continue to persist as expense transactions and exact expense allocations.

HFOS still lacks:

* Dedicated utility bill history
* Utility-specific editing
* Automatic previous meter lookup
* Utility-specific reporting

---

### Savings and Reports Are Placeholders

Savings and Reports routes are functional, but they contain no business logic.

Their full implementation is deferred to later sprints.

---

### Settlement Receipts

Receipt attachments are currently supported through transactions and utility-generated transactions.

Dedicated settlement receipt attachments remain deferred.

---

### Bundle Size

The production JavaScript bundle exceeds Vite's default 500 kB warning threshold.

Future optimization should include:

* Route-level lazy loading
* Dynamic imports
* Vendor chunk separation
* Bundle analysis

---

## Deferred to Sprint 11

Sprint 11 should focus on local MVP stabilization and external alpha preparation.

Recommended scope:

* Complete attachment regression testing
* Add settlement receipt attachments
* Improve error messages and save feedback
* Review empty states and mobile layouts
* Add product feedback workflow
* Add sample-data controls
* Prepare private external deployment
* Add external tester guidance
* Perform complete end-to-end regression testing
* Resolve critical alpha feedback
* Prepare v0.11.0-alpha documentation

---

## Future SaaS Path

A true multi-user HFOS beta requires more than frontend hosting.

Future cloud work should include:

* User registration and authentication
* Household invitations
* Owner, admin, and member roles
* PostgreSQL persistence
* Row Level Security
* Private attachment storage
* Cloud repository implementations
* Multi-device synchronization
* Audit events
* Backups and restore testing
* Subscription billing

The single-household rule remains active within each future customer workspace.

---

## Sprint Result

Sprint 10 is complete.

HFOS now persists the core single-household finance workflow across browser refreshes.

The application now connects:

* Household setup
* Members
* Accounts
* Transactions
* Expense allocations
* Utility-generated expenses
* Settlements
* Settlement applications
* Supporting documents
* Itemized reimbursement balances
* Partial-payment visibility
* Application reset and recovery

The project has progressed from a development-oriented prototype to a durable local MVP foundation.

HFOS is ready to begin Sprint 11 stabilization and external alpha preparation.
