import type { Account } from "../models/Account";
import AccountCard from "./AccountCard";

interface AccountListProps {
  accounts: Account[];
}

export default function AccountList({
  accounts,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <p>No accounts found.</p>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
        />
      ))}
    </div>
  );
}