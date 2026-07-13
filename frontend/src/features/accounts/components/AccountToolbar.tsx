import PageHeader from "../../../shared/ui/PageHeader";

type AccountToolbarProps = {
  onAddAccount?: () => void;
};

export default function AccountToolbar({
  onAddAccount,
}: AccountToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <PageHeader
        title="Accounts"
        subtitle="Manage your household accounts"
      />

      <div className="flex items-center gap-2">
        {/* Search will be added later */}

        <button
          type="button"
          onClick={onAddAccount}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          + Add Account
        </button>
      </div>
    </div>
  );
}