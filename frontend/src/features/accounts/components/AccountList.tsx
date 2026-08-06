import { EmptyState } from "../../../shared/ui";

import type { Account } from "../models/Account";
import AccountCard from "./AccountCard";

interface AccountListProps {
  accounts: Account[];
  canViewDetails?: (account: Account) => boolean;
  canEdit?: (account: Account) => boolean;
  canDelete?: (account: Account) => boolean;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}

export default function AccountList({
  accounts,
  canViewDetails,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        message="Add the household accounts that receive income, pay expenses, or hold savings balances."
      />
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          isRedacted={
            canViewDetails
              ? !canViewDetails(account)
              : false
          }
          onEdit={
            onEdit &&
            (
              canEdit
                ? canEdit(account)
                : true
            )
              ? onEdit
              : undefined
          }
          onDelete={
            onDelete &&
            (
              canDelete
                ? canDelete(account)
                : true
            )
              ? onDelete
              : undefined
          }
        />
      ))}
    </div>
  );
}
