import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("provider payment correction opens the existing household transaction editor", () => {
  const utilities = readFileSync(new URL("../src/features/utilities/pages/UtilitiesPage.tsx", import.meta.url), "utf8");
  const transactions = readFileSync(new URL("../src/features/transactions/pages/TransactionsPage.tsx", import.meta.url), "utf8");
  assert.match(utilities, /canRepairPaidBy && providerBill.transactionId/);
  assert.ok(utilities.includes('/app/transactions?edit=${encodeURIComponent(providerBill.transactionId)}'));
  assert.match(utilities, /Edit Payment/);
  assert.match(transactions, /requestedEditId \|\| isReadOnlyMember \|\| !household\?\.id/);
  assert.match(transactions, /record.id === requestedEditId && record.householdId === household.id/);
  assert.match(transactions, /setSelectedTransaction\(transaction\);\s+setDialogMode\("edit"\)/);
  assert.match(transactions, /next.delete\("edit"\)/);
});
