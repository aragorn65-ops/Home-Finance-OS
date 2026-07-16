# Sprint 8 — Settlements and Outstanding Balances

**Release:** v0.8.0-alpha
**Status:** Complete
**Completed:** July 14, 2026

---

## Sprint Goal

Build the settlement and reimbursement layer for shared household expenses.

Sprint 8 converts expense allocations into member obligations, outstanding balances, settlement payments, payment applications, and clear summaries showing who owes whom.

The sprint also improves grocery-expense presentation and removes unnecessary account and description requirements from expense recording.

---

## Delivered Features

### 1. Settlements Module

Implemented a complete feature-based Settlements module containing:

* Domain models
* Form contracts
* Repositories
* Validators
* Settlement orchestration service
* Settlement application service
* Allocation payment service
* Member balance service
* Allocation query service
* Application details service
* React hook
* Settlement toolbar
* Settlement form
* Settlement list
* Settlement details
* Delete confirmation
* Balance summary components
* Settlements page
* Application routing
* Sidebar navigation

Supported settlement operations:

* Create
* View
* Edit
* Delete

Settlements page:

```text
/app/settlements
```

---

### 2. Member Obligations

HFOS now derives reimbursement obligations from active expense allocations.

For every included allocation:

```text
Member Net Position = Amount Paid - Expense Share
```

The calculation distinguishes:

* The member who paid the original expense
* The member responsible for the allocation
* The amount already covered by active settlements
* The remaining outstanding amount

The payer’s own allocation does not create a self-debt.

---

### 3. Member Settlement Balances

Added settlement balance summaries for each active household member.

Each member summary includes:

* Amount to receive
* Amount to pay
* Net position
* Creditor status
* Debtor status
* Settled status

Positive net positions indicate that the member should receive money.

Negative net positions indicate that the member still owes money.

---

### 4. Who Owes Whom Summary

Added a consolidated household reimbursement view.

The summary identifies:

* Paying member
* Receiving member
* Total outstanding amount
* Direction of the obligation

Obligations are grouped by debtor and creditor instead of being duplicated across multiple settlement records.

This provides a direct answer to:

```text
Who currently owes whom?
```

---

### 5. Settlement Recording

Household reimbursements can now be recorded independently from income, expenses, and transfers.

Each settlement records:

* Household
* Paying member
* Receiving member
* Settlement amount
* Settlement date
* Optional source account
* Optional destination account
* Application method
* Optional reference number
* Optional notes
* Active status
* Created timestamp
* Updated timestamp

Settlements are not counted as household income or expenses.

---

### 6. Paying and Receiving Member Selection

The settlement form supports independent selection of:

* Paying Member
* Receiving Member

Either active household member can be selected immediately.

When the same member is selected in both fields, the opposite field is cleared because a settlement cannot be made to the same member.

HFOS does not yet have an authenticated active-member session, so both fields remain manually selectable.

---

### 7. Oldest-First Settlement Application

Added automatic oldest-first application.

The service applies settlement amounts to eligible allocations in this order:

1. Oldest transaction date
2. Oldest allocation creation date
3. Allocation identifier

The service continues applying payment until:

* The full settlement amount is used, or
* No eligible allocation remains

The final allocation may be partially paid.

Only allocations matching the selected debtor and creditor are eligible.

---

### 8. Manual Settlement Application

Added manual settlement allocation.

Users may:

* Select specific expense allocations
* Enter an applied amount for each allocation
* Apply the full outstanding amount
* Divide one settlement across multiple allocations

Validation ensures:

* Selected applications have positive amounts
* Unselected applications have zero applied amount
* Duplicate allocations are rejected
* Applied amounts do not exceed allocation outstanding balances
* The total manual application amount exactly equals the settlement amount

---

### 9. Partial Settlements

Settlements may cover only part of an outstanding obligation.

A partial settlement:

* Reduces the applicable allocation balance
* Leaves the remaining amount outstanding
* Updates member balance summaries
* Updates Who Owes Whom totals
* Produces a Partially Paid allocation status

