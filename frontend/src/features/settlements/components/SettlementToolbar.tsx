import PageHeader from "../../../shared/ui/PageHeader";
import Input from "../../../shared/ui/Input";

type SettlementToolbarProps = {
  selectedMonth: string;
  onSelectedMonthChange: (
    selectedMonth: string
  ) => void;
  onAddSettlement?: () => void;
};

export default function SettlementToolbar({
  selectedMonth,
  onSelectedMonthChange,
  onAddSettlement,
}: SettlementToolbarProps) {
  return (
    <PageHeader
      title="Settlements"
      subtitle="Track outstanding balances and reimbursements between household members"
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

          {onAddSettlement && (
            <button
              type="button"
              onClick={onAddSettlement}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            >
              + Record Settlement
            </button>
          )}
        </>
      }
    />
  );
}
