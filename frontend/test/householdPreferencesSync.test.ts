import assert from "node:assert/strict";
import test from "node:test";

import type {
  RemoteHousehold,
} from "../src/features/auth/models/index.ts";
import {
  restoreLinkedRemoteHouseholdPreferences,
} from "../src/features/auth/services/index.ts";

const remoteHousehold:
  RemoteHousehold = {
  id: "remote-household-1",
  name: "Cloud Home",
  country: "PH",
  currency: "php",
  timezone: "Asia/Manila",
  ownerMemberId:
    "member-owner-1",
  status: "active",
  createdAt:
    new Date(
      "2026-07-30T00:00:00Z"
    ),
  updatedAt:
    new Date(
      "2026-07-30T01:00:00Z"
    ),
};

test("skips household preference restore when auth is disabled", async () => {
  const result =
    await restoreLinkedRemoteHouseholdPreferences({
      authEnabled: false,
      household: {
        id: "local-household-1",
        authenticatedLink: {
          remoteHouseholdId:
            "remote-household-1",
        },
      },
      adapter: {
        async loadRemoteHousehold() {
          throw new Error("unused");
        },
      },
      writer: {
        replacePreferences() {
          throw new Error("unused");
        },
      },
    });

  assert.deepEqual(
    result,
    {
      status: "skipped",
      reason: "auth-disabled",
    }
  );
});

test("restores linked remote household preferences into local storage", async () => {
  let loadedHouseholdId:
    | string
    | undefined;
  let savedPreferences:
    | {
        householdName: string;
        country: string;
        currency: string;
        timezone: string;
      }
    | undefined;

  const result =
    await restoreLinkedRemoteHouseholdPreferences({
      authEnabled: true,
      household: {
        id: "local-household-1",
        authenticatedLink: {
          remoteHouseholdId:
            remoteHousehold.id,
        },
      },
      adapter: {
        async loadRemoteHousehold(
          householdId: string
        ) {
          loadedHouseholdId =
            householdId;

          return remoteHousehold;
        },
      },
      writer: {
        replacePreferences(
          preferences
        ) {
          savedPreferences =
            preferences;

          return true;
        },
      },
    });

  assert.equal(
    result.status,
    "restored"
  );
  assert.equal(
    loadedHouseholdId,
    remoteHousehold.id
  );
  assert.deepEqual(
    savedPreferences,
    {
      householdName:
        "Cloud Home",
      country: "PH",
      currency: "PHP",
      timezone:
        "Asia/Manila",
    }
  );
});

test("blocks restore when cloud household preferences are incomplete", async () => {
  await assert.rejects(
    () =>
      restoreLinkedRemoteHouseholdPreferences({
        authEnabled: true,
        household: {
          id: "local-household-1",
          authenticatedLink: {
            remoteHouseholdId:
              remoteHousehold.id,
          },
        },
        adapter: {
          async loadRemoteHousehold() {
            return {
              ...remoteHousehold,
              timezone:
                undefined,
            };
          },
        },
        writer: {
          replacePreferences() {
            return true;
          },
        },
      }),
    /Cloud household preferences are incomplete\./
  );
});
