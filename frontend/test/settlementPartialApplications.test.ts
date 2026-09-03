import assert from "node:assert/strict";
import test from "node:test";

import SettlementService from "../src/features/settlements/services/SettlementService.ts";
import AllocationPaymentService from "../src/features/settlements/services/AllocationPaymentService.ts";
import SettlementRepository from "../src/features/settlements/repositories/SettlementRepository.ts";
import SettlementApplicationRepository from "../src/features/settlements/repositories/SettlementApplicationRepository.ts";
import SettlementOverpaymentCreditService from "../src/features/settlements/services/SettlementOverpaymentCreditService.ts";
import {
  recalculateManualSettlementApplications,
} from "../src/features/settlements/services/manualSettlementApplications.ts";
import ExpenseAllocationRepository from "../src/features/transactions/repositories/ExpenseAllocationRepository.ts";
import {
  HFOS_STORAGE_KEYS,
  saveStoredData,
} from "../src/shared/storage/localStorageStore.ts";
import {
  installBrowserStorage,
} from "./storageTestUtils.ts";

const householdId =
  "household-partial-settlement";
const payerMemberId = "member-payer";
const receiverMemberId =
  "member-receiver";

test("manual application recalculation applies remainder to the next checked allocation", () => {
  const applications =
    recalculateManualSettlementApplications(
      [
        {
          expenseAllocationId:
            "allocation-groceries",
          transactionId:
            "transaction-groceries",
          fromMemberId:
            payerMemberId,
          toMemberId:
            receiverMemberId,
          transactionDate:
            new Date(
              "2026-08-01T00:00:00.000Z"
            ),
          category: "Groceries",
          description: "Groceries",
          allocatedAmount: 3000,
          paidAmount: 0,
          outstandingAmount: 3000,
          paymentStatus: "unpaid",
        },
        {
          expenseAllocationId:
            "allocation-electricity",
          transactionId:
            "transaction-electricity",
          fromMemberId:
            payerMemberId,
          toMemberId:
            receiverMemberId,
          transactionDate:
            new Date(
              "2026-08-02T00:00:00.000Z"
            ),
          category: "Utilities",
          description: "Electricity",
          allocatedAmount: 6000,
          paidAmount: 0,
          outstandingAmount: 6000,
          paymentStatus: "unpaid",
        },
      ],
      [
        {
          expenseAllocationId:
            "allocation-groceries",
          isSelected: true,
          appliedAmount: 0,
        },
        {
          expenseAllocationId:
            "allocation-electricity",
          isSelected: true,
          appliedAmount: 0,
        },
      ],
      5000
    );

  assert.deepEqual(
    applications,
    [
      {
        expenseAllocationId:
          "allocation-groceries",
        isSelected: true,
        appliedAmount: 3000,
      },
      {
        expenseAllocationId:
          "allocation-electricity",
        isSelected: true,
        appliedAmount: 2000,
      },
    ]
  );
});

