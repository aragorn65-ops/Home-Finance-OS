import { Button } from "../../../shared/ui";
import type { Account } from "../models/Account";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
}

export default function AccountCard({
  account,
  onEdit,
}: AccountCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {account.name}
          </h3>

          <p className="text-sm text-gray-500">
            {account.institution || "No Institution"}
          </p>
        </div>

        {onEdit && (
          <Button
            variant="secondary"
            onClick={() => onEdit(account)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="mt-3 text-xl font-bold">
        ₱{account.currentBalance.toLocaleString()}
      </div>

      <div className="mt-2 text-sm text-gray-600">
        {account.type}
      </div>
    </div>
  );
}