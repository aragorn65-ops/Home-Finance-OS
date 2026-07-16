import PageHeader from "../../../shared/ui/PageHeader";

interface SavingsToolbarProps {
  onAddGoal: () => void;
}

export default function SavingsToolbar({
  onAddGoal,
}: SavingsToolbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <PageHeader
        title="Savings"
        subtitle="Plan savings goals, record contributions, and track household progress."
      />

      <button
        type="button"
        onClick={onAddGoal}
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        + Add Goal
      </button>
    </div>
  );
}