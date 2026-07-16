# Home Finance OS v0.8.0-alpha

## Settlements and Outstanding Balances

**Release Date:** July 14, 2026
**Status:** Alpha Release
**Sprint:** Sprint 8

---

## Overview

Home Finance OS v0.8.0-alpha introduces the settlement and reimbursement layer for shared household expenses.

Expense allocations created in previous sprints can now be converted into clear member obligations, outstanding balances, and settlement records.

The application can determine who owes whom, apply full or partial payments to expense allocations, update allocation payment status, and optionally reflect settlement movements in linked household or personal accounts.

This release also improves grocery-expense summaries and allows expenses to be recorded without forcing an account, description, or notes.

---

## Key Features

### Member Balances

The Settlements page now calculates each household member’s position using active expense allocations.

Each member summary includes:

* Amount to receive
* Amount to pay
* Net settlement position
* Creditor or debtor status

The calculations are derived from saved allocations rather than duplicated settlement expenses.

---

### Who Owes Whom

HFOS now consolidates shared-expense obligations into a direct household reimbursement summary.

The summary identifies:

* Paying member
* Receiving member
* Outstanding reimbursement amount
* Eligible expense allocations behind the balance

A member’s own allocation does not create a self-debt.

---

### Settlement Recording

Household members can record reimbursements separately from income and expense transactions.

A settlement contains:

* Paying member
* Receiving member
* Settlement amount
* Settlement date
* Application method
* Optional source account
* Optional destination account
* Optional payment reference
* Optional notes
* Active status

Settlements do not increase household income or household expenses.

---

### Oldest-First Applications

The oldest-first method automatically applies a settlement to the oldest eligible expense allocations.

Application order uses:

1. Transaction date
2. Allocation creation date
3. Allocation identifier

The process continues until the full settlement amount has been applied.

Partial application of the final eligible allocation is supported.

---

### Manual Applications

Manual settlement application allows the user to select specific outstanding allocations.

The user may:

* Select one or more allocations
* Enter a payment amount for each allocation
* Apply the full outstanding amount
* Divide one settlement across multiple expenses

The total manual application amount must exactly equal the settlement amount.

---

### Allocation Payment Status

HFOS now derives allocation payment status from active settlement applications.

Supported statuses are:

* Unpaid
* Partially Paid
* Paid

Payment status is calculated without modifying the original allocation amount.

---

### Settlement Editing

Existing settlements can be edited without double-counting their current applications.

Edit mode restores the settlement’s existing applied amounts before rebuilding the revised applications.

Editing supports changes to:

* Members
* Amount
* Date
* Application method
* Manual application amounts
* Linked accounts
* Reference and notes
* Active status

---

### Settlement Deletion

Deleting a settlement removes its applications and restores the affected allocation balances.

When linked accounts were used, deleting the settlement also reverses the original account balance movements.

---

### Optional Account Linking

Settlement account fields are optional.

When no accounts are selected:

* The settlement is recorded normally
* Allocation balances are updated
* No account balances are modified

When accounts are selected:

* The paying member’s source account is reduced
* The receiving member’s destination account is increased
* Deleting or editing the settlement safely reverses the previous account effects

Private account ownership rules remain enforced.

---

## Transaction Improvements

### Accountless Expenses

Expenses can now be recorded without selecting a payment account.

An accountless expense:

* Remains part of household expense reporting
* Can still contain member allocations
* Can still create settlement obligations
* Does not modify any account balance

Income and transfer transactions retain their existing account requirements.

---

### Optional Expense Description and Notes

Expense descriptions and notes may now remain blank.

The following expense fields remain required where applicable:

* Amount
* Category
* Transaction date
* Paying member
* Valid split configuration
* Valid allocation totals

---

### Grocery Expense Summary

The transaction details view now presents a focused grocery-allocation summary.

The view includes:

* Total grocery amount
* Transaction date
* Transaction ID
* Each participating member
* Member total share
* Shared amount
* Personal-item list
* Personal-items subtotal

For shared-personal grocery expenses:

```text
Shared Amount = Member Total Share - Personal Items Subtotal

Technical Improvements
Settlement Architecture

The settlement feature follows the existing HFOS layered architecture.

The module includes:

Domain models
Form contracts
Repository layer
Validation layer
Application services
Balance calculation services
React hook
Page and UI components
Routing integration
Settlement Safety

Settlement operations include validation and rollback handling for:

Application creation
Application replacement
Account balance updates
Account balance reversal
Settlement deletion
Failed persistence operations

Currency calculations use cent-level precision where required.

ESLint Configuration

An ESLint 10 flat configuration was added.

The configuration now validates:

TypeScript
React hooks
React Fast Refresh compatibility
Browser globals
Shared UI components

Lint verification completes with zero errors and zero warnings.

Toast Refactor

Toast responsibilities were separated into dedicated modules:

Toast.ts
ToastContext.ts
ToastProvider.tsx
useToastContext.ts

This removes the React Fast Refresh warning caused by exporting a component and hook from the same module.

Validation and Testing

The following workflows were manually verified:

Settlements route and page rendering
Paying and receiving member selection
Oldest-first settlement creation
Manual settlement application
Exact manual application totals
Partial settlements
Settlement editing
Settlement application restoration during editing
Settlement deletion
Outstanding-balance restoration
Accountless settlements
Linked-account settlements
Linked-account reversal during deletion
Accountless expense creation
Blank expense descriptions and notes
Grocery member-summary calculations
Personal-item display and subtotals
Transaction View, Close, and Edit actions
ESLint validation
TypeScript production compilation
Vite production build
Known Limitations
Authentication and Active Member Session

HFOS does not yet include a login or active-member session.

The paying and receiving members remain manually selectable.

A later authentication sprint should default the paying member to the currently logged-in household member.

Persistence

The current repositories remain development-oriented and in-memory where previously implemented.

Settlement and transaction data may reset after an application refresh until durable database persistence is introduced.

Reporting

Settlement information is not yet integrated into a dedicated reporting or export module.

Future reports may include:

Settlement aging
Member payment history
Outstanding balance reports
Monthly reimbursement activity
Exportable household statements
Build Size

The production build completes successfully, but Vite reports that the primary JavaScript chunk exceeds 500 kB after minification.

Future optimization should introduce route-level or feature-level code splitting.

Planned Next Release

The recommended focus for Sprint 9 is:

Utility Allocation Engine

Planned work includes:

Electricity submeter calculations
Water submeter calculations
Previous meter-reading carryover
Configurable utility rates
Shared fixed charges
Member opt-outs
Manual adjustments
Air-conditioner usage calculations
Shared remainder distribution
Utility calculation previews
Utility-specific allocation details
Settlement compatibility for generated utility allocations
Release Summary

Home Finance OS v0.8.0-alpha delivers the settlement and reimbursement foundation required for shared household finance management.

HFOS can now turn expense allocations into member obligations, record reimbursements, apply payments to specific expenses, track remaining balances, and optionally connect settlements to financial accounts.

The release also improves grocery expense visibility and removes unnecessary account and description requirements from expense recording.

This prepares HFOS for detailed utility allocation, member authentication, persistent storage, and household financial reporting in future sprints.
