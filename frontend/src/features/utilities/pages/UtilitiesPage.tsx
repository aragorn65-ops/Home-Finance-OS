import {
  useRef,
  useState,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import FormValidationAlert from "../../../shared/ui/FormValidationAlert";
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
        subtitle="Calculate and save electricity or water bill shares."
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

        {providerBills.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
                              : "Water provider")}
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
                  </article>
                )
              )}
            </div>
          </section>
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
