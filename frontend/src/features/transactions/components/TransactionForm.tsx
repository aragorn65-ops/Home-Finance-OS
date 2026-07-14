import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type { Account } from "../../accounts/models/Account";
import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type { OperationResult } from "../../../shared/types";

import type { Transaction } from "../models/Transaction";

import {
  createExpenseAllocationForm,
  type ExpenseAllocationForm,
} from "../models/ExpenseAllocationForm";

import {
  calculatePersonalItemsTotal,
  createPersonalExpenseItem,
  type PersonalExpenseItem,
} from "../models/PersonalExpenseItem";

import {
  defaultTransactionForm,
  type TransactionForm as TransactionFormData,
} from "../models/TransactionForm";

type TransactionFormProps = {
  accounts: Account[];
  members?: HouseholdMember[];
  initialValues?: TransactionFormData;
  submitLabel?: string;

  onSubmit: (
    form: TransactionFormData
  ) => OperationResult<Transaction>;

  onCancel?: () => void;
};

interface SharedPersonalPreview {
  includedCount: number;
  personalTotal: number;
  commonAmount: number;
  excessAmount: number;
  isOverAmount: boolean;
  commonShareAmounts: number[];
  finalAmounts: number[];
}

function getDefaultFormValues(
  defaultMemberId: string
): TransactionFormData {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  return {
    ...defaultTransactionForm,

    paidByMemberId:
      defaultMemberId,

    transactionDate:
      today,
  };
}

function toCents(
  amount: number
): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(
    amount * 100
  );
}

function normalizePersonalItems(
  allocation: ExpenseAllocationForm
): PersonalExpenseItem[] {
  const storedItems =
    allocation.personalItems?.map(
      (item) => ({
        ...item,
      })
    ) ?? [];

  if (storedItems.length > 0) {
    return storedItems;
  }

  if (
    allocation.personalAmount > 0
  ) {
    return [
      {
        id: crypto.randomUUID(),
        description:
          "Personal items",
        amount:
          allocation.personalAmount,
      },
    ];
  }

  return [];
}

function calculateEqualPreview(
  amount: number,
  allocations: ExpenseAllocationForm[]
): number[] {
  const includedIndexes =
    allocations
      .map(
        (
          allocation,
          index
        ) => ({
          allocation,
          index,
        })
      )
      .filter(
        ({ allocation }) =>
          allocation.isIncluded
      )
      .map(
        ({ index }) =>
          index
      );

  const result =
    allocations.map(() => 0);

  if (
    includedIndexes.length === 0 ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return result;
  }

  const totalCents =
    toCents(amount);

  const baseShareCents =
    Math.floor(
      totalCents /
        includedIndexes.length
    );

  const remainderCents =
    totalCents -
    baseShareCents *
      includedIndexes.length;

  includedIndexes.forEach(
    (
      allocationIndex,
      includedIndex
    ) => {
      const isLast =
        includedIndex ===
        includedIndexes.length - 1;

      result[allocationIndex] =
        (
          baseShareCents +
          (
            isLast
              ? remainderCents
              : 0
          )
        ) / 100;
    }
  );

  return result;
}