Further settlements may be applied later.

---

### 10. Allocation Payment Status

Added derived allocation payment information.

Supported statuses:

* Unpaid
* Partially Paid
* Paid

Payment details include:

* Original allocated amount
* Total active settlement applications
* Remaining outstanding amount
* Derived payment status

Payment state is calculated from settlement applications without modifying the original allocation amount.

---

### 11. Settlement Application Persistence

Added a dedicated settlement application repository.

Supported operations:

* Create application
* Create multiple applications
* Find applications by settlement
* Find applications by expense allocation
* Calculate applied totals
* Replace settlement applications
* Delete settlement applications

Settlement applications remain separate from both transactions and settlements.

This allows payment history and allocation status to be reconstructed from source records.

---

### 12. Settlement Editing

Existing settlements can be edited safely.

Edit mode restores the settlement’s current application amounts before recalculating eligible outstanding balances.

This prevents the settlement from counting against itself during editing.

Editable fields include:

* Paying member
* Receiving member
* Amount
* Date
* Application method
* Manual application selections
* Manual applied amounts
* Source account
* Destination account
* Reference number
* Notes
* Active status

The existing settlement record is updated instead of creating a duplicate history entry.

---

### 13. Settlement Deletion

Deleting a settlement:

* Removes the settlement record
* Removes its applications
* Restores the affected allocation outstanding balances
* Updates member balance summaries
* Updates Who Owes Whom totals

If linked accounts were used, deletion also reverses the settlement’s account effects.

Unrelated settlements and allocations remain unchanged.

---

### 14. Optional Settlement Accounts

Source and destination settlement accounts are optional.

#### Accountless Settlement

When both account fields are blank:

* The settlement is recorded
* Applications are created
* Outstanding balances decrease
* No account balance is changed

#### Linked-Account Settlement

When accounts are selected:

* The paying member’s source account decreases
* The receiving member’s destination account increases
* Private account ownership rules are enforced

Settlement editing and deletion safely reverse previous balance effects before applying revised values.

---

### 15. Settlement Safety and Rollback

Settlement operations coordinate:

* Form validation
* Household-member validation
* Account validation
* Application construction
* Account balance effects
* Settlement persistence
* Application persistence

Rollback handling was added for failures involving:

* Settlement creation
* Settlement update
* Settlement deletion
* Application creation
* Application replacement
* Source account effects
* Destination account effects
* Account effect reversal

Currency calculations use cent-level precision.

---

### 16. Settlement History and Details

Added settlement history and itemized detail views.

Settlement history includes recorded reimbursements between household members.

Settlement details include:

* Paying member
* Receiving member
* Settlement amount
* Settlement date
* Application method
* Linked accounts
* Reference number
* Notes
* Applied expense allocations
* Applied amount per allocation
* Total applied amount

---

### 17. Accountless Expense Recording

Expense transactions no longer require a linked payment account.

An accountless expense:

* Can be created normally
* Remains included in household expense totals
* Can contain shared allocations
* Can generate settlement obligations
* Does not create an account balance operation

When an expense has a payment account, the existing account validation and balance behavior remain active.

Income still requires a destination account.

Transfers still require source and destination accounts.

---

### 18. Optional Expense Description and Notes

Expense descriptions and notes may now remain blank.

Required expense information still includes:

* Amount
* Category
* Transaction date
* Paying member
* Valid split method
* Valid participant configuration
* Valid allocation amounts

Income and transfer descriptions remain required under the current validation rules.

---

### 19. Grocery Transaction Summary

Updated the transaction details view for shared grocery expenses.

The view now focuses on:

* Total grocery amount
* Transaction date
* Transaction ID
* Participating members
* Member total share
* Shared amount
* Personal-item list
* Personal-items subtotal

For shared-personal expenses:

```text
Shared Amount = Member Total Share - Personal Items Subtotal
```

The previous general details view fields were removed from this summary, including:

* Account names
* Status
* Created timestamp
* Updated timestamp
* Notes

