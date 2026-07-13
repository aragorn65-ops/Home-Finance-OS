import { ReactNode } from "react";
import { Button } from "../../../shared/ui";

export interface AccountDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
}

export default function AccountDialog({
  open,
  title,
  children,
  onClose,
  onSave,
  saveLabel = "Save",
}: AccountDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">
              {title}
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {children}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t px-6 py-4">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={onSave}
            >
              {saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
