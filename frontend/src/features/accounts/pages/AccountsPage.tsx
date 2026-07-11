import PageHeader from "../../../shared/ui/PageHeader";

import AccountList from "../components/AccountList";
import AccountSummary from "../components/AccountSummary";
import AccountService from "../services/AccountService";

export default function AccountsPage() {
  const accounts = AccountService.getActiveAccounts();
  const totalBalance = AccountService.getTotalBalance();

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Manage your financial accounts."
      />

      <div className="space-y-6">
        <AccountSummary
          totalAccounts={accounts.length}
          totalBalance={totalBalance}
        />

        <AccountList accounts={accounts} />
      </div>
    </>
  );
}