import PageHeader from "../../../shared/ui/PageHeader";

type TransactionToolbarProps = {
  onAddTransaction?: () => void;
};

export default function TransactionToolbar({
  onAddTransaction,
}: TransactionToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <PageHeader
        title="Transactions"
        subtitle="Track household income, expenses, and transfers"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddTransaction}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          + Add Transaction
        </button>
      </div>
    </div>
  );
}
