import assert from "node:assert/strict";
import test from "node:test";
import { defaultSettlementForm, type SettlementForm } from "../src/features/settlements/models/SettlementForm.ts";
import { preserveRecordedApplications } from "../src/features/settlements/services/settlementEditSubmission.ts";
import SettlementValidator from "../src/features/settlements/validators/SettlementValidator.ts";

const original: SettlementForm = {
  ...defaultSettlementForm, householdId: "household", fromMemberId: "rasha", toMemberId: "dadi",
  amount: 100, settlementDate: "2026-09-30", applicationMethod: "manual",
  applications: [{ expenseAllocationId: "already-paid", isSelected: true, appliedAmount: 100 }],
};

test("receipt-only manual edit retains paid items missing from the unpaid picker", () => {
  const receipt = { id: "receipt", category: "receipt" as const, fileName: "receipt.png",
    mimeType: "image/png", sizeBytes: 3, dataUrl: "data:image/png;base64,YWJj", createdAt: new Date() };
  const result = preserveRecordedApplications({ ...original, applications: [], attachments: [receipt] }, original, false);
  assert.deepEqual(result.applications, original.applications);
  assert.notEqual(result.applications[0], original.applications[0]);
  assert.deepEqual(result.attachments, [receipt]);
  assert.equal(SettlementValidator.validate(result).isValid, true);
  assert.deepEqual(original.attachments, []);
});

test("explicit allocation edits and payment changes still require their own validation", () => {
  const empty = { ...original, applications: [] };
  assert.equal(preserveRecordedApplications(empty, original, true), empty);
  assert.equal(preserveRecordedApplications(empty, undefined, false), empty);
  for (const change of [{ amount: 90 }, { fromMemberId: "lyn" }, { toMemberId: "lyn" },
    { householdId: "other" }, { applicationMethod: "oldest-first" as const },
    { sourceAccountId: "cash" }, { destinationAccountId: "bank" }, { isActive: false }]) {
    const draft = { ...empty, ...change };
    assert.equal(preserveRecordedApplications(draft, original, false), draft);
  }
});

test("notes and date corrections preserve recorded allocations too", () => {
  const result = preserveRecordedApplications({ ...original, applications: [], notes: "Receipt added",
    settlementDate: "2026-10-01" }, original, false);
  assert.deepEqual(result.applications, original.applications);
  assert.equal(result.notes, "Receipt added");
  assert.equal(result.settlementDate, "2026-10-01");
});
