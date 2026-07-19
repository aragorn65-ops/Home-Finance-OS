import { Button } from "../../../shared/ui";
import formatCurrency from "../../../shared/utils/formatCurrency";
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
  const baseCurrency =
    account.baseCurrency ??
    account.currency;

  const baseBalance =
    account.currentBaseBalance ??
    account.currentBalance;

  const showBaseEquivalent =
    account.currency !== baseCurrency;

  const rateSource =
    account.exchangeRateSource === "api"
      ? `API rate${account.exchangeRateProvider ? ` from ${account.exchangeRateProvider}` : ""}`
      : "Manual rate";

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
        {formatCurrency(
          account.currentBalance,
          account.currency
        )}
      </div>

      {showBaseEquivalent && (
        <>
          <div className="mt-1 text-sm text-gray-500">
            Reporting equivalent:{" "}
            {formatCurrency(
              baseBalance,
              baseCurrency
            )}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {rateSource}
          </div>
        </>
      )}

      <div className="mt-2 text-sm text-gray-600">
        {account.type}
      </div>
    </div>
  );
}
