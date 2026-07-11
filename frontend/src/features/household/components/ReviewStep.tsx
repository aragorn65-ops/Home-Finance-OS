import Card from "../../../shared/ui/Card";
import WizardFooter from "../../../shared/ui/WizardFooter";
import "./ReviewStep.css";

interface ReviewStepProps {
  householdName: string;
  country: string;
  currency: string;
  timezone: string;
  onBack: () => void;
  onCreate: () => void;
}

export default function ReviewStep({
  householdName,
  country,
  currency,
  timezone,
  onBack,
  onCreate,
}: ReviewStepProps) {
  return (
    <Card>
      <h2>Review Your Household</h2>

      <p
        style={{
          color: "#64748B",
          marginBottom: "32px",
          lineHeight: 1.7,
        }}
      >
        Take a moment to review your household information before continuing.
      </p>

      <div className="review-list">

        <div className="review-item">
          <span>Household</span>
          <strong>{householdName}</strong>
        </div>

        <div className="review-item">
          <span>Country</span>
          <strong>{country}</strong>
        </div>

        <div className="review-item">
          <span>Currency</span>
          <strong>{currency}</strong>
        </div>

        <div className="review-item">
          <span>Time Zone</span>
          <strong>{timezone}</strong>
        </div>

      </div>

      <WizardFooter
        onBack={onBack}
        onNext={onCreate}
        nextLabel="Create Household"
      />
    </Card>
  );
}