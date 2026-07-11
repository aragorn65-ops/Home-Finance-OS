import "./WizardFooter.css";

import Button from "../Button";

interface WizardFooterProps {
  onBack?: () => void;
  onNext: () => void;

  backLabel?: string;
  nextLabel?: string;

  nextDisabled?: boolean;
}

export default function WizardFooter({
  onBack,
  onNext,
  backLabel = "← Back",
  nextLabel = "Continue →",
  nextDisabled = false,
}: WizardFooterProps) {
  return (
    <div className="wizard-footer">

     {onBack ? (
  <Button
    variant="secondary"
    onClick={onBack}
  >
    {backLabel}
  </Button>
) : (
  <div />
)}

      <Button
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </Button>

    </div>
  );
}