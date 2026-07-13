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
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={onSave}
        >
          {saveLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}