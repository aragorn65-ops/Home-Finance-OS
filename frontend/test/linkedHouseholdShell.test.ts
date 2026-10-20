import assert from "node:assert/strict";
import test from "node:test";
import { installBrowserStorage } from "./storageTestUtils.ts";
import { HFOS_STORAGE_KEYS } from "../src/shared/storage/localStorageStore.ts";
import { saveLinkedHouseholdShell } from "../src/features/household/services/householdStorage.ts";

test("linking or repairing a household shell never clears cached financial records", () => {
  const { localStorage } = installBrowserStorage();
  const keys = [HFOS_STORAGE_KEYS.transactions, HFOS_STORAGE_KEYS.settlements,
    HFOS_STORAGE_KEYS.settlementApplications, HFOS_STORAGE_KEYS.expenseAllocations];
  for (const key of keys) localStorage.setItem(key, `preserved-${key}`);
  const now = new Date();
  const input = {
    id: "home", remoteHouseholdId: "home", householdName: "Existing household",
    country: "PH", currency: "PHP", timezone: "Asia/Manila",
    ownerMemberId: "owner", linkedByUserId: "user",
    member: { id: "owner", householdId: "home", displayName: "Dadi Buboy",
      role: "owner" as const, isActive: true, createdAt: now, updatedAt: now },
  };
  assert.ok(saveLinkedHouseholdShell(input));
  assert.ok(saveLinkedHouseholdShell({ ...input, replaceExisting: true }));
  for (const key of keys) assert.equal(localStorage.getItem(key), `preserved-${key}`);
});
