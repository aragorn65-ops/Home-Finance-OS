import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type {
  MemberSettlementBalance,
  MemberSettlementPosition,
} from "../models/MemberSettlementBalance";

import type { SettlementAllocationOption } from "../models/SettlementAllocationOption";
import formatCurrency from "../../../shared/utils/formatCurrency";

type MemberBalanceSummaryProps = {
  balances: MemberSettlementBalance[];
  members: HouseholdMember[];
  allocations: SettlementAllocationOption[];
  currency?: string;
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

function getPositionLabel(
  position: MemberSettlementPosition
): string {
  switch (position) {
    case "creditor":
      return "Should Receive";

    case "debtor":
      return "Owes Money";

    case "settled":
      return "Settled";

    default:
      return "Settled";
  }
}

function getPositionClasses(
  position: MemberSettlementPosition
): string {
  switch (position) {
    case "creditor":
      return "bg-green-50 text-green-700";

    case "debtor":
      return "bg-red-50 text-red-700";

    case "settled":
      return "bg-muted text-muted-foreground";

    default:
      return "bg-muted text-muted-foreground";
  }
}

function getPaymentStatusLabel(
  status:
    SettlementAllocationOption["paymentStatus"]
): string {
  switch (status) {
    case "partially-paid":
      return "Partially Paid";

    case "paid":
      return "Paid";

    case "unpaid":
    default:
      return "Unpaid";
  }
}

function getPaymentStatusClasses(
  status:
    SettlementAllocationOption["paymentStatus"]
): string {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700";

    case "partially-paid":
      return "bg-[#d2c02a] text-amber-700";

    case "unpaid":
    default:
      return "bg-red-50 text-red-700";
  }
}

export default function MemberBalanceSummary({
  balances,
  members,
  allocations,
  currency,
}: MemberBalanceSummaryProps) {
  const getMemberName = (
    memberId: string
  ): string => {
    return (
      members.find(
        (member) =>
          member.id === memberId
      )?.displayName ??
      "Unknown Member"
    );
  };

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Member Balances
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Net reimbursement position and itemized
          outstanding expenses for each household member.
        </p>
      </div>

      {balances.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <h3 className="font-medium text-foreground">
            No member balances available
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Add household members and shared expenses to
            calculate settlement balances.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {balances.map((balance) => {
            const positionLabel =
              getPositionLabel(
                balance.position
              );

            const positionClasses =
              getPositionClasses(
                balance.position
              );

            const memberPayables =
              allocations.filter(
                (allocation) =>
                  allocation.fromMemberId ===
                    balance.memberId &&
                  allocation.outstandingAmount >
                    0
              );

            const memberReceivables =
              allocations.filter(
                (allocation) =>
                  allocation.toMemberId ===
                    balance.memberId &&
                  allocation.outstandingAmount >
                    0
              );

            const itemCount =
              memberPayables.length +
              memberReceivables.length;

            return (
              <article
                key={balance.memberId}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">
                    {getMemberName(
                      balance.memberId
                    )}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${positionClasses}`}
                  >
                    {positionLabel}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      To receive
                    </dt>

                    <dd className="font-medium text-foreground">
                      {formatAmount(
                        balance.amountToReceive,
                        currency
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      To pay
                    </dt>

                    <dd className="font-medium text-foreground">
                      {formatAmount(
                        balance.amountToPay,
                        currency
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-2">
                    <dt className="font-medium text-foreground">
                      Net position
                    </dt>

                    <dd className="font-semibold text-foreground">
                      {balance.netPosition < 0
                        ? "-"
                        : balance.netPosition > 0
                          ? "+"
                          : ""}
                      {formatAmount(
                        Math.abs(
                          balance.netPosition
                        ),
                        currency
                      )}
                    </dd>
                  </div>
                </dl>

                <details className="mt-4 border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">
                    View itemized balances
                    {itemCount > 0
                      ? ` (${itemCount})`
                      : ""}
                  </summary>

                  {itemCount === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No unpaid or partially paid items.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {memberPayables.length >
                        0 && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              Items to Pay
                            </h4>

                            <p className="mt-1 text-xs text-muted-foreground">
                              These expenses may be paid
                              fully or partially when
                              recording a settlement.
                            </p>
                          </div>

                          {memberPayables.map(
                            (allocation) => (
                              <div
                                key={
                                  allocation.expenseAllocationId
                                }
                                className="rounded-md border p-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {allocation.description ||
                                        allocation.category ||
                                        "Shared expense"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {allocation.transactionDate.toLocaleDateString()}
                                      {" · "}
                                      Owed to{" "}
                                      {getMemberName(
                                        allocation.toMemberId
                                      )}
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClasses(
                                      allocation.paymentStatus
                                    )}`}
                                  >
                                    {getPaymentStatusLabel(
                                      allocation.paymentStatus
                                    )}
                                  </span>
                                </div>

                                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                                  <div>
                                    <dt className="text-muted-foreground">
                                      Original
                                    </dt>

                                    <dd className="mt-1 font-medium text-foreground">
                                      {formatAmount(
                                        allocation.allocatedAmount,
                                        currency
                                      )}
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-muted-foreground">
                                      Paid
                                    </dt>

                                    <dd className="mt-1 font-medium text-foreground">
                                      {formatAmount(
                                        allocation.paidAmount,
                                        currency
                                      )}
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-muted-foreground">
                                      Remaining
                                    </dt>

                                    <dd className="mt-1 font-semibold text-foreground">
                                      {formatAmount(
                                        allocation.outstandingAmount,
                                        currency
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {memberReceivables.length >
                        0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground">
                            Items to Receive
                          </h4>

                          {memberReceivables.map(
                            (allocation) => (
                              <div
                                key={
                                  allocation.expenseAllocationId
                                }
                                className="rounded-md border p-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {allocation.description ||
                                        allocation.category ||
                                        "Shared expense"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {allocation.transactionDate.toLocaleDateString()}
                                      {" · "}
                                      Owed by{" "}
                                      {getMemberName(
                                        allocation.fromMemberId
                                      )}
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClasses(
                                      allocation.paymentStatus
                                    )}`}
                                  >
                                    {getPaymentStatusLabel(
                                      allocation.paymentStatus
                                    )}
                                  </span>
                                </div>

                                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                                  <div>
                                    <dt className="text-muted-foreground">
                                      Original
                                    </dt>

                                    <dd className="mt-1 font-medium text-foreground">
                                      {formatAmount(
                                        allocation.allocatedAmount,
                                        currency
                                      )}
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-muted-foreground">
                                      Received
                                    </dt>

                                    <dd className="mt-1 font-medium text-foreground">
                                      {formatAmount(
                                        allocation.paidAmount,
                                        currency
                                      )}
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-muted-foreground">
                                      Remaining
                                    </dt>

                                    <dd className="mt-1 font-semibold text-foreground">
                                      {formatAmount(
                                        allocation.outstandingAmount,
                                        currency
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
