import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultTransactionForm,
  type TransactionForm,
} from "../src/features/transactions/models/TransactionForm.ts";
import TransactionValidator from "../src/features/transactions/validators/TransactionValidator.ts";

test(
  "transaction validation accepts metadata-only attachments",
  () => {
    const form:
      TransactionForm = {
      ...defaultTransactionForm,
      type: "income",
      amount: 100,
      enteredAmount: 100,
      enteredCurrency: "PHP",
      baseAmount: 100,
      exchangeRate: 1,
      destinationAccountId:
        "account-1",
      category: "Salary",
      description:
        "Monthly income",
      transactionDate:
        "2026-07-30",
      splitMethod: "none",
      attachments: [
        {
          id: "attachment-1",
          category: "receipt",
          fileName:
            "receipt.jpg",
          mimeType:
            "image/jpeg",
          sizeBytes: 512000,
          dataUrl: "",
          createdAt:
            new Date(
              "2026-07-30T09:00:00Z"
            ),
        },
      ],
    };

    const validation =
      TransactionValidator.validate(
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
  }
);
