import {
  useLayoutEffect,
  type ReactNode,
} from "react";

import {
  useDialogContext,
} from "./DialogContext";

import DialogTitle from "./DialogTitle";

export interface DialogHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function DialogHeader({
  title,
  actions,
}: DialogHeaderProps) {
  const dialogContext =
    useDialogContext();

  useLayoutEffect(() => {
    return dialogContext?.registerTitle();
  }, [dialogContext]);

  return (
    <header className="hfos-dialog__header">
      <DialogTitle>
        {title}
      </DialogTitle>

      {actions && (
        <div className="hfos-dialog__actions">
          {actions}
        </div>
      )}
    </header>
  );
}
