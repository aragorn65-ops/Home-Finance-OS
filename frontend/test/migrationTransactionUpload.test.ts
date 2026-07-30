import assert from "node:assert/strict";
import test from "node:test";

import {
  createMigrationTransactionUploadPayload,
} from "../src/features/auth/components/migrationTransactionUpload.ts";
import type {
  Transaction,
} from "../src/features/transactions/models/Transaction.ts";

test(
  "creates transaction upload payload scoped to the local household",
  () => {
    const transaction: Transaction = {
      id:
        "transaction-1",
      householdId:
        "household-1",
      createdByMemberId:
        "member-local-1",
      paidByMemberId:
        "member-local-1",
      expenseSplitMethod:
        "equal",
      visibility:
        "household",
      type:
        "expense",
      amount:
        75,
      enteredAmount:
        75,
      enteredCurrency:
        "PHP",
      baseCurrency:
        "PHP",
      baseAmount:
        75,
      exchangeRate:
        1,
      exchangeRateEffectiveDate:
        new Date(
          "2026-07-21T00:00:00Z"
        ),
      exchangeRateSource:
        "manual",
      sourceAccountId:
        "account-1",
      destinationAccountId:
        null,
      category:
        "Groceries",
      description:
        "Market",
      notes:
        "Fresh produce",
      attachments:
        [
          {
            id:
              "attachment-1",
            category:
              "receipt",
            fileName:
              "receipt.jpg",
            mimeType:
              "image/jpeg",
            sizeBytes:
              2048,
            dataUrl:
              "data:image/jpeg;base64,large-image-body",
            createdAt:
              new Date(
                "2026-07-21T13:30:00Z"
              ),
          },
        ],
      transactionDate:
        new Date(
          "2026-07-21T12:00:00Z"
        ),
      isActive:
        true,
      createdAt:
        new Date(
          "2026-07-21T13:00:00Z"
        ),
      updatedAt:
        new Date(
          "2026-07-21T14:00:00Z"
        ),
    };

    const payload =
      createMigrationTransactionUploadPayload(
        [
          transaction,
          {
            ...transaction,
            id:
              "transaction-other",
            householdId:
              "household-2",
          },
        ],
        "household-1"
      );

    assert.equal(
      payload.expectedTransactionCount,
      1
    );
    assert.deepEqual(
      payload.transactions,
      [
        {
          id:
            "transaction-1",
          expenseSplitMethod:
            "equal",
          visibility:
            "household",
          type:
            "expense",
          amount:
            75,
          enteredAmount:
            75,
          enteredCurrency:
            "PHP",
          baseCurrency:
            "PHP",
          baseAmount:
            75,
          exchangeRate:
            1,
          exchangeRateEffectiveDate:
            "2026-07-21",
          exchangeRateSource:
            "manual",
          exchangeRateProvider:
            undefined,
          sourceAccountId:
            "account-1",
          destinationAccountId:
            null,
          category:
            "Groceries",
          description:
            "Market",
          notes:
            "Fresh produce",
          attachments:
            [
              {
                id:
                  "attachment-1",
                category:
                  "receipt",
                fileName:
                  "receipt.jpg",
                mimeType:
                  "image/jpeg",
                sizeBytes:
                  2048,
                dataUrl:
                  "",
                createdAt:
                  new Date(
                    "2026-07-21T13:30:00Z"
                  ),
              },
            ],
          transactionDate:
            "2026-07-21",
          isActive:
            true,
          createdAt:
            "2026-07-21T13:00:00.000Z",
          updatedAt:
            "2026-07-21T14:00:00.000Z",
        },
      ]
    );
  }
);
