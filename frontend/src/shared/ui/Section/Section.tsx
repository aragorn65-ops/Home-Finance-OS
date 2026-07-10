import "./Section.css";
import type { ReactNode } from "react";

interface SectionProps {
  title?: string;
  children: ReactNode;
}

export default function Section({
  title,
  children,
}: SectionProps) {
  return (
    <section className="hfos-section">
      {title && (
        <h2 className="hfos-section-title">
          {title}
        </h2>
      )}

      {children}
    </section>
  );
}
