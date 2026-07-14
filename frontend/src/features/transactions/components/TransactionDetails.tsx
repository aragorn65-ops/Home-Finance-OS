import type { Transaction } from "../models/Transaction";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import TransactionService from "../services/TransactionService";

type TransactionDetailsProps = {
  transaction: Transaction;
  sourceAccountName?: string;
  destinationAccountName?: string;
  onClose?: () => void;
  onEdit?: (
    transaction: Transaction
  ) => void;
};

const amountFormatter =
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatAmount(
  amount: number
): string {
  return amountFormatter.format(
    amount
  );
}

export default function TransactionDetails({
  transaction,
  onClose,
  onEdit,
}: TransactionDetailsProps) {
  const allocations =
    transaction.type === "expense"
      ? TransactionService
          .getExpenseAllocations(
            transaction.id
          )
          .filter(
            (allocation) =>
              allocation.isIncluded
          )
      : [];

  const formattedTransactionDate =
    transaction.transactionDate
      .toLocaleDateString();

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div className="border-b pb-5">
        <p className="text-sm font-medium text-muted-foreground">
          Total Grocery
        </p>

        <p className="mt-1 text-3xl font-semibold text-foreground">
          {formatAmount(
            transaction.amount
          )}
        </p>
      </div>

      <dl className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Transaction Date
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {formattedTransactionDate}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Transaction ID
          </dt>

          <dd className="mt-1 break-all text-sm text-foreground">
            {transaction.id}
          </dd>
        </div>
      </dl>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Member Summary
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Shared amount and personal grocery items
            assigned to each member.
          </p>
        </div>

        {allocations.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-center">
            <p className="text-sm text-muted-foreground">
              No member allocations recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allocations.map(
              (allocation) => {
                const member =
                  HouseholdMemberService
                    .getMemberById(
                      allocation.memberId
                    );

                const personalItems =
                  allocation.personalItems ??
                  [];

                const personalSubtotal =
                  allocation.personalAmount ??
                  personalItems.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      item.amount,
                    0
                  );

                const sharedAmount =
                  Math.max(
                    0,
                    Math.round(
                      (
                        allocation
                          .allocatedAmount -
                        personalSubtotal
                      ) * 100
                    ) / 100
                  );

                return (
                  <div
                    key={allocation.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {member?.displayName ??
                            "Unknown Member"}
                        </h4>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Member grocery allocation
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Total Share
                        </p>

                        <p className="font-semibold text-foreground">
                          {formatAmount(
                            allocation
                              .allocatedAmount
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">
                          Shared Amount
                        </span>

                        <span className="text-sm font-semibold text-foreground">
                          {formatAmount(
                            sharedAmount
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <h5 className="text-sm font-medium text-foreground">
                          Personal Items
                        </h5>

                        <span className="text-sm font-semibold text-foreground">
                          {formatAmount(
                            personalSubtotal
                          )}
                        </span>
                      </div>

                      {personalItems.length ===
                      0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No personal items recorded.
                        </p>
                      ) : (
                        <div className="mt-3 divide-y rounded-md border">
                          {personalItems.map(
                            (item) => (
                              <div
                                key={
                                  item.id
                                }
                                className="flex items-center justify-between gap-4 px-3 py-2"
                              >
                                <span className="text-sm text-foreground">
                                  {item.description ||
                                    "Personal item"}
                                </span>

                                <span className="text-sm font-medium text-foreground">
                                  {formatAmount(
                                    item.amount
                                  )}
                                </span>
                              </div>
                            )
                          )}

                          <div className="flex items-center justify-between gap-4 bg-muted/20 px-3 py-2">
                            <span className="text-sm font-medium text-foreground">
                              Personal Items Subtotal
                            </span>

                            <span className="text-sm font-semibold text-foreground">
                              {formatAmount(
                                personalSubtotal
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {(onClose || onEdit) && (
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Close
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() =>
                onEdit(transaction)
              }
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Edit Transaction
            </button>
          )}
        </div>
      )}
    </div>
  );
}