import { Button } from "../../../shared/ui";
import type { Account } from "../models/Account";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}

export default function AccountCard({
  account,
  onEdit,
  onDelete,
}: AccountCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {account.name}
          </h3>

          <p className="text-sm text-gray-500">
            {account.institution ||
              "No Institution"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {onEdit && (
            <Button
              variant="secondary"
              onClick={() => onEdit(account)}
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              variant="danger"
              onClick={() =>
                onDelete(account)
              }
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 text-xl font-bold">
        ₱
        {account.currentBalance.toLocaleString()}
      </div>

      <div className="mt-2 text-sm text-gray-600">
        {account.type}
      </div>
    </div>
  );
}