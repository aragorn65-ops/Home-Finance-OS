# Home Finance OS v0.9.0-alpha

## Utility Bill Allocation

**Release Date:** July 15, 2026
**Status:** Alpha Release
**Sprint:** Sprint 9

---

## Overview

Home Finance OS v0.9.0-alpha introduces utility bill allocation for the single active household.

Electricity and water bills can now be divided using member submeter readings, personal appliance usage, fixed compensation, and an equally shared remaining balance.

Calculated utility shares are saved as exact-split expense transactions. These allocations automatically flow into Transactions and Settlements.

This release also aligns demo accounts with the active household and prevents household-dependent pages from opening before setup is complete.

---

## Key Features

### Utility Bill Entry

The Utilities page accepts:

* Utility type
* Billing date
* Total provider bill
* Rate per unit
* Paying member
* Optional payment account
* Transaction date
* Visibility
* Description
* Notes

Supported utilities:

* Electricity using kWh
* Water using m3

---

### Member Submeter Usage

Member submeter consumption is calculated as:

```text
Submeter Consumption = Current Reading - Previous Reading
Submeter Charge = Submeter Consumption x Rate per Unit

cd D:\HFOS\Home-Finance-OS

@'
# Sprint 9 - Utility Bill Allocation

**Release:** v0.9.0-alpha
**Status:** Complete
**Completed:** July 15, 2026

---

## Sprint Goal

Build a utility bill allocation engine for the single active household.

Sprint 9 converts electricity and water provider bills into exact household-member expense allocations using:

* Submeter readings
* Personal appliance usage
* Fixed compensation
* Equal sharing of the remaining bill

The resulting member shares are saved as expense allocations and automatically flow into Transactions and Settlements.

---

## Delivered Features

### 1. Utilities Module

Implemented a feature-based Utilities module containing:

* Utility bill form model
* Utility calculation result model
* Utility bill validator
* Utility allocation calculator
* Utility transaction persistence service
* Utility bill entry form
* Utility calculation preview
* Utilities page
* Application routing
* Sidebar navigation

Utilities page:

```text
/app/utilities
```

---

### 2. Supported Utilities

The utility form supports:

* Electricity using kWh
* Water using m3

Validation ensures that the selected unit matches the utility type.

---

### 3. Provider Bill Inputs

The utility workflow begins with information from the provider bill.

Required inputs include:

* Utility type
* Billing date
* Total bill amount
* Rate per unit
* Transaction date
* Paying household member

Optional inputs include:

* Payment account
* Description
* Notes

The form also supports transaction visibility and active status.

---

### 4. Member Utility Participation

Every active household member is included in the utility allocation form.

For each member, HFOS supports:

* Optional saved submeter identifier
* Previous meter reading
* Current meter reading
* Meter reset or replacement status
* Meter reset reason
* Actual reset-period usage
* Fixed compensation
* Shared-remainder participation

A member may participate as:

* Direct usage plus shared remainder
* Shared remainder only
* Direct usage only

---

### 5. Submeter Consumption

Normal submeter consumption is calculated as:

```text
Submeter Consumption =
Current Reading - Previous Reading
```

The corresponding direct charge is:

```text
Submeter Charge =
Submeter Consumption x Rate per Unit
```

Members without a submeter may leave both readings at zero.

---

### 6. Meter Reset or Replacement

HFOS supports meters that were reset or replaced during the billing period.

When this option is enabled, the user provides:

* Reset or replacement reason
* Actual billing-period usage

The calculation then uses:

```text
Submeter Consumption =
Reset Usage Quantity
```

This replaces the normal meter-reading subtraction for that bill.

---

### 7. Personal Appliance Usage

Electricity bills may include appliance usage assigned directly to a member.

Each appliance record contains:

* Household member
* Appliance name
* Power rating in kilowatts
* Total usage hours
* Optional notes

Appliance consumption is calculated as:

```text
Appliance Consumption =
Power Rating in kW x Usage Hours
```

The direct appliance charge is:

```text
Appliance Charge =
Appliance Consumption x Rate per kWh
```

Appliance entries are not supported for water bills.

---

### 8. Simplified Appliance Input

An earlier version of the appliance model included a usage-factor field.

That field was removed because ordinary household users are unlikely to know an accurate appliance duty cycle.

The final workflow requires only:

* Appliance power rating
* Total usage hours

This keeps the calculation understandable and avoids unreliable user estimates.

---

### 9. Fixed Compensation

A fixed compensation amount may be assigned directly to a member.

This supports usage or charges that cannot be represented accurately using:

* Submeter readings
* Appliance power
* Appliance usage hours

Fixed compensation is included directly in the member's utility amount.

---

### 10. Direct Member Usage

Each member's direct utility amount is calculated as:

```text
Direct Usage Amount =
Submeter Charge
+ Appliance Charge
+ Fixed Compensation
```

The total direct usage is:

```text
Total Direct Usage =
Sum of All Member Direct Usage Amounts
```

Validation prevents the total direct usage from exceeding the provider bill.

---

### 11. Shared Remaining Bill

After all direct member amounts are calculated, HFOS determines the remaining provider amount.

```text
Shared Remainder =
Total Provider Bill - Total Direct Usage
```

The shared remainder is divided equally among members selected to participate.

```text
Equal Shared Amount =
Shared Remainder / Participating Member Count
```

At least one member must participate when a shared remainder exists.

---

### 12. Final Member Shares

Each member's final allocation is calculated as:

```text
Final Member Share =
Direct Usage Amount + Equal Shared Amount
```

A member who does not participate in the shared remainder receives only their direct usage amount.

A member with no direct usage may still receive an equal shared amount.

---

### 13. Exact Currency Balancing

Utility allocation uses integer-cent arithmetic.

The calculator:

1. Converts currency totals into cents.
2. Calculates member direct-charge components.
3. Allocates rounded direct charges while preserving their required total.
4. Calculates the shared remainder.
5. Divides the remainder using equal member weights.
6. Distributes unavoidable remainder cents deterministically.
7. Confirms that all member shares equal the provider bill.

The required result is:

```text
Total Member Shares = Total Provider Bill
```

The final difference must be:

```text
0.00
```

---

### 14. Utility Calculation Preview

Before saving, the Utilities page displays:

* Utility type
* Total provider bill
* Rate per unit
* Total submeter consumption
* Total appliance consumption
* Total submeter charges
* Total appliance charges
* Total fixed compensation
* Total direct usage
* Shared remainder
* Shared-participant count
* Average shared amount
* Member direct amount
* Member equal shared amount
* Member final share
* Total member shares
* Validation difference
* Balanced status

This allows the user to review the allocation before persistence.

---

### 15. Utility Form Validation

Validation covers:

* Positive total bill amount
* Positive rate per unit
* Valid billing date
* Valid transaction date
* Correct unit for the utility type
* At least one household member
* Unique member entries
* Unique saved meter identifiers
* Non-negative meter readings
* Current reading not lower than the previous reading without a reset
* Meter reset reason
* Valid reset-period usage
* Non-negative fixed compensation
* At least one shared-remainder participant
* Electricity-only appliance entries
* Valid appliance member
* Valid appliance name
* Positive appliance power
* Positive appliance usage hours
* Direct charges not exceeding the provider bill
* Valid paying member
* Paying member included in the bill
* Valid transaction visibility

---

### 16. Utility Expense Persistence

The utility persistence service converts a completed calculation into a standard expense transaction.

The generated transaction uses:

```text
Transaction Type: Expense
Split Method: Exact
```

The transaction amount equals the complete provider bill.

One exact expense allocation is created for every included member.

Each allocation amount equals that member's final calculated utility share.

---

### 17. Utility Calculation Notes

The persistence service records calculation details in transaction and allocation notes.

Stored details include:

* Utility type
* Billing date
* Rate per unit
* Total direct usage
* Shared remainder
* Submeter consumption
* Submeter charge
* Appliance consumption
* Appliance charge
* Fixed compensation
* Equal shared amount
* Final member share

This preserves the calculation reasoning without introducing a separate utility repository.

---

### 18. Transaction Integration

Utility persistence delegates transaction creation to the existing TransactionService.

Existing transaction behavior remains responsible for:

* Transaction validation
* Account validation
* Account balance effects
* Expense-allocation creation
* Rollback after failed operations

Utility expenses therefore behave consistently with other HFOS expenses.

---

### 19. Settlement Integration

Saved utility allocations automatically participate in the existing settlement engine.

When one member pays the provider bill:

* The expense transaction records the payer
* Exact allocations record every member's utility share
* Non-payer allocations create reimbursement obligations
* Outstanding amounts appear in Settlements
* Who Owes Whom totals are updated
* Full and partial settlement payments remain supported

No separate utility settlement engine was introduced.

---

### 20. Optional Payment Account

The payment account remains optional.

#### Accountless Utility Expense

When no account is selected:

* The utility expense is created
* Member allocations are created
* Settlement obligations are created
* No account balance is modified

#### Linked Utility Expense

When an account is selected:

* The expense is linked to the selected account
* The normal expense balance effect is applied
* Existing account validation remains active
* Existing rollback protection remains active

---

### 21. Single-Household Account Initialization

Demo accounts previously used a hardcoded household identifier:

```text
household-001
```

The household setup workflow generated a different identifier, causing utility expense account validation to fail.

Demo accounts now initialize using:

* The active household identifier
* The active household owner identifier

This resolves the account ownership mismatch without introducing multi-household behavior.

---

### 22. Single-Household Architecture

HFOS remains a strictly single-household application.

The implementation does not include:

* Household selection
* Cross-household account filtering
* Multi-household migration
* Household switching
* Concurrent household contexts

All members, accounts, transactions, utilities, and settlements belong to one active household.

A future New Household workflow may explicitly replace or reset the current household data.

---

### 23. Household Setup Guard

The application shell now requires an existing household.

When no household exists, application routes redirect to:

```text
/household
```

This prevents household-dependent pages from rendering before setup.

Protected application areas include:

* Dashboard
* Members
* Accounts
* Transactions
* Settlements
* Utilities

---

### 24. Utilities Navigation

Utilities was added to the Finances section of the sidebar.

Navigation path:

```text
/app/utilities
```

The route was also registered in the main application router.

---

## Architecture Delivered

Sprint 9 continued the HFOS feature-based architecture:

```text
features/
|-- accounts/
|-- dashboard/
|-- household/
|-- settlements/
|-- transactions/
`-- utilities/
```

