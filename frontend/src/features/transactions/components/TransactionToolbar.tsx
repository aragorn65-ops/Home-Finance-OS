import PageHeader from "../../../shared/ui/PageHeader";
import Input from "../../../shared/ui/Input";

type TransactionToolbarProps = {
  selectedMonth: string;
  onSelectedMonthChange: (
    selectedMonth: string
  ) => void;
  onAddTransaction?: () => void;
};

export default function TransactionToolbar({
  selectedMonth,
  onSelectedMonthChange,
  onAddTransaction,
}: TransactionToolbarProps) {
  return (
    <PageHeader
      title="Transactions"
      subtitle="Track household income, expenses, and transfers"
      actions={
        <>
          <Input
            type="month"
            aria-label="Reporting month"
            value={selectedMonth}
            onChange={(event) =>
              onSelectedMonthChange(
                event.target.value
              )
            }
          />

          {onAddTransaction && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={
                  onAddTransaction
                }
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
              >
                + Add Transaction
              </button>
            </div>
          )}
        </>
      }
    />
  );
}
