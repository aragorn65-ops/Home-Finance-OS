import assert from "node:assert/strict";
import test from "node:test";

import {
  createHouseholdMemberNameLookup,
  resolveHouseholdMemberReference,
  resolveSingleUnmatchedMember,
} from "../src/features/household/services/householdMemberResolution.ts";

test("household member resolution accepts local, remote, and email aliases", () => {
  const member = {
    id: "member-dadi-local",
    householdId: "household-1",
    remoteMemberId:
      "remote-member-dadi",
    email: "dadi@example.com",
    displayName: "Dadi Boboy",
    role: "owner" as const,
    isActive: true,
    createdAt:
      new Date("2026-08-22T00:00:00Z"),
    updatedAt:
      new Date("2026-08-22T00:00:00Z"),
  };

  for (const reference of [
    "member-dadi-local",
    "remote-member-dadi",
    "DADI@example.com",
  ]) {
    assert.equal(
      resolveHouseholdMemberReference(
        [
          member,
        ],
        reference
      )?.displayName,
      "Dadi Boboy"
    );
  }
});

test("household member name lookup includes cloud and legacy owner aliases", () => {
  const owner = {
    id: "member-dadi-local",
    householdId: "household-1",
    remoteMemberId:
      "remote-member-dadi",
    email: "dadi@example.com",
    displayName: "Dadi Boboy",
    role: "owner" as const,
    isActive: true,
    createdAt:
      new Date("2026-08-22T00:00:00Z"),
    updatedAt:
      new Date("2026-08-22T00:00:00Z"),
  };
  const rasha = {
    id: "member-rasha-local",
    householdId: "household-1",
    remoteMemberId:
      "remote-member-rasha",
    email: "rasha@example.com",
    displayName: "Rasha",
    role: "member" as const,
    isActive: true,
    createdAt:
      new Date("2026-08-22T00:00:00Z"),
    updatedAt:
      new Date("2026-08-22T00:00:00Z"),
  };

  const lookup =
    createHouseholdMemberNameLookup(
      [
        owner,
        rasha,
      ],
      "remote-member-dadi"
    );

  assert.equal(
    lookup["member-dadi-local"],
    "Dadi Boboy"
  );
  assert.equal(
    lookup["remote-member-dadi"],
    "Dadi Boboy"
  );
  assert.equal(
    lookup["member-001"],
    "Dadi Boboy"
  );
  assert.equal(
    lookup["rasha@example.com"],
    "Rasha"
  );
  assert.equal(
    lookup["remote-member-rasha"],
    "Rasha"
  );
});

test("household member resolution can identify the only unmatched active member", () => {
  const owner = {
    id: "member-owner-local",
    householdId: "household-1",
    remoteMemberId:
      "remote-member-owner",
    email: "owner@example.com",
    displayName: "Household owner",
    role: "owner" as const,
    isActive: true,
    createdAt:
      new Date("2026-08-22T00:00:00Z"),
    updatedAt:
      new Date("2026-08-22T00:00:00Z"),
  };
  const rasha = {
    id: "member-rasha-local",
    householdId: "household-1",
    remoteMemberId:
      "remote-member-rasha",
    email: "rasha@example.com",
    displayName: "Rasha",
    role: "member" as const,
    isActive: true,
    createdAt:
      new Date("2026-08-22T00:00:00Z"),
    updatedAt:
      new Date("2026-08-22T00:00:00Z"),
  };

  assert.equal(
    resolveSingleUnmatchedMember(
      [
        owner,
        rasha,
      ],
      "legacy-owner-reference",
      [
        "remote-member-rasha",
      ]
    )?.displayName,
    "Household owner"
  );
});
