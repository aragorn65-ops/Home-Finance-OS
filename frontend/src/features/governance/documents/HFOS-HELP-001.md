# Quick FAQ & How To

## Quick FAQ

### What is Home Finance OS?

Home Finance OS is a local-first household finance workspace for tracking accounts, transactions, utilities, settlements, savings, and monthly financial activity.

### Is public beta data backed up automatically?

No. Public beta cloud persistence covers the active authenticated household baseline, but backup is still your responsibility. Export a backup before and after meaningful testing.

### Should I use real financial data?

Use sample or low-risk data only during public beta. HFOS does not have production account recovery, multi-device household access, shared collaboration, or conflict resolution.

### What does App Lock protect?

App Lock protects this browser session from casual access. It is not an account login and it cannot recover data on another device.

### Why is Google Drive backup optional?

Google Drive backup depends on the deployed build and Google permission. Local Export Backup remains the required backup path.

### What should I report?

Report the page, selected month, browser, theme, expected behavior, actual behavior, and screenshots when possible.

## Short How To

### Create a local backup

1. Open Settings.
2. Go to Data & Backup.
3. Select Export Backup.
4. Keep the `.hfos-backup.json` file somewhere safe.

### Restore a backup

1. Open Settings.
2. Go to Data & Backup.
3. Select Import Backup.
4. Review the restore preview.
5. Select Restore Backup.

### Save to Google Drive

1. Open Settings.
2. Go to Data & Backup.
3. Select Save to Google Drive.
4. Grant Google permission when prompted.
5. Wait for the success message.

### Clear test records

1. Open Settings.
2. Go to Clear Test Data.
3. Confirm the action.
4. Check that household setup remains and financial test records are removed.

### Reset everything

1. Export a backup first if you need the data.
2. Open Settings.
3. Go to Reset All Application Data.
4. Confirm the reset.
5. The app returns to first-time household setup.

### Start a clean beta test

1. Reset All Application Data.
2. Create a sample household.
3. Add a few sample accounts and transactions.
4. Export a backup.
5. Test one workflow at a time.
