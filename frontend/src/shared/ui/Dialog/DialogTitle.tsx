import {
  type HTMLAttributes,
} from "react";

import {
  useDialogContext,
} from "./DialogContext";

export type DialogTitleProps =
  HTMLAttributes<HTMLHeadingElement>;

export default function DialogTitle({
  children,
  className = "",
  ...props
}: DialogTitleProps) {
  const dialogContext =
    useDialogContext();

  const classes = [
    "hfos-dialog__title",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <h2
      {...props}
      id={
        props.id ??
        dialogContext?.titleId
      }
      className={classes}
    >
      {children}
    </h2>
  );
}
