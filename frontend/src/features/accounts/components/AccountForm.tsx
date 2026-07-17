import type { ChangeEvent } from "react";

import {
  CurrencyInput,
  Input,
  Select,
} from "../../../shared/ui";

import {
  currencies,
} from "../../../shared/data/currencies";
import formatCurrency from "../../../shared/utils/formatCurrency";
import {
  normalizeCurrency,
  roundCurrencyAmount,
} from "../../../shared/utils/currencyConversion";

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
  baseCurrency?: string;
  isEditing?: boolean;
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

export default function AccountForm({
  value,
  members,
  baseCurrency = "PHP",
  isEditing = false,
  onChange,
}: AccountFormProps) {
  const normalizedBaseCurrency =
    normalizeCurrency(baseCurrency);

  const normalizedAccountCurrency =
    normalizeCurrency(
      value.currency,
      normalizedBaseCurrency
    );

  const isForeignCurrencyAccount =
    normalizedAccountCurrency !==
    normalizedBaseCurrency;

  const baseBalancePreview =
    roundCurrencyAmount(
      value.balance *
        (isForeignCurrencyAccount
          ? value.exchangeRate
          : 1)
    );

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

  const handleCurrencyChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const nextCurrency =
      normalizeCurrency(
        event.target.value,
        normalizedBaseCurrency
      );

    onChange({
      ...value,

      currency:
        nextCurrency,

      baseCurrency:
        normalizedBaseCurrency,

      exchangeRate:
        nextCurrency ===
        normalizedBaseCurrency
          ? 1
          : value.exchangeRate > 0
            ? value.exchangeRate
            : 1,
    });
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
      : isEditing
        ? "Current Balance"
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
        options={currencies.filter(
          (currency) =>
            currency.value
        )}
        onChange={handleCurrencyChange}
      />

      {isForeignCurrencyAccount && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="font-medium text-foreground">
              Base Currency Reporting
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Account balance stays in{" "}
              {normalizedAccountCurrency}; summaries use{" "}
              {normalizedBaseCurrency}.
            </p>
          </div>

          <Input
            label={`Exchange Rate to ${normalizedBaseCurrency}`}
            type="number"
            min="0.000001"
            step="0.000001"
            value={value.exchangeRate}
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              updateField(
                "exchangeRate",
                Number(
                  event.target.value
                )
              )
            }
          />

          <Input
            label="Rate Effective Date"
            type="date"
            value={
              value.exchangeRateEffectiveDate
            }
            onChange={(
              event: ChangeEvent<HTMLInputElement>
            ) =>
              updateField(
                "exchangeRateEffectiveDate",
                event.target.value
              )
            }
          />

          <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Reporting equivalent:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(
                baseBalancePreview,
                normalizedBaseCurrency
              )}
            </span>
          </p>
        </div>
      )}

      <CurrencyInput
        label={balanceLabel}
        min="0"
        value={value.balance}
        onValueChange={(nextValue) =>
          updateField(
            "balance",
            nextValue
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

          <CurrencyInput
            label="Credit Limit"
            min="0"
            value={value.creditLimit}
            onValueChange={(nextValue) =>
              updateField(
                "creditLimit",
                nextValue
              )
            }
          />

          <CurrencyInput
            label="Current Statement Balance"
            min="0"
            value={value.statementBalance}
            onValueChange={(nextValue) =>
              updateField(
                "statementBalance",
                nextValue
              )
            }
          />

          <CurrencyInput
            label="Minimum Payment"
            min="0"
            value={value.minimumPayment}
            onValueChange={(nextValue) =>
              updateField(
                "minimumPayment",
                nextValue
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
