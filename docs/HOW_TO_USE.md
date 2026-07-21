# Home Finance OS How To Use

## Guided Private Beta Guide

This guide is a short starting point for guided private local-first beta testing
of Home Finance OS.

Use sample, test, or low-risk data only. The current beta candidate stores data
in your browser and does not yet include production login, production cloud sync,
or shared household account management. Local and Google Drive backup tools are
available, and backups can optionally be password protected.

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
   * Household name.
   * Country.
   * Theme: Light, Dark, or System Default.
   * Base currency: the household reporting currency.
   * Time zone.
4. Add accounts for cash, bank, wallet, or savings balances.

Tip: The base currency is the main household reporting currency. Foreign-currency accounts can still be added with an exchange rate for reporting. When a suggested rate is available, you can apply it from the rate lookup button or keep your manual rate.

New households start empty with zero transactions. Add accounts and records manually for each QA scenario.

Household name, country, base currency, and time zone can be changed later in Settings, then confirmed with Save Preferences. Changing the household name is non-destructive and does not affect accounts, transactions, settlements, savings records, or reports. Choosing a listed country can apply its default currency and time zone before saving. Some countries have multiple regional time zones, so confirm the time zone after selecting a country, such as Australia/Melbourne for a Melbourne household. Use Other / manual when your country, currency, or time zone is not listed. Currency changes apply going forward and do not recompute historical records. When transactions already exist, Settings shows a warning before base-currency changes. Existing transactions keep their saved reporting currency and converted amount.

For repeated QA, use Settings -> Clear Test Data to remove accounts, transactions, settlements, savings records, utility-bill records, and leftover preview keys while keeping the household setup. Use Reset All Application Data only when you want to delete the household and return to first-time setup.

Use Settings -> Data & Backup -> Export Backup to download a local `.hfos-backup.json` file. Enable password protection before exporting when the backup file should be encrypted; protected backups require the same backup password before they can be previewed or restored. HFOS cannot recover forgotten backup passwords. Use Save to Google Drive to upload the same backup package to Google Drive when the app has a configured Google OAuth client. Use Restore from Google Drive to list recent app-visible HFOS backups, select one, validate it, and preview it before restore. The Drive restore list uses low-permission app-created file access, so manually uploaded or copied Drive files may not appear there. For those files, download the backup from Drive and use Import Backup. Use Import Backup to choose a validated HFOS backup file from the device, confirm restore, and replace the current browser-local data. If the browser has no household yet, use Restore from Backup on the household setup screen.

Use Settings -> App Lock to enable a local PIN lock for this browser. App lock can lock HFOS after refresh, manual lock, or optional inactivity timeout. This is local browser privacy, not cloud login or household account authorization.

Auth and migration diagnostics are prototype beta-hardening surfaces. They can
help verify claimed, linked, and migration-checkpoint states, but they are not a
production account system or production sync layer.

For Google Drive backup in a deployed preview, enable the Google Drive API for the Google Cloud project, create a Google OAuth web client, add `https://aragorn65-ops.github.io` as an authorized JavaScript origin, and set the client ID as a GitHub repository variable or Actions secret named `VITE_GOOGLE_CLIENT_ID`. If the OAuth app is in Testing, add the Google account used for QA as a test user. Vite embeds the client ID when GitHub Pages builds the app, so redeploy after changing the GitHub variable. Without that client ID, Settings shows that Google Drive backup is not configured and local Export Backup remains available.

---

## Monthly Workflow

Use the month selector before entering or reviewing records.

The app is designed so June activity stays in June and July activity stays in July. Settlements may be paid later, but the original transaction stays in its transaction month.

Recommended flow:

1. Select the working month.
2. Enter income and expenses in Transactions.
3. Add utilities if needed.
4. Review outstanding settlements.
5. Record settlements when someone pays someone back. Add a transfer receipt, pasted screenshot, or PDF proof of payment when available.
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
* Ballpark remittance estimates from the Quick Actions calculator.

Analytics respects the selected reporting month.

Top Expense Categories can be opened to review the transactions behind a selected category for the current reporting month.

The remittance calculator in Dashboard Quick Actions is display-only. It converts the selected month's locked household expense total into another currency and rounds the ballpark remittance up to the next 100 in the estimate currency, so the estimate is not lower than the calculated need. It does not include outstanding settlements and does not change saved transactions, settlements, accounts, or Analytics history.

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
* Clear Test Data keeps the household setup but removes financial/test records from this browser.
* Reset All Application Data deletes the household and returns the app to first-time setup.
* No production login or account recovery yet.
* Auth and migration diagnostics remain prototype surfaces.
* No production cloud sync.
* Local backup export and restore are available, including optional password-protected backup files.
* Google Drive backup is available only when a Google OAuth client ID is configured.
* Local app lock is browser privacy only; it is not account authentication.
* No shared household invite flow yet.
* Use sample, test, or low-risk data only for beta testing.
