import "./SavingsGoalList.css";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import type {
  SavingsGoalProgress,
} from "../models/SavingsGoalProgress";

import SavingsGoalCard from "./SavingsGoalCard";

interface SavingsGoalListProps {
  goals: SavingsGoal[];

  progressByGoalId: Record<
    string,
    SavingsGoalProgress
  >;

  currency?: string;

  emptyTitle?: string;
  emptyMessage?: string;

  onView: (
    goal: SavingsGoal
  ) => void;

  onRecordActivity?: (
    goal: SavingsGoal
  ) => void;

  onEdit?: (
    goal: SavingsGoal
  ) => void;

  onArchive?: (
    goal: SavingsGoal
  ) => void;

  onDelete?: (
    goal: SavingsGoal
  ) => void;
}

export default function SavingsGoalList({
  goals,
  progressByGoalId,
  currency = "PHP",
  emptyTitle = "No savings goals found",
  emptyMessage =
    "Create a savings goal to begin tracking progress.",
  onView,
  onRecordActivity,
  onEdit,
  onArchive,
  onDelete,
}: SavingsGoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="hfos-savings-goal-list__empty">
        <h3 className="hfos-savings-goal-list__empty-title">
          {emptyTitle}
        </h3>

        <p className="hfos-savings-goal-list__empty-message">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="hfos-savings-goal-list">
      {goals.map((goal) => {
        const progress =
          progressByGoalId[
            goal.id
          ];

        if (!progress) {
          return null;
        }

        return (
          <SavingsGoalCard
            key={goal.id}
            goal={goal}
            progress={progress}
            currency={currency}
            onView={onView}
            onRecordActivity={
              onRecordActivity
            }
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
