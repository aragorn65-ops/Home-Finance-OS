import assert from "node:assert/strict";
import test from "node:test";
import TransactionRepository from "../src/features/transactions/repositories/TransactionRepository.ts";
import { browserCoreSnapshotLocalWriter } from "../src/features/auth/services/browserCoreSnapshotLocalWriter.ts";
import { installBrowserStorage } from "./storageTestUtils.ts";
import type { Transaction } from "../src/features/transactions/models/Transaction.ts";
import { HFOS_STORAGE_KEYS, saveStoredData } from "../src/shared/storage/localStorageStore.ts";

const date = new Date("2026-09-23T00:00:00Z");
function selectHousehold(id: string) {
  saveStoredData(HFOS_STORAGE_KEYS.household, { id, householdName: "Test", country: "PH",
    currency: "PHP", timezone: "Asia/Manila", members: [], createdAt: date, updatedAt: date });
}
const file = { id: "receipt", category: "receipt" as const, fileName: "receipt.png",
  mimeType: "image/png", sizeBytes: 3, dataUrl: "data:image/png;base64,YWJj", createdAt: date };
function transaction(householdId: string): Transaction {
  return { id: "purchase", householdId, type: "expense", amount: 123,
    sourceAccountId: null, destinationAccountId: null, category: "Groceries",
    description: "Purchase", notes: "", visibility: "household", transactionDate: date,
    isActive: true, createdAt: date, updatedAt: date, attachments: [file] };
}

test("returning from preview and repeated metadata refreshes retain the local receipt", () => {
  installBrowserStorage();
  const original = transaction("preview-return");
  selectHousehold(original.householdId);
  TransactionRepository.replaceForHousehold(original.householdId, [original]);
  const remote = { ...original, notes: "New cloud notes", attachments: [{ ...file, dataUrl: "" }] };
  for (let i = 0; i < 2; i++) {
    assert.equal(browserCoreSnapshotLocalWriter.replaceTransactions(original.householdId, [remote]), true);
    const saved = TransactionRepository.findAll().find((record) => record.householdId === original.householdId)!;
    assert.equal(saved.attachments?.[0].dataUrl, file.dataUrl);
    assert.equal(saved.notes, "New cloud notes");
    assert.equal(saved.amount, 123);
  }
});

test("cloud replacement and attachment removal remain authoritative", () => {
  installBrowserStorage();
  const original = transaction("preview-replacement");
  selectHousehold(original.householdId);
  TransactionRepository.replaceForHousehold(original.householdId, [original]);
  const replacement = { ...file, dataUrl: "data:image/png;base64,ZGVm" };
  browserCoreSnapshotLocalWriter.replaceTransactions(original.householdId, [{ ...original, attachments: [replacement] }]);
  const read = () => TransactionRepository.findAll().find((record) => record.householdId === original.householdId)!;
  assert.equal(read().attachments?.[0].dataUrl, replacement.dataUrl);
  browserCoreSnapshotLocalWriter.replaceTransactions(original.householdId, [{ ...original, attachments: [] }]);
  assert.deepEqual(read().attachments, []);
});

test("metadata with a different file identity does not reuse the old receipt", () => {
  installBrowserStorage();
  const original = transaction("preview-identity");
  selectHousehold(original.householdId);
  TransactionRepository.replaceForHousehold(original.householdId, [original]);
  browserCoreSnapshotLocalWriter.replaceTransactions(original.householdId, [{ ...original,
    attachments: [{ ...file, fileName: "replacement.png", dataUrl: "" }] }]);
  const saved = TransactionRepository.findAll().find((record) => record.householdId === original.householdId)!;
  assert.equal(saved.attachments?.[0].dataUrl, "");
});

test("fresh member browser cannot borrow file content from another household", () => {
  installBrowserStorage();
  selectHousehold("other-household");
  TransactionRepository.replaceForHousehold("other-household", [transaction("other-household")]);
  selectHousehold("fresh-member");
  const remote = { ...transaction("fresh-member"), attachments: [{ ...file, dataUrl: "" }] };
  browserCoreSnapshotLocalWriter.replaceTransactions("fresh-member", [remote]);
  const saved = TransactionRepository.findAll().find((record) => record.householdId === "fresh-member")!;
  assert.equal(saved.attachments?.[0].dataUrl, "");
});
