import type {
  HTMLAttributes,
} from "react";

export type DialogFooterProps =
  HTMLAttributes<HTMLDivElement>;

export default function DialogFooter({
  children,
  className = "",
  ...props
}: DialogFooterProps) {
  const classes = [
    "hfos-dialog__footer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer
      className={classes}
      {...props}
    >
      {children}
    </footer>
  );
}
