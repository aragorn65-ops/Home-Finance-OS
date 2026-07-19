import "./Dialog.css";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import DialogContext from "./DialogContext";

const focusableElementSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const openDialogStack: HTMLDivElement[] = [];

let bodyScrollLockCount = 0;
let previousBodyOverflow = "";

function lockBodyScroll(): void {
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";
  }

  bodyScrollLockCount += 1;
}

function unlockBodyScroll(): void {
  bodyScrollLockCount = Math.max(
    0,
    bodyScrollLockCount - 1
  );

  if (bodyScrollLockCount === 0) {
    document.body.style.overflow =
      previousBodyOverflow;

    previousBodyOverflow = "";
  }
}

function getFocusableElements(
  container: HTMLElement
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      focusableElementSelector
    )
  ).filter((element) => {
    const styles =
      window.getComputedStyle(element);

    return (
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !==
        "true" &&
      styles.display !== "none" &&
      styles.visibility !== "hidden"
    );
  });
}

function focusDialog(
  dialog: HTMLDivElement
): void {
  const focusableElements =
    getFocusableElements(dialog);

  const firstFocusableElement =
    focusableElements[0];

  if (firstFocusableElement) {
    firstFocusableElement.focus();

    return;
  }

  dialog.focus();
}

function trapFocus(
  event: KeyboardEvent,
  dialog: HTMLDivElement
): void {
  if (event.key !== "Tab") {
    return;
  }

  const focusableElements =
    getFocusableElements(dialog);

  if (focusableElements.length === 0) {
    event.preventDefault();
    dialog.focus();

    return;
  }

  const firstFocusableElement =
    focusableElements[0];

  const lastFocusableElement =
    focusableElements[
      focusableElements.length - 1
    ];

  const activeElement =
    document.activeElement;

  const focusIsInsideDialog =
    activeElement instanceof Node &&
    dialog.contains(activeElement);

  if (
    event.shiftKey &&
    (
      activeElement ===
        firstFocusableElement ||
      !focusIsInsideDialog
    )
  ) {
    event.preventDefault();
    lastFocusableElement.focus();

    return;
  }

  if (
    !event.shiftKey &&
    (
      activeElement ===
        lastFocusableElement ||
      !focusIsInsideDialog
    )
  ) {
    event.preventDefault();
    firstFocusableElement.focus();
  }
}

export interface DialogProps
  extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export default function Dialog({
  open,
  children,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
  role = "dialog",
  tabIndex = -1,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DialogProps) {
  const dialogRef =
    useRef<HTMLDivElement>(null);

  const onCloseRef =
    useRef(onClose);

  const previouslyFocusedElementRef =
    useRef<HTMLElement | null>(null);

  const generatedId = useId();

  const titleId =
    `${generatedId}-title`;

  const descriptionId =
    `${generatedId}-description`;

  const [
    hasRegisteredTitle,
    setHasRegisteredTitle,
  ] = useState(false);

  const [
    hasRegisteredDescription,
    setHasRegisteredDescription,
  ] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const registerTitle =
    useCallback(() => {
      setHasRegisteredTitle(true);

      return () => {
        setHasRegisteredTitle(false);
      };
    }, []);

  const registerDescription =
    useCallback(() => {
      setHasRegisteredDescription(true);

      return () => {
        setHasRegisteredDescription(
          false
        );
      };
    }, []);

  const contextValue = useMemo(
    () => ({
      titleId,
      descriptionId,
      registerTitle,
      registerDescription,
    }),
    [
      titleId,
      descriptionId,
      registerTitle,
      registerDescription,
    ]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof
      HTMLElement
        ? document.activeElement
        : null;

    openDialogStack.push(dialog);
    lockBodyScroll();

    const animationFrameId =
      window.requestAnimationFrame(() => {
        const topDialog =
          openDialogStack[
            openDialogStack.length - 1
          ];

        if (topDialog === dialog) {
          focusDialog(dialog);
        }
      });

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const topDialog =
        openDialogStack[
          openDialogStack.length - 1
        ];

      if (topDialog !== dialog) {
        return;
      }

      if (
        event.key === "Escape" &&
        closeOnEscape
      ) {
        event.preventDefault();
        event.stopPropagation();

        onCloseRef.current();

        return;
      }

      trapFocus(event, dialog);
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    return () => {
      window.cancelAnimationFrame(
        animationFrameId
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );

      const dialogIndex =
        openDialogStack.lastIndexOf(
          dialog
        );

      if (dialogIndex >= 0) {
        openDialogStack.splice(
          dialogIndex,
          1
        );
      }

      unlockBodyScroll();

      const previouslyFocusedElement =
        previouslyFocusedElementRef.current;

      if (
        previouslyFocusedElement &&
        previouslyFocusedElement.isConnected
      ) {
        previouslyFocusedElement.focus();

        return;
      }

      const remainingTopDialog =
        openDialogStack[
          openDialogStack.length - 1
        ];

      if (remainingTopDialog) {
        focusDialog(remainingTopDialog);
      }
    };
  }, [
    open,
    closeOnEscape,
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

  const resolvedAriaLabelledBy =
    ariaLabelledBy ??
    (
      ariaLabel ||
      !hasRegisteredTitle
        ? undefined
        : titleId
    );

  const resolvedAriaDescribedBy =
    ariaDescribedBy ??
    (
      hasRegisteredDescription
        ? descriptionId
        : undefined
    );

  const handleDialogKeyDown = (
    event:
      ReactKeyboardEvent<HTMLDivElement>
  ) => {
    props.onKeyDown?.(event);
  };

  return (
    <DialogContext.Provider
      value={contextValue}
    >
      <div
        className="hfos-dialog-overlay"
        aria-hidden="true"
      />

      <div
        className="hfos-dialog-viewport"
        role="presentation"
        onPointerDown={(event) => {
          if (
            closeOnBackdrop &&
            event.target ===
              event.currentTarget
          ) {
            onCloseRef.current();
          }
        }}
      >
        <div
          {...props}
          ref={dialogRef}
          role={role}
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={
            resolvedAriaLabelledBy
          }
          aria-describedby={
            resolvedAriaDescribedBy
          }
          tabIndex={tabIndex}
          className={dialogClasses}
          onKeyDown={
            handleDialogKeyDown
          }
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}
