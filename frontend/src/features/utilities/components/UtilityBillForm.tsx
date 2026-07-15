import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  UtilityApplianceUsageForm,
  UtilityBillForm as UtilityBillFormData,
  UtilityMemberShareForm,
} from "../models/UtilityBillForm";

import {
  defaultUtilityBillForm,
} from "../models/UtilityBillForm";

import type {
  UtilityBillShareResult,
} from "../models/UtilityBillShareResult";

import UtilityBillShareCalculator from "../services/UtilityBillShareCalculator";

import UtilityBillSharePreview from "./UtilityBillSharePreview";

export interface UtilityMemberOption {
  id: string;
  name: string;
}

export interface UtilityAccountOption {
  id: string;
  name: string;
}

interface UtilityBillFormProps {
  members: UtilityMemberOption[];

  accounts?: UtilityAccountOption[];

  initialValue?: UtilityBillFormData;

  submitLabel?: string;

  onSubmit?: (
    form: UtilityBillFormData,
    result: UtilityBillShareResult
  ) => void;

  onCancel?: () => void;
}

export default function UtilityBillForm({
  members,
  accounts = [],
  initialValue,
  submitLabel = "Save Utility Bill",
  onSubmit,
  onCancel,
}: UtilityBillFormProps) {
  const [form, setForm] =
    useState<UtilityBillFormData>(
      () =>
        createInitialForm(
          members,
          initialValue
        )
    );

  const [
    previewResult,
    setPreviewResult,
  ] = useState<
    UtilityBillShareResult | undefined
  >();

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [message, setMessage] =
    useState("");

  const memberNames =
    useMemo(
      () =>
        Object.fromEntries(
          members.map(
            (member) => [
              member.id,
              member.name,
            ]
          )
        ),
      [members]
    );

  const updateField = <
    Key extends keyof UtilityBillFormData,
  >(
    key: Key,
    value: UtilityBillFormData[Key]
  ): void => {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    clearPreview();
  };

  const updateMemberShare = (
    memberIndex: number,
    updates:
      Partial<UtilityMemberShareForm>
  ): void => {
    setForm(
      (current) => ({
        ...current,

        memberShares:
          current.memberShares.map(
            (memberShare, index) =>
              index === memberIndex
                ? {
                    ...memberShare,
                    ...updates,
                  }
                : memberShare
          ),
      })
    );

    clearPreview();
  };

  const addApplianceUsage = (): void => {
    const applianceUsage:
      UtilityApplianceUsageForm = {
      memberId:
        form.memberShares[0]
          ?.memberId ?? "",

      applianceName: "",
      powerKilowatts: 0,
      usageHours: 0,
      notes: "",
    };

    updateField(
      "applianceUsages",
      [
        ...form.applianceUsages,
        applianceUsage,
      ]
    );
  };

  const updateApplianceUsage = (
    applianceIndex: number,
    updates:
      Partial<UtilityApplianceUsageForm>
  ): void => {
    updateField(
      "applianceUsages",
      form.applianceUsages.map(
        (usage, index) =>
          index === applianceIndex
            ? {
                ...usage,
                ...updates,
              }
            : usage
      )
    );
  };

  const removeApplianceUsage = (
    applianceIndex: number
  ): void => {
    updateField(
      "applianceUsages",
      form.applianceUsages.filter(
        (_, index) =>
          index !== applianceIndex
      )
    );
  };

  const calculatePreview =
    (): UtilityBillShareResult | undefined => {
      const result =
        UtilityBillShareCalculator.calculate(
          form
        );

      if (!result.success) {
        setErrors(
          result.errors ?? {}
        );

        setMessage(
          result.message ??
            "Unable to calculate the utility bill."
        );

        setPreviewResult(
          undefined
        );

        return undefined;
      }

      const calculation =
        result.data;

      if (!calculation) {
        setErrors({
          calculation:
            "The utility calculation returned no result.",
        });

        setMessage(
          "Unable to calculate the utility bill."
        );

        setPreviewResult(
          undefined
        );

        return undefined;
      }

      setErrors({});

      setMessage(
        result.message ??
          "Utility bill shares calculated successfully."
      );

      setPreviewResult(
        calculation
      );

      return calculation;
    };

  const handleSubmit = (): void => {
    const calculation =
      calculatePreview();

    if (
      calculation &&
      onSubmit
    ) {
      onSubmit(
        form,
        calculation
      );
    }
  };

  function clearPreview(): void {
    setPreviewResult(
      undefined
    );

    setErrors({});
    setMessage("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Utility Bill Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the total amount payable and the
            provider rate used to calculate direct member
            usage.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Utility Type">
            <select
              className={inputClassName}
              value={form.utilityType}
              onChange={(event) => {
                const utilityType =
                  event.target.value as
                    UtilityBillFormData["utilityType"];

                updateField(
                  "utilityType",
                  utilityType
                );

                updateField(
                  "unit",
                  utilityType ===
                    "electricity"
                    ? "kWh"
                    : "m3"
                );
              }}
            >
              <option value="electricity">
                Electricity
              </option>

              <option value="water">
                Water
              </option>
            </select>
          </Field>

          <Field label="Billing Date">
            <input
              className={inputClassName}
              type="date"
              value={form.billingDate}
              onChange={(event) =>
                updateField(
                  "billingDate",
                  event.target.value
                )
              }
            />
          </Field>

          <Field
            label="Total Bill Amount"
            helper="The complete amount payable to the utility provider."
          >
            <input
              className={inputClassName}
              type="number"
              min="0"
              step="0.01"
              value={
                form.totalBillAmount ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "totalBillAmount",
                  parseNumber(
                    event.target.value
                  )
                )
              }
              placeholder="0.00"
            />
          </Field>

          <Field
            label={`Rate per ${form.unit}`}
            helper="The rate used to calculate each member's direct usage."
          >
            <input
              className={inputClassName}
              type="number"
              min="0"
              step="0.0001"
              value={
                form.ratePerUnit ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "ratePerUnit",
                  parseNumber(
                    event.target.value
                  )
                )
              }
              placeholder="0.00"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Member Usage and Sharing
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter each member&apos;s direct usage and
            select who participates in dividing the
            remaining bill.
          </p>
        </header>

        <div className="space-y-5">
          {form.memberShares.map(
            (
              memberShare,
              memberIndex
            ) => (
              <article
                key={memberShare.memberId}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {memberNames[
                        memberShare.memberId
                      ] ??
                        memberShare.memberId}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Leave meter readings at zero when
                      this member has no submeter.
                    </p>
                  </div>

                  <ParticipationBadge
                    sharesRemainder={
                      memberShare.sharesRemainder
                    }
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <Field label="Saved Submeter">
                    <input
                      className={inputClassName}
                      type="text"
                      value={
                        memberShare.utilityMeterId
                      }
                      onChange={(event) =>
                        updateMemberShare(
                          memberIndex,
                          {
                            utilityMeterId:
                              event.target.value,
                          }
                        )
                      }
                      placeholder="Optional meter ID"
                    />
                  </Field>

                  <Field label="Previous Reading">
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      step="0.001"
                      value={
                        memberShare.previousReading ||
                        ""
                      }
                      onChange={(event) =>
                        updateMemberShare(
                          memberIndex,
                          {
                            previousReading:
                              parseNumber(
                                event.target.value
                              ),
                          }
                        )
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Current Reading">
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      step="0.001"
                      value={
                        memberShare.currentReading ||
                        ""
                      }
                      onChange={(event) =>
                        updateMemberShare(
                          memberIndex,
                          {
                            currentReading:
                              parseNumber(
                                event.target.value
                              ),
                          }
                        )
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field
                    label="Fixed Compensation"
                    helper="Additional direct amount for usage not covered by the submeter."
                  >
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        memberShare.fixedCompensationAmount ||
                        ""
                      }
                      onChange={(event) =>
                        updateMemberShare(
                          memberIndex,
                          {
                            fixedCompensationAmount:
                              parseNumber(
                                event.target.value
                              ),
                          }
                        )
                      }
                      placeholder="0.00"
                    />
                  </Field>

                  <div className="flex items-end">
                    <label className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={
                          memberShare.sharesRemainder
                        }
                        onChange={(event) =>
                          updateMemberShare(
                            memberIndex,
                            {
                              sharesRemainder:
                                event.target
                                  .checked,
                            }
                          )
                        }
                      />

                      Share remaining bill equally
                    </label>
                  </div>

                  <div className="flex items-end">
                    <label className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={
                          memberShare.isMeterReset
                        }
                        onChange={(event) =>
                          updateMemberShare(
                            memberIndex,
                            {
                              isMeterReset:
                                event.target
                                  .checked,

                              meterResetReason:
                                event.target
                                  .checked
                                  ? memberShare.meterResetReason
                                  : "",

                              resetUsageQuantity:
                                event.target
                                  .checked
                                  ? memberShare.resetUsageQuantity
                                  : 0,
                            }
                          )
                        }
                      />

                      Meter reset or replaced
                    </label>
                  </div>

                  {memberShare.isMeterReset && (
                    <>
                      <Field label="Reset Reason">
                        <input
                          className={inputClassName}
                          type="text"
                          value={
                            memberShare.meterResetReason
                          }
                          onChange={(event) =>
                            updateMemberShare(
                              memberIndex,
                              {
                                meterResetReason:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Explain the reset"
                        />
                      </Field>

                      <Field
                        label={`Actual Usage (${form.unit})`}
                        helper="Used instead of subtracting meter readings."
                      >
                        <input
                          className={inputClassName}
                          type="number"
                          min="0"
                          step="0.001"
                          value={
                            memberShare.resetUsageQuantity ||
                            ""
                          }
                          onChange={(event) =>
                            updateMemberShare(
                              memberIndex,
                              {
                                resetUsageQuantity:
                                  parseNumber(
                                    event.target
                                      .value
                                  ),
                              }
                            )
                          }
                          placeholder="0"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </article>
            )
          )}
        </div>
      </section>

      {form.utilityType ===
        "electricity" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Personal Appliance Usage"
            description="Assign appliance usage directly to a member using the appliance power rating and total usage hours."
            actionLabel="Add Appliance"
            onAction={
              addApplianceUsage
            }
          />

          {form.applianceUsages.length ===
          0 ? (
            <EmptyState message="No personal appliance usage added." />
          ) : (
            <div className="space-y-4">
              {form.applianceUsages.map(
                (
                  usage,
                  applianceIndex
                ) => (
                  <article
                    key={`appliance-${applianceIndex}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                      <Field label="Member">
                        <select
                          className={inputClassName}
                          value={
                            usage.memberId
                          }
                          onChange={(event) =>
                            updateApplianceUsage(
                              applianceIndex,
                              {
                                memberId:
                                  event.target
                                    .value,
                              }
                            )
                          }
                        >
                          {members.map(
                            (member) => (
                              <option
                                key={member.id}
                                value={member.id}
                              >
                                {member.name}
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field label="Appliance">
                        <input
                          className={inputClassName}
                          type="text"
                          value={
                            usage.applianceName
                          }
                          onChange={(event) =>
                            updateApplianceUsage(
                              applianceIndex,
                              {
                                applianceName:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Air conditioner"
                        />
                      </Field>

                      <Field label="Power Rating (kW)">
                        <input
                          className={inputClassName}
                          type="number"
                          min="0"
                          step="0.001"
                          value={
                            usage.powerKilowatts ||
                            ""
                          }
                          onChange={(event) =>
                            updateApplianceUsage(
                              applianceIndex,
                              {
                                powerKilowatts:
                                  parseNumber(
                                    event.target
                                      .value
                                  ),
                              }
                            )
                          }
                          placeholder="1.2"
                        />
                      </Field>

                      <Field label="Usage Hours">
                        <input
                          className={inputClassName}
                          type="number"
                          min="0"
                          step="0.25"
                          value={
                            usage.usageHours ||
                            ""
                          }
                          onChange={(event) =>
                            updateApplianceUsage(
                              applianceIndex,
                              {
                                usageHours:
                                  parseNumber(
                                    event.target
                                      .value
                                  ),
                              }
                            )
                          }
                          placeholder="120"
                        />
                      </Field>

                      <Field label="Calculated Usage">
                        <div className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                          {formatQuantity(
                            usage.powerKilowatts *
                              usage.usageHours
                          )}{" "}
                          kWh
                        </div>
                      </Field>

                      <Field label="Calculated Amount">
                        <div className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                          {formatCurrency(
                            usage.powerKilowatts *
                              usage.usageHours *
                              form.ratePerUnit
                          )}
                        </div>
                      </Field>

                      <Field label="Notes">
                        <input
                          className={inputClassName}
                          type="text"
                          value={
                            usage.notes
                          }
                          onChange={(event) =>
                            updateApplianceUsage(
                              applianceIndex,
                              {
                                notes:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Optional"
                        />
                      </Field>

                      <div className="flex items-end">
                        <button
                          className={dangerButtonClassName}
                          type="button"
                          onClick={() =>
                            removeApplianceUsage(
                              applianceIndex
                            )
                          }
                        >
                          Remove Appliance
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Payment and Transaction Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select who paid the provider and optionally
            link the payment account.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Paid By">
            <select
              className={inputClassName}
              value={
                form.paidByMemberId
              }
              onChange={(event) =>
                updateField(
                  "paidByMemberId",
                  event.target.value
                )
              }
            >
              <option value="">
                Select payer
              </option>

              {members.map(
                (member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field
            label="Payment Account"
            helper="Optional."
          >
            <select
              className={inputClassName}
              value={
                form.sourceAccountId
              }
              onChange={(event) =>
                updateField(
                  "sourceAccountId",
                  event.target.value
                )
              }
            >
              <option value="">
                No account
              </option>

              {accounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.name}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Transaction Date">
            <input
              className={inputClassName}
              type="date"
              value={
                form.transactionDate
              }
              onChange={(event) =>
                updateField(
                  "transactionDate",
                  event.target.value
                )
              }
            />
          </Field>

          <Field label="Visibility">
            <select
              className={inputClassName}
              value={form.visibility}
              onChange={(event) =>
                updateField(
                  "visibility",
                  event.target
                    .value as UtilityBillFormData["visibility"]
                )
              }
            >
              <option value="household">
                Household
              </option>

              <option value="participants">
                Participants
              </option>

              <option value="private">
                Private
              </option>
            </select>
          </Field>

          <Field label="Description">
            <input
              className={inputClassName}
              type="text"
              value={
                form.description
              }
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Electricity utility bill"
            />
          </Field>

          <div className="flex items-end">
            <label className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateField(
                    "isActive",
                    event.target.checked
                  )
                }
              />

              Active transaction
            </label>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Field label="Notes">
              <textarea
                className={`${inputClassName} min-h-24`}
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
                placeholder="Optional bill or payment notes"
              />
            </Field>
          </div>
        </div>
      </section>

      {(message ||
        Object.keys(errors).length >
          0) && (
        <section
          className={`rounded-xl border p-5 ${
            Object.keys(errors).length >
            0
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          {message && (
            <p
              className={`font-semibold ${
                Object.keys(errors)
                  .length > 0
                  ? "text-red-800"
                  : "text-emerald-800"
              }`}
            >
              {message}
            </p>
          )}

          {Object.keys(errors).length >
            0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-700">
              {Object.entries(
                errors
              ).map(
                ([key, error]) => (
                  <li key={key}>
                    {error}
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button
            className={secondaryButtonClassName}
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        <button
          className={secondaryButtonClassName}
          type="button"
          onClick={
            calculatePreview
          }
        >
          Calculate Shares
        </button>

        {onSubmit && (
          <button
            className={primaryButtonClassName}
            type="button"
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>
        )}
      </div>

      {previewResult && (
        <UtilityBillSharePreview
          result={previewResult}
          memberNames={memberNames}
        />
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  helper?: string;
  children: ReactNode;
}

function Field({
  label,
  helper,
  children,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="mt-2">
        {children}
      </div>

      {helper && (
        <span className="mt-1 block text-xs text-slate-500">
          {helper}
        </span>
      )}
    </label>
  );
}

interface SectionHeaderProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <button
        className={secondaryButtonClassName}
        type="button"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </header>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({
  message,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

interface ParticipationBadgeProps {
  sharesRemainder: boolean;
}

function ParticipationBadge({
  sharesRemainder,
}: ParticipationBadgeProps) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      {sharesRemainder
        ? "Shares Remaining Bill"
        : "Direct Usage Only"}
    </span>
  );
}

function createInitialForm(
  members: UtilityMemberOption[],
  initialValue:
    | UtilityBillFormData
    | undefined
): UtilityBillFormData {
  if (initialValue) {
    return cloneForm(
      initialValue
    );
  }

  const today =
    formatDateInput(
      new Date()
    );

  return {
    ...defaultUtilityBillForm,

    billingDate: today,
    transactionDate: today,

    memberShares:
      members.map(
        (member) => ({
          memberId: member.id,

          utilityMeterId: "",

          previousReading: 0,
          currentReading: 0,

          isMeterReset: false,
          meterResetReason: "",
          resetUsageQuantity: 0,

          fixedCompensationAmount: 0,
          sharesRemainder: true,
        })
      ),
  };
}

function cloneForm(
  form: UtilityBillFormData
): UtilityBillFormData {
  return {
    ...form,

    memberShares:
      form.memberShares.map(
        (memberShare) => ({
          ...memberShare,
        })
      ),

    applianceUsages:
      form.applianceUsages.map(
        (usage) => ({
          ...usage,
        })
      ),
  };
}

function parseNumber(
  value: string
): number {
  if (!value.trim()) {
    return 0;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatQuantity(
  quantity: number
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }
  ).format(quantity);
}

function formatCurrency(
  amount: number
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

function formatDateInput(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const inputClassName =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const primaryButtonClassName =
  "min-h-11 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700";

const secondaryButtonClassName =
  "min-h-11 rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

const dangerButtonClassName =
  "min-h-11 w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50";