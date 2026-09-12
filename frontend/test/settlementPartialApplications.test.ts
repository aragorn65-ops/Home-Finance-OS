import assert from "node:assert/strict";
import test from "node:test";

import SettlementService from "../src/features/settlements/services/SettlementService.ts";
import SettlementApplicationService from "../src/features/settlements/services/SettlementApplicationService.ts";
import { loadHousehold, saveHouseholdMembers } from "../src/features/household/services/householdStorage.ts";
import AllocationPaymentService from "../src/features/settlements/services/AllocationPaymentService.ts";
import SettlementRepository from "../src/features/settlements/repositories/SettlementRepository.ts";
import SettlementApplicationRepository from "../src/features/settlements/repositories/SettlementApplicationRepository.ts";
import SettlementOverpaymentCreditService from "../src/features/settlements/services/SettlementOverpaymentCreditService.ts";
import SettlementAllocationService from "../src/features/settlements/services/SettlementAllocationService.ts";
import {
  recalculateManualSettlementApplications,
} from "../src/features/settlements/services/manualSettlementApplications.ts";
import ExpenseAllocationRepository from "../src/features/transactions/repositories/ExpenseAllocationRepository.ts";
import TransactionRepository from "../src/features/transactions/repositories/TransactionRepository.ts";
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

test("manual groceries payment keeps priority over earlier electricity and preserves partial amounts", () => {
  const base = { fromMemberId: payerMemberId, toMemberId: receiverMemberId, description: "", paidAmount: 0, paymentStatus: "unpaid" as const };
  const electricity = { ...base, expenseAllocationId: "electricity", transactionId: "electricity", transactionDate: new Date("2026-07-01"), category: "Electricity", allocatedAmount: 4499.91, outstandingAmount: 4499.91 };
  const groceries = { ...base, expenseAllocationId: "groceries", transactionId: "groceries", transactionDate: new Date("2026-07-10"), category: "Groceries", allocatedAmount: 4814.13, outstandingAmount: 4814.13 };
  const current = [
    { expenseAllocationId: "groceries", isSelected: true, appliedAmount: 4814.13 },
    { expenseAllocationId: "electricity", isSelected: true, appliedAmount: 0 },
  ];
  for (const options of [[electricity, groceries], [groceries, electricity]]) {
    const result = recalculateManualSettlementApplications(options, current, 5000);
    assert.equal(result.find((row) => row.expenseAllocationId === "groceries")?.appliedAmount, 4814.13);
    assert.equal(result.find((row) => row.expenseAllocationId === "electricity")?.appliedAmount, 185.87);
    assert.equal(Math.round((4499.91 - 185.87) * 100) / 100, 4314.04);
    assert.deepEqual(recalculateManualSettlementApplications(options, result, 5000), result);
    // Lowering the payment must surface validation, not silently redirect a manual allocation.
    assert.deepEqual(recalculateManualSettlementApplications(options, result, 4000), result);
  }
});

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
  TransactionRepository.findAll();
  ExpenseAllocationRepository.findAll();

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

test("manual and oldest-first saves accept repaired member aliases without rewriting shares", () => {
  for (const method of ["manual", "oldest-first"] as const) {
    seedPartialSettlementFixture();
    saveHouseholdMembers(loadHousehold()!.members.map((member) => ({ ...member,
      remoteMemberId: `remote-${member.id}`, referenceIds: [`legacy-${member.id}`] })));
    const allocations = ExpenseAllocationRepository.findAll().map((allocation) => ({ ...allocation,
      memberId: `remote-${payerMemberId}`, paidByMemberId: `legacy-${receiverMemberId}` }));
    assert.ok(ExpenseAllocationRepository.replaceForHousehold(householdId, allocations));
    const before = ExpenseAllocationRepository.findAll();
    const result = SettlementService.create({ householdId, fromMemberId: payerMemberId, toMemberId: receiverMemberId,
      amount: 3000, settlementDate: "2026-08-03", sourceAccountId: "", destinationAccountId: "",
      applicationMethod: method,
      applications: method === "manual" ? [{ expenseAllocationId: "allocation-groceries", isSelected: true, appliedAmount: 3000 }] : [],
      referenceNumber: "ALIAS-SETTLEMENT", notes: "", attachments: [], isActive: true });
    assert.equal(result.success, true, JSON.stringify(result.errors));
    assert.ok(result.data);
    assert.equal(SettlementApplicationRepository.findBySettlementId(result.data.id)[0].expenseAllocationId, "allocation-groceries");
    assert.deepEqual(ExpenseAllocationRepository.findAll(), before);
  }
});

