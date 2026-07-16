import {
  useState,
} from "react";

import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "../../../shared/ui";

import AccountService from "../../accounts/services/AccountService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import SavingsActivityForm from "../components/SavingsActivityForm";
import SavingsGoalDetails from "../components/SavingsGoalDetails";
import SavingsGoalForm from "../components/SavingsGoalForm";
import SavingsGoalList from "../components/SavingsGoalList";
import SavingsSummary from "../components/SavingsSummary";
import SavingsToolbar from "../components/SavingsToolbar";

import useSavings from "../hooks/useSavings";

import type {
  SavingsActivity,
} from "../models/SavingsActivity";

import {
  defaultSavingsActivityForm,
  type SavingsActivityForm as SavingsActivityFormModel,
} from "../models/SavingsActivityForm";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import {
  defaultSavingsGoalForm,
  type SavingsGoalForm as SavingsGoalFormModel,
} from "../models/SavingsGoalForm";

type SavingsDialogMode =
  | "create-goal"
  | "edit-goal"
  | "view-goal"
  | "create-activity"
  | "edit-activity"
  | null;

type SavingsConfirmation =
  | {
      type: "archive-goal";
      goal: SavingsGoal;
    }
  | {
      type: "delete-goal";
      goal: SavingsGoal;
    }
  | {
      type: "delete-activity";
      activity: SavingsActivity;
    }
  | null;

