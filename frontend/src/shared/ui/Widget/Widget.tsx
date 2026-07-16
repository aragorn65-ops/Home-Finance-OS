import "./Widget.css";
import type { ReactNode } from "react";

interface WidgetProps {
  title: string;
  children: ReactNode;
}

export default function Widget({
  title,
  children,
}: WidgetProps) {
  return (
    <section className="hfos-widget">
      <header className="hfos-widget__header">
        <h2 className="hfos-widget__title">
          {title}
        </h2>
      </header>

      <div className="hfos-widget__body">
        {children}
      </div>
    </section>
  );
}
