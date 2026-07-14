import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type {
  MemberSettlementBalance,
  MemberSettlementPosition,
} from "../models/MemberSettlementBalance";

type MemberBalanceSummaryProps = {
  balances: MemberSettlementBalance[];
  members: HouseholdMember[];
};

const amountFormatter =
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

export default function MemberBalanceSummary({
  balances,
  members,
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
          Net reimbursement position for each household
          member.
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {balances.map((balance) => {
            const positionLabel =
              getPositionLabel(
                balance.position
              );

            const positionClasses =
              getPositionClasses(
                balance.position
              );

            const formattedReceive =
              amountFormatter.format(
                balance.amountToReceive
              );

            const formattedPay =
              amountFormatter.format(
                balance.amountToPay
              );

            const formattedNet =
              amountFormatter.format(
                Math.abs(
                  balance.netPosition
                )
              );

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
                      {formattedReceive}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      To pay
                    </dt>

                    <dd className="font-medium text-foreground">
                      {formattedPay}
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
                      {formattedNet}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}