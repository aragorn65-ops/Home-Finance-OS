# Sprint 104 Attachment Smoke

Use this guide after Cloudflare Pages deploys the latest `main` checkpoint.

```text
https://home-finance-os.pages.dev
```

Use sample or low-risk files only. Keep each file under the in-app attachment
limit.

---

## Purpose

Confirm receipt and bill attachments do not block record saves, remain listed
after browser refresh, and expose preview actions only when file data is
available. Metadata-only cloud beta records must show clear preview-unavailable
copy instead of a broken Open or View action.

---

## Build Gate

1. Open `/app/settings`.
2. Open Auth Diagnostics.
3. Confirm Build is `ed6f6de` or newer.
4. Confirm Branch is `main`.
5. Confirm Cloud Schema Readiness passes.

Expected result: production is running the intended Sprint 104 attachment
checkpoint.

---

## Test Files

Prepare at least two small files:

* One image: JPG, PNG, or WebP.
* One PDF.

Expected result: both files are accepted by attachment upload controls.

---

## Expense Transaction Attachment

1. Sign in as owner/admin.
2. Open Transactions.
3. Add a small expense transaction.
4. Attach an image or PDF receipt.
5. Save the transaction.
6. Open View for the saved transaction.
7. Confirm the attachment filename, type, and size are listed.
8. If Open Attachment is visible, click it and confirm the preview opens.
9. Refresh the browser.
10. Reopen View and confirm the attachment still appears.

Expected result: the transaction saves, the attachment remains listed after
refresh, and the preview action appears only when file data is available.

---

## Utility Provider Bill Attachments

1. Open Utilities.
2. Add an unpaid utility provider bill with a bill file attached.
3. Save the provider bill.
4. Confirm the provider bill appears in unpaid bills.
5. Confirm the bill filename remains listed.
6. If View is visible, click it and confirm the preview opens.
7. If only metadata is stored, confirm the UI shows preview-unavailable cloud
   beta copy.
8. Mark the provider bill paid with a payment receipt attached.
9. Confirm the provider payment appears in the selected payment month.
10. Refresh the browser and confirm bill and payment attachment filenames
    remain listed.

Expected result: provider bill and payment attachments do not block save or
payment marking, and metadata-only records do not expose broken preview
actions.

---

## Settlement Attachment

1. Open Settlements.
2. Record a small settlement with a transfer receipt attached.
3. Save the settlement.
4. Open View for the saved settlement.
5. Confirm the transfer receipt filename, type, and size are listed.
6. If Open is visible, click it and confirm the preview opens.
7. Refresh the browser.
8. Reopen View and confirm the receipt still appears.

Expected result: the settlement saves, persists, and shows a working preview
when file data is available or preview-unavailable copy when only metadata is
stored.

---

## Member Review

1. Sign out as admin.
2. Sign in as a limited member who is permitted to view the tested transaction,
   utility bill, and settlement.
3. Open each record's View or review surface.
4. Confirm attachment filenames are visible.
5. Confirm Open or View appears only when preview data exists.
6. Confirm private transaction attachments from unrelated members are not
   visible.

Expected result: members can review permissible attachments without seeing
attachments on records they cannot access.

---

## Evidence Log

Record the result in `docs/qa/Public-Beta-Launch-Evidence.md`.

```text
Date:
Tester:
Browser:
Production URL: https://home-finance-os.pages.dev
Expected build commit: ed6f6de or newer
Auth Diagnostics build:
Auth Diagnostics branch:
Cloud Schema Readiness:
Expense attachment save:
Expense attachment after refresh:
Utility provider bill attachment save:
Utility payment receipt attachment save:
Utility attachments after refresh:
Settlement attachment save:
Settlement attachment after refresh:
Metadata-only preview copy:
Member permissible attachment review:
Member private attachment restriction:
Blockers:
Decision:
```
