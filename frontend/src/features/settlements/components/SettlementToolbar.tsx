import PageHeader from "../../../shared/ui/PageHeader";

type SettlementToolbarProps = {
  onAddSettlement?: () => void;
};

export default function SettlementToolbar({
  onAddSettlement,
}: SettlementToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <PageHeader
        title="Settlements"
        subtitle="Track outstanding balances and reimbursements between household members"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddSettlement}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          + Record Settlement
        </button>
      </div>
    </div>
  );
}