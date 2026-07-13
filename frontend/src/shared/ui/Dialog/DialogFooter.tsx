import type { HTMLAttributes } from "react";

export interface DialogFooterProps
  extends HTMLAttributes<HTMLDivElement> {}

export default function DialogFooter({
  children,
  className = "",
  ...props
}: DialogFooterProps) {
  return (
    <div
      className={[
        "flex",
        "justify-end",
        "gap-3",
        "border-t",
        "px-6",
        "py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}