import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync(new URL("../src/features/dashboard/pages/DashboardPage.tsx", import.meta.url), "utf8");
const settlements = readFileSync(new URL("../src/features/settlements/pages/SettlementsPage.tsx", import.meta.url), "utf8");

test("dashboard renders every outstanding member pair and category without truncating the breakdown", () => {
  assert.match(dashboard, /\{settlementPreviews\s*\.map\(\(preview\)/);
  assert.match(dashboard, /\{preview.items\s*\.map\(\(item\)/);
  assert.doesNotMatch(dashboard, /settlementPreviews\s*\.slice/);
  assert.doesNotMatch(dashboard, /preview.items\s*\.slice/);
});

test("dashboard and itemized settlements retain the same credit-adjusted monthly source", () => {
  for (const source of [dashboard, settlements]) {
    assert.match(source, /SettlementAllocationService\s*\.getOutstandingAllocations\(/);
    assert.match(source, /SettlementOverpaymentCreditService\s*\.applyCreditOffsetsToAllocations\(/);
    assert.match(source, /creditAdjustedOutstandingAllocations.filter\(\s*\(allocation\) =>\s*isSameMonth\(\s*allocation.transactionDate,\s*selectedMonth/);
  }
  assert.match(dashboard, /getSettlementPreviews\(\s*monthlyOutstandingAllocations/);
  assert.match(dashboard, /settlementPreviews.reduce\(\s*\(total, preview\) =>\s*total \+ preview.amount/);
});
