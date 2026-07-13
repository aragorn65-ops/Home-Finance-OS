import { ChangeEvent } from "react";
import { Input, Select } from "../../../shared/ui";
import {
  AccountForm as AccountFormModel,
} from "../models/AccountForm";

interface AccountFormProps {
  value: AccountFormModel;
  onChange: (value: AccountFormModel) => void;
}

const accountTypes = [
  { label: "Checking", value: "Checking" },
  { label: "Savings", value: "Savings" },
  { label: "Credit Card", value: "Credit Card" },
  { label: "Cash", value: "Cash" },
  { label: "Investment", value: "Investment" },
  { label: "Loan", value: "Loan" },
];

const currencies = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "PHP", value: "PHP" },
];

export default function AccountForm({
  value,
  onChange,
}: AccountFormProps) {
  const updateField = <K extends keyof AccountFormModel>(
    field: K,
    fieldValue: AccountFormModel[K]
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Account Name"
        value={value.name}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField("name", e.target.value)
        }
      />

      <Input
        label="Institution"
        value={value.institution}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField("institution", e.target.value)
        }
      />

      <Select
        label="Account Type"
        value={value.type}
        options={accountTypes}
        onChange={(e) =>
          updateField("type", e.target.value)
        }
      />

      <Select
        label="Currency"
        value={value.currency}
        options={currencies}
        onChange={(e) =>
          updateField("currency", e.target.value)
        }
      />

      <Input
        label="Opening Balance"
        type="number"
        value={value.balance}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateField(
            "balance",
            Number(e.target.value)
          )
        }
      />
    </div>
  );
}