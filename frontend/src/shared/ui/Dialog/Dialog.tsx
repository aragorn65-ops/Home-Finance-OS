import "./Dialog.css";

import {
  useEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export interface DialogProps
  extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  closeOnBackdrop?: boolean;
}

export default function Dialog({
  open,
  children,
  onClose,
  closeOnBackdrop = true,
  className = "",
  ...props
}: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const dialogClasses = [
    "hfos-dialog",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className="hfos-dialog-overlay"
        onClick={
          closeOnBackdrop
            ? onClose
            : undefined
        }
        aria-hidden="true"
      />

      <div
        className="hfos-dialog-viewport"
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          className={dialogClasses}
          onClick={(event) =>
            event.stopPropagation()
          }
          {...props}
        >
          {children}
        </div>
      </div>
    </>
  );
}
