import Button from "../../../shared/ui/Button";
import PageHeader from "../../../shared/ui/PageHeader";

interface SavingsToolbarProps {
  onAddGoal: () => void;
}

export default function SavingsToolbar({
  onAddGoal,
}: SavingsToolbarProps) {
  return (
    <PageHeader
      title="Savings"
      subtitle="Plan savings goals, record contributions, and track household progress."
      actions={
        <Button
          type="button"
          variant="primary"
          onClick={onAddGoal}
        >
          Add Goal
        </Button>
      }
    />
  );
}
