import Card from "../../../shared/ui/Card";
import Select from "../../../shared/ui/Select";
import WizardFooter from "../../../shared/ui/WizardFooter";

import { countries } from "../../../shared/data/countries";

interface CountryStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CountryStep({
  value,
  onChange,
  onNext,
  onBack,
}: CountryStepProps) {
  return (
    <Card>
      <h2>Where is your household located?</h2>

      <p
        style={{
          color: "#64748B",
          marginBottom: "24px",
          lineHeight: 1.7,
        }}
      >
        We'll use this to determine your default currency and regional
        preferences.
      </p>

      <Select
        id="country"
        label="Country"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={countries}
        helperText="This helps personalize your Home Finance OS experience."
      />

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!value}
      />
    </Card>
  );
}