function calculateSharedPersonalPreview(
  amount: number,
  allocations: ExpenseAllocationForm[]
): SharedPersonalPreview {
  const includedIndexes =
    allocations
      .map(
        (
          allocation,
          index
        ) => ({
          allocation,
          index,
        })
      )
      .filter(
        ({ allocation }) =>
          allocation.isIncluded
      )
      .map(
        ({ index }) =>
          index
      );

  const commonShareAmounts =
    allocations.map(() => 0);

  const finalAmounts =
    allocations.map(() => 0);

  const totalCents =
    Math.max(
      0,
      toCents(amount)
    );

  const personalAmountCents =
    allocations.map(
      (allocation) => {
        if (!allocation.isIncluded) {
          return 0;
        }

        return Math.max(
          0,
          toCents(
            allocation.personalAmount
          )
        );
      }
    );

  const personalTotalCents =
    personalAmountCents.reduce(
      (
        total,
        personalAmount
      ) =>
        total +
        personalAmount,
      0
    );

  const rawCommonAmountCents =
    totalCents -
    personalTotalCents;

  const isOverAmount =
    rawCommonAmountCents < 0;

  const commonAmountCents =
    Math.max(
      0,
      rawCommonAmountCents
    );

  const excessAmountCents =
    Math.max(
      0,
      personalTotalCents -
        totalCents
    );

  if (
    includedIndexes.length > 0 &&
    !isOverAmount
  ) {
    const baseCommonShareCents =
      Math.floor(
        commonAmountCents /
          includedIndexes.length
      );

    const remainderCents =
      commonAmountCents -
      baseCommonShareCents *
        includedIndexes.length;

    includedIndexes.forEach(
      (
        allocationIndex,
        includedIndex
      ) => {
        const isLastIncluded =
          includedIndex ===
          includedIndexes.length - 1;

        const commonShareCents =
          baseCommonShareCents +
          (
            isLastIncluded
              ? remainderCents
              : 0
          );

        commonShareAmounts[
          allocationIndex
        ] =
          commonShareCents / 100;
      }
    );
  }

  allocations.forEach(
    (
      allocation,
      index
    ) => {
      if (!allocation.isIncluded) {
        finalAmounts[index] = 0;

        return;
      }

      finalAmounts[index] =
        (
          personalAmountCents[
            index
          ] +
          toCents(
            commonShareAmounts[
              index
            ]
          )
        ) / 100;
    }
  );

  return {
    includedCount:
      includedIndexes.length,

    personalTotal:
      personalTotalCents / 100,

    commonAmount:
      commonAmountCents / 100,

    excessAmount:
      excessAmountCents / 100,

    isOverAmount,

    commonShareAmounts,

    finalAmounts,
  };
}

