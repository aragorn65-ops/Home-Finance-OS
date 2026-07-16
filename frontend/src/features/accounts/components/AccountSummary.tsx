interface AccountSummaryProps {
  totalBalance: number;
  totalAccounts: number;
}

export default function AccountSummary({
  totalBalance,
  totalAccounts,
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
            ₱{totalBalance.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}