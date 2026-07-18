# Home Finance OS v0.19.0-alpha

## Provider Bills & Payment Tracking

**Release Date:** TBD
**Status:** In Progress
**Sprint:** Sprint 19

---

## Overview

Home Finance OS v0.19.0-alpha focuses on provider bills: bills received from utilities or outside providers before a household member has paid them.

The goal is to calculate member shares when the bill is entered, keep provider payment status separate from member reimbursements, and create who-owes-who settlement obligations only after the provider has been paid by a household member.

---

## Planned Highlights

* Save calculated utility bills as unpaid provider bills.
* Track provider name, amount, billing date, due date, status, and attachments.
* Store member share snapshots before payment.
* Add a Bills to Pay view in Utilities.
* Add Mark as Paid with payer, payment account, payment date, reference, and receipt proof.
* Create transactions and settlement obligations only after provider payment.
* Include provider bills in backup and restore.

---

## Added

* Provider bills can now be saved from Utilities without selecting Paid By.
* Provider bill entry now captures provider name and due date.
* Utilities now shows a Bills to Pay section for active unpaid provider bills.
* Bills to Pay now shows each member's saved calculated share.
* Wrong provider bill files can be corrected while the bill is still unpaid.
* Internet bills can now be entered as fixed provider bills instead of manual transactions.
* Utilities now includes a Provider Payments summary for paid provider bills.
* Provider bills are included in new local and Google Drive backups.
* Bills to Pay now supports Mark Paid with payer, optional account, payment date, reference, and payment receipt.

## Changed

* Utility bill saving no longer creates a transaction or settlement obligation immediately.
* Payment fields in Utilities are optional while the provider bill is unpaid.
* Backup restore accepts older HFOS backups that do not yet contain provider-bill records.
* Provider payment creates the utility transaction and settlement obligations from the saved bill share snapshot.

---

## Deferred

* Recurring bill schedules.
* Partial provider payments.
* Provider directory management.
* Automatic payment reminders.
* Multi-device sync.