test("alias-aware applications still reject other members, self-shares and other households", () => {
  for (const scenario of ["receiver", "payer", "self", "household"]) {
    seedPartialSettlementFixture();
    saveHouseholdMembers(loadHousehold()!.members.map((member) => ({ ...member, remoteMemberId: `remote-${member.id}` })));
    const allocations = ExpenseAllocationRepository.findAll().map((allocation) => ({ ...allocation,
      memberId: scenario === "payer" ? "unrelated-member" : `remote-${payerMemberId}`,
      paidByMemberId: scenario === "receiver" ? "unrelated-member" : scenario === "self" ? payerMemberId : `remote-${receiverMemberId}` }));
    assert.ok(ExpenseAllocationRepository.replaceForHousehold(householdId, allocations));
    const requestHousehold = scenario === "household" ? "other-household" : householdId;
    const result = SettlementApplicationService.buildManualApplications("new-id", requestHousehold,
      payerMemberId, receiverMemberId, 100,
      [{ expenseAllocationId: "allocation-groceries", isSelected: true, appliedAmount: 100 }]);
    assert.equal(result.success, false, scenario);
    assert.equal(SettlementApplicationRepository.findAll().length, 0);
    const oldest = SettlementApplicationService.buildOldestFirstApplications("new-id", requestHousehold, payerMemberId, receiverMemberId, 100);
    assert.equal(oldest.success, false, scenario);
  }
});

test("redating a synced settlement preserves its original member references and application IDs", () => {
  seedPartialSettlementFixture();
  const original = SettlementService.create({ householdId, fromMemberId: payerMemberId, toMemberId: receiverMemberId,
    amount: 1299.32, settlementDate: "2026-09-10", sourceAccountId: "", destinationAccountId: "",
    applicationMethod: "oldest-first", applications: [], referenceNumber: "SET-DATE-TEST", notes: "", attachments: [], isActive: true });
  assert.ok(original.success && original.data);
  // A synced record can retain a remote member reference even though the local picker uses local IDs.
  const existing = { ...original.data, toMemberId: "remote-owner-reference" };
  SettlementRepository.update(existing);
  const applications = SettlementApplicationRepository.findBySettlementId(existing.id);
  const allocations = ExpenseAllocationRepository.findAll();
  const result = SettlementService.update(existing.id, { householdId, fromMemberId: existing.fromMemberId,
    toMemberId: existing.toMemberId, amount: existing.amount, settlementDate: "2026-07-14",
    sourceAccountId: "", destinationAccountId: "", applicationMethod: "oldest-first", applications: [],
    referenceNumber: "SET-DATE-TEST", notes: "", attachments: [], isActive: true });
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(result.data?.settlementDate.getMonth(), 6);
  assert.equal(result.data?.settlementDate.getDate(), 14);
  assert.equal(result.data?.id, existing.id);
  assert.equal(result.data?.toMemberId, existing.toMemberId);
  assert.equal(result.data?.amount, 1299.32);
  assert.deepEqual(SettlementApplicationRepository.findBySettlementId(existing.id), applications);
  assert.deepEqual(ExpenseAllocationRepository.findAll(), allocations);
  const invalidChange = SettlementService.update(existing.id, { householdId, fromMemberId: existing.fromMemberId,
    toMemberId: "unrelated-member", amount: existing.amount, settlementDate: "2026-07-14",
    sourceAccountId: "", destinationAccountId: "", applicationMethod: "oldest-first", applications: [],
    referenceNumber: "SET-DATE-TEST", notes: "", attachments: [], isActive: true });
  assert.equal(invalidChange.success, false);
  assert.deepEqual(SettlementApplicationRepository.findBySettlementId(existing.id), applications);
});

