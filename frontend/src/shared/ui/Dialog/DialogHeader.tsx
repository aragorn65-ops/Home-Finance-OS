import type { ReactNode } from "react";

export interface DialogHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function DialogHeader({
  title,
  actions,
}: DialogHeaderProps) {
  return (
    <header className="hfos-dialog__header">
      <h2 className="hfos-dialog__title">
        {title}
      </h2>

      {actions && (
        <div className="hfos-dialog__actions">
          {actions}
        </div>
      )}
    </header>
  );
}
