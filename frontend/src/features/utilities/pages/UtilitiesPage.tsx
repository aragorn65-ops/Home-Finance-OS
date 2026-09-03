import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import Input from "../../../shared/ui/Input";
import FormValidationAlert from "../../../shared/ui/FormValidationAlert";
import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";
import openAttachmentPreview, {
  hasAttachmentPreviewData,
} from "../../../shared/utils/openAttachmentPreview";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import {
  formatDateInput,
  isSameMonth,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import AccountService from "../../accounts/services/AccountService";
import {
  getAccountVisibilityLabel,
  isAccountVisibleForMember,
} from "../../accounts/services/accountVisibility";
import {
  useHouseholdMembership,
} from "../../auth";

import {
  loadHousehold,
} from "../../household/services/householdStorage";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import {
  createHouseholdMemberNameLookup,
} from "../../household/services/householdMemberResolution";

import UtilityBillForm from "../components/UtilityBillForm";

import type {
  UtilityBillForm as UtilityBillFormData,
} from "../models/UtilityBillForm";

import type {
  UtilityBillShareResult,
} from "../models/UtilityBillShareResult";

import UtilityProviderBillService from "../services/UtilityProviderBillService";
import {
  getProviderBillsPaidInMonth,
} from "../services/providerBillMonthFilters";
import TransactionService from "../../transactions/services/TransactionService";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";
import type {
  Transaction,
} from "../../transactions/models/Transaction";

interface ProviderPaymentForm {
  paidByMemberId: string;
  sourceAccountId: string;
  paidAt: string;
  referenceNumber: string;
  paymentAttachments: StoredAttachment[];
}

export default function UtilitiesPage() {
  const household =
    loadHousehold();
  const authHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    household?.id ??
    "";
  const {
    session,
    membership,
  } = useHouseholdMembership(
    authHouseholdId
  );
  const isReadOnlyMember =
    session.status === "signed-in" &&
    (
      membership?.role === "member" ||
      membership?.role === "viewer"
    );

  const {
    selectedMonthValue,
    setSelectedMonthValue,
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
  const signedInEmail =
    session.user?.email
      ?.trim()
      .toLowerCase();
  const signedInMember =
    activeMembers.find(
      (member) =>
        member.id ===
          membership?.memberId ||
        member.remoteMemberId ===
          membership?.memberId ||
        (
          signedInEmail &&
          member.email
            ?.trim()
            .toLowerCase() ===
            signedInEmail
        )
    );

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
    createHouseholdMemberNameLookup(
      activeMembers,
      household?.authenticatedLink
        ?.ownerMemberId
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
        visibility:
          account.visibility,
      })
    );
  const selectedMonth =
    parseMonthInput(
      selectedMonthValue
    );
  const paidProviderBillsForSelectedMonth =
    getProviderBillsPaidInMonth(
      paidProviderBills,
      selectedMonth
    );
  const providerBillTransactionIds =
    new Set(
      [
        ...providerBills,
        ...paidProviderBills,
      ]
        .map(
          (providerBill) =>
            providerBill.transactionId
        )
        .filter(Boolean)
    );
  const utilityTransactionsWithoutProviderBill =
    TransactionService
      .getActiveTransactions()
      .filter(
        (transaction) =>
          transaction.householdId ===
            household?.id &&
          isSameMonth(
            transaction.transactionDate,
            selectedMonth
          ) &&
          isUtilityTransaction(
            transaction
          ) &&
          !providerBillTransactionIds.has(
            transaction.id
          )
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
      paidByMemberId:
        signedInMember?.id ?? "",
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
    if (isReadOnlyMember) {
      return;
    }

    if (markingPaidProviderBillId) {
      return;
    }

    setSaveMessage("");
    setSaveError("");
    setMarkingPaidProviderBillId(
      providerBillId
    );

    const providerBill =
      providerBills.find(
        (bill) =>
          bill.id === providerBillId
      );
    const paymentForm =
      getProviderPaymentForm(
        providerBillId
      );

    if (
      providerBill &&
      !confirmProviderBillPaymentDate(
        providerBill,
        paymentForm.paidAt
      )
    ) {
      setMarkingPaidProviderBillId("");
      return;
    }

    const result =
      await UtilityProviderBillService.markPaid(
        providerBillId,
        paymentForm
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
    if (isReadOnlyMember) {
      event.target.value = "";
      return;
    }

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
    if (isReadOnlyMember) {
      return;
    }

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
    if (isReadOnlyMember) {
      event.target.value = "";
      return;
    }

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
    if (isReadOnlyMember) {
      return;
    }

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

  const handleDeleteProviderBill = async (
    providerBill: UtilityProviderBill
  ): Promise<void> => {
    if (isReadOnlyMember) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete unpaid provider bill "${providerBill.providerName || getProviderFallbackLabel(providerBill)}"? This does not affect transactions or settlements because the bill is not paid yet.`
      );

    if (!confirmed) {
      return;
    }

    const result =
      await UtilityProviderBillService.deleteUnpaid(
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

  const handleSave = async (
    form: UtilityBillFormData,
    calculation: UtilityBillShareResult
  ): Promise<void> => {
    if (isReadOnlyMember) {
      setSaveError(
        "Member access is read-only for utilities."
      );
      return;
    }

    setSaveMessage("");
    setSaveError("");

    const duplicateMatches =
      UtilityProviderBillService
        .findPotentialDuplicates(
          form
        );

    if (
      duplicateMatches.length > 0 &&
      !confirmDuplicateProviderBill(
        duplicateMatches
      )
    ) {
      setSaveMessage(
        "Provider bill was not saved because a possible duplicate was found."
      );
      return;
    }

    const result =
      await UtilityProviderBillService.createUnpaid(
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
        actions={
          <Input
            type="month"
            aria-label="Reporting month"
            value={selectedMonthValue}
            onChange={(event) =>
              setSelectedMonthValue(
                event.target.value
              )
            }
          />
        }
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
                      isReadOnly={
                        isReadOnlyMember
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

        {paidProviderBillsForSelectedMonth.length >
          0 && (
          <ProviderPaymentsSummary
            providerBills={
              paidProviderBillsForSelectedMonth
            }
            memberNames={memberNames}
          />
        )}

        {utilityTransactionsWithoutProviderBill.length >
          0 && (
          <TransactionOnlyUtilitySummary
            transactions={
              utilityTransactionsWithoutProviderBill
            }
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
        ) : isReadOnlyMember ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Utility Bill Entry
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Member access can review utility bills,
              calculated shares, and payment history.
              Recording new provider bills remains
              available to household admins.
            </p>
          </section>
        ) : (
          <UtilityBillForm
            key={formKey}
            members={memberOptions}
            accounts={accountOptions}
            defaultDate={
              formatDateInput(
                selectedMonth
              )
            }
            submitLabel="Save Unpaid Bill"
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
                    <AttachmentPreviewList
                      attachments={
                        providerBill
                          .paymentAttachments
                      }
                      emptyLabel="No receipt"
                    />
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

function TransactionOnlyUtilitySummary({
  transactions,
  memberNames,
}: {
  transactions: Transaction[];
  memberNames: Record<string, string>;
}) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div>
        <h2 className="font-semibold text-amber-900">
          Utility Transactions Without Provider Bills
        </h2>

        <p className="mt-1 text-sm text-amber-800">
          These utility expenses are in Transactions but do
          not have a linked Utilities provider-bill record.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-amber-700">
            <tr>
              <th className="py-2 pr-3">
                Date
              </th>
              <th className="py-2 pr-3">
                Utility
              </th>
              <th className="py-2 pr-3">
                Paid By
              </th>
              <th className="py-2 pr-3 text-right">
                Amount
              </th>
              <th className="py-2">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-amber-200 text-amber-950">
            {transactions.map(
              (transaction) => (
                <tr key={transaction.id}>
                  <td className="py-3 pr-3">
                    {transaction.transactionDate.toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-3 font-medium">
                    {transaction.description ||
                      transaction.category}
                  </td>
                  <td className="py-3 pr-3">
                    {transaction.paidByMemberId
                      ? memberNames[
                          transaction
                            .paidByMemberId
                        ] ?? "Household member"
                      : "Not recorded"}
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold">
                    {formatCurrency(
                      transaction.amount
                    )}
                  </td>
                  <td className="py-3">
                    Transaction only
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

function isUtilityTransaction(
  transaction: Transaction
): boolean {
  if (
    transaction.type !== "expense"
  ) {
    return false;
  }

  const category =
    transaction.category
      .trim()
      .toLowerCase();

  return (
    category === "electricity" ||
    category === "water" ||
    category === "internet"
  );
}

function confirmDuplicateProviderBill(
  matches: ReturnType<
    typeof UtilityProviderBillService.findPotentialDuplicates
  >
): boolean {
  const matchLines =
    matches
      .slice(0, 3)
      .map((match) => {
        const providerBill =
          match.providerBill;

        return [
          providerBill.providerName ||
            getProviderFallbackLabel(
              providerBill
            ),
          getMonthLabel(
            providerBill.billingDate
          ),
          formatCurrency(
            providerBill.totalBillAmount
          ),
          providerBill.status,
        ].join(" - ");
      })
      .join("\n");

  return window.confirm(
    [
      "Possible duplicate utility bill found.",
      "",
      matchLines,
      "",
      "Cancel to review the existing bill. OK to save anyway.",
    ].join("\n")
  );
}

function confirmProviderBillPaymentDate(
  providerBill: UtilityProviderBill,
  paidAt: string
): boolean {
  const paymentDate =
    parseDateInput(paidAt);

  if (
    Number.isNaN(
      paymentDate.getTime()
    ) ||
    isSameMonth(
      providerBill.billingDate,
      paymentDate
    )
  ) {
    return true;
  }

  return window.confirm(
    [
      "Payment date month differs from the bill month.",
      "",
      `Bill month: ${getMonthLabel(providerBill.billingDate)}`,
      `Payment month: ${getMonthLabel(paymentDate)}`,
      "",
      "Cancel to fix the date. OK to mark paid anyway.",
    ].join("\n")
  );
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
    visibility: "household" | "private";
  }[];
  onChange: (
    providerBillId: string,
    updates: Partial<ProviderPaymentForm>
  ) => void;
  onMarkPaid: (
    providerBillId: string
  ) => void | Promise<void>;
  isMarkingPaid?: boolean;
  isReadOnly?: boolean;
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
  isReadOnly = false,
  onAttachReceipt,
  onRemoveReceipt,
  onAttachBillFile,
  onRemoveBillFile,
  onDeleteBill,
}: ProviderBillPaymentControlsProps) {
  const paymentAccounts =
    accounts.filter(
      (account) =>
        isAccountVisibleForMember(
          account,
          paymentForm.paidByMemberId
        )
    );

  return (
    <div className="mt-4 space-y-4">
      <ProviderBillShareBreakdown
        providerBill={providerBill}
        memberNames={memberNames}
      />

      <ProviderBillAttachmentControls
        providerBill={providerBill}
        isReadOnly={isReadOnly}
        onAttachBillFile={
          onAttachBillFile
        }
        onRemoveBillFile={
          onRemoveBillFile
        }
      />

      {!isReadOnly && (
      <>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Record Payment
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Use this when the saved bill has actually been
          paid. Marking paid creates the utility
          transaction and settlement balances.
        </p>
      </div>

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
                  {account.name} -{" "}
                  {getAccountVisibilityLabel(
                    account
                  )}
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
              : "Mark Bill Paid"}
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

                    <AttachmentPreviewButton
                      attachment={
                        attachment
                      }
                    />

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
      </>
      )}
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
  isReadOnly = false,
  onAttachBillFile,
  onRemoveBillFile,
}: {
  providerBill: UtilityProviderBill;
  isReadOnly?: boolean;
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
            Review provider bill files recorded for this bill.
          </p>
        </div>

        {!isReadOnly && (
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
        )}
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

                <AttachmentPreviewButton
                  attachment={attachment}
                />

                {!isReadOnly && (
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
                )}
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

function AttachmentPreviewList({
  attachments,
  emptyLabel,
}: {
  attachments: StoredAttachment[];
  emptyLabel: string;
}) {
  if (attachments.length === 0) {
    return (
      <span>{emptyLabel}</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map(
        (attachment) => (
          <span
            key={attachment.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
          >
            {attachment.fileName}

            <AttachmentPreviewButton
              attachment={attachment}
            />
          </span>
        )
      )}
    </div>
  );
}

function AttachmentPreviewButton({
  attachment,
}: {
  attachment: StoredAttachment;
}) {
  const canPreview =
    hasAttachmentPreviewData(
      attachment
    );

  if (!canPreview) {
    return (
      <span className="font-medium text-slate-400">
        Preview unavailable in cloud beta
      </span>
    );
  }

  return (
    <button
      type="button"
      className="font-semibold text-blue-700 hover:text-blue-900"
      onClick={() =>
        openAttachmentPreview(
          attachment
        )
      }
    >
      View
    </button>
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

function parseDateInput(
  value: string
): Date {
  const date =
    new Date(`${value}T00:00:00`);

  return Number.isNaN(
    date.getTime()
  )
    ? new Date("")
    : date;
}

function getMonthLabel(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
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
