import type { Account } from "../models/Account";

interface AccountCardProps {
  account: Account;
}

export default function AccountCard({
  account,
}: AccountCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">
        {account.name}
      </h3>

      <p className="text-sm text-gray-500">
        {account.institution || "No Institution"}
      </p>

      <div className="mt-3 text-xl font-bold">
        ₱{account.currentBalance.toLocaleString()}
      </div>

      <div className="mt-2 text-sm">
        {account.type}
      </div>
    </div>
  );
}