The Utilities feature uses:

* Form models
* Calculation result models
* Validation layer
* Calculation service
* Persistence service
* OperationResult
* Page and component separation
* Transaction-service integration
* Expense-allocation integration
* Settlement integration
* Cent-level currency arithmetic

---

## Utility Calculation Flow

```text
Provider Utility Bill
        |
        v
Member Submeter Usage
        |
        +------------------+
        |                  |
        v                  v
Appliance Usage     Fixed Compensation
        |                  |
        +--------+---------+
                 |
                 v
        Member Direct Usage
                 |
                 v
         Total Direct Usage
                 |
                 v
Provider Bill - Direct Usage
                 |
                 v
         Shared Remainder
                 |
                 v
       Equal Member Sharing
                 |
                 v
        Final Member Shares
                 |
                 v
      Exact Expense Allocations
                 |
                 v
        Settlement Obligations
```

---

## Key Files Added

### Utility Models

```text
features/utilities/models/UtilityBillForm.ts
features/utilities/models/UtilityBillShareResult.ts
```

### Utility Validation

```text
features/utilities/validators/UtilityBillValidator.ts
```

### Utility Services

```text
features/utilities/services/UtilityBillShareCalculator.ts
features/utilities/services/UtilityBillPersistenceService.ts
```

### Utility Components

