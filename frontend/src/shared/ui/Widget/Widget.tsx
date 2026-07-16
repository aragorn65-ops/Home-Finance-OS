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
    <section className="widget">
      <header className="widget-header">
        <h2>{title}</h2>
      </header>

      <div className="widget-body">
        {children}
      </div>
    </section>
  );
}