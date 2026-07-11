import "./WidgetHeader.css";
import type { ReactNode } from "react";

interface WidgetHeaderProps {
  title: string;
  action?: ReactNode;
}

export default function WidgetHeader({
  title,
  action,
}: WidgetHeaderProps) {
  return (
    <div className="widget-header">
      <h2>{title}</h2>

      {action && (
        <div className="widget-action">
          {action}
        </div>
      )}
    </div>
  );
}