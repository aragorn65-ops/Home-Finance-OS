import assert from "node:assert/strict";
import test from "node:test";

import type {
  AuthUser,
} from "../src/features/auth/models/index.ts";
import {
  createMembership,
  InMemoryAuthBackendAdapter,
} from "../src/features/auth/services/index.ts";

const householdId =
  "household-preferences-1";

const adminUser: AuthUser = {
  id: "user-admin",
  email: "admin@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

const memberUser: AuthUser = {
  id: "user-member",
  email: "member@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

function createAdapter(
  user: AuthUser
) {
  return new InMemoryAuthBackendAdapter({
    user,
    households: [
      {
        id: householdId,
        name: "Original Home",
        country: "PH",
        currency: "PHP",
        timezone: "Asia/Manila",
        ownerMemberId:
          "member-admin",
        status: "active",
        createdAt:
          new Date(
            "2026-07-30T00:00:00.000Z"
          ),
        updatedAt:
          new Date(
            "2026-07-30T00:00:00.000Z"
          ),
      },
    ],
    memberships: [
      createMembership({
        householdId,
        userId:
          adminUser.id,
        memberId:
          "member-admin",
        role: "admin",
      }),
      createMembership({
        householdId,
        userId:
          memberUser.id,
        memberId:
          "member-1",
        role: "member",
      }),
    ],
  });
}

test("remote household preferences allow admin save and member load", async () => {
  const adminAdapter =
    createAdapter(adminUser);

  const saved =
    await adminAdapter
      .saveRemoteHouseholdPreferences({
        householdId,
        name: "Updated Home",
        country: "US",
        currency: "USD",
        timezone:
          "America/Los_Angeles",
      });

  assert.equal(
    saved.name,
    "Updated Home"
  );
  assert.equal(
    saved.country,
    "US"
  );
  assert.equal(
    saved.currency,
    "USD"
  );
  assert.equal(
    saved.timezone,
    "America/Los_Angeles"
  );

  const loaded =
    await adminAdapter
      .loadRemoteHousehold(
        householdId
      );

  assert.equal(
    loaded.name,
    "Updated Home"
  );
});

test("remote household preferences block member save", async () => {
  const adapter =
    createAdapter(memberUser);

  const loaded =
    await adapter.loadRemoteHousehold(
      householdId
    );

  assert.equal(
    loaded.name,
    "Original Home"
  );

  await assert.rejects(
    () =>
      adapter.saveRemoteHouseholdPreferences({
        householdId,
        name: "Member Home",
        country: "PH",
        currency: "PHP",
        timezone: "Asia/Manila",
      }),
    /Only a household admin can save household preferences\./
  );
});

test("remote household preferences notify subscribers", async () => {
  const adapter =
    createAdapter(adminUser);
  let notificationCount = 0;

  const subscription =
    adapter
      .subscribeToHouseholdPreferenceChanges(
        householdId,
        () => {
          notificationCount += 1;
        }
      );

  await adapter
    .saveRemoteHouseholdPreferences({
      householdId,
      name: "Realtime Home",
      country: "PH",
      currency: "PHP",
      timezone: "Asia/Manila",
    });

  subscription.unsubscribe();

  await adapter
    .saveRemoteHouseholdPreferences({
      householdId,
      name: "Quiet Home",
      country: "PH",
      currency: "PHP",
      timezone: "Asia/Manila",
    });

  assert.equal(
    notificationCount,
    1
  );
});
