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
    <div className="flex items-center justify-between border-b px-6 py-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {title}
      </h2>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}