The Close and Edit Transaction actions remain available.

---

### 20. Toast Architecture Refactor

Separated Toast responsibilities into dedicated modules:

```text
shared/ui/Toast/Toast.ts
shared/ui/Toast/ToastContext.ts
shared/ui/Toast/ToastProvider.tsx
shared/ui/Toast/useToastContext.ts
```

This separates:

* Toast domain types
* React context definition
* Provider component
* Consumer hook

The refactor removes the React Fast Refresh warning caused by exporting a component and hook from the same module.

---

### 21. ESLint 10 Configuration

Added an ESLint flat configuration compatible with ESLint 10.

The configuration covers:

* JavaScript recommended rules
* TypeScript recommended rules
* React Hooks rules
* React Fast Refresh rules
* Browser globals
* Build and dependency exclusions

Also corrected:

* Empty interface declarations in Dialog components
* Startup effect dependency warnings
* Toast component export warnings

Lint now completes with zero errors and zero warnings.

---

## Architecture Delivered

Sprint 8 continued the feature-based architecture:

```text
features/
├── accounts/
├── dashboard/
├── household/
├── settlements/
└── transactions/
```

The Settlements feature uses:

* Domain models
* Form contracts
* Repository Pattern
* Service Layer
* Validation Layer
* OperationResult
* React hook state management
* Page and component separation
* Cent-level currency arithmetic
* Transaction-allocation integration
* Account-service integration

---

## Settlement Calculation Flow

```text
Expense Transaction
        |
        v
Expense Allocations
        |
        v
Member Obligations
        |
        v
Who Owes Whom
        |
        v
Settlement
        |
        v
Settlement Applications
        |
        v
Paid / Partially Paid / Unpaid Status
```

Settlements do not create duplicate expenses.

They only reduce obligations created by existing expense allocations.

---

## Key Files Added

### Settlement Models

```text
features/settlements/models/Settlement.ts
features/settlements/models/SettlementApplication.ts
features/settlements/models/SettlementForm.ts
features/settlements/models/SettlementApplicationForm.ts
features/settlements/models/AllocationPaymentDetails.ts
features/settlements/models/MemberSettlementBalance.ts
features/settlements/models/MemberSettlementObligation.ts
features/settlements/models/SettlementAllocationOption.ts
features/settlements/models/SettlementApplicationDetails.ts
```

### Settlement Repositories

```text
features/settlements/repositories/SettlementRepository.ts
features/settlements/repositories/SettlementApplicationRepository.ts
```

### Settlement Services

```text
features/settlements/services/AllocationPaymentService.ts
features/settlements/services/SettlementBalanceService.ts
features/settlements/services/SettlementApplicationService.ts
features/settlements/services/SettlementService.ts
features/settlements/services/SettlementAllocationService.ts
features/settlements/services/SettlementApplicationDetailsService.ts
```

### Settlement Validation and Hook

```text
features/settlements/validators/SettlementValidator.ts
features/settlements/hooks/useSettlements.ts
```

### Settlement Components

```text
features/settlements/components/SettlementToolbar.tsx
features/settlements/components/SettlementList.tsx
features/settlements/components/SettlementListItem.tsx
features/settlements/components/SettlementForm.tsx
features/settlements/components/SettlementDetails.tsx
features/settlements/components/SettlementDeleteConfirmation.tsx
features/settlements/components/WhoOwesWhomSummary.tsx
features/settlements/components/MemberBalanceSummary.tsx
```

### Settlement Page

```text
features/settlements/pages/SettlementsPage.tsx
```

### Shared UI and Tooling

```text
shared/ui/Toast/Toast.ts
shared/ui/Toast/ToastContext.ts
shared/ui/Toast/ToastProvider.tsx
shared/ui/Toast/useToastContext.ts
eslint.config.js
```

---

## Key Files Updated

