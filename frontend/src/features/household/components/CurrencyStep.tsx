import Card from "../../../shared/ui/Card";
import Select from "../../../shared/ui/Select";
import WizardFooter from "../../../shared/ui/WizardFooter";

import { currencies } from "../../../shared/data/currencies";

interface CurrencyStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CurrencyStep({
  value,
  onChange,
  onNext,
  onBack,
}: CurrencyStepProps) {
  return (
    <Card>
      <h2>Which currency does your household use?</h2>

      <p
        style={{
          color: "#64748B",
          marginBottom: "24px",
          lineHeight: 1.7,
        }}
      >
        This will become the default currency for your household's transactions,
        budgets, and reports.
      </p>

      <Select
        id="currency"
        label="Currency"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={currencies}
        helperText="You can change this later in Settings."
      />

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!value}
      />
    </Card>
  );
}