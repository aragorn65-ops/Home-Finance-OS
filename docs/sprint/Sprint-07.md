# Sprint 7 — Transactions and Shared Expenses

**Release:** v0.7.0-alpha
**Status:** Complete
**Completed:** July 14, 2026

---

## Sprint Goal

Build the core Transactions module and connect financial activity to household members, accounts, balances, shared-expense allocations, and privacy rules.

Sprint 7 establishes the transaction foundation required for settlements, utilities, and household financial reporting.

---

## Delivered Features

### 1. Transactions Module

Implemented a complete feature-based Transactions module containing:

* Domain models
* Form models
* Validators
* In-memory repositories
* Service-layer business logic
* React hooks
* Transaction form
* Transaction list
* Transaction details
* Delete confirmation
* Transactions page
* Application routing
* Sidebar navigation

Supported transaction types:

* Income
* Expense
* Transfer

Supported operations:

* Create
* View
* Edit
* Delete

---

### 2. Account Balance Integration

Transactions now update account balances automatically.

#### Income

Income debits an asset account and increases its balance.

#### Expense from an Asset

An expense credits the payment account and decreases its balance.

#### Credit-Card Expense

An expense charged to a liability account increases the amount owed.

#### Transfer

A transfer credits the source account and debits the destination account.

This supports:

* Asset-to-asset transfers
* Asset-to-liability payments
* Credit-card bill payments
* Liability balance reduction

Credit-card payments are treated as transfers and are not counted as another expense.

---

### 3. Liability-Aware Accounts

The Account domain was expanded to distinguish:

* Asset accounts
* Liability accounts

Supported asset types include:

* Checking
* Savings
* Cash
* E-wallet
* Investment
* Other asset

Supported liability types include:

* Credit card
* Line of credit
* Loan
* Mortgage
* Other liability

Liability metadata includes:

* Credit limit
* Statement balance
* Minimum payment
* Payment due date

Account summaries now support:

* Total assets
* Total liabilities
* Net worth

---

### 4. Household-Member Management

Implemented household-member management with:

* Member domain model
* Member form model
* Member validation
* Member service
* Member management component
* Member page
* Route and sidebar navigation

Supported member roles:

* Owner
* Admin
* Member

Supported operations:

* Add member
* Edit member
* Activate member
* Deactivate non-owner member
* Assign identification color

Business rules include:

* Only one active owner
* The owner role cannot be removed
* The owner cannot be deactivated
* Duplicate member names are rejected
* Only active members may participate in new expenses

Household Members page:

```text
/app/household-members
```

---

### 5. Shared Expenses

Expenses now support member-level allocation.

Supported split methods:

* Individual
* Equal
* Exact
* Utility-precalculated

Each expense may record:

* Member who paid
* Included members
* Opted-out members
* Allocated amount per member
* Allocation notes
* Transaction visibility

Equal allocations use cent-level rounding.

Any rounding remainder is assigned to the final included member so the combined shares match the expense total.

Exact allocations must equal the full expense amount before the transaction can be saved.

---

### 6. Expense Allocation Persistence

Added a dedicated allocation repository and service.

Supported operations:

* Create allocations for a transaction
* Retrieve allocations by transaction
* Retrieve allocations by member
* Replace allocations when an expense is edited
* Delete allocations when a transaction is removed

Allocations remain separate from the main transaction record to support future settlement applications.

---

### 7. Transaction Metadata

Transactions now store:

* `createdByMemberId`
* `paidByMemberId`
* `expenseSplitMethod`
* `visibility`

This separates:

* The member who recorded the transaction
* The member who paid the expense

The original expense split method is preserved during editing.

An equal expense therefore reopens as Equal instead of being converted to Exact.

---

### 8. Privacy Rules

Supported visibility levels:

* Household
* Participants Only
* Private

Account visibility supports:

* Household
* Private

Private accounts include an owner member.

Service-layer rules now ensure:

* Only the account owner may use a private account
* Private accounts are not available to other members
* Direct invalid service calls are rejected
* Individual transactions involving private accounts default to Private
* Shared expenses involving private accounts default to Participants Only
* Participating members may see the shared obligation
* Private account balance and ownership details remain protected

Member-scoped transaction query methods were also added.

---

### 9. Transaction Safety and Rollback

Transaction operations coordinate:

* Validation
* Account balance effects
* Transaction persistence
* Expense-allocation persistence

Rollback protection was added for failures involving:

* Account updates
* Transaction creation
* Transaction editing
* Allocation creation
* Allocation replacement
* Transaction deletion

When possible, HFOS restores the previous transaction, account balances, and allocations after a failed operation.

---

### 10. Dashboard Integration

The Transactions service now provides:

