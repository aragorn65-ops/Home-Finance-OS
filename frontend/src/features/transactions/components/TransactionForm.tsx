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

function calculateEqualPreview(
  amount: number,
  allocations: ExpenseAllocationForm[]
): number[] {
  const includedIndexes = allocations
    .map((allocation, index) => ({
      allocation,
      index,
    }))
    .filter(
      ({ allocation }) =>
        allocation.isIncluded
    )
    .map(({ index }) => index);

  const result = allocations.map(() => 0);

  if (
    includedIndexes.length === 0 ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return result;
  }

  const totalCents =
    Math.round(amount * 100);

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
    (allocationIndex, includedIndex) => {
      const isLast =
        includedIndex ===
        includedIndexes.length - 1;

      result[allocationIndex] =
        (
          baseShareCents +
          (isLast
            ? remainderCents
            : 0)
        ) / 100;
    }
  );

  return result;
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
      (member) => member.isActive
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

  const enteredAllocationTotal =
    useMemo(() => {
      return form.allocations.reduce(
        (total, allocation) =>
          total +
          (allocation.isIncluded
            ? allocation.allocatedAmount
            : 0),
        0
      );
    }, [form.allocations]);

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

                return (
                  existing ??
                  createExpenseAllocationForm(
                    member.id
                  )
                );
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

  const handleIncludedChange = (
    memberId: string,
    isIncluded: boolean
  ) => {
    updateAllocation(
      memberId,
      {
        isIncluded,

        allocatedAmount:
          isIncluded
            ? 0
            : 0,
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

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    let submissionForm = form;

    if (
      form.type === "expense" &&
      form.splitMethod === "equal"
    ) {
      submissionForm = {
        ...form,

        allocations:
          form.allocations.map(
            (allocation, index) => ({
              ...allocation,

              allocatedAmount:
                allocation.isIncluded
                  ? equalPreview[index] ??
                    0
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
            value={form.destinationAccountId}
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
              Choose who shares this expense. Members may
              opt out or receive an exact amount.
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
                      <div className="flex flex-wrap items-center justify-between gap-3">
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