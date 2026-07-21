import { EmptyState } from "../../../shared/ui";

import type { Account } from "../models/Account";
import AccountCard from "./AccountCard";

interface AccountListProps {
  accounts: Account[];
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}

export default function AccountList({
  accounts,
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
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
