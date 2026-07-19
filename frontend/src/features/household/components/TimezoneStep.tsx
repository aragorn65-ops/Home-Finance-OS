import Card from "../../../shared/ui/Card";
import Select from "../../../shared/ui/Select";
import WizardFooter from "../../../shared/ui/WizardFooter";

import { timezones } from "../../../shared/data/timezones";

interface TimezoneStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TimezoneStep({
  value,
  onChange,
  onNext,
  onBack,
}: TimezoneStepProps) {
  return (
    <Card>
      <h2>What is your household's time zone?</h2>

      <p
        style={{
          color: "#64748B",
          marginBottom: "24px",
          lineHeight: 1.7,
        }}
      >
        Your time zone is used for reminders, recurring transactions,
        reports, and daily summaries.
      </p>

      <Select
        id="timezone"
        label="Time Zone"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={timezones}
        helperText="Choose the primary time zone for your household. Some countries have multiple regional time zones."
      />

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        nextLabel="Review →"
        nextDisabled={!value}
      />
    </Card>
  );
}