```text
features/settlements/components/SettlementForm.tsx

features/transactions/components/TransactionDetails.tsx
features/transactions/services/TransactionService.ts
features/transactions/validators/TransactionValidator.ts

features/startup/pages/StartupPage.tsx

shared/ui/Dialog/DialogBody.tsx
shared/ui/Dialog/DialogFooter.tsx

app/router/AppRouter.tsx
```

---

## Verified Workflows

The following tests passed:

* Open the Settlements route
* Render settlement totals and summaries
* Select paying and receiving members independently
* Prevent a member from paying themselves
* Create oldest-first settlement
* Apply payment to the oldest eligible allocation
* Create a partial oldest-first settlement
* Create manual settlement
* Select specific allocations manually
* Require manual totals to equal the settlement amount
* Create settlements without accounts
* Confirm accountless settlements do not modify balances
* Create settlements with linked accounts
* Decrease the payer’s source account
* Increase the receiver’s destination account
* Edit an existing settlement
* Restore existing applications during editing
* Avoid duplicate settlement history records
* Update outstanding totals only by the settlement difference
* Delete an accountless settlement
* Restore affected allocation balances
* Delete a linked-account settlement
* Restore payer and receiver account balances
* Preserve unrelated settlement records
* Create an expense without a payment account
* Create an expense without a description
* Create an expense without notes
* Save shared allocations for accountless expenses
* View grocery total
* View member total shares
* View member shared amounts
* View personal items
* View personal-item subtotals
* Close transaction summary
* Edit transaction from summary
* Run ESLint with zero errors and zero warnings
* Run the production TypeScript and Vite build

---

## Build Verification

Commands:

```powershell
npm run lint
npm run build
```

Results:

```text
ESLint: PASS
ESLint Errors: 0
ESLint Warnings: 0

TypeScript Build: PASS
Vite Production Build: PASS
Build Errors: 0
```

Vite reported a non-blocking warning that the main JavaScript chunk exceeds 500 kB after minification.

---

## Known Limitations

### In-Memory Repositories

Account, transaction, expense-allocation, settlement, and settlement-application repositories currently use development-oriented in-memory storage.

Records may reset after browser refresh or application restart.

Durable database or API persistence remains future work.

---

### Authentication Context

HFOS does not yet have:

* Login
* Authenticated member context
* Active-member session switching
* Role-based application access

Paying and receiving members therefore remain manually selectable.

A future authentication sprint should default the paying member to the currently logged-in household member.

---

### Settlement Simplification

HFOS currently calculates direct debtor-to-creditor obligations from expense allocations.

Advanced debt simplification across several household members is not yet included.

Future versions may reduce circular or multi-member obligations into fewer net payments.

---

### Reporting

Settlement information is not yet integrated into:

* Dashboard reporting
* Monthly household statements
* Settlement aging reports
* Export workflows
* Payment reminders

---

### Build Size

The primary production JavaScript chunk exceeds Vite’s default 500 kB warning threshold.

Future optimization should add:

* Route-level lazy loading
* Feature-level dynamic imports
* Vendor chunk separation
* Bundle analysis

---

## Deferred to Sprint 9

Sprint 9 should focus on the Utility Allocation Engine.

Planned scope:

* Electricity meter readings
* Water meter readings
* Previous-reading carryover
* Configurable utility rates
* Shared fixed charges
* Manual adjustments
* Member opt-outs
* Air-conditioner usage calculations
* Shared remainder distribution
* Utility calculation previews
* Utility-specific allocation details
* Generation of utility expense allocations
* Compatibility with the Sprint 8 settlement engine

---

## Sprint Result

Sprint 8 is complete.

HFOS now connects:

* Expense transactions
* Expense allocations
* Household members
* Member obligations
* Outstanding balances
* Partial payments
* Settlement applications
* Payment statuses
* Optional account transfers
* Settlement history
* Grocery personal-item summaries

The project now has a working reimbursement engine capable of determining who owes whom, recording payments, applying settlements to specific expense allocations, and tracking remaining household obligations.

HFOS is ready to begin detailed utility allocation workflows in Sprint 9.
