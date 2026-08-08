import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinkedHousehold,
  installBrowserStorage,
} from "./storageTestUtils.ts";

test(
  "clear test data preserves household link and app lock",
  async () => {
    const { localStorage, sessionStorage } =
      installBrowserStorage();
    const {
      HFOS_STORAGE_KEYS,
      saveStoredData,
    } = await import(
      "../src/shared/storage/localStorageStore.ts"
    );
    const {
      APP_LOCK_STORAGE_KEY,
    } = await import(
      "../src/features/security/services/appLockService.ts"
    );
    const {
      resetHouseholdTestData,
    } = await import(
      "../src/features/startup/services/applicationDataReset.ts"
    );

    const household =
      createLinkedHousehold();

    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.household,
        household
      ).success,
      true
    );
    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS.accounts,
        [
          {
            id: "account-1",
            name: "Cash",
          },
        ]
      ).success,
      true
    );
    assert.equal(
      saveStoredData(
        HFOS_STORAGE_KEYS
          .memberPersonalAccounts,
        [
          {
            id: "personal-account-1",
            name: "Rasha Wallet",
          },
        ]
      ).success,
      true
    );

    localStorage.setItem(
      APP_LOCK_STORAGE_KEY,
      "locked"
    );
    localStorage.setItem(
      "hfos.preview.leftover",
      "remove-me"
    );
    sessionStorage.setItem(
      "hfos.preview.session",
      "remove-me"
    );

    const result =
      resetHouseholdTestData();

    assert.equal(result.success, true);
    assert.equal(
      result.errors.length,
      0
    );
    assert.equal(
      localStorage.getItem(
        APP_LOCK_STORAGE_KEY
      ),
      "locked"
    );
    assert.equal(
      localStorage.getItem(
        "hfos.preview.leftover"
      ),
      null
    );
    assert.equal(
      sessionStorage.getItem(
        "hfos.preview.session"
      ),
      null
    );

    const storedHousehold =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.household
        ) ?? "{}"
      );
    const storedAccounts =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.accounts
        ) ?? "{}"
      );
    const storedMemberPersonalAccounts =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS
            .memberPersonalAccounts
        ) ?? "{}"
      );

    assert.equal(
      storedHousehold.data
        .authenticatedLink
        .remoteHouseholdId,
      "household-remote-1"
    );
    assert.deepEqual(
      storedAccounts.data,
      []
    );
    assert.deepEqual(
      storedMemberPersonalAccounts.data,
      []
    );
  }
);

test(
  "reset application data removes household link and clears test records",
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
      resetApplicationData,
    } = await import(
      "../src/features/startup/services/applicationDataReset.ts"
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
        HFOS_STORAGE_KEYS.transactions,
        [
          {
            id: "transaction-1",
            amount: 100,
          },
        ]
      ).success,
      true
    );
    localStorage.setItem(
      "hfos.preview.leftover",
      "remove-me"
    );

    const result =
      resetApplicationData();

    assert.equal(result.success, true);
    assert.equal(
      localStorage.getItem(
        HFOS_STORAGE_KEYS.household
      ),
      null
    );
    assert.equal(
      localStorage.getItem(
        "hfos.preview.leftover"
      ),
      null
    );

    const storedTransactions =
      JSON.parse(
        localStorage.getItem(
          HFOS_STORAGE_KEYS.transactions
        ) ?? "{}"
      );

    assert.deepEqual(
      storedTransactions.data,
      []
    );
  }
);
