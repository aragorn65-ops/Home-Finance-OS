import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import WizardFooter from "../../../shared/ui/WizardFooter";

interface HouseholdNameStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext?: () => void;
}

export default function HouseholdNameStep({
  value,
  onChange,
  onNext,
}: HouseholdNameStepProps) {
  return (
    <Card>
      <h2>What would you like to call your household?</h2>

      <p
        style={{
          color: "#64748B",
          marginBottom: "24px",
          lineHeight: 1.7,
        }}
      >
        This name helps identify your household throughout Home Finance OS.
      </p>

      <Input
        id="household-name"
        label="Household Name"
        placeholder="e.g. The Bunsoy Family"
        helperText="You can change this later in Settings."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <WizardFooter
        onNext={onNext ?? (() => {})}
        nextLabel="Create Household →"
        nextDisabled={!value.trim()}
      />
    </Card>
  );
}