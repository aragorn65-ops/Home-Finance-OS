import {
  useLayoutEffect,
  type HTMLAttributes,
} from "react";

import {
  useDialogContext,
} from "./DialogContext";

export type DialogDescriptionProps =
  HTMLAttributes<HTMLParagraphElement>;

export default function DialogDescription({
  children,
  ...props
}: DialogDescriptionProps) {
  const dialogContext =
    useDialogContext();

  useLayoutEffect(() => {
    return dialogContext
      ?.registerDescription();
  }, [dialogContext]);

  return (
    <p
      {...props}
      id={
        props.id ??
        dialogContext?.descriptionId
      }
    >
      {children}
    </p>
  );
}