function formatAmount(
  amount: number
): string {
  return new Intl.NumberFormat(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

export default function TransactionForm({
  accounts,
  members = [],
  initialValues,
  submitLabel = "Save Transaction",
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const activeMembers =
    members.filter(
      (member) =>
        member.isActive
    );

  const defaultMemberId =
    activeMembers.find(
      (member) =>
        member.role === "owner"
    )?.id ??
    activeMembers[0]?.id ??
    "";

  const [form, setForm] =
    useState<TransactionFormData>(
      initialValues ??
        getDefaultFormValues(
          defaultMemberId
        )
    );

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const nextForm =
      initialValues
        ? {
            ...initialValues,

            paidByMemberId:
              initialValues
                .paidByMemberId ||
              defaultMemberId,

            allocations:
              initialValues.allocations.map(
                (allocation) => {
                  const personalItems =
                    normalizePersonalItems(
                      allocation
                    );

                  return {
                    ...allocation,

                    personalItems,

                    personalAmount:
                      calculatePersonalItemsTotal(
                        personalItems
                      ),
                  };
                }
              ),
          }
        : getDefaultFormValues(
            defaultMemberId
          );

    setForm(nextForm);
    setErrors({});
    setMessage("");
  }, [
    initialValues,
    defaultMemberId,
  ]);

  const availableAccounts =
    useMemo(() => {
      return accounts.filter(
        (account) => {
          if (!account.isActive) {
            return false;
          }

          if (
            account.visibility ===
            "household"
          ) {
            return true;
          }

          return (
            account.ownerMemberId ===
            form.paidByMemberId
          );
        }
      );
    }, [
      accounts,
      form.paidByMemberId,
    ]);

  const equalPreview =
    useMemo(
      () =>
        calculateEqualPreview(
          form.amount,
          form.allocations
        ),
      [
        form.amount,
        form.allocations,
      ]
    );

  const sharedPersonalPreview =
    useMemo(
      () =>
        calculateSharedPersonalPreview(
          form.amount,
          form.allocations
        ),
      [
        form.amount,
        form.allocations,
      ]
    );

  const enteredAllocationTotal =
    useMemo(() => {
      return form.allocations.reduce(
        (
          total,
          allocation
        ) =>
          total +
          (
            allocation.isIncluded
              ? allocation
                  .allocatedAmount
              : 0
          ),
        0
      );
    }, [form.allocations]);

  const sharedPersonalFinalTotal =
    useMemo(() => {
      return sharedPersonalPreview
        .finalAmounts
        .reduce(
          (
            total,
            amount
          ) =>
            total + amount,
          0
        );
    }, [sharedPersonalPreview]);

  const updateField = <
    Field extends keyof TransactionFormData,
  >(
    field: Field,
    value: TransactionFormData[Field]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });

    setMessage("");
  };

  const clearAllocationError = () => {
    setErrors((current) => {
      if (!current.allocations) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors.allocations;

      return nextErrors;
    });

    setMessage("");
  };

  const handleMemberChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const memberId =
      event.target.value;

    setForm((current) => {
      const sourceAccount =
        accounts.find(
          (account) =>
            account.id ===
            current.sourceAccountId
        );

      const destinationAccount =
        accounts.find(
          (account) =>
            account.id ===
            current.destinationAccountId
        );

      const shouldClearSource =
        sourceAccount?.visibility ===
          "private" &&
        sourceAccount.ownerMemberId !==
          memberId;

      const shouldClearDestination =
        destinationAccount?.visibility ===
          "private" &&
        destinationAccount.ownerMemberId !==
          memberId;

      return {
        ...current,

        paidByMemberId:
          memberId,

        sourceAccountId:
          shouldClearSource
            ? ""
            : current.sourceAccountId,

        destinationAccountId:
          shouldClearDestination
            ? ""
            : current.destinationAccountId,
      };
    });

    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      delete nextErrors.paidByMemberId;
      delete nextErrors.sourceAccountId;
      delete nextErrors.destinationAccountId;

      return nextErrors;
    });

    setMessage("");
  };

  const handleTypeChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const type =
      event.target
        .value as TransactionFormData["type"];

    setForm((current) => ({
      ...current,

      type,

      sourceAccountId:
        type === "income"
          ? ""
          : current.sourceAccountId,

      destinationAccountId:
        type === "expense"
          ? ""
          : current.destinationAccountId,

      splitMethod:
        type === "expense"
          ? current.splitMethod
          : "none",

      allocations:
        type === "expense"
          ? current.allocations
          : [],
    }));

    setErrors({});
    setMessage("");
  };

  const handleAmountChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue =
      event.target.value;

    updateField(
      "amount",
      rawValue === ""
        ? 0
        : Number(rawValue)
    );
  };

  const handleSplitMethodChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const splitMethod =
      event.target
        .value as TransactionFormData["splitMethod"];

    setForm((current) => ({
      ...current,

      splitMethod,

      allocations:
        splitMethod === "none"
          ? []
          : activeMembers.map(
              (member) => {
                const existing =
                  current.allocations.find(
                    (allocation) =>
                      allocation.memberId ===
                      member.id
                  );

                const allocation =
                  existing ??
                  createExpenseAllocationForm(
                    member.id
                  );

                const personalItems =
                  splitMethod ===
                  "shared-personal"
                    ? normalizePersonalItems(
                        allocation
                      )
                    : [];

                return {
                  ...allocation,

                  allocatedAmount:
                    splitMethod ===
                      "exact" ||
                    splitMethod ===
                      "submeter"
                      ? allocation
                          .allocatedAmount
                      : 0,

                  personalItems,

                  personalAmount:
                    calculatePersonalItemsTotal(
                      personalItems
                    ),
                };
              }
            ),
    }));

    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      delete nextErrors.splitMethod;
      delete nextErrors.allocations;

      return nextErrors;
    });

    setMessage("");
  };

  const updateAllocation = (
    memberId: string,
    changes: Partial<ExpenseAllocationForm>
  ) => {
    setForm((current) => ({
      ...current,

      allocations:
        current.allocations.map(
          (allocation) =>
            allocation.memberId ===
            memberId
              ? {
                  ...allocation,
                  ...changes,
                }
              : allocation
        ),
    }));

    clearAllocationError();
  };

  const updatePersonalItems = (
    memberId: string,
    updater: (
      items: PersonalExpenseItem[]
    ) => PersonalExpenseItem[]
  ) => {
    setForm((current) => ({
      ...current,

      allocations:
        current.allocations.map(
          (allocation) => {
            if (
              allocation.memberId !==
              memberId
            ) {
              return allocation;
            }

            const nextItems =
              updater(
                allocation.personalItems ??
                  []
              );

            return {
              ...allocation,

              personalItems:
                nextItems,

              personalAmount:
                calculatePersonalItemsTotal(
                  nextItems
                ),
            };
          }
        ),
    }));

    clearAllocationError();
  };

  const handleIncludedChange = (
    memberId: string,
    isIncluded: boolean
  ) => {
    updateAllocation(
      memberId,
      {
        isIncluded,

        allocatedAmount: 0,

        personalAmount: 0,

        personalItems: [],
      }
    );
  };

  const handleAllocationAmountChange = (
    memberId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue =
      event.target.value;

    updateAllocation(
      memberId,
      {
        allocatedAmount:
          rawValue === ""
            ? 0
            : Number(rawValue),
      }
    );
  };

  const handleAddPersonalItem = (
    memberId: string
  ) => {
    updatePersonalItems(
      memberId,
      (items) => [
        ...items,
        createPersonalExpenseItem(),
      ]
    );
  };

  const handlePersonalItemChange = (
    memberId: string,
    itemId: string,
    changes: Partial<PersonalExpenseItem>
  ) => {
    updatePersonalItems(
      memberId,
      (items) =>
        items.map(
          (item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...changes,
                }
              : item
        )
    );
  };

  const handlePersonalItemAmountChange = (
    memberId: string,
    itemId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue =
      event.target.value;

    handlePersonalItemChange(
      memberId,
      itemId,
      {
        amount:
          rawValue === ""
            ? 0
            : Number(rawValue),
      }
    );
  };

  const handleRemovePersonalItem = (
    memberId: string,
    itemId: string
  ) => {
    updatePersonalItems(
      memberId,
      (items) =>
        items.filter(
          (item) =>
            item.id !== itemId
        )
    );
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    let submissionForm =
      form;

    if (
      form.type === "expense" &&
      form.splitMethod === "equal"
    ) {
      submissionForm = {
        ...form,

        allocations:
          form.allocations.map(
            (
              allocation,
              index
            ) => ({
              ...allocation,

              allocatedAmount:
                allocation.isIncluded
                  ? equalPreview[index] ??
                    0
                  : 0,

              personalAmount: 0,

              personalItems: [],
            })
          ),
      };
    }

    if (
      form.type === "expense" &&
      form.splitMethod ===
        "shared-personal"
    ) {
      const allocationsWithTotals =
        form.allocations.map(
          (allocation) => {
            if (!allocation.isIncluded) {
              return {
                ...allocation,

                allocatedAmount: 0,

                personalAmount: 0,

                personalItems: [],
              };
            }

            const personalItems =
              allocation.personalItems ??
              [];

            return {
              ...allocation,

              personalItems,

              personalAmount:
                calculatePersonalItemsTotal(
                  personalItems
                ),
            };
          }
        );

      const submissionPreview =
        calculateSharedPersonalPreview(
          form.amount,
          allocationsWithTotals
        );

      submissionForm = {
        ...form,

        allocations:
          allocationsWithTotals.map(
            (
              allocation,
              index
            ) => ({
              ...allocation,

              allocatedAmount:
                allocation.isIncluded
                  ? submissionPreview
                      .finalAmounts[
                        index
                      ] ?? 0
                  : 0,
            })
          ),
      };
    }

    const result =
      onSubmit(submissionForm);

    if (!result.success) {
      setErrors(
        result.errors ?? {}
      );

      setMessage(
        result.message ??
          "Unable to save the transaction."
      );

      return;
    }

    setErrors({});
    setMessage(
      result.message ?? ""
    );
  };

  const showAllocationAmountInputs =
    form.splitMethod === "exact" ||
    form.splitMethod === "submeter";

  const showPersonalItemInputs =
    form.splitMethod ===
    "shared-personal";

  const normalizedCategory =
    form.category
      .trim()
      .toLowerCase();

  const isUtilityCategory =
    normalizedCategory.includes(
      "electricity"
    ) ||
    normalizedCategory.includes(
      "water"
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border bg-white p-6"
    >
      {message && (
        <div
          className={
            Object.keys(errors).length > 0
              ? "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          }
        >
          {message}
        </div>
      )}

      {errors.general && (
        <p className="text-sm text-destructive">
          {errors.general}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-type"
            className="text-sm font-medium text-foreground"
          >
            Transaction Type
          </label>

          <select
            id="transaction-type"
            value={form.type}
            onChange={handleTypeChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="income">
              Income
            </option>

            <option value="expense">
              Expense
            </option>

            <option value="transfer">
              Transfer
            </option>
          </select>

          {errors.type && (
            <p className="text-sm text-destructive">
              {errors.type}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-amount"
            className="text-sm font-medium text-foreground"
          >
            Amount
          </label>

          <input
            id="transaction-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount || ""}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />

          {errors.amount && (
            <p className="text-sm text-destructive">
              {errors.amount}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-member"
            className="text-sm font-medium text-foreground"
          >
            {form.type === "expense"
              ? "Paid By"
              : "Recorded By"}
          </label>

          <select
            id="transaction-member"
            value={form.paidByMemberId}
            onChange={handleMemberChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select household member
            </option>

            {activeMembers.map(
              (member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.displayName}
                </option>
              )
            )}
          </select>

          {errors.paidByMemberId && (
            <p className="text-sm text-destructive">
              {errors.paidByMemberId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-visibility"
            className="text-sm font-medium text-foreground"
          >
            Visibility
          </label>

          <select
            id="transaction-visibility"
            value={form.visibility}
            onChange={(event) =>
              updateField(
                "visibility",
                event.target
                  .value as TransactionFormData["visibility"]
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="household">
              Household
            </option>

            <option value="participants">
              Participants Only
            </option>

            <option value="private">
              Private
            </option>
          </select>

          {errors.visibility && (
            <p className="text-sm text-destructive">
              {errors.visibility}
            </p>
          )}
        </div>
      </div>

      {(form.type === "expense" ||
        form.type === "transfer") && (
        <div className="space-y-2">
          <label
            htmlFor="source-account"
            className="text-sm font-medium text-foreground"
          >
            {form.type === "expense"
              ? "Payment Account"
              : "Source Account"}
          </label>

          <select
            id="source-account"
            value={form.sourceAccountId}
            onChange={(event) =>
              updateField(
                "sourceAccountId",
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select account
            </option>

            {availableAccounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                  {account.visibility ===
                  "private"
                    ? " — Private"
                    : ""}
                  {account.accountClass ===
                  "liability"
                    ? " — Liability"
                    : ""}
                </option>
              )
            )}
          </select>

          {errors.sourceAccountId && (
            <p className="text-sm text-destructive">
              {errors.sourceAccountId}
            </p>
          )}
        </div>
      )}

      {(form.type === "income" ||
        form.type === "transfer") && (
        <div className="space-y-2">
          <label
            htmlFor="destination-account"
            className="text-sm font-medium text-foreground"
          >
            Destination Account
          </label>

          <select
            id="destination-account"
            value={
              form.destinationAccountId
            }
            onChange={(event) =>
              updateField(
                "destinationAccountId",
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select destination account
            </option>

            {availableAccounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                  disabled={
                    form.type ===
                      "transfer" &&
                    account.id ===
                      form.sourceAccountId
                  }
                >
                  {account.name}
                  {account.visibility ===
                  "private"
                    ? " — Private"
                    : ""}
                  {account.accountClass ===
                  "liability"
                    ? " — Liability"
                    : ""}
                </option>
              )
            )}
          </select>

          {errors.destinationAccountId && (
            <p className="text-sm text-destructive">
              {errors.destinationAccountId}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="transaction-category"
            className="text-sm font-medium text-foreground"
          >
            Category
          </label>

          <input
            id="transaction-category"
            type="text"
            value={form.category}
            onChange={(event) =>
              updateField(
                "category",
                event.target.value
              )
            }
            placeholder="Example: Electricity or Groceries"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />

          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="transaction-date"
            className="text-sm font-medium text-foreground"
          >
            Transaction Date
          </label>

          <input
            id="transaction-date"
            type="date"
            value={form.transactionDate}
            onChange={(event) =>
              updateField(
                "transactionDate",
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />

          {errors.transactionDate && (
            <p className="text-sm text-destructive">
              {errors.transactionDate}
            </p>
          )}
        </div>
      </div>

      {form.type === "expense" && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="font-medium text-foreground">
              Divide Expense
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose which members participate and how
              the expense should be divided.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="split-method"
              className="text-sm font-medium text-foreground"
            >
              Split Method
            </label>

            <select
              id="split-method"
              value={form.splitMethod}
              onChange={
                handleSplitMethodChange
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="none">
                Individual Expense
              </option>

              <option value="equal">
                Divide Equally
              </option>

              <option value="shared-personal">
                Shared + Personal Items
              </option>

              <option value="exact">
                Enter Exact Amounts
              </option>

              {isUtilityCategory && (
                <option value="submeter">
                  Utility / Submeter Allocation
                </option>
              )}
            </select>

            {errors.splitMethod && (
              <p className="text-sm text-destructive">
                {errors.splitMethod}
              </p>
            )}
          </div>

          {form.splitMethod !==
            "none" && (
            <div className="space-y-3">
              {form.allocations.map(
                (
                  allocation,
                  index
                ) => {
                  const member =
                    activeMembers.find(
                      (item) =>
                        item.id ===
                        allocation.memberId
                    );

                  return (
                    <div
                      key={
                        allocation.memberId
                      }
                      className="rounded-md border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {member?.displayName ??
                              "Unknown Member"}
                          </p>

                          {form.splitMethod ===
                            "equal" &&
                            allocation.isIncluded && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                Equal share:{" "}
                                {formatAmount(
                                  equalPreview[
                                    index
                                  ] ?? 0
                                )}
                              </p>
                            )}

                          {form.splitMethod ===
                            "shared-personal" &&
                            allocation.isIncluded && (
                              <div className="mt-1 space-y-1 text-sm">
                                <p className="text-muted-foreground">
                                  Common share:{" "}
                                  {formatAmount(
                                    sharedPersonalPreview
                                      .commonShareAmounts[
                                        index
                                      ] ?? 0
                                  )}
                                </p>

                                <p className="font-medium text-foreground">
                                  Final share:{" "}
                                  {formatAmount(
                                    sharedPersonalPreview
                                      .finalAmounts[
                                        index
                                      ] ?? 0
                                  )}
                                </p>
                              </div>
                            )}

                          {!allocation.isIncluded && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Opted out — allocation is 0.00
                            </p>
                          )}
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              allocation.isIncluded
                            }
                            onChange={(
                              event
                            ) =>
                              handleIncludedChange(
                                allocation.memberId,
                                event.target
                                  .checked
                              )
                            }
                            className="h-4 w-4 rounded border"
                          />

                          <span className="text-sm text-foreground">
                            Included
                          </span>
                        </label>
                      </div>

                      {showPersonalItemInputs &&
                        allocation.isIncluded && (
                          <div className="mt-4 space-y-3 rounded-md bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Personal Items
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  Add items used only by this member.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleAddPersonalItem(
                                    allocation.memberId
                                  )
                                }
                                className="rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                              >
                                Add Personal Item
                              </button>
                            </div>

                            {allocation.personalItems
                              .length === 0 && (
                              <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                No personal items added.
                              </p>
                            )}

                            {allocation.personalItems.map(
                              (
                                item,
                                itemIndex
                              ) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[minmax(0,1fr)_10rem_auto]"
                                >
                                  <div className="space-y-2">
                                    <label
                                      htmlFor={`personal-item-description-${item.id}`}
                                      className="text-xs font-medium text-foreground"
                                    >
                                      Item{" "}
                                      {itemIndex +
                                        1}
                                    </label>

                                    <input
                                      id={`personal-item-description-${item.id}`}
                                      type="text"
                                      value={
                                        item.description
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handlePersonalItemChange(
                                          allocation.memberId,
                                          item.id,
                                          {
                                            description:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      placeholder="Example: Shampoo"
                                      className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label
                                      htmlFor={`personal-item-amount-${item.id}`}
                                      className="text-xs font-medium text-foreground"
                                    >
                                      Amount
                                    </label>

                                    <input
                                      id={`personal-item-amount-${item.id}`}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={
                                        item.amount ||
                                        ""
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handlePersonalItemAmountChange(
                                          allocation.memberId,
                                          item.id,
                                          event
                                        )
                                      }
                                      placeholder="0.00"
                                      className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemovePersonalItem(
                                          allocation.memberId,
                                          item.id
                                        )
                                      }
                                      className="w-full rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 md:w-auto"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )
                            )}

                            <div className="flex items-center justify-between border-t pt-3 text-sm">
                              <span className="text-muted-foreground">
                                Personal Subtotal
                              </span>

                              <span className="font-semibold text-foreground">
                                {formatAmount(
                                  allocation.personalAmount
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                      {showAllocationAmountInputs &&
                        allocation.isIncluded && (
                          <div className="mt-4 space-y-2">
                            <label
                              htmlFor={`allocation-${allocation.memberId}`}
                              className="text-sm font-medium text-foreground"
                            >
                              Allocated Amount
                            </label>

                            <input
                              id={`allocation-${allocation.memberId}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                allocation.allocatedAmount ||
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                handleAllocationAmountChange(
                                  allocation.memberId,
                                  event
                                )
                              }
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </div>
                        )}

                      <div className="mt-4 space-y-2">
                        <label
                          htmlFor={`allocation-note-${allocation.memberId}`}
                          className="text-sm font-medium text-foreground"
                        >
                          Allocation Note
                        </label>

                        <input
                          id={`allocation-note-${allocation.memberId}`}
                          type="text"
                          value={
                            allocation.notes
                          }
                          onChange={(
                            event
                          ) =>
                            updateAllocation(
                              allocation.memberId,
                              {
                                notes:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          placeholder={
                            allocation.isIncluded
                              ? "Optional note"
                              : "Reason for opting out"
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                    </div>
                  );
                }
              )}

              {form.splitMethod ===
                "shared-personal" && (
                <div className="space-y-3 rounded-md bg-muted/40 px-4 py-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Total Expense
                    </span>

                    <span className="font-medium text-foreground">
                      {formatAmount(
                        form.amount
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Personal Items Total
                    </span>

                    <span className="font-medium text-foreground">
                      {formatAmount(
                        sharedPersonalPreview
                          .personalTotal
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Common Items Amount
                    </span>

                    <span className="font-medium text-foreground">
                      {formatAmount(
                        sharedPersonalPreview
                          .commonAmount
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Participating Members
                    </span>

                    <span className="font-medium text-foreground">
                      {
                        sharedPersonalPreview
                          .includedCount
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t pt-3">
                    <span className="font-medium text-foreground">
                      Final Allocation Total
                    </span>

                    <span className="font-semibold text-foreground">
                      {formatAmount(
                        sharedPersonalFinalTotal
                      )}{" "}
                      /{" "}
                      {formatAmount(
                        form.amount
                      )}
                    </span>
                  </div>

                  {sharedPersonalPreview
                    .isOverAmount && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                      Personal items exceed the total
                      expense by{" "}
                      {formatAmount(
                        sharedPersonalPreview
                          .excessAmount
                      )}
                      .
                    </p>
                  )}
                </div>
              )}

              {showAllocationAmountInputs && (
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Allocation Total
                  </span>

                  <span className="font-semibold text-foreground">
                    {formatAmount(
                      enteredAllocationTotal
                    )}{" "}
                    /{" "}
                    {formatAmount(
                      form.amount
                    )}
                  </span>
                </div>
              )}

              {errors.allocations && (
                <p className="text-sm text-destructive">
                  {errors.allocations}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="transaction-description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>

        <input
          id="transaction-description"
          type="text"
          value={form.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value
            )
          }
          placeholder="Describe this transaction"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />

        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="transaction-notes"
          className="text-sm font-medium text-foreground"
        >
          Notes
        </label>

        <textarea
          id="transaction-notes"
          rows={4}
          value={form.notes}
          onChange={(event) =>
            updateField(
              "notes",
              event.target.value
            )
          }
          placeholder="Optional notes"
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) =>
            updateField(
              "isActive",
              event.target.checked
            )
          }
          className="h-4 w-4 rounded border"
        />

        <span className="text-sm text-foreground">
          Active transaction
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}