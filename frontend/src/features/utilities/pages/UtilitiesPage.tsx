import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import FormValidationAlert from "../../../shared/ui/FormValidationAlert";
import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import {
  formatDateInput,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import AccountService from "../../accounts/services/AccountService";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import UtilityBillForm from "../components/UtilityBillForm";

import type {
  UtilityBillForm as UtilityBillFormData,
} from "../models/UtilityBillForm";

import type {
  UtilityBillShareResult,
} from "../models/UtilityBillShareResult";

import UtilityProviderBillService from "../services/UtilityProviderBillService";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";

interface ProviderPaymentForm {
  paidByMemberId: string;
  sourceAccountId: string;
  paidAt: string;
  referenceNumber: string;
  paymentAttachments: StoredAttachment[];
}

export default function UtilitiesPage() {
  const {
    selectedMonthValue,
  } = useReportingMonth();

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    saveError,
    setSaveError,
  ] = useState("");

  const [
    validationAlertErrors,
    setValidationAlertErrors,
  ] = useState<Record<string, string>>(
    {}
  );

  const [
    isValidationAlertOpen,
    setIsValidationAlertOpen,
  ] = useState(false);

  /**
   * Changing this key recreates the utility form after
   * a successful save.
   */
  const [
    formKey,
    setFormKey,
  ] = useState(0);

  const [
    providerBills,
    setProviderBills,
  ] = useState<UtilityProviderBill[]>(
    () =>
      UtilityProviderBillService.getActiveProviderBills()
  );

  const [
    paidProviderBills,
    setPaidProviderBills,
  ] = useState<UtilityProviderBill[]>(
    () =>
      UtilityProviderBillService.getPaidProviderBills()
  );

  const [
    providerPaymentForms,
    setProviderPaymentForms,
  ] = useState<
    Record<string, ProviderPaymentForm>
  >({});

  const [
    markingPaidProviderBillId,
    setMarkingPaidProviderBillId,
  ] = useState("");

  const notificationRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const activeMembers =
    HouseholdMemberService.getActiveMembers();

  const activeAccounts =
    AccountService.getActiveAccounts();

  const memberOptions =
    activeMembers.map(
      (member) => ({
        id: member.id,
        name: member.displayName,
      })
    );

  const memberNames =
    Object.fromEntries(
      memberOptions.map(
        (member) => [
          member.id,
          member.name,
        ]
      )
    );

  const accountOptions =
    activeAccounts.map(
      (account) => ({
        id: account.id,

        name:
          account.institution
            ? `${account.name} — ${account.institution}`
            : account.name,

        ownerMemberId:
          account.ownerMemberId,
      })
    );

  const showNotification = (): void => {
    window.requestAnimationFrame(
      () => {
        notificationRef.current
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }
    );
  };

  const getProviderPaymentForm = (
    providerBillId: string
  ): ProviderPaymentForm =>
    providerPaymentForms[
      providerBillId
    ] ?? {
      paidByMemberId: "",
      sourceAccountId: "",
      paidAt:
        formatDateInput(new Date()),
      referenceNumber: "",
      paymentAttachments: [],
    };

  const updateProviderPaymentForm = (
    providerBillId: string,
    updates:
      Partial<ProviderPaymentForm>
  ): void => {
    setProviderPaymentForms(
      (current) => ({
        ...current,

        [providerBillId]: {
          ...(
            current[providerBillId] ??
            getProviderPaymentForm(
              providerBillId
            )
          ),
          ...updates,
        },
      })
    );
  };

  const handleMarkProviderBillPaid = async (
    providerBillId: string
  ): Promise<void> => {
    if (markingPaidProviderBillId) {
      return;
    }

    setSaveMessage("");
    setSaveError("");
    setMarkingPaidProviderBillId(
      providerBillId
    );

    const result =
      await UtilityProviderBillService.markPaid(
        providerBillId,
        getProviderPaymentForm(
          providerBillId
        )
      );

    if (!result.success) {
      const errors =
        result.errors ?? {};

      const firstError =
        Object.values(errors)[0];

      setSaveError(
        firstError ??
          result.message ??
          "Unable to mark the provider bill paid."
      );

      setValidationAlertErrors(
        Object.keys(errors).length > 0
          ? errors
          : {
              general:
                result.message ??
                "Unable to mark the provider bill paid.",
            }
      );

      setIsValidationAlertOpen(true);
      showNotification();
      setMarkingPaidProviderBillId("");

      return;
    }

    setSaveMessage(
      result.message ??
        "Provider bill marked paid."
    );
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setProviderBills(
      UtilityProviderBillService.getActiveProviderBills()
    );
    setPaidProviderBills(
      UtilityProviderBillService.getPaidProviderBills()
    );
    setProviderPaymentForms(
      (current) => {
        const next = {
          ...current,
        };

        delete next[providerBillId];

        return next;
      }
    );

    showNotification();
    setMarkingPaidProviderBillId("");
  };

  const handlePaymentReceiptChange = (
    providerBillId: string,
    event:
      ChangeEvent<HTMLInputElement>
  ): void => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        const currentForm =
          getProviderPaymentForm(
            providerBillId
          );

        updateProviderPaymentForm(
          providerBillId,
          {
            paymentAttachments: [
              ...currentForm
                .paymentAttachments,
              {
                id:
                  createAttachmentId(),
                category: "receipt",
                fileName:
                  file.name,
                mimeType:
                  file.type ||
                  "application/octet-stream",
                sizeBytes:
                  file.size,
                dataUrl,
                createdAt:
                  new Date(),
              },
            ],
          }
        );
      })
      .catch(() => {
        setSaveError(
          "Payment receipt could not be attached."
        );
      });
  };

  const handleRemovePaymentReceipt = (
    providerBillId: string,
    attachmentId: string
  ): void => {
    const currentForm =
      getProviderPaymentForm(
        providerBillId
      );

    updateProviderPaymentForm(
      providerBillId,
      {
        paymentAttachments:
          currentForm.paymentAttachments.filter(
            (attachment) =>
              attachment.id !==
              attachmentId
          ),
      }
    );
  };

  const handleBillAttachmentChange = (
    providerBill: UtilityProviderBill,
    event:
      ChangeEvent<HTMLInputElement>
  ): void => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        const nextAttachments = [
          ...providerBill.billAttachments,
          {
            id:
              createAttachmentId(),
            category: "bill" as const,
            fileName:
              file.name,
            mimeType:
              file.type ||
              "application/octet-stream",
            sizeBytes:
              file.size,
            dataUrl,
            createdAt:
              new Date(),
          },
        ];

        updateBillAttachments(
          providerBill.id,
          nextAttachments
        );
      })
      .catch(() => {
        setSaveError(
          "Provider bill file could not be attached."
        );
      });
  };

  const handleRemoveBillAttachment = (
    providerBill:
      UtilityProviderBill,
    attachmentId: string
  ): void => {
    updateBillAttachments(
      providerBill.id,
      providerBill.billAttachments.filter(
        (attachment) =>
          attachment.id !==
          attachmentId
      )
    );
  };

  const updateBillAttachments = (
    providerBillId: string,
    billAttachments:
      StoredAttachment[]
  ): void => {
    const result =
      UtilityProviderBillService.replaceBillAttachments(
        providerBillId,
        billAttachments
      );

    if (!result.success) {
      setSaveError(
        result.message ??
          "Provider bill attachment was not updated."
      );

      return;
    }

    setProviderBills(
      UtilityProviderBillService.getActiveProviderBills()
    );
    setPaidProviderBills(
      UtilityProviderBillService.getPaidProviderBills()
    );
    setSaveError("");
    setSaveMessage(
      result.message ??
        "Provider bill attachment updated."
    );
  };

  const handleDeleteProviderBill = (
    providerBill: UtilityProviderBill
  ): void => {
    const confirmed =
      window.confirm(
        `Delete unpaid provider bill "${providerBill.providerName || getProviderFallbackLabel(providerBill)}"? This does not affect transactions or settlements because the bill is not paid yet.`
      );

    if (!confirmed) {
      return;
    }

    const result =
      UtilityProviderBillService.deleteUnpaid(
        providerBill.id
      );

    if (!result.success) {
      setSaveError(
        result.message ??
          "Provider bill was not deleted."
      );

      return;
    }

    setProviderBills(
      UtilityProviderBillService.getActiveProviderBills()
    );
    setSaveError("");
    setSaveMessage(
      result.message ??
        "Unpaid provider bill deleted."
    );
  };

  const handleSave = (
    form: UtilityBillFormData,
    calculation: UtilityBillShareResult
  ): void => {
    setSaveMessage("");
    setSaveError("");

    const result =
      UtilityProviderBillService.createUnpaid(
        form,
        calculation
      );

    if (!result.success) {
      const errors =
        result.errors ?? {};

      const firstError =
        Object.values(errors)[0];

      setSaveError(
        firstError ??
          result.message ??
          "Unable to save the utility bill."
      );

      setValidationAlertErrors(
        Object.keys(errors).length > 0
          ? errors
          : {
              general:
                result.message ??
        "Unable to save the utility bill.",
            }
      );

      setIsValidationAlertOpen(true);

      showNotification();

      return;
    }

    setSaveMessage(
      result.message ??
        "Provider bill saved successfully."
    );
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setProviderBills(
      UtilityProviderBillService.getActiveProviderBills()
    );

    /**
     * Clear the completed form only after persistence
     * succeeds.
     */
    setFormKey(
      (current) =>
        current + 1
    );

    showNotification();
  };

  return (
    <>
      <PageHeader
        title="Utilities"
        subtitle="Calculate and save provider bill shares before payment."
      />

      <FormValidationAlert
        open={isValidationAlertOpen}
        errors={validationAlertErrors}
        fieldLabels={{
          general: "General",
          transaction:
            "Generated Transaction",
          allocations: "Allocations",
          attachments: "Attachments",
          sourceAccountId:
            "Payment Account",
        }}
        onClose={() =>
          setIsValidationAlertOpen(false)
        }
      />

      <div className="space-y-6">
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            Provider Bill Share Calculator
          </h2>

          <p className="mt-1 text-sm text-blue-800">
            Enter the total provider bill, usage basis,
            direct member usage, fixed compensation,
            and due date. Saving the bill records the
            shares first; payment can happen later.
          </p>
        </section>

        <div
          ref={notificationRef}
          aria-live="polite"
        >
          {saveError && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-5">
              <h2 className="font-semibold text-red-900">
                Utility bill was not saved
              </h2>

              <p className="mt-1 text-sm text-red-800">
                {saveError}
              </p>
            </section>
          )}

          {saveMessage && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-semibold text-emerald-900">
                Provider bill saved
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                {saveMessage}
              </p>

              <p className="mt-2 text-sm text-emerald-700">
                It is listed as unpaid below. No provider
                payment transaction or settlement obligation
                is created until the bill is marked paid.
              </p>
            </section>
          )}
        </div>

        <section
          id="bills-to-pay"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="font-semibold text-slate-900">
              Bills to Pay
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Entered provider bills with calculated
              shares, waiting for an actual household
              payment.
            </p>
          </div>

          {providerBills.length === 0 ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">
                No unpaid provider bills right now.
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                New utility or internet bills saved as unpaid
                will appear here until someone marks them paid.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {providerBills.map(
                (providerBill) => (
                  <article
                    key={providerBill.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {providerBill.providerName ||
                            (providerBill.utilityType ===
                            "electricity"
                              ? "Electricity provider"
                              : providerBill.utilityType ===
                                "water"
                                ? "Water provider"
                                : "Internet provider")}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Due{" "}
                          {providerBill.dueDate.toLocaleDateString()}{" "}
                          ·{" "}
                          {providerBill.memberShareSnapshot.length}{" "}
                          member shares calculated
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(
                            providerBill.totalBillAmount
                          )}
                        </p>

                        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                          Unpaid
                        </p>
                      </div>
                    </div>

                    <ProviderBillPaymentControls
                      providerBillId={
                        providerBill.id
                      }
                      providerBill={
                        providerBill
                      }
                      paymentForm={getProviderPaymentForm(
                        providerBill.id
                      )}
                      memberNames={
                        memberNames
                      }
                      members={memberOptions}
                      accounts={accountOptions}
                      onChange={
                        updateProviderPaymentForm
                      }
                      onMarkPaid={
                        handleMarkProviderBillPaid
                      }
                      isMarkingPaid={
                        markingPaidProviderBillId ===
                        providerBill.id
                      }
                      onAttachReceipt={
                        handlePaymentReceiptChange
                      }
                      onRemoveReceipt={
                        handleRemovePaymentReceipt
                      }
                      onAttachBillFile={
                        handleBillAttachmentChange
                      }
                      onRemoveBillFile={
                        handleRemoveBillAttachment
                      }
                      onDeleteBill={
                        handleDeleteProviderBill
                      }
                    />
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {paidProviderBills.length > 0 && (
          <ProviderPaymentsSummary
            providerBills={paidProviderBills}
            memberNames={memberNames}
          />
        )}

        {memberOptions.length === 0 ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-semibold text-amber-900">
              No active household members
            </h2>

            <p className="mt-2 text-sm text-amber-800">
              Add or reactivate at least one household
              member before calculating a utility bill.
            </p>
          </section>
        ) : (
          <UtilityBillForm
            key={formKey}
            members={memberOptions}
            accounts={accountOptions}
            defaultDate={
              formatDateInput(
                parseMonthInput(
                  selectedMonthValue
                )
              )
            }
            submitLabel="Save Provider Bill"
            onSubmit={handleSave}
          />
        )}
      </div>
    </>
  );
}

function ProviderPaymentsSummary({
  providerBills,
  memberNames,
}: {
  providerBills: UtilityProviderBill[];
  memberNames: Record<string, string>;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">
          Provider Payments
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Paid provider bills with payment proof and linked
          transaction references.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">
                Paid Date
              </th>
              <th className="py-2 pr-3">
                Provider
              </th>
              <th className="py-2 pr-3">
                Paid By
              </th>
              <th className="py-2 pr-3 text-right">
                Amount
              </th>
              <th className="py-2 pr-3">
                Reference
              </th>
              <th className="py-2 pr-3">
                Proof
              </th>
              <th className="py-2">
                Transaction
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-slate-700">
            {providerBills.map(
              (providerBill) => (
                <tr key={providerBill.id}>
                  <td className="py-3 pr-3">
                    {providerBill.paidAt
                      ? providerBill.paidAt.toLocaleDateString()
                      : "Paid"}
                  </td>
                  <td className="py-3 pr-3 font-medium text-slate-900">
                    {providerBill.providerName ||
                      getProviderFallbackLabel(
                        providerBill
                      )}
                  </td>
                  <td className="py-3 pr-3">
                    {memberNames[
                      providerBill.paidByMemberId
                    ] ?? "Household member"}
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold text-slate-900">
                    {formatCurrency(
                      providerBill.totalBillAmount
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {providerBill.paymentReferenceNumber ||
                      "None"}
                  </td>
                  <td className="py-3 pr-3">
                    {providerBill.paymentAttachments
                      .length > 0
                      ? `${providerBill.paymentAttachments.length} receipt`
                      : "No receipt"}
                  </td>
                  <td className="py-3">
                    {providerBill.transactionId ||
                      "Created"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getProviderFallbackLabel(
  providerBill: UtilityProviderBill
): string {
  if (
    providerBill.utilityType ===
    "electricity"
  ) {
    return "Electricity provider";
  }

  if (
    providerBill.utilityType === "water"
  ) {
    return "Water provider";
  }

  return "Internet provider";
}

interface ProviderBillPaymentControlsProps {
  providerBillId: string;
  providerBill: UtilityProviderBill;
  paymentForm: ProviderPaymentForm;
  memberNames: Record<string, string>;
  members: {
    id: string;
    name: string;
  }[];
  accounts: {
    id: string;
    name: string;
    ownerMemberId: string;
  }[];
  onChange: (
    providerBillId: string,
    updates: Partial<ProviderPaymentForm>
  ) => void;
  onMarkPaid: (
    providerBillId: string
  ) => void | Promise<void>;
  isMarkingPaid?: boolean;
  onAttachReceipt: (
    providerBillId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onRemoveReceipt: (
    providerBillId: string,
    attachmentId: string
  ) => void;
  onAttachBillFile: (
    providerBill: UtilityProviderBill,
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onRemoveBillFile: (
    providerBill: UtilityProviderBill,
    attachmentId: string
  ) => void;
  onDeleteBill: (
    providerBill: UtilityProviderBill
  ) => void;
}

function ProviderBillPaymentControls({
  providerBillId,
  providerBill,
  paymentForm,
  memberNames,
  members,
  accounts,
  onChange,
  onMarkPaid,
  isMarkingPaid = false,
  onAttachReceipt,
  onRemoveReceipt,
  onAttachBillFile,
  onRemoveBillFile,
  onDeleteBill,
}: ProviderBillPaymentControlsProps) {
  const paymentAccounts =
    accounts.filter(
      (account) =>
        account.ownerMemberId ===
        paymentForm.paidByMemberId
    );

  return (
    <div className="mt-4 space-y-4">
      <ProviderBillShareBreakdown
        providerBill={providerBill}
        memberNames={memberNames}
      />

      <ProviderBillAttachmentControls
        providerBill={providerBill}
        onAttachBillFile={
          onAttachBillFile
        }
        onRemoveBillFile={
          onRemoveBillFile
        }
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <label className="text-sm font-medium text-slate-700">
          Paid By
          <select
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={paymentForm.paidByMemberId}
            onChange={(event) =>
              onChange(
                providerBillId,
                {
                  paidByMemberId:
                    event.target.value,
                  sourceAccountId: "",
                }
              )
            }
          >
            <option value="">
              Select payer
            </option>

            {members.map((member) => (
              <option
                key={member.id}
                value={member.id}
              >
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Account
          <select
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            value={
              paymentForm.sourceAccountId
            }
            disabled={
              !paymentForm.paidByMemberId
            }
            onChange={(event) =>
              onChange(
                providerBillId,
                {
                  sourceAccountId:
                    event.target.value,
                }
              )
            }
          >
            <option value="">
              {paymentForm.paidByMemberId
                ? "No account"
                : "Select payer first"}
            </option>

            {paymentAccounts.map(
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
        </label>

        <label className="text-sm font-medium text-slate-700">
          Payment Date
          <input
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            type="date"
            value={paymentForm.paidAt}
            onChange={(event) =>
              onChange(
                providerBillId,
                {
                  paidAt:
                    event.target.value,
                }
              )
            }
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Reference
          <input
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            type="text"
            value={
              paymentForm.referenceNumber
            }
            onChange={(event) =>
              onChange(
                providerBillId,
                {
                  referenceNumber:
                    event.target.value,
                }
              )
            }
            placeholder="Optional"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Receipt
          <input
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) =>
              onAttachReceipt(
                providerBillId,
                event
              )
            }
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            className="h-10 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() =>
              void onMarkPaid(
                providerBillId
              )
            }
            disabled={isMarkingPaid}
          >
            {isMarkingPaid
              ? "Marking..."
              : "Mark Paid"}
          </button>
        </div>

        {paymentForm.paymentAttachments.length >
          0 && (
          <div className="md:col-span-2 lg:col-span-6">
            <div className="flex flex-wrap gap-2">
              {paymentForm.paymentAttachments.map(
                (attachment) => (
                  <span
                    key={attachment.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {attachment.fileName}

                    <button
                      type="button"
                      className="font-semibold text-red-600"
                      onClick={() =>
                        onRemoveReceipt(
                          providerBillId,
                          attachment.id
                        )
                      }
                    >
                      Remove
                    </button>
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg border border-red-200 bg-background px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          onClick={() =>
            onDeleteBill(providerBill)
          }
        >
          Delete Unpaid Bill
        </button>
      </div>
    </div>
  );
}

function ProviderBillShareBreakdown({
  providerBill,
  memberNames,
}: {
  providerBill: UtilityProviderBill;
  memberNames: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">
          Calculated Shares
        </h4>

        <p className="text-sm font-semibold text-slate-900">
          {formatCurrency(
            providerBill.calculationSnapshot.totalMemberShares
          )}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">
                Member
              </th>
              <th className="py-2 pr-3 text-right">
                Direct
              </th>
              <th className="py-2 pr-3 text-right">
                Shared
              </th>
              <th className="py-2 text-right">
                Owes
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-slate-700">
            {providerBill.memberShareSnapshot.map(
              (share) => (
                <tr key={share.memberId}>
                  <td className="py-2 pr-3 font-medium text-slate-900">
                    {memberNames[
                      share.memberId
                    ] ?? "Household member"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatCurrency(
                      share.directUsageAmount
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatCurrency(
                      share.equalSharedAmount
                    )}
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900">
                    {formatCurrency(
                      share.finalShareAmount
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProviderBillAttachmentControls({
  providerBill,
  onAttachBillFile,
  onRemoveBillFile,
}: {
  providerBill: UtilityProviderBill;
  onAttachBillFile: (
    providerBill: UtilityProviderBill,
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onRemoveBillFile: (
    providerBill: UtilityProviderBill,
    attachmentId: string
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Provider Bill Files
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Replace a wrong bill file before marking this bill paid.
          </p>
        </div>

        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Add Bill File
          <input
            className="sr-only"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) =>
              onAttachBillFile(
                providerBill,
                event
              )
            }
          />
        </label>
      </div>

      {providerBill.billAttachments.length >
      0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {providerBill.billAttachments.map(
            (attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
              >
                {attachment.fileName}

                <button
                  type="button"
                  className="font-semibold text-red-600"
                  onClick={() =>
                    onRemoveBillFile(
                      providerBill,
                      attachment.id
                    )
                  }
                >
                  Remove
                </button>
              </span>
            )
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          No bill file attached yet.
        </p>
      )}
    </div>
  );
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
          resolve(reader.result);

          return;
        }

        reject(
          new Error(
            "File could not be read."
          )
        );
      };

      reader.onerror = () => {
        reject(
          reader.error ??
            new Error(
              "File could not be read."
            )
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

function createAttachmentId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `payment-receipt-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
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
