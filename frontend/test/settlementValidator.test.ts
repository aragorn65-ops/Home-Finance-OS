import assert from "node:assert/strict";
import test from "node:test";

import SettlementValidator from "../src/features/settlements/validators/SettlementValidator.ts";
import {
  defaultSettlementForm,
  type SettlementForm,
} from "../src/features/settlements/models/SettlementForm.ts";

test("settlement validation ignores removed attachment data", () => {
  const form: SettlementForm = {
    ...defaultSettlementForm,

    householdId: "household-1",
    fromMemberId: "member-1",
    toMemberId: "member-2",
    amount: 100,
    settlementDate: "2026-07-30",
    attachments: [
      {
        id: "",
        category: "receipt",
        fileName: "",
        mimeType: "text/plain",
        sizeBytes: 0,
        dataUrl: "",
        createdAt:
          new Date("invalid"),
      },
    ],
  };

  const validation =
    SettlementValidator.validate(
      form
    );

  assert.equal(
    validation.isValid,
    true
  );

  assert.equal(
    validation.errors.attachments,
    undefined
  );
});
