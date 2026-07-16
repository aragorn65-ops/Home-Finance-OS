import type {
  HTMLAttributes,
} from "react";

export type DialogBodyProps =
  HTMLAttributes<HTMLDivElement>;

export default function DialogBody({
  children,
  className = "",
  ...props
}: DialogBodyProps) {
  const classes = [
    "hfos-dialog__body",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
}
