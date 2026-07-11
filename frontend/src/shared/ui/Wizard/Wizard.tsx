import "./Wizard.css";

import type { ReactNode } from "react";

interface WizardProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
}

export default function Wizard({
  title,
  description,
  currentStep,
  totalSteps,
  children,
}: WizardProps) {
  return (
    <div className="wizard">
      <div className="wizard-header">
        <div className="wizard-dots">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={
                index < currentStep
                  ? "dot active"
                  : "dot"
              }
            />
          ))}
        </div>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      <div className="wizard-content">
        {children}
      </div>
    </div>
  );
}