```text
features/utilities/components/UtilityBillForm.tsx
features/utilities/components/UtilityBillSharePreview.tsx
```

### Utility Page

```text
features/utilities/pages/UtilitiesPage.tsx
```

---

## Key Files Updated

```text
app/AppShell/AppShell.tsx
app/Sidebar/navigation.ts
app/router/AppRouter.tsx
features/accounts/repositories/AccountRepository.ts
```

---

## Verified Calculation Example

The following electricity bill was manually tested:

```text
Total Provider Bill: PHP 3,000
Rate: PHP 12 per kWh
```

### Primary Member Appliance

```text
Power Rating: 1 kW
Usage Hours: 20

Appliance Consumption:
1 x 20 = 20 kWh

Appliance Charge:
20 x PHP 12 = PHP 240
```

### Second Member Submeter

```text
Previous Reading: 100
Current Reading: 130
Fixed Compensation: PHP 120

Submeter Consumption:
130 - 100 = 30 kWh

Submeter Charge:
30 x PHP 12 = PHP 360

Direct Usage Amount:
PHP 360 + PHP 120 = PHP 480
```

### Shared Remainder

```text
Total Direct Usage:
PHP 240 + PHP 480 = PHP 720

Shared Remainder:
PHP 3,000 - PHP 720 = PHP 2,280

Equal Shared Amount:
PHP 2,280 / 2 = PHP 1,140
```

### Final Shares

```text
Primary Member:
PHP 240 + PHP 1,140 = PHP 1,380

Second Member:
PHP 480 + PHP 1,140 = PHP 1,620

Total Member Shares:
PHP 1,380 + PHP 1,620 = PHP 3,000

Validation Difference:
PHP 0.00
```

