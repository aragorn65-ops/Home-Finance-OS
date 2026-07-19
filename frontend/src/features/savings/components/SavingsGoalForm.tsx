import type {
  ChangeEvent,
} from "react";

import {
  CurrencyInput,
  Input,
  Select,
} from "../../../shared/ui";
import CurrencyRateLookupButton from "../../../shared/ui/CurrencyRateLookupButton";

import {
  currencies,
} from "../../../shared/data/currencies";
import {
  normalizeCurrency,
} from "../../../shared/utils/currencyConversion";

import type {
  Account,
} from "../../accounts/models/Account";

import type {
  SavingsGoalPriority,
  SavingsGoalStatus,
  SavingsGoalType,
} from "../models/SavingsGoal";

import type {
  SavingsGoalForm as SavingsGoalFormModel,
} from "../models/SavingsGoalForm";

interface SavingsGoalFormProps {
  value: SavingsGoalFormModel;
  accounts: Account[];
  baseCurrency: string;
  errors?: Record<string, string>;

  onChange: (
    value: SavingsGoalFormModel
  ) => void;
}

const goalTypeOptions = [
  {
    label: "Emergency Fund",
    value: "emergency-fund",
  },
  {
    label: "Vacation",
    value: "vacation",
  },
  {
    label: "Annual Insurance",
    value: "annual-insurance",
  },
  {
    label: "Home Repair",
    value: "home-repair",
  },
  {
    label: "Tuition",
    value: "tuition",
  },
  {
    label: "Vehicle Maintenance",
    value: "vehicle-maintenance",
  },
  {
    label: "Appliance Replacement",
    value: "appliance-replacement",
  },
  {
    label: "General Savings",
    value: "general",
  },
  {
    label: "Other",
    value: "other",
  },
];

const priorityOptions = [
  {
    label: "Low",
    value: "low",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "High",
    value: "high",
  },
  {
    label: "Critical",
    value: "critical",
  },
];

const statusOptions = [
  {
    label: "Not Started",
    value: "not-started",
  },
  {
    label: "In Progress",
    value: "in-progress",
  },
  {
    label: "Completed",
    value: "completed",
  },
  {
    label: "Paused",
    value: "paused",
  },
];

export default function SavingsGoalForm({
  value,
  accounts,
  baseCurrency,
  errors = {},
  onChange,
}: SavingsGoalFormProps) {
  const normalizedGoalCurrency =
    normalizeCurrency(
      value.goalCurrency,
      baseCurrency
    );

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const updateField = <
    Field extends keyof SavingsGoalFormModel,
  >(
    field: Field,
    fieldValue:
      SavingsGoalFormModel[Field]
  ) => {
    onChange({
      ...value,

      [field]:
        fieldValue,
    });
  };

  const linkedAccountOptions = [
    {
      label:
        "No linked account",
      value: "",
    },

    ...accounts
      .filter(
        (account) =>
          account.isActive &&
          account.accountClass ===
            "asset"
      )
      .map(
        (account) => ({
          label:
            account.name,
          value:
            account.id,
        })
      ),
  ];

  return (
    <div className="space-y-4">
      <Input
        label="Goal Name"
        value={value.name}
        error={errors.name}
        placeholder="Example: Emergency Fund"
        onChange={(
          event:
            ChangeEvent<HTMLInputElement>
        ) =>
          updateField(
            "name",
            event.target.value
          )
        }
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="savings-goal-description"
          className="text-sm font-medium text-gray-700"
        >
          Description or Notes
        </label>

        <textarea
          id="savings-goal-description"
          value={value.description}
          rows={4}
          placeholder="Describe what this savings goal is for."
          onChange={(
            event:
              ChangeEvent<HTMLTextAreaElement>
          ) =>
            updateField(
              "description",
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
            errors.description
              ? "border-red-500"
              : "",
          ].join(" ")}
        />

        {errors.description && (
          <p className="text-sm text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <Select
        label="Goal Type"
        value={value.goalType}
        options={goalTypeOptions}
        error={errors.goalType}
        onChange={(
          event:
            ChangeEvent<HTMLSelectElement>
        ) =>
          updateField(
            "goalType",
            event.target
              .value as SavingsGoalType
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencyInput
          label="Target Amount"
          min="0.01"
          value={value.targetAmount}
          error={errors.targetAmount}
          onValueChange={(nextValue) =>
            updateField(
              "targetAmount",
              nextValue
            )
          }
        />

        <Select
          label="Goal Currency"
          value={value.goalCurrency}
          options={
            currencies.filter(
              (currency) =>
                currency.value
            )
          }
          error={errors.goalCurrency}
          onChange={(
            event:
              ChangeEvent<HTMLSelectElement>
          ) =>
            onChange({
              ...value,
              goalCurrency:
                event.target.value,
              exchangeRateSource:
                "manual",
              exchangeRateProvider:
                "",
            })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Exchange Rate"
          type="number"
          step="0.000001"
          min="0.000001"
          value={value.exchangeRate}
          error={errors.exchangeRate}
          helperText="Base currency value for 1 unit of the goal currency."
          onChange={(
            event:
              ChangeEvent<HTMLInputElement>
          ) =>
            onChange({
              ...value,
              exchangeRate:
                Number(
                  event.target.value
                ),
              exchangeRateSource:
                "manual",
              exchangeRateProvider:
                "",
            })
          }
        />

        <Input
          label="Target Date"
          type="date"
          value={value.targetDate}
          error={errors.targetDate}
          helperText="Optional"
          onChange={(
            event:
              ChangeEvent<HTMLInputElement>
          ) =>
            updateField(
              "targetDate",
              event.target.value
            )
          }
        />
      </div>

      {normalizedGoalCurrency !==
        baseCurrency && (
        <CurrencyRateLookupButton
          fromCurrency={
            normalizedGoalCurrency
          }
          toCurrency={baseCurrency}
          effectiveDate={today}
          onRateSelected={(rate) =>
            onChange({
              ...value,
              exchangeRate:
                rate.rate,
              exchangeRateSource:
                rate.source,
              exchangeRateProvider:
                rate.providerName ?? "",
            })
          }
        />
      )}

      <Select
        label="Linked Savings Account"
        value={value.linkedAccountId}
        options={linkedAccountOptions}
        error={errors.linkedAccountId}
        helperText="Optional. Goal progress remains based on recorded savings activity."
        onChange={(
          event:
            ChangeEvent<HTMLSelectElement>
        ) =>
          updateField(
            "linkedAccountId",
            event.target.value
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Priority"
          value={value.priority}
          options={priorityOptions}
          error={errors.priority}
          onChange={(
            event:
              ChangeEvent<HTMLSelectElement>
          ) =>
            updateField(
              "priority",
              event.target
                .value as SavingsGoalPriority
            )
          }
        />

        <Select
          label="Status"
          value={value.status}
          options={statusOptions}
          error={errors.status}
          onChange={(
            event:
              ChangeEvent<HTMLSelectElement>
          ) =>
            updateField(
              "status",
              event.target
                .value as SavingsGoalStatus
            )
          }
        />
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
          Active savings goal
        </span>
      </label>

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
