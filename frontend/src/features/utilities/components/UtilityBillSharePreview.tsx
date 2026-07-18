import type {
  ReactNode,
} from "react";

import type {
  UtilityBillShareResult,
} from "../models/UtilityBillShareResult";

interface UtilityBillSharePreviewProps {
  result: UtilityBillShareResult;

  /**
   * Optional member-name lookup.
   *
   * The member ID is displayed when no name is available.
   */
  memberNames?: Record<string, string>;
}

const currencyFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

const quantityFormatter =
  new Intl.NumberFormat(
    "en-PH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }
  );

export default function UtilityBillSharePreview({
  result,
  memberNames = {},
}: UtilityBillSharePreviewProps) {
  const getMemberName = (
    memberId: string
  ): string =>
    memberNames[memberId] ??
    memberId;

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">
          Bill Share Preview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Review each member&apos;s direct usage,
          equal shared amount, and final bill share.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Provider Bill"
          value={formatCurrency(
            result.totalBillAmount
          )}
        />

        <SummaryCard
          label={
            result.utilityType === "water"
              ? (
                  <>
                    Derived rate per{" "}
                    <UnitLabel unit={result.unit} />
                  </>
                )
              : (
                  <>
                    Rate per{" "}
                    <UnitLabel unit={result.unit} />
                  </>
                )
          }
          value={formatCurrency(
            result.ratePerUnit
          )}
          helper={
            result.utilityType === "water"
              ? "Calculated from total bill amount divided by consumption."
              : undefined
          }
        />

        <SummaryCard
          label="Total Direct Usage"
          value={formatCurrency(
            result.totalDirectUsageAmount
          )}
        />

        <SummaryCard
          label="Total Member Shares"
          value={formatCurrency(
            result.totalMemberShares
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Submeter Charges"
          value={formatCurrency(
            result.totalSubmeterChargeAmount
          )}
          helper={
            <>
              {formatQuantity(
                result.totalSubmeterConsumption
              )}{" "}
              <UnitLabel unit={result.unit} />
            </>
          }
        />

        <SummaryCard
          label="Appliance Charges"
          value={formatCurrency(
            result.totalApplianceChargeAmount
          )}
          helper={
            <>
              {formatQuantity(
                result.totalApplianceConsumption
              )}{" "}
              <UnitLabel unit={result.unit} />
            </>
          }
        />

        <SummaryCard
          label="Fixed Compensation"
          value={formatCurrency(
            result.totalFixedCompensationAmount
          )}
          helper="Direct amounts for usage not covered by meters or appliances."
        />

        <SummaryCard
          label="Shared Remainder"
          value={formatCurrency(
            result.sharedRemainderAmount
          )}
          helper="Provider bill remaining after all direct member usage."
        />

        <SummaryCard
          label="Members Sharing Equally"
          value={String(
            result.equalShareMemberCount
          )}
        />

        <SummaryCard
          label="Average Shared Amount"
          value={formatCurrency(
            result.equalShareAmountPerMember
          )}
          helper="Individual shares may differ by one cent for exact balancing."
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">
            Member Shares
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  Member
                </th>

                <th className="px-4 py-3">
                  Sharing
                </th>

                <th className="px-4 py-3 text-right">
                  Submeter
                </th>

                <th className="px-4 py-3 text-right">
                  Appliance
                </th>

                <th className="px-4 py-3 text-right">
                  Fixed Compensation
                </th>

                <th className="px-4 py-3 text-right">
                  Direct Usage
                </th>

                <th className="px-4 py-3 text-right">
                  Equal Shared
                </th>

                <th className="px-4 py-3 text-right">
                  Final Share
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {result.memberShares.map(
                (memberShare) => (
                  <tr
                    key={memberShare.memberId}
                    className="text-slate-700"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {getMemberName(
                        memberShare.memberId
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <ParticipationBadge
                        sharesRemainder={
                          memberShare.sharesRemainder
                        }
                      />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <AmountWithQuantity
                        amount={
                          memberShare.submeterChargeAmount
                        }
                        quantity={
                          memberShare.submeterConsumption
                        }
                        unit={result.unit}
                      />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <AmountWithQuantity
                        amount={
                          memberShare.applianceChargeAmount
                        }
                        quantity={
                          memberShare.applianceConsumption
                        }
                        unit={result.unit}
                      />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {formatCurrency(
                        memberShare.fixedCompensationAmount
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                      {formatCurrency(
                        memberShare.directUsageAmount
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {formatCurrency(
                        memberShare.equalSharedAmount
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(
                        memberShare.finalShareAmount
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>

            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-3 text-right"
                >
                  Total Member Shares
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {formatCurrency(
                    result.totalMemberShares
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          result.isBalanced
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              className={`font-semibold ${
                result.isBalanced
                  ? "text-emerald-800"
                  : "text-red-800"
              }`}
            >
              {result.isBalanced
                ? "Bill is balanced"
                : "Bill is not balanced"}
            </p>

            <p
              className={`mt-1 text-sm ${
                result.isBalanced
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              Final member shares must equal the complete
              amount payable to the provider.
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Difference
            </p>

            <p
              className={`text-lg font-bold ${
                result.isBalanced
                  ? "text-emerald-800"
                  : "text-red-800"
              }`}
            >
              {formatCurrency(
                result.validationDifference
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface SummaryCardProps {
  label: ReactNode;
  value: string;
  helper?: ReactNode;
}

function SummaryCard({
  label,
  value,
  helper,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-slate-900">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-xs text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}

interface ParticipationBadgeProps {
  sharesRemainder: boolean;
}

function ParticipationBadge({
  sharesRemainder,
}: ParticipationBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
        sharesRemainder
          ? "bg-blue-50 text-blue-700 ring-blue-600/20"
          : "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      {sharesRemainder
        ? "Shares Remainder"
        : "Direct Usage Only"}
    </span>
  );
}

interface AmountWithQuantityProps {
  amount: number;
  quantity: number;
  unit: string;
}

function AmountWithQuantity({
  amount,
  quantity,
  unit,
}: AmountWithQuantityProps) {
  return (
    <div>
      <div>
        {formatCurrency(amount)}
      </div>

      <div className="text-xs text-slate-500">
        {formatQuantity(quantity)}{" "}
        <UnitLabel unit={unit} />
      </div>
    </div>
  );
}

interface UnitLabelProps {
  unit: string;
}

function UnitLabel({
  unit,
}: UnitLabelProps) {
  if (unit === "m3") {
    return (
      <>
        m<sup>3</sup>
      </>
    );
  }

  return <>{unit}</>;
}

function formatCurrency(
  amount: number
): string {
  return currencyFormatter.format(
    amount
  );
}

function formatQuantity(
  quantity: number
): string {
  return quantityFormatter.format(
    quantity
  );
}
