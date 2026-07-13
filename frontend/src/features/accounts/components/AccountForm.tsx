import type { ChangeEvent } from "react";

import {
  Input,
  Select,
} from "../../../shared/ui";

import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type {
  AccountClass,
  AccountType,
  AccountVisibility,
} from "../models/Account";

import type {
  AccountForm as AccountFormModel,
} from "../models/AccountForm";

interface AccountFormProps {
  value: AccountFormModel;
  members: HouseholdMember[];
  onChange: (
    value: AccountFormModel
  ) => void;
}

const accountClasses = [
  {
    label: "Asset",
    value: "asset",
  },
  {
    label: "Liability",
    value: "liability",
  },
];

const assetAccountTypes = [
  {
    label: "Checking",
    value: "checking",
  },
  {
    label: "Savings",
    value: "savings",
  },
  {
    label: "Cash",
    value: "cash",
  },
  {
    label: "E-Wallet",
    value: "e-wallet",
  },
  {
    label: "Investment",
    value: "investment",
  },
  {
    label: "Other Asset",
    value: "other-asset",
  },
];

const liabilityAccountTypes = [
  {
    label: "Credit Card",
    value: "credit-card",
  },
  {
    label: "Line of Credit",
    value: "line-of-credit",
  },
  {
    label: "Loan",
    value: "loan",
  },
  {
    label: "Mortgage",
    value: "mortgage",
  },
  {
    label: "Other Liability",
    value: "other-liability",
  },
];

const accountVisibilities = [
  {
    label: "Household",
    value: "household",
  },
  {
    label: "Private",
    value: "private",
  },
];

const currencies = [
  {
    label: "PHP",
    value: "PHP",
  },
  {
    label: "USD",
    value: "USD",
  },
  {
    label: "EUR",
    value: "EUR",
  },
  {
    label: "GBP",
    value: "GBP",
  },
];

export default function AccountForm({
  value,
  members,
  onChange,
}: AccountFormProps) {
  const updateField = <
    Field extends keyof AccountFormModel,
  >(
    field: Field,
    fieldValue: AccountFormModel[Field]
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleAccountClassChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const accountClass =
      event.target.value as AccountClass;

    const nextType: AccountType =
      accountClass === "asset"
        ? "checking"
        : "credit-card";

    onChange({
      ...value,

      accountClass,
      type: nextType,

      creditLimit: 0,
      statementBalance: 0,
      minimumPayment: 0,
      paymentDueDate: "",
    });
  };

  const handleAccountTypeChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const accountType =
      event.target.value as AccountType;

    if (accountType !== "credit-card") {
      onChange({
        ...value,

        type: accountType,

        creditLimit: 0,
        statementBalance: 0,
        minimumPayment: 0,
        paymentDueDate: "",
      });

      return;
    }

    updateField("type", accountType);
  };

  const memberOptions = members.map(
    (member) => ({
      label: member.displayName,
      value: member.id,
    })
  );

  const accountTypeOptions =
    value.accountClass === "asset"
      ? assetAccountTypes
      : liabilityAccountTypes;

  const isCreditCard =
    value.accountClass === "liability" &&
    value.type === "credit-card";

  const balanceLabel =
    value.accountClass === "liability"
      ? "Current Amount Owed"
      : "Opening Balance";

  return (
    <div className="space-y-4">
      <Select
        label="Account Owner"
        value={value.ownerMemberId}
        options={memberOptions}
        onChange={(event) =>
          updateField(
            "ownerMemberId",
            event.target.value
          )
        }
      />

      <Select
        label="Visibility"
        value={value.visibility}
        options={accountVisibilities}
        onChange={(event) =>
          updateField(
            "visibility",
            event.target
              .value as AccountVisibility
          )
        }
      />

      <Input
        label="Account Name"
        value={value.name}
        onChange={(
          event: ChangeEvent<HTMLInputElement>
        ) =>
          updateField(
            "name",
            event.target.value
          )
        }
      />

      <Input
        label="Institution"
        value={value.institution}
        onChange={(
          event: ChangeEvent<HTMLInputElement>
        ) =>
          updateField(
            "institution",
            event.target.value
          )
        }
      />

      <Select
        label="Account Class"
        value={value.accountClass}
        options={accountClasses}
        onChange={handleAccountClassChange}
      />

      <Select
        label="Account Type"
        value={value.type}
        options={accountTypeOptions}
        onChange={handleAccountTypeChange}
      />

      <Select
        label="Currency"
        value={value.currency}
        options={currencies}
        onChange={(event) =>
          updateField(
            "currency",
            event.target.value
          )
        }
      />

      <Input
        label={balanceLabel}
        type="number"
        min="0"
        step="0.01"
        value={value.balance}
        onChange={(
          event: ChangeEvent<HTMLInputElement>
        ) =>
          updateField(
            "balance",
            Number(event.target.value)
          )
        }
      />

      {isCreditCard && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="font-medium text-foreground">
              Credit Card Details
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              The current amount owed is tracked as the
              liability account balance.
            </p>
          </div>

          <Input
            label="Credit Limit"
            type="number"
            min="0"
            step="0.01"
            value={value.creditLimit}
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              updateField(
                "creditLimit",
                Number(event.target.value)
              )
            }
          />

          <Input
            label="Current Statement Balance"
            type="number"
            min="0"
            step="0.01"
            value={value.statementBalance}
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              updateField(
                "statementBalance",
                Number(event.target.value)
              )
            }
          />

          <Input
            label="Minimum Payment"
            type="number"
            min="0"
            step="0.01"
            value={value.minimumPayment}
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              updateField(
                "minimumPayment",
                Number(event.target.value)
              )
            }
          />

          <Input
            label="Payment Due Date"
            type="date"
            value={value.paymentDueDate}
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              updateField(
                "paymentDueDate",
                event.target.value
              )
            }
          />
        </div>
      )}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={value.isActive}
          onChange={(
            event: ChangeEvent<HTMLInputElement>
          ) =>
            updateField(
              "isActive",
              event.target.checked
            )
          }
          className="h-4 w-4 rounded border"
        />

        <span className="text-sm text-foreground">
          Active account
        </span>
      </label>
    </div>
  );
}