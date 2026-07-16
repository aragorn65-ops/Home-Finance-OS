# Home Finance OS v0.7.0-alpha

**Release date:** July 14, 2026
**Release stage:** Alpha
**Sprint:** Sprint 7 — Transactions and Shared Expenses

---

## Overview

Home Finance OS v0.7.0-alpha introduces the first complete Transactions workflow.

Users can now record income, expenses, and transfers while automatically updating account balances. The release also adds household-member management, shared-expense allocation, liability-aware credit-card handling, and private-account protection.

This release establishes the financial transaction foundation required for future settlement, utility-allocation, and reporting features.

---

## Highlights

### Transactions

Users can now:

* Create income transactions
* Create expense transactions
* Transfer funds between accounts
* View transaction details
* Edit existing transactions
* Delete transactions
* Track monthly income
* Track monthly expenses
* Calculate monthly net cash flow

Account balances are updated automatically when transactions are created, edited, or deleted.

---

### Liability-Aware Accounting

HFOS now distinguishes between asset and liability accounts.

Supported liability workflows include:

* Credit-card purchases that increase the amount owed
* Credit-card bill payments that reduce both the payment account and the credit-card balance
* Transfers to liability accounts without counting the payment as a second expense
* Liability balance validation to prevent invalid negative balances

This avoids double-counting credit-card expenses and payments.

---

### Shared Expenses

Expenses can now be assigned using:

* Individual expense
* Equal split
* Exact amounts
* Utility-precalculated allocations

Users can:

* Select the member who paid
* Include or exclude household members
* Opt individual members out
* Enter exact member shares
* Preview equal allocations
* Store allocation notes

Equal splits use cent-level rounding so the combined member allocations always match the total expense.

Exact allocations are rejected when they do not equal the expense total.

---

### Household Members

A new Household Members page is available at:

```text
/app/household-members
```

Users can now:

* Add household members
* Edit member names
* Assign member or admin roles
* Select identification colors
* Activate members
* Deactivate non-owner members
* Use active members in expense allocation workflows

The primary household owner cannot be deactivated or stripped of the owner role.

---

### Transaction Privacy

Transactions now support three visibility levels:

* Household
* Participants Only
* Private

Private-account access is enforced in the service layer.

Only the account owner may use a private account in a transaction.

When a shared expense is paid through a private account:

* The transaction defaults to Participants Only
* Participants can see the shared expense
* Private account ownership and balance remain protected

Individual transactions involving private accounts default to Private.

---

### Transaction Safety

Transaction operations now include rollback protection.

HFOS attempts to restore the previous state when a failure occurs during:

* Account balance updates
* Transaction persistence
* Expense-allocation creation
* Expense-allocation replacement
* Transaction deletion

This reduces the risk of transactions, balances, and allocations becoming inconsistent.

---

## Account Improvements

The account model now supports:

* Asset accounts
* Liability accounts
* Household accounts
* Private accounts
* Account ownership by household member
* Credit cards
* Lines of credit
* Loans
* Mortgages
* Other liabilities

Credit-card accounts can include:

* Credit limit
* Statement balance
* Minimum payment
* Payment due date

Account summaries now support:

* Total assets
* Total liabilities
* Net worth

---

## Navigation

The application sidebar now includes:

### Household

* Household Members

### Finances

* Accounts
* Transactions
* Settlements
* Savings
* Reports

The Settlements, Savings, and Reports entries remain planned modules and may not yet have complete pages.

---

## Verified Workflows

The following workflows were tested successfully:

* Income deposited into an asset account
* Expense paid from an asset account
* Expense charged to a credit card
* Credit-card payment recorded as a transfer
* Transfer between asset accounts
* Equal expense split between two members
* Exact member allocations
* Rejection of invalid exact-allocation totals
* Member opt-out behavior
* Editing an equal split while preserving the Equal method
* Private account hidden from non-owner members
* Private account rejected when used by a non-owner
* Shared expense paid using a private credit card
* Participant-only visibility for private shared expenses
* Transaction deletion restoring the previous account balance
* Expense-allocation deletion with the transaction

---

## Build Verification

The production build completed successfully using:

```powershell
npm run build
```

Verification result:

```text
TypeScript Build: PASS
Vite Production Build: PASS
Build Errors: 0
```

---

## Known Limitations

### In-Memory Transaction Storage

Accounts and transactions currently use demo in-memory repositories.

Data may reset when the browser refreshes or the application restarts.

Household setup and household members use local storage and remain available across refreshes.

Persistent database or API-backed repositories are planned for a future release.

---

### Current User Context

HFOS does not yet include full authentication or member login switching.

Member-scoped transaction methods now exist in the service layer, but the application does not yet provide a complete logged-in-user context for every screen.

---

### Settlements

Shared-expense allocations are stored, but reimbursement and settlement processing are not included in this release.

The following remain planned:

* Who-owes-whom calculations
* Member outstanding balances
* Partial payments
* Settlement applications
* Oldest-first settlement allocation
* Manual settlement allocation
* Paid, partially paid, and unpaid statuses

---

### Utilities

The initial utility-related domain models exist, but full utility calculation screens and services are not included.

Planned utility workflows include:

* Electricity submeters
* Water submeters
* Previous-reading carryover
* Manual rates
* Manual adjustments
* Air-conditioner usage calculations
* Shared remainder distribution
* Member opt-outs

---

## Planned Next Release

The recommended focus for Sprint 8 is:

# Settlements and Outstanding Balances

Planned work includes:

* Calculate member obligations from expense allocations
* Determine who owes whom
* Record member settlements
* Support partial settlements
* Apply payments to expenses
* Calculate paid and unpaid allocation amounts
* Display outstanding balances by member
* Prevent settlements from being counted as expenses
* Add settlement history and itemized details

---

## Release Summary

Home Finance OS v0.7.0-alpha delivers the core transaction and shared-expense foundation.

The system can now connect household members, financial accounts, transactions, credit-card liabilities, privacy rules, and member allocations through a coordinated service architecture.

This release prepares HFOS for settlement tracking, utility allocation, and household financial reporting in upcoming sprints.
