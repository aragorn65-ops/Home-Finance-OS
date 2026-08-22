import type { HouseholdMember } from "../../household/models/HouseholdMember";
import {
  resolveHouseholdMemberReference,
} from "../../household/services/householdMemberResolution";

import type { MemberSettlementObligation } from "../models/MemberSettlementObligation";
import formatCurrency from "../../../shared/utils/formatCurrency";

type WhoOwesWhomSummaryProps = {
  obligations: MemberSettlementObligation[];
  members: HouseholdMember[];
  currency?: string;
  title?: string;
  description?: string;
  amountLabel?: string;
};

export default function WhoOwesWhomSummary({
  obligations,
  members,
  currency,
  title = "Who Owes Whom",
  description =
    "Current outstanding reimbursements between household members.",
  amountLabel = "Outstanding",
}: WhoOwesWhomSummaryProps) {
  const getMemberName = (
    memberId: string
  ): string => {
    return (
      resolveHouseholdMemberReference(
        members,
        memberId
      )?.displayName ??
      "Unknown Member"
    );
  };

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {obligations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <h3 className="font-medium text-foreground">
            Everyone is settled
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            There are no outstanding member
            reimbursements.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {obligations.map(
            (obligation) => {
              const fromMemberName =
                getMemberName(
                  obligation.fromMemberId
                );

              const toMemberName =
                getMemberName(
                  obligation.toMemberId
                );

              const formattedAmount =
                formatCurrency(
                  obligation.amount,
                  currency
                );

              const allocationLabel =
                obligation.allocationCount === 1
                  ? "allocation"
                  : "allocations";

              return (
                <div
                  key={
                    `${obligation.fromMemberId}-` +
                    obligation.toMemberId
                  }
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {fromMemberName}
                      {" → "}
                      {toMemberName}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {
                        obligation.allocationCount
                      }{" "}
                      {allocationLabel}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {amountLabel}
                    </p>

                    <p className="text-lg font-semibold text-foreground">
                      {formattedAmount}
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}
