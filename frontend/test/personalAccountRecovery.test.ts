import assert from "node:assert/strict";
import test from "node:test";
import AccountRepository from "../src/features/accounts/repositories/AccountRepository.ts";
import type { Account } from "../src/features/accounts/models/Account.ts";
import { HFOS_STORAGE_KEYS, saveStoredData } from "../src/shared/storage/localStorageStore.ts";
import { installBrowserStorage } from "./storageTestUtils.ts";

const now = new Date("2026-10-01T00:00:00Z");

function account(householdId: string, ownerMemberId = "original-owner"): Account {
  return {
    id: "personal-cash", householdId, ownerMemberId, visibility: "private",
    name: "Private cash", accountClass: "asset", type: "cash", currency: "PHP",
    openingBalance: 123.45, currentBalance: 123.45, isActive: true,
    createdAt: now, updatedAt: now,
  };
}

function selectHousehold(id: string, memberId = "new-member") {
  saveStoredData(HFOS_STORAGE_KEYS.household, {
    id, householdName: "Recovery test", country: "PH", currency: "PHP",
    timezone: "Asia/Manila", createdAt: now, updatedAt: now,
    authenticatedLink: {
      remoteHouseholdId: "remote-household", migrationId: "member-bootstrap",
      ownerMemberId: memberId, linkedByUserId: "new-user", linkedAt: now.toISOString(),
    },
    members: [{
      id: memberId, householdId: id, displayName: "Test member", role: "member",
      userId: "new-user", isActive: true, createdAt: now, updatedAt: now,
    }],
  });
}

test("archive is not reassigned even when a new household reuses the same local member id", () => {
  const { localStorage } = installBrowserStorage();
  const original = account("archive-original", "member-001");
  saveStoredData(HFOS_STORAGE_KEYS.accounts, []);
  saveStoredData(HFOS_STORAGE_KEYS.memberPersonalAccounts, [original]);
  const archiveBefore = localStorage.getItem(HFOS_STORAGE_KEYS.memberPersonalAccounts);
  selectHousehold("archive-new", "member-001");
  assert.deepEqual(AccountRepository.findAll(), []);
  assert.equal(AccountRepository.replaceForHousehold("archive-new", []), true);
  assert.deepEqual(AccountRepository.findAll(), []);
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.memberPersonalAccounts), archiveBefore);
  selectHousehold("archive-original", "member-001");
  assert.equal(AccountRepository.findById(original.id)?.ownerMemberId, "member-001");
  assert.equal(AccountRepository.findById(original.id)?.currentBalance, 123.45);
});

test("creating a new household account preserves displaced private data without adopting it", () => {
  const { localStorage } = installBrowserStorage();
  const original = account("create-original");
  saveStoredData(HFOS_STORAGE_KEYS.accounts, [original]);
  selectHousehold("create-new");
  const current = account("create-new", "new-member");
  assert.equal(AccountRepository.create(current)?.ownerMemberId, "new-member");
  const archived = JSON.parse(localStorage.getItem(HFOS_STORAGE_KEYS.memberPersonalAccounts)!).data;
  assert.equal(archived.length, 2);
  assert.equal(archived.find((item: Account) => item.householdId === "create-original").ownerMemberId, "original-owner");
  assert.equal(AccountRepository.delete(current.id), true);
  const afterDelete = JSON.parse(localStorage.getItem(HFOS_STORAGE_KEYS.memberPersonalAccounts)!).data;
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].householdId, "create-original");
  selectHousehold("create-original");
  assert.equal(AccountRepository.findById(original.id)?.currentBalance, 123.45);
});

test("account replacement fails without erasing originals when archival storage fails", () => {
  const { localStorage } = installBrowserStorage();
  saveStoredData(HFOS_STORAGE_KEYS.accounts, [account("failed-original")]);
  selectHousehold("failed-new");
  const before = localStorage.getItem(HFOS_STORAGE_KEYS.accounts);
  const setItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    if (key === HFOS_STORAGE_KEYS.memberPersonalAccounts) throw new Error("Quota exceeded");
    setItem(key, value);
  };
  assert.equal(AccountRepository.replaceForHousehold("failed-new", []), false);
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.accounts), before);
  assert.deepEqual(AccountRepository.findAll(), []);
});

test("account replacement preserves malformed legacy archives and refuses destructive replacement", () => {
  const { localStorage } = installBrowserStorage();
  saveStoredData(HFOS_STORAGE_KEYS.accounts, [account("invalid-original")]);
  localStorage.setItem(HFOS_STORAGE_KEYS.memberPersonalAccounts, "invalid legacy content");
  selectHousehold("invalid-new");
  const before = localStorage.getItem(HFOS_STORAGE_KEYS.accounts);
  assert.equal(AccountRepository.replaceForHousehold("invalid-new", []), false);
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.accounts), before);
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.memberPersonalAccounts), "invalid legacy content");
});

test("an archived id cannot override an incoming account belonging to another owner", () => {
  installBrowserStorage();
  selectHousehold("collision-household");
  saveStoredData(HFOS_STORAGE_KEYS.accounts, []);
  saveStoredData(HFOS_STORAGE_KEYS.memberPersonalAccounts, [account("collision-household")]);
  assert.equal(AccountRepository.replaceForHousehold("collision-household", [
    account("collision-household", "new-member"),
  ]), true);
  assert.equal(AccountRepository.findById("personal-cash")?.ownerMemberId, "new-member");
});
