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
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={
          closeOnBackdrop ? onClose : undefined
        }
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "w-full",
            "max-w-lg",
            "rounded-xl",
            "bg-white",
            "shadow-xl",
            "transition-all",
            "duration-200",
            "scale-100",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </div>
    </>
  );
}