import assert from "node:assert/strict";
import test from "node:test";

import type {
  Account,
} from "../src/features/accounts/models/Account.ts";
import AccountRepository from "../src/features/accounts/repositories/AccountRepository.ts";
import {
  browserCoreSnapshotLocalWriter,
} from "../src/features/auth/services/browserCoreSnapshotLocalWriter.ts";
import {
  HFOS_STORAGE_KEYS,
  saveStoredData,
} from "../src/shared/storage/localStorageStore.ts";
import {
  installBrowserStorage,
} from "./storageTestUtils.ts";

const householdId =
  "household-writer-1";

function createAccount(
  id: string,
  visibility: Account["visibility"]
): Account {
  const now =
    new Date("2026-08-06T00:00:00Z");

  return {
    id,
    householdId,
    ownerMemberId:
      "member-rasha",
    visibility,
    name:
      id,
    institution:
      undefined,
    accountClass:
      "asset",
    type:
      "e-wallet",
    currency:
      "PHP",
    baseCurrency:
      "PHP",
    exchangeRate:
      1,
    openingBalance:
      100,
    currentBalance:
      100,
    openingBaseBalance:
      100,
    currentBaseBalance:
      100,
    isActive:
      true,
    createdAt:
      now,
    updatedAt:
      now,
  };
}

test("cloud restore preserves local-only personal accounts", () => {
  installBrowserStorage();

  const now =
    new Date("2026-08-06T00:00:00Z");

  saveStoredData(
    HFOS_STORAGE_KEYS.household,
    {
      id:
        householdId,
      householdName:
        "Writer Household",
      country:
        "PH",
      currency:
        "PHP",
      timezone:
        "Asia/Manila",
      members: [
        {
          id:
            "member-rasha",
          householdId,
          displayName:
            "Rasha",
          role:
            "member",
          isActive:
            true,
          createdAt:
            now,
          updatedAt:
            now,
        },
      ],
      createdAt:
        now,
      updatedAt:
        now,
    }
  );

  const localPersonalAccount =
    createAccount(
      "local-personal-account",
      "private"
    );
  const localHouseholdAccount =
    createAccount(
      "local-household-account",
      "household"
    );
  const remoteHouseholdAccount =
    createAccount(
      "remote-household-account",
      "household"
    );

  assert.equal(
    AccountRepository.replaceForHousehold(
      householdId,
      [
        localPersonalAccount,
        localHouseholdAccount,
      ]
    ),
    true
  );

  assert.equal(
    browserCoreSnapshotLocalWriter
      .replaceAccounts(
        householdId,
        [
          remoteHouseholdAccount,
        ]
      ),
    true
  );

  assert.deepEqual(
    AccountRepository
      .findAll()
      .map((account) => account.id)
      .sort(),
    [
      "local-personal-account",
      "remote-household-account",
    ]
  );
});
