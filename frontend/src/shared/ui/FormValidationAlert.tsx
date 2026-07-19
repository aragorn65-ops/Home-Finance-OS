interface FormValidationAlertProps {
  open: boolean;
  title?: string;
  errors: Record<string, string>;
  fieldLabels?: Record<string, string>;
  onClose: () => void;
}

export default function FormValidationAlert({
  open,
  title = "Please fix these entries",
  errors,
  fieldLabels = {},
  onClose,
}: FormValidationAlertProps) {
  if (!open) {
    return null;
  }

  const errorEntries =
    Object.entries(errors).filter(
      ([, message]) =>
        message.trim().length > 0
    );

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/20 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="form-validation-alert-title"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 text-black shadow-xl">
        <h2
          id="form-validation-alert-title"
          className="text-base font-semibold text-black"
        >
          {title}
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          Save was not completed because the form has invalid or missing entries.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-black">
          {errorEntries.map(
            ([field, message]) => (
              <li key={field}>
                <span className="font-semibold">
                  {fieldLabels[field] ??
                    field}
                  :
                </span>{" "}
                {message}
              </li>
            )
          )}
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