test("settlement date correction accepts a local picker ID for a stored member email", () => {
  seedPartialSettlementFixture();
  const household = JSON.parse(window.localStorage.getItem(HFOS_STORAGE_KEYS.household)!);
  household.data.members.find((member: { id: string }) => member.id === receiverMemberId).email = "receiver@example.com";
  window.localStorage.setItem(HFOS_STORAGE_KEYS.household, JSON.stringify(household));
  const created = SettlementService.create({ householdId, fromMemberId: payerMemberId, toMemberId: receiverMemberId,
    amount: 1299.32, settlementDate: "2026-09-10", sourceAccountId: "", destinationAccountId: "",
    applicationMethod: "oldest-first", applications: [], referenceNumber: "ALIAS-EDIT", notes: "", attachments: [], isActive: true });
  assert.ok(created.data);
  SettlementRepository.update({ ...created.data, toMemberId: "receiver@example.com" });
  const applications = SettlementApplicationRepository.findBySettlementId(created.data.id);
  const updated = SettlementService.update(created.data.id, { householdId, fromMemberId: payerMemberId, toMemberId: receiverMemberId,
    amount: 1299.32, settlementDate: "2026-07-14", sourceAccountId: "", destinationAccountId: "",
    applicationMethod: "oldest-first", applications: [], referenceNumber: "ALIAS-EDIT", notes: "", attachments: [], isActive: true });
  assert.equal(updated.success, true, JSON.stringify(updated.errors));
  assert.equal(updated.data?.amount, 1299.32);
  assert.equal(updated.data?.toMemberId, "receiver@example.com");
  assert.deepEqual(SettlementApplicationRepository.findBySettlementId(created.data.id), applications);
});

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

test("a settlement without application links is not classified as overpayment", () => {
  seedPartialSettlementFixture();
  const now = new Date("2026-09-03T06:39:35.000Z");

  SettlementRepository.create({
    id: "settlement-with-missing-links",
    householdId,
    fromMemberId: payerMemberId,
    toMemberId: receiverMemberId,
    amount: 28901.1,
    settlementDate: now,
    applicationMethod: "oldest-first",
    referenceNumber: "REGULAR-SETTLEMENT",
    attachments: [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  assert.deepEqual(
    SettlementOverpaymentCreditService.getOpenCredits(householdId),
    []
  );
});

test("overpayment credit offsets later obligations without changing allocation records", () => {
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

  const now =
    new Date(
      "2026-08-08T00:00:00.000Z"
    );

  const futureTransaction =
    TransactionRepository.create({
      id: "transaction-future-water",
      householdId,
      paidByMemberId:
        receiverMemberId,
      expenseSplitMethod: "exact",
      visibility: "household",
      type: "expense",
      amount: 700,
      sourceAccountId: null,
      destinationAccountId: null,
      category: "Utilities",
      description: "Future water",
      notes: "",
      transactionDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

  assert.ok(futureTransaction);

  const futureAllocations =
    ExpenseAllocationRepository
      .createMany([
        {
          id: "allocation-future-water",
          transactionId:
            "transaction-future-water",
          paidByMemberId:
            receiverMemberId,
          memberId: payerMemberId,
          isIncluded: true,
          allocatedAmount: 700,
          createdAt: now,
          updatedAt: now,
        },
      ]);

  assert.ok(futureAllocations);

  const rawFutureAllocation =
    ExpenseAllocationRepository.findById(
      "allocation-future-water"
    );

  assert.ok(rawFutureAllocation);

  assert.equal(
    AllocationPaymentService
      .getPaymentDetails(
        rawFutureAllocation
      )
      .outstandingAmount,
    700
  );

  const adjustedAllocations =
    SettlementOverpaymentCreditService
      .applyCreditOffsetsToAllocations(
        householdId,
        SettlementAllocationService
          .getOutstandingAllocations(
            householdId
          )
      );

  const adjustedFutureAllocation =
    adjustedAllocations.find(
      (allocation) =>
        allocation.expenseAllocationId ===
        "allocation-future-water"
    );

  assert.ok(adjustedFutureAllocation);

  assert.equal(
    adjustedFutureAllocation
      .outstandingAmount,
    200
  );

  const remainingCredits =
    SettlementOverpaymentCreditService
      .getRemainingOpenCredits(
        householdId,
        SettlementAllocationService
          .getOutstandingAllocations(
            householdId
          )
      );

  assert.deepEqual(
    remainingCredits,
    []
  );
});
