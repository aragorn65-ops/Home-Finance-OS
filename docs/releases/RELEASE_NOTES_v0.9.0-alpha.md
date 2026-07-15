# Home Finance OS v0.9.0-alpha

## Utility Bill Allocation

**Release Date:** July 15, 2026  
**Status:** Alpha Release  
**Sprint:** Sprint 9

---

## Overview

Home Finance OS v0.9.0-alpha introduces utility bill allocation for a single active household.

Electricity and water bills can now be divided using member submeter readings, personal appliance usage, fixed compensation, and an equally shared remaining balance.

Calculated utility shares are saved as exact-split expense transactions. These allocations automatically flow into the existing Settlements feature, allowing HFOS to determine the reimbursement obligations between household members.

This release also aligns the demo accounts with the active household and prevents application pages from opening before household setup is complete.

---

## Key Features

### Utility Bill Details

The Utilities page accepts the core information shown on the provider bill:

* Utility type
* Billing date
* Total bill amount
* Rate per unit
* Transaction date
* Paying member
* Optional payment account
* Visibility
* Description and notes

Supported utility types are:

* Electricity using kilowatt-hours
* Water using cubic meters

---

### Member Submeter Usage

Each household member may have direct consumption calculated from submeter readings.

The normal calculation is:

```text
Submeter Consumption = Current Reading - Previous Reading
Submeter Charge = Submeter Consumption × Rate per Unit