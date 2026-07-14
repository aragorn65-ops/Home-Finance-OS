import type { HTMLAttributes } from "react";

export type DialogBodyProps =
  HTMLAttributes<HTMLDivElement>;

export default function DialogBody({
  children,
  className = "",
  ...props
}: DialogBodyProps) {
  return (
    <div
      className={[
        "px-6",
        "py-5",
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