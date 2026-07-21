import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinkedHousehold,
  createStorageEnvelope,
  installBrowserStorage,
} from "./storageTestUtils.ts";

test(
  "loadHousehold preserves authenticated link metadata",
  async () => {
    const { localStorage } =
      installBrowserStorage();
    const {
      HFOS_STORAGE_KEYS,
    } = await import(
      "../src/shared/storage/localStorageStore.ts"
    );
    const {
      loadHousehold,
    } = await import(
      "../src/features/household/services/householdStorage.ts"
    );

    localStorage.setItem(
      HFOS_STORAGE_KEYS.household,
      JSON.stringify(
        createStorageEnvelope(
          createLinkedHousehold()
        )
      )
    );

    const household =
      loadHousehold();

    assert.equal(
      household?.authenticatedLink
        ?.remoteHouseholdId,
      "household-remote-1"
    );
    assert.equal(
      household?.members[0]?.userId,
      undefined
    );
  }
);

test(
  "linkHouseholdToAuthenticatedTenant links the local owner member",
  async () => {
    const { localStorage } =
      installBrowserStorage();
    const {
      HFOS_STORAGE_KEYS,
    } = await import(
      "../src/shared/storage/localStorageStore.ts"
    );
    const {
      linkHouseholdToAuthenticatedTenant,
      loadHousehold,
    } = await import(
      "../src/features/household/services/householdStorage.ts"
    );
    const household =
      createLinkedHousehold();
    delete household.authenticatedLink;

    localStorage.setItem(
      HFOS_STORAGE_KEYS.household,
      JSON.stringify(
        createStorageEnvelope(
          household
        )
      )
    );

    const result =
      linkHouseholdToAuthenticatedTenant({
        remoteHouseholdId:
          "household-remote-2",
        migrationId:
          "migration-2",
        ownerMemberId:
          "member-owner-1",
        linkedByUserId:
          "user-2",
        linkedAt:
          new Date(
            "2026-07-21T02:00:00.000Z"
          ),
      });
    const reloaded =
      loadHousehold();

    assert.equal(
      result?.authenticatedLink
        ?.remoteHouseholdId,
      "household-remote-2"
    );
    assert.equal(
      reloaded?.members[0]?.userId,
      "user-2"
    );
  }
);
