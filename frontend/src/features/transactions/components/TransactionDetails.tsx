import type { Transaction } from "../models/Transaction";

import {
  findHouseholdMemberByReference,
} from "../../household/services/householdMemberResolution";

import TransactionService from "../services/TransactionService";
import resolveTransactionMemberId from "../services/transactionMemberResolution";
import formatCurrency from "../../../shared/utils/formatCurrency";
import openAttachmentPreview, {
  hasAttachmentPreviewData,
} from "../../../shared/utils/openAttachmentPreview";
import {
  normalizeTransactionCategory,
} from "../models/TransactionCategory";

type TransactionDetailsProps = {
  transaction: Transaction;
  sourceAccountName?: string;
  destinationAccountName?: string;
  currency?: string;
  onClose?: () => void;
  onEdit?: (
    transaction: Transaction
  ) => void;
};

function formatAmount(
  amount: number,
  currency?: string
): string {
  return formatCurrency(
    amount,
    currency
  );
}

export default function TransactionDetails({
  transaction,
  currency,
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

  const transactionMemberId =
    resolveTransactionMemberId(
      transaction,
      allocations
    );

  const transactionMember =
    transactionMemberId
      ? findHouseholdMemberByReference(
          transactionMemberId,
          transaction.householdId
        )
      : undefined;

  const showEnteredIncome =
    transaction.type === "income" &&
    transaction.enteredCurrency &&
    transaction.enteredCurrency !==
      (
        transaction.baseCurrency ??
        currency
      );

  const rateSource =
    transaction.exchangeRateSource === "api"
      ? `API rate${transaction.exchangeRateProvider ? ` from ${transaction.exchangeRateProvider}` : ""}`
      : "Manual rate";

  return (
    <div className="hfos-transaction-details space-y-6 rounded-lg border bg-white p-6">
      <div className="border-b pb-5">
        <p className="text-sm font-medium text-muted-foreground">
          Total Transaction
        </p>

        <p className="mt-1 text-3xl font-semibold text-foreground">
          {formatAmount(
            transaction.amount,
            currency
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

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Category
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {normalizeTransactionCategory(
              transaction.category
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            {transaction.type === "expense"
              ? "Paid By"
              : "Recorded By"}
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {transactionMember?.displayName ??
              "Not recorded"}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Description
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {transaction.description ||
              "No description"}
          </dd>
        </div>

        {showEnteredIncome && (
          <>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Entered Income
              </dt>

              <dd className="mt-1 text-sm text-foreground">
                {formatAmount(
                  transaction.enteredAmount ??
                    transaction.amount,
                  transaction.enteredCurrency
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Exchange Rate
              </dt>

              <dd className="mt-1 text-sm text-foreground">
                1 {transaction.enteredCurrency} ={" "}
                {formatAmount(
                  transaction.exchangeRate ?? 1,
                  transaction.baseCurrency ??
                    currency
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Rate Source
              </dt>

              <dd className="mt-1 text-sm text-foreground">
                {rateSource}
              </dd>
            </div>
          </>
        )}
      </dl>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Member Summary
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Shared amount and personal items assigned to
            each participating member.
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
                  findHouseholdMemberByReference(
                    allocation.memberId,
                    transaction.householdId
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
                          Member expense allocation
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Total Share
                        </p>

                        <p className="font-semibold text-foreground">
                          {formatAmount(
                            allocation
                              .allocatedAmount,
                            currency
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
                            sharedAmount,
                            currency
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
                          personalSubtotal,
                          currency
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
                                    item.amount,
                                    currency
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
                                personalSubtotal,
                                currency
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

      <section className="space-y-4 border-t pt-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Receipts and Bills
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Supporting documents saved with this
            transaction.
          </p>
        </div>

        {(transaction.attachments?.length ??
          0) === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-center">
            <p className="text-sm text-muted-foreground">
              No receipt or bill attached.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {transaction.attachments?.map(
              (attachment) => {
                const hasPreview =
                  hasAttachmentPreviewData(
                    attachment
                  );

                return (
                <article
                  key={attachment.id}
                  className="overflow-hidden rounded-lg border"
                >
                  <div className="flex h-44 items-center justify-center bg-muted/30">
                    {hasPreview &&
                    attachment.mimeType.startsWith(
                      "image/"
                    ) ? (
                      <img
                        src={
                          attachment.dataUrl
                        }
                        alt={
                          attachment.fileName
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {hasPreview
                          ? "PDF"
                          : "Stored metadata only"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">
                        {
                          attachment.fileName
                        }
                      </p>

                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {attachment.category}
                        {" · "}
                        {(
                          attachment.sizeBytes /
                          1024
                        ).toFixed(1)}
                        {" KB"}
                      </p>
                    </div>

                    {hasPreview ? (
                      <button
                        type="button"
                        onClick={() =>
                          openAttachmentPreview(
                            attachment
                          )
                        }
                        className="inline-flex rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Open Attachment
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Preview unavailable in cloud beta.
                      </p>
                    )}
                  </div>
                </article>
                );
              }
            )}
          </div>
        )}
      </section>

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
