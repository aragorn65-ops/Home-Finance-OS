import assert from "node:assert/strict";
import test from "node:test";
import { getSettlementPreviews } from "../src/features/dashboard/services/settlementPreviews.ts";
import type { SettlementAllocationOption } from "../src/features/settlements/models/SettlementAllocationOption.ts";

function allocation(from: string, to: string, category: string, amount: number): SettlementAllocationOption {
  return { expenseAllocationId: `${from}-${to}-${category}`, transactionId: category, fromMemberId: from, toMemberId: to,
    category, outstandingAmount: amount, allocatedAmount: amount, paidAmount: 0, paymentStatus: "unpaid",
    description: "", transactionDate: new Date("2026-07-01") };
}

test("dashboard groups member aliases once without changing category or total amounts", () => {
  const aliases: Record<string, string> = { "remote-rasha": "rasha", "rasha@example.com": "rasha", "remote-dadi": "dadi", "member-001": "dadi", "remote-lyn": "lyn" };
  const rows = [
    allocation("rasha", "dadi", "Groceries", 2967.06),
    allocation("rasha", "dadi", "Internet", 0.02),
    allocation("remote-rasha", "remote-dadi", "Water", 604.60),
    allocation("rasha@example.com", "member-001", "Groceries", 331),
    allocation("lyn", "dadi", "Internet", 1099.32),
    allocation("remote-lyn", "remote-dadi", "Water", 200),
  ];
  const before = structuredClone(rows);
  const result = getSettlementPreviews(rows, (id) => aliases[id] ?? id);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((row) => [row.fromMemberId, row.toMemberId, row.amount]), [["rasha", "dadi", 3902.68], ["lyn", "dadi", 1299.32]]);
  assert.deepEqual(result[0].items.map((item) => [item.category, item.amount]), [["Groceries", 3298.06], ["Water", 604.6], ["Internet", 0.02]]);
  assert.equal(result.reduce((sum, row) => sum + row.amount, 0), 5202);
  assert.deepEqual(rows, before);
});

test("dashboard keeps unrelated identities separate and retains every category", () => {
  const rows = ["Groceries", "Water", "Internet", "Electricity"].map((category) => allocation("unknown-a", "owner", category, 10));
  rows.push(allocation("unknown-b", "owner", "Water", 5));
  rows.push(allocation("unknown-a", "owner", "Other", 0));
  const result = getSettlementPreviews(rows, (id) => id);
  assert.equal(result.length, 2);
  assert.equal(result[0].items.length, 4);
  assert.equal(result[0].amount, 40);
  assert.equal(result[1].amount, 5);
});
