import type { ReactNode } from "react";

import {
  Button,
} from "../../../shared/ui";

import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "../../../shared/ui/Dialog";

export interface AccountDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  saveLabel?: string;
  isSaving?: boolean;
}

export default function AccountDialog({
  open,
  title,
  children,
  onClose,
  onSave,
  saveLabel = "Save",
  isSaving = false,
}: AccountDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogHeader title={title} />

      <DialogBody>
        {children}
      </DialogBody>

      <DialogFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            void onSave();
          }}
          disabled={isSaving}
        >
          {isSaving
            ? "Saving..."
            : saveLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
