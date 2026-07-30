import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinkedHousehold,
  createStorageEnvelope,
  installBrowserStorage,
} from "./storageTestUtils.ts";

test(
  "backup summary reports linked household status",
  async () => {
    const { localStorage } =
      installBrowserStorage();
    const {
      HFOS_STORAGE_KEYS,
    } = await import(
      "../src/shared/storage/localStorageStore.ts"
    );
    const {
      createApplicationBackup,
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );

    localStorage.setItem(
      HFOS_STORAGE_KEYS.household,
      JSON.stringify(
        createStorageEnvelope(
          createLinkedHousehold()
        )
      )
    );

    const backup =
      await createApplicationBackup();

    assert.equal(
      backup.success,
      true
    );
    assert.ok(backup.json);

    const validation =
      await validateApplicationBackup(
        backup.json
      );

    assert.equal(
      validation.success,
      true
    );

    if (validation.success) {
      assert.equal(
        validation.summary
          .authenticatedLinkStatus,
        "linked"
      );
      assert.equal(
        validation.summary
          .remoteHouseholdId,
        "household-remote-1"
      );
    }
  }
);

test(
  "local backup export validates preview counts and restores finance data",
  async () => {
    const { localStorage } =
      installBrowserStorage();
    const {
      HFOS_STORAGE_KEYS,
      saveStoredData,
    } = await import(
      "../src/shared/storage/localStorageStore.ts"
    );
    const {
      createApplicationBackup,
      restoreApplicationBackup,
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );

    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.household,
        createLinkedHousehold()
      ).success,
      true
    );
    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.accounts,
        [
          {
            id: "account-1",
            householdId:
              "household-local-1",
            name: "Cash",
          },
        ]
      ).success,
      true
    );
    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.transactions,
        [
          {
            id: "transaction-1",
            householdId:
              "household-local-1",
            amount: 250,
          },
        ]
      ).success,
      true
    );
    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.settlements,
        [
          {
            id: "settlement-1",
            householdId:
              "household-local-1",
            amount: 100,
          },
        ]
      ).success,
      true
    );
    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.savingsGoals,
        [
          {
            id: "savings-goal-1",
            householdId:
              "household-local-1",
            name: "Emergency",
          },
        ]
      ).success,
      true
    );

    const backup =
      await createApplicationBackup();

    assert.equal(
      backup.success,
      true
    );
    assert.match(
      backup.filename ?? "",
      /^hfos-backup-.+\.hfos-backup\.json$/
    );
    assert.ok(backup.json);

    const validation =
      await validateApplicationBackup(
        backup.json
      );

    assert.equal(
      validation.success,
      true
    );

    if (validation.success) {
      assert.equal(
        validation.summary
          .accountCount,
        1
      );
      assert.equal(
        validation.summary
          .transactionCount,
        1
      );
      assert.equal(
        validation.summary
          .settlementCount,
        1
      );
      assert.equal(
        validation.summary
          .savingsGoalCount,
        1
      );
    }

    localStorage.clear();

    const restore =
      await restoreApplicationBackup(
        backup.json
      );

    assert.equal(
      restore.success,
      true
    );

    const restoredAccounts =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.accounts
        ) ?? "{}"
      );
    const restoredTransactions =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.transactions
        ) ?? "{}"
      );
    const restoredSettlements =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.settlements
        ) ?? "{}"
      );
    const restoredSavingsGoals =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.savingsGoals
        ) ?? "{}"
      );

    assert.equal(
      restoredAccounts.data.length,
      1
    );
    assert.equal(
      restoredTransactions.data.length,
      1
    );
    assert.equal(
      restoredSettlements.data.length,
      1
    );
    assert.equal(
      restoredSavingsGoals.data.length,
      1
    );
  }
);

test(
  "backup validation rejects malformed authenticated links",
  async () => {
    installBrowserStorage();
    const {
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );
    const household =
      createLinkedHousehold();
    household.authenticatedLink.linkedAt =
      "not-a-date";

    const backup = {
      kind: "hfos-local-backup",
      backupVersion: 1,
      app: "Home Finance OS",
      exportedAt:
        "2026-07-21T03:00:00.000Z",
      storageSchemaVersion: 1,
      records: {
        "hfos.v1.household":
          household,
        "hfos.v1.accounts": [],
        "hfos.v1.transactions": [],
        "hfos.v1.expense-allocations": [],
        "hfos.v1.settlements": [],
        "hfos.v1.settlement-applications": [],
        "hfos.v1.savings-goals": [],
        "hfos.v1.savings-activities": [],
      },
      preferences: {
        themePreference:
          "system",
      },
    };

    const validation =
      await validateApplicationBackup(
        JSON.stringify(backup)
      );

    assert.equal(
      validation.success,
      false
    );
    assert.match(
      validation.message,
      /authenticated-link/
    );
  }
);

test(
  "backup validation rejects blank authenticated link identifiers",
  async () => {
    installBrowserStorage();
    const {
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );
    const household =
      createLinkedHousehold();
    household.authenticatedLink.remoteHouseholdId =
      "";

    const backup = {
      kind: "hfos-local-backup",
      backupVersion: 1,
      app: "Home Finance OS",
      exportedAt:
        "2026-07-21T03:00:00.000Z",
      storageSchemaVersion: 1,
      records: {
        "hfos.v1.household":
          household,
        "hfos.v1.accounts": [],
        "hfos.v1.transactions": [],
        "hfos.v1.expense-allocations": [],
        "hfos.v1.settlements": [],
        "hfos.v1.settlement-applications": [],
        "hfos.v1.savings-goals": [],
        "hfos.v1.savings-activities": [],
      },
      preferences: {
        themePreference:
          "system",
      },
    };

    const validation =
      await validateApplicationBackup(
        JSON.stringify(backup)
      );

    assert.equal(
      validation.success,
      false
    );
    assert.match(
      validation.message,
      /authenticated-link/
    );
  }
);

