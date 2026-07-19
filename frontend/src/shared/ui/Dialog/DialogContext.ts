import {
  createContext,
  useContext,
  type Context,
} from "react";

export interface DialogContextValue {
  titleId: string;
  descriptionId: string;
  registerTitle: () => () => void;
  registerDescription: () => () => void;
}

const DialogContext: Context<
  DialogContextValue | null
> = createContext<DialogContextValue | null>(
  null
);

export function useDialogContext():
  DialogContextValue | null {
  return useContext(DialogContext);
}

export default DialogContext;
