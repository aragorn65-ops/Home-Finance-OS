import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "..";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;

  confirmLabel?: string;
  cancelLabel?: string;

  variant?: "primary" | "danger";

  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isConfirming?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
    >
      <DialogHeader title={title} />

      <DialogBody>
        <p
          style={{
            color:
              "var(--color-text-muted)",
            fontSize:
              "var(--font-size-sm)",
            lineHeight:
              "var(--line-height-relaxed)",
          }}
        >
          {message}
        </p>
      </DialogBody>

      <DialogFooter>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>

        <Button
          variant={variant}
          onClick={() => {
            void onConfirm();
          }}
          disabled={isConfirming}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