test(
  "backup validation rejects blank linked summary remote household ids",
  async () => {
    installBrowserStorage();
    const {
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );
    const household =
      createLinkedHousehold();

    const backup = {
      kind: "hfos-local-backup",
      backupVersion: 1,
      app: "Home Finance OS",
      exportedAt:
        "2026-07-21T03:00:00.000Z",
      storageSchemaVersion: 1,
      summary: {
        householdName:
          "Household",
        authenticatedLinkStatus:
          "linked",
        remoteHouseholdId: "",
        exportedAt:
          "2026-07-21T03:00:00.000Z",
        accountCount: 0,
        transactionCount: 0,
        settlementCount: 0,
        savingsGoalCount: 0,
      },
      records: {
        "hfos.v1.household":
          household,
        "hfos.v1.accounts": [],
        "hfos.v1.transactions": [],
        "hfos.v1.expense-allocations": [],
        "hfos.v1.settlements": [],
        "hfos.v1.settlement-applications": [],
        "hfos.v1.savings-goals": [],
        "hfos.v1.savings-activities": [],
      },
      preferences: {
        themePreference:
          "system",
      },
    };

    const validation =
      await validateApplicationBackup(
        JSON.stringify(backup)
      );

    assert.equal(
      validation.success,
      false
    );
    assert.match(
      validation.message,
      /summary/
    );
  }
);

test(
  "protected backup metadata rejects blank linked summary remote household ids",
  async () => {
    installBrowserStorage();
    const {
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );

    const backup = {
      kind:
        "hfos-password-protected-backup",
      backupVersion: 1,
      app: "Home Finance OS",
      exportedAt:
        "2026-07-21T03:00:00.000Z",
      summary: {
        householdName:
          "Protected backup",
        authenticatedLinkStatus:
          "linked",
        remoteHouseholdId: "",
        exportedAt:
          "2026-07-21T03:00:00.000Z",
        accountCount: 0,
        transactionCount: 0,
        settlementCount: 0,
        savingsGoalCount: 0,
        passwordProtected: true,
      },
      encryption: {
        algorithm: "AES-GCM",
        kdf: "PBKDF2-SHA-256",
        iterations: 210000,
        salt: "AAAA",
        iv: "AAAA",
      },
      payload: "AAAA",
    };

    const validation =
      await validateApplicationBackup(
        JSON.stringify(backup)
      );

    assert.equal(
      validation.success,
      false
    );
    assert.match(
      validation.message,
      /summary/
    );
    assert.equal(
      validation.requiresPassword,
      undefined
    );
  }
);

test(
  "backup validation rejects unlinked summaries with remote household ids",
  async () => {
    installBrowserStorage();
    const {
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );

    const backup = {
      kind: "hfos-local-backup",
      backupVersion: 1,
      app: "Home Finance OS",
      exportedAt:
        "2026-07-21T03:00:00.000Z",
      storageSchemaVersion: 1,
      summary: {
        householdName:
          "Household",
        authenticatedLinkStatus:
          "unlinked",
        remoteHouseholdId:
          "household-remote-1",
        exportedAt:
          "2026-07-21T03:00:00.000Z",
        accountCount: 0,
        transactionCount: 0,
        settlementCount: 0,
        savingsGoalCount: 0,
      },
      records: {
        "hfos.v1.household": {
          householdName:
            "Household",
        },
        "hfos.v1.accounts": [],
        "hfos.v1.transactions": [],
        "hfos.v1.expense-allocations": [],
        "hfos.v1.settlements": [],
        "hfos.v1.settlement-applications": [],
        "hfos.v1.savings-goals": [],
        "hfos.v1.savings-activities": [],
      },
      preferences: {
        themePreference:
          "system",
      },
    };

    const validation =
      await validateApplicationBackup(
        JSON.stringify(backup)
      );

    assert.equal(
      validation.success,
      false
    );
    assert.match(
      validation.message,
      /summary/
    );
  }
);

test(
  "protected backup metadata rejects unlinked summaries with remote household ids",
  async () => {
    installBrowserStorage();
    const {
      validateApplicationBackup,
    } = await import(
      "../src/features/startup/services/applicationBackup.ts"
    );

    const backup = {
      kind:
        "hfos-password-protected-backup",
      backupVersion: 1,
      app: "Home Finance OS",
      exportedAt:
        "2026-07-21T03:00:00.000Z",
      summary: {
        householdName:
          "Protected backup",
        authenticatedLinkStatus:
          "unlinked",
        remoteHouseholdId:
          "household-remote-1",
        exportedAt:
          "2026-07-21T03:00:00.000Z",
        accountCount: 0,
        transactionCount: 0,
        settlementCount: 0,
        savingsGoalCount: 0,
        passwordProtected: true,
      },
      encryption: {
        algorithm: "AES-GCM",
        kdf: "PBKDF2-SHA-256",
        iterations: 210000,
        salt: "AAAA",
        iv: "AAAA",
      },
      payload: "AAAA",
    };

    const validation =
      await validateApplicationBackup(
        JSON.stringify(backup)
      );

    assert.equal(
      validation.success,
      false
    );
    assert.match(
      validation.message,
      /summary/
    );
    assert.equal(
      validation.requiresPassword,
      undefined
    );
  }
);
