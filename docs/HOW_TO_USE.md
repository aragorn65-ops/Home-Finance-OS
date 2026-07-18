# Home Finance OS How To Use

## Private Alpha Guide

This guide is a short starting point for testing Home Finance OS.

Use sample or test data only. The current alpha stores data in your browser and does not yet include login, cloud sync, backup, or account sharing.

---

## Open The App

Use the preview link:

```text
https://aragorn65-ops.github.io/Home-Finance-OS/
```

If running locally:

```text
cd frontend
npm install
npm run dev
```

Then open the local URL shown in the terminal.

---

## First-Time Setup

1. Create or open a household.
2. Add household members.
3. Open Settings and confirm:
   * Country.
   * Theme: Light, Dark, or System Default.
   * Base currency: the household reporting currency.
   * Time zone.
4. Add accounts for cash, bank, wallet, or savings balances.

Tip: The base currency is the main household reporting currency. Foreign-currency accounts can still be added with an exchange rate for reporting. When a suggested rate is available, you can apply it from the rate lookup button or keep your manual rate.

Country, base currency, and time zone can be changed later in Settings. Choosing a listed country can apply its default currency and time zone. Use Other / manual when your country, currency, or time zone is not listed. Currency changes apply going forward and do not recompute historical records.

---

## Monthly Workflow

Use the month selector before entering or reviewing records.

The app is designed so June activity stays in June and July activity stays in July. Settlements may be paid later, but the original transaction stays in its transaction month.

Recommended flow:

1. Select the working month.
2. Enter income and expenses in Transactions.
3. Add utilities if needed.
4. Review outstanding settlements.
5. Record settlements when someone pays someone back.
6. Check Dashboard and Analytics for the selected month.

---

## Transactions

Use Transactions for:

* Income.
* Expenses.
* Shared household purchases.
* Personal items inside a shared purchase.
* Receipt or bill attachments.

For grocery use cases with shared and personal items, split the transaction lines so common items and personal items are assigned correctly.

For foreign-currency income or expenses, enter the original amount, currency, exchange rate, and effective date. You can apply a suggested exchange rate when available. The app stores both the entered amount and reporting equivalent.

For a foreign-currency expense paid from a linked account, the payment account currency should match the transaction currency. Household reporting, splits, and Analytics continue to use the converted base-currency amount.

Attachments can be added from the same receipt and bill area by choosing files, pasting from the clipboard, or dragging files into the attachment box.

On mobile, after selecting a file from the phone picker, the transaction window should stay open and scroll back to the attachment area with feedback.

---

## Utilities

Use Utilities to split electricity or water bills among active household members.

For electricity:

* Enter the total provider bill.
* Enter the provider rate per kWh.
* Add direct member usage from submeters or appliance usage.

For water:

* Enter the total provider bill.
* Enter the provider consumption in m<sup>3</sup>.
* The app derives the rate per m<sup>3</sup> internally and uses that rate for member-share calculations.

Utility bills can also include bill or receipt attachments. Saved utility bills create expense transactions and settlement obligations.

---

## Settlements

Use Settlements when one member pays another member back.

Settlement history shows:

* Who paid.
* Who received.
* Reference number.
* Settled items.
* Full or partial settlement status.

Settlement reporting follows the original transaction month, not only the payment date.

---

## Savings

Use Savings for goals and contributions.

Goals may use the household base currency or another currency, such as a USD travel goal in a PHP household.

Savings contributions can also be entered in another currency. The app keeps the entered amount and the reporting equivalent.

When a savings goal or contribution uses another currency, you can apply a suggested exchange rate when available or keep a manual rate.

---

## Analytics

Analytics is currently read-only.

Use it to review:

* Monthly income.
* Monthly expenses.
* Net cash flow.
* Top categories.
* Utility costs.
* Settlement status.
* Savings progress.
* Account position.

Analytics respects the selected reporting month.

Top Expense Categories can be opened to review the transactions behind a selected category for the current reporting month.

---

## Attachments

Transactions support receipt or bill uploads for supported image and PDF files.

Supported attachment methods:

* Choose a file.
* Paste an image or supported file from the clipboard.
* Drag and drop files into the attachment box.

Supported file types:

* JPEG.
* PNG.
* WebP.
* PDF.

Current limits:

* 1 MB per file.
* 3 attachments per transaction.

Use clear, reasonably sized files. If a file fails, try a smaller image or PDF and note the file type and size for debugging.

---

## Testing Feedback

When giving feedback, include:

* The page you were using.
* The selected month.
* What you expected to happen.
* What actually happened.
* Whether you were using light or dark theme.
* Any screenshot or exact error message.

Good feedback examples:

* "In July Transactions, deleting a USD income did not update the USD account balance."
* "In dark theme, the dropdown text on Settings was hard to read."
* "In June Dashboard, July recent activity appeared."

---

## Current Limitations

* Browser-only localStorage persistence.
* No login or authentication yet.
* No cloud sync.
* No backup or restore yet.
* No shared household invite flow yet.
* Use test data only for preview testing.
