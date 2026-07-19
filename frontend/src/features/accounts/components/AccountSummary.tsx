import formatCurrency from "../../../shared/utils/formatCurrency";

interface AccountSummaryProps {
  totalBalance: number;
  totalAccounts: number;
  currency?: string;
}

export default function AccountSummary({
  totalBalance,
  totalAccounts,
  currency = "PHP",
}: AccountSummaryProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-500">
            Total Accounts
          </div>

          <div className="text-2xl font-bold">
            {totalAccounts}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Total Balance
          </div>

          <div className="text-2xl font-bold">
            {formatCurrency(
              totalBalance,
              currency
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
