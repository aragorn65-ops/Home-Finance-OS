import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import PageHeader from "../../../shared/ui/PageHeader";

interface SavingsToolbarProps {
  selectedMonth: string;
  onSelectedMonthChange: (
    selectedMonth: string
  ) => void;
  onAddGoal: () => void;
}

export default function SavingsToolbar({
  selectedMonth,
  onSelectedMonthChange,
  onAddGoal,
}: SavingsToolbarProps) {
  return (
    <PageHeader
      title="Savings"
      subtitle="Plan savings goals, record contributions, and track household progress."
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

          <Button
            type="button"
            variant="primary"
            onClick={onAddGoal}
          >
            Add Goal
          </Button>
        </>
      }
    />
  );
}
