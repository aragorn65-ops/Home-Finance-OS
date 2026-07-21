import "./EmptyState.css";

import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  title,
  message,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  const classes = [
    "hfos-empty-state",
    compact ? "hfos-empty-state--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <h3 className="hfos-empty-state__title">{title}</h3>

      <p className="hfos-empty-state__message">{message}</p>

      {action ? (
        <div className="hfos-empty-state__action">
          {action}
        </div>
      ) : null}
    </div>
  );
}
