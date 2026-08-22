import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type {
  OperationResult,
} from "../../../shared/types/index";

import type {
  HouseholdMember,
  HouseholdMemberRole,
} from "../models/HouseholdMember";

import {
  defaultHouseholdMemberForm,
  type HouseholdMemberForm as HouseholdMemberFormData,
} from "../models/HouseholdMemberForm";

interface HouseholdMemberFormProps {
  initialValues?: HouseholdMemberFormData;
  isOwner?: boolean;
  submitLabel?: string;

  onSubmit: (
    form: HouseholdMemberFormData
  ) => OperationResult<HouseholdMember>;

  onCancel?: () => void;
}

export default function HouseholdMemberForm({
  initialValues,
  isOwner = false,
  submitLabel = "Save Member",
  onSubmit,
  onCancel,
}: HouseholdMemberFormProps) {
  const [form, setForm] =
    useState<HouseholdMemberFormData>(
      initialValues ?? {
        ...defaultHouseholdMemberForm,
      }
    );

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setForm(
      initialValues ?? {
        ...defaultHouseholdMemberForm,
      }
    );

    setErrors({});
    setMessage("");
  }, [initialValues]);

  const updateField = <
    Field extends keyof HouseholdMemberFormData,
  >(
    field: Field,
    value: HouseholdMemberFormData[Field]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });

    setMessage("");
  };

  const handleRoleChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    updateField(
      "role",
      event.target.value as HouseholdMemberRole
    );
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const result = onSubmit(form);

    if (!result.success) {
      setErrors(result.errors ?? {});

      setMessage(
        result.message ??
          "Unable to save the household member."
      );

      return;
    }

    setErrors({});
    setMessage(result.message ?? "");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {message && (
        <div
          className={
            Object.keys(errors).length > 0
              ? "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          }
        >
          {message}
        </div>
      )}

      {errors.general && (
        <p className="text-sm text-destructive">
          {errors.general}
        </p>
      )}

      {errors.household && (
        <p className="text-sm text-destructive">
          {errors.household}
        </p>
      )}

      {errors.member && (
        <p className="text-sm text-destructive">
          {errors.member}
        </p>
      )}

      <div className="space-y-2">
        <label
          htmlFor="household-member-name"
          className="text-sm font-medium text-foreground"
        >
          Member Name
        </label>

        <input
          id="household-member-name"
          type="text"
          value={form.displayName}
          onChange={(event) =>
            updateField(
              "displayName",
              event.target.value
            )
          }
          placeholder="Example: Rasha"
          autoComplete="off"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />

        {errors.displayName && (
          <p className="text-sm text-destructive">
            {errors.displayName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="household-member-email"
          className="text-sm font-medium text-foreground"
        >
          Member Email
        </label>

        <input
          id="household-member-email"
          type="email"
          value={form.email ?? ""}
          onChange={(event) =>
            updateField(
              "email",
              event.target.value
            )
          }
          placeholder="member@example.com"
          autoComplete="email"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />

        <p className="text-xs text-muted-foreground">
          Used to match the signed-in Supabase account to this member.
        </p>

        {errors.email && (
          <p className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="household-member-role"
          className="text-sm font-medium text-foreground"
        >
          Household Role
        </label>

        <select
          id="household-member-role"
          value={form.role}
          onChange={handleRoleChange}
          disabled={isOwner}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isOwner && (
            <option value="owner">
              Owner
            </option>
          )}

          {!isOwner && (
            <>
              <option value="member">
                Member
              </option>

              <option value="admin">
                Admin
              </option>
            </>
          )}
        </select>

        {isOwner && (
          <p className="text-xs text-muted-foreground">
            The household owner role cannot be
            changed.
          </p>
        )}

        {errors.role && (
          <p className="text-sm text-destructive">
            {errors.role}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="household-member-color"
          className="text-sm font-medium text-foreground"
        >
          Identification Color
        </label>

        <div className="flex items-center gap-3">
          <input
            id="household-member-color"
            type="color"
            value={
              form.color || "#688F24"
            }
            onChange={(event) =>
              updateField(
                "color",
                event.target.value.toUpperCase()
              )
            }
            className="h-10 w-14 cursor-pointer rounded-md border bg-background p-1"
          />

          <input
            type="text"
            value={form.color}
            onChange={(event) =>
              updateField(
                "color",
                event.target.value
              )
            }
            placeholder="#688F24"
            maxLength={7}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Optional. This helps identify the member in
          expense and settlement views.
        </p>

        {errors.color && (
          <p className="text-sm text-destructive">
            {errors.color}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-md border p-3">
        <input
          type="checkbox"
          checked={form.isActive}
          disabled={isOwner}
          onChange={(event) =>
            updateField(
              "isActive",
              event.target.checked
            )
          }
          className="mt-0.5 h-4 w-4 rounded border"
        />

        <span>
          <span className="block text-sm font-medium text-foreground">
            Include in expense sharing
          </span>

          <span className="block text-xs text-muted-foreground">
            Turn this off to keep the member in
            the household but opt them out of new
            expense splits and settlements.
          </span>
        </span>
      </label>

      {errors.isActive && (
        <p className="text-sm text-destructive">
          {errors.isActive}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t pt-5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