---

## Verified Workflows

The following tests passed:

* Redirect to household setup when no household exists
* Load active household members in Utilities
* Load active household accounts in Utilities
* Open the Utilities route
* Render the utility bill form
* Select electricity
* Select water
* Enforce the correct utility unit
* Enter the provider bill amount
* Enter the provider rate
* Enter billing and transaction dates
* Enter submeter readings
* Calculate current reading minus previous reading
* Leave readings at zero for members without meters
* Enable meter reset or replacement
* Require a meter reset reason
* Use reset-period consumption
* Add personal appliance usage
* Calculate appliance power multiplied by usage hours
* Calculate appliance charge using the provider rate
* Reject appliance entries for water
* Assign fixed compensation
* Select members sharing the remaining bill
* Support direct-usage-only members
* Calculate total direct usage
* Calculate the shared remainder
* Divide the shared remainder equally
* Allocate unavoidable remainder cents
* Calculate final member shares
* Confirm final shares equal the provider bill
* Confirm the validation difference equals zero
* Preview the complete allocation
* Save a utility expense without an account
* Save a utility expense using BPI Savings
* Save a utility expense using GCash
* Validate account ownership against the active household
* Create an exact-split expense transaction
* Create one exact allocation per member
* Display the utility expense in Transactions
* Create utility reimbursement obligations
* Display utility obligations in Settlements
* Run ESLint with zero errors
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

TypeScript Build: PASS
Vite Production Build: PASS
Build Errors: 0
```

Vite reported a non-blocking warning that the main JavaScript chunk exceeds 500 kB after minification.

---

## Git Verification

Sprint 9 implementation commit:

```text
13a0678 feat: add utility bill allocation and settlement integration
```

Branch:

```text
sprint-9-utilities
```

Remote branch:

```text
origin/sprint-9-utilities
```

The branch was pushed successfully and the working tree was clean after the implementation commit.

---

## Known Limitations

### Development-Oriented Persistence

Account, transaction, expense-allocation, settlement, and settlement-application repositories remain development-oriented and in-memory where previously implemented.

Records may reset after browser refresh or application restart.

Durable persistence remains future work.

---

### No Dedicated Utility Repository

Utility bills currently persist as expense transactions and exact allocations.

HFOS does not yet include:

* Dedicated utility bill records
* Utility bill history
* Utility bill editing
* Utility-specific search
* Utility-specific reporting

Calculation details remain available through transaction and allocation notes.

---

### Manual Previous Readings

Previous meter readings are entered manually.

HFOS does not yet automatically retrieve:

* The previous saved meter reading
* The previous billing date
* The latest meter record
* Usage changes between billing periods

---

### Appliance Estimation

Appliance consumption is estimated using:

```text
Power Rating x Usage Hours
```

Actual consumption may differ when an appliance:

* Cycles on and off
* Uses inverter technology
* Changes operating power
* Operates below its maximum rating

The simplified method was selected because it is easier for ordinary household users to understand.

---

### No Active Member Session

HFOS does not yet include:

* Login
* Authenticated member context
* Current-user identification
* Role-based access

The paying member remains manually selectable.

---

### Build Size

The main production JavaScript chunk exceeds Vite's default 500 kB warning threshold.

Future optimization should include:

* Route-level lazy loading
* Feature-level dynamic imports
* Vendor chunk separation
* Bundle analysis

---

## Deferred to Sprint 10

Sprint 10 should focus on durable local persistence and application-state stabilization.

Recommended scope:

* Persistent account repository
* Persistent transaction repository
* Persistent expense-allocation repository
* Persistent settlement repository
* Persistent settlement-application repository
* Persistent utility bill history
* Repository hydration
* Data versioning
* Demo-data initialization controls
* Explicit application reset workflow
* Browser refresh recovery
* Application restart recovery
* Persistence rollback verification
* End-to-end saved-data testing

---

## Sprint Result

Sprint 9 is complete.

HFOS now connects:

* Provider utility bills
* Household members
* Submeter consumption
* Personal appliance usage
* Fixed compensation
* Shared utility costs
* Exact expense allocations
* Optional account balance effects
* Transaction history
* Member reimbursement obligations
* Settlements

The project now has a working utility allocation engine capable of calculating direct member usage, dividing the shared remainder, balancing the result exactly to the provider bill, and creating the corresponding transaction and settlement records.

HFOS is ready to begin durable persistence and application-state stabilization in Sprint 10.
