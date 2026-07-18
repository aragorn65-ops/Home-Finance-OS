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

import UtilityBillPersistenceService from "../services/UtilityBillPersistenceService";

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
      UtilityBillPersistenceService.save(
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
        "Utility bill saved successfully."
    );
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);

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
            Bill Share Calculator
          </h2>

          <p className="mt-1 text-sm text-blue-800">
            Enter the total provider bill, usage basis,
            direct member usage, and fixed compensation.
            The remaining bill is divided equally among
            the selected members.
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
                Utility bill saved
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                {saveMessage}
              </p>

              <p className="mt-2 text-sm text-emerald-700">
                The expense is now available in Transactions,
                and its member allocations are available to
                Settlements.
              </p>
            </section>
          )}
        </div>

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
            submitLabel="Save Utility Bill"
            onSubmit={handleSave}
          />
        )}
      </div>
    </>
  );
}
