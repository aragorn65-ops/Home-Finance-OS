import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type { Account } from "../../accounts/models/Account";

import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type {
  OperationResult,
} from "../../../shared/types";
import CurrencyInput from "../../../shared/ui/CurrencyInput";
import FormValidationAlert from "../../../shared/ui/FormValidationAlert";
import formatCurrency from "../../../shared/utils/formatCurrency";

import type { Settlement } from "../models/Settlement";

import type { SettlementAllocationOption } from "../models/SettlementAllocationOption";

import type { SettlementApplicationForm } from "../models/SettlementApplicationForm";

import {
  defaultSettlementForm,
  type SettlementForm as SettlementFormData,
} from "../models/SettlementForm";

type SettlementFormProps = {
  householdId: string;

  accounts: Account[];
  members: HouseholdMember[];
  currency?: string;

  allocationOptions:
    SettlementAllocationOption[];

  initialValues?: SettlementFormData;
  submitLabel?: string;

  onSubmit: (
    form: SettlementFormData
  ) => OperationResult<Settlement>;

  onCancel?: () => void;
};

const settlementFieldLabels:
  Record<string, string> = {
    general: "General",
    householdId: "Household",
    fromMemberId: "Paying Member",
    toMemberId: "Receiving Member",
    amount: "Settlement Amount",
    settlementDate: "Settlement Date",
    sourceAccountId: "Source Account",
    destinationAccountId:
      "Destination Account",
    applicationMethod:
      "Application Method",
    applications:
      "Settlement Applications",
    referenceNumber: "Reference Number",
    notes: "Notes",
    isActive: "Active settlement",
  };