* Monthly income
* Monthly expenses
* Monthly net cash flow
* Recent transactions

Transfers are excluded from income and expense totals because they move value between accounts rather than creating new income or spending.

---

## Architecture Delivered

Sprint 7 continued the feature-based structure:

```text
features/
├── accounts/
├── dashboard/
├── household/
├── settlements/
└── transactions/
```

The Transactions feature uses:

* Domain models
* Form contracts
* Repository Pattern
* Service Layer
* Validation Layer
* OperationResult
* React hook state management
* Page and component separation

Household-member persistence currently uses local storage.

Account, transaction, and allocation repositories currently use in-memory demo storage.

---

## Key Files Added

### Transactions

```text
features/transactions/models/Transaction.ts
features/transactions/models/TransactionForm.ts
features/transactions/models/ExpenseAllocation.ts
features/transactions/models/ExpenseAllocationForm.ts
features/transactions/models/UtilityMeter.ts
features/transactions/models/UtilityAllocationDetails.ts

features/transactions/repositories/TransactionRepository.ts
features/transactions/repositories/ExpenseAllocationRepository.ts

features/transactions/services/TransactionService.ts
features/transactions/services/ExpenseAllocationService.ts

features/transactions/validators/TransactionValidator.ts

features/transactions/hooks/useTransactions.ts

features/transactions/components/TransactionToolbar.tsx
features/transactions/components/TransactionList.tsx
features/transactions/components/TransactionListItem.tsx
features/transactions/components/TransactionForm.tsx
features/transactions/components/TransactionDetails.tsx
features/transactions/components/TransactionDeleteConfirmation.tsx

features/transactions/pages/TransactionsPage.tsx
```

### Household Members

```text
features/household/models/HouseholdMember.ts
features/household/models/HouseholdMemberForm.ts

features/household/services/HouseholdMemberService.ts

features/household/validators/HouseholdMemberValidator.ts

features/household/components/HouseholdMemberForm.tsx
features/household/components/HouseholdMemberManager.tsx

features/household/pages/HouseholdMembersPage.tsx
```

### Settlement Foundation

```text
features/settlements/models/Settlement.ts
features/settlements/models/SettlementApplication.ts
```

---

## Verified Workflows

The following tests passed:

* Create income transaction
* Deposit income into an asset account
* Create expense from an asset account
* Create expense using a credit card
* Increase credit-card liability after a purchase
* Pay a credit-card bill through a transfer
* Reduce both asset and credit-card liability balances
* Avoid counting credit-card payment as a second expense
* Transfer funds between asset accounts
* Create equal shared expense
* Create exact shared expense
* Reject exact allocations that do not match the expense total
* Opt a member out of an expense
* Preserve equal split when editing
* Preserve payer when editing
* Preserve participant allocations when editing
* Restrict private accounts to their owners
* Hide private accounts after changing the payer
* Reject non-owner use of a private account
* Default private shared expense to Participants Only
* Delete a transaction
* Remove its associated allocations
* Restore the affected account balance

---

## Build Verification

Command:

```powershell
npm run build
```

Result:

```text
TypeScript Build: PASS
Vite Production Build: PASS
Build Errors: 0
```

---

## Known Limitations

### In-Memory Repositories

Accounts, transactions, and expense allocations currently use in-memory repositories.

These records may reset after a browser refresh or application restart.

Persistent database or API storage remains future work.

### Authentication Context

HFOS does not yet have full authentication or active-member session switching.

Member-scoped privacy methods exist in the service layer, but all application screens do not yet operate under an authenticated member context.

### Settlements

Expense allocations are recorded, but reimbursement processing is not included in Sprint 7.

Outstanding balances, partial settlements, and settlement applications are deferred to Sprint 8.

### Utility Calculations

Utility domain models exist, but full electricity, water, submeter, appliance usage, and remainder-allocation services are deferred.

---

## Deferred to Sprint 8

Sprint 8 should focus on Settlements and Outstanding Balances.

Planned scope:

* Calculate each member’s expense obligations
* Determine who owes whom
* Calculate member net positions
* Record settlement payments
* Support partial settlements
* Apply settlement amounts to expense allocations
* Support oldest-first application
* Support manual application
* Derive paid, partially paid, and unpaid statuses
* Carry previous unpaid balances forward
* Display itemized outstanding expenses
* Display member settlement summaries
* Ensure settlements are not counted as expenses

---

## Sprint Result

Sprint 7 is complete.

HFOS now has a working transaction engine connecting:

* Households
* Household members
* Asset accounts
* Liability accounts
* Income
* Expenses
* Transfers
* Shared allocations
* Credit-card activity
* Privacy controls
* Dashboard cash flow

The project is ready to begin Sprint 8.