function formatDateInput(
  date?: Date
): string {
  if (!date) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDefaultGoalForm(
  householdId: string
): SavingsGoalFormModel {
  return {
    ...defaultSavingsGoalForm,

    householdId,
  };
}

function mapGoalToForm(
  goal: SavingsGoal
): SavingsGoalFormModel {
  return {
    householdId:
      goal.householdId,

    name:
      goal.name,

    description:
      goal.description ?? "",

    goalType:
      goal.goalType,

    targetAmount:
      goal.targetAmount,

    targetDate:
      formatDateInput(
        goal.targetDate
      ),

    linkedAccountId:
      goal.linkedAccountId ?? "",

    priority:
      goal.priority,

    status:
      goal.status,

    isActive:
      goal.isActive,
  };
}

function createDefaultActivityForm(
  householdId: string,
  savingsGoalId: string,
  memberId: string
): SavingsActivityFormModel {
  return {
    ...defaultSavingsActivityForm,

    householdId,
    savingsGoalId,
    memberId,

    activityDate:
      formatDateInput(
        new Date()
      ),
  };
}

function mapActivityToForm(
  activity: SavingsActivity
): SavingsActivityFormModel {
  return {
    householdId:
      activity.householdId,

    savingsGoalId:
      activity.savingsGoalId,

    memberId:
      activity.memberId,

    activityType:
      activity.activityType,

    amount:
      activity.amount,

    activityDate:
      formatDateInput(
        activity.activityDate
      ),

    accountId:
      activity.accountId ?? "",

    notes:
      activity.notes ?? "",

    isActive:
      activity.isActive,
  };
}

function getFirstError(
  errors?: Record<string, string>
): string | undefined {
  if (!errors) {
    return undefined;
  }

  return Object.values(
    errors
  )[0];
}

export default function SavingsPage() {
  const household =
    loadHousehold();

  const householdId =
    household?.id ?? "";

  const currency =
    household?.currency ??
    "PHP";

  const allMembers =
    household
      ? HouseholdMemberService
          .getMembers()
          .filter(
            (member) =>
              member.householdId ===
              household.id
          )
      : [];

  const activeMembers =
    allMembers.filter(
      (member) =>
        member.isActive
    );

  const defaultMemberId =
    HouseholdMemberService
      .getOwnerMember()
      ?.id ??
    activeMembers[0]?.id ??
    "";

  const accounts =
    household
      ? AccountService
          .getAccounts()
          .filter(
            (account) =>
              account.householdId ===
              household.id
          )
      : [];

  /**
   * A savings goal does not identify a private account
   * owner, so goal-level linking is limited to visible
   * household asset accounts.
   *
   * Activity forms may additionally use private accounts
   * owned by the selected member.
   */
  const goalAccountOptions =
    accounts.filter(
      (account) =>
        account.isActive &&
        account.accountClass ===
          "asset" &&
        account.visibility ===
          "household"
    );

  const {
    activeGoals,
    completedGoals,
    archivedGoals,

    progressByGoalId,
    summary,

    getActivitiesForGoal,

    createGoal,
    updateGoal,
    archiveGoal,
    removeGoal,

    createActivity,
    updateActivity,
    removeActivity,
  } = useSavings();

  const [
    dialogMode,
    setDialogMode,
  ] = useState<SavingsDialogMode>(
    null
  );

  const [
    selectedGoal,
    setSelectedGoal,
  ] = useState<SavingsGoal | null>(
    null
  );

  const [
    selectedActivity,
    setSelectedActivity,
  ] = useState<
    SavingsActivity | null
  >(null);

  const [
    goalForm,
    setGoalForm,
  ] = useState<SavingsGoalFormModel>(
    createDefaultGoalForm(
      householdId
    )
  );

  const [
    activityForm,
    setActivityForm,
  ] = useState<SavingsActivityFormModel>(
    createDefaultActivityForm(
      householdId,
      "",
      defaultMemberId
    )
  );

  const [
    goalErrors,
    setGoalErrors,
  ] = useState<
    Record<string, string>
  >({});

  const [
    activityErrors,
    setActivityErrors,
  ] = useState<
    Record<string, string>
  >({});

  const [
    saveError,
    setSaveError,
  ] = useState("");

  const [
    confirmation,
    setConfirmation,
  ] = useState<SavingsConfirmation>(
    null
  );

  const [
    confirmationError,
    setConfirmationError,
  ] = useState("");

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedActivity(null);

    setGoalErrors({});
    setActivityErrors({});
    setSaveError("");
  };

  const closeAllDialogs = () => {
    closeDialog();
    setSelectedGoal(null);
  };

  const handleAddGoal = () => {
    setSelectedGoal(null);
    setSelectedActivity(null);

    setGoalForm(
      createDefaultGoalForm(
        householdId
      )
    );

    setGoalErrors({});
    setSaveError("");

    setDialogMode(
      "create-goal"
    );
  };

  const handleViewGoal = (
    goal: SavingsGoal
  ) => {
    setSelectedGoal(goal);
    setSelectedActivity(null);

    setGoalErrors({});
    setActivityErrors({});
    setSaveError("");

    setDialogMode(
      "view-goal"
    );
  };

  const handleEditGoal = (
    goal: SavingsGoal
  ) => {
    setSelectedGoal(goal);
    setSelectedActivity(null);

    setGoalForm(
      mapGoalToForm(goal)
    );

    setGoalErrors({});
    setSaveError("");

    setDialogMode(
      "edit-goal"
    );
  };

  const handleRecordActivity = (
    goal: SavingsGoal
  ) => {
    setSelectedGoal(goal);
    setSelectedActivity(null);

    setActivityForm(
      createDefaultActivityForm(
        householdId,
        goal.id,
        defaultMemberId
      )
    );

    setActivityErrors({});
    setSaveError("");

    setDialogMode(
      "create-activity"
    );
  };

  const handleEditActivity = (
    activity: SavingsActivity
  ) => {
    const activityGoal = [
      ...activeGoals,
      ...completedGoals,
      ...archivedGoals,
    ].find(
      (goal) =>
        goal.id ===
        activity.savingsGoalId
    );

    if (!activityGoal) {
      return;
    }

    setSelectedGoal(
      activityGoal
    );

    setSelectedActivity(
      activity
    );

    setActivityForm(
      mapActivityToForm(
        activity
      )
    );

    setActivityErrors({});
    setSaveError("");

    setDialogMode(
      "edit-activity"
    );
  };

  const handleSaveGoal = () => {
    setGoalErrors({});
    setSaveError("");

    if (!household) {
      setSaveError(
        "Complete household setup before creating a savings goal."
      );

      return;
    }

    const submissionForm:
      SavingsGoalFormModel = {
        ...goalForm,

        householdId:
          household.id,
      };

    const result =
      dialogMode ===
        "edit-goal" &&
      selectedGoal
        ? updateGoal(
            selectedGoal.id,
            submissionForm
          )
        : createGoal(
            submissionForm
          );

    if (!result.success) {
      setGoalErrors(
        result.errors ?? {}
      );

      setSaveError(
        result.message ??
          getFirstError(
            result.errors
          ) ??
          "Unable to save the savings goal."
      );

      return;
    }

    if (result.data) {
      setSelectedGoal(
        result.data
      );

      setDialogMode(
        "view-goal"
      );
    } else {
      closeAllDialogs();
    }

    setGoalErrors({});
    setSaveError("");
  };

  const handleSaveActivity = () => {
    setActivityErrors({});
    setSaveError("");

    if (
      !household ||
      !selectedGoal
    ) {
      setSaveError(
        "Select a savings goal before recording activity."
      );

      return;
    }

    const submissionForm:
      SavingsActivityFormModel = {
        ...activityForm,

        householdId:
          household.id,

        savingsGoalId:
          selectedGoal.id,
      };

    const result =
      dialogMode ===
        "edit-activity" &&
      selectedActivity
        ? updateActivity(
            selectedActivity.id,
            submissionForm
          )
        : createActivity(
            submissionForm
          );

    if (!result.success) {
      setActivityErrors(
        result.errors ?? {}
      );

      setSaveError(
        result.message ??
          getFirstError(
            result.errors
          ) ??
          "Unable to save the savings activity."
      );

      return;
    }

    setSelectedActivity(null);
    setActivityErrors({});
    setSaveError("");

    setDialogMode(
      "view-goal"
    );
  };

  const requestArchiveGoal = (
    goal: SavingsGoal
  ) => {
    setConfirmationError("");

    setConfirmation({
      type:
        "archive-goal",

      goal,
    });
  };

  const requestDeleteGoal = (
    goal: SavingsGoal
  ) => {
    setConfirmationError("");

    setConfirmation({
      type:
        "delete-goal",

      goal,
    });
  };

  const requestDeleteActivity = (
    activity: SavingsActivity
  ) => {
    setConfirmationError("");

    setConfirmation({
      type:
        "delete-activity",

      activity,
    });
  };

  const cancelConfirmation = () => {
    setConfirmation(null);
    setConfirmationError("");
  };

  const confirmRequestedAction = () => {
    if (!confirmation) {
      return;
    }

    if (
      confirmation.type ===
      "archive-goal"
    ) {
      const result =
        archiveGoal(
          confirmation.goal.id
        );

      if (!result.success) {
        setConfirmationError(
          result.message ??
            getFirstError(
              result.errors
            ) ??
            "Unable to archive the savings goal."
        );

        return;
      }

      if (
        selectedGoal?.id ===
        confirmation.goal.id
      ) {
        closeAllDialogs();
      }

      cancelConfirmation();

      return;
    }

    if (
      confirmation.type ===
      "delete-goal"
    ) {
      const result =
        removeGoal(
          confirmation.goal.id
        );

      if (!result.success) {
        setConfirmationError(
          result.message ??
            getFirstError(
              result.errors
            ) ??
            "Unable to delete the savings goal."
        );

        return;
      }

      if (
        selectedGoal?.id ===
        confirmation.goal.id
      ) {
        closeAllDialogs();
      }

      cancelConfirmation();

      return;
    }

    const result =
      removeActivity(
        confirmation.activity.id
      );

    if (!result.success) {
      setConfirmationError(
        result.message ??
          getFirstError(
            result.errors
          ) ??
          "Unable to delete the savings activity."
      );

      return;
    }

    cancelConfirmation();
  };

  const selectedProgress =
    selectedGoal
      ? progressByGoalId[
          selectedGoal.id
        ]
      : undefined;

  const selectedActivities =
    selectedGoal
      ? getActivitiesForGoal(
          selectedGoal.id
        )
      : [];

  const isGoalFormOpen =
    dialogMode ===
      "create-goal" ||
    dialogMode ===
      "edit-goal";

  const isActivityFormOpen =
    dialogMode ===
      "create-activity" ||
    dialogMode ===
      "edit-activity";

  const confirmationTitle =
    confirmation?.type ===
    "archive-goal"
      ? "Archive Savings Goal"
      : confirmation?.type ===
          "delete-goal"
        ? "Delete Savings Goal"
        : "Delete Savings Activity";

  const confirmationLabel =
    confirmation?.type ===
    "archive-goal"
      ? "Archive"
      : "Delete";

  const confirmationVariant =
    confirmation?.type ===
    "archive-goal"
      ? "primary"
      : "danger";

  const confirmationMessage =
    confirmationError ||
    (
      confirmation?.type ===
      "archive-goal"
        ? `Archive "${confirmation.goal.name}"? Its activity history will be preserved, but new activity will be blocked.`
        : confirmation?.type ===
            "delete-goal"
          ? `Delete "${confirmation.goal.name}"? Goals with activity history must be archived instead.`
          : confirmation?.type ===
              "delete-activity"
            ? "Delete this savings activity? Any linked account balance effect will be reversed."
            : ""
    );

  return (
    <>
      <SavingsToolbar
        onAddGoal={
          handleAddGoal
        }
      />

      <div className="space-y-8">
        <SavingsSummary
          totalSaved={
            summary.totalSaved
          }
          totalTarget={
            summary.totalTarget
          }
          remainingAmount={
            summary.remainingAmount
          }
          overallProgressPercentage={
            summary
              .overallProgressPercentage
          }
          activeGoalCount={
            summary.activeGoalCount
          }
          completedGoalCount={
            summary.completedGoalCount
          }
          currency={currency}
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Active Goals
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Goals that are still being funded or are
              currently paused.
            </p>
          </div>

          <SavingsGoalList
            goals={activeGoals}
            progressByGoalId={
              progressByGoalId
            }
            currency={currency}
            emptyTitle="No active savings goals"
            emptyMessage="Create a goal to begin setting money aside for a future household need."
            onView={
              handleViewGoal
            }
            onRecordActivity={
              handleRecordActivity
            }
            onEdit={
              handleEditGoal
            }
            onArchive={
              requestArchiveGoal
            }
            onDelete={
              requestDeleteGoal
            }
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Completed Goals
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Goals that reached their target remain
              available for review and future withdrawals.
            </p>
          </div>

          <SavingsGoalList
            goals={completedGoals}
            progressByGoalId={
              progressByGoalId
            }
            currency={currency}
            emptyTitle="No completed savings goals"
            emptyMessage="Completed goals will remain visible here after reaching their target."
            onView={
              handleViewGoal
            }
            onRecordActivity={
              handleRecordActivity
            }
            onEdit={
              handleEditGoal
            }
            onArchive={
              requestArchiveGoal
            }
            onDelete={
              requestDeleteGoal
            }
          />
        </section>

        {archivedGoals.length >
          0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Archived Goals
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Archived goals remain available with their
                saved activity history.
              </p>
            </div>

            <SavingsGoalList
              goals={
                archivedGoals
              }
              progressByGoalId={
                progressByGoalId
              }
              currency={currency}
              onView={
                handleViewGoal
              }
            />
          </section>
        )}
      </div>

      <Dialog
        open={isGoalFormOpen}
        onClose={closeDialog}
        className="max-w-2xl"
      >
        <DialogHeader
          title={
            dialogMode ===
            "edit-goal"
              ? "Edit Savings Goal"
              : "Create Savings Goal"
          }
        />

        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {saveError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          {household ? (
            <SavingsGoalForm
              value={goalForm}
              accounts={
                goalAccountOptions
              }
              errors={goalErrors}
              onChange={(
                nextForm
              ) => {
                setGoalForm(
                  nextForm
                );

                setGoalErrors({});
                setSaveError("");
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-semibold text-foreground">
                Household setup required
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete household setup before creating
                savings goals.
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={closeDialog}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={
              handleSaveGoal
            }
          >
            {dialogMode ===
            "edit-goal"
              ? "Update Goal"
              : "Create Goal"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={isActivityFormOpen}
        onClose={() => {
          if (selectedGoal) {
            setDialogMode(
              "view-goal"
            );

            setSelectedActivity(
              null
            );

            setActivityErrors({});
            setSaveError("");

            return;
          }

          closeDialog();
        }}
        className="max-w-2xl"
      >
        <DialogHeader
          title={
            dialogMode ===
            "edit-activity"
              ? "Edit Savings Activity"
              : selectedGoal
                ? `Add Activity — ${selectedGoal.name}`
                : "Add Savings Activity"
          }
        />

        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {saveError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          {household &&
          selectedGoal ? (
            <SavingsActivityForm
              value={
                activityForm
              }
              members={
                activeMembers
              }
              accounts={
                accounts
              }
              errors={
                activityErrors
              }
              onChange={(
                nextForm
              ) => {
                setActivityForm(
                  nextForm
                );

                setActivityErrors(
                  {}
                );

                setSaveError("");
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-semibold text-foreground">
                Savings goal required
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Select a savings goal before recording
                activity.
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              if (selectedGoal) {
                setDialogMode(
                  "view-goal"
                );

                setSelectedActivity(
                  null
                );

                setActivityErrors(
                  {}
                );

                setSaveError("");

                return;
              }

              closeDialog();
            }}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={
              handleSaveActivity
            }
          >
            {dialogMode ===
            "edit-activity"
              ? "Update Activity"
              : "Record Activity"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={
          dialogMode ===
            "view-goal" &&
          selectedGoal !==
            null &&
          selectedProgress !==
            undefined
        }
        onClose={
          closeAllDialogs
        }
        className="max-w-5xl"
      >
        <DialogHeader
          title="Savings Goal Details"
        />

        <DialogBody className="max-h-[80vh] overflow-y-auto">
          {selectedGoal &&
            selectedProgress && (
              <SavingsGoalDetails
                goal={
                  selectedGoal
                }
                progress={
                  selectedProgress
                }
                activities={
                  selectedActivities
                }
                members={
                  allMembers
                }
                accounts={
                  accounts
                }
                currency={
                  currency
                }
                onClose={
                  closeAllDialogs
                }
                onRecordActivity={
                  selectedGoal.status ===
                    "archived"
                    ? undefined
                    : handleRecordActivity
                }
                onEditGoal={
                  selectedGoal.status ===
                    "archived"
                    ? undefined
                    : handleEditGoal
                }
                onEditActivity={
                  selectedGoal.status ===
                    "archived"
                    ? undefined
                    : handleEditActivity
                }
                onDeleteActivity={
                  selectedGoal.status ===
                    "archived"
                    ? undefined
                    : requestDeleteActivity
                }
              />
            )}
        </DialogBody>
      </Dialog>

      <ConfirmDialog
        open={
          confirmation !==
          null
        }
        title={
          confirmationTitle
        }
        message={
          confirmationMessage
        }
        confirmLabel={
          confirmationLabel
        }
        cancelLabel="Cancel"
        variant={
          confirmationVariant
        }
        onConfirm={
          confirmRequestedAction
        }
        onCancel={
          cancelConfirmation
        }
      />
    </>
  );
}