import {
  useState,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";

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
  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    saveError,
    setSaveError,
  ] = useState("");

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
      })
    );

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

      return;
    }

    setSaveMessage(
      result.message ??
        "Utility bill saved successfully."
    );
  };

  return (
    <>
      <PageHeader
        title="Utilities"
        subtitle="Calculate and save electricity or water bill shares."
      />

      <div className="space-y-6">
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            Bill Share Calculator
          </h2>

          <p className="mt-1 text-sm text-blue-800">
            Enter the total provider bill, rate per unit,
            direct member usage, and fixed compensation.
            The remaining bill is divided equally among
            the selected members.
          </p>
        </section>

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
            members={memberOptions}
            accounts={accountOptions}
            submitLabel="Save Utility Bill"
            onSubmit={handleSave}
          />
        )}
      </div>
    </>
  );
}