function getTodayInputValue(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function generateSettlementReference(
  date: Date = new Date()
): string {
  const timestamp =
    [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(date.getDate()).padStart(
        2,
        "0"
      ),
      "-",
      String(date.getHours()).padStart(
        2,
        "0"
      ),
      String(date.getMinutes()).padStart(
        2,
        "0"
      ),
      String(date.getSeconds()).padStart(
        2,
        "0"
      ),
    ].join("");

  return `SET-${timestamp}`;
}

function getDefaultFormValues(
  householdId: string,
  members: HouseholdMember[]
): SettlementFormData {
  const owner =
    members.find(
      (member) =>
        member.role === "owner"
    );

  const defaultFromMemberId =
    owner?.id ??
    members[0]?.id ??
    "";

  const defaultToMemberId =
    members.find(
      (member) =>
        member.id !==
        defaultFromMemberId
    )?.id ?? "";

  return {
    ...defaultSettlementForm,

    householdId,

    fromMemberId:
      defaultFromMemberId,

    toMemberId:
      defaultToMemberId,

    settlementDate:
      getTodayInputValue(),

    referenceNumber:
      generateSettlementReference(),
  };
}

function formatAmount(
  amount: number,
  currency?: string
): string {
  return formatCurrency(
    amount,
    currency
  );
}

function getPaymentStatusLabel(
  status:
    SettlementAllocationOption["paymentStatus"]
): string {
  switch (status) {
    case "unpaid":
      return "Unpaid";

    case "partially-paid":
      return "Partially Paid";

    case "paid":
      return "Paid";

    default:
      return "Unpaid";
  }
}

function createApplicationForms(
  options: SettlementAllocationOption[],
  currentApplications:
    SettlementApplicationForm[] = []
): SettlementApplicationForm[] {
  return options.map((option) => {
    const existing =
      currentApplications.find(
        (application) =>
          application.expenseAllocationId ===
          option.expenseAllocationId
      );

    return (
      existing ?? {
        expenseAllocationId:
          option.expenseAllocationId,

        isSelected: false,
        appliedAmount: 0,
      }
    );
  });
}

export default function SettlementForm({
  householdId,

  accounts,
  members,
  currency,

  allocationOptions,

  initialValues,
  submitLabel = "Save Settlement",

  onSubmit,
  onCancel,
}: SettlementFormProps) {
  const activeMembers =
    useMemo(
      () =>
        members.filter(
          (member) =>
            member.isActive &&
            member.householdId ===
              householdId
        ),
      [
        members,
        householdId,
      ]
    );

  const [form, setForm] =
    useState<SettlementFormData>(
      initialValues ??
        getDefaultFormValues(
          householdId,
          activeMembers
        )
    );

  const [errors, setErrors] =
    useState<
      Record<string, string>
    >({});

  const [message, setMessage] =
    useState("");

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

  const showValidationAlert = (
    nextErrors:
      Record<string, string> | undefined,
    fallbackMessage =
      "Please correct the highlighted fields."
  ) => {
    const visibleErrors =
      nextErrors &&
      Object.keys(nextErrors).length >
        0
        ? nextErrors
        : {
            general:
              fallbackMessage,
          };

    setValidationAlertErrors(
      visibleErrors
    );

    setIsValidationAlertOpen(
      true
    );
  };

  useEffect(() => {
    const nextForm =
      initialValues
        ? {
            ...initialValues,

            householdId,

            applications:
              initialValues.applicationMethod ===
              "manual"
                ? createApplicationForms(
                    allocationOptions.filter(
                      (option) =>
                        option.fromMemberId ===
                          initialValues.fromMemberId &&
                        option.toMemberId ===
                          initialValues.toMemberId
                    ),
                    initialValues.applications
                  )
                : [],
          }
        : getDefaultFormValues(
            householdId,
            activeMembers
          );

    setForm(nextForm);
    setErrors({});
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setMessage("");
  }, [
    initialValues,
    householdId,
    activeMembers,
    allocationOptions,
  ]);

  const eligibleAllocationOptions =
    useMemo(() => {
      if (
        !form.fromMemberId ||
        !form.toMemberId ||
        form.fromMemberId ===
          form.toMemberId
      ) {
        return [];
      }

      return allocationOptions.filter(
        (option) =>
          option.fromMemberId ===
            form.fromMemberId &&
          option.toMemberId ===
            form.toMemberId
      );
    }, [
      allocationOptions,
      form.fromMemberId,
      form.toMemberId,
    ]);

  const sourceAccounts =
    useMemo(() => {
      if (!form.fromMemberId) {
        return [];
      }

      return accounts.filter(
        (account) =>
          account.isActive &&
          account.householdId ===
            householdId &&
          account.ownerMemberId ===
            form.fromMemberId
      );
    }, [
      accounts,
      householdId,
      form.fromMemberId,
    ]);

  const destinationAccounts =
    useMemo(() => {
      if (!form.toMemberId) {
        return [];
      }

      return accounts.filter(
        (account) =>
          account.isActive &&
          account.householdId ===
            householdId &&
          account.ownerMemberId ===
            form.toMemberId
      );
    }, [
      accounts,
      householdId,
      form.toMemberId,
    ]);

  const totalOutstanding =
    useMemo(() => {
      const total =
        eligibleAllocationOptions.reduce(
          (
            currentTotal,
            option
          ) =>
            currentTotal +
            option.outstandingAmount,
          0
        );

      return (
        Math.round(total * 100) /
        100
      );
    }, [
      eligibleAllocationOptions,
    ]);

  const manualApplicationTotal =
    useMemo(() => {
      const total =
        form.applications.reduce(
          (
            currentTotal,
            application
          ) =>
            currentTotal +
            (
              application.isSelected
                ? application.appliedAmount
                : 0
            ),
          0
        );

      return (
        Math.round(total * 100) /
        100
      );
    }, [
      form.applications,
    ]);

  const clearErrors = (
    fields: string[]
  ) => {
    setErrors((current) => {
      const nextErrors = {
        ...current,
      };

      fields.forEach((field) => {
        delete nextErrors[field];
      });

      return nextErrors;
    });

    setMessage("");
    setIsValidationAlertOpen(false);
  };

  const updateField = <
    Field extends keyof SettlementFormData,
  >(
    field: Field,
    value:
      SettlementFormData[Field]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    clearErrors([
      field,
    ]);
  };

  const handleAmountChange = (
    amount: number
  ) => {
    updateField(
      "amount",
      amount
    );
  };

  const handleFromMemberChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const fromMemberId =
      event.target.value;

    setForm((current) => {
      const sourceAccount =
        accounts.find(
          (account) =>
            account.id ===
            current.sourceAccountId
        );

      const shouldClearSource =
        Boolean(
          sourceAccount &&
          (
            !sourceAccount.isActive ||
            sourceAccount.householdId !==
              householdId ||
            sourceAccount.ownerMemberId !==
              fromMemberId
          )
        );

      return {
        ...current,

        fromMemberId,

        toMemberId:
          current.toMemberId ===
          fromMemberId
            ? ""
            : current.toMemberId,

        sourceAccountId:
          shouldClearSource
            ? ""
            : current.sourceAccountId,

        applications: [],
      };
    });

    clearErrors([
      "fromMemberId",
      "toMemberId",
      "sourceAccountId",
      "applications",
      "amount",
    ]);
  };

  const handleToMemberChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const toMemberId =
      event.target.value;

    setForm((current) => {
      const destinationAccount =
        accounts.find(
          (account) =>
            account.id ===
            current.destinationAccountId
        );

      const shouldClearDestination =
        Boolean(
          destinationAccount &&
          (
            !destinationAccount.isActive ||
            destinationAccount.householdId !==
              householdId ||
            destinationAccount.ownerMemberId !==
              toMemberId
          )
        );

      return {
        ...current,

        toMemberId,

        fromMemberId:
          current.fromMemberId ===
          toMemberId
            ? ""
            : current.fromMemberId,

        destinationAccountId:
          shouldClearDestination
            ? ""
            : current
                .destinationAccountId,

        applications: [],
      };
    });

    clearErrors([
      "fromMemberId",
      "toMemberId",
      "destinationAccountId",
      "applications",
      "amount",
    ]);
  };

  const handleApplicationMethodChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const applicationMethod =
      event.target
        .value as SettlementFormData[
          "applicationMethod"
        ];

    setForm((current) => ({
      ...current,

      applicationMethod,

      applications:
        applicationMethod ===
        "manual"
          ? createApplicationForms(
              eligibleAllocationOptions,
              current.applications
            )
          : [],
    }));

    clearErrors([
      "applicationMethod",
      "applications",
    ]);
  };

  const updateApplication = (
    expenseAllocationId: string,
    changes:
      Partial<
        SettlementApplicationForm
      >
  ) => {
    setForm((current) => ({
      ...current,

      applications:
        createApplicationForms(
          eligibleAllocationOptions,
          current.applications
        ).map((application) =>
          application.expenseAllocationId ===
          expenseAllocationId
            ? {
                ...application,
                ...changes,
              }
            : application
        ),
    }));

    clearErrors([
      "applications",
    ]);
  };

  const handleApplicationSelection = (
    option: SettlementAllocationOption,
    isSelected: boolean
  ) => {
    updateApplication(
      option.expenseAllocationId,
      {
        isSelected,
        appliedAmount:
          isSelected
            ? option.outstandingAmount
            : 0,
      }
    );
  };

  const handleApplicationAmountChange = (
    expenseAllocationId: string,
    amount: number
  ) => {
    updateApplication(
      expenseAllocationId,
      {
        appliedAmount:
          amount,
      }
    );
  };

  const handleApplyFullOutstanding = (
    option:
      SettlementAllocationOption
  ) => {
    updateApplication(
      option.expenseAllocationId,
      {
        isSelected: true,

        appliedAmount:
          option.outstandingAmount,
      }
    );
  };

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const submissionForm:
      SettlementFormData = {
        ...form,

        householdId,

        applications:
          form.applicationMethod ===
          "manual"
            ? createApplicationForms(
                eligibleAllocationOptions,
                form.applications
              )
            : [],
      };

    const result =
      onSubmit(
        submissionForm
      );

    if (!result.success) {
      setErrors(
        result.errors ?? {}
      );

      setMessage(
        result.message ??
          "Unable to save the settlement."
      );

      showValidationAlert(
        result.errors,
        result.message ??
          "Unable to save the settlement."
      );

      return;
    }

    setErrors({});
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setMessage(
      result.message ?? ""
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border bg-white p-6"
    >
      <FormValidationAlert
        open={isValidationAlertOpen}
        errors={validationAlertErrors}
        fieldLabels={
          settlementFieldLabels
        }
        onClose={() =>
          setIsValidationAlertOpen(
            false
          )
        }
      />

      {message && (
        <div
          className={
            Object.keys(errors).length >
            0
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

      {errors.householdId && (
        <p className="text-sm text-destructive">
          {errors.householdId}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="settlement-from-member"
            className="text-sm font-medium text-foreground"
          >
            Paying Member
          </label>

          <select
            id="settlement-from-member"
            value={form.fromMemberId}
            onChange={
              handleFromMemberChange
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select paying member
            </option>

            {activeMembers.map(
              (member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.displayName}
                </option>
              )
            )}
          </select>

          {errors.fromMemberId && (
            <p className="text-sm text-destructive">
              {errors.fromMemberId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settlement-to-member"
            className="text-sm font-medium text-foreground"
          >
            Receiving Member
          </label>

          <select
            id="settlement-to-member"
            value={form.toMemberId}
            onChange={
              handleToMemberChange
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">
              Select receiving member
            </option>

            {activeMembers.map(
              (member) => (
                <option
                  key={member.id}
                  value={member.id}
                >
                  {member.displayName}
                </option>
              )
            )}
          </select>

          {errors.toMemberId && (
            <p className="text-sm text-destructive">
              {errors.toMemberId}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Outstanding Between Members
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Based on active unpaid and partially paid
              expense allocations.
            </p>
          </div>

          <p className="text-xl font-semibold text-foreground">
            {formatAmount(
              totalOutstanding,
              currency
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <CurrencyInput
            id="settlement-amount"
            label="Settlement Amount"
            min="0"
            value={
              form.amount
            }
            onValueChange={
              handleAmountChange
            }
            error={errors.amount}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settlement-date"
            className="text-sm font-medium text-foreground"
          >
            Settlement Date
          </label>

          <input
            id="settlement-date"
            type="date"
            value={
              form.settlementDate
            }
            onChange={(event) =>
              updateField(
                "settlementDate",
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />

          {errors.settlementDate && (
            <p className="text-sm text-destructive">
              {errors.settlementDate}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="settlement-source-account"
            className="text-sm font-medium text-foreground"
          >
            Source Account
          </label>

          <select
            id="settlement-source-account"
            value={
              form.sourceAccountId
            }
            disabled={
              !form.fromMemberId
            }
            onChange={(event) =>
              updateField(
                "sourceAccountId",
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {form.fromMemberId
                ? "No linked source account"
                : "Select paying member first"}
            </option>

            {sourceAccounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                  {account.visibility ===
                  "private"
                    ? " — Private"
                    : ""}
                </option>
              )
            )}
          </select>

          <p className="text-xs text-muted-foreground">
            Optional account used by the paying member.
          </p>

          {errors.sourceAccountId && (
            <p className="text-sm text-destructive">
              {errors.sourceAccountId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settlement-destination-account"
            className="text-sm font-medium text-foreground"
          >
            Destination Account
          </label>

          <select
            id="settlement-destination-account"
            value={
              form.destinationAccountId
            }
            disabled={
              !form.toMemberId
            }
            onChange={(event) =>
              updateField(
                "destinationAccountId",
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {form.toMemberId
                ? "No linked destination account"
                : "Select receiving member first"}
            </option>

            {destinationAccounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                  disabled={
                    account.id ===
                    form.sourceAccountId
                  }
                >
                  {account.name}
                  {account.visibility ===
                  "private"
                    ? " — Private"
                    : ""}
                </option>
              )
            )}
          </select>

          <p className="text-xs text-muted-foreground">
            Optional account used by the receiving member.
          </p>

          {errors.destinationAccountId && (
            <p className="text-sm text-destructive">
              {errors.destinationAccountId}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <h3 className="font-medium text-foreground">
            Settlement Applications
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose how the payment should be applied to
            outstanding expense allocations.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settlement-application-method"
            className="text-sm font-medium text-foreground"
          >
            Application Method
          </label>

          <select
            id="settlement-application-method"
            value={
              form.applicationMethod
            }
            onChange={
              handleApplicationMethodChange
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="oldest-first">
              Oldest First
            </option>

            <option value="manual">
              Manual
            </option>
          </select>

          {errors.applicationMethod && (
            <p className="text-sm text-destructive">
              {errors.applicationMethod}
            </p>
          )}

          {form.applicationMethod ===
            "manual" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Selected application subtotal
              </span>

              <span className="font-semibold text-foreground">
                {formatAmount(
                  manualApplicationTotal,
                  currency
                )}
                {" / "}
                {formatAmount(
                  form.amount,
                  currency
                )}
              </span>
            </div>
          )}
        </div>

        {eligibleAllocationOptions.length ===
        0 ? (
          <div className="rounded-md border border-dashed p-5 text-center">
            <p className="font-medium text-foreground">
              No outstanding allocations
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Select a debtor and creditor with an
              outstanding reimbursement balance.
            </p>
          </div>
        ) : form.applicationMethod ===
          "oldest-first" ? (
          <div className="space-y-3">
            <div className="rounded-md bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              The settlement will be applied to the oldest
              eligible allocations first until the full
              payment amount is used.
            </div>

            {eligibleAllocationOptions.map(
              (option) => (
                <div
                  key={
                    option.expenseAllocationId
                  }
                  className="rounded-md border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {option.description}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.category}
                        {" · "}
                        {option.transactionDate
                          .toLocaleDateString()}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          getPaymentStatusLabel(
                            option.paymentStatus
                          )
                        }
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Outstanding
                      </p>

                      <p className="font-semibold text-foreground">
                        {formatAmount(
                          option.outstandingAmount,
                          currency
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {eligibleAllocationOptions.map(
              (option) => {
                const application =
                  form.applications.find(
                    (item) =>
                      item.expenseAllocationId ===
                      option.expenseAllocationId
                  ) ?? {
                    expenseAllocationId:
                      option.expenseAllocationId,

                    isSelected: false,
                    appliedAmount: 0,
                  };

                return (
                  <div
                    key={
                      option.expenseAllocationId
                    }
                    className="rounded-md border p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={
                                application.isSelected
                              }
                              onChange={(event) =>
                                handleApplicationSelection(
                                  option,
                                  event.target.checked
                                )
                              }
                              className="mt-1 h-4 w-4 rounded border"
                            />

                            <span>
                              <span className="block font-medium text-foreground">
                                {option.description}
                              </span>

                              <span className="mt-1 block text-sm text-muted-foreground">
                                {option.category}
                                {" · "}
                                {option.transactionDate
                                  .toLocaleDateString()}
                              </span>
                            </span>
                          </label>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Outstanding
                          </p>

                          <p className="font-semibold text-foreground">
                            {formatAmount(
                              option.outstandingAmount,
                              currency
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-muted-foreground">
                            Original
                          </p>

                          <p className="font-medium text-foreground">
                            {formatAmount(
                              option.allocatedAmount,
                              currency
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            Paid
                          </p>

                          <p className="font-medium text-foreground">
                            {formatAmount(
                              option.paidAmount,
                              currency
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">
                            Status
                          </p>

                          <p className="font-medium text-foreground">
                            {
                              getPaymentStatusLabel(
                                option.paymentStatus
                              )
                            }
                          </p>
                        </div>
                      </div>

                      {application.isSelected && (
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <div>
                            <CurrencyInput
                              id={`settlement-application-${option.expenseAllocationId}`}
                              label="Applied Amount"
                              min="0"
                              max={
                                option.outstandingAmount
                              }
                              value={
                                application.appliedAmount
                              }
                              onValueChange={(nextValue) =>
                                handleApplicationAmountChange(
                                  option.expenseAllocationId,
                                  nextValue
                                )
                              }
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleApplyFullOutstanding(
                                option
                              )
                            }
                            className="rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            Apply Full
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Manual Application Total
              </span>

              <span className="font-semibold text-foreground">
                {formatAmount(
                  manualApplicationTotal,
                  currency
                )}
                {" / "}
                {formatAmount(
                  form.amount,
                  currency
                )}
              </span>
            </div>
          </div>
        )}

        {errors.applications && (
          <p className="text-sm text-destructive">
            {errors.applications}
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="settlement-reference"
            className="text-sm font-medium text-foreground"
          >
            Reference Number
          </label>

          <input
            id="settlement-reference"
            type="text"
            value={
              form.referenceNumber
            }
            onChange={(event) =>
              updateField(
                "referenceNumber",
                event.target.value
              )
            }
            placeholder="Optional payment reference"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="settlement-status"
            className="text-sm font-medium text-foreground"
          >
            Status
          </label>

          <label
            id="settlement-status"
            className="flex min-h-10 items-center gap-3 rounded-md border bg-background px-3 py-2"
          >
            <input
              type="checkbox"
              checked={
                form.isActive
              }
              onChange={(event) =>
                updateField(
                  "isActive",
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border"
            />

            <span className="text-sm text-foreground">
              Active settlement
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settlement-notes"
          className="text-sm font-medium text-foreground"
        >
          Notes
        </label>

        <textarea
          id="settlement-notes"
          rows={4}
          value={form.notes}
          onChange={(event) =>
            updateField(
              "notes",
              event.target.value
            )
          }
          placeholder="Optional settlement notes"
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
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
