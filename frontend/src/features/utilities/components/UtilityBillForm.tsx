import {
  useMemo,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ReactNode,
} from "react";

import type {
  StoredAttachment,
  StoredAttachmentCategory,
} from "../../../shared/models/StoredAttachment";

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
  ownerMemberId: string;
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

const acceptedAttachmentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const maximumAttachmentCount = 3;

const maximumAttachmentSizeBytes =
  750 * 1024;

function isAcceptedAttachmentMimeType(
  mimeType: string
): boolean {
  return acceptedAttachmentMimeTypes.includes(
    mimeType as
      typeof acceptedAttachmentMimeTypes[number]
  );
}

function getDefaultAttachmentCategory(
  fileName: string
): StoredAttachmentCategory {
  const normalizedName =
    fileName.toLowerCase();

  if (
    normalizedName.includes(
      "receipt"
    )
  ) {
    return "receipt";
  }

  return "bill";
}

function formatFileSize(
  sizeBytes: number
): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  return `${(
    sizeBytes /
    1024
  ).toFixed(1)} KB`;
}

function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          resolve(
            reader.result
          );

          return;
        }

        reject(
          new Error(
            "The selected attachment could not be read."
          )
        );
      };

      reader.onerror = () => {
        reject(
          reader.error ??
            new Error(
              "The selected attachment could not be read."
            )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
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

  const availableAccounts =
    useMemo(() => {
      if (!form.paidByMemberId) {
        return [];
      }

      return accounts.filter(
        (account) =>
          account.ownerMemberId ===
          form.paidByMemberId
      );
    }, [
      accounts,
      form.paidByMemberId,
    ]);

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

  const setAttachmentError = (
    attachmentError: string
  ): void => {
    setErrors((current) => ({
      ...current,

      attachments:
        attachmentError,
    }));

    setMessage(
      "Unable to add attachment."
    );

    setPreviewResult(
      undefined
    );
  };

  const clearAttachmentError =
    (): void => {
      setErrors((current) => {
        if (!current.attachments) {
          return current;
        }

        const nextErrors = {
          ...current,
        };

        delete nextErrors.attachments;

        return nextErrors;
      });

      setMessage("");
  };

  const addAttachmentFiles =
    async (
      files: File[]
    ): Promise<void> => {
      if (files.length === 0) {
        return;
      }

      if (
        form.attachments.length +
          files.length >
        maximumAttachmentCount
      ) {
        setAttachmentError(
          `Add no more than ${maximumAttachmentCount} attachments.`
        );

        return;
      }

      for (
        const file of files
      ) {
        if (
          !isAcceptedAttachmentMimeType(
            file.type
          )
        ) {
          setAttachmentError(
            "Attachments must be JPEG, PNG, WebP, or PDF files."
          );

          return;
        }

        if (
          file.size >
          maximumAttachmentSizeBytes
        ) {
          setAttachmentError(
            `${file.name} exceeds the 750 KB attachment limit.`
          );

          return;
        }
      }

      try {
        const attachments:
          StoredAttachment[] =
          [];

        for (
          const file of files
        ) {
          const dataUrl =
            await readFileAsDataUrl(
              file
            );

          attachments.push({
            id:
              crypto.randomUUID(),

            category:
              getDefaultAttachmentCategory(
                file.name
              ),

            fileName:
              file.name,

            mimeType:
              file.type,

            sizeBytes:
              file.size,

            dataUrl,

            createdAt:
              new Date(),
          });
        }

        setForm((current) => ({
          ...current,

          attachments: [
            ...current.attachments,
            ...attachments,
          ],
        }));

        clearAttachmentError();
        setPreviewResult(
          undefined
        );
      } catch (
        error
      ) {
        setAttachmentError(
          error instanceof Error
            ? error.message
            : "The selected attachment could not be read."
        );
      }
    };

  const handleAttachmentInputChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
      const files =
        Array.from(
          event.target.files ??
            []
        );

      await addAttachmentFiles(
        files
      );

      event.target.value =
        "";
    };

  const handleAttachmentPaste =
    async (
      event:
        ClipboardEvent<HTMLDivElement>
    ): Promise<void> => {
      const imageFiles =
        Array.from(
          event.clipboardData.items
        )
          .filter(
            (item) =>
              item.kind ===
                "file" &&
              item.type.startsWith(
                "image/"
              )
          )
          .map(
            (item) =>
              item.getAsFile()
          )
          .filter(
            (
              file
            ): file is File =>
              Boolean(file)
          );

      if (
        imageFiles.length === 0
      ) {
        setAttachmentError(
          "Clipboard does not contain a supported image."
        );

        return;
      }

      event.preventDefault();

      await addAttachmentFiles(
        imageFiles
      );
    };

  const updateAttachmentCategory = (
    attachmentId: string,
    category:
      StoredAttachmentCategory
  ): void => {
    setForm((current) => ({
      ...current,

      attachments:
        current.attachments.map(
          (attachment) =>
            attachment.id ===
            attachmentId
              ? {
                  ...attachment,
                  category,
                }
              : attachment
        ),
    }));

    clearAttachmentError();
  };

  const removeAttachment = (
    attachmentId: string
  ): void => {
    setForm((current) => ({
      ...current,

      attachments:
        current.attachments.filter(
          (attachment) =>
            attachment.id !==
            attachmentId
        ),
    }));

    clearAttachmentError();
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
                    hasFixedCompensation={
                      memberShare.fixedCompensationAmount >
                      0
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
                    helper="A member with fixed compensation is excluded from the equal share of the remaining bill."
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
                      onChange={(event) => {
                        const fixedCompensationAmount =
                          parseNumber(
                            event.target.value
                          );

                        updateMemberShare(
                          memberIndex,
                          {
                            fixedCompensationAmount,

                            sharesRemainder:
                              fixedCompensationAmount > 0
                                ? false
                                : memberShare.sharesRemainder,
                          }
                        );
                      }}
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
                        onChange={(event) => {
                          const sharesRemainder =
                            event.target.checked;

                          updateMemberShare(
                            memberIndex,
                            {
                              sharesRemainder,

                              fixedCompensationAmount:
                                sharesRemainder
                                  ? 0
                                  : memberShare.fixedCompensationAmount,
                            }
                          );
                        }}
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
            Provider Bill or Receipt
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Upload the provider bill, payment receipt, or
            paste a receipt image from the clipboard.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:bg-slate-100">
            <span className="text-sm font-semibold text-slate-800">
              Upload bill or receipt
            </span>

            <span className="mt-1 text-xs text-slate-500">
              JPEG, PNG, WebP, or PDF — up to 750 KB
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="sr-only"
              onChange={
                handleAttachmentInputChange
              }
            />
          </label>

          <div
            tabIndex={0}
            role="button"
            onPaste={
              handleAttachmentPaste
            }
            className="flex min-h-28 cursor-text flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center outline-none transition hover:bg-slate-100 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <span className="text-sm font-semibold text-slate-800">
              Paste receipt image
            </span>

            <span className="mt-1 text-xs text-slate-500">
              Click here, then press Ctrl + V
            </span>
          </div>
        </div>

        {form.attachments.length ===
        0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
            No provider bill or receipt attached.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {form.attachments.map(
              (attachment) => (
                <article
                  key={
                    attachment.id
                  }
                  className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[6rem_minmax(0,1fr)_auto]"
                >
                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-white">
                    {attachment.mimeType.startsWith(
                      "image/"
                    ) ? (
                      <img
                        src={
                          attachment.dataUrl
                        }
                        alt={
                          attachment.fileName
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">
                        PDF
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {
                          attachment.fileName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(
                          attachment.sizeBytes
                        )}
                      </p>
                    </div>

                    <Field label="Document Type">
                      <select
                        className={inputClassName}
                        value={
                          attachment.category
                        }
                        onChange={(event) =>
                          updateAttachmentCategory(
                            attachment.id,
                            event.target
                              .value as StoredAttachmentCategory
                          )
                        }
                      >
                        <option value="bill">
                          Bill
                        </option>

                        <option value="receipt">
                          Receipt
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>
                    </Field>
                  </div>

                  <div className="flex gap-2 md:flex-col">
                    <a
                      href={
                        attachment.dataUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButtonClassName}
                    >
                      Open
                    </a>

                    <button
                      className={dangerButtonClassName}
                      type="button"
                      onClick={() =>
                        removeAttachment(
                          attachment.id
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}

        {errors.attachments && (
          <p className="mt-3 text-sm text-red-700">
            {errors.attachments}
          </p>
        )}
      </section>

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
              onChange={(event) => {
                const paidByMemberId =
                  event.target.value;

                setForm(
                  (current) => ({
                    ...current,

                    paidByMemberId,
                    sourceAccountId: "",
                  })
                );

                clearPreview();
              }}
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
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              value={
                form.sourceAccountId
              }
              disabled={
                !form.paidByMemberId
              }
              onChange={(event) =>
                updateField(
                  "sourceAccountId",
                  event.target.value
                )
              }
            >
              <option value="">
                {form.paidByMemberId
                  ? "No account"
                  : "Select payer first"}
              </option>

              {availableAccounts.map(
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
  hasFixedCompensation: boolean;
}

function ParticipationBadge({
  sharesRemainder,
  hasFixedCompensation,
}: ParticipationBadgeProps) {
  let label =
    "Direct Usage Only";

  if (hasFixedCompensation) {
    label =
      "Fixed Compensation";
  } else if (sharesRemainder) {
    label =
      "Shares Remaining Bill";
  }

  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      {label}
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

    attachments:
      form.attachments?.map(
        (attachment) => ({
          ...attachment,

          createdAt:
            new Date(
              attachment.createdAt
            ),
        })
      ) ?? [],
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