function seedPartialSettlementFixture() {
  installBrowserStorage();

  const now =
    "2026-08-06T00:00:00.000Z";

  saveStoredData(
    HFOS_STORAGE_KEYS.household,
    {
      id: householdId,
      householdName:
        "Partial Settlement Household",
      country: "PH",
      currency: "PHP",
      timezone: "Asia/Manila",
      members: [
        {
          id: payerMemberId,
          householdId,
          displayName: "Payer",
          role: "member",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: receiverMemberId,
          householdId,
          displayName: "Receiver",
          role: "member",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
  );

  SettlementApplicationRepository
    .findAll()
    .forEach((application) => {
      SettlementApplicationRepository
        .delete(application.id);
    });

  SettlementRepository
    .findAll()
    .forEach((settlement) => {
      SettlementRepository
        .delete(settlement.id);
    });

  saveStoredData(
    HFOS_STORAGE_KEYS.transactions,
    [
      {
        id: "transaction-groceries",
        householdId,
        paidByMemberId:
          receiverMemberId,
        expenseSplitMethod: "exact",
        visibility: "household",
        type: "expense",
        amount: 3000,
        sourceAccountId: null,
        destinationAccountId: null,
        category: "Groceries",
        description: "Groceries",
        notes: "",
        transactionDate:
          "2026-08-01T00:00:00.000Z",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "transaction-electricity",
        householdId,
        paidByMemberId:
          receiverMemberId,
        expenseSplitMethod: "exact",
        visibility: "household",
        type: "expense",
        amount: 6000,
        sourceAccountId: null,
        destinationAccountId: null,
        category: "Utilities",
        description: "Electricity",
        notes: "",
        transactionDate:
          "2026-08-02T00:00:00.000Z",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]
  );

  saveStoredData(
    HFOS_STORAGE_KEYS.expenseAllocations,
    [
      {
        id: "allocation-groceries",
        transactionId:
          "transaction-groceries",
        paidByMemberId:
          receiverMemberId,
        memberId: payerMemberId,
        isIncluded: true,
        allocatedAmount: 3000,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "allocation-electricity",
        transactionId:
          "transaction-electricity",
        paidByMemberId:
          receiverMemberId,
        memberId: payerMemberId,
        isIncluded: true,
        allocatedAmount: 6000,
        createdAt: now,
        updatedAt: now,
      },
    ]
  );

  saveStoredData(
    HFOS_STORAGE_KEYS.settlements,
    []
  );
  saveStoredData(
    HFOS_STORAGE_KEYS.settlementApplications,
    []
  );
}

test("manual settlement records full and partial applications for one payment", () => {
  seedPartialSettlementFixture();

  const result =
    SettlementService.create({
      householdId,
      fromMemberId: payerMemberId,
      toMemberId: receiverMemberId,
      amount: 5000,
      settlementDate: "2026-08-06",
      sourceAccountId: "",
      destinationAccountId: "",
      applicationMethod: "manual",
      applications: [
        {
          expenseAllocationId:
            "allocation-groceries",
          isSelected: true,
          appliedAmount: 3000,
        },
        {
          expenseAllocationId:
            "allocation-electricity",
          isSelected: true,
          appliedAmount: 2000,
        },
      ],
      referenceNumber: "",
      notes: "",
      attachments: [],
      isActive: true,
    });

  assert.equal(
    result.success,
    true
  );

  const settlement =
    result.data;

  assert.ok(settlement);

  const applications =
    SettlementService.getApplications(
      settlement.id
    );

  assert.deepEqual(
    applications.map(
      (application) => ({
        expenseAllocationId:
          application.expenseAllocationId,
        appliedAmount:
          application.appliedAmount,
      })
    ),
    [
      {
        expenseAllocationId:
          "allocation-groceries",
        appliedAmount: 3000,
      },
      {
        expenseAllocationId:
          "allocation-electricity",
        appliedAmount: 2000,
      },
    ]
  );

  const groceries =
    ExpenseAllocationRepository.findById(
      "allocation-groceries"
    );
  const electricity =
    ExpenseAllocationRepository.findById(
      "allocation-electricity"
    );

  assert.ok(groceries);
  assert.ok(electricity);

  assert.equal(
    AllocationPaymentService
      .getPaymentDetails(groceries)
      .paymentStatus,
    "paid"
  );
  assert.equal(
    AllocationPaymentService
      .getPaymentDetails(electricity)
      .paidAmount,
    2000
  );
  assert.equal(
    AllocationPaymentService
      .getPaymentDetails(electricity)
      .outstandingAmount,
    4000
  );
  assert.equal(
    AllocationPaymentService
      .getPaymentDetails(electricity)
      .paymentStatus,
    "partially-paid"
  );
});

test("manual settlement rejects applying more than an allocation outstanding amount", () => {
  seedPartialSettlementFixture();

  const result =
    SettlementService.create({
      householdId,
      fromMemberId: payerMemberId,
      toMemberId: receiverMemberId,
      amount: 3500,
      settlementDate: "2026-08-06",
      sourceAccountId: "",
      destinationAccountId: "",
      applicationMethod: "manual",
      applications: [
        {
          expenseAllocationId:
            "allocation-groceries",
          isSelected: true,
          appliedAmount: 3500,
        },
      ],
      referenceNumber: "",
      notes: "",
      attachments: [],
      isActive: true,
    });

  assert.equal(
    result.success,
    false
  );

  assert.equal(
    result.errors?.applications,
    "An applied amount cannot exceed the allocation's outstanding amount."
  );

  const groceries =
    ExpenseAllocationRepository.findById(
      "allocation-groceries"
    );

  assert.ok(groceries);

  assert.equal(
    AllocationPaymentService
      .getPaymentDetails(groceries)
      .paidAmount,
    0
  );
});

test("manual settlement records overpayment credit when payment exceeds applied allocations", () => {
  seedPartialSettlementFixture();

  const result =
    SettlementService.create({
      householdId,
      fromMemberId: payerMemberId,
      toMemberId: receiverMemberId,
      amount: 3500,
      settlementDate: "2026-08-06",
      sourceAccountId: "",
      destinationAccountId: "",
      applicationMethod: "manual",
      applications: [
        {
          expenseAllocationId:
            "allocation-groceries",
          isSelected: true,
          appliedAmount: 3000,
        },
      ],
      referenceNumber: "",
      notes: "",
      attachments: [],
      isActive: true,
    });

  assert.equal(
    result.success,
    true
  );

  const settlement =
    result.data;

  assert.ok(settlement);

  assert.equal(
    settlement.amount,
    3500
  );

  const credits =
    SettlementOverpaymentCreditService
      .getOpenCredits(
        householdId
      );

  assert.equal(
    credits.length,
    1
  );

  assert.equal(
    credits[0]?.creditMemberId,
    payerMemberId
  );

  assert.equal(
    credits[0]?.counterpartyMemberId,
    receiverMemberId
  );

  assert.equal(
    credits[0]?.amount,
    500
  );
});
