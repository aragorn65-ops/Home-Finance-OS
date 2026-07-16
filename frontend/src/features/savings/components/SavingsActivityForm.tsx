import type {
  ChangeEvent,
} from "react";

import {
  Input,
  Select,
} from "../../../shared/ui";

import type {
  Account,
} from "../../accounts/models/Account";

import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";

import type {
  SavingsActivityType,
} from "../models/SavingsActivity";

import type {
  SavingsActivityForm as SavingsActivityFormModel,
} from "../models/SavingsActivityForm";

interface SavingsActivityFormProps {
  value: SavingsActivityFormModel;

  members: HouseholdMember[];
  accounts: Account[];

  errors?: Record<string, string>;

  onChange: (
    value: SavingsActivityFormModel
  ) => void;
}

const activityTypeOptions = [
  {
    label: "Contribution",
    value: "contribution",
  },
  {
    label: "Withdrawal",
    value: "withdrawal",
  },
  {
    label: "Adjustment",
    value: "adjustment",
  },
];

export default function SavingsActivityForm({
  value,
  members,
  accounts,
  errors = {},
  onChange,
}: SavingsActivityFormProps) {
  const updateField = <
    Field extends keyof SavingsActivityFormModel,
  >(
    field: Field,
    fieldValue:
      SavingsActivityFormModel[Field]
  ) => {
    onChange({
      ...value,

      [field]:
        fieldValue,
    });
  };

  const memberOptions = [
    {
      label:
        "Select household member",
      value: "",
    },

    ...members
      .filter(
        (member) =>
          member.isActive
      )
      .map(
        (member) => ({
          label:
            member.displayName,

          value:
            member.id,
        })
      ),
  ];

  const availableAccounts =
    accounts.filter(
      (account) =>
        account.isActive &&
        account.accountClass ===
          "asset" &&
        (
          account.visibility ===
            "household" ||
          account.ownerMemberId ===
            value.memberId
        )
    );

  const accountOptions = [
    {
      label:
        "No account balance effect",
      value: "",
    },

    ...availableAccounts.map(
      (account) => ({
        label:
          account.visibility ===
          "private"
            ? `${account.name} — Private`
            : account.name,

        value:
          account.id,
      })
    ),
  ];

  const handleMemberChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const memberId =
      event.target.value;

    const selectedAccount =
      accounts.find(
        (account) =>
          account.id ===
          value.accountId
      );

    const mayKeepSelectedAccount =
      !selectedAccount ||
      selectedAccount.visibility ===
        "household" ||
      selectedAccount.ownerMemberId ===
        memberId;

    onChange({
      ...value,

      memberId,

      accountId:
        mayKeepSelectedAccount
          ? value.accountId
          : "",
    });
  };

  const handleActivityTypeChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const activityType =
      event.target
        .value as SavingsActivityType;

    onChange({
      ...value,

      activityType,

      amount:
        activityType !==
          "adjustment" &&
        value.amount < 0
          ? Math.abs(
              value.amount
            )
          : value.amount,
    });
  };

  const amountHelperText =
    value.activityType ===
    "adjustment"
      ? "Use a positive amount to increase savings or a negative amount to decrease savings."
      : value.activityType ===
          "withdrawal"
        ? "The withdrawal cannot exceed the amount currently saved."
        : "The contribution increases the amount saved.";

  return (
    <div className="space-y-4">
      <Select
        label="Household Member"
        value={value.memberId}
        options={memberOptions}
        error={errors.memberId}
        onChange={
          handleMemberChange
        }
      />

      <Select
        label="Activity Type"
        value={value.activityType}
        options={
          activityTypeOptions
        }
        error={errors.activityType}
        onChange={
          handleActivityTypeChange
        }
      />

      <Input
        label="Amount"
        type="number"
        min={
          value.activityType ===
          "adjustment"
            ? undefined
            : "0.01"
        }
        step="0.01"
        value={value.amount}
        error={errors.amount}
        helperText={
          amountHelperText
        }
        onChange={(
          event:
            ChangeEvent<HTMLInputElement>
        ) =>
          updateField(
            "amount",
            Number(
              event.target.value
            )
          )
        }
      />

      <Input
        label="Activity Date"
        type="date"
        value={value.activityDate}
        error={errors.activityDate}
        onChange={(
          event:
            ChangeEvent<HTMLInputElement>
        ) =>
          updateField(
            "activityDate",
            event.target.value
          )
        }
      />

      <Select
        label="Source or Destination Account"
        value={value.accountId}
        options={accountOptions}
        error={errors.accountId}
        helperText={
          value.memberId
            ? "Household accounts and the selected member's private accounts are available."
            : "Select a household member to view eligible private accounts."
        }
        onChange={(
          event:
            ChangeEvent<HTMLSelectElement>
        ) =>
          updateField(
            "accountId",
            event.target.value
          )
        }
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="savings-activity-notes"
          className="text-sm font-medium text-gray-700"
        >
          Notes
        </label>

        <textarea
          id="savings-activity-notes"
          value={value.notes}
          rows={3}
          placeholder="Optional details about this savings activity."
          onChange={(
            event:
              ChangeEvent<HTMLTextAreaElement>
          ) =>
            updateField(
              "notes",
              event.target.value
            )
          }
          className={[
            "w-full rounded-lg border border-gray-300",
            "px-3 py-2",
            "text-sm",
            "outline-none",
            "transition",
            "focus:border-blue-500",
            "focus:ring-2 focus:ring-blue-500/20",
            errors.notes
              ? "border-red-500"
              : "",
          ].join(" ")}
        />

        {errors.notes && (
          <p className="text-sm text-red-600">
            {errors.notes}
          </p>
        )}
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={value.isActive}
          onChange={(
            event:
              ChangeEvent<HTMLInputElement>
          ) =>
            updateField(
              "isActive",
              event.target.checked
            )
          }
          className="h-4 w-4 rounded border"
        />

        <span className="text-sm text-foreground">
          Include this activity in goal progress
        </span>
      </label>

      {errors.savingsGoalId && (
        <p className="text-sm text-red-600">
          {errors.savingsGoalId}
        </p>
      )}

      {errors.householdId && (
        <p className="text-sm text-red-600">
          {errors.householdId}
        </p>
      )}

      {errors.general && (
        <p className="text-sm text-red-600">
          {errors.general}
        </p>
      )}
    </div